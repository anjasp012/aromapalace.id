import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Head, Link, useForm, router } from '@inertiajs/react';
import Layout from '@/components/Layout';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Truck, Store as StoreIcon, MapPin, ExternalLink, Clock, ShieldCheck, Loader2, Plus, Edit2, Check, AlertCircle } from 'lucide-react';
import type { UserAddress } from '@/types/address';
import AddressModal from '@/components/AddressModal';
import AddressSelectorModal from '@/components/AddressSelectorModal';
import { formatVolume } from '@/lib/utils';

interface CheckoutItem {
    id: number;
    product_id: number;
    variant_id: number | null;
    quantity: number;
    volume: string | number;
    variant_name?: string;
    unit_price: number;
    unit_price_formatted: string;
    total_price: number;
    total_price_formatted: string;
    product: {
        id: number;
        name: string;
        slug: string;
        brand?: string;
        image?: string;
        category?: string;
    };
}

export interface AvailableVoucher {
    id: number;
    code: string;
    name: string;
    description?: string;
    terms: string[];
    type: 'percentage' | 'fixed';
    value: number;
    min_order_amount: number;
    min_order_amount_formatted: string;
    max_discount_amount?: number | null;
    formatted_discount: string;
}

export interface StoreOption {
    id: number;
    name: string;
    description: string;
    thumbnail?: string | null;
    latitude: number;
    longitude: number;
    gmaps_link: string;
}

export interface PaymentMethodItem {
    id: string;
    code: string;
    name: string;
    type: string;
    min_amount: number;
    min_amount_formatted: string;
    max_amount: number;
    max_amount_formatted: string;
    icon?: string;
    description?: string;
}

interface ShippingRate {
    code: string;
    courier_code?: string;
    name?: string;
    service?: string;
    type?: string;
    price: number | string;
    cost?: number | string;
    price_formatted?: string;
    etd?: string;
    insurance?: number | string;
}

export interface ParsedCourierOption {
    id: string;
    code: string;
    courierBrand: string;
    courierService: string;
    courierServiceType: string;
    name: string;
    fullName: string;
    type: string;
    price: number;
    priceFormatted: string;
    etd: string;
}

const parseShippingRate = (r: ShippingRate | any, idx: number): ParsedCourierOption => {
    // 1. Calculate price safely as integer number (handles 44000, "44000", "44.000", "Rp 44.000")
    let numericPrice = 0;
    if (typeof r?.price === 'number') {
        numericPrice = isNaN(r.price) ? 0 : r.price;
    } else if (typeof r?.price === 'string') {
        const cleaned = r.price.replace(/[^\d]/g, '');
        numericPrice = parseInt(cleaned, 10) || 0;
    } else if (typeof r?.cost === 'number') {
        numericPrice = isNaN(r.cost) ? 0 : r.cost;
    } else if (typeof r?.cost === 'string') {
        const cleaned = r.cost.replace(/[^\d]/g, '');
        numericPrice = parseInt(cleaned, 10) || 0;
    }

    // 2. Identify courier brand, service name, and service type
    // Format A (User's API response):
    // { code: "SAP", service: "SAP One Day Services", type: "UDRONS", price: "44000", price_formatted: "44.000", etd: "1-3" }
    // Format B (Alternate format):
    // { service: "SAP", name: "SAP One Day Services", code: "UDRONS", price: 44000, price_formatted: "44.000", etd: "1-3" }
    let courierBrand = '';
    let serviceName = '';
    let serviceType = '';

    if (r?.type) {
        courierBrand = (r.code || r.courier_code || '').toUpperCase();
        serviceName = r.service || r.name || '';
        serviceType = r.type;
    } else if (r?.name && r?.service && String(r.name).toLowerCase() !== String(r.service).toLowerCase()) {
        courierBrand = (r.service || r.code || '').toUpperCase();
        serviceName = r.name;
        serviceType = r.code || '';
    } else {
        courierBrand = (r?.code || r?.courier_code || r?.service || '').toUpperCase();
        serviceName = r?.service || r?.name || '';
        serviceType = r?.type || '';
    }

    // Don't show serviceType if it's identical to courierBrand or serviceName
    const displayType = (serviceType && serviceType.toUpperCase() !== courierBrand.toUpperCase() && serviceType.toUpperCase() !== serviceName.toUpperCase())
        ? serviceType
        : '';

    // 3. Format Price consistently as "Rp 44.000"
    let priceFormatted = '';
    if (r?.price_formatted) {
        const pf = String(r.price_formatted).trim();
        priceFormatted = pf.startsWith('Rp') ? pf : `Rp ${pf}`;
    } else {
        priceFormatted = `Rp ${numericPrice.toLocaleString('id-ID')}`;
    }

    // 4. Format ETD
    const rawEtd = r?.etd ? String(r.etd).trim() : '';
    const etdText = rawEtd
        ? (rawEtd.toLowerCase().includes('hari') || rawEtd.toLowerCase().includes('day') ? rawEtd : `${rawEtd} Hari`)
        : '';

    // 5. Full courier name for order payload & confirmation
    const fullName = courierBrand && serviceName
        ? (serviceName.toUpperCase().startsWith(courierBrand.toUpperCase()) ? serviceName : `${courierBrand} - ${serviceName}`)
        : (serviceName || courierBrand || '');

    const courierService = String(r?.service || r?.courier_code || r?.code || courierBrand || '').toLowerCase();
    const courierServiceType = String(serviceType || r?.code || '').trim();

    return {
        id: `${courierBrand}-${serviceType || serviceName}-${idx}`,
        code: r?.code || courierBrand,
        courierBrand,
        courierService,
        courierServiceType,
        name: serviceName,
        fullName,
        type: displayType,
        price: numericPrice,
        priceFormatted,
        etd: etdText,
    };
};


interface CheckoutProps {
    items: CheckoutItem[];
    subtotal: number;
    subtotal_formatted: string;
    shipping_fee: number;
    shipping_fee_formatted: string;
    discount_amount: number;
    discount_amount_formatted: string;
    total: number;
    total_formatted: string;
    initial_voucher?: string;
    available_vouchers?: AvailableVoucher[];
    stores?: StoreOption[];
    payment_methods?: PaymentMethodItem[];
    initial_shipping_rates?: ShippingRate[];
    user: {
        id?: number;
        name: string;
        email: string;
        phone?: string;
        address?: string;
        city?: string;
        postal_code?: string;
    };
    addresses?: UserAddress[];
    primary_address?: UserAddress | null;
}

const isPaymentIconImage = (icon?: string | null): boolean => {
    if (!icon) return false;
    const trimmed = icon.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/') || trimmed.startsWith('data:image/')) {
        return true;
    }
    return /\.(png|jpe?g|webp|svg|gif)$/i.test(trimmed);
};

const formatPaymentImageUrl = (icon: string): string => {
    const trimmed = icon.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/') || trimmed.startsWith('data:image/')) {
        return trimmed;
    }
    return `/storage/${trimmed}`;
};

const getPaymentMeta = (code: string, icon?: string) => {
    switch (code) {
        case 'qris':
            return {
                logo: 'QRIS',
                logoStyle: 'text-rose-700 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-900',
            };
        case 'bri_va':
            return {
                logo: 'BRI',
                logoStyle: 'text-[#00529C] bg-blue-50 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-900',
            };
        case 'bni_va':
            return {
                logo: 'BNI',
                logoStyle: 'text-[#F15A24] bg-orange-50 dark:bg-orange-950/50 dark:text-orange-300 border border-orange-200 dark:border-orange-900',
            };
        case 'cimb_niaga_va':
            return {
                logo: 'CIMB',
                logoStyle: 'text-[#ED1C24] bg-red-50 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-900',
            };
        case 'maybank_va':
            return {
                logo: 'MAYBANK',
                logoStyle: 'text-amber-800 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-900',
            };
        case 'danamon_va':
            return {
                logo: 'DANAMON',
                logoStyle: 'text-orange-600 bg-orange-50 dark:bg-orange-950/50 dark:text-orange-300 border border-orange-200 dark:border-orange-900',
            };
        case 'bnc_va':
            return {
                logo: 'BNC NEO',
                logoStyle: 'text-amber-900 bg-yellow-100 dark:bg-yellow-950/50 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-800',
            };
        case 'bsi_va':
            return {
                logo: 'BSI',
                logoStyle: 'text-teal-700 bg-teal-50 dark:bg-teal-950/50 dark:text-teal-300 border border-teal-200 dark:border-teal-900',
            };
        case 'muamalat_va':
            return {
                logo: 'MUAMALAT',
                logoStyle: 'text-purple-700 bg-purple-50 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-900',
            };
        case 'ocbc_va':
            return {
                logo: 'OCBC',
                logoStyle: 'text-rose-700 bg-red-50 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-900',
            };
        case 'payment_link':
            return {
                logo: 'PORTAL',
                logoStyle: 'text-[#4A070B] bg-[#4A070B]/10 dark:text-[#E8D0BA] dark:bg-[#E8D0BA]/10 border border-[#4A070B]/20 dark:border-[#E8D0BA]/20',
            };
        default:
            return {
                logo: (icon || code.replace('_va', '')).toUpperCase(),
                logoStyle: 'text-muted-foreground bg-muted border border-border/80',
            };
    }
};

