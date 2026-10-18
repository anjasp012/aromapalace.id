import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, Navigation, Locate, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StoreMapPickerProps {
    latitude: number | string | null | undefined;
    longitude: number | string | null | undefined;
    onChange: (lat: number, lng: number) => void;
    height?: string;
}

const CITY_PRESETS = [
    { name: 'Jakarta', lat: -6.2088, lng: 106.8456 },
    { name: 'Bandung', lat: -6.9175, lng: 107.6191 },
    { name: 'Surabaya', lat: -7.2575, lng: 112.7521 },
    { name: 'Bali', lat: -8.6705, lng: 115.2126 },
    { name: 'Yogyakarta', lat: -7.7956, lng: 110.3695 },
    { name: 'Medan', lat: 3.5952, lng: 98.6722 },
];

export default function StoreMapPicker({
    latitude,
    longitude,
    onChange,
    height = '260px',
}: StoreMapPickerProps) {
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);
    const [isLocating, setIsLocating] = useState(false);

    const parsedLat = typeof latitude === 'number' ? latitude : parseFloat(String(latitude || ''));
    const parsedLng = typeof longitude === 'number' ? longitude : parseFloat(String(longitude || ''));

    const hasValidCoords = !isNaN(parsedLat) && !isNaN(parsedLng);
    const currentLat = hasValidCoords ? parsedLat : -6.2088;
    const currentLng = hasValidCoords ? parsedLng : 106.8456;

    useEffect(() => {
        if (!mapContainerRef.current) return;

        // Cleanup existing map if any
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
            markerRef.current = null;
        }

        const map = L.map(mapContainerRef.current, {
            center: [currentLat, currentLng],
            zoom: hasValidCoords ? 15 : 12,
            scrollWheelZoom: false,
        });

        mapInstanceRef.current = map;

        // OpenStreetMap tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap',
            maxZoom: 19,
        }).addTo(map);

        // Custom Burgundy & Gold Pin
        const pinIcon = L.divIcon({
            className: 'admin-picker-pin',
            html: `
                <div class="relative flex flex-col items-center cursor-move -translate-x-1/2 -translate-y-full">
                    <div class="w-8 h-8 rounded-full bg-[#4A070B] ring-4 ring-[#D4A373] shadow-lg flex items-center justify-center text-white">
                        <svg class="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 21s-6-4.35-6-9.5a6 6 0 1 1 12 0c0 5.15-6 9.5-6 9.5z"/>
                            <circle cx="12" cy="11.5" r="2.5" fill="currentColor"/>
                        </svg>
                    </div>
                    <div class="w-2 h-2 bg-[#4A070B] rotate-45 -mt-1"></div>
                </div>
            `,
            iconSize: [32, 38],
            iconAnchor: [16, 38],
        });

        const marker = L.marker([currentLat, currentLng], {
            icon: pinIcon,
            draggable: true,
        }).addTo(map);

        markerRef.current = marker;

        // Handle marker drag
        marker.on('dragend', () => {
            const pos = marker.getLatLng();
            onChange(Number(pos.lat.toFixed(6)), Number(pos.lng.toFixed(6)));
        });

        // Handle map click to reposition marker
        map.on('click', (e: L.LeafletMouseEvent) => {
            marker.setLatLng(e.latlng);
            onChange(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)));
        });

        // Fix leaflet container size inside modals
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 250);

        return () => {
            clearTimeout(timer);
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
                markerRef.current = null;
            }
        };
    }, []);

    // Update marker position when lat/lng props change from outside
    useEffect(() => {
        if (!markerRef.current || !mapInstanceRef.current || !hasValidCoords) return;

        const currentMarkerPos = markerRef.current.getLatLng();
        const dist = Math.abs(currentMarkerPos.lat - parsedLat) + Math.abs(currentMarkerPos.lng - parsedLng);

        if (dist > 0.0001) {
            markerRef.current.setLatLng([parsedLat, parsedLng]);
            mapInstanceRef.current.panTo([parsedLat, parsedLng]);
        }
    }, [parsedLat, parsedLng, hasValidCoords]);

    const handleJumpToCity = (lat: number, lng: number) => {
        onChange(lat, lng);
        if (mapInstanceRef.current && markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
            mapInstanceRef.current.flyTo([lat, lng], 14, { duration: 1 });
        }
    };

    const handleLocateMe = () => {
        if (!navigator.geolocation) {
            alert('Browser tidak mendukung pendeteksian lokasi GPS.');
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setIsLocating(false);
                const lat = Number(position.coords.latitude.toFixed(6));
                const lng = Number(position.coords.longitude.toFixed(6));
                handleJumpToCity(lat, lng);
            },
            () => {
                setIsLocating(false);
                alert('Tidak dapat mendeteksi lokasi. Pastikan izin GPS diizinkan pada peramban Anda.');
            },
            { timeout: 10000 }
        );
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-foreground flex items-center gap-1">
                    <MapPin className="size-3.5 text-primary" />
                    <span>Pilih Titik Lokasi pada Peta (Klik atau Geser Pin)</span>
                </span>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleLocateMe}
                    disabled={isLocating}
                    className="h-6 px-2 text-[10.5px] gap-1 cursor-pointer"
                >
                    <Locate className="size-3" />
                    <span>{isLocating ? 'Mendeteksi...' : 'Lokasi Saya'}</span>
                </Button>
            </div>

            {/* Map Frame */}
            <div className="relative rounded-lg overflow-hidden border border-border bg-muted">
                <div
                    ref={mapContainerRef}
                    style={{ height }}
                    className="w-full relative z-0"
                />

                <div className="absolute bottom-2 left-2 right-2 z-[400] pointer-events-none">
                    <div className="bg-background/90 backdrop-blur-xs px-2.5 py-1.5 rounded-md border text-[10.5px] flex items-center justify-between text-muted-foreground shadow-xs pointer-events-auto">
                        <span className="font-mono">
                            {hasValidCoords ? `${parsedLat.toFixed(5)}, ${parsedLng.toFixed(5)}` : 'Klik peta untuk menentukan titik'}
                        </span>
                        <span className="text-[10px] text-muted-foreground/80">Leaflet OpenStreetMap</span>
                    </div>
                </div>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                <span className="text-muted-foreground shrink-0 text-[10px]">Kota Populer:</span>
                {CITY_PRESETS.map((city) => (
                    <button
                        key={city.name}
                        type="button"
                        onClick={() => handleJumpToCity(city.lat, city.lng)}
                        className="px-2 py-0.5 rounded-md border bg-card hover:bg-muted text-[10.5px] font-medium transition-colors shrink-0 cursor-pointer"
                    >
                        {city.name}
                    </button>
                ))}
            </div>
        </div>
    );
}
