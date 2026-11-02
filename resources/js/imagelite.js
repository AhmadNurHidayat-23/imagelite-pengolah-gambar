import { FORMATS, formatSize, outputFilename, proportionalSize, sizeChange } from './image-rules.js';
import { loadImage, processImage, releaseImage, supportedFormats } from './image-processing.js';
import { bindImageInput } from './image-input.js';

const byId = id => document.getElementById(id);
const fileInput = byId('file-input'), dropzone = byId('upload-area');
const choose = byId('choose-button'), form = byId('settings-form');
const widthInput = byId('width-input'), heightInput = byId('height-input');
const ratio = byId('ratio-input'), quality = byId('quality-input'), format = byId('format-input');
const download = byId('download-button'), process = byId('process-button');
const originalPreview = byId('original-preview'), resultPreview = byId('result-preview');
let source = null, result = null, revision = 0, supported = new Set(), loading = false, busy = false;

function showError(text = '') {
    byId('error-message').textContent = text;
    byId('error-message').hidden = !text;
}

function showStatus(text = '') { byId('status-message').textContent = text; }

function errorMessage(error) {
    return error instanceof DOMException || error instanceof TypeError || error instanceof RangeError
        ? 'Gambar tidak dapat diolah. Coba gambar lain atau kurangi dimensi hasil.'
        : error.message || 'Gambar gagal diproses. Silakan coba lagi.';
}

function clearResult() {
    resultPreview.removeAttribute('src');
    resultPreview.hidden = true;
    if (result) URL.revokeObjectURL(result.url);
    result = null;
    byId('empty-result').hidden = false;
    byId('result-format').textContent = 'Belum diproses';
    byId('result-size').textContent = byId('result-dimensions').textContent = '—';
    byId('size-change').textContent = 'Ukuran hasil dapat lebih kecil atau lebih besar dari gambar asli.';
    download.disabled = true;
}

function invalidate() {
    revision++;
    clearResult();
    showError();
    showStatus();
}

function updateQuality() {
    quality.disabled = busy || format.value === 'image/png';
    byId('quality-value').textContent = format.value === 'image/png' ? 'Tanpa kehilangan kualitas' : `${quality.value}%`;
    byId('quality-hint').textContent = format.value === 'image/png'
        ? 'PNG tidak memakai pengaturan kualitas lossy.'
        : 'Kualitas lebih rendah dapat memperkecil ukuran file.';
    byId('format-hint').textContent = format.value === 'image/jpeg'
        ? 'Area transparan diberi latar putih.' : 'Transparansi gambar dipertahankan.';
}

function setBusy(value) {
    busy = value;
    byId('settings-controls').disabled = value;
    form.setAttribute('aria-busy', String(value));
    process.textContent = value ? 'Memproses…' : 'Proses Gambar →';
    updateQuality();
}

function resetSettings() {
    if (!source || busy) return;
    invalidate();
    widthInput.value = source.width;
    heightInput.value = source.height;
    ratio.checked = true;
    quality.value = '80';
    format.value = supported.has(source.type) ? source.type : 'image/png';
    updateQuality();
}

async function selectFile(file) {
    const current = ++revision;
    loading = true;
    showError();
    showStatus('Membaca gambar…');
    clearResult();
    originalPreview.removeAttribute('src');
    releaseImage(source);
    source = null;
    byId('editor').hidden = true;
    dropzone.classList.remove('has-image');
    byId('upload-title').textContent = 'Mulai dari satu gambar.';
    byId('file-hint').hidden = false;
    byId('upload-icon').removeAttribute('hidden');
    byId('file-details').hidden = true;
    choose.textContent = 'Pilih Gambar';
    try {
        const loaded = await loadImage(file);
        if (current !== revision) { releaseImage(loaded); return; }
        source = loaded;
        originalPreview.src = source.url;
        byId('original-format').textContent = FORMATS[source.type];
        byId('original-size').textContent = formatSize(file.size);
        byId('original-dimensions').textContent = `${source.width} × ${source.height} piksel`;
        byId('upload-title').textContent = file.name;
        byId('file-details').textContent = `${formatSize(file.size)} · ${source.width} × ${source.height} piksel`;
        byId('file-details').hidden = false;
        byId('file-hint').hidden = true;
        byId('upload-icon').setAttribute('hidden', '');
        dropzone.classList.add('has-image');
        choose.textContent = 'Pilih Gambar Lain';
        byId('editor').hidden = false;
        // Proses sebelumnya mungkin masih menyelesaikan toBlob; tunggu sebelum membuka form.
        if (!busy) resetSettings();
        else {
            widthInput.value = source.width;
            heightInput.value = source.height;
            ratio.checked = true;
            quality.value = '80';
            format.value = supported.has(source.type) ? source.type : 'image/png';
            updateQuality();
        }
        showStatus('Gambar siap. Sesuaikan pengaturan lalu proses gambar.');
    } catch (error) {
        if (current === revision) showError(errorMessage(error));
    } finally {
        if (current === revision || source) loading = false;
        if (current === revision && !source) showStatus();
    }
}

