import { Head, router } from '@inertiajs/react';
import { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import Layout from '@/components/Layout';
import { useTranslation } from '@/lib/i18n';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    MapPin,
    Navigation,
    ExternalLink,
    Search,
    X,
    Store as StoreIcon,
    Compass,
    Sparkles,
    RotateCcw,
    Loader2,
} from 'lucide-react';

export interface StoreItem {
    id: number;
    name: string;
    description: string;
    description_en?: string | null;
    thumbnail?: string | null;
    latitude: number;
    longitude: number;
    gmaps_link: string;
}

interface StoresProps {
    stores: StoreItem[];
    searchQuery?: string;
}

export default function StoresPage({
    stores = [],
    searchQuery = '',
}: StoresProps) {
    const { t, pickText, isEn } = useTranslation();
    const [search, setSearch] = useState(searchQuery);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedStoreId, setSelectedStoreId] = useState<number | null>(
        stores.length > 0 ? stores[0].id : null
    );
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markersRef = useRef<Record<number, L.Marker>>({});
    const storeCardsRef = useRef<Record<number, HTMLDivElement | null>>({});

    // Synchronize local search state when server props update
    useEffect(() => {
        setSearch(searchQuery);
    }, [searchQuery]);

    // Keep selectedStoreId in sync with current stores returned by server
    useEffect(() => {
        if (stores.length > 0) {
            const exists = stores.some((s) => s.id === selectedStoreId);
            if (!exists) {
                setSelectedStoreId(stores[0].id);
            }
        } else {
            setSelectedStoreId(null);
        }
    }, [stores]);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    // Initialize Single Map with Multiple Points via Leaflet
    useEffect(() => {
        if (!mapContainerRef.current) return;

        // Cleanup existing map instance if container exists
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
            markersRef.current = {};
        }

        // Default center on Java/Indonesia
        const map = L.map(mapContainerRef.current, {
            center: [-7.0, 109.5],
            zoom: 7,
            scrollWheelZoom: false,
        });

        mapInstanceRef.current = map;

        // Luxury Tile Layer: OpenStreetMap Standard
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap',
            maxZoom: 19,
        }).addTo(map);

        // Add markers for all stores
        const markerGroup: L.Marker[] = [];
        markersRef.current = {};

        stores.forEach((store) => {
            const isSelected = store.id === selectedStoreId;

            // Custom SVG Pin Icon
            const icon = L.divIcon({
                className: 'custom-store-pin',
                html: `
                    <div id="pin-marker-${store.id}" class="group relative flex flex-col items-center cursor-pointer transition-all duration-300 ${isSelected ? 'scale-125 z-50' : 'hover:scale-110 z-10'}">
                        <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-full ${isSelected ? 'bg-[#4A070B] ring-4 ring-[#D4A373]' : 'bg-[#4A070B] ring-2 ring-white dark:ring-neutral-900'} shadow-lg flex items-center justify-center text-white">
                            <svg class="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 21s-6-4.35-6-9.5a6 6 0 1 1 12 0c0 5.15-6 9.5-6 9.5z"/>
                                <circle cx="12" cy="11.5" r="2.5" fill="currentColor"/>
                            </svg>
                        </div>
                        <div class="w-1.5 h-1.5 bg-[#4A070B] rotate-45 -mt-1"></div>
                    </div>
                `,
                iconSize: [36, 42],
                iconAnchor: [18, 42],
            });

            const marker = L.marker([store.latitude, store.longitude], { icon }).addTo(map);

            const popupContent = `
                <div style="font-family: inherit; font-size: 12px; line-height: 1.4; min-width: 200px; padding: 2px;">
                    ${store.thumbnail ? `<img src="${store.thumbnail}" style="width: 100%; height: 95px; object-fit: cover; border-radius: 6px; margin-bottom: 6px;" />` : ''}
                    <strong style="color: #4A070B; font-size: 13px; display: block; margin-bottom: 4px;">${store.name}</strong>
                    <p style="color: #666; margin: 0 0 8px 0; font-size: 11px; line-height: 1.35;">${pickText(store.description, store.description_en) || ''}</p>
                    <a href="${store.gmaps_link}" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 4px; background: #4A070B; color: #fff; padding: 5px 12px; border-radius: 6px; font-size: 11px; text-decoration: none; font-weight: 600;">
                        <span>${isEn ? 'Directions' : 'Petunjuk Arah'}</span> &rarr;
                    </a>
                </div>
            `;
            marker.bindPopup(popupContent, { maxWidth: 260 });

            marker.on('click', () => {
                setSelectedStoreId(store.id);
                const el = storeCardsRef.current[store.id];
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });

            markersRef.current[store.id] = marker;
            markerGroup.push(marker);
        });

        // Fit map bounds or center based on matching stores
        if (markerGroup.length === 1) {
            const singleStore = stores[0];
            map.setView([singleStore.latitude, singleStore.longitude], 14);
        } else if (markerGroup.length > 1) {
            const group = L.featureGroup(markerGroup);
            map.fitBounds(group.getBounds().pad(0.18));
        } else {
            map.setView([-7.0, 109.5], 6);
        }

        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 200);

        return () => {
            clearTimeout(timer);
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [stores]);

    // 3. Keep active pin marker visually highlighted on selection
    useEffect(() => {
        stores.forEach((store) => {
            const el = document.getElementById(`pin-marker-${store.id}`);
            if (!el) return;
            const innerCircle = el.querySelector('div');
            if (store.id === selectedStoreId) {
                el.className = 'group relative flex flex-col items-center cursor-pointer transition-all duration-300 scale-125 z-50';
                if (innerCircle) {
                    innerCircle.className = 'w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-[#4A070B] ring-4 ring-[#D4A373] shadow-lg flex items-center justify-center text-white';
                }
            } else {
                el.className = 'group relative flex flex-col items-center cursor-pointer transition-all duration-300 hover:scale-110 z-10';
                if (innerCircle) {
                    innerCircle.className = 'w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-[#4A070B] ring-2 ring-white dark:ring-neutral-900 shadow-lg flex items-center justify-center text-white';
                }
            }
        });
    }, [selectedStoreId, stores]);

    // 4. Smoothly focus marker on active store selection change
    const focusStoreOnMap = (store: StoreItem) => {
        setSelectedStoreId(store.id);

        if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo([store.latitude, store.longitude], 15, {
                duration: 1.2,
            });
            const marker = markersRef.current[store.id];
            if (marker) {
                marker.openPopup();
            }
        }

        // On mobile screens, smoothly scroll to map if requested
        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
            mapContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    };

    // 5. Reset map to show all matching stores
    const handleFitAll = () => {
        if (!mapInstanceRef.current || stores.length === 0) return;
        const markerGroup = Object.values(markersRef.current);
        if (markerGroup.length === 1) {
            const singleStore = stores[0];
            mapInstanceRef.current.setView([singleStore.latitude, singleStore.longitude], 14);
        } else if (markerGroup.length > 1) {
            const group = L.featureGroup(markerGroup);
            mapInstanceRef.current.fitBounds(group.getBounds().pad(0.18));
        }
    };

    // Server-side search execution
    const executeServerSearch = (newSearch: string) => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        const params: Record<string, string> = {};
        if (newSearch.trim() !== '') {
            params.search = newSearch.trim();
        }

        router.get('/stores', params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            onStart: () => setIsSearching(true),
            onFinish: () => setIsSearching(false),
        });
    };

    const handleSearchChange = (val: string) => {
        setSearch(val);
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(() => {
            executeServerSearch(val);
        }, 350);
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        executeServerSearch(search);
    };

    const handleClearSearch = () => {
        setSearch('');
        executeServerSearch('');
    };

    return (
        <Layout>
            <Head title={`${t('stores.title')} • Aroma Palace`}>
                <meta
                    name="description"
                    content={t('stores.meta_desc')}
                />
            </Head>

            {/* PAGE HEADER BANNER (Consistent with cart, wishlist, checkout, articles) */}
            <div className="border-b border-border/70 bg-background py-10 sm:py-14">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-3">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl tracking-tight text-foreground">
                        <span className="font-light">{isEn ? 'Boutique Locations &' : 'Lokasi Butik &'}</span>{' '}
                        <span className="font-bold text-[#4A070B] dark:text-[#E8D0BA]">{isEn ? 'Official Ateliers' : 'Gerai Resmi'}</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {t('stores.subtitle')}
                    </p>
                </div>
            </div>

            {/* MAIN CONTAINER */}
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
                {/* TOOLBAR: STORE COUNT & SEARCH */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                            {searchQuery ? (
                                <>
                                    {t('stores.showing_results', { query: searchQuery, count: stores.length })}
                                </>
                            ) : (
                                <>
                                    {t('stores.showing_all', { count: stores.length })}
                                </>
                            )}
                        </span>
                        {searchQuery && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleClearSearch}
                                className="h-6 px-2 text-[11px] text-[#4A070B] dark:text-[#E8D0BA] hover:underline cursor-pointer"
                            >
                                {t('stores.clear_search')}
                            </Button>
                        )}
                    </div>

                    {/* Search Bar */}
                    <div className="w-full sm:w-80">
                        <form onSubmit={handleSearchSubmit} className="relative">
                            {isSearching ? (
                                <Loader2 className="w-4 h-4 text-[#4A070B] dark:text-[#E8D0BA] animate-spin absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            ) : (
                                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            )}
                            <Input
                                type="text"
                                placeholder={t('stores.search_placeholder')}
                                value={search}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                className="pl-9 pr-8 text-xs h-9 bg-card border-border/80 shadow-none focus-visible:ring-1 focus-visible:ring-[#4A070B]"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={handleClearSearch}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </form>
                    </div>
                </div>

                {/* TWO-COLUMN SPLIT: STORE CARDS ON LEFT, SINGLE INTERACTIVE MULTI-PIN MAP ON RIGHT */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* LEFT COLUMN: LIST OF STORES (5 COLS) */}
                    <div className="order-2 lg:order-1 lg:col-span-5 space-y-4">
                        {stores.length > 0 ? (
                            stores.map((store) => {
                                const isSelected = store.id === selectedStoreId;

                                return (
                                    <Card
                                        key={store.id}
                                        ref={(el) => {
                                            storeCardsRef.current[store.id] = el;
                                        }}
                                        onClick={() => focusStoreOnMap(store)}
                                        className={`p-5 transition-all duration-300 rounded-xl cursor-pointer ${isSelected
                                            ? 'border-[#4A070B] dark:border-[#E8D0BA] ring-2 ring-[#4A070B]/20 bg-[#4A070B]/[0.02] shadow-sm'
                                            : 'border-border/80 hover:border-border hover:shadow-xs bg-card'
                                            }`}
                                    >
                                        <div className="space-y-3.5">
                                            {/* Store Title & Badge */}
                                            <div className="flex items-start justify-between gap-3">
                                                <h3 className="text-base font-bold text-foreground leading-snug">
                                                    {store.name}
                                                </h3>


                                            </div>

                                            {/* Description */}
                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                {pickText(store.description, store.description_en)}
                                            </p>

                                            {/* Optional Thumbnail */}
                                            {store.thumbnail && (
                                                <div className="aspect-[16/7] rounded-lg overflow-hidden bg-muted border border-border/60 relative">
                                                    <img
                                                        src={store.thumbnail}
                                                        alt={store.name}
                                                        loading="lazy"
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            )}

                                            {/* Coordinates & Actions */}
                                            <div className="flex items-center justify-end gap-2 flex-wrap">

                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        asChild
                                                        size="sm"
                                                        className="bg-[#4A070B] hover:bg-[#360407] text-white text-[11px] h-7 px-3 cursor-pointer shadow-none"
                                                    >
                                                        <a
                                                            href={store.gmaps_link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="inline-flex items-center gap-1"
                                                        >
                                                            <span>Google Maps</span>
                                                            <ExternalLink className="w-3 h-3" />
                                                        </a>
                                                    </Button>

                                                    <Button
                                                        asChild
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-[11px] h-7 px-2.5 cursor-pointer border-border/80"
                                                    >
                                                        <a
                                                            href={`https://www.google.com/maps/dir/?api=1&destination=${store.latitude},${store.longitude}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="inline-flex items-center gap-1"
                                                        >
                                                            <Navigation className="w-3 h-3 text-[#4A070B] dark:text-[#E8D0BA]" />
                                                            <span>{t('stores.directions')}</span>
                                                        </a>
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })
                        ) : (
                            <div className="py-12 px-6 text-center space-y-4">
                                <h3 className="text-base font-bold text-foreground">{t('stores.empty_title')}</h3>
                                <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                                    {t('stores.empty_desc')}
                                </p>
                                <div className="pt-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleClearSearch}
                                        className="text-xs rounded-md border-border/80 cursor-pointer"
                                    >
                                        {isEn ? 'Show All Locations' : 'Tampilkan Semua Lokasi'}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: 1 SINGLE INTERACTIVE MAP WITH ALL PINS (7 COLS) */}
                    <div className="order-1 lg:order-2 lg:col-span-7 lg:sticky lg:top-28 space-y-2 isolate z-0">
                        <div className="relative rounded-xl overflow-hidden border border-border/80 shadow-md bg-muted/40 isolate z-0">
                            {/* Floating Map Controls & Info Badge */}
                            <div className="absolute top-3.5 left-3.5 right-3.5 z-20 pointer-events-none flex items-center justify-end gap-2">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="secondary"
                                    onClick={handleFitAll}
                                    className="pointer-events-auto shadow-xs h-8 text-xs font-medium cursor-pointer bg-background/90 hover:bg-background border border-border/80 flex items-center gap-1.5"
                                >
                                    <RotateCcw className="w-3 h-3 text-muted-foreground" />
                                    <span>{isEn ? 'Show All Points' : 'Tampilkan Semua Titik'}</span>
                                </Button>
                            </div>

                            {/* The Single Master Leaflet Map Container */}
                            <div
                                ref={mapContainerRef}
                                className="w-full h-[360px] sm:h-[460px] lg:h-[620px] bg-muted relative z-0"
                            />

                        </div>
                    </div>
                </div>

                {/* VALUE PROPOSITIONS */}
                <Card className="bg-muted/40 p-6 sm:p-8 border border-border/80 shadow-none rounded-xl">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="flex items-start gap-3.5">
                            <div className="w-9 h-9 rounded-lg bg-[#4A070B]/10 text-[#4A070B] dark:bg-[#E8D0BA]/10 dark:text-[#E8D0BA] flex items-center justify-center shrink-0 mt-0.5">
                                <Sparkles className="w-4.5 h-4.5" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-foreground">Private Scent Lounge</p>
                                <p className="text-[11px] text-muted-foreground leading-relaxed">
                                    {isEn ? 'Private scent discovery space with olfactory neutralizers and bespoke consultations.' : 'Ruang eksplorasi aroma privat dengan penciuman biji kopi dan penetralisir olfaktori.'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3.5">
                            <div className="w-9 h-9 rounded-lg bg-[#4A070B]/10 text-[#4A070B] dark:bg-[#E8D0BA]/10 dark:text-[#E8D0BA] flex items-center justify-center shrink-0 mt-0.5">
                                <Compass className="w-4.5 h-4.5" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-foreground">{isEn ? 'Personal Consultation' : 'Konsultasi Personal'}</p>
                                <p className="text-[11px] text-muted-foreground leading-relaxed">
                                    {isEn ? 'Guided by professional perfumers to help you discover your ideal signature fragrance.' : 'Dipandu oleh perfumer profesional untuk menemukan signature scent yang ideal bagi Anda.'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3.5">
                            <div className="w-9 h-9 rounded-lg bg-[#4A070B]/10 text-[#4A070B] dark:bg-[#E8D0BA]/10 dark:text-[#E8D0BA] flex items-center justify-center shrink-0 mt-0.5">
                                <StoreIcon className="w-4.5 h-4.5" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-foreground">{isEn ? 'Instant Store Pickup' : 'Pengambilan di Gerai'}</p>
                                <p className="text-[11px] text-muted-foreground leading-relaxed">
                                    {isEn ? 'Order online and collect your fine fragrance packages directly at the nearest boutique.' : 'Pesan online melalui website dan ambil pesanan langsung di gerai butik terdekat.'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3.5">
                            <div className="w-9 h-9 rounded-lg bg-[#4A070B]/10 text-[#4A070B] dark:bg-[#E8D0BA]/10 dark:text-[#E8D0BA] flex items-center justify-center shrink-0 mt-0.5">
                                <MapPin className="w-4.5 h-4.5" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-foreground">{isEn ? 'Prime Locations' : 'Lokasi Strategis'}</p>
                                <p className="text-[11px] text-muted-foreground leading-relaxed">
                                    {isEn ? 'Present in premier lifestyle centers and luxury districts across major Indonesian cities.' : 'Hadir di pusat perbelanjaan dan pusat gaya hidup premium kota-kota besar Indonesia.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </Layout>
    );
}
