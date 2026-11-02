@extends('layouts.app')

@section('content')
    <section class="intro" aria-labelledby="page-title">
        <p class="eyebrow">PENGOLAH GAMBAR ONLINE</p>
        <h1 id="page-title">Optimalkan Gambar<br>dengan Mudah.</h1>
        <p class="description">Kompres dan ubah ukuran gambar langsung dari browser dengan pengaturan yang sederhana.</p>
    </section>

    <section id="upload-area" class="upload-area" aria-label="Unggah gambar" aria-describedby="file-hint">
        <input type="file" id="file-input" accept="image/jpeg,image/png,image/webp" hidden>
        <div class="upload-copy">
            <svg id="upload-icon" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 21V5m-6 6 6-6 6 6M6 21v6h20v-6"/></svg>
            <h2 id="upload-title">Mulai dari satu gambar.</h2>
            <p id="file-hint">Tarik gambar ke sini, atau pilih dari perangkat Anda.</p>
            <p id="file-details" hidden></p>
        </div>
        <button type="button" class="button button-primary" id="choose-button" disabled>Pilih Gambar</button>
        <p class="upload-limits">JPEG, PNG, WebP · Maks. 20 MB · 16 megapiksel</p>
    </section>
    <p class="privacy-note"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>Gambar diproses di browser. Tidak diunggah atau disimpan di server.</p>
    <noscript><p class="error-message">Aktifkan JavaScript untuk menggunakan ImageLite.</p></noscript>
    <p class="error-message" id="error-message" role="alert" hidden></p>
    <p class="status-message" id="status-message" role="status" aria-live="polite" aria-atomic="true"></p>

    <div id="editor" hidden>
        <form id="settings-form" novalidate>
            <fieldset id="settings-controls">
                <legend>Pengaturan gambar</legend>
                <div class="settings-grid">
                    <div class="dimension-settings">
                        <div class="dimensions">
                            <div><label for="width-input">Lebar <span>(piksel)</span></label><input type="number" id="width-input" min="1" max="8192" step="1" inputmode="numeric" required></div>
                            <span class="dimension-times" aria-hidden="true">×</span>
                            <div><label for="height-input">Tinggi <span>(piksel)</span></label><input type="number" id="height-input" min="1" max="8192" step="1" inputmode="numeric" required></div>
                        </div>
                        <label class="checkbox-label" for="ratio-input"><input type="checkbox" id="ratio-input" checked>Pertahankan rasio</label>
                        <p class="field-hint">Maks. 8.192 piksel per sisi, total 16 megapiksel.</p>
                    </div>
                    <div class="quality-settings">
                        <label for="quality-input">Kualitas <output id="quality-value" for="quality-input">80%</output></label>
                        <input type="range" id="quality-input" min="10" max="100" step="1" value="80" aria-describedby="quality-hint">
                        <p class="field-hint" id="quality-hint">Kualitas lebih rendah dapat memperkecil ukuran file.</p>
                    </div>
                    <div>
                        <label for="format-input">Format hasil</label>
                        <select id="format-input" aria-describedby="format-hint">
                            <option value="image/jpeg">JPEG</option>
                            <option value="image/png">PNG</option>
                            <option value="image/webp">WebP</option>
                        </select>
                        <p class="field-hint" id="format-hint">JPEG memakai latar putih untuk area transparan.</p>
                    </div>
                </div>
                <div class="settings-actions">
                    <button type="button" class="text-button" id="reset-button">Reset Pengaturan</button>
                    <button type="submit" class="button button-primary" id="process-button">Proses Gambar <span aria-hidden="true">→</span></button>
                </div>
            </fieldset>
        </form>

        <section class="comparison" aria-label="Perbandingan gambar">
            <figure>
                <div class="preview-heading"><h2>Gambar Asli</h2><span id="original-format"></span></div>
                <div class="image-stage"><img id="original-preview" alt="Pratinjau gambar asli"></div>
                <figcaption><span id="original-size"></span><span id="original-dimensions"></span></figcaption>
            </figure>
            <figure>
                <div class="preview-heading"><h2>Gambar Hasil</h2><span id="result-format">Belum diproses</span></div>
                <div class="image-stage">
                    <img id="result-preview" alt="Pratinjau gambar hasil pengolahan" hidden>
                    <div class="empty-result" id="empty-result"><span aria-hidden="true">↗</span><p>Hasil yang lebih pas untuk Anda.</p><p>Atur gambar, lalu klik Proses Gambar.</p></div>
                </div>
                <figcaption><span id="result-size">—</span><span id="result-dimensions">—</span></figcaption>
            </figure>
        </section>
        <div class="download-row">
            <p id="size-change">Ukuran hasil dapat lebih kecil atau lebih besar dari gambar asli.</p>
            <button type="button" class="button button-primary" id="download-button" disabled><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M5 16v5h14v-5"/></svg>Unduh Gambar</button>
        </div>
    </div>
@endsection
