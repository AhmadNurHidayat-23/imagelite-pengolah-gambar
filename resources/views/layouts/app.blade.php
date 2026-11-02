<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="Kompres, ubah ukuran, dan konversi gambar JPEG, PNG, atau WebP secara lokal di browser dengan ImageLite.">
    <meta name="theme-color" content="#fafaf8">
    <title>ImageLite — Pengompres dan Pengubah Ukuran Gambar</title>
    <link rel="icon" href="{{ asset('favicon.svg') }}" type="image/svg+xml">
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body>
    <a class="skip-link" href="#upload-area">Langsung ke pengolah gambar</a>
    <header class="site-header wrap">
        <a class="wordmark" href="{{ route('home') }}" aria-label="ImageLite, halaman utama">imagelite.</a>
        <span>Lebih ringan. Tetap berarti.</span>
    </header>
    <main class="wrap">@yield('content')</main>
    <footer class="site-footer wrap">
        <p>ImageLite — Pengompres dan Pengubah Ukuran Gambar.</p>
        <span>Diproses di perangkat Anda.</span>
    </footer>
</body>
</html>
