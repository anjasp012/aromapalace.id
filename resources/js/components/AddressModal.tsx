import React, { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, MapPin, Check, Plus, AlertCircle } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import type {
    UserAddress,
    ProvinceOption,
    CityOption,
    DistrictOption,
    SubdistrictOption,
} from '@/types/address';
import SearchableSelect, { SearchableOption } from '@/components/ui/searchable-select';
import AddressMapPicker from '@/components/AddressMapPicker';
import { fetchCoverageUntilNotEmpty } from '@/lib/coverage-fetcher';

interface AddressModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    addressToEdit?: UserAddress | null;
    onSuccess?: (savedAddress: UserAddress) => void;
}

const QUICK_LABELS = ['Rumah', 'Kantor', 'Apartemen', 'Toko'];

export default function AddressModal({
    open,
    onOpenChange,
    addressToEdit = null,
    onSuccess,
}: AddressModalProps) {
    const { isEn } = useTranslation();

    // Form fields
    const [label, setLabel] = useState('Rumah');
    const [customLabel, setCustomLabel] = useState('');
    const [recipientName, setRecipientName] = useState('');
    const [recipientPhone, setRecipientPhone] = useState('');
    const [addressDetail, setAddressDetail] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [isPrimary, setIsPrimary] = useState(false);
    const [latitude, setLatitude] = useState<number | null>(null);
    const [longitude, setLongitude] = useState<number | null>(null);
    const [mapZoom, setMapZoom] = useState<number>(14);

    // Geocoding helper to zoom Leaflet map to selected location
    const triggerGeocode = (query: string, zoom: number) => {
        if (!query.trim()) return;
        fetch(`/api/coverage/geocode?q=${encodeURIComponent(query)}`)
            .then((res) => res.json())
            .then((json) => {
                if (json.status && json.data) {
                    setLatitude(Number(json.data.latitude));
                    setLongitude(Number(json.data.longitude));
                    setMapZoom(zoom);
                }
            })
            .catch(() => {});
    };

    // KiriminAja Coverage Data
    const [provinces, setProvinces] = useState<ProvinceOption[]>([]);
    const [cities, setCities] = useState<CityOption[]>([]);
    const [districts, setDistricts] = useState<DistrictOption[]>([]);
    const [subdistricts, setSubdistricts] = useState<SubdistrictOption[]>([]);

    // Selected hierarchy
    const [selectedProvinceId, setSelectedProvinceId] = useState<number | ''>('');
    const [selectedProvinceName, setSelectedProvinceName] = useState('');
    const [selectedCityId, setSelectedCityId] = useState<number | ''>('');
    const [selectedCityName, setSelectedCityName] = useState('');
    const [selectedDistrictId, setSelectedDistrictId] = useState<number | ''>('');
    const [selectedDistrictName, setSelectedDistrictName] = useState('');
    const [selectedSubdistrictId, setSelectedSubdistrictId] = useState<number | ''>('');
    const [selectedSubdistrictName, setSelectedSubdistrictName] = useState('');

    // Loading states
    const [loadingProvinces, setLoadingProvinces] = useState(false);
    const [loadingCities, setLoadingCities] = useState(false);
    const [loadingDistricts, setLoadingDistricts] = useState(false);
    const [loadingSubdistricts, setLoadingSubdistricts] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Abort controller refs for auto-retrying requests
    const provincesAbortRef = useRef<AbortController | null>(null);
    const citiesAbortRef = useRef<AbortController | null>(null);
    const districtsAbortRef = useRef<AbortController | null>(null);
    const subdistrictsAbortRef = useRef<AbortController | null>(null);

    // Initial load of provinces (auto-retries continuously until non-empty)
    useEffect(() => {
        if (!open) return;

        provincesAbortRef.current?.abort();
        const controller = new AbortController();
        provincesAbortRef.current = controller;

        setLoadingProvinces(true);
        fetchCoverageUntilNotEmpty<ProvinceOption>(
            '/api/coverage/provinces',
            (data) => {
                setProvinces(data);
                setLoadingProvinces(false);
            },
            controller.signal
        );

        return () => {
            provincesAbortRef.current?.abort();
            citiesAbortRef.current?.abort();
            districtsAbortRef.current?.abort();
            subdistrictsAbortRef.current?.abort();
        };
    }, [open]);

    // Populate or reset form when modal opens
    useEffect(() => {
        if (!open) return;

        setErrorMessage(null);

        if (addressToEdit) {
            setLabel(addressToEdit.label || 'Rumah');
            setCustomLabel(QUICK_LABELS.includes(addressToEdit.label) ? '' : addressToEdit.label);
            setRecipientName(addressToEdit.recipient_name || '');
            setRecipientPhone(addressToEdit.recipient_phone || '');
            setAddressDetail(addressToEdit.address || '');
            setPostalCode(addressToEdit.postal_code || '');
            setIsPrimary(Boolean(addressToEdit.is_primary));
            setLatitude(addressToEdit.latitude ? Number(addressToEdit.latitude) : null);
            setLongitude(addressToEdit.longitude ? Number(addressToEdit.longitude) : null);
            setMapZoom(addressToEdit.latitude ? 16 : 14);

            setSelectedProvinceId(addressToEdit.province_id || '');
            setSelectedProvinceName(addressToEdit.province_name || '');
            setSelectedCityId(addressToEdit.city_id || '');
            setSelectedCityName(addressToEdit.city_name || '');
            setSelectedDistrictId(addressToEdit.district_id || '');
            setSelectedDistrictName(addressToEdit.district_name || '');
            setSelectedSubdistrictId(addressToEdit.subdistrict_id || '');
            setSelectedSubdistrictName(addressToEdit.subdistrict_name || '');

            // Pre-fetch dependent dropdowns if editing (auto-retries continuously until non-empty)
            if (addressToEdit.province_id) {
                citiesAbortRef.current?.abort();
                const controller = new AbortController();
                citiesAbortRef.current = controller;
                setLoadingCities(true);
                fetchCoverageUntilNotEmpty<CityOption>(
                    `/api/coverage/cities?province_id=${addressToEdit.province_id}`,
                    (data) => {
                        setCities(data);
                        setLoadingCities(false);
                    },
                    controller.signal
                );
            }
            if (addressToEdit.city_id) {
                districtsAbortRef.current?.abort();
                const controller = new AbortController();
                districtsAbortRef.current = controller;
                setLoadingDistricts(true);
                fetchCoverageUntilNotEmpty<DistrictOption>(
                    `/api/coverage/districts?city_id=${addressToEdit.city_id}`,
                    (data) => {
                        setDistricts(data);
                        setLoadingDistricts(false);
                    },
                    controller.signal
                );
            }
            if (addressToEdit.district_id) {
                subdistrictsAbortRef.current?.abort();
                const controller = new AbortController();
                subdistrictsAbortRef.current = controller;
                setLoadingSubdistricts(true);
                fetchCoverageUntilNotEmpty<SubdistrictOption>(
                    `/api/coverage/subdistricts?district_id=${addressToEdit.district_id}`,
                    (data) => {
                        setSubdistricts(data);
                        setLoadingSubdistricts(false);
                    },
                    controller.signal
                );
            }
        } else {
            // New Address defaults
            setLabel('Rumah');
            setCustomLabel('');
            setRecipientName('');
            setRecipientPhone('');
            setAddressDetail('');
            setPostalCode('');
            setIsPrimary(false);
            setLatitude(null);
            setLongitude(null);
            setMapZoom(12);

            setSelectedProvinceId('');
            setSelectedProvinceName('');
            setSelectedCityId('');
            setSelectedCityName('');
            setSelectedDistrictId('');
            setSelectedDistrictName('');
            setSelectedSubdistrictId('');
            setSelectedSubdistrictName('');

            setCities([]);
            setDistricts([]);
            setSubdistricts([]);
        }
    }, [open, addressToEdit]);

    // Handle Province change
    const handleProvinceChange = (rawVal: number | string) => {
        const val = rawVal ? Number(rawVal) : '';
        setSelectedProvinceId(val);
        const found = provinces.find((p) => p.id === val);
        const provName = found ? found.name : '';
        setSelectedProvinceName(provName);

        // Abort previous dependent requests
        citiesAbortRef.current?.abort();
        districtsAbortRef.current?.abort();
        subdistrictsAbortRef.current?.abort();

        // Reset lower cascade
        setSelectedCityId('');
        setSelectedCityName('');
        setSelectedDistrictId('');
        setSelectedDistrictName('');
        setSelectedSubdistrictId('');
        setSelectedSubdistrictName('');
        setCities([]);
        setDistricts([]);
        setSubdistricts([]);

        if (provName) {
            triggerGeocode(`${provName}, Indonesia`, 9);
        }

        if (val) {
            citiesAbortRef.current?.abort();
            const controller = new AbortController();
            citiesAbortRef.current = controller;
            setLoadingCities(true);
            fetchCoverageUntilNotEmpty<CityOption>(
                `/api/coverage/cities?province_id=${val}`,
                (data) => {
                    setCities(data);
                    setLoadingCities(false);
                },
                controller.signal
            );
        }
    };

    // Handle City change
    const handleCityChange = (rawVal: number | string, opt?: SearchableOption) => {
        const val = rawVal ? Number(rawVal) : '';
        setSelectedCityId(val);
        const found = opt || cities.find((c) => c.id === val);
        const cityName = found ? found.name : '';
        setSelectedCityName(cityName);
        if (found?.postal_code && !postalCode) {
            setPostalCode(found.postal_code);
        }

        // Abort previous dependent requests
        districtsAbortRef.current?.abort();
        subdistrictsAbortRef.current?.abort();

        // Reset lower cascade
        setSelectedDistrictId('');
        setSelectedDistrictName('');
        setSelectedSubdistrictId('');
        setSelectedSubdistrictName('');
        setDistricts([]);
        setSubdistricts([]);

        if (cityName) {
            triggerGeocode(`${cityName}, ${selectedProvinceName || 'Indonesia'}`, 12);
        }

        if (val) {
            districtsAbortRef.current?.abort();
            const controller = new AbortController();
            districtsAbortRef.current = controller;
            setLoadingDistricts(true);
            fetchCoverageUntilNotEmpty<DistrictOption>(
                `/api/coverage/districts?city_id=${val}`,
                (data) => {
                    setDistricts(data);
                    setLoadingDistricts(false);
                },
                controller.signal
            );
        }
    };

    // Handle District change
    const handleDistrictChange = (rawVal: number | string, opt?: SearchableOption) => {
        const val = rawVal ? Number(rawVal) : '';
        setSelectedDistrictId(val);
        const found = opt || districts.find((d) => d.id === val);
        const districtName = found ? found.name : '';
        setSelectedDistrictName(districtName);
        if (found?.postal_code) {
            setPostalCode(found.postal_code);
        }

        // Abort previous dependent requests
        subdistrictsAbortRef.current?.abort();

        // Reset subdistrict
        setSelectedSubdistrictId('');
        setSelectedSubdistrictName('');
        setSubdistricts([]);

        if (districtName) {
            triggerGeocode(`Kecamatan ${districtName}, ${selectedCityName || ''}, Indonesia`, 14);
        }

        if (val) {
            subdistrictsAbortRef.current?.abort();
            const controller = new AbortController();
            subdistrictsAbortRef.current = controller;
            setLoadingSubdistricts(true);
            fetchCoverageUntilNotEmpty<SubdistrictOption>(
                `/api/coverage/subdistricts?district_id=${val}`,
                (data) => {
                    setSubdistricts(data);
                    setLoadingSubdistricts(false);
                },
                controller.signal
            );
        }
    };

    // Handle Subdistrict change
    const handleSubdistrictChange = (rawVal: number | string, opt?: SearchableOption) => {
        const val = rawVal ? Number(rawVal) : '';
        setSelectedSubdistrictId(val);
        const found = opt || subdistricts.find((s) => s.id === val);
        const subdistrictName = found ? found.name : '';
        setSelectedSubdistrictName(subdistrictName);
        if (found?.postal_code) {
            setPostalCode(found.postal_code);
        }

        if (subdistrictName) {
            triggerGeocode(`Kelurahan ${subdistrictName}, ${selectedDistrictName || ''}, ${selectedCityName || ''}, Indonesia`, 16);
        }
    };

    const finalLabel = label === 'Lainnya' ? (customLabel.trim() || 'Alamat') : label;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);

        if (!recipientName.trim()) {
            setErrorMessage(isEn ? 'Recipient name is required.' : 'Nama penerima wajib diisi.');
            return;
        }
        if (!recipientPhone.trim()) {
            setErrorMessage(isEn ? 'Recipient phone number is required.' : 'Nomor telepon penerima wajib diisi.');
            return;
        }
        const cleanPhone = recipientPhone.replace(/[\s\-\.]/g, '');
        const phoneRegex = /^(\+628|628|08|02)[0-9]{6,13}$/;
        if (!phoneRegex.test(cleanPhone)) {
            setErrorMessage(
                isEn
                    ? 'Phone number must start with 08, 628, +628, or 02 and contain only digits.'
                    : 'Nomor telepon harus dimulai dengan 08, 628, +628, atau 02 dan hanya berisi angka.'
            );
            return;
        }
        if (!selectedCityName.trim()) {
            setErrorMessage(isEn ? 'Please select a City / Regency.' : 'Silakan pilih Kota / Kabupaten.');
            return;
        }
        if (!selectedDistrictName.trim()) {
            setErrorMessage(isEn ? 'Please select a District (Kecamatan).' : 'Silakan pilih Kecamatan.');
            return;
        }
        if (!selectedSubdistrictName.trim()) {
            setErrorMessage(isEn ? 'Please select a Subdistrict (Kelurahan).' : 'Silakan pilih Kelurahan.');
            return;
        }
        if (!postalCode.trim()) {
            setErrorMessage(isEn ? 'Postal code is required.' : 'Kode pos wajib diisi.');
            return;
        }
        if (!addressDetail.trim()) {
            setErrorMessage(isEn ? 'Full street address is required.' : 'Alamat lengkap wajib diisi.');
            return;
        }

        setIsSubmitting(true);

        const payload = {
            label: finalLabel,
            recipient_name: recipientName.trim(),
            recipient_phone: cleanPhone,
            province_id: selectedProvinceId ? Number(selectedProvinceId) : null,
            province_name: selectedProvinceName || null,
            city_id: selectedCityId ? Number(selectedCityId) : null,
            city_name: selectedCityName,
            district_id: selectedDistrictId ? Number(selectedDistrictId) : null,
            district_name: selectedDistrictName,
            subdistrict_id: selectedSubdistrictId ? Number(selectedSubdistrictId) : null,
            subdistrict_name: selectedSubdistrictName,
            postal_code: postalCode.trim(),
            address: addressDetail.trim(),
            latitude: latitude !== null ? Number(latitude) : null,
            longitude: longitude !== null ? Number(longitude) : null,
            is_primary: isPrimary,
        };

        const url = addressToEdit ? `/account/addresses/${addressToEdit.id}` : '/account/addresses';
        const method = addressToEdit ? 'put' : 'post';

        router[method](url, payload, {
            preserveScroll: true,
            onSuccess: (page: any) => {
                setIsSubmitting(false);
                onOpenChange(false);
                if (onSuccess) {
                    const addresses: UserAddress[] = page.props?.addresses || [];
                    const found = addressToEdit
                        ? addresses.find((a) => a.id === addressToEdit.id)
                        : addresses[0];
                    if (found) {
                        onSuccess(found);
                    }
                }
            },
            onError: (errs) => {
                setIsSubmitting(false);
                const first = Object.values(errs)[0];
                setErrorMessage(typeof first === 'string' ? first : (isEn ? 'Failed to save address.' : 'Gagal menyimpan alamat.'));
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-6 bg-background rounded-xl border border-border/80 shadow-2xl">
                <DialogHeader className="pb-3 border-b border-border/70 space-y-1">
                    <div className="flex items-center gap-2 text-[#4A070B] dark:text-[#E8D0BA]">
                        <div className="w-7 h-7 rounded-full bg-[#4A070B]/10 dark:bg-[#E8D0BA]/15 flex items-center justify-center shrink-0">
                            <MapPin className="w-4 h-4" />
                        </div>
                        <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                            {addressToEdit
                                ? (isEn ? 'Edit Delivery Address' : 'Ubah Alamat Pengiriman')
                                : (isEn ? 'Add New Delivery Address' : 'Tambah Alamat Pengiriman Baru')}
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-xs text-muted-foreground">
                        {isEn
                            ? 'Complete your recipient details and pick destination verified with KiriminAja coverage.'
                            : 'Lengkapi rincian penerima dan pilih wilayah terverifikasi sistem ekspedisi KiriminAja.'}
                    </DialogDescription>
                </DialogHeader>

                {errorMessage && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{errorMessage}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                    {/* LABEL ALAMAT */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">
                            {isEn ? 'Address Label' : 'Label Alamat'}
                        </label>
                        <div className="flex flex-wrap items-center gap-1.5">
                            {QUICK_LABELS.map((item) => (
                                <button
                                    key={item}
                                    type="button"
                                    onClick={() => setLabel(item)}
                                    className={`px-3 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                                        label === item
                                            ? 'bg-[#4A070B] text-white font-semibold'
                                            : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/80'
                                    }`}
                                >
                                    {item}
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => setLabel('Lainnya')}
                                className={`px-3 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                                    label === 'Lainnya'
                                        ? 'bg-[#4A070B] text-white font-semibold'
                                        : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/80'
                                    }`}
                            >
                                {isEn ? 'Other' : 'Lainnya'}
                            </button>
                        </div>
                        {label === 'Lainnya' && (
                            <Input
                                type="text"
                                placeholder={isEn ? 'e.g. Grandma House, Villa' : 'Contoh: Rumah Nenek, Kos, Butik'}
                                value={customLabel}
                                onChange={(e) => setCustomLabel(e.target.value)}
                                className="h-11 sm:h-12 text-sm rounded-xl px-4 mt-1.5 bg-background border-border/80"
                            />
                        )}
                    </div>

                    {/* NAMA PENERIMA & NOMOR TELEPON */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">
                                {isEn ? 'Recipient Name' : 'Nama Penerima'} <span className="text-destructive">*</span>
                            </label>
                            <Input
                                type="text"
                                placeholder="Nama lengkap penerima"
                                value={recipientName}
                                onChange={(e) => setRecipientName(e.target.value)}
                                className="h-11 sm:h-12 text-sm rounded-xl px-4 bg-background border-border/80"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">
                                {isEn ? 'WhatsApp / Phone Number' : 'Nomor WhatsApp / HP'} <span className="text-destructive">*</span>
                            </label>
                            <Input
                                type="tel"
                                placeholder="08xxxxxxxxxx"
                                value={recipientPhone}
                                onChange={(e) => setRecipientPhone(e.target.value)}
                                className="h-11 sm:h-12 text-sm rounded-xl px-4 bg-background border-border/80"
                                required
                            />
                            <p className="text-[10px] text-muted-foreground">
                                {isEn ? 'Format: Start with 08, 628, +628, or 02' : 'Format: Mulai dengan 08, 628, +628, atau 02'}
                            </p>
                        </div>
                    </div>

                    {/* COVERAGE HIERARCHY (KiriminAja): PROVINSI & KOTA/KABUPATEN */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* PROVINSI */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-foreground">
                                {isEn ? 'Province' : 'Provinsi'} <span className="text-destructive">*</span>
                            </label>
                            <SearchableSelect
                                options={provinces}
                                value={selectedProvinceId}
                                onChange={handleProvinceChange}
                                placeholder={isEn ? 'Select Province' : 'Pilih Provinsi'}
                                searchPlaceholder={isEn ? 'Search province...' : 'Cari nama provinsi...'}
                                loading={loadingProvinces}
                                emptyMessage={isEn ? 'No province found.' : 'Provinsi tidak ditemukan.'}
                            />
                        </div>

                        {/* KOTA / KABUPATEN */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-foreground">
                                {isEn ? 'City / Regency' : 'Kabupaten / Kota'} <span className="text-destructive">*</span>
                            </label>
                            <SearchableSelect
                                options={cities}
                                value={selectedCityId}
                                onChange={handleCityChange}
                                disabled={!selectedProvinceId || loadingCities}
                                loading={loadingCities}
                                placeholder={
                                    !selectedProvinceId
                                        ? (isEn ? 'Select Province First' : 'Pilih Provinsi Dahulu')
                                        : (isEn ? 'Select City / Regency' : 'Pilih Kabupaten/Kota')
                                }
                                searchPlaceholder={isEn ? 'Search city/regency...' : 'Cari kota/kabupaten...'}
                                emptyMessage={isEn ? 'No city found.' : 'Kota/kabupaten tidak ditemukan.'}
                            />
                        </div>
                    </div>

                    {/* KECAMATAN & KELURAHAN */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* KECAMATAN */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-foreground">
                                {isEn ? 'District' : 'Kecamatan'} <span className="text-destructive">*</span>
                            </label>
                            <SearchableSelect
                                options={districts}
                                value={selectedDistrictId}
                                onChange={handleDistrictChange}
                                disabled={!selectedCityId || loadingDistricts}
                                loading={loadingDistricts}
                                placeholder={
                                    !selectedCityId
                                        ? (isEn ? 'Select City First' : 'Pilih Kota Dahulu')
                                        : (isEn ? 'Select District' : 'Pilih Kecamatan')
                                }
                                searchPlaceholder={isEn ? 'Search district...' : 'Cari kecamatan...'}
                                emptyMessage={isEn ? 'No district found.' : 'Kecamatan tidak ditemukan.'}
                            />
                        </div>

                        {/* KELURAHAN */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-foreground">
                                {isEn ? 'Subdistrict' : 'Kelurahan / Desa'} <span className="text-destructive">*</span>
                            </label>
                            <SearchableSelect
                                options={subdistricts}
                                value={selectedSubdistrictId}
                                onChange={handleSubdistrictChange}
                                disabled={!selectedDistrictId || loadingSubdistricts}
                                loading={loadingSubdistricts}
                                placeholder={
                                    !selectedDistrictId
                                        ? (isEn ? 'Select District First' : 'Pilih Kecamatan Dahulu')
                                        : (isEn ? 'Select Subdistrict' : 'Pilih Kelurahan')
                                }
                                searchPlaceholder={isEn ? 'Search subdistrict...' : 'Cari kelurahan/desa...'}
                                emptyMessage={isEn ? 'No subdistrict found.' : 'Kelurahan tidak ditemukan.'}
                            />
                        </div>
                    </div>

                    {/* KODE POS */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">
                            {isEn ? 'Postal Code' : 'Kode Pos'} <span className="text-destructive">*</span>
                        </label>
                        <Input
                            type="text"
                            placeholder="Contoh: 12190"
                            value={postalCode}
                            onChange={(e) => setPostalCode(e.target.value)}
                            className="h-11 sm:h-12 text-sm rounded-xl px-4 bg-background border-border/80"
                            required
                        />
                    </div>

                    {/* ALAMAT LENGKAP */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-foreground">
                            {isEn ? 'Full Street Address' : 'Alamat Lengkap (Jalan, No. Rumah, RT/RW, Patokan)'} <span className="text-destructive">*</span>
                        </label>
                        <Textarea
                            rows={3}
                            placeholder={isEn ? 'Street name, house number, building, floor, landmark' : 'Nama jalan, blok, nomor rumah, RT/RW, atau patokan agar kurir mudah menemukan lokasi'}
                            value={addressDetail}
                            onChange={(e) => setAddressDetail(e.target.value)}
                            className="text-xs bg-background border-border/80 resize-none min-h-[75px]"
                            required
                        />
                    </div>

                    {/* LEAFLET MAP WITH AUTO-ZOOM TO PROVINSI/KOTA/KECAMATAN/KELURAHAN */}
                    <AddressMapPicker
                        latitude={latitude}
                        longitude={longitude}
                        targetZoom={mapZoom}
                        onChange={(lat, lng) => {
                            setLatitude(lat);
                            setLongitude(lng);
                        }}
                    />

                    {/* PRIMARY CHECKBOX */}
                    <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={isPrimary}
                            onChange={(e) => setIsPrimary(e.target.checked)}
                            className="rounded border-border text-[#4A070B] focus:ring-[#4A070B] w-4 h-4 cursor-pointer"
                        />
                        <span className="text-xs font-medium text-foreground">
                            {isEn ? 'Set as primary delivery address' : 'Jadikan sebagai alamat pengiriman utama'}
                        </span>
                    </label>

                    {/* ACTIONS */}
                    <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/70">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                            className="h-9 px-4 text-xs cursor-pointer border-border/80"
                        >
                            {isEn ? 'Cancel' : 'Batal'}
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="h-9 px-5 text-xs font-semibold bg-[#4A070B] hover:bg-[#360407] text-white cursor-pointer shadow-none flex items-center gap-1.5"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>{isEn ? 'Saving...' : 'Menyimpan...'}</span>
                                </>
                            ) : (
                                <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span>{addressToEdit ? (isEn ? 'Update Address' : 'Perbarui Alamat') : (isEn ? 'Save Address' : 'Simpan Alamat')}</span>
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
