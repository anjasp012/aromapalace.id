import React, { useState, useEffect, useRef } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import {
    Building2,
    Phone,
    Mail,
    MessageSquare,
    MapPin,
    Truck,
    Save,
    AlertCircle,
    CheckCircle2,
    Sparkles,
    ShieldCheck,
    Store,
    Loader2,
    Key,
    Eye,
    EyeOff,
    ExternalLink,
    Compass,
    Smartphone,
    ArrowUpCircle,
    ShieldAlert,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import SearchableSelect, { SearchableOption } from '@/components/ui/searchable-select';
import AddressMapPicker from '@/components/AddressMapPicker';
import { fetchCoverageUntilNotEmpty } from '@/lib/coverage-fetcher';

interface SettingsIndexProps {
    settings: Record<string, any>;
    initial_provinces?: SearchableOption[];
    initial_cities?: SearchableOption[];
    initial_districts?: SearchableOption[];
    initial_subdistricts?: SearchableOption[];
}

export default function SettingsIndex({
    settings = {},
    initial_provinces = [],
    initial_cities = [],
    initial_districts = [],
    initial_subdistricts = [],
}: SettingsIndexProps) {
    const { data, setData, post, processing, errors } = useForm({
        // Kontak & Profil Toko
        store_name: settings.store_name || '',
        store_email: settings.store_email || '',
        store_phone: settings.store_phone || '',
        store_whatsapp: settings.store_whatsapp || '',
        store_description: settings.store_description || '',

        // Integrasi KiriminAja (Kredensial & Logistik)
        kiriminaja_mode: settings.kiriminaja_mode || 'staging',
        kiriminaja_api_key: settings.kiriminaja_api_key || '',
        kiriminaja_prefix: settings.kiriminaja_prefix || 'ARPL',
        kiriminaja_pin: settings.kiriminaja_pin || '123456',
        // Alamat Origin Pengiriman & KiriminAja
        shipping_sender_name: settings.shipping_sender_name || '',
        shipping_sender_phone: settings.shipping_sender_phone || '',
        shipping_address: settings.shipping_address || '',
        shipping_province_id: settings.shipping_province_id ? Number(settings.shipping_province_id) : '',
        shipping_province_name: settings.shipping_province_name || '',
        shipping_city_id: settings.shipping_city_id ? Number(settings.shipping_city_id) : '',
        shipping_city_name: settings.shipping_city_name || '',
        shipping_district_id: settings.shipping_district_id ? Number(settings.shipping_district_id) : '',
        shipping_district_name: settings.shipping_district_name || '',
        shipping_subdistrict_id: settings.shipping_subdistrict_id ? Number(settings.shipping_subdistrict_id) : '',
        shipping_subdistrict_name: settings.shipping_subdistrict_name || '',
        shipping_postal_code: settings.shipping_postal_code || '',
        shipping_latitude: settings.shipping_latitude !== undefined && settings.shipping_latitude !== null && settings.shipping_latitude !== ''
            ? settings.shipping_latitude
            : (settings.latitude ?? ''),
        shipping_longitude: settings.shipping_longitude !== undefined && settings.shipping_longitude !== null && settings.shipping_longitude !== ''
            ? settings.shipping_longitude
            : (settings.longitude ?? ''),

        // Mobile App Update (Capacitor)
        app_min_version: settings.app_min_version || '1.0.0',
        app_latest_version: settings.app_latest_version || '1.0.0',
        app_force_update: Boolean(settings.app_force_update === '1' || settings.app_force_update === true || settings.app_force_update === 1),
        app_update_title: settings.app_update_title || 'Pembaruan Aplikasi Tersedia',
        app_update_message: settings.app_update_message || 'Versi baru aplikasi Aroma Palace telah tersedia dengan peningkatan fitur dan stabilitas. Mohon perbarui aplikasi Anda untuk melanjutkan berbelanja.',
        app_playstore_url: settings.app_playstore_url || 'https://play.google.com/store/apps/details?id=com.aromapalace.app',
        app_appstore_url: settings.app_appstore_url || 'https://apps.apple.com/app/aromapalace/id6740000000',
    });

    const [showApiKey, setShowApiKey] = useState(false);

    // Coverage hierarchy lists initialized with server-side preloaded data or database values
    const [provinces, setProvinces] = useState<SearchableOption[]>(() => {
        if (initial_provinces && initial_provinces.length > 0) return initial_provinces;
        if (settings.shipping_province_id && settings.shipping_province_name) {
            return [{ id: Number(settings.shipping_province_id), name: settings.shipping_province_name }];
        }
        return [];
    });
    const [cities, setCities] = useState<SearchableOption[]>(() => {
        if (initial_cities && initial_cities.length > 0) return initial_cities;
        if (settings.shipping_city_id && settings.shipping_city_name) {
            return [{ id: Number(settings.shipping_city_id), name: settings.shipping_city_name }];
        }
        return [];
    });
    const [districts, setDistricts] = useState<SearchableOption[]>(() => {
        if (initial_districts && initial_districts.length > 0) return initial_districts;
        if (settings.shipping_district_id && settings.shipping_district_name) {
            return [{ id: Number(settings.shipping_district_id), name: settings.shipping_district_name }];
        }
        return [];
    });
    const [subdistricts, setSubdistricts] = useState<SearchableOption[]>(() => {
        if (initial_subdistricts && initial_subdistricts.length > 0) return initial_subdistricts;
        if (settings.shipping_subdistrict_id && settings.shipping_subdistrict_name) {
            return [{ id: Number(settings.shipping_subdistrict_id), name: settings.shipping_subdistrict_name, postal_code: settings.shipping_postal_code || '' }];
        }
        return [];
    });

    // Loading indicators
    const [loadingProvinces, setLoadingProvinces] = useState(false);
    const [loadingCities, setLoadingCities] = useState(false);
    const [loadingDistricts, setLoadingDistricts] = useState(false);
    const [loadingSubdistricts, setLoadingSubdistricts] = useState(false);

    // Abort controller refs for auto-retrying coverage requests
    const provincesAbortRef = useRef<AbortController | null>(null);
    const citiesAbortRef = useRef<AbortController | null>(null);
    const districtsAbortRef = useRef<AbortController | null>(null);
    const subdistrictsAbortRef = useRef<AbortController | null>(null);

    // Initial load of provinces & dependent hierarchy if already configured
    useEffect(() => {
        if (provinces.length <= 1) {
            provincesAbortRef.current?.abort();
            const controller = new AbortController();
            provincesAbortRef.current = controller;
            setLoadingProvinces(true);
            fetchCoverageUntilNotEmpty<SearchableOption>(
                '/api/coverage/provinces',
                (data) => {
                    setProvinces(data);
                    setLoadingProvinces(false);
                },
                controller.signal
            );
        }

        // Pre-fill cities if province exists and full list not yet loaded
        if (data.shipping_province_id && cities.length <= 1) {
            citiesAbortRef.current?.abort();
            const controller = new AbortController();
            citiesAbortRef.current = controller;
            setLoadingCities(true);
            fetchCoverageUntilNotEmpty<SearchableOption>(
                `/api/coverage/cities?province_id=${data.shipping_province_id}`,
                (data) => {
                    setCities(data);
                    setLoadingCities(false);
                },
                controller.signal
            );
        }

        // Pre-fill districts if city exists and full list not yet loaded
        if (data.shipping_city_id && districts.length <= 1) {
            districtsAbortRef.current?.abort();
            const controller = new AbortController();
            districtsAbortRef.current = controller;
            setLoadingDistricts(true);
            fetchCoverageUntilNotEmpty<SearchableOption>(
                `/api/coverage/districts?city_id=${data.shipping_city_id}`,
                (data) => {
                    setDistricts(data);
                    setLoadingDistricts(false);
                },
                controller.signal
            );
        }

        // Pre-fill subdistricts if district exists and full list not yet loaded
        if (data.shipping_district_id && subdistricts.length <= 1) {
            subdistrictsAbortRef.current?.abort();
            const controller = new AbortController();
            subdistrictsAbortRef.current = controller;
            setLoadingSubdistricts(true);
            fetchCoverageUntilNotEmpty<SearchableOption>(
                `/api/coverage/subdistricts?district_id=${data.shipping_district_id}`,
                (data) => {
                    setSubdistricts(data);
                    setLoadingSubdistricts(false);
                },
                controller.signal
            );
        }

        return () => {
            provincesAbortRef.current?.abort();
            citiesAbortRef.current?.abort();
            districtsAbortRef.current?.abort();
            subdistrictsAbortRef.current?.abort();
        };
    }, []);

    // Handlers for cascaded regional selection
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
            shipping_subdistrict_id: '',
            shipping_subdistrict_name: '',
            shipping_postal_code: '',
        }));

        citiesAbortRef.current?.abort();
        districtsAbortRef.current?.abort();
        subdistrictsAbortRef.current?.abort();

        setCities([]);
        setDistricts([]);
        setSubdistricts([]);

        if (idNum) {
            citiesAbortRef.current?.abort();
            const controller = new AbortController();
            citiesAbortRef.current = controller;
            setLoadingCities(true);
            fetchCoverageUntilNotEmpty<SearchableOption>(
                `/api/coverage/cities?province_id=${idNum}`,
                (data) => {
                    setCities(data);
                    setLoadingCities(false);
                },
                controller.signal
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
            shipping_subdistrict_id: '',
            shipping_subdistrict_name: '',
            shipping_postal_code: '',
        }));

        districtsAbortRef.current?.abort();
        subdistrictsAbortRef.current?.abort();

        setDistricts([]);
        setSubdistricts([]);

        if (idNum) {
            districtsAbortRef.current?.abort();
            const controller = new AbortController();
            districtsAbortRef.current = controller;
            setLoadingDistricts(true);
            fetchCoverageUntilNotEmpty<SearchableOption>(
                `/api/coverage/districts?city_id=${idNum}`,
                (data) => {
                    setDistricts(data);
                    setLoadingDistricts(false);
                },
                controller.signal
            );
        }
    };

    const handleDistrictChange = (districtId: number | string, option?: SearchableOption) => {
        const idNum = Number(districtId);
        setData((prev) => ({
            ...prev,
            shipping_district_id: idNum,
            shipping_district_name: option?.name || '',
            shipping_subdistrict_id: '',
            shipping_subdistrict_name: '',
            shipping_postal_code: '',
        }));

        subdistrictsAbortRef.current?.abort();

        setSubdistricts([]);

        if (idNum) {
            subdistrictsAbortRef.current?.abort();
            const controller = new AbortController();
            subdistrictsAbortRef.current = controller;
            setLoadingSubdistricts(true);
            fetchCoverageUntilNotEmpty<SearchableOption>(
                `/api/coverage/subdistricts?district_id=${idNum}`,
                (data) => {
                    setSubdistricts(data);
                    setLoadingSubdistricts(false);
                },
                controller.signal
            );
        }
    };

    const handleSubdistrictChange = (subdistrictId: number | string, option?: SearchableOption) => {
        const idNum = Number(subdistrictId);
        setData((prev) => ({
            ...prev,
            shipping_subdistrict_id: idNum,
            shipping_subdistrict_name: option?.name || '',
            shipping_postal_code: option?.postal_code || prev.shipping_postal_code || '',
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/pengaturan', {
            preserveScroll: true,
        });
    };

    return (
        <AdminLayout
            title="Pengaturan Toko & Pengiriman"
            subtitle="Kelola profil kontak official toko dan alamat asal (origin) ekspedisi KiriminAja"
        >
            <Head title="Pengaturan Toko & Pengiriman - Admin Aroma Palace" />

            <form onSubmit={handleSubmit} className="w-full space-y-6 pb-12">
                {/* Header Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 sm:p-6 rounded-2xl border shadow-xs">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="p-2 rounded-xl bg-[#4A070B]/10 text-[#4A070B] dark:bg-[#4A070B]/20 dark:text-red-400">
                                <Store className="size-5" />
                            </span>
                            <h1 className="text-xl font-bold tracking-tight text-foreground">
                                Pengaturan Toko &amp; Origin KiriminAja
                            </h1>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                            Data kontak akan ditampilkan pada invoice dan CS pelanggan. Alamat asal digunakan oleh mesin ongkir KiriminAja untuk kalkulasi tarif dan pickup otomatis kurir.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <Button
                            type="submit"
                            disabled={processing}
                            className="bg-[#4A070B] hover:bg-[#380508] text-white shadow-sm gap-2 px-5 font-medium"
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

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* BAGIAN 1: KONTAK & PROFIL TOKO */}
                    <div className="lg:col-span-5 space-y-6">
                        <Card className="shadow-xs border-border/80">
                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-2 text-[#4A070B] dark:text-red-400">
                                    <Building2 className="size-4.5" />
                                    <CardTitle className="text-base font-bold">Profil &amp; Kontak Toko</CardTitle>
                                </div>
                                <CardDescription className="text-xs">
                                    Informasi identitas butik resmi Aroma Palace yang tertera pada invoice dan dukungan pelanggan.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Nama Toko */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                                        <span>Nama Toko / Brand</span>
                                        <span className="text-destructive">*</span>
                                    </label>
                                    <Input
                                        type="text"
                                        placeholder="Aroma Palace Official"
                                        value={data.store_name}
                                        onChange={(e) => setData('store_name', e.target.value)}
                                        className="h-10 text-sm"
                                        required
                                    />
                                    {errors.store_name && (
                                        <p className="text-xs text-destructive">{errors.store_name}</p>
                                    )}
                                </div>

                                {/* Email Resmi */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                        <Mail className="size-3.5 text-muted-foreground" />
                                        <span>Email Dukungan / CS</span>
                                    </label>
                                    <Input
                                        type="email"
                                        placeholder="support@aromapalace.id"
                                        value={data.store_email}
                                        onChange={(e) => setData('store_email', e.target.value)}
                                        className="h-10 text-sm"
                                    />
                                    {errors.store_email && (
                                        <p className="text-xs text-destructive">{errors.store_email}</p>
                                    )}
                                </div>

                                {/* Nomor Telepon */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                        <Phone className="size-3.5 text-muted-foreground" />
                                        <span>Nomor Telepon Toko</span>
                                    </label>
                                    <Input
                                        type="tel"
                                        placeholder="081288889999"
                                        value={data.store_phone}
                                        onChange={(e) => setData('store_phone', e.target.value)}
                                        className="h-10 text-sm"
                                    />
                                    {errors.store_phone && (
                                        <p className="text-xs text-destructive">{errors.store_phone}</p>
                                    )}
                                </div>

                                {/* WhatsApp Official */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                        <MessageSquare className="size-3.5 text-emerald-600" />
                                        <span>WhatsApp Customer Service</span>
                                    </label>
                                    <Input
                                        type="tel"
                                        placeholder="6281288889999"
                                        value={data.store_whatsapp}
                                        onChange={(e) => setData('store_whatsapp', e.target.value)}
                                        className="h-10 text-sm"
                                    />
                                    <p className="text-[11px] text-muted-foreground">
                                        Gunakan format internasional (contoh: 6281234567890) untuk integrasi tombol chat WhatsApp langsung.
                                    </p>
                                    {errors.store_whatsapp && (
                                        <p className="text-xs text-destructive">{errors.store_whatsapp}</p>
                                    )}
                                </div>

                                {/* Deskripsi / Tagline Toko */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                        <Sparkles className="size-3.5 text-amber-600" />
                                        <span>Slogan / Deskripsi Singkat</span>
                                    </label>
                                    <Textarea
                                        placeholder="Destinasi eksklusif wewangian mewah berkelas dunia..."
                                        rows={3}
                                        value={data.store_description}
                                        onChange={(e) => setData('store_description', e.target.value)}
                                        className="text-sm resize-none"
                                    />
                                    {errors.store_description && (
                                        <p className="text-xs text-destructive">{errors.store_description}</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* BAGIAN 1B: INTEGRASI KIRIMINAJA (MODE & API KEY) */}
                        <Card className="shadow-xs border-border/80">
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-[#4A070B] dark:text-red-400">
                                        <Key className="size-4.5" />
                                        <CardTitle className="text-base font-bold">Integrasi KiriminAja</CardTitle>
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className={
                                            data.kiriminaja_mode === 'production'
                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300 font-semibold text-[11px]'
                                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300 font-semibold text-[11px]'
                                        }
                                    >
                                        {data.kiriminaja_mode === 'production' ? 'Production (Live)' : 'Staging (Sandbox)'}
                                    </Badge>
                                </div>
                                <CardDescription className="text-xs">
                                    Kredensial API KiriminAja resmi untuk cek ongkir otomatis dan penerbitan Resi Otomatis (Request Pickup kurir).
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Mode Selection */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                                        <span>Mode Lingkungan API</span>
                                        <span className="text-destructive">*</span>
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setData('kiriminaja_mode', 'staging')}
                                            className={`p-2.5 rounded-xl border text-left transition-all ${
                                                data.kiriminaja_mode === 'staging'
                                                    ? 'border-amber-500 bg-amber-500/10 text-amber-950 dark:text-amber-200 ring-1 ring-amber-500'
                                                    : 'border-border/80 hover:bg-muted/40 text-muted-foreground'
                                            }`}
                                        >
                                            <div className="font-bold text-xs">Staging (Sandbox)</div>
                                            <div className="text-[10px] opacity-80 mt-0.5">tdev.kiriminaja.com (Uji coba)</div>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setData('kiriminaja_mode', 'production')}
                                            className={`p-2.5 rounded-xl border text-left transition-all ${
                                                data.kiriminaja_mode === 'production'
                                                    ? 'border-[#4A070B] bg-[#4A070B]/10 text-[#4A070B] dark:text-red-300 ring-1 ring-[#4A070B]'
                                                    : 'border-border/80 hover:bg-muted/40 text-muted-foreground'
                                            }`}
                                        >
                                            <div className="font-bold text-xs">Production (Live)</div>
                                            <div className="text-[10px] opacity-80 mt-0.5">client.kiriminaja.com (Nyata)</div>
                                        </button>
                                    </div>
                                    {errors.kiriminaja_mode && (
                                        <p className="text-xs text-destructive">{errors.kiriminaja_mode}</p>
                                    )}
                                </div>

                                {/* API Key Input */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-semibold text-foreground">
                                            API Key / Token KiriminAja
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setShowApiKey(!showApiKey)}
                                            className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 font-medium"
                                        >
                                            {showApiKey ? (
                                                <>
                                                    <EyeOff className="size-3" />
                                                    <span>Sembunyikan</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Eye className="size-3" />
                                                    <span>Lihat Token</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <Input
                                            type={showApiKey ? 'text' : 'password'}
                                            placeholder="v4.local... atau token production dari KiriminAja"
                                            value={data.kiriminaja_api_key}
                                            onChange={(e) => setData('kiriminaja_api_key', e.target.value)}
                                            className="h-10 text-xs font-mono pr-9"
                                        />
                                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                                            <Key className="size-3.5" />
                                        </div>
                                    </div>
                                    {errors.kiriminaja_api_key && (
                                        <p className="text-xs text-destructive">{errors.kiriminaja_api_key}</p>
                                    )}

                                    {/* Warning banner for Staging Token in Production Mode */}
                                    {data.kiriminaja_mode === 'production' && data.kiriminaja_api_key?.startsWith('v4.local.') && (
                                        <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2">
                                            <AlertCircle className="size-4 shrink-0 mt-0.5 text-amber-600" />
                                            <div className="leading-relaxed">
                                                <strong>Perhatian:</strong> Token saat ini berawalan <code>v4.local...</code> (token Staging/Sandbox). Server KiriminAja Production akan menolak token ini dengan status <code>Unauthorized.</code>. Masukkan API Key Production dari dashboard KiriminAja Anda, atau ubah mode ke <strong>Staging</strong>.
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Prefix Order ID */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                                        <span>Prefix Order ID KiriminAja</span>
                                        <span className="text-[10px] text-muted-foreground font-mono">Maks. 10 karakter</span>
                                    </label>
                                    <Input
                                        type="text"
                                        placeholder="ARPL"
                                        value={data.kiriminaja_prefix}
                                        onChange={(e) => setData('kiriminaja_prefix', e.target.value.toUpperCase())}
                                        maxLength={10}
                                        className="h-9 text-xs font-mono font-bold uppercase tracking-wider"
                                    />
                                    <p className="text-[11px] text-muted-foreground">
                                        Prefix terdaftar di akun KiriminAja Anda (default: <code>ARPL</code>). Paket resi otomatis wajib diawali prefix ini.
                                    </p>
                                    {errors.kiriminaja_prefix && (
                                        <p className="text-xs text-destructive">{errors.kiriminaja_prefix}</p>
                                    )}
                                </div>

                                {/* PIN Transaksi KiriminAja */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                                        <span>PIN Transaksi KiriminAja</span>
                                        <span className="text-[10px] text-muted-foreground font-mono">6 digit angka</span>
                                    </label>
                                    <Input
                                        type="password"
                                        inputMode="numeric"
                                        placeholder="123456"
                                        value={data.kiriminaja_pin}
                                        onChange={(e) => setData('kiriminaja_pin', e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        maxLength={6}
                                        className="h-9 text-xs font-mono tracking-widest"
                                    />
                                    <p className="text-[11px] text-muted-foreground">
                                        PIN otorisasi akun KiriminAja (KA Credit) untuk pemotongan ongkir saat request pickup otomatis.
                                    </p>
                                    {errors.kiriminaja_pin && (
                                        <p className="text-xs text-destructive">{errors.kiriminaja_pin}</p>
                                    )}
                                </div>

                            </CardContent>
                        </Card>

                        {/* BAGIAN TAMBAHAN: PEMBARUAN APLIKASI MOBILE (CAPACITOR) */}
                        <Card className="shadow-xs border-border/80">
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-[#4A070B] dark:text-red-400">
                                        <Smartphone className="size-4.5" />
                                        <CardTitle className="text-base font-bold">Pembaruan Aplikasi Mobile</CardTitle>
                                    </div>
                                    <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300 gap-1 text-[11px]">
                                        <ArrowUpCircle className="size-3" />
                                        Capacitor OTA
                                    </Badge>
                                </div>
                                <CardDescription className="text-xs">
                                    Kontrol versi aplikasi mobile Android &amp; iOS. Atur versi rilis terbaru dan tentukan apakah pembaruan bersifat wajib (force update modal tidak bisa ditutup) atau opsional.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Toggle Wajib Update */}
                                <label className="flex items-start gap-3 p-3 rounded-xl border border-border/80 bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(data.app_force_update)}
                                        onChange={(e) => setData('app_force_update', e.target.checked)}
                                        className="size-4 mt-0.5 rounded border-gray-300 text-[#4A070B] focus:ring-[#4A070B]"
                                    />
                                    <div className="flex-1 space-y-1">
                                        <div className="text-xs font-semibold text-foreground flex items-center gap-2">
                                            <span>Wajib Update (Kunci Aplikasi)</span>
                                            {data.app_force_update ? (
                                                <Badge variant="destructive" className="text-[10px] py-0 px-1.5 h-4">
                                                    Wajib Aktif
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 text-muted-foreground">
                                                    Opsional
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                                            Bila diaktifkan, dialog pembaruan di aplikasi mobile tidak dapat ditutup dan tombol back dinonaktifkan sampai pengguna memperbarui aplikasi.
                                        </p>
                                    </div>
                                </label>

                                {/* Input Versi */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                                            <span>Versi Minimum yang Diizinkan</span>
                                            <span className="text-[10px] text-muted-foreground font-mono">Semver</span>
                                        </label>
                                        <Input
                                            type="text"
                                            placeholder="1.0.0"
                                            value={data.app_min_version}
                                            onChange={(e) => setData('app_min_version', e.target.value)}
                                            className="h-9 text-xs font-mono"
                                        />
                                        <p className="text-[10px] text-muted-foreground">
                                            Versi di bawah ini otomatis dipaksa update (wajib).
                                        </p>
                                        {errors.app_min_version && (
                                            <p className="text-xs text-destructive">{errors.app_min_version}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                                            <span>Versi Terbaru di App Store</span>
                                            <span className="text-[10px] text-muted-foreground font-mono">Semver</span>
                                        </label>
                                        <Input
                                            type="text"
                                            placeholder="1.1.0"
                                            value={data.app_latest_version}
                                            onChange={(e) => setData('app_latest_version', e.target.value)}
                                            className="h-9 text-xs font-mono"
                                        />
                                        <p className="text-[10px] text-muted-foreground">
                                            Nomor versi rilis terbaru yang siap diunduh.
                                        </p>
                                        {errors.app_latest_version && (
                                            <p className="text-xs text-destructive">{errors.app_latest_version}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Judul & Pesan Update */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">
                                        Judul Notifikasi Pembaruan
                                    </label>
                                    <Input
                                        type="text"
                                        placeholder="Pembaruan Aplikasi Tersedia"
                                        value={data.app_update_title}
                                        onChange={(e) => setData('app_update_title', e.target.value)}
                                        className="h-9 text-xs"
                                    />
                                    {errors.app_update_title && (
                                        <p className="text-xs text-destructive">{errors.app_update_title}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">
                                        Pesan Pembaruan / Catatan Rilis
                                    </label>
                                    <Textarea
                                        rows={3}
                                        placeholder="Tuliskan catatan rilis fitur baru atau perbaikan bug..."
                                        value={data.app_update_message}
                                        onChange={(e) => setData('app_update_message', e.target.value)}
                                        className="text-xs resize-none"
                                    />
                                    {errors.app_update_message && (
                                        <p className="text-xs text-destructive">{errors.app_update_message}</p>
                                    )}
                                </div>

                                {/* URL Store */}
                                <div className="space-y-3 pt-1">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-foreground">
                                            URL Google Play Store (Android)
                                        </label>
                                        <Input
                                            type="url"
                                            placeholder="https://play.google.com/store/apps/details?id=com.aromapalace.app"
                                            value={data.app_playstore_url}
                                            onChange={(e) => setData('app_playstore_url', e.target.value)}
                                            className="h-9 text-xs font-mono"
                                        />
                                        {errors.app_playstore_url && (
                                            <p className="text-xs text-destructive">{errors.app_playstore_url}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-foreground">
                                            URL Apple App Store (iOS)
                                        </label>
                                        <Input
                                            type="url"
                                            placeholder="https://apps.apple.com/app/aromapalace/id6740000000"
                                            value={data.app_appstore_url}
                                            onChange={(e) => setData('app_appstore_url', e.target.value)}
                                            className="h-9 text-xs font-mono"
                                        />
                                        {errors.app_appstore_url && (
                                            <p className="text-xs text-destructive">{errors.app_appstore_url}</p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* BAGIAN 2: ALAMAT ASAL & ORIGIN KIRIMINAJA */}
                    <div className="lg:col-span-7 space-y-6">
                        <Card className="shadow-xs border-border/80">
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-[#4A070B] dark:text-red-400">
                                        <Truck className="size-4.5" />
                                        <CardTitle className="text-base font-bold">Alamat Asal &amp; Origin KiriminAja</CardTitle>
                                    </div>
                                    {data.shipping_district_id ? (
                                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300 gap-1.5 font-mono text-[11px]">
                                            <ShieldCheck className="size-3.5" />
                                            Origin ID: #{data.shipping_district_id}
                                        </Badge>
                                    ) : (
                                        <Badge variant="destructive" className="text-[11px]">
                                            Origin Belum Diatur
                                        </Badge>
                                    )}
                                </div>
                                <CardDescription className="text-xs">
                                    Lokasi fisik gudang atau butik pengiriman tempat kurir (JNE, SiCepat, J&amp;T, Ninja, Anteraja, dll.) menjemput (pickup) paket pesanan.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Nama Pengirim & HP Pengirim */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                                            <span>Nama Pengirim / Gudang</span>
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
                                            <span>Nomor HP Kontak Pickup</span>
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
                                        <p className="text-[11px] text-muted-foreground">
                                            Format KiriminAja: Harus dimulai dengan 08, 628, +628, atau 02.
                                        </p>
                                        {errors.shipping_sender_phone && (
                                            <p className="text-xs text-destructive">{errors.shipping_sender_phone}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Alamat Lengkap / Jalan */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                                        <span>Alamat Jalan &amp; Rincian Gudang / Butik</span>
                                        <span className="text-destructive">*</span>
                                    </label>
                                    <Textarea
                                        placeholder="Contoh: Jl. Kemang Raya No. 10, RT 01 / RW 02, Bangka, Mampang Prapatan"
                                        rows={2}
                                        value={data.shipping_address}
                                        onChange={(e) => setData('shipping_address', e.target.value)}
                                        className="text-sm resize-none"
                                        required
                                    />
                                    {errors.shipping_address && (
                                        <p className="text-xs text-destructive">{errors.shipping_address}</p>
                                    )}
                                </div>

                                <div className="border-t pt-4">
                                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                                        Wilayah Cakupan Resmi (Database KiriminAja)
                                    </h3>

                                    {/* Hierarchy: Provinsi & Kota/Kabupaten */}
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

                                        {/* Kota / Kabupaten */}
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

                                    {/* Hierarchy: Kecamatan (Origin ID) & Kelurahan */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                                        {/* Kecamatan (Kunci Utama KiriminAja) */}
                                        <div className="space-y-1.5 p-3 rounded-xl bg-muted/40 border border-[#4A070B]/20">
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs font-bold text-[#4A070B] dark:text-red-400 flex items-center gap-1.5">
                                                    <MapPin className="size-3.5" />
                                                    <span>Kecamatan (Origin ID)</span>
                                                </label>
                                                <span className="text-[10px] bg-[#4A070B] text-white px-2 py-0.5 rounded-full font-semibold">
                                                    Wajib
                                                </span>
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
                                            <div className="flex items-center justify-between text-[11px]">
                                                <span className="text-muted-foreground">
                                                    {data.shipping_district_name ? `Kec. ${data.shipping_district_name}` : 'Pilih kecamatan asal'}
                                                </span>
                                                {data.shipping_district_id && (
                                                    <span className="font-mono font-bold text-[#4A070B] dark:text-red-400">
                                                        ID: {data.shipping_district_id}
                                                    </span>
                                                )}
                                            </div>
                                            {errors.shipping_district_id && (
                                                <p className="text-xs text-destructive">{errors.shipping_district_id}</p>
                                            )}
                                        </div>

                                        {/* Kelurahan & Kode Pos */}
                                        <div className="space-y-4">
                                            {/* Kelurahan */}
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-foreground">
                                                    Kelurahan / Desa
                                                </label>
                                                <SearchableSelect
                                                    options={subdistricts}
                                                    value={data.shipping_subdistrict_id}
                                                    fallbackLabel={data.shipping_subdistrict_name}
                                                    onChange={handleSubdistrictChange}
                                                    disabled={!data.shipping_district_id || loadingSubdistricts}
                                                    loading={loadingSubdistricts}
                                                    placeholder={
                                                        !data.shipping_district_id
                                                            ? 'Pilih Kecamatan Dahulu'
                                                            : 'Pilih Kelurahan / Desa'
                                                    }
                                                    searchPlaceholder="Cari kelurahan..."
                                                    emptyMessage="Kelurahan tidak ditemukan."
                                                />
                                                {data.shipping_subdistrict_name && (
                                                    <p className="text-[11px] text-muted-foreground font-medium">
                                                        Kel. {data.shipping_subdistrict_name}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Kode Pos */}
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-foreground">
                                                    Kode Pos
                                                </label>
                                                <Input
                                                    type="text"
                                                    placeholder="Contoh: 12730"
                                                    value={data.shipping_postal_code}
                                                    onChange={(e) => setData('shipping_postal_code', e.target.value)}
                                                    className="h-9 text-sm"
                                                    maxLength={10}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Koordinat GPS (Latitude & Longitude) */}
                                <div className="border-t pt-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                                                <Compass className="size-3.5 text-[#4A070B] dark:text-red-400" />
                                                <span>Titik Koordinat Asal / Pickup (Latitude &amp; Longitude)</span>
                                            </h3>
                                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                                Digunakan untuk akurasi penjemputan armada kurir (Instant/Same Day/Ekspedisi) dan penentuan rute penjemputan.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Latitude */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                                                <span>Latitude</span>
                                                <span className="text-[10px] text-muted-foreground font-mono">-90 s/d 90</span>
                                            </label>
                                            <Input
                                                type="number"
                                                step="any"
                                                placeholder="Contoh: -6.260714"
                                                value={data.shipping_latitude}
                                                onChange={(e) => setData('shipping_latitude', e.target.value)}
                                                className="h-9 text-xs font-mono"
                                            />
                                            {errors.shipping_latitude && (
                                                <p className="text-xs text-destructive">{errors.shipping_latitude}</p>
                                            )}
                                        </div>

                                        {/* Longitude */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                                                <span>Longitude</span>
                                                <span className="text-[10px] text-muted-foreground font-mono">-180 s/d 180</span>
                                            </label>
                                            <Input
                                                type="number"
                                                step="any"
                                                placeholder="Contoh: 106.816635"
                                                value={data.shipping_longitude}
                                                onChange={(e) => setData('shipping_longitude', e.target.value)}
                                                className="h-9 text-xs font-mono"
                                            />
                                            {errors.shipping_longitude && (
                                                <p className="text-xs text-destructive">{errors.shipping_longitude}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Interactive Map Picker */}
                                    <AddressMapPicker
                                        latitude={data.shipping_latitude}
                                        longitude={data.shipping_longitude}
                                        onChange={(lat, lng) => {
                                            setData((prev) => ({
                                                ...prev,
                                                shipping_latitude: lat,
                                                shipping_longitude: lng,
                                            }));
                                        }}
                                        height="220px"
                                    />
                                </div>

                                {/* Active Summary Confirmation Box */}
                                <div className="mt-4 p-4 rounded-xl bg-card border border-border/80 text-xs space-y-1.5">
                                    <div className="font-semibold text-foreground flex items-center gap-1.5">
                                        <CheckCircle2 className="size-3.5 text-emerald-600" />
                                        <span>Ringkasan Alamat Asal Pengiriman Aktif:</span>
                                    </div>
                                    <p className="text-muted-foreground leading-relaxed">
                                        {data.shipping_sender_name || 'Aroma Palace'} ({data.shipping_sender_phone || '-'}), {data.shipping_address || 'Belum diatur'}{' '}
                                        {data.shipping_subdistrict_name && `, Kel. ${data.shipping_subdistrict_name}`}
                                        {data.shipping_district_name && `, Kec. ${data.shipping_district_name}`}
                                        {data.shipping_city_name && `, ${data.shipping_city_name}`}
                                        {data.shipping_province_name && `, ${data.shipping_province_name}`}
                                        {data.shipping_postal_code && ` ${data.shipping_postal_code}`}.
                                    </p>
                                    {data.shipping_latitude && data.shipping_longitude && (
                                        <div className="pt-1 flex items-center gap-1.5 text-[11px] font-mono text-[#4A070B] dark:text-red-300">
                                            <MapPin className="size-3 shrink-0" />
                                            <span>Koordinat Asal: {data.shipping_latitude}, {data.shipping_longitude}</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Bottom Submit Action */}
                <div className="flex items-center justify-end gap-3 pt-2">
                    <Button
                        type="submit"
                        disabled={processing}
                        size="lg"
                        className="bg-[#4A070B] hover:bg-[#380508] text-white shadow-md gap-2 px-8 font-semibold rounded-xl"
                    >
                        {processing ? (
                            <>
                                <Loader2 className="size-4 animate-spin" />
                                <span>Menyimpan Pengaturan...</span>
                            </>
                        ) : (
                            <>
                                <Save className="size-4" />
                                <span>Simpan Semua Pengaturan</span>
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </AdminLayout>
    );
}
