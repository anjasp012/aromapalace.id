<?php

namespace App\Services;

class KiriminAjaFallbackData
{
    /**
     * Fallback shipping rates with realistic domestic pricing when live rate lookup is unavailable.
     *
     * @return array<int, array{code: string, courier_code: string, name: string, service: string, price: int, price_formatted: string, etd: string}>
     */
    public static function shippingRates(): array
    {
        return [
            [
                'code' => 'jne_reg',
                'courier_code' => 'jne',
                'name' => 'JNE Express Reguler',
                'service' => 'REG',
                'price' => 25000,
                'price_formatted' => 'Rp 25.000',
                'etd' => 'Estimasi 2-3 Hari',
            ],
            [
                'code' => 'jnt_ez',
                'courier_code' => 'jnt',
                'name' => 'J&T EZ',
                'service' => 'EZ',
                'price' => 24000,
                'price_formatted' => 'Rp 24.000',
                'etd' => 'Estimasi 2-3 Hari',
            ],
            [
                'code' => 'sicepat_reg',
                'courier_code' => 'sicepat',
                'name' => 'SiCepat Express Reguler',
                'service' => 'REG',
                'price' => 24000,
                'price_formatted' => 'Rp 24.000',
                'etd' => 'Estimasi 1-2 Hari',
            ],
            [
                'code' => 'lion_regpack',
                'courier_code' => 'lion',
                'name' => 'Lion Parcel Regpack',
                'service' => 'REGPACK',
                'price' => 23000,
                'price_formatted' => 'Rp 23.000',
                'etd' => 'Estimasi 2-4 Hari',
            ],
            [
                'code' => 'anteraja_reg',
                'courier_code' => 'anteraja',
                'name' => 'AnterAja Regular',
                'service' => 'REG',
                'price' => 22000,
                'price_formatted' => 'Rp 22.000',
                'etd' => 'Estimasi 2-3 Hari',
            ],
        ];
    }

    /**
     * Fallback list of domestic couriers when SDK is unavailable.
     *
     * @return array<int, array{code: string, name: string, region: string, type: string}>
     */
    public static function couriers(): array
    {
        return [
            ['code' => 'jne', 'name' => 'JNE Express', 'region' => 'DOMESTIC', 'type' => 'Express'],
            ['code' => 'jnt', 'name' => 'J&T Express', 'region' => 'DOMESTIC', 'type' => 'Express'],
            ['code' => 'sicepat', 'name' => 'SiCepat Express', 'region' => 'DOMESTIC', 'type' => 'Express'],
            ['code' => 'anteraja', 'name' => 'AnterAja', 'region' => 'DOMESTIC', 'type' => 'Express'],
            ['code' => 'lion', 'name' => 'Lion Parcel', 'region' => 'DOMESTIC', 'type' => 'Express'],
            ['code' => 'tiki', 'name' => 'Tiki', 'region' => 'DOMESTIC', 'type' => 'Express'],
            ['code' => 'sap', 'name' => 'SAP Express', 'region' => 'DOMESTIC', 'type' => 'Express'],
            ['code' => 'idx', 'name' => 'ID Express', 'region' => 'DOMESTIC', 'type' => 'Express'],
            ['code' => 'spx', 'name' => 'SPX', 'region' => 'DOMESTIC', 'type' => 'Express'],
            ['code' => 'ninja', 'name' => 'Ninja Express', 'region' => 'DOMESTIC', 'type' => 'Express'],
            ['code' => 'posindonesia', 'name' => 'Pos Indonesia', 'region' => 'DOMESTIC', 'type' => 'Express'],
            ['code' => 'rpx', 'name' => 'RPX Logistics', 'region' => 'DOMESTIC', 'type' => 'Express'],
        ];
    }