export default function CheckoutPage({
    items = [],
    subtotal = 0,
    initial_voucher = '',
    available_vouchers = [],
    stores = [],
    payment_methods = [],
    initial_shipping_rates = [],
    user,
    addresses = [],
    primary_address = null,
}: CheckoutProps) {
    const { t, pickText, isEn } = useTranslation();
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        setIsMounted(true);
    }, []);


    // Delivery Type: delivery vs pickup
    const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');

    // Default store
    const defaultStoreId = stores.length > 0 ? stores[0].id : null;

    // User Addresses & KiriminAja Coverage Integration
    const [localAddresses, setLocalAddresses] = useState<UserAddress[]>(addresses || []);

    useEffect(() => {
        setLocalAddresses(addresses || []);
    }, [addresses]);

    const initialSelectedAddress = useMemo(() => {
        return primary_address || localAddresses.find((a) => a.is_primary) || localAddresses[0] || null;
    }, [primary_address, localAddresses]);

    const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(initialSelectedAddress);
    const [addressModalOpen, setAddressModalOpen] = useState(false);
    const [addressSelectorOpen, setAddressSelectorOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);

    // Shipping rates fetched from KiriminAja API (initialized with live server rates if available)
    const [shippingRates, setShippingRates] = useState<ShippingRate[]>(initial_shipping_rates || []);
    const [loadingRates, setLoadingRates] = useState(false);
    const initialAddressIdRef = useRef<number | null>(initialSelectedAddress?.id || null);
    const hasInitialRatesRef = useRef<boolean>((initial_shipping_rates && initial_shipping_rates.length > 0) ? true : false);

    // Build courier options strictly from real KiriminAja live rates (no dummy/fallback couriers)
    const courierOptions = useMemo<ParsedCourierOption[]>(() => {
        if (shippingRates.length > 0) {
            return shippingRates.map((r, idx) => parseShippingRate(r, idx));
        }

        return [];
    }, [shippingRates]);

    // Keep selectedAddress and useForm data strictly synchronized with default/primary address
    useEffect(() => {
        const activeAddr = selectedAddress || initialSelectedAddress;
        if (activeAddr) {
            if (!selectedAddress) {
                setSelectedAddress(activeAddr);
            }
            setData((prev) => ({
                ...prev,
                address_id: activeAddr.id,
                recipient_name: prev.recipient_name || activeAddr.recipient_name || user?.name || '',
                recipient_phone: activeAddr.recipient_phone || prev.recipient_phone || user?.phone || '',
                address: activeAddr.formatted_address || activeAddr.address || prev.address,
                province_id: activeAddr.province_id || null,
                province_name: activeAddr.province_name || '',
                city_id: activeAddr.city_id || null,
                city_name: activeAddr.city_name || '',
                district_id: activeAddr.district_id || null,
                district_name: activeAddr.district_name || '',
                subdistrict_id: activeAddr.subdistrict_id || null,
                subdistrict_name: activeAddr.subdistrict_name || '',
                city: activeAddr.city_name || prev.city,
                postal_code: activeAddr.postal_code || prev.postal_code,
            }));
        }
    }, [initialSelectedAddress, selectedAddress]);

    // Courier selection
    const [selectedCourierIndex, setSelectedCourierIndex] = useState(0);
    const [showCourierModal, setShowCourierModal] = useState(false);
    const [showStoreModal, setShowStoreModal] = useState(false);

    // Calculate package weight (minimum 1000g / 1kg standard for KiriminAja)
    const totalWeight = useMemo(() => {
        let w = 0;
        items.forEach((item) => {
            const volNum = typeof item.volume === 'number' ? item.volume : parseInt(String(item.volume || '100'), 10);
            const itemWeight = Math.max(250, (isNaN(volNum) ? 100 : volNum) * 3);
            w += itemWeight * (item.quantity || 1);
        });
        return Math.max(1000, w);
    }, [items]);

    // Fetch live shipping rates from KiriminAja via SDK fullShippingPrice whenever selected address changes
    useEffect(() => {
        const districtId = selectedAddress?.district_id ?? (selectedAddress as any)?.kecamatan_id ?? null;
        const subdistrictId = selectedAddress?.subdistrict_id ?? null;
        if ((!districtId && !subdistrictId) || deliveryType !== 'delivery') {
            setShippingRates([]);
            setLoadingRates(false);
            return;
        }

        // If server already provided valid rates for initial selected address, skip redundant first fetch
        if (hasInitialRatesRef.current && selectedAddress?.id === initialAddressIdRef.current) {
            hasInitialRatesRef.current = false;
            return;
        }
        hasInitialRatesRef.current = false;

        let cancelled = false;
        setLoadingRates(true);
        setShippingRates([]);

        const csrfMeta = document.querySelector('meta[name="csrf-token"]');
        const csrfToken = csrfMeta ? (csrfMeta as HTMLMetaElement).content : '';

        fetch('/checkout/shipping-rates', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                destination_district_id: districtId,
                destination_subdistrict_id: subdistrictId,
                address_id: selectedAddress?.id ?? null,
                weight: totalWeight,
            }),
        })
            .then((res) => res.json())
            .then((json) => {
                if (!cancelled && json?.status && Array.isArray(json.rates) && json.rates.length > 0) {
                    setShippingRates(json.rates);
                    setSelectedCourierIndex(0);
                    const firstCourier = parseShippingRate(json.rates[0], 0);
                    setData((prev) => ({
                        ...prev,
                        courier: firstCourier.fullName,
                        courier_service: firstCourier.courierService,
                        courier_service_type: firstCourier.courierServiceType,
                        shipping_cost: firstCourier.price,
                    }));
                } else if (!cancelled) {
                    setShippingRates([]);
                    setData((prev) => ({
                        ...prev,
                        courier: '',
                        courier_service: '',
                        courier_service_type: '',
                        shipping_cost: 0,
                    }));
                }
            })
            .catch(() => { /* silently fallback */ })
            .finally(() => { if (!cancelled) setLoadingRates(false); });

        return () => { cancelled = true; };
    }, [selectedAddress?.id, selectedAddress?.district_id, selectedAddress?.subdistrict_id, deliveryType, totalWeight]);

    // Payment methods view toggle
    const [showAllPayments, setShowAllPayments] = useState(false);

    // Voucher handling
    const initialVoucherEffective = useMemo(() => {
        return (
            initial_voucher ||
            (typeof window !== 'undefined' ? localStorage.getItem('aromapalace_applied_voucher') || '' : '')
        ).toUpperCase().trim();
    }, [initial_voucher]);

    const [voucherCodeInput, setVoucherCodeInput] = useState(initialVoucherEffective);
    const [appliedVoucher, setAppliedVoucher] = useState(initialVoucherEffective);
    const [voucherError, setVoucherError] = useState<string | null>(null);
    const [voucherSuccess, setVoucherSuccess] = useState<string | null>(null);

    const [voucherDiscount, setVoucherDiscount] = useState(() => {
        const v = initialVoucherEffective;
        const found = available_vouchers.find((item) => item.code.toUpperCase() === v);
        if (found) {
            if (subtotal < found.min_order_amount) return 0;
            if (found.type === 'fixed') return Math.min(subtotal, found.value);
            let disc = Math.round(subtotal * (found.value / 100));
            if (found.max_discount_amount && found.max_discount_amount > 0) {
                disc = Math.min(disc, found.max_discount_amount);
            }
            return disc;
        }
        return 0;
    });

    // Automatically sync applied voucher from props or localStorage when mounted / updated
    useEffect(() => {
        const codeToApply = (
            initial_voucher ||
            (typeof window !== 'undefined' ? localStorage.getItem('aromapalace_applied_voucher') || '' : '')
        ).toUpperCase().trim();

        if (codeToApply && available_vouchers && available_vouchers.length > 0) {
            const found = available_vouchers.find((v) => v.code.toUpperCase() === codeToApply);
            if (found && subtotal >= found.min_order_amount) {
                let disc = 0;
                if (found.type === 'fixed') {
                    disc = Math.min(subtotal, found.value);
                } else {
                    disc = Math.round(subtotal * (found.value / 100));
                    if (found.max_discount_amount && found.max_discount_amount > 0) {
                        disc = Math.min(disc, found.max_discount_amount);
                    }
                }
                setVoucherCodeInput(found.code);
                setAppliedVoucher(found.code);
                setVoucherDiscount(disc);
                setData('voucher_code', found.code);
                if (typeof window !== 'undefined') {
                    localStorage.setItem('aromapalace_applied_voucher', found.code);
                }
            }
        }
    }, [initial_voucher, available_vouchers, subtotal]);

    // Confirmation Modal
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const initialCourier = useMemo(() => {
        if (initial_shipping_rates && initial_shipping_rates.length > 0) {
            return parseShippingRate(initial_shipping_rates[0], 0);
        }
        return null;
    }, [initial_shipping_rates]);

    const selectedCourier = courierOptions[selectedCourierIndex] || courierOptions[0] || initialCourier;

    const { data, setData, post, processing, errors } = useForm({
        delivery_type: 'delivery' as 'delivery' | 'pickup',
        store_id: defaultStoreId as number | null,
        address_id: initialSelectedAddress?.id || null,
        recipient_name: initialSelectedAddress?.recipient_name || user?.name || '',
        recipient_phone: initialSelectedAddress?.recipient_phone || user?.phone || '',
        address: initialSelectedAddress?.formatted_address || initialSelectedAddress?.address || user?.address || '',
        province_id: initialSelectedAddress?.province_id || null,
        province_name: initialSelectedAddress?.province_name || '',
        city_id: initialSelectedAddress?.city_id || null,
        city_name: initialSelectedAddress?.city_name || '',
        district_id: initialSelectedAddress?.district_id || null,
        district_name: initialSelectedAddress?.district_name || '',
        subdistrict_id: initialSelectedAddress?.subdistrict_id || null,
        subdistrict_name: initialSelectedAddress?.subdistrict_name || '',
        city: initialSelectedAddress?.city_name || user?.city || '',
        postal_code: initialSelectedAddress?.postal_code || user?.postal_code || '',
        courier: initialCourier?.fullName || '',
        courier_service: initialCourier?.courierService || '',
        courier_service_type: initialCourier?.courierServiceType || '',
        shipping_cost: initialCourier?.price || 0,
        payment_method: (payment_methods && payment_methods.length > 0 ? payment_methods[0].code : ''),
        voucher_code: initial_voucher,
        notes: '',
        device_token: typeof window !== 'undefined' ? (localStorage.getItem('aromapalace_fcm_token') || '') : '',
    });

    const handleSelectAddress = (addr: UserAddress) => {
        setSelectedAddress(addr);
        setSelectedCourierIndex(0);
        setData((prev) => ({
            ...prev,
            address_id: addr.id,
            recipient_name: addr.recipient_name,
            recipient_phone: addr.recipient_phone,
            address: addr.formatted_address || addr.address,
            province_id: addr.province_id || null,
            province_name: addr.province_name || '',
            city_id: addr.city_id || null,
            city_name: addr.city_name || '',
            district_id: addr.district_id || null,
            district_name: addr.district_name || '',
            subdistrict_id: addr.subdistrict_id || null,
            subdistrict_name: addr.subdistrict_name || '',
            city: addr.city_name,
            postal_code: addr.postal_code,
            courier: '',
            courier_service: '',
            courier_service_type: '',
            shipping_cost: 0,
        }));
    };

    const handleAddressSaved = (savedAddr: UserAddress) => {
        setLocalAddresses((prev) => {
            const exists = prev.some((a) => a.id === savedAddr.id);
            if (exists) {
                return prev.map((a) => (a.id === savedAddr.id ? savedAddr : (savedAddr.is_primary ? { ...a, is_primary: false } : a)));
            }
            const updated = savedAddr.is_primary
                ? prev.map((a) => ({ ...a, is_primary: false }))
                : [...prev];
            return [savedAddr, ...updated];
        });
        handleSelectAddress(savedAddr);
        setAddressModalOpen(false);
        setEditingAddress(null);
    };

    const handleSwitchDeliveryType = (type: 'delivery' | 'pickup') => {
        setDeliveryType(type);
        setData((prev) => ({
            ...prev,
            delivery_type: type,
            store_id: type === 'pickup' ? (prev.store_id || defaultStoreId) : prev.store_id,
            courier: type === 'pickup' ? '' : (selectedCourier?.fullName || prev.courier),
            courier_service: type === 'pickup' ? 'pickup' : (selectedCourier?.courierService || prev.courier_service),
            courier_service_type: type === 'pickup' ? 'pickup' : (selectedCourier?.courierServiceType || prev.courier_service_type),
            shipping_cost: type === 'pickup' ? 0 : (selectedCourier?.price || 0),
        }));
    };

    const selectedStore = useMemo(() => {
        if (!data.store_id) return stores[0] || null;
        return stores.find((s) => s.id === data.store_id) || stores[0] || null;
    }, [data.store_id, stores]);

    const handleApplyVoucher = (e?: React.FormEvent | React.KeyboardEvent, explicitCode?: string) => {
        if (e) {
            e.preventDefault();
        }
        setVoucherError(null);
        setVoucherSuccess(null);

        const code = (explicitCode || voucherCodeInput).toUpperCase().trim();
        if (!code) {
            setAppliedVoucher('');
            setVoucherDiscount(0);
            setData('voucher_code', '');
            setVoucherError(isEn ? 'Please enter a voucher code.' : 'Silakan masukkan kode voucher.');
            return;
        }

        const found = available_vouchers.find((v) => v.code.toUpperCase() === code);
        if (found) {
            if (subtotal < found.min_order_amount) {
                setAppliedVoucher('');
                setVoucherDiscount(0);
                setData('voucher_code', '');
                const errMsg = isEn
                    ? `Minimum spend for voucher ${found.code} is ${found.min_order_amount_formatted}.`
                    : `Minimal transaksi untuk voucher ${found.code} adalah ${found.min_order_amount_formatted}.`;
                setVoucherError(errMsg);
                return;
            }

            let disc = 0;
            if (found.type === 'fixed') {
                disc = Math.min(subtotal, found.value);
            } else {
                disc = Math.round(subtotal * (found.value / 100));
                if (found.max_discount_amount && found.max_discount_amount > 0) {
                    disc = Math.min(disc, found.max_discount_amount);
                }
            }

            setVoucherCodeInput(code);
            setAppliedVoucher(code);
            setVoucherDiscount(disc);
            setData('voucher_code', code);
            if (typeof window !== 'undefined') {
                localStorage.setItem('aromapalace_applied_voucher', code);
            }
            router.post('/cart/voucher', { code: code }, {
                preserveScroll: true,
                preserveState: true,
            });
            const succMsg = isEn
                ? `Voucher ${found.code} applied! You save Rp ${disc.toLocaleString('id-ID')}.`
                : `Voucher ${found.code} berhasil dipasang! Anda hemat Rp ${disc.toLocaleString('id-ID')}.`;
            setVoucherSuccess(succMsg);
            return;
        }

        // Invalid code
        setAppliedVoucher('');
        setVoucherDiscount(0);
        setData('voucher_code', '');
        if (typeof window !== 'undefined') {
            localStorage.removeItem('aromapalace_applied_voucher');
        }
        const errMsg = isEn
            ? `Voucher code "${code}" is invalid or expired.`
            : `Kode voucher "${code}" tidak valid atau telah kedaluwarsa.`;
        setVoucherError(errMsg);
    };

    const handleRemoveVoucher = () => {
        setAppliedVoucher('');
        setVoucherDiscount(0);
        setVoucherCodeInput('');
        setData('voucher_code', '');
        setVoucherError(null);
        setVoucherSuccess(null);
        if (typeof window !== 'undefined') {
            localStorage.removeItem('aromapalace_applied_voucher');
        }
        router.delete('/cart/voucher', {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const handleSelectCourier = (index: number) => {
        setSelectedCourierIndex(index);
        const chosen = courierOptions[index];
        if (chosen) {
            setData((prev) => ({
                ...prev,
                courier: chosen.fullName,
                courier_service: chosen.courierService,
                courier_service_type: chosen.courierServiceType,
                shipping_cost: chosen.price,
            }));
        }
        setShowCourierModal(false);
    };

    const numSubtotal = Number(subtotal) || 0;
    const numVoucherDiscount = Number(voucherDiscount) || 0;
    const currentShippingCost = deliveryType === 'pickup' ? 0 : (Number(selectedCourier?.price) || 0);
    const finalTotal = Math.max(0, numSubtotal - numVoucherDiscount + currentShippingCost);
    const finalTotalFormatted = 'Rp ' + finalTotal.toLocaleString('id-ID');

    const appliedVoucherObj = useMemo(() => {
        if (!appliedVoucher) return null;
        return available_vouchers.find((v) => v.code.toUpperCase() === appliedVoucher.toUpperCase());
    }, [appliedVoucher, available_vouchers]);

    const appliedVoucherLabel = useMemo(() => {
        if (!appliedVoucher) return '';
        if (appliedVoucherObj) {
            return `${appliedVoucher} • ${appliedVoucherObj.formatted_discount}`;
        }
        return appliedVoucher;
    }, [appliedVoucher, appliedVoucherObj]);

    const handleOpenConfirm = (e: React.FormEvent) => {
        e.preventDefault();
        if (deliveryType === 'delivery') {
            const activeAddress = selectedAddress || initialSelectedAddress;
            const orderAddr = activeAddress?.formatted_address || activeAddress?.address || data.address;
            const recipientPhone = activeAddress?.recipient_phone || data.recipient_phone;

            if (!orderAddr?.trim() || !recipientPhone?.trim()) {
                setEditingAddress(null);
                setAddressModalOpen(true);
                alert(isEn
                    ? 'Please fill in your delivery address and phone number before placing your order.'
                    : 'Silahkan pilih atau isi alamat pengiriman terlebih dahulu sebelum melanjutkan pesanan.');
                return;
            }

            if (activeAddress) {
                setData((prev) => ({
                    ...prev,
                    address_id: activeAddress.id,
                    recipient_name: activeAddress.recipient_name || prev.recipient_name,
                    recipient_phone: recipientPhone,
                    address: orderAddr,
                    province_id: activeAddress.province_id || null,
                    province_name: activeAddress.province_name || '',
                    city_id: activeAddress.city_id || null,
                    city_name: activeAddress.city_name || '',
                    district_id: activeAddress.district_id || null,
                    district_name: activeAddress.district_name || '',
                    subdistrict_id: activeAddress.subdistrict_id || null,
                    subdistrict_name: activeAddress.subdistrict_name || '',
                    city: activeAddress.city_name || prev.city,
                    postal_code: activeAddress.postal_code || prev.postal_code,
                    courier: selectedCourier?.fullName || prev.courier || '',
                    courier_service: selectedCourier?.courierService || prev.courier_service || '',
                    courier_service_type: selectedCourier?.courierServiceType || prev.courier_service_type || '',
                    shipping_cost: currentShippingCost,
                }));
            }
        } else {
            setData((prev) => ({
                ...prev,
                shipping_cost: 0,
            }));
        }
        setShowConfirmModal(true);
    };

    const handleConfirmAndPay = () => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('aromapalace_fcm_token') || '';
            if (token) {
                setData('device_token', token);
            }
        }
        post('/checkout', {
            preserveScroll: true,
            onSuccess: () => {
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('aromapalace_applied_voucher');
                }
            },
            onFinish: () => setShowConfirmModal(false),
        });
    };

    const activePaymentMethods = useMemo(() => {
        if (Array.isArray(payment_methods) && payment_methods.length > 0) {
            return payment_methods.map((pm) => {
                const meta = getPaymentMeta(pm.code, pm.icon || undefined);
                return {
                    id: pm.code,
                    code: pm.code,
                    name: pm.name,
                    icon: pm.icon || null,
                    type: pm.type === 'qris' ? 'QRIS Instant' : pm.type === 'payment_link' ? 'Multi-Payment Portal' : (pm.type || 'Virtual Account'),
                    min_amount: pm.min_amount,
                    max_amount: pm.max_amount,
                    min_amount_formatted: pm.min_amount_formatted,
                    max_amount_formatted: pm.max_amount_formatted,
                    description: pm.description,
                    freeFee: true,
                    logo: meta.logo,
                    logoStyle: meta.logoStyle,
                };
            });
        }
        return [];
    }, [payment_methods]);

    // Ensure selected payment method is valid among active payment methods
    useEffect(() => {
        if (activePaymentMethods.length > 0) {
            const exists = activePaymentMethods.some((pm) => pm.id === data.payment_method);
            if (!exists) {
                setData('payment_method', activePaymentMethods[0].id);
            }
        }
    }, [activePaymentMethods, data.payment_method]);

    const sortedPayments = useMemo(() => {
        const selected = activePaymentMethods.find((pm) => pm.id === data.payment_method);
        if (!selected) return activePaymentMethods;
        return [selected, ...activePaymentMethods.filter((pm) => pm.id !== data.payment_method)];
    }, [data.payment_method, activePaymentMethods]);

    const displayedPayments = showAllPayments ? sortedPayments : sortedPayments.slice(0, 4);
    const totalItemsCount = items?.length ?? 0;

    return (
        <Layout showFooter={false} showBottomNav={false}>
            <Head title={`${t('checkout.confirm_title')} & ${t('checkout.title')} • Aroma Palace`} />

            {/* PAGE HEADER BANNER (Exact match to cart.tsx) */}
            <div className="border-b border-border/70 bg-background py-10 sm:py-14">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-3">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl tracking-tight text-foreground">
                        <span className="font-light">{isEn ? 'Order' : 'Konfirmasi &'}</span>{' '}
                        <span className="font-bold text-[#4A070B] dark:text-[#E8D0BA]">{isEn ? 'Checkout' : 'Pembayaran'}</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {t('checkout.subtitle')}
                    </p>
                </div>
            </div>

            {/* MAIN TWO-COLUMN CONTAINER (gap-6 & card styling consistent with cart.tsx) */}
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 pb-36 sm:pb-40 lg:pb-12">
                <form id="checkout-form" onSubmit={handleOpenConfirm}>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        {/* ======================================================== */}
                        {/* LEFT COLUMN: ALAMAT PENGIRIMAN & PRODUK (8 COLS, space-y-4) */}
                        {/* ======================================================== */}
                        <div className="lg:col-span-8 space-y-4">
                            {/* CARD 1: OPSI PENGIRIMAN ATAU AMBIL DI BUTIK */}
                            <div className="rounded-lg border border-border/80 bg-card/60 backdrop-blur-xs p-5 sm:p-6 shadow-none space-y-5">
                                {/* TAB PILIHAN: KIRIM KE ALAMAT vs AMBIL DI BUTIK */}
                                <div>
                                    <div className="flex items-center justify-between pb-3 border-b border-border/80 mb-3.5">
                                        <h2 className="font-bold text-base text-foreground tracking-tight">
                                            {t('checkout.delivery_method')}
                                        </h2>
                                        <span className="text-xs text-muted-foreground hidden sm:inline">
                                            {t('checkout.delivery_method_desc')}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => handleSwitchDeliveryType('delivery')}
                                            className={`flex items-center gap-3 p-3.5 rounded-lg border text-left transition cursor-pointer ${deliveryType === 'delivery'
                                                ? 'border-[#4A070B] dark:border-[#E8D0BA] bg-[#4A070B]/5 dark:bg-[#E8D0BA]/5 ring-1 ring-[#4A070B] dark:ring-[#E8D0BA]'
                                                : 'border-border/80 hover:border-border bg-background/50 hover:bg-muted/40'
                                                }`}
                                        >
                                            <div
                                                className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 transition-colors ${deliveryType === 'delivery'
                                                    ? 'bg-[#4A070B] text-white dark:bg-[#E8D0BA] dark:text-[#4A070B]'
                                                    : 'bg-muted text-muted-foreground'
                                                    }`}
                                            >
                                                <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-xs sm:text-sm font-bold text-foreground">
                                                    {t('checkout.courier_delivery')}
                                                </div>
                                                <div className="text-[11px] text-muted-foreground truncate">
                                                    {t('checkout.courier_delivery_sub')}
                                                </div>
                                            </div>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleSwitchDeliveryType('pickup')}
                                            className={`flex items-center gap-3 p-3.5 rounded-lg border text-left transition cursor-pointer ${deliveryType === 'pickup'
                                                ? 'border-[#4A070B] dark:border-[#E8D0BA] bg-[#4A070B]/5 dark:bg-[#E8D0BA]/5 ring-1 ring-[#4A070B] dark:ring-[#E8D0BA]'
                                                : 'border-border/80 hover:border-border bg-background/50 hover:bg-muted/40'
                                                }`}
                                        >
                                            <div
                                                className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 transition-colors ${deliveryType === 'pickup'
                                                    ? 'bg-[#4A070B] text-white dark:bg-[#E8D0BA] dark:text-[#4A070B]'
                                                    : 'bg-muted text-muted-foreground'
                                                    }`}
                                            >
                                                <StoreIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-xs sm:text-sm font-bold text-foreground">
                                                    {t('checkout.store_pickup')}
                                                </div>
                                                <div className="text-[11px] text-muted-foreground truncate">
                                                    {t('checkout.store_pickup_sub')}
                                                </div>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                {deliveryType === 'delivery' ? (
                                    /* TAMPILAN PENGIRIMAN ALAMAT */
                                    <div className="space-y-3 pt-2 border-t border-border/70">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-bold text-xs sm:text-sm text-foreground tracking-tight">
                                                {t('checkout.address_detail')}
                                            </h3>
                                            {selectedAddress && (
                                                <button
                                                    type="button"
                                                    onClick={() => setAddressSelectorOpen(true)}
                                                    className="text-xs font-semibold text-[#4A070B] dark:text-[#E8D0BA] hover:opacity-75 cursor-pointer transition-opacity"
                                                >
                                                    {isEn ? 'Change Address' : 'Ganti Alamat'}
                                                </button>
                                            )}
                                        </div>

                                        {selectedAddress ? (
                                            /* Selected Address Card */
                                            <div className="p-3.5 rounded-xl border border-border/80 bg-background/60 hover:border-[#4A070B]/40 transition space-y-2">
                                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-xs text-foreground">
                                                            {selectedAddress.recipient_name}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">•</span>
                                                        <span className="text-xs text-muted-foreground font-medium">
                                                            {selectedAddress.recipient_phone}
                                                        </span>
                                                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/60">
                                                            {selectedAddress.label || (isEn ? 'Address' : 'Alamat')}
                                                        </span>
                                                        {selectedAddress.is_primary && (
                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#4A070B]/10 text-[#4A070B] dark:bg-[#E8D0BA]/15 dark:text-[#E8D0BA] border border-[#4A070B]/20">
                                                                {isEn ? 'Primary' : 'Utama'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <p className="text-xs text-foreground/90 leading-relaxed">
                                                    {selectedAddress.address}
                                                </p>

                                                <p className="text-xs text-muted-foreground">
                                                    {[
                                                        selectedAddress.subdistrict_name,
                                                        selectedAddress.district_name,
                                                        selectedAddress.city_name,
                                                        selectedAddress.province_name,
                                                        selectedAddress.postal_code,
                                                    ].filter(Boolean).join(', ')}
                                                </p>
                                            </div>
                                        ) : (
                                            /* No Address State */
                                            <div className="p-4 rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                                <div className="flex items-start sm:items-center gap-2.5 text-amber-800 dark:text-amber-200">
                                                    <MapPin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
                                                    <div>
                                                        <p className="font-semibold text-xs">
                                                            {isEn ? 'No delivery address saved yet' : 'Belum ada alamat pengiriman tersimpan'}
                                                        </p>
                                                        <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80">
                                                            {isEn ? 'Add your address to calculate accurate shipping and proceed with checkout' : 'Tambahkan alamat pengiriman dengan cakupan wilayah KiriminAja agar pesanan dapat dikirim'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    onClick={() => {
                                                        setEditingAddress(null);
                                                        setAddressModalOpen(true);
                                                    }}
                                                    className="h-8 px-3.5 text-xs bg-[#4A070B] hover:bg-[#360407] text-white shrink-0 cursor-pointer shadow-none flex items-center gap-1.5"
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                    <span>{isEn ? '+ Add Address' : '+ Tambah Alamat Sekarang'}</span>
                                                </Button>
                                            </div>
                                        )}

                                        {/* Pilih Pengiriman Section (Kurir Pengiriman) */}
                                        <div className="pt-3 border-t border-border/70 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-bold text-xs sm:text-sm text-foreground tracking-tight">
                                                    {t('checkout.shipping_option')}
                                                </h3>
                                                {loadingRates && (
                                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                        {isEn ? 'Calculating shipping...' : 'Menghitung ongkir...'}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Clickable Courier Selector Box */}
                                            <div
                                                onClick={() => {
                                                    if (!selectedAddress) {
                                                        if (localAddresses.length > 0) {
                                                            setAddressSelectorOpen(true);
                                                        } else {
                                                            setEditingAddress(null);
                                                            setAddressModalOpen(true);
                                                        }
                                                        return;
                                                    }
                                                    if (courierOptions.length === 0) {
                                                        return;
                                                    }
                                                    setShowCourierModal(!showCourierModal);
                                                }}
                                                className={`rounded-md border p-3 transition flex items-center justify-between gap-3 ${!selectedAddress
                                                    ? 'border-dashed border-amber-500/40 bg-amber-500/5 cursor-pointer hover:border-amber-500'
                                                    : courierOptions.length === 0 && !loadingRates
                                                        ? 'border-destructive/40 bg-destructive/5'
                                                        : 'border-border/80 hover:border-border cursor-pointer bg-background/50'
                                                    }`}
                                            >
                                                {!selectedAddress ? (
                                                    <div className="flex items-center gap-2 text-xs text-amber-800 dark:text-amber-200">
                                                        <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                                                        <span className="font-medium">
                                                            {isEn ? 'Select or add a delivery address first to calculate shipping' : 'Tentukan alamat pengiriman terlebih dahulu untuk melihat opsi kurir & ongkir'}
                                                        </span>
                                                    </div>
                                                ) : loadingRates ? (
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <Loader2 className="w-4 h-4 animate-spin text-[#4A070B] dark:text-[#E8D0BA] shrink-0" />
                                                        <span className="font-medium">
                                                            {isEn ? 'Calculating shipping rates...' : 'Menghitung ongkos kirim ekspedisi...'}
                                                        </span>
                                                    </div>
                                                ) : courierOptions.length === 0 ? (
                                                    <div className="flex items-center gap-2 text-xs text-destructive">
                                                        <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
                                                        <span className="font-semibold">
                                                            {isEn ? 'No courier delivery available for this address' : 'Tidak ada kurir pengiriman yang tersedia untuk wilayah ini'}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2.5 flex-wrap min-w-0 text-xs">
                                                        <span className="font-bold uppercase text-[10px] text-[#4A070B] dark:text-[#E8D0BA] bg-[#4A070B]/10 dark:bg-[#E8D0BA]/10 px-1.5 py-0.5 rounded">
                                                            {selectedCourier?.courierBrand || (isEn ? 'Courier' : 'Kurir')}
                                                        </span>
                                                        <span className="font-bold text-foreground">
                                                            {selectedCourier?.name || (isEn ? 'Select Courier' : 'Pilih Kurir')}
                                                        </span>
                                                        {selectedCourier?.type && (
                                                            <>
                                                                <span className="text-muted-foreground">•</span>
                                                                <span className="text-muted-foreground">{selectedCourier.type}</span>
                                                            </>
                                                        )}
                                                        {selectedCourier?.etd && (
                                                            <span className="text-[11px] text-muted-foreground hidden sm:inline">{selectedCourier.etd}</span>
                                                        )}
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span className={`text-xs font-bold ${selectedCourier && selectedCourier.price > 0 ? 'text-[#4A070B] dark:text-[#E8D0BA]' : (selectedAddress && courierOptions.length === 0 ? 'text-destructive' : 'text-amber-700 dark:text-amber-300')}`}>
                                                        {!selectedAddress ? (isEn ? '+ Choose Address' : '+ Pilih Alamat') : (selectedCourier?.priceFormatted || (courierOptions.length === 0 ? (isEn ? 'Unavailable' : 'Tidak Tersedia') : (isEn ? 'Select Courier' : 'Pilih Kurir')))}
                                                    </span>
                                                    {courierOptions.length > 0 && (
                                                        <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Dropdown Options for Couriers (only displayed if couriers are available) */}
                                            {showCourierModal && courierOptions.length > 0 && (
                                                <div className="rounded-md border border-border/80 p-2 space-y-1 bg-background/80 max-h-64 overflow-y-auto">
                                                    {courierOptions.map((c, idx) => (
                                                        <div
                                                            key={c.id}
                                                            onClick={() => handleSelectCourier(idx)}
                                                            className={`p-2.5 rounded-md flex items-center justify-between text-xs cursor-pointer transition ${selectedCourierIndex === idx
                                                                ? 'bg-[#4A070B]/10 dark:bg-[#E8D0BA]/10 border border-[#4A070B]/40 font-semibold text-foreground'
                                                                : 'hover:bg-muted text-muted-foreground'
                                                                }`}
                                                        >
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <span className="font-bold text-[#4A070B] dark:text-[#E8D0BA] uppercase text-[10px] bg-[#4A070B]/10 dark:bg-[#E8D0BA]/10 px-1.5 py-0.5 rounded shrink-0">{c.courierBrand}</span>
                                                                <span className="truncate">{c.name}</span>
                                                                {c.type && <span className="text-muted-foreground text-[11px] shrink-0">• {c.type}</span>}
                                                            </div>
                                                            <div className="flex flex-col items-end shrink-0 ml-2">
                                                                <span className={`text-[11px] font-bold ${c.price > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                                    {c.priceFormatted}
                                                                </span>
                                                                {c.etd && <span className="text-[10px] text-muted-foreground">{c.etd}</span>}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    /* TAMPILAN AMBIL DI BUTIK RESMI */
                                    <div className="space-y-4 pt-2 border-t border-border/70">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-bold text-xs sm:text-sm text-foreground tracking-tight">
                                                    {t('checkout.pickup_store')}
                                                </h3>
                                                <Link
                                                    href="/stores"
                                                    target="_blank"
                                                    className="text-xs font-semibold text-[#4A070B] dark:text-[#E8D0BA] hover:opacity-75 flex items-center gap-1 shrink-0 transition-opacity cursor-pointer"
                                                >
                                                    <span>{isEn ? 'Boutique Map' : 'Peta Gerai'}</span>
                                                    <ExternalLink className="w-3 h-3" />
                                                </Link>
                                            </div>

                                            {/* Clickable Store Selector Box (Tampilan persis Pilih Pengiriman) */}
                                            <div
                                                onClick={() => setShowStoreModal(!showStoreModal)}
                                                className="rounded-md border border-border/80 p-3 hover:border-border transition cursor-pointer flex items-center justify-between gap-3 bg-background/50"
                                            >
                                                <div className="flex items-center gap-2.5 flex-wrap min-w-0 text-xs">
                                                    <span className="font-bold text-foreground">
                                                        {selectedStore?.name || (isEn ? 'Select Boutique Store' : 'Pilih Gerai Butik')}
                                                    </span>
                                                    {selectedStore?.description && (
                                                        <>
                                                            <span className="text-muted-foreground">•</span>
                                                            <span className="text-foreground font-medium truncate max-w-[200px] sm:max-w-xs">
                                                                {selectedStore.description}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>

                                                <div className="text-muted-foreground shrink-0">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </div>
                                            </div>

                                            {/* Dropdown Options for Stores (Persis Dropdown Pengiriman) */}
                                            {showStoreModal && (
                                                <div className="rounded-md border border-border/80 p-2 space-y-1.5 bg-background/80">
                                                    {stores.map((store) => (
                                                        <div
                                                            key={store.id}
                                                            onClick={() => {
                                                                setData('store_id', store.id);
                                                                setShowStoreModal(false);
                                                            }}
                                                            className={`p-2.5 rounded-md flex items-center justify-between text-xs cursor-pointer transition ${selectedStore?.id === store.id
                                                                ? 'bg-[#4A070B]/10 dark:bg-[#E8D0BA]/10 border border-[#4A070B]/40 font-semibold text-foreground'
                                                                : 'hover:bg-muted text-muted-foreground'
                                                                }`}
                                                        >
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <span className="font-bold text-[#4A070B] dark:text-[#E8D0BA] shrink-0">
                                                                    {store.name}
                                                                </span>
                                                                {store.description && (
                                                                    <span className="text-muted-foreground truncate max-w-sm sm:max-w-md">
                                                                        ({store.description})
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Contact info for store pickup */}
                                        <div className="pt-3 border-t border-border/70 space-y-3">
                                            <h3 className="font-bold text-xs sm:text-sm text-foreground tracking-tight">
                                                {isEn ? 'Pickup Person Identity at Boutique' : 'Identitas Pengambil Pesanan di Butik'}
                                            </h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-xs font-semibold text-foreground">
                                                        {isEn ? 'Pickup Person Name' : 'Nama Pengambil'}
                                                    </label>
                                                    <Input
                                                        type="text"
                                                        value={data.recipient_name}
                                                        onChange={(e) => setData('recipient_name', e.target.value)}
                                                        placeholder={isEn ? 'Name matching ID card' : 'Nama sesuai KTP / Identitas'}
                                                        className="h-9 text-xs mt-1 rounded-md border-border/80 bg-background/80 focus:border-[#4A070B]"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-semibold text-foreground">
                                                        {isEn ? 'Pickup Person WhatsApp Number' : 'Nomor WhatsApp Pengambil'}
                                                    </label>
                                                    <Input
                                                        type="tel"
                                                        value={data.recipient_phone}
                                                        onChange={(e) => setData('recipient_phone', e.target.value)}
                                                        placeholder="08xxxxxxxxxx"
                                                        className="h-9 text-xs mt-1 rounded-md border-border/80 bg-background/80 focus:border-[#4A070B]"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* CARD 2: DAFTAR PESANAN & PRODUK */}
                            <div className="rounded-lg border border-border/80 bg-card/60 backdrop-blur-xs p-5 sm:p-6 shadow-none space-y-4">
                                {/* Products Item List (Styling tokens matching cart.tsx) */}
                                <div className="divide-y divide-border/60">
                                    {items?.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-start sm:items-center gap-3 sm:gap-4 py-3 first:pt-0 last:pb-0 transition-colors"
                                        >
                                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-md border border-border/80 bg-muted/30 overflow-hidden shrink-0 mt-0.5 sm:mt-0">
                                                {item.product?.image ? (
                                                    <img
                                                        src={item.product.image}
                                                        alt={item.product.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">
                                                        No Pic
                                                    </div>
                                                )}
                                            </div>
                                            <div className="space-y-1.5 min-w-0 flex-1">
                                                <h3 className="font-semibold text-xs sm:text-sm text-foreground">
                                                    {item.product?.name}
                                                </h3>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="inline-flex items-center gap-1 text-[11px] bg-muted/40 border border-border/70 px-2 py-0.5 rounded-md">
                                                        <span className="text-muted-foreground">{isEn ? 'Size:' : 'Ukuran:'}</span>
                                                        <strong className="text-foreground">{formatVolume(item.volume)}</strong>
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 flex-wrap text-xs">
                                                    <span className="text-[11px] text-muted-foreground">
                                                        {isEn ? 'Qty:' : 'Jumlah:'} <strong className="text-foreground">{item.quantity}</strong>
                                                    </span>
                                                    <span className="text-muted-foreground/60 text-[10px]">•</span>
                                                    <span className="font-bold text-[#4A070B] dark:text-[#E8D0BA] text-xs sm:text-sm">
                                                        {item.total_price_formatted}
                                                    </span>
                                                    {item.quantity > 1 && (
                                                        <span className="text-[10.5px] text-muted-foreground">
                                                            ({item.unit_price_formatted} / unit)
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t border-border/80 pt-4 space-y-1.5">
                                    {/* Tambah Catatan Section */}
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold text-xs sm:text-sm text-foreground tracking-tight">
                                            {isEn ? 'Add Notes' : 'Tambah Catatan'}
                                        </h3>
                                        <span className="text-muted-foreground font-normal text-xs">
                                            {data.notes.length}/100
                                        </span>
                                    </div>
                                    <Input
                                        type="text"
                                        maxLength={100}
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        placeholder={isEn ? 'Add special instructions for this order...' : 'Berikan catatan untuk pesanan ini...'}
                                        className="h-10 text-xs rounded-md border border-border/80 bg-background/80 focus:border-[#4A070B]"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* ======================================================== */}
                        {/* RIGHT COLUMN: METODE PEMBAYARAN & RINGKASAN BELANJA (4 COLS, desktop sticky top-28) */}
                        {/* ======================================================== */}
                        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-28">
                            {/* CARD: PILIH METODE PEMBAYARAN */}
                            <div className="rounded-lg border border-border/80 bg-card/60 backdrop-blur-xs p-5 sm:p-6 shadow-none space-y-4">
                                <div className="flex items-center justify-between pb-3 border-b border-border/80">
                                    <h2 className="font-bold text-base text-foreground tracking-tight">
                                        {t('checkout.payment_method')}
                                    </h2>
                                    <button
                                        type="button"
                                        onClick={() => setShowAllPayments(!showAllPayments)}
                                        className="text-xs font-semibold text-[#4A070B] dark:text-[#E8D0BA] flex items-center gap-0.5 cursor-pointer"
                                    >
                                        {showAllPayments ? t('checkout.hide_payment') : t('checkout.see_all_payment')}
                                    </button>
                                </div>

                                {/* Payment Method Radio Cards */}
                                <div className="space-y-2.5">
                                    {displayedPayments.length === 0 ? (
                                        <div className="rounded-md p-4 text-center text-xs text-muted-foreground border border-dashed">
                                            {isEn ? 'No active payment methods currently available.' : 'Tidak ada metode pembayaran aktif yang tersedia saat ini.'}
                                        </div>
                                    ) : (
                                        displayedPayments.map((pm) => {
                                            const isSelected = data.payment_method === pm.id;
                                            return (
                                                <div
                                                    key={pm.id}
                                                    onClick={() => setData('payment_method', pm.id)}
                                                    className={`rounded-md p-3 flex items-center justify-between gap-2.5 cursor-pointer transition select-none ${isSelected
                                                        ? 'border-2 border-[#4A070B] dark:border-[#E8D0BA] bg-[#4A070B]/5 dark:bg-[#E8D0BA]/5'
                                                        : 'border border-border/80 hover:border-border bg-background/50'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        {isPaymentIconImage(pm.icon) ? (
                                                            <div className="w-12 h-7 rounded border border-border/60 bg-white dark:bg-muted p-0.5 flex items-center justify-center shrink-0 overflow-hidden">
                                                                <img
                                                                    src={formatPaymentImageUrl(pm.icon!)}
                                                                    alt={pm.name}
                                                                    className="max-h-full max-w-full object-contain"
                                                                    onError={(e) => {
                                                                        const target = e.currentTarget;
                                                                        if (target.parentElement) {
                                                                            target.parentElement.style.display = 'none';
                                                                            const fallback = target.parentElement.nextElementSibling;
                                                                            if (fallback) (fallback as HTMLElement).style.display = 'inline-flex';
                                                                        }
                                                                    }}
                                                                />
                                                            </div>
                                                        ) : null}
                                                        <span
                                                            style={{ display: isPaymentIconImage(pm.icon) ? 'none' : 'inline-flex' }}
                                                            className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-sm shrink-0 tracking-tight ${pm.logoStyle}`}
                                                        >
                                                            {pm.logo}
                                                        </span>
                                                        <div className="min-w-0">
                                                            <span className="text-xs font-bold text-foreground block truncate">
                                                                {pm.name}
                                                            </span>
                                                            {pm.description && (
                                                                <span className="text-[10.5px] text-muted-foreground block truncate">
                                                                    {pm.description}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                                                            Bebas Biaya
                                                        </span>
                                                        {/* Radio Button */}
                                                        <div className={`w-4 h-4 rounded-full flex items-center justify-center transition border ${isSelected ? 'border-[#4A070B] dark:border-[#E8D0BA] bg-background' : 'border-border/80'
                                                            }`}>
                                                            {isSelected && (
                                                                <div className="w-2.5 h-2.5 rounded-full bg-[#4A070B] dark:bg-[#E8D0BA]"></div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }))}
                                    {errors.payment_method && (
                                        <p className="text-xs text-destructive font-medium mt-1">
                                            {errors.payment_method}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* CARD: RINGKASAN BELANJA */}
                            <div className="rounded-lg border border-border/80 bg-card/60 backdrop-blur-xs p-5 sm:p-6 shadow-none space-y-4">
                                <h2 className="font-bold text-base text-foreground tracking-tight pb-3 border-b border-border/80">
                                    {t('checkout.order_summary')}
                                </h2>

                                {/* Line items */}
                                <div className="space-y-2.5 text-xs">
                                    <div className="flex items-center justify-between text-muted-foreground">
                                        <span>{isEn ? `Subtotal (${totalItemsCount} items)` : `Subtotal (${totalItemsCount} barang)`}</span>
                                        <span className="font-bold text-foreground">
                                            Rp {subtotal.toLocaleString('id-ID')}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between text-muted-foreground">
                                        <span>{isEn ? 'Shipping Fee' : 'Total Ongkos Kirim'}</span>
                                        {deliveryType === 'pickup' ? (
                                            <span className="font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md text-[10.5px]">
                                                {isEn ? 'Free (Store Pickup)' : 'Gratis (Ambil di Butik)'}
                                            </span>
                                        ) : selectedCourier && selectedCourier.price > 0 ? (
                                            <span className="font-bold text-foreground text-xs">
                                                {selectedCourier.priceFormatted}
                                            </span>
                                        ) : loadingRates ? (
                                            <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                                                <Loader2 className="w-3 h-3 animate-spin text-[#4A070B] dark:text-[#E8D0BA]" />
                                                {isEn ? 'Calculating...' : 'Menghitung...'}
                                            </span>
                                        ) : courierOptions.length === 0 ? (
                                            <span className="text-xs text-destructive font-medium">
                                                {selectedAddress ? (isEn ? 'Unavailable' : 'Tidak tersedia') : '-'}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-muted-foreground font-medium">
                                                {isEn ? 'Not selected' : 'Belum dipilih'}
                                            </span>
                                        )}
                                    </div>

                                    {appliedVoucher && voucherDiscount > 0 && (
                                        <div className="hidden lg:flex items-center justify-between text-xs bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-md">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                                                    Diskon ({appliedVoucherLabel})
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={handleRemoveVoucher}
                                                    className="text-[11px] text-destructive hover:underline cursor-pointer font-medium"
                                                    title={isEn ? 'Remove voucher' : 'Hapus voucher'}
                                                >
                                                    ({isEn ? 'Remove' : 'Hapus'})
                                                </button>
                                            </div>
                                            <span className="font-bold text-emerald-800 dark:text-emerald-300">
                                                - Rp {voucherDiscount.toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Desktop only: Voucher input form */}
                                {(!appliedVoucher || voucherDiscount <= 0) && (
                                    <div className="hidden lg:block pt-3 border-t border-border/70 space-y-1.5">
                                        <div className="flex gap-2">
                                            <Input
                                                type="text"
                                                placeholder={isEn ? 'Promo Voucher Code' : 'Kode Voucher Promo'}
                                                value={voucherCodeInput}
                                                onChange={(e) => {
                                                    setVoucherCodeInput(e.target.value);
                                                    if (voucherError) setVoucherError(null);
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleApplyVoucher(e);
                                                    }
                                                }}
                                                className="h-9 rounded-md border border-border/80 bg-background/80 text-xs uppercase tracking-wider focus:border-[#4A070B] focus:ring-1 focus:ring-[#4A070B]/25 shadow-none"
                                            />
                                            <Button
                                                type="button"
                                                onClick={handleApplyVoucher}
                                                variant="outline"
                                                className="h-9 px-3 rounded-md border border-[#4A070B] text-[#4A070B] hover:bg-[#4A070B] hover:text-white text-xs font-semibold shadow-none cursor-pointer shrink-0 transition-colors"
                                            >
                                                {isEn ? 'Apply' : 'Terapkan'}
                                            </Button>
                                        </div>
                                        {voucherError && (
                                            <p className="text-[11px] text-destructive font-medium flex items-center gap-1 animate-in fade-in duration-150">
                                                <span>⚠</span> {voucherError}
                                            </p>
                                        )}
                                        {voucherSuccess && (
                                            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 animate-in fade-in duration-150">
                                                <span>✓</span> {voucherSuccess}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Desktop only: Separator, Total Pembayaran, and Primary Button */}
                                <div className="hidden lg:block space-y-4">
                                    <Separator className="bg-border/80" />

                                    {/* Total Belanja */}
                                    <div className="flex items-baseline justify-between pt-1">
                                        <div>
                                            <div className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
                                                Total Pembayaran
                                            </div>
                                            <div className="text-[10px] text-emerald-600 font-medium">
                                                Sudah termasuk PPN &amp; garansi aman
                                            </div>
                                        </div>
                                        <div className="text-2xl font-extrabold text-[#4A070B] dark:text-[#E8D0BA]">
                                            {finalTotalFormatted}
                                        </div>
                                    </div>

                                    {/* Checkout Primary Button */}
                                    <Button
                                        type="submit"
                                        size="lg"
                                        disabled={processing}
                                        className="w-full bg-[#4A070B] hover:bg-[#360407] text-white font-semibold rounded-md h-11 text-xs sm:text-sm shadow-none transition active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-80"
                                    >
                                        {processing ? (
                                            <Loader2 className="w-4 h-4 animate-spin text-[#E5A844]" />
                                        ) : (
                                            <svg
                                                className="w-4 h-4 text-[#E5A844]"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                                />
                                            </svg>
                                        )}
                                        <span>{processing ? (isEn ? 'Processing Order...' : 'Memproses Pesanan...') : (isEn ? `Buy (${totalItemsCount}) and Pay` : `Beli (${totalItemsCount}) dan Bayar`)}</span>
                                    </Button>
                                </div>
                            </div>

                            {/* Back to Cart Link (Placed under Ringkasan Belanja Card) */}
                            <div className="pt-2.5">
                                <Link
                                    href="/cart"
                                    className="inline-flex items-center gap-1.5 font-semibold text-xs text-[#4A070B] dark:text-[#E8D0BA] hover:text-[#360407] transition-colors"
                                >
                                    <span>←</span> {isEn ? 'Back to Cart' : 'Kembali ke Keranjang'}
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* MOBILE FLOATING BOTTOM SUMMARY BAR (Voucher + Sticky Pay Button, portaled to document.body) */}
                    {(() => {
                        const mobileBarContent = (
                            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border shadow-[0_-8px_30px_rgba(0,0,0,0.12)] pb-[max(env(safe-area-inset-bottom),0px)]">
                                {/* Attached Voucher Bar (Identical to cart.tsx) */}
                                <div className="px-4 py-2 border-b border-border/60 bg-muted/20">
                                    {appliedVoucher && voucherDiscount > 0 ? (
                                        <div className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium truncate">
                                                <svg className="w-3.5 h-3.5 shrink-0 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                                </svg>
                                                <span className="truncate">
                                                    Voucher <strong className="font-bold">{appliedVoucher.toUpperCase()}</strong>: -Rp {voucherDiscount.toLocaleString('id-ID')}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleRemoveVoucher}
                                                className="text-[11px] text-destructive hover:underline font-semibold cursor-pointer shrink-0 ml-2"
                                            >
                                                {isEn ? 'Remove' : 'Hapus'}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <div className="relative flex-1">
                                                    <svg
                                                        className="w-3.5 h-3.5 text-[#E5A844] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                                    </svg>
                                                    <Input
                                                        type="text"
                                                        placeholder={isEn ? 'Have a Promo Voucher?' : 'Punya Kode Voucher Promo?'}
                                                        value={voucherCodeInput}
                                                        onChange={(e) => {
                                                            setVoucherCodeInput(e.target.value);
                                                            if (voucherError) setVoucherError(null);
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                handleApplyVoucher(e);
                                                            }
                                                        }}
                                                        className="h-8.5 pl-8 pr-2.5 rounded-md border border-border/80 bg-background text-xs uppercase tracking-wider focus:border-[#4A070B] focus:ring-1 focus:ring-[#4A070B]/25 shadow-none"
                                                    />
                                                </div>
                                                <Button
                                                    type="button"
                                                    onClick={handleApplyVoucher}
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8.5 px-3 rounded-md border border-[#4A070B] text-[#4A070B] hover:bg-[#4A070B] hover:text-white text-xs font-semibold shadow-none cursor-pointer shrink-0 transition-colors"
                                                >
                                                    {isEn ? 'Apply' : 'Terapkan'}
                                                </Button>
                                            </div>
                                            {voucherError && (
                                                <p className="text-[10.5px] text-destructive font-medium flex items-center gap-1 animate-in fade-in duration-150">
                                                    <span>⚠</span> {voucherError}
                                                </p>
                                            )}
                                            {voucherSuccess && (
                                                <p className="text-[10.5px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 animate-in fade-in duration-150">
                                                    <span>✓</span> {voucherSuccess}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Primary Bottom Bar */}
                                <div className="mx-auto max-w-7xl px-4 py-2.5 sm:px-6 flex items-center justify-between gap-3">
                                    {/* Summary info: Total Pembayaran */}
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-[10.5px] font-medium text-muted-foreground truncate">
                                            Total ({totalItemsCount} produk)
                                        </span>
                                        <div className="flex items-baseline gap-1.5 flex-wrap">
                                            <span className="text-lg font-black text-[#4A070B] dark:text-[#E8D0BA] tracking-tight">
                                                {finalTotalFormatted}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Pay Action Button */}
                                    <Button
                                        type="button"
                                        onClick={handleOpenConfirm}
                                        disabled={processing}
                                        size="default"
                                        className="h-10.5 px-5 sm:px-6 bg-[#4A070B] hover:bg-[#360407] text-white font-semibold rounded-md text-xs sm:text-sm shadow-none transition active:scale-[0.98] cursor-pointer flex items-center gap-2 shrink-0 disabled:opacity-80"
                                    >
                                        {processing ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E5A844]" />
                                        ) : (
                                            <svg
                                                className="w-3.5 h-3.5 text-[#E5A844]"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                                />
                                            </svg>
                                        )}
                                        <span>{processing ? (isEn ? 'Processing...' : 'Memproses...') : (isEn ? `Pay (${totalItemsCount})` : `Bayar (${totalItemsCount})`)}</span>
                                    </Button>
                                </div>
                            </div>
                        );
                        return isMounted && typeof document !== 'undefined'
                            ? createPortal(mobileBarContent, document.body)
                            : mobileBarContent;
                    })()}
                </form>
            </div>


            {/* CONFIRMATION POPUP MODAL */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
                    <div
                        className="w-full max-w-md bg-background border border-border/80 rounded-xl p-5 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className="flex items-center justify-between pb-3 border-b border-border/80">
                            <div>
                                <h3 className="font-bold text-sm sm:text-base text-foreground">
                                    {t('checkout.confirm_title')}
                                </h3>
                                <p className="text-[11px] text-muted-foreground">
                                    {t('checkout.confirm_desc')}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowConfirmModal(false)}
                                className="text-muted-foreground hover:text-foreground p-1 rounded-md cursor-pointer"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Order Brief Summary */}
                        <div className="space-y-2.5 bg-muted/40 border border-border/70 rounded-lg p-3.5 text-xs">
                            <div className="flex items-start justify-between gap-2">
                                <span className="text-muted-foreground shrink-0">{isEn ? 'Method' : 'Metode'}</span>
                                <span className="font-bold text-foreground text-right">
                                    {deliveryType === 'pickup' ? (isEn ? 'Store Pickup' : 'Ambil Sendiri di Butik') : (isEn ? 'Courier Delivery' : 'Kirim via Kurir')}
                                </span>
                            </div>
                            <div className="flex items-start justify-between gap-2">
                                <span className="text-muted-foreground shrink-0">
                                    {deliveryType === 'pickup' ? (isEn ? 'Pickup Person' : 'Pengambil') : (isEn ? 'Recipient' : 'Penerima')}
                                </span>
                                <span className="font-semibold text-foreground text-right truncate">
                                    {data.recipient_name} ({data.recipient_phone})
                                </span>
                            </div>
                            {deliveryType === 'pickup' ? (
                                <div className="flex items-start justify-between gap-2">
                                    <span className="text-muted-foreground shrink-0">{isEn ? 'Boutique Location' : 'Lokasi Butik'}</span>
                                    <span className="font-medium text-foreground text-right max-w-[220px] truncate" title={selectedStore?.name}>
                                        {selectedStore?.name || '-'}
                                    </span>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-start justify-between gap-2">
                                        <span className="text-muted-foreground shrink-0">{isEn ? 'Address' : 'Alamat'}</span>
                                        <span className="font-medium text-foreground text-right max-w-[220px] truncate" title={data.address}>
                                            {data.address}
                                        </span>
                                    </div>
                                    <div className="flex items-start justify-between gap-2">
                                        <span className="text-muted-foreground shrink-0">{isEn ? 'Courier' : 'Kurir'}</span>
                                        <span className="font-semibold text-foreground text-right">
                                            {selectedCourier ? `${selectedCourier.fullName} (${selectedCourier.priceFormatted})` : (isEn ? 'Not selected' : 'Belum dipilih')}
                                        </span>
                                    </div>
                                </>
                            )}
                            <div className="flex items-start justify-between gap-2">
                                <span className="text-muted-foreground shrink-0">{isEn ? 'Payment' : 'Pembayaran'}</span>
                                <span className="font-semibold text-[#4A070B] dark:text-[#E8D0BA] text-right">
                                    {activePaymentMethods.find((p) => p.id === data.payment_method)?.name || data.payment_method}
                                </span>
                            </div>
                            <div className="border-t border-border/70 pt-2 flex items-center justify-between">
                                <span className="font-bold text-foreground">{isEn ? `Total Bill (${totalItemsCount} items)` : `Total Tagihan (${totalItemsCount} item)`}</span>
                                <span className="font-extrabold text-sm text-[#4A070B] dark:text-[#E8D0BA]">
                                    {finalTotalFormatted}
                                </span>
                            </div>
                        </div>

                        {/* Actions */}
                        {processing ? (
                            <div className="py-3 px-3 rounded-xl bg-muted/40 border border-[#4A070B]/20 dark:border-[#E8D0BA]/20 flex flex-col items-center justify-center space-y-2 text-center">
                                <div className="w-7 h-7 rounded-full border-2 border-[#4A070B]/20 border-t-[#4A070B] dark:border-[#E8D0BA]/20 dark:border-t-[#E8D0BA] animate-spin" />
                                <div className="space-y-0.5">
                                    <p className="text-xs font-bold text-[#4A070B] dark:text-[#E8D0BA]">
                                        {isEn ? 'Preparing Payment Transaction...' : 'Menyiapkan Transaksi Pembayaran...'}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground">
                                        {isEn ? 'Please do not close this page, you will be redirected shortly.' : 'Mohon jangan tutup halaman, Anda akan segera dialihkan ke halaman transaksi.'}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3 pt-1">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowConfirmModal(false)}
                                    disabled={processing}
                                    className="h-10 rounded-md text-xs font-semibold border-border/80 hover:bg-muted cursor-pointer shadow-none"
                                >
                                    {isEn ? 'Cancel' : 'Batal'}
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleConfirmAndPay}
                                    disabled={processing}
                                    className="h-10 rounded-md text-xs font-bold bg-[#4A070B] hover:bg-[#360407] text-white cursor-pointer shadow-none flex items-center justify-center gap-1.5"
                                >
                                    <span>{isEn ? 'Yes, Pay Now' : 'Ya, Bayar Sekarang'}</span>
                                    <span>→</span>
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ADDRESS SELECTOR MODAL */}
            <AddressSelectorModal
                open={addressSelectorOpen}
                onOpenChange={setAddressSelectorOpen}
                addresses={localAddresses}
                selectedAddressId={selectedAddress?.id}
                onSelectAddress={(addr) => {
                    handleSelectAddress(addr);
                    setAddressSelectorOpen(false);
                }}
                onAddNewAddress={() => {
                    setAddressSelectorOpen(false);
                    setEditingAddress(null);
                    setAddressModalOpen(true);
                }}
                onEditAddress={(addr) => {
                    setAddressSelectorOpen(false);
                    setEditingAddress(addr);
                    setAddressModalOpen(true);
                }}
            />

            {/* ADDRESS ADD / EDIT MODAL */}
            <AddressModal
                open={addressModalOpen}
                onOpenChange={(open) => {
                    setAddressModalOpen(open);
                    if (!open) setEditingAddress(null);
                }}
                addressToEdit={editingAddress}
                onSuccess={handleAddressSaved}
            />
        </Layout>
    );
}
