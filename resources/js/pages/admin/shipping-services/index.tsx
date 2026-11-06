import React, { useState, useRef, useEffect } from 'react';
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
    Save,
    Compass,
    ShieldCheck,
    Building2,
    Phone,
    Loader2,
    Package,
    Sparkles,
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
    useEffect(() => {
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
            subtitle="Kelola integrasi KurirAPI, saldo operasional resi, dan titik alamat origin butik."
        >
            <Head title="Layanan Pengiriman & Saldo - Admin Panel" />

            <form onSubmit={handleSubmit} className="w-full space-y-6 pb-12">
                {/* Header Action Bar - Consistent with Admin Design System */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 sm:p-6 rounded-2xl border shadow-xs">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="p-2 rounded-xl bg-[#4A070B]/10 text-[#4A070B] dark:bg-[#4A070B]/20 dark:text-red-400">
                                <Truck className="size-5" />
                            </span>
                            <h1 className="text-xl font-bold tracking-tight text-foreground">
                                Layanan Pengiriman &amp; Saldo Kurir
                            </h1>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                            Perhitungan ongkos kirim real-time dan penerbitan resi terintegrasi langsung dengan ekosistem KurirAPI.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <Button
                            type="submit"
                            disabled={processing}
                            className="bg-[#4A070B] hover:bg-[#380508] text-white shadow-xs gap-2 px-5 font-medium cursor-pointer"
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />
                                    <span>Menyimpan...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="size-4" />
                                    <span>Simpan Perubahan</span>
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* 3 Summary Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Saldo KurirAPI */}
                    <Card className="py-4 shadow-xs border-border/80">
                        <CardContent className="p-0 px-6">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">Saldo KurirAPI</span>
                                <Wallet className="size-4 text-emerald-500" />
                            </div>
                            <div className="text-2xl font-bold mt-2 font-mono text-foreground flex items-center justify-between">
                                <span>{balance.amount_formatted}</span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleRefreshBalance}
                                    disabled={isRefreshingBalance}
                                    className="size-7 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                                    title="Segarkan Saldo"
                                >
                                    <RotateCw className={`size-3.5 ${isRefreshingBalance ? 'animate-spin' : ''}`} />
                                </Button>
                            </div>
                            <div className="flex items-center justify-between mt-2 pt-2 border-t text-xs">
                                <span className="text-muted-foreground">{balance.currency} &bull; Pembuatan Resi</span>
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
                        </CardContent>
                    </Card>

                    {/* Gateway Logistik */}
                    <Card className="py-4 shadow-xs border-border/80">
                        <CardContent className="p-0 px-6">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">Gateway Ekspedisi</span>
                                <Truck className="size-4 text-primary" />
                            </div>
                            <div className="text-2xl font-bold mt-2 text-foreground">KurirAPI v2</div>
                            <div className="flex items-center justify-between mt-2 pt-2 border-t text-xs">
                                <span className="text-muted-foreground truncate">JNE, J&amp;T, SiCepat, Anteraja</span>
                                <Badge variant="outline" className="text-[10px] text-muted-foreground shrink-0">
                                    Multi-Kurir
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Origin Penjemputan Aktif */}
                    <Card className="py-4 shadow-xs border-border/80">
                        <CardContent className="p-0 px-6">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">Origin Penjemputan</span>
                                <MapPin className="size-4 text-amber-500" />
                            </div>
                            <div className="text-xl font-bold mt-2 text-foreground truncate">
                                {data.shipping_district_name || 'Belum Ditentukan'}
                            </div>
                            <div className="flex items-center justify-between mt-2 pt-2 border-t text-xs">
                                <span className="text-muted-foreground truncate">{data.shipping_city_name || '-'}</span>
                                <span className="font-mono text-[10px] font-bold text-muted-foreground shrink-0">
                                    ID: {data.shipping_district_id || '-'}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main 2-Column Form Layout - Consistent with Admin Settings */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column: API & Kontak Pengirim (lg:col-span-5) */}
                    <div className="lg:col-span-5 space-y-6">
                        {/* Kredensial API */}
                        <Card className="shadow-xs border-border/80">
                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-2 text-[#4A070B] dark:text-red-400">
                                    <KeyRound className="size-4.5" />
                                    <CardTitle className="text-base font-bold">Kredensial API (KurirAPI)</CardTitle>
                                </div>
                                <CardDescription className="text-xs">
                                    Kunci autentikasi resmi api.co.id untuk cek tarif &amp; pembuatan resi otomatis.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                                        <span>API Key (Header: x-api-co-id)</span>
                                        <button
                                            type="button"
                                            onClick={() => setShowApiKey(!showApiKey)}
                                            className="text-[11px] font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1 cursor-pointer select-none"
                                        >
                                            {showApiKey ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                                            <span>{showApiKey ? 'Sembunyikan' : 'Tampilkan'}</span>
                                        </button>
                                    </label>
                                    <Input
                                        type={showApiKey ? 'text' : 'password'}
                                        value={data.kurirapi_key}
                                        onChange={(e) => setData('kurirapi_key', e.target.value)}
                                        placeholder="test_E1FHospZPSTE8w8eSaIZBK9fzLOgSnr8oiTI74h5FusWZ"
                                        className="h-10 text-xs font-mono"
                                    />
                                    {errors.kurirapi_key && (
                                        <p className="text-xs text-destructive">{errors.kurirapi_key}</p>
                                    )}
                                </div>

                                <div className="p-3 rounded-xl bg-muted/30 border border-border/70 flex items-start gap-2.5 text-xs text-muted-foreground">
                                    <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                                    <p className="leading-relaxed text-[11px]">
                                        Biarkan kolom ini kosong jika ingin menggunakan API Key default dari environment file (.env).
                                    </p>
                                </div>

                                <div className="space-y-2 pt-2 border-t">
                                    <span className="text-[11px] font-semibold text-muted-foreground block">
                                        Ekspedisi Mitra yang Didukung:
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {['JNE', 'J&T Express', 'SiCepat', 'Anteraja', 'ID Express', 'Ninja Xpress', 'Lion Parcel'].map((courier) => (
                                            <Badge
                                                key={courier}
                                                variant="secondary"
                                                className="text-[10px] font-medium py-0.5 px-2 bg-muted/60"
                                            >
                                                {courier}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Kontak Pengirim Butik */}
                        <Card className="shadow-xs border-border/80">
                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-2 text-[#4A070B] dark:text-red-400">
                                    <Building2 className="size-4.5" />
                                    <CardTitle className="text-base font-bold">Identitas Pengirim Butik</CardTitle>
                                </div>
                                <CardDescription className="text-xs">
                                    Data pengirim resmi yang akan tercetak pada label resi dan manifes penjemputan paket.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                                        <span>Nama Pengirim / Butik Resmi</span>
                                        <span className="text-destructive">*</span>
                                    </label>
                                    <Input
                                        type="text"
                                        placeholder="Aroma Palace Official"
                                        value={data.shipping_sender_name}
                                        onChange={(e) => setData('shipping_sender_name', e.target.value)}
                                        className="h-10 text-sm"
                                        required
                                    />
                                    {errors.shipping_sender_name && (
                                        <p className="text-xs text-destructive">{errors.shipping_sender_name}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                                        <span className="flex items-center gap-1.5">
                                            <Phone className="size-3.5 text-muted-foreground" />
                                            <span>No. Telepon / WhatsApp Pengirim</span>
                                        </span>
                                        <span className="text-destructive">*</span>
                                    </label>
                                    <Input
                                        type="tel"
                                        placeholder="081288889999"
                                        value={data.shipping_sender_phone}
                                        onChange={(e) => setData('shipping_sender_phone', e.target.value)}
                                        className="h-10 text-sm"
                                        required
                                    />
                                    {errors.shipping_sender_phone && (
                                        <p className="text-xs text-destructive">{errors.shipping_sender_phone}</p>
                                    )}
                                    <p className="text-[11px] text-muted-foreground">
                                        Format: Awali dengan 08, 628, atau +628 (contoh: 081288889999).
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Alamat Origin & Peta Interaktif (lg:col-span-7) */}
                    <div className="lg:col-span-7 space-y-6">
                        <Card className="shadow-xs border-border/80">
                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-2 text-[#4A070B] dark:text-red-400">
                                    <MapPin className="size-4.5" />
                                    <CardTitle className="text-base font-bold">
                                        Alamat Origin Penjemputan (Pickup)
                                    </CardTitle>
                                </div>
                                <CardDescription className="text-xs">
                                    Alamat dan titik koordinat asal penjemputan paket butik yang digunakan mesin kalkulasi ongkos kirim.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                {/* Provinsi & Kabupaten/Kota */}
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
                                            <p className="text-[11px] text-muted-foreground">
                                                Terpilih: {data.shipping_province_name}
                                            </p>
                                        )}
                                        {errors.shipping_province_id && (
                                            <p className="text-xs text-destructive">{errors.shipping_province_id}</p>
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
                                            <p className="text-[11px] text-muted-foreground">
                                                Terpilih: {data.shipping_city_name}
                                            </p>
                                        )}
                                        {errors.shipping_city_id && (
                                            <p className="text-xs text-destructive">{errors.shipping_city_id}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Kecamatan (Origin ID Kunci Utama) */}
                                <div className="p-4 rounded-xl bg-muted/20 border border-[#4A070B]/20 dark:border-red-900/30 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-[#4A070B] dark:text-red-400 flex items-center gap-1.5">
                                            <MapPin className="size-3.5" />
                                            <span>Kecamatan (Origin ID Mesin Ongkir)</span>
                                        </label>
                                        <Badge className="bg-[#4A070B] text-white text-[10px] font-bold">
                                            Origin Utama
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
                                            {data.shipping_district_name ? `Kec. ${data.shipping_district_name}` : 'Pilih kecamatan asal butik'}
                                        </span>
                                        {data.shipping_district_id && (
                                            <span className="font-mono font-bold text-[#4A070B] dark:text-red-400">
                                                Kode: {data.shipping_district_id}
                                            </span>
                                        )}
                                    </div>
                                    {errors.shipping_district_id && (
                                        <p className="text-xs text-destructive font-medium">{errors.shipping_district_id}</p>
                                    )}
                                </div>

                                {/* Kelurahan & Kode Pos */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-foreground">
                                            Kelurahan / Desa <span className="text-muted-foreground font-normal">(Opsional)</span>
                                        </label>
                                        <Input
                                            type="text"
                                            value={data.shipping_subdistrict_name}
                                            onChange={(e) => setData('shipping_subdistrict_name', e.target.value)}
                                            placeholder="mis. Kramat Pela"
                                            className="h-10 text-sm"
                                        />
                                        {errors.shipping_subdistrict_name && (
                                            <p className="text-xs text-destructive">{errors.shipping_subdistrict_name}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-foreground">
                                            Kode Pos <span className="text-muted-foreground font-normal">(Opsional)</span>
                                        </label>
                                        <Input
                                            type="text"
                                            placeholder="Contoh: 12130"
                                            value={data.shipping_postal_code}
                                            onChange={(e) => setData('shipping_postal_code', e.target.value)}
                                            className="h-10 text-sm"
                                            maxLength={10}
                                        />
                                        {errors.shipping_postal_code && (
                                            <p className="text-xs text-destructive">{errors.shipping_postal_code}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Alamat Lengkap */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                                        <span>Alamat Lengkap Lokasi Butik (Jalan, No. Gedung, Patokan)</span>
                                        <span className="text-destructive">*</span>
                                    </label>
                                    <Textarea
                                        placeholder="Contoh: Jl. Kemang Raya No. 10, RT 01 / RW 02, Bangka, Mampang Prapatan"
                                        rows={3}
                                        value={data.shipping_address}
                                        onChange={(e) => setData('shipping_address', e.target.value)}
                                        className="text-sm resize-none"
                                        required
                                    />
                                    {errors.shipping_address && (
                                        <p className="text-xs text-destructive">{errors.shipping_address}</p>
                                    )}
                                </div>

                                {/* Titik Koordinat GPS & Peta Leaflet */}
                                <div className="space-y-3 pt-3 border-t">
                                    <div className="space-y-0.5">
                                        <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                            <Compass className="size-3.5 text-[#4A070B] dark:text-red-400" />
                                            <span>Titik Koordinat GPS &amp; Peta Penjemputan</span>
                                        </h3>
                                        <p className="text-[11px] text-muted-foreground">
                                            Geser pin marker pada peta untuk menentukan titik presisi penjemputan armada kurir.
                                        </p>
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
                                                className="h-9 text-xs font-mono"
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
                                                className="h-9 text-xs font-mono"
                                            />
                                        </div>
                                    </div>

                                    {/* Leaflet Map Picker */}
                                    <div className="rounded-xl overflow-hidden border">
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
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="flex items-center justify-end gap-3 pt-2">
                    <Button
                        type="submit"
                        disabled={processing}
                        className="bg-[#4A070B] hover:bg-[#380508] text-white shadow-xs gap-2 px-6 font-medium cursor-pointer"
                    >
                        {processing ? (
                            <>
                                <Loader2 className="size-4 animate-spin" />
                                <span>Menyimpan Pengaturan...</span>
                            </>
                        ) : (
                            <>
                                <Save className="size-4" />
                                <span>Simpan Pengaturan Pengiriman</span>
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </AdminLayout>
    );
}
