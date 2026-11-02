# ImageLite — Pengompres dan Pengubah Ukuran Gambar

ImageLite mengompres, mengubah dimensi, dan mengonversi gambar langsung di browser. Pengguna dapat menyiapkan gambar untuk situs, dokumen, dan kebutuhan berbagi melalui satu halaman berbahasa Indonesia.

Kompresi membantu mengurangi ukuran file, sedangkan pengubahan dimensi menyesuaikan resolusi dengan kebutuhan penggunaan. Hasil tidak selalu lebih kecil daripada sumber. ImageLite menampilkan ukuran aktual, resolusi, dan persentase perubahan sehingga pengguna dapat membandingkan hasil sebelum mengunduhnya.

## Fitur utama

- Memilih satu gambar dari perangkat atau menyeretnya ke area unggah.
- Mendukung sumber JPEG, PNG, dan WebP maksimal 20 MB.
- Memeriksa tanda format dan dimensi sebelum membaca piksel; menolak file rusak atau terlalu besar.
- Mengubah lebar dan tinggi dengan pilihan mempertahankan rasio.
- Mengatur kualitas JPEG/WebP dan mengonversi format hasil.
- Membandingkan gambar asli dengan hasil, lalu mengunduh file yang sesuai formatnya.
- Mengembalikan pengaturan awal serta membersihkan hasil lama ketika pengaturan atau gambar berubah.

Dimensi dibatasi hingga 8.192 piksel per sisi dan total 16 megapiksel untuk sumber maupun hasil. Batas ini membantu mengendalikan penggunaan memori browser. PNG tidak memakai pengaturan kualitas lossy. Transparansi dipertahankan pada PNG/WebP, sementara JPEG memakai latar putih. Dukungan encoder diperiksa pada browser; pilihan yang tidak tersedia dinonaktifkan, dan hasil fallback tidak diunduh sebagai format yang keliru. Gambar animasi diproses sebagai gambar diam, bukan animasi.

## Teknologi

Aplikasi menggunakan Laravel 13, layout Blade, HTML5, CSS3, JavaScript murni, Canvas API, dan Vite. Font Inter disertakan secara lokal bersama lisensinya. Tidak ada framework frontend atau library pemrosesan gambar tambahan. Laravel hanya menyajikan halaman dan aset; session serta cache memakai file tanpa database.

## Cara menggunakan

1. Pilih gambar atau tarik satu file ke area unggah.
2. Atur dimensi, rasio, kualitas, dan format hasil.
3. Tekan **Proses Gambar**.
4. Periksa pratinjau serta perbandingan ukuran aktual.
5. Tekan **Unduh Gambar** atau gunakan **Reset Pengaturan** untuk kembali ke pengaturan gambar asli.

## Privasi

Gambar tidak dikirim ke Laravel, layanan eksternal, database, atau storage aplikasi. Pemrosesan berlangsung di memori browser melalui Canvas dan `toBlob()`. URL objek dan buffer gambar dibersihkan ketika diganti atau tidak diperlukan. JavaScript harus aktif. Orientasi gambar mengikuti hasil decoding browser; metadata sumber tidak disalin secara sengaja ke hasil.

## Menjalankan secara lokal

Gunakan PHP minimal 8.3, Composer 2, dan Node.js 22.12 atau lebih baru:

```sh
git clone https://github.com/AhmadNurHidayat-23/imagelite-pengolah-gambar.git
cd imagelite-pengolah-gambar
composer install
npm ci
cp .env.example .env
php artisan key:generate
npm run build
php artisan serve
```

Buka `http://localhost:8000`. Pada instalasi MAMP yang tersedia, gunakan `http://localhost:8888/imagelite-pengolah-gambar/public/`. MySQL dan migrasi tidak diperlukan. Akses source di luar `public` diblokir oleh konfigurasi Apache project.

Jalankan `php artisan test`, `npm test`, dan `npm run build` untuk pemeriksaan. Pengujian Canvas tersedia melalui `npm run test:browser`, lalu buka `http://127.0.0.1:8015`; tutup server pengujian dengan Ctrl+C setelah selesai.
