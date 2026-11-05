import React, { useState, useRef } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Truck,
    MapPin,
    RotateCw,
    Wallet,
    KeyRound,
    Eye,
    EyeOff,
    CheckCircle2,
    AlertCircle,
    Save,
    Compass,
    ShieldCheck,
    Building2,
    Phone,
} from 'lucide-react';
import SearchableSelect, { SearchableOption } from '@/components/ui/searchable-select';
import AddressMapPicker from '@/components/AddressMapPicker';
import { fetchCoverageUntilNotEmpty } from '@/lib/coverage-fetcher';

interface BalanceInfo {
    is_connected: boolean;
    amount: number | null;
    amount_formatted: string;
    currency: string;
    message: string;
}

interface ShippingSettingsProps {
    settings: {
        kurirapi_key: string;
        shipping_sender_name: string;
        shipping_sender_phone: string;
        shipping_address: string;
        shipping_province_id: string | number;
        shipping_province_name: string;
        shipping_city_id: string | number;
        shipping_city_name: string;
        shipping_district_id: string | number;
        shipping_district_name: string;
        shipping_subdistrict_name: string;
        shipping_postal_code: string;
        shipping_latitude: string | number;
        shipping_longitude: string | number;
    };
    balance: BalanceInfo;
    initial_provinces?: SearchableOption[];
    initial_cities?: SearchableOption[];
    initial_districts?: SearchableOption[];
}