    /**
     * Fallback Indonesian Provinces.
     *
     * @return array<int, array{id: int, name: string}>
     */
    public static function provinces(): array
    {
        return [
            ['id' => 1, 'name' => 'Bali'],
            ['id' => 2, 'name' => 'Bangka Belitung'],
            ['id' => 3, 'name' => 'Banten'],
            ['id' => 4, 'name' => 'Bengkulu'],
            ['id' => 5, 'name' => 'DI Yogyakarta'],
            ['id' => 6, 'name' => 'DKI Jakarta'],
            ['id' => 7, 'name' => 'Gorontalo'],
            ['id' => 8, 'name' => 'Jambi'],
            ['id' => 9, 'name' => 'Jawa Barat'],
            ['id' => 10, 'name' => 'Jawa Tengah'],
            ['id' => 11, 'name' => 'Jawa Timur'],
            ['id' => 12, 'name' => 'Kalimantan Barat'],
            ['id' => 13, 'name' => 'Kalimantan Selatan'],
            ['id' => 14, 'name' => 'Kalimantan Tengah'],
            ['id' => 15, 'name' => 'Kalimantan Timur'],
            ['id' => 16, 'name' => 'Kalimantan Utara'],
            ['id' => 17, 'name' => 'Kepulauan Riau'],
            ['id' => 18, 'name' => 'Lampung'],
            ['id' => 19, 'name' => 'Maluku'],
            ['id' => 20, 'name' => 'Maluku Utara'],
            ['id' => 21, 'name' => 'Nusa Tenggara Barat'],
            ['id' => 22, 'name' => 'Nusa Tenggara Timur'],
            ['id' => 23, 'name' => 'Papua'],
            ['id' => 24, 'name' => 'Papua Barat'],
            ['id' => 25, 'name' => 'Riau'],
            ['id' => 26, 'name' => 'Sulawesi Barat'],
            ['id' => 27, 'name' => 'Sulawesi Selatan'],
            ['id' => 28, 'name' => 'Sulawesi Tengah'],
            ['id' => 29, 'name' => 'Sulawesi Tenggara'],
            ['id' => 30, 'name' => 'Sulawesi Utara'],
            ['id' => 31, 'name' => 'Sumatera Barat'],
            ['id' => 32, 'name' => 'Sumatera Selatan'],
            ['id' => 33, 'name' => 'Sumatera Utara'],
            ['id' => 34, 'name' => 'Aceh'],
        ];
    }

