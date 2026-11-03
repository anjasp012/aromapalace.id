<?php

namespace App\Console\Commands;

use App\Models\CoverageCity;
use App\Models\CoverageDistrict;
use App\Models\CoverageProvince;
use App\Models\CoverageSubdistrict;
use App\Services\RajaOngkirShippingCostService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('coverage:sync {--provinces-only : Hanya sinkronisasi provinsi}')]
#[Description('Sinkronisasi dan simpan master wilayah RajaOngkir ke database lokal')]
class SyncCoverageAreasCommand extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(RajaOngkirShippingCostService $rajaOngkir): int
    {
        $this->info('Memulai sinkronisasi wilayah RajaOngkir ke database...');

        $raw = $rajaOngkir->getProvinces();
        $provincesData = is_array($raw) ? ($raw['data'] ?? (array_is_list($raw) ? $raw : [])) : [];

        if (empty($provincesData)) {
            $msg = is_array($raw) ? ($raw['meta']['message'] ?? $raw['message'] ?? 'Respon kosong') : 'Gagal menghubungi API RajaOngkir';
            $this->error("Gagal mengambil data provinsi: {$msg}");

            $this->line('');
            $this->warn('Status Database Wilayah Saat Ini:');
            $this->line('- Provinsi: '.CoverageProvince::count());
            $this->line('- Kota/Kab: '.CoverageCity::count());
            $this->line('- Kecamatan: '.CoverageDistrict::count());
            $this->line('- Kelurahan: '.CoverageSubdistrict::count());

            return self::FAILURE;
        }

        $now = now();
        $provinceRecords = [];
        foreach ($provincesData as $p) {
            if (is_array($p) && isset($p['id'])) {
                $provinceRecords[] = [
                    'id' => (int) $p['id'],
                    'name' => (string) ($p['name'] ?? $p['province'] ?? ''),
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        if (! empty($provinceRecords)) {
            CoverageProvince::upsert($provinceRecords, ['id'], ['name', 'updated_at']);
            $this->info('Berhasil menyimpan '.count($provinceRecords).' provinsi ke tabel coverage_provinces.');
        }

        $this->table(
            ['ID', 'Nama Provinsi'],
            array_slice(array_map(fn ($p) => [$p['id'], $p['name']], $provinceRecords), 0, 10)
        );

        if (count($provinceRecords) > 10) {
            $this->line('... dan '.(count($provinceRecords) - 10).' provinsi lainnya.');
        }

        return self::SUCCESS;
    }
}
