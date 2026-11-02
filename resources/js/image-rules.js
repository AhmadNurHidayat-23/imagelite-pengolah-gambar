export const MAX_FILE_SIZE = 20 * 1024 * 1024;
export const MAX_EDGE = 8192;
export const MAX_PIXELS = 16_000_000;
export const FORMATS = { 'image/jpeg': 'JPEG', 'image/png': 'PNG', 'image/webp': 'WebP' };

export function validateFile(file) {
    if (!file || !file.size) throw new Error('Pilih file gambar yang tidak kosong.');
    if (file.size > MAX_FILE_SIZE) throw new Error('Ukuran gambar melebihi 20 MB. Pilih gambar yang lebih kecil.');
    if (file.type && !FORMATS[file.type]) throw new Error('Format tidak didukung. Gunakan JPEG, PNG, atau WebP.');
}

export function validateDimensions(width, height) {
    if (![width, height].every(value => Number.isInteger(value) && value >= 1 && value <= MAX_EDGE)) {
        throw new Error('Lebar dan tinggi harus berupa bilangan bulat antara 1 dan 8.192 piksel.');
    }
    if (width * height > MAX_PIXELS) throw new Error('Resolusi terlalu besar. Gunakan gambar dengan total maksimal 16 megapiksel.');
}

export function validateSettings({ width, height, quality, type }) {
    validateDimensions(width, height);
    if (!FORMATS[type]) throw new Error('Pilih format hasil yang didukung.');
    if (!Number.isInteger(quality) || quality < 10 || quality > 100) throw new Error('Kualitas harus antara 10% dan 100%.');
}

export function proportionalSize(value, originalValue, otherOriginalValue) {
    if (!Number.isInteger(value) || value < 1) return '';
    return Math.max(1, Math.round(value * otherOriginalValue / originalValue));
}

export function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    const unit = bytes < 1024 * 1024 ? 'KB' : 'MB';
    const size = bytes / (unit === 'KB' ? 1024 : 1024 * 1024);
    return `${size.toLocaleString('id-ID', { maximumFractionDigits: 2 })} ${unit}`;
}

export function sizeChange(originalSize, resultSize) {
    const difference = resultSize - originalSize;
    if (!difference) return 'Ukuran file tidak berubah.';
    const percent = (Math.abs(difference) / originalSize * 100).toLocaleString('id-ID', { maximumFractionDigits: 1 });
    return `${percent}% lebih ${difference < 0 ? 'kecil' : 'besar'} dari gambar asli.`;
}

export function outputFilename(name, type) {
    const base = name.replace(/\.[^.]+$/, '').replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-').slice(0, 120) || 'gambar';
    return `${base}-imagelite.${{ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[type]}`;
}

// Baca dimensi sebelum decoding agar file kecil dengan resolusi ekstrem ditolak lebih awal.
export function readImageHeader(buffer) {
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);
    const text = (offset, size) => String.fromCharCode(...bytes.subarray(offset, offset + size));
    const u24 = offset => bytes[offset] + (bytes[offset + 1] << 8) + (bytes[offset + 2] << 16);
    let info;
    if (bytes.length >= 24 && bytes[0] === 137 && text(1, 7) === 'PNG\r\n\x1a\n' && text(12, 4) === 'IHDR') {
        info = { type: 'image/png', width: view.getUint32(16), height: view.getUint32(20) };
    } else if (bytes.length >= 12 && text(0, 4) === 'RIFF' && text(8, 4) === 'WEBP') {
        for (let offset = 12; offset + 8 <= bytes.length;) {
            const chunk = text(offset, 4), length = view.getUint32(offset + 4, true), data = offset + 8;
            if (data + length > bytes.length) break;
            if (chunk === 'VP8X' && length >= 10) {
                info = { type: 'image/webp', width: 1 + u24(data + 4), height: 1 + u24(data + 7) };
            } else if (chunk === 'VP8 ' && length >= 10 && text(data + 3, 3) === '\x9d\x01\x2a') {
                info = { type: 'image/webp', width: view.getUint16(data + 6, true) & 0x3fff, height: view.getUint16(data + 8, true) & 0x3fff };
            } else if (chunk === 'VP8L' && length >= 5 && bytes[data] === 0x2f) {
                const bits = view.getUint32(data + 1, true);
                info = { type: 'image/webp', width: 1 + (bits & 0x3fff), height: 1 + ((bits >>> 14) & 0x3fff) };
            }
            if (info) break;
            offset = data + length + (length % 2);
        }
    } else if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
        let offset = 2;
        while (offset + 4 <= bytes.length) {
            if (bytes[offset++] !== 0xff) break;
            while (bytes[offset] === 0xff) offset++;
            const marker = bytes[offset++];
            if (marker === 0xda || marker === 0xd9) break;
            if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)) continue;
            if (offset + 2 > bytes.length) break;
            const length = view.getUint16(offset);
            if (length < 2 || offset + length > bytes.length) break;
            if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker) && length >= 7) {
                info = { type: 'image/jpeg', height: view.getUint16(offset + 3), width: view.getUint16(offset + 5) };
                break;
            }
            offset += length;
        }
    }
    if (!info) throw new Error('File tidak dikenali atau rusak. Gunakan gambar JPEG, PNG, atau WebP yang valid.');
    validateDimensions(info.width, info.height);
    return info;
}