export default function ShippingServicesIndex({
    settings,
    balance,
    initial_provinces = [],
    initial_cities = [],
    initial_districts = [],
}: ShippingSettingsProps) {
    const { data, setData, post, processing, errors } = useForm({
        kurirapi_key: settings.kurirapi_key || '',
        shipping_sender_name: settings.shipping_sender_name || 'Aroma Palace Official',
        shipping_sender_phone: settings.shipping_sender_phone || '',
        shipping_address: settings.shipping_address || '',
        shipping_province_id: settings.shipping_province_id ? Number(settings.shipping_province_id) : '',
        shipping_province_name: settings.shipping_province_name || '',
        shipping_city_id: settings.shipping_city_id ? Number(settings.shipping_city_id) : '',
        shipping_city_name: settings.shipping_city_name || '',
        shipping_district_id: settings.shipping_district_id ? Number(settings.shipping_district_id) : '',
        shipping_district_name: settings.shipping_district_name || '',
        shipping_subdistrict_name: settings.shipping_subdistrict_name || '',
        shipping_postal_code: settings.shipping_postal_code || '',
        shipping_latitude: settings.shipping_latitude || '-6.2608',
        shipping_longitude: settings.shipping_longitude || '106.8152',
    });

    const [showApiKey, setShowApiKey] = useState(false);
    const [isRefreshingBalance, setIsRefreshingBalance] = useState(false);

    // Cascading location state
    const [provinces, setProvinces] = useState<SearchableOption[]>(() => {
        if (initial_provinces && initial_provinces.length > 0) return initial_provinces;
        if (data.shipping_province_id && data.shipping_province_name) {
            return [{ id: Number(data.shipping_province_id), name: data.shipping_province_name }];
        }
        return [];
    });

    const [cities, setCities] = useState<SearchableOption[]>(() => {
        if (initial_cities && initial_cities.length > 0) return initial_cities;
        if (data.shipping_city_id && data.shipping_city_name) {
            return [{ id: Number(data.shipping_city_id), name: data.shipping_city_name }];
        }
        return [];
    });

    const [districts, setDistricts] = useState<SearchableOption[]>(() => {
        if (initial_districts && initial_districts.length > 0) return initial_districts;
        if (data.shipping_district_id && data.shipping_district_name) {
            return [{ id: Number(data.shipping_district_id), name: data.shipping_district_name }];
        }
        return [];
    });

    const [loadingProvinces, setLoadingProvinces] = useState(false);
    const [loadingCities, setLoadingCities] = useState(false);
    const [loadingDistricts, setLoadingDistricts] = useState(false);

    const provincesAbortRef = useRef<AbortController | null>(null);
    const citiesAbortRef = useRef<AbortController | null>(null);
    const districtsAbortRef = useRef<AbortController | null>(null);

    // Initial load of provinces if not preloaded
    React.useEffect(() => {
        if (provinces.length === 0) {
            provincesAbortRef.current?.abort();
            const controller = new AbortController();
            provincesAbortRef.current = controller;
            setLoadingProvinces(true);
            fetchCoverageUntilNotEmpty<SearchableOption>(
                '/api/coverage/provinces',
                (res) => setProvinces(res),
                controller.signal,
                () => setLoadingProvinces(false)
            );
        }

        return () => {
            provincesAbortRef.current?.abort();
            citiesAbortRef.current?.abort();
            districtsAbortRef.current?.abort();
        };
    }, []);

    const handleProvinceChange = (provinceId: number | string, option?: SearchableOption) => {
        const idNum = Number(provinceId);
        setData((prev) => ({
            ...prev,
            shipping_province_id: idNum,
            shipping_province_name: option?.name || '',
            shipping_city_id: '',
            shipping_city_name: '',
            shipping_district_id: '',
            shipping_district_name: '',
            shipping_subdistrict_name: '',
            shipping_postal_code: '',
        }));

        citiesAbortRef.current?.abort();
        districtsAbortRef.current?.abort();

        setCities([]);
        setDistricts([]);

        if (idNum) {
            const controller = new AbortController();
            citiesAbortRef.current = controller;
            setLoadingCities(true);
            fetchCoverageUntilNotEmpty<SearchableOption>(
                `/api/coverage/cities?province_id=${idNum}`,
                (res) => setCities(res),
                controller.signal,
                () => setLoadingCities(false)
            );
        }
    };

    const handleCityChange = (cityId: number | string, option?: SearchableOption) => {
        const idNum = Number(cityId);
        const fullName = option?.type ? `${option.type} ${option.name}` : (option?.name || '');

        setData((prev) => ({
            ...prev,
            shipping_city_id: idNum,
            shipping_city_name: fullName,
            shipping_district_id: '',
            shipping_district_name: '',
            shipping_subdistrict_name: '',
            shipping_postal_code: '',
        }));

        districtsAbortRef.current?.abort();
        setDistricts([]);

        if (idNum) {
            const controller = new AbortController();
            districtsAbortRef.current = controller;
            setLoadingDistricts(true);
            fetchCoverageUntilNotEmpty<SearchableOption>(
                `/api/coverage/districts?city_id=${idNum}`,
                (res) => setDistricts(res),
                controller.signal,
                () => setLoadingDistricts(false)
            );
        }
    };

    const handleDistrictChange = (districtId: number | string, option?: SearchableOption) => {
        const idNum = Number(districtId);
        setData((prev) => ({
            ...prev,
            shipping_district_id: idNum,
            shipping_district_name: option?.name || '',
        }));
    };

    const handleRefreshBalance = () => {
        setIsRefreshingBalance(true);
        router.reload({
            only: ['balance'],
            onFinish: () => setIsRefreshingBalance(false),
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/layanan-pengiriman', {
            preserveScroll: true,
        });
    };

    return (
        <AdminLayout
            title="Layanan Pengiriman"
            subtitle="Kelola integrasi KurirAPI, saldo operasional, dan titik origin penjemputan paket butik."
        >
            <Head title="Layanan Pengiriman & Saldo - Admin Butik" />

            <div className="space-y-6 pb-16 max-w-6xl mx-auto">
                {/* Header Action Banner */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-br from-[#4A070B] via-[#52090F] to-[#360407] text-white shadow-sm">
                    <div className="space-y-1">
                        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/10 text-white/90 text-xs font-semibold backdrop-blur-xs">
                            <Truck className="size-3.5" />
                            <span>Gateway Logistik &amp; Kurir Resmi</span>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                            Layanan Pengiriman &amp; Saldo Ekspedisi
                        </h1>
                        <p className="text-xs sm:text-sm text-white/80 max-w-xl">
                            Semua perhitungan ongkos kirim dan pengiriman paket butik terintegrasi langsung dengan ekosistem KurirAPI (Anteraja, ID Express, JNE, J&amp;T).
                        </p>
                    </div>

                    <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={processing}
                        className="bg-amber-400 hover:bg-amber-500 text-black font-bold text-xs sm:text-sm h-11 px-6 rounded-xl shadow-xs transition active:scale-[0.98] shrink-0 flex items-center gap-2 cursor-pointer"
                    >
                        <Save className="size-4" />
                        <span>{processing ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                    </Button>
                </div>

                {/* Grid: Saldo & Status Koneksi Gateway */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Kartu 1: Saldo KurirAPI */}
                    <Card className="rounded-2xl border border-border/80 shadow-none bg-card/60 backdrop-blur-xs md:col-span-1 flex flex-col justify-between">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                    <Wallet className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                                    <span>Saldo KurirAPI</span>
                                </span>
                                {balance.is_connected ? (
                                    <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 text-[10px] font-bold">
                                        Online
                                    </Badge>
                                ) : (
                                    <Badge variant="destructive" className="text-[10px]">
                                        Offline
                                    </Badge>
                                )}
                            </div>
                            <CardTitle className="text-2xl sm:text-3xl font-black text-foreground font-mono tracking-tight pt-2">
                                {balance.amount_formatted}
                            </CardTitle>
                            <CardDescription className="text-xs text-muted-foreground mt-1">
                                Saldo akun KurirAPI aktif untuk pembuatan resi pengiriman.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0 border-t border-border/50 pt-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleRefreshBalance}
                                disabled={isRefreshingBalance}
                                className="w-full h-9 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border-border/70 hover:bg-muted/60 cursor-pointer"
                            >
                                <RotateCw className={`size-3.5 ${isRefreshingBalance ? 'animate-spin' : ''}`} />
                                <span>{isRefreshingBalance ? 'Memperbarui...' : 'Segarkan Saldo'}</span>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Kartu 2: API Key Configuration */}
                    <Card className="rounded-2xl border border-border/80 shadow-none bg-card/60 backdrop-blur-xs md:col-span-2">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                    <KeyRound className="size-3.5 text-[#4A070B] dark:text-red-400" />
                                    <span>Kunci Akses API (KurirAPI)</span>
                                </span>
                                <span className="text-[11px] text-muted-foreground font-medium">Header: x-api-co-id</span>
                            </div>
                            <CardTitle className="text-base font-bold text-foreground">
                                Kredensial Integrasi Logistik
                            </CardTitle>
                            <CardDescription className="text-xs text-muted-foreground">
                                Kunci autentikasi resmi dari penyedia layanan kurir (api.co.id).
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="relative">
                                <Input
                                    type={showApiKey ? 'text' : 'password'}
                                    value={data.kurirapi_key}
                                    onChange={(e) => setData('kurirapi_key', e.target.value)}
                                    placeholder="test_E1FHospZPSTE8w8eSaIZBK9fzLOgSnr8oiTI74h5FusWZ"
                                    className="h-10 text-xs font-mono pr-24 rounded-xl"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowApiKey(!showApiKey)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground hover:text-foreground px-2 py-1 flex items-center gap-1 cursor-pointer select-none"
                                >
                                    {showApiKey ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                                    <span>{showApiKey ? 'Tutup' : 'Lihat'}</span>
                                </button>
                            </div>
                            {errors.kurirapi_key && <p className="text-xs text-destructive">{errors.kurirapi_key}</p>}
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                                <ShieldCheck className="size-3.5 text-emerald-600 shrink-0" />
                                <span>Kosongkan kolom ini jika ingin tetap menggunakan API Key bawaan dari sistem.</span>
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Form Alamat Asal (Origin) Butik */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card className="rounded-2xl border border-border/80 shadow-none bg-card/60 backdrop-blur-xs">
                        <CardHeader className="pb-4 border-b border-border/60">
                            <div className="flex items-center gap-2">
                                <Building2 className="size-5 text-[#4A070B] dark:text-red-400" />
                                <div>
                                    <CardTitle className="text-base font-bold text-foreground">
                                        Alamat Asal &amp; Penjemputan Paket (Origin)
                                    </CardTitle>
                                    <CardDescription className="text-xs text-muted-foreground mt-0.5">
                                        Alamat dan titik koordinat ini menjadi dasar perhitungan tarif ongkos kirim dan titik pickup kurir.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="pt-6 space-y-6">
                            {/* Baris 1: Nama Pengirim & Telepon */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                                        <span>Nama Pengirim / Butik Resmi</span>
                                        <span className="text-destructive">*</span>
                                    </label>
                                    <Input
                                        type="text"
                                        placeholder="mis. Aroma Palace Official"
                                        value={data.shipping_sender_name}
                                        onChange={(e) => setData('shipping_sender_name', e.target.value)}
                                        className="h-10 text-xs rounded-xl"
                                        required
                                    />
                                    {errors.shipping_sender_name && (
                                        <p className="text-xs text-destructive">{errors.shipping_sender_name}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                                        <Phone className="size-3 text-muted-foreground" />
                                        <span>No. Telepon / WhatsApp Pengirim</span>
                                        <span className="text-destructive">*</span>
                                    </label>
                                    <Input
                                        type="tel"
                                        placeholder="081288889999"
                                        value={data.shipping_sender_phone}
                                        onChange={(e) => setData('shipping_sender_phone', e.target.value)}
                                        className="h-10 text-xs rounded-xl"
                                        required
                                    />
                                    {errors.shipping_sender_phone && (
                                        <p className="text-xs text-destructive">{errors.shipping_sender_phone}</p>
                                    )}
                                </div>
                            </div>

                            {/* Baris 2: Hirarki Wilayah KurirAPI */}
                            <div className="border rounded-2xl p-4 sm:p-5 bg-muted/20 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                                        <MapPin className="size-3.5 text-[#4A070B] dark:text-red-400" />
                                        <span>Wilayah Asal Resmi (Cakupan KurirAPI)</span>
                                    </h3>
                                    <span className="text-[11px] text-muted-foreground">Kecamatan = Acuan Cek Ongkir</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Provinsi */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-foreground">
                                            Provinsi <span className="text-destructive">*</span>
                                        </label>
                                        <SearchableSelect
                                            options={provinces}
                                            value={data.shipping_province_id}
                                            fallbackLabel={data.shipping_province_name}
                                            onChange={handleProvinceChange}
                                            placeholder="Pilih Provinsi"
                                            searchPlaceholder="Cari provinsi..."
                                            loading={loadingProvinces}
                                            emptyMessage="Provinsi tidak ditemukan."
                                        />
                                        {data.shipping_province_name && (
                                            <p className="text-[11px] text-muted-foreground font-medium">
                                                Terpilih: {data.shipping_province_name}
                                            </p>
                                        )}
                                    </div>

                                    {/* Kabupaten / Kota */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-foreground">
                                            Kabupaten / Kota <span className="text-destructive">*</span>
                                        </label>
                                        <SearchableSelect
                                            options={cities}
                                            value={data.shipping_city_id}
                                            fallbackLabel={data.shipping_city_name}
                                            onChange={handleCityChange}
                                            disabled={!data.shipping_province_id || loadingCities}
                                            loading={loadingCities}
                                            placeholder={
                                                !data.shipping_province_id
                                                    ? 'Pilih Provinsi Dahulu'
                                                    : 'Pilih Kabupaten / Kota'
                                            }
                                            searchPlaceholder="Cari kabupaten atau kota..."
                                            emptyMessage="Kota tidak ditemukan."
                                        />
                                        {data.shipping_city_name && (
                                            <p className="text-[11px] text-muted-foreground font-medium">
                                                Terpilih: {data.shipping_city_name}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                                    {/* Kecamatan (Origin ID Kunci Utama) */}
                                    <div className="space-y-1.5 p-3 rounded-xl bg-background border border-[#4A070B]/20">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-bold text-[#4A070B] dark:text-red-400 flex items-center gap-1.5">
                                                <MapPin className="size-3.5" />
                                                <span>Kecamatan (Origin ID)</span>
                                            </label>
                                            <Badge className="bg-[#4A070B] text-white text-[10px] font-bold">
                                                Wajib
                                            </Badge>
                                        </div>
                                        <SearchableSelect
                                            options={districts}
                                            value={data.shipping_district_id}
                                            fallbackLabel={data.shipping_district_name}
                                            onChange={handleDistrictChange}
                                            disabled={!data.shipping_city_id || loadingDistricts}
                                            loading={loadingDistricts}
                                            placeholder={
                                                !data.shipping_city_id
                                                    ? 'Pilih Kota Dahulu'
                                                    : 'Pilih Kecamatan'
                                            }
                                            searchPlaceholder="Cari kecamatan..."
                                            emptyMessage="Kecamatan tidak ditemukan."
                                        />
                                        <div className="flex items-center justify-between text-[11px] pt-0.5">
                                            <span className="text-muted-foreground">
                                                {data.shipping_district_name ? `Kec. ${data.shipping_district_name}` : 'Pilih kecamatan asal'}
                                            </span>
                                            {data.shipping_district_id && (
                                                <span className="font-mono font-bold text-[#4A070B] dark:text-red-400">
                                                    Kode: {data.shipping_district_id}
                                                </span>
                                            )}
                                        </div>
                                        {errors.shipping_district_id && (
                                            <p className="text-xs text-destructive">{errors.shipping_district_id}</p>
                                        )}
                                    </div>

                                    {/* Kelurahan & Kode Pos */}
                                    <div className="space-y-3">
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-foreground">
                                                Kelurahan / Desa <span className="text-muted-foreground font-normal">(Opsional)</span>
                                            </label>
                                            <Input
                                                type="text"
                                                value={data.shipping_subdistrict_name}
                                                onChange={(e) => setData('shipping_subdistrict_name', e.target.value)}
                                                placeholder="mis. Kramat Pela"
                                                className="h-10 text-xs rounded-xl"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-foreground">
                                                Kode Pos
                                            </label>
                                            <Input
                                                type="text"
                                                placeholder="Contoh: 12130"
                                                value={data.shipping_postal_code}
                                                onChange={(e) => setData('shipping_postal_code', e.target.value)}
                                                className="h-10 text-xs rounded-xl"
                                                maxLength={10}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Baris 3: Alamat Lengkap Penjemputan */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                                    <span>Alamat Lengkap Lokasi Butik (Jalan, No. Bangunan, Patokan)</span>
                                    <span className="text-destructive">*</span>
                                </label>
                                <Textarea
                                    placeholder="Contoh: Jl. Kemang Raya No. 10, RT 01 / RW 02, Bangka, Mampang Prapatan"
                                    rows={2}
                                    value={data.shipping_address}
                                    onChange={(e) => setData('shipping_address', e.target.value)}
                                    className="text-xs rounded-xl resize-none"
                                    required
                                />
                                {errors.shipping_address && (
                                    <p className="text-xs text-destructive">{errors.shipping_address}</p>
                                )}
                            </div>

                            {/* Baris 4: Titik Koordinat GPS & Peta Leaflet */}
                            <div className="space-y-3 border-t pt-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                                            <Compass className="size-3.5 text-[#4A070B] dark:text-red-400" />
                                            <span>Titik Koordinat Asal / Pickup (Peta Interaktif)</span>
                                        </h3>
                                        <p className="text-[11px] text-muted-foreground mt-0.5">
                                            Geser pin marker pada peta untuk menentukan titik akurat penjemputan armada kurir.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                                            <span>Latitude</span>
                                            <span className="text-[10px] text-muted-foreground font-mono">-90 s/d 90</span>
                                        </label>
                                        <Input
                                            type="number"
                                            step="any"
                                            placeholder="-6.2608"
                                            value={data.shipping_latitude}
                                            onChange={(e) => setData('shipping_latitude', e.target.value)}
                                            className="h-9 text-xs font-mono rounded-xl"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                                            <span>Longitude</span>
                                            <span className="text-[10px] text-muted-foreground font-mono">-180 s/d 180</span>
                                        </label>
                                        <Input
                                            type="number"
                                            step="any"
                                            placeholder="106.8152"
                                            value={data.shipping_longitude}
                                            onChange={(e) => setData('shipping_longitude', e.target.value)}
                                            className="h-9 text-xs font-mono rounded-xl"
                                        />
                                    </div>
                                </div>

                                {/* Leaflet Map Picker */}
                                <AddressMapPicker
                                    latitude={data.shipping_latitude ? Number(data.shipping_latitude) : null}
                                    longitude={data.shipping_longitude ? Number(data.shipping_longitude) : null}
                                    targetZoom={15}
                                    onChange={(lat, lng) => {
                                        setData((prev) => ({
                                            ...prev,
                                            shipping_latitude: String(lat),
                                            shipping_longitude: String(lng),
                                        }));
                                    }}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Bottom Save Action */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <Button
                            type="submit"
                            disabled={processing}
                            className="bg-[#4A070B] hover:bg-[#360407] text-white font-bold text-xs sm:text-sm h-11 px-8 rounded-xl shadow-xs transition active:scale-[0.98] cursor-pointer flex items-center gap-2"
                        >
                            <Save className="size-4" />
                            <span>{processing ? 'Menyimpan Pengaturan...' : 'Simpan Pengaturan Pengiriman'}</span>
                        </Button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}

