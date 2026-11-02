export function bindImageInput({ choose, input, dropzone, onFile, onError }) {
    choose.addEventListener('click', () => input.click());
    input.addEventListener('change', () => {
        const file = input.files[0];
        input.value = '';
        if (file) onFile(file);
    });

    let depth = 0;
    for (const name of ['dragenter', 'dragover', 'dragleave', 'drop']) {
        window.addEventListener(name, event => {
            if (Array.from(event.dataTransfer?.types || []).includes('Files')) event.preventDefault();
        });
    }
    dropzone.addEventListener('dragenter', event => {
        event.preventDefault();
        depth++;
        dropzone.classList.add('is-dragging');
    });
    dropzone.addEventListener('dragover', event => event.preventDefault());
    dropzone.addEventListener('dragleave', () => {
        if (--depth <= 0) dropzone.classList.remove('is-dragging');
    });
    dropzone.addEventListener('drop', event => {
        event.preventDefault();
        depth = 0;
        dropzone.classList.remove('is-dragging');
        const files = event.dataTransfer.files;
        if (files.length !== 1) { onError('Pilih satu gambar untuk diproses.'); return; }
        onFile(files[0]);
    });
}