    /**
     * Fallback Indonesian Cities/Regencies.
     *
     * @return array<int, array{id: int, province_id: int, name: string, type: string, postal_code: string}>
     */
    public static function cities(int $provinceId): array
    {
        $allCities = [
            // DKI Jakarta (id 6)
            ['id' => 151, 'province_id' => 6, 'name' => 'Jakarta Barat', 'type' => 'Kota Administrasi', 'postal_code' => '11220'],
            ['id' => 152, 'province_id' => 6, 'name' => 'Jakarta Pusat', 'type' => 'Kota Administrasi', 'postal_code' => '10110'],
            ['id' => 153, 'province_id' => 6, 'name' => 'Jakarta Selatan', 'type' => 'Kota Administrasi', 'postal_code' => '12110'],
            ['id' => 154, 'province_id' => 6, 'name' => 'Jakarta Timur', 'type' => 'Kota Administrasi', 'postal_code' => '13330'],
            ['id' => 155, 'province_id' => 6, 'name' => 'Jakarta Utara', 'type' => 'Kota Administrasi', 'postal_code' => '14140'],
            ['id' => 156, 'province_id' => 6, 'name' => 'Kepulauan Seribu', 'type' => 'Kabupaten Administrasi', 'postal_code' => '14510'],

            // Jawa Barat (id 9)
            ['id' => 22, 'province_id' => 9, 'name' => 'Bandung', 'type' => 'Kota', 'postal_code' => '40111'],
            ['id' => 23, 'province_id' => 9, 'name' => 'Bandung', 'type' => 'Kabupaten', 'postal_code' => '40311'],
            ['id' => 24, 'province_id' => 9, 'name' => 'Bandung Barat', 'type' => 'Kabupaten', 'postal_code' => '40552'],
            ['id' => 25, 'province_id' => 9, 'name' => 'Bekasi', 'type' => 'Kota', 'postal_code' => '17111'],
            ['id' => 26, 'province_id' => 9, 'name' => 'Bekasi', 'type' => 'Kabupaten', 'postal_code' => '17530'],
            ['id' => 27, 'province_id' => 9, 'name' => 'Bogor', 'type' => 'Kota', 'postal_code' => '16111'],
            ['id' => 28, 'province_id' => 9, 'name' => 'Bogor', 'type' => 'Kabupaten', 'postal_code' => '16911'],
            ['id' => 29, 'province_id' => 9, 'name' => 'Depok', 'type' => 'Kota', 'postal_code' => '16411'],
            ['id' => 30, 'province_id' => 9, 'name' => 'Cimahi', 'type' => 'Kota', 'postal_code' => '40511'],
            ['id' => 31, 'province_id' => 9, 'name' => 'Cirebon', 'type' => 'Kota', 'postal_code' => '45111'],
            ['id' => 32, 'province_id' => 9, 'name' => 'Sukabumi', 'type' => 'Kota', 'postal_code' => '43111'],
            ['id' => 33, 'province_id' => 9, 'name' => 'Tasikmalaya', 'type' => 'Kota', 'postal_code' => '46111'],

            // DI Yogyakarta (id 5)
            ['id' => 419, 'province_id' => 5, 'name' => 'Sleman', 'type' => 'Kabupaten', 'postal_code' => '55513'],
            ['id' => 420, 'province_id' => 5, 'name' => 'Yogyakarta', 'type' => 'Kota', 'postal_code' => '55111'],
            ['id' => 421, 'province_id' => 5, 'name' => 'Bantul', 'type' => 'Kabupaten', 'postal_code' => '55711'],
            ['id' => 422, 'province_id' => 5, 'name' => 'Kulon Progo', 'type' => 'Kabupaten', 'postal_code' => '55611'],
            ['id' => 423, 'province_id' => 5, 'name' => 'Gunungkidul', 'type' => 'Kabupaten', 'postal_code' => '55811'],

            // Jawa Tengah (id 10)
            ['id' => 398, 'province_id' => 10, 'name' => 'Semarang', 'type' => 'Kota', 'postal_code' => '50111'],
            ['id' => 399, 'province_id' => 10, 'name' => 'Semarang', 'type' => 'Kabupaten', 'postal_code' => '50511'],
            ['id' => 400, 'province_id' => 10, 'name' => 'Surakarta (Solo)', 'type' => 'Kota', 'postal_code' => '57111'],
            ['id' => 401, 'province_id' => 10, 'name' => 'Klaten', 'type' => 'Kabupaten', 'postal_code' => '57411'],
            ['id' => 402, 'province_id' => 10, 'name' => 'Magelang', 'type' => 'Kota', 'postal_code' => '56111'],
            ['id' => 403, 'province_id' => 10, 'name' => 'Banyumas (Purwokerto)', 'type' => 'Kabupaten', 'postal_code' => '53111'],

            // Jawa Timur (id 11)
            ['id' => 444, 'province_id' => 11, 'name' => 'Surabaya', 'type' => 'Kota', 'postal_code' => '60111'],
            ['id' => 445, 'province_id' => 11, 'name' => 'Malang', 'type' => 'Kota', 'postal_code' => '65111'],
            ['id' => 446, 'province_id' => 11, 'name' => 'Sidoarjo', 'type' => 'Kabupaten', 'postal_code' => '61211'],
            ['id' => 447, 'province_id' => 11, 'name' => 'Gresik', 'type' => 'Kabupaten', 'postal_code' => '61111'],

            // Banten (id 3)
            ['id' => 106, 'province_id' => 3, 'name' => 'Tangerang', 'type' => 'Kota', 'postal_code' => '15111'],
            ['id' => 107, 'province_id' => 3, 'name' => 'Tangerang Selatan', 'type' => 'Kota', 'postal_code' => '15310'],
            ['id' => 108, 'province_id' => 3, 'name' => 'Tangerang', 'type' => 'Kabupaten', 'postal_code' => '15710'],
            ['id' => 109, 'province_id' => 3, 'name' => 'Serang', 'type' => 'Kota', 'postal_code' => '42111'],

            // Bali (id 1)
            ['id' => 114, 'province_id' => 1, 'name' => 'Denpasar', 'type' => 'Kota', 'postal_code' => '80111'],
            ['id' => 115, 'province_id' => 1, 'name' => 'Badung (Kuta)', 'type' => 'Kabupaten', 'postal_code' => '80351'],
            ['id' => 116, 'province_id' => 1, 'name' => 'Gianyar (Ubud)', 'type' => 'Kabupaten', 'postal_code' => '80511'],

            // Sumatera Utara (id 33)
            ['id' => 278, 'province_id' => 33, 'name' => 'Medan', 'type' => 'Kota', 'postal_code' => '20111'],
            ['id' => 279, 'province_id' => 33, 'name' => 'Deli Serdang', 'type' => 'Kabupaten', 'postal_code' => '20511'],
        ];

        $filtered = array_values(array_filter($allCities, fn ($c) => $c['province_id'] === $provinceId));

        if (! empty($filtered)) {
            return $filtered;
        }

        return [
            ['id' => $provinceId * 100 + 1, 'province_id' => $provinceId, 'name' => 'Pusat Kota', 'type' => 'Kota', 'postal_code' => '10000'],
            ['id' => $provinceId * 100 + 2, 'province_id' => $provinceId, 'name' => 'Kabupaten Utama', 'type' => 'Kabupaten', 'postal_code' => '10001'],
        ];
    }