bindImageInput({ choose, input: fileInput, dropzone, onFile: selectFile, onError: showError });

for (const [field, other, axis, otherAxis] of [[widthInput, heightInput, 'width', 'height'], [heightInput, widthInput, 'height', 'width']]) {
    field.addEventListener('input', () => {
        if (source && ratio.checked) other.value = proportionalSize(Number(field.value), source[axis], source[otherAxis]);
        invalidate();
    });
}
ratio.addEventListener('change', () => {
    if (source && ratio.checked) heightInput.value = proportionalSize(Number(widthInput.value), source.width, source.height);
    invalidate();
});
quality.addEventListener('input', () => { invalidate(); updateQuality(); });
format.addEventListener('change', () => { invalidate(); updateQuality(); });
byId('reset-button').addEventListener('click', () => { resetSettings(); showStatus('Pengaturan dikembalikan ke gambar asli.'); });

form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!source || busy || loading) return;
    invalidate();
    const current = revision;
    const original = source;
    const settings = { width: Number(widthInput.value), height: Number(heightInput.value), quality: Number(quality.value), type: format.value };
    if (!supported.has(settings.type)) { showError('Format hasil tidak didukung browser ini. Pilih format lain.'); return; }
    setBusy(true);
    showStatus('Memproses gambar di perangkat Anda…');
    try {
        const blob = await processImage(original, settings);
        if (current !== revision) return;
        result = { blob, url: URL.createObjectURL(blob), name: outputFilename(original.file.name, blob.type) };
        resultPreview.src = result.url;
        resultPreview.hidden = false;
        byId('empty-result').hidden = true;
        byId('result-format').textContent = FORMATS[blob.type];
        byId('result-size').textContent = formatSize(blob.size);
        byId('result-dimensions').textContent = `${settings.width} × ${settings.height} piksel`;
        byId('size-change').textContent = sizeChange(original.file.size, blob.size);
        download.disabled = false;
        showStatus('Gambar selesai diproses. Hasil siap diunduh.');
    } catch (error) {
        if (current === revision) {
            showError(errorMessage(error));
            showStatus();
        }
    } finally { setBusy(false); }
});

download.addEventListener('click', () => {
    if (!result || busy) return;
    const anchor = document.createElement('a');
    anchor.href = result.url;
    anchor.download = result.name;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    showStatus('Unduhan gambar dimulai.');
});

window.addEventListener('pagehide', () => {
    revision++;
    clearResult();
    originalPreview.removeAttribute('src');
    releaseImage(source);
    source = null;
    byId('editor').hidden = true;
});
window.addEventListener('pageshow', event => {
    if (event.persisted) {
        dropzone.classList.remove('has-image');
        byId('upload-title').textContent = 'Pilih kembali gambar Anda.';
        byId('file-details').hidden = true;
        choose.textContent = 'Pilih Gambar';
    }
});

supportedFormats().then(formats => {
    supported = formats;
    for (const option of format.options) {
        if (!supported.has(option.value)) { option.disabled = true; option.textContent += ' (tidak didukung)'; }
    }
    choose.disabled = !formats.size;
    if (!formats.size) showError('Browser ini tidak mendukung pengolahan gambar. Gunakan browser terbaru.');
}).catch(() => showError('Kanvas tidak tersedia. Gunakan browser terbaru.'));
