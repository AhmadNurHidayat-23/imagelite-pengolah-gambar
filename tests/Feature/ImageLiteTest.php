<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ImageLiteTest extends TestCase
{
    public function test_homepage_loads_without_database_access(): void
    {
        DB::shouldReceive('connection')->never();

        $this->get('/')
            ->assertOk()
            ->assertSee('<html lang="id">', false)
            ->assertSee('ImageLite — Pengompres dan Pengubah Ukuran Gambar')
            ->assertSee('Pilih Gambar')
            ->assertSee('Proses Gambar')
            ->assertSee('Gambar Asli')
            ->assertSee('Gambar Hasil')
            ->assertSee('Unduh Gambar')
            ->assertSee('Tidak diunggah atau disimpan di server.');
    }

    public function test_no_upload_endpoint_is_available(): void
    {
        $this->post('/')->assertStatus(405);
    }
}