    /**
     * Fallback Districts (Kecamatan).
     *
     * @return array<int, array{id: int, city_id: int, name: string, postal_code: string}>
     */
    public static function districts(int $cityId): array
    {
        $allDistricts = [
            // Jakarta Selatan (153)
            ['id' => 2101, 'city_id' => 153, 'name' => 'Kebayoran Baru', 'postal_code' => '12110'],
            ['id' => 2102, 'city_id' => 153, 'name' => 'Kebayoran Lama', 'postal_code' => '12210'],
            ['id' => 2103, 'city_id' => 153, 'name' => 'Cilandak', 'postal_code' => '12430'],
            ['id' => 2104, 'city_id' => 153, 'name' => 'Pasar Minggu', 'postal_code' => '12520'],
            ['id' => 2105, 'city_id' => 153, 'name' => 'Tebet', 'postal_code' => '12810'],
            ['id' => 2106, 'city_id' => 153, 'name' => 'Setiabudi', 'postal_code' => '12910'],
            ['id' => 2107, 'city_id' => 153, 'name' => 'Mampang Prapatan', 'postal_code' => '12790'],

            // Jakarta Pusat (152)
            ['id' => 2110, 'city_id' => 152, 'name' => 'Menteng', 'postal_code' => '10310'],
            ['id' => 2111, 'city_id' => 152, 'name' => 'Tanah Abang', 'postal_code' => '10210'],
            ['id' => 2112, 'city_id' => 152, 'name' => 'Gambir', 'postal_code' => '10110'],

            // Sleman (419)
            ['id' => 5507, 'city_id' => 419, 'name' => 'Depok', 'postal_code' => '55281'],
            ['id' => 5508, 'city_id' => 419, 'name' => 'Godean', 'postal_code' => '55264'],
            ['id' => 5509, 'city_id' => 419, 'name' => 'Mlati', 'postal_code' => '55284'],
            ['id' => 5510, 'city_id' => 419, 'name' => 'Ngaglik', 'postal_code' => '55581'],

            // Yogyakarta (420)
            ['id' => 5515, 'city_id' => 420, 'name' => 'Gondokusuman', 'postal_code' => '55221'],
            ['id' => 5516, 'city_id' => 420, 'name' => 'Danurejan', 'postal_code' => '55211'],
            ['id' => 5517, 'city_id' => 420, 'name' => 'Umbulharjo', 'postal_code' => '55161'],

            // Surabaya (444)
            ['id' => 6010, 'city_id' => 444, 'name' => 'Tegalsari', 'postal_code' => '60261'],
            ['id' => 6011, 'city_id' => 444, 'name' => 'Gubeng', 'postal_code' => '60281'],
            ['id' => 6012, 'city_id' => 444, 'name' => 'Wonokromo', 'postal_code' => '60241'],

            // Bandung (22)
            ['id' => 4010, 'city_id' => 22, 'name' => 'Coblong', 'postal_code' => '40131'],
            ['id' => 4011, 'city_id' => 22, 'name' => 'Sumur Bandung', 'postal_code' => '40111'],
            ['id' => 4012, 'city_id' => 22, 'name' => 'Sukajadi', 'postal_code' => '40161'],
        ];

        $filtered = array_values(array_filter($allDistricts, fn ($d) => $d['city_id'] === $cityId));

        if (! empty($filtered)) {
            return $filtered;
        }

        return [
            ['id' => $cityId * 10 + 1, 'city_id' => $cityId, 'name' => 'Kecamatan Barat', 'postal_code' => '10110'],
            ['id' => $cityId * 10 + 2, 'city_id' => $cityId, 'name' => 'Kecamatan Timur', 'postal_code' => '10120'],
            ['id' => $cityId * 10 + 3, 'city_id' => $cityId, 'name' => 'Kecamatan Selatan', 'postal_code' => '10130'],
            ['id' => $cityId * 10 + 4, 'city_id' => $cityId, 'name' => 'Kecamatan Utara', 'postal_code' => '10140'],
        ];
    }

