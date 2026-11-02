import { FORMATS, readImageHeader, validateDimensions, validateFile, validateSettings } from './image-rules.js';

export function encodeCanvas(canvas, type, quality = 80) {
    return new Promise((resolve, reject) => {
        canvas.toBlob(blob => {
            if (!blob) reject(new Error('Gambar gagal dibuat. Kurangi dimensi lalu coba lagi.'));
            else if (blob.type !== type) reject(new Error(`Browser ini tidak mendukung hasil ${FORMATS[type] || 'dengan format tersebut'}. Pilih format lain.`));
            else resolve(blob);
        }, type, type === 'image/png' ? undefined : quality / 100);
    });
}

export async function supportedFormats() {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const supported = new Set();
    await Promise.all(Object.keys(FORMATS).map(async type => {
        try { await encodeCanvas(canvas, type); supported.add(type); } catch { /* Opsi tak didukung dinonaktifkan. */ }
    }));
    canvas.width = canvas.height = 0;
    return supported;
}

export async function loadImage(file) {
    validateFile(file);
    const header = readImageHeader(await file.arrayBuffer());
    if (file.type && file.type !== header.type) throw new Error('Isi file tidak sesuai formatnya. Pilih gambar JPEG, PNG, atau WebP yang valid.');
    let image;
    try {
        if (typeof createImageBitmap === 'function') {
            image = await createImageBitmap(file, { imageOrientation: 'from-image' });
        } else {
            const url = URL.createObjectURL(file);
            try {
                image = new Image();
                image.src = url;
                await image.decode();
            } finally { URL.revokeObjectURL(url); }
        }
    } catch { throw new Error('Gambar tidak dapat dibaca. File mungkin rusak atau formatnya tidak didukung browser.'); }
    const width = image.naturalWidth || image.width;
    const height = image.naturalHeight || image.height;
    try { validateDimensions(width, height); } catch (error) { image.close?.(); throw error; }
    return { file, image, width, height, type: header.type, url: URL.createObjectURL(file) };
}

export function releaseImage(source) {
    if (!source) return;
    source.image.close?.();
    if (source.image instanceof HTMLImageElement) source.image.removeAttribute('src');
    URL.revokeObjectURL(source.url);
}

export async function processImage(source, settings) {
    validateSettings(settings);
    const { width, height, type, quality } = settings;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    try {
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Kanvas tidak tersedia. Gunakan browser terbaru.');
        if (type === 'image/jpeg') {
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, width, height);
        }
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        context.drawImage(source.image, 0, 0, width, height);
        return await encodeCanvas(canvas, type, quality);
    } finally {
        // Bebaskan buffer piksel setelah toBlob selesai, termasuk saat gagal.
        canvas.width = canvas.height = 0;
    }
}
