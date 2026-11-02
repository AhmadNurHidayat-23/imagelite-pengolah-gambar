import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAX_FILE_SIZE, formatSize, outputFilename, proportionalSize, readImageHeader, sizeChange, validateDimensions, validateFile, validateSettings } from '../../resources/js/image-rules.js';

function png(width, height) {
    const bytes = new Uint8Array(24);
    bytes.set([137, 80, 78, 71, 13, 10, 26, 10]);
    bytes.set([73, 72, 68, 82], 12);
    const view = new DataView(bytes.buffer);
    view.setUint32(16, width);
    view.setUint32(20, height);
    return bytes.buffer;
}

test('format, ukuran kosong, dan batas 20 MB divalidasi', () => {
    for (const type of ['image/jpeg', 'image/png', 'image/webp', '']) {
        assert.doesNotThrow(() => validateFile({ type, size: MAX_FILE_SIZE }));
    }
    assert.throws(() => validateFile({ type: 'image/gif', size: 120 }), /Format tidak didukung/);
    assert.throws(() => validateFile({ type: 'image/png', size: MAX_FILE_SIZE + 1 }), /20 MB/);
    assert.throws(() => validateFile({ type: 'image/png', size: 0 }), /kosong/);
});

test('dimensi harus bulat, positif, maksimal 8192 per sisi dan 16 megapiksel', () => {
    for (const [width, height] of [[1, 1], [4000, 4000], [8192, 1]]) assert.doesNotThrow(() => validateDimensions(width, height));
    for (const [width, height] of [[0, 5], [-1, 5], [1.5, 5], [8193, 2], [5000, 5000], [NaN, 20], [Infinity, 20]]) {
        assert.throws(() => validateDimensions(width, height));
    }
});

test('rasio dibulatkan dengan benar dan tidak menghasilkan sisi nol', () => {
    assert.equal(proportionalSize(600, 1200, 800), 400);
    assert.equal(proportionalSize(301, 1200, 800), 201);
    assert.equal(proportionalSize(1, 8192, 1), 1);
    assert.equal(proportionalSize(0, 1200, 800), '');
    assert.equal(proportionalSize(2.4, 1200, 800), '');
});

test('persentase hasil lebih kecil, lebih besar, dan sama dihitung dari byte aktual', () => {
    assert.equal(sizeChange(1000, 750), '25% lebih kecil dari gambar asli.');
    assert.equal(sizeChange(1000, 1500), '50% lebih besar dari gambar asli.');
    assert.equal(sizeChange(1000, 1000), 'Ukuran file tidak berubah.');
    assert.equal(formatSize(1024), '1 KB');
    assert.equal(formatSize(1536), '1,5 KB');
});

test('nama unduhan bersih dan ekstensi mengikuti format hasil', () => {
    assert.equal(outputFilename('Foto liburan.PNG', 'image/jpeg'), 'Foto liburan-imagelite.jpg');
    assert.equal(outputFilename('<gambar>.jpg', 'image/webp'), '-gambar--imagelite.webp');
    assert.equal(outputFilename('', 'image/png'), 'gambar-imagelite.png');
});

test('pengaturan kualitas dan format diperiksa', () => {
    const settings = { width: 800, height: 600, quality: 80, type: 'image/webp' };
    assert.doesNotThrow(() => validateSettings(settings));
    assert.throws(() => validateSettings({ ...settings, quality: 101 }), /Kualitas/);
    assert.throws(() => validateSettings({ ...settings, type: 'image/gif' }), /format/);
});

test('header PNG dibaca, dimensi ekstrem ditolak sebelum decoding', () => {
    assert.deepEqual(readImageHeader(png(1200, 800)), { type: 'image/png', width: 1200, height: 800 });
    assert.throws(() => readImageHeader(png(50000, 50000)), /8.192/);
    assert.throws(() => readImageHeader(png(5000, 5000)), /16 megapiksel/);
});

test('header JPEG baseline dibaca tanpa mendekode piksel', () => {
    const bytes = new Uint8Array([255,216,255,224,0,4,0,0,255,192,0,11,8,3,32,4,176,1,1,17,0]);
    assert.deepEqual(readImageHeader(bytes.buffer), { type: 'image/jpeg', width: 1200, height: 800 });
});

test('header WebP VP8, VP8L, dan VP8X didukung', () => {
    for (const mode of ['VP8 ', 'VP8L', 'VP8X']) {
        const bytes = new Uint8Array(30), view = new DataView(bytes.buffer);
        const writeText = (value, offset) => bytes.set(Array.from(value, char => char.charCodeAt(0)), offset);
        writeText('RIFF', 0); view.setUint32(4, 22, true); writeText('WEBP', 8); writeText(mode, 12); view.setUint32(16, 10, true);
        if (mode === 'VP8X') { bytes.set([175,4,0,31,3,0], 24); }
        else if (mode === 'VP8L') { bytes[20] = 0x2f; view.setUint32(21, 1199 | (799 << 14), true); }
        else { bytes.set([0x9d,1,0x2a], 23); view.setUint16(26,1200,true);view.setUint16(28,800,true); }
        assert.deepEqual(readImageHeader(bytes.buffer), { type: 'image/webp', width: 1200, height: 800 });
    }
});

test('file palsu, header terpotong, dan JPEG rusak ditolak', () => {
    for (const bytes of [new Uint8Array(), new TextEncoder().encode('<svg></svg>'), new Uint8Array([255,216,255,192,0,30])]) {
        assert.throws(() => readImageHeader(bytes.buffer), /tidak dikenali atau rusak/);
    }
});