    /**
     * Fallback Subdistricts (Kelurahan).
     *
     * @return array<int, array{id: int, district_id: int, name: string, postal_code: string}>
     */
    public static function subdistricts(int $districtId): array
    {
        $allSubdistricts = [
            // Kebayoran Baru (2101)
            ['id' => 1001, 'district_id' => 2101, 'name' => 'Senayan', 'postal_code' => '12190'],
            ['id' => 1002, 'district_id' => 2101, 'name' => 'Selong', 'postal_code' => '12110'],
            ['id' => 1003, 'district_id' => 2101, 'name' => 'Gunung', 'postal_code' => '12120'],
            ['id' => 1004, 'district_id' => 2101, 'name' => 'Kramat Pela', 'postal_code' => '12130'],
            ['id' => 1005, 'district_id' => 2101, 'name' => 'Gandaria Utara', 'postal_code' => '12140'],
            ['id' => 1006, 'district_id' => 2101, 'name' => 'Melawai', 'postal_code' => '12160'],
            ['id' => 1007, 'district_id' => 2101, 'name' => 'Pulo', 'postal_code' => '12170'],
            ['id' => 1008, 'district_id' => 2101, 'name' => 'Petogogan', 'postal_code' => '12170'],
            ['id' => 1009, 'district_id' => 2101, 'name' => 'Rawa Barat', 'postal_code' => '12180'],
            ['id' => 1010, 'district_id' => 2101, 'name' => 'Cipete Utara', 'postal_code' => '12150'],

            // Depok, Sleman (5507)
            ['id' => 55071, 'district_id' => 5507, 'name' => 'Caturtunggal', 'postal_code' => '55281'],
            ['id' => 55072, 'district_id' => 5507, 'name' => 'Maguwoharjo', 'postal_code' => '55282'],
            ['id' => 55073, 'district_id' => 5507, 'name' => 'Condongcatur', 'postal_code' => '55283'],

            // Menteng (2110)
            ['id' => 21101, 'district_id' => 2110, 'name' => 'Menteng', 'postal_code' => '10310'],
            ['id' => 21102, 'district_id' => 2110, 'name' => 'Pegangsaan', 'postal_code' => '10320'],
            ['id' => 21103, 'district_id' => 2110, 'name' => 'Cikini', 'postal_code' => '10330'],
            ['id' => 21104, 'district_id' => 2110, 'name' => 'Kebon Sirih', 'postal_code' => '10340'],
            ['id' => 21105, 'district_id' => 2110, 'name' => 'Gondangdia', 'postal_code' => '10350'],
        ];

        $filtered = array_values(array_filter($allSubdistricts, fn ($s) => $s['district_id'] === $districtId));

        if (! empty($filtered)) {
            return $filtered;
        }

        return [
            ['id' => $districtId * 10 + 1, 'district_id' => $districtId, 'name' => 'Kelurahan Satu', 'postal_code' => '10001'],
            ['id' => $districtId * 10 + 2, 'district_id' => $districtId, 'name' => 'Kelurahan Dua', 'postal_code' => '10002'],
            ['id' => $districtId * 10 + 3, 'district_id' => $districtId, 'name' => 'Kelurahan Tiga', 'postal_code' => '10003'],
        ];
    }
}
