import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import L from 'leaflet';
import { RotateCcw, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface AdminStoreMapItem {
    id: number;
    name: string;
    description?: string | null;
    thumbnail?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    gmaps_link?: string | null;
    orders_count?: number;
}

export interface AdminStoresMapRef {
    focusStore: (store: AdminStoreMapItem) => void;
    resetZoom: () => void;
}

interface AdminStoresMapProps {
    stores: AdminStoreMapItem[];
    onEditStore?: (store: AdminStoreMapItem) => void;
    height?: string;
}

const PIN_PALETTES = [
    { bg: '#059669', ring: '#10B981' }, // Emerald
    { bg: '#DC2626', ring: '#EF4444' }, // Crimson
    { bg: '#2563EB', ring: '#3B82F6' }, // Blue
    { bg: '#4A070B', ring: '#D4A373' }, // Aroma Palace Signature
    { bg: '#7C3AED', ring: '#8B5CF6' }, // Purple
];

const AdminStoresMap = forwardRef<AdminStoresMapRef, AdminStoresMapProps>(({
    stores = [],
    onEditStore,
    height = '420px',
}, ref) => {
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markersRef = useRef<Record<number, L.Marker>>({});

    const validStores = stores.filter(
        (s) =>
            s.latitude !== null &&
            s.latitude !== undefined &&
            s.longitude !== null &&
            s.longitude !== undefined &&
            !isNaN(Number(s.latitude)) &&
            !isNaN(Number(s.longitude))
    );

    const handleResetView = () => {
        if (!mapInstanceRef.current) return;
        const markerGroup = Object.values(markersRef.current);
        if (markerGroup.length === 1) {
            mapInstanceRef.current.setView([Number(validStores[0].latitude), Number(validStores[0].longitude)], 13);
        } else if (markerGroup.length > 1) {
            const group = L.featureGroup(markerGroup);
            mapInstanceRef.current.fitBounds(group.getBounds().pad(0.12));
        } else {
            // Panoramic view of Indonesia archipelago (matching reference screenshot)
            mapInstanceRef.current.setView([-2.5, 118.0], 5);
        }
    };

    useImperativeHandle(ref, () => ({
        focusStore: (store: AdminStoreMapItem) => {
            if (!mapInstanceRef.current || !store.latitude || !store.longitude) return;
            const lat = Number(store.latitude);
            const lng = Number(store.longitude);
            mapInstanceRef.current.flyTo([lat, lng], 14, { duration: 1.2 });
            const marker = markersRef.current[store.id];
            if (marker) {
                setTimeout(() => {
                    marker.openPopup();
                }, 1250);
            }
        },
        resetZoom: () => {
            handleResetView();
        },
    }));

    useEffect(() => {
        if (!mapContainerRef.current) return;

        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
            markersRef.current = {};
        }

        // Center on Indonesian Archipelago
        const map = L.map(mapContainerRef.current, {
            center: [-2.5, 118.0],
            zoom: 5,
            scrollWheelZoom: false,
        });

        mapInstanceRef.current = map;

        // Clean OpenStreetMap Tile Layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap',
            maxZoom: 19,
        }).addTo(map);

        const markerGroup: L.Marker[] = [];
        markersRef.current = {};

        validStores.forEach((store, idx) => {
            const lat = Number(store.latitude);
            const lng = Number(store.longitude);
            const palette = PIN_PALETTES[idx % PIN_PALETTES.length];

            // Concentric circular pin icon matching the user's reference image
            const icon = L.divIcon({
                className: 'custom-circle-pin',
                html: `
                    <div id="pin-marker-${store.id}" class="group relative flex items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-125" title="${store.name}">
                        <div style="
                            width: 24px;
                            height: 24px;
                            border-radius: 9999px;
                            background-color: ${palette.bg};
                            border: 2.5px solid #ffffff;
                            box-shadow: 0 2px 6px rgba(0,0,0,0.35);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        ">
                            <div style="width: 8px; height: 8px; border-radius: 9999px; background-color: #ffffff;"></div>
                        </div>
                    </div>
                `,
                iconSize: [24, 24],
                iconAnchor: [12, 12],
                popupAnchor: [0, -12],
            });

            const marker = L.marker([lat, lng], { icon }).addTo(map);

            const popupContent = `
                <div style="font-family: inherit; min-width: 220px; max-width: 280px; padding: 2px;">
                    ${store.thumbnail ? `<div style="width: 100%; height: 90px; border-radius: 6px; overflow: hidden; margin-bottom: 8px; background: #f3f4f6;"><img src="${store.thumbnail}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'" /></div>` : ''}
                    <div style="font-weight: 700; font-size: 13px; color: #111827; line-height: 1.3;">${store.name}</div>
                    <div style="font-size: 11px; color: #6B7280; margin-top: 4px; line-height: 1.4;">${store.description || 'Lokasi butik resmi Aroma Palace.'}</div>
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 8px; padding-top: 6px; border-top: 1px solid #E5E7EB; font-size: 10.5px;">
                        <span style="font-family: monospace; color: #4B5563;">${lat.toFixed(4)}, ${lng.toFixed(4)}</span>
                        <span style="background: #ECFDF5; color: #047857; padding: 2px 7px; border-radius: 9999px; font-weight: 600;">Aktif</span>
                    </div>
                    ${store.gmaps_link ? `<div style="margin-top: 6px;"><a href="${store.gmaps_link}" target="_blank" rel="noopener noreferrer" style="font-size: 11px; color: #4A070B; font-weight: 600; text-decoration: underline;">Buka Google Maps &rarr;</a></div>` : ''}
                </div>
            `;

            marker.bindPopup(popupContent);
            markersRef.current[store.id] = marker;
            markerGroup.push(marker);
        });

        // Fit map to markers or panorama
        if (markerGroup.length === 1) {
            map.setView([Number(validStores[0].latitude), Number(validStores[0].longitude)], 13);
        } else if (markerGroup.length > 1) {
            const group = L.featureGroup(markerGroup);
            map.fitBounds(group.getBounds().pad(0.12));
        }

        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 200);

        return () => {
            clearTimeout(timer);
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
                markersRef.current = {};
            }
        };
    }, [stores]);

    return (
        <div className="relative w-full rounded-2xl overflow-hidden border border-border shadow-xs bg-muted">
            {/* Top-Right Controls Overlay */}
            <div className="absolute top-3 right-3 z-[400] flex items-center gap-2 pointer-events-none">
                <Badge variant="secondary" className="bg-background/90 backdrop-blur-xs shadow-xs text-xs py-1 px-2.5 pointer-events-auto border">
                    <MapPin className="size-3 mr-1 text-primary" />
                    <span>{validStores.length} Gerai Terplot</span>
                </Badge>

                <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleResetView}
                    className="bg-background/90 backdrop-blur-xs shadow-xs text-xs h-7 gap-1 pointer-events-auto cursor-pointer border"
                    title="Reset Tampilan Peta Indonesia"
                >
                    <RotateCcw className="size-3 text-muted-foreground" />
                    <span className="hidden sm:inline">Reset Zoom</span>
                </Button>
            </div>

            <div ref={mapContainerRef} style={{ height }} className="w-full relative z-0" />
        </div>
    );
});

AdminStoresMap.displayName = 'AdminStoresMap';

export default AdminStoresMap;
