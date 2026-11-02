import { encodeCanvas, loadImage, processImage, releaseImage, supportedFormats } from './image-processing.js';
import { bindImageInput } from './image-input.js';

let passed = 0, failed = 0;
const check = (condition, message) => { if (!condition) throw new Error(message); };
const fileFrom = (blob, name = 'uji.png', type = blob.type) => new File([blob], name, { type });
const test = async (name, run) => {
    const item = document.createElement('li');
    try { await run(); passed++; item.textContent = `LULUS — ${name}`; }
    catch (error) { failed++; item.textContent = `GAGAL — ${name}: ${error.message}`; }
    document.querySelector('#results').append(item);
};
const rejects = async (run, text) => {
    try { await run(); } catch (error) { check(error.message.includes(text), error.message); return; }
    throw new Error('Masukan seharusnya ditolak.');
};

const canvas = document.createElement('canvas');
canvas.width = 320; canvas.height = 200;
const ctx = canvas.getContext('2d');
for (let y = 20; y < 180; y += 3) for (let x = 20; x < 300; x += 3) {
    ctx.fillStyle = `rgb(${x % 255},${y % 255},${(x * y) % 255})`;
    ctx.fillRect(x, y, 3, 3);
}
const formats = await supportedFormats();
const png = await encodeCanvas(canvas, 'image/png');
const source = await loadImage(fileFrom(png));
const settings = { width: 160, height: 100, quality: 80, type: 'image/png' };
const sample = async blob => {
    const bitmap = await createImageBitmap(blob);
    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = bitmap.width; sampleCanvas.height = bitmap.height;
    const context = sampleCanvas.getContext('2d');
    context.drawImage(bitmap, 0, 0);
    const pixel = [...context.getImageData(0, 0, 1, 1).data];
    const info = { width: bitmap.width, height: bitmap.height, pixel };
    bitmap.close(); sampleCanvas.width = sampleCanvas.height = 0;
    return info;
};

for (const type of ['image/jpeg', 'image/png', 'image/webp']) {
    await test(`Membaca ${type}`, async () => {
        if (!formats.has(type)) return;
        const blob = await encodeCanvas(canvas, type);
        const loaded = await loadImage(fileFrom(blob));
        try { check(loaded.width === 320 && loaded.height === 200, 'Resolusi asli salah.'); }
        finally { releaseImage(loaded); }
    });
    await test(`Resize dan konversi ke ${type}`, async () => {
        if (!formats.has(type)) return;
        const blob = await processImage(source, { ...settings, type });
        check(blob.type === type && blob.size > 0, 'MIME atau ukuran tidak valid.');
        const decoded = await sample(blob);
        check(decoded.width === 160 && decoded.height === 100, 'Resolusi hasil salah.');
        const white = decoded.pixel.slice(0, 3).every(value => value >= 250) && decoded.pixel[3] === 255;
        check(type === 'image/jpeg' ? white : decoded.pixel[3] === 0, `Latar putih atau transparansi tidak sesuai: ${decoded.pixel}.`);
    });
}
await test('Kualitas JPEG memengaruhi ukuran aktual', async () => {
    const low = await processImage(source, { ...settings, type: 'image/jpeg', quality: 15 });
    const high = await processImage(source, { ...settings, type: 'image/jpeg', quality: 95 });
    check(low.size < high.size, 'Ukuran JPEG tidak berubah sesuai kualitas.');
});
await test('PNG mengabaikan pengaturan kualitas lossy', async () => {
    const low = await processImage(source, { ...settings, quality: 10 });
    const high = await processImage(source, { ...settings, quality: 100 });
    check(low.size === high.size, 'PNG berubah karena kualitas lossy.');
});
await test('Fallback format browser ditolak', () => rejects(() => encodeCanvas(canvas, 'image/tidak-ada'), 'tidak mendukung'));
await test('File rusak ditolak setelah header valid', () => rejects(() => loadImage(fileFrom(png.slice(0, 40, 'image/png'))), 'tidak dapat dibaca'));
await test('File yang menyamarkan format ditolak', () => rejects(() => loadImage(fileFrom(png, 'palsu.jpg', 'image/jpeg')), 'tidak sesuai'));
await test('Dimensi hasil berlebih ditolak', () => rejects(() => processImage(source, { ...settings, width: 8192, height: 8192 }), '16 megapiksel'));

const zone = document.createElement('div'), choose = document.createElement('button'), input = document.createElement('input');
input.type = 'file';
let selected = null, dropError = '';
bindImageInput({ choose, input, dropzone: zone, onFile: file => { selected = file; }, onError: text => { dropError = text; } });
const transfer = new DataTransfer();
transfer.items.add(fileFrom(png));
await test('Drag-and-drop satu gambar diterima dan siap dibaca', async () => {
    const event = new DragEvent('drop', { cancelable: true, dataTransfer: transfer });
    zone.dispatchEvent(event);
    check(event.defaultPrevented && selected?.size === png.size, 'File dari drop tidak diterima.');
    const loaded = await loadImage(selected);
    releaseImage(loaded);
});
await test('Drop banyak file ditolak', async () => {
    transfer.items.add(fileFrom(png, 'kedua.png'));
    selected = null;
    zone.dispatchEvent(new DragEvent('drop', { cancelable: true, dataTransfer: transfer }));
    check(!selected && dropError.includes('satu gambar'), 'Beberapa file tidak ditolak.');
});
await test('Indikator drag dibersihkan setelah keluar', async () => {
    zone.dispatchEvent(new DragEvent('dragenter', { cancelable: true, dataTransfer: transfer }));
    check(zone.classList.contains('is-dragging'), 'Indikator drag tidak aktif.');
    zone.dispatchEvent(new DragEvent('dragleave', { dataTransfer: transfer }));
    check(!zone.classList.contains('is-dragging'), 'Indikator drag tertinggal.');
});
releaseImage(source);
canvas.width = canvas.height = 0;
document.querySelector('#summary').textContent = `${passed} lulus, ${failed} gagal.`;
