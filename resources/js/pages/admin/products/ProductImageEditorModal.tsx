import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    X,
    Check,
    RotateCw,
    ZoomIn,
    ZoomOut,
    Move,
    Grid,
    Maximize2,
    Crop,
    SlidersHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';

interface ProductImageEditorModalProps {
    open: boolean;
    imageUrl: string;
    imageName?: string;
    onClose: () => void;
    onSave: (editedFile: File, newPreviewUrl: string) => void;
}

type GridMode = 'thirds' | 'fine' | 'none';

export default function ProductImageEditorModal({
    open,
    imageUrl,
    imageName = 'product-image.jpg',
    onClose,
    onSave,
}: ProductImageEditorModalProps) {
    const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    // Transform states
    const [zoom, setZoom] = useState<number>(1);
    const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [rotation, setRotation] = useState<number>(0); // 0, 90, 180, 270
    const [gridMode, setGridMode] = useState<GridMode>('thirds');
    const [bgTheme, setBgTheme] = useState<'checker' | 'white' | 'dark'>('checker');

    // Dragging state
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number }>({
        mouseX: 0,
        mouseY: 0,
        startX: 0,
        startY: 0,
    });

    const viewportRef = useRef<HTMLDivElement | null>(null);
    const [viewportSize, setViewportSize] = useState<number>(360);

    // Update viewport size based on container
    useEffect(() => {
        if (!open) return;
        const updateSize = () => {
            if (viewportRef.current) {
                const rect = viewportRef.current.getBoundingClientRect();
                setViewportSize(Math.min(rect.width, rect.height) || 360);
            }
        };
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, [open]);

    // Load image
    useEffect(() => {
        if (!open || !imageUrl) return;

        setIsLoading(true);
        setLoadError(null);
        setZoom(1);
        setPosition({ x: 0, y: 0 });
        setRotation(0);

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            setImgElement(img);
            setIsLoading(false);
        };
        img.onerror = () => {
            setIsLoading(false);
            setLoadError('Gagal memuat gambar untuk diedit.');
        };
        img.src = imageUrl;
    }, [open, imageUrl]);

    // Calculate base fit scale
    const getBaseScale = useCallback(() => {
        if (!imgElement || viewportSize <= 0) return 1;
        const isRotated = rotation % 180 !== 0;
        const w = isRotated ? imgElement.naturalHeight : imgElement.naturalWidth;
        const h = isRotated ? imgElement.naturalWidth : imgElement.naturalHeight;
        if (w <= 0 || h <= 0) return 1;

        // Fit inside square viewport
        return Math.min(viewportSize / w, viewportSize / h);
    }, [imgElement, viewportSize, rotation]);

    // Handle drag
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        dragStartRef.current = {
            mouseX: e.clientX,
            mouseY: e.clientY,
            startX: position.x,
            startY: position.y,
        };
    };

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (!isDragging) return;
            const dx = e.clientX - dragStartRef.current.mouseX;
            const dy = e.clientY - dragStartRef.current.mouseY;
            setPosition({
                x: dragStartRef.current.startX + dx,
                y: dragStartRef.current.startY + dy,
            });
        },
        [isDragging]
    );

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    // Touch drag
    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 1) {
            setIsDragging(true);
            dragStartRef.current = {
                mouseX: e.touches[0].clientX,
                mouseY: e.touches[0].clientY,
                startX: position.x,
                startY: position.y,
            };
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging || e.touches.length !== 1) return;
        const dx = e.touches[0].clientX - dragStartRef.current.mouseX;
        const dy = e.touches[0].clientY - dragStartRef.current.mouseY;
        setPosition({
            x: dragStartRef.current.startX + dx,
            y: dragStartRef.current.startY + dy,
        });
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, handleMouseMove, handleMouseUp]);

    // Mouse wheel zoom
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.08 : -0.08;
        setZoom((prev) => Math.min(3.5, Math.max(0.4, Number((prev + delta).toFixed(2)))));
    };

    // Rotate 90 deg clockwise
    const handleRotate = () => {
        setRotation((prev) => (prev + 90) % 360);
    };

    // Reset view
    const handleReset = () => {
        setZoom(1);
        setPosition({ x: 0, y: 0 });
        setRotation(0);
    };

    // Apply & Export
    const handleApply = () => {
        if (!imgElement) return;

        const OUTPUT_SIZE = 1200; // Standard 1:1 high-resolution product image
        const canvas = document.createElement('canvas');
        canvas.width = OUTPUT_SIZE;
        canvas.height = OUTPUT_SIZE;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Optional background fill
        if (bgTheme === 'white') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
        } else if (bgTheme === 'dark') {
            ctx.fillStyle = '#18181B';
            ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
        }

        const baseScale = getBaseScale();
        const ratio = OUTPUT_SIZE / (viewportSize || 360);

        ctx.save();
        // Move to canvas center + pan translation adjusted to ratio
        ctx.translate(OUTPUT_SIZE / 2 + position.x * ratio, OUTPUT_SIZE / 2 + position.y * ratio);
        // Apply rotation around center
        ctx.rotate((rotation * Math.PI) / 180);
        // Apply scale
        const finalScale = baseScale * zoom * ratio;
        ctx.scale(finalScale, finalScale);

        // Draw image centered
        ctx.drawImage(
            imgElement,
            -imgElement.naturalWidth / 2,
            -imgElement.naturalHeight / 2
        );
        ctx.restore();

        const mimeType = imageName.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
        const quality = mimeType === 'image/jpeg' ? 0.92 : undefined;

        canvas.toBlob((blob) => {
            if (!blob) return;
            const cleanName = imageName.replace(/\.[^/.]+$/, '') + (mimeType === 'image/png' ? '.png' : '.jpg');
            const file = new File([blob], cleanName, { type: mimeType });
            const newUrl = URL.createObjectURL(blob);
            onSave(file, newUrl);
            onClose();
        }, mimeType, quality);
    };

    if (!open) return null;

    const baseScale = getBaseScale();
    const effectiveScale = baseScale * zoom;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in-50">
            <div
                className="bg-card text-card-foreground border border-border rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[95vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-muted/20">
                    <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                            <Crop className="size-4" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-foreground">Sesuaikan &amp; Rapikan Foto Produk</h3>
                            <p className="text-[11px] text-muted-foreground">
                                Gunakan grid bantuan untuk memastikan posisi botol sejajar, lurus, dan simetris.
                            </p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="size-8 text-muted-foreground hover:text-foreground">
                        <X className="size-4" />
                    </Button>
                </div>

                {/* Editor Body */}
                <div className="p-4 sm:p-5 flex flex-col items-center gap-4 overflow-y-auto">
                    {/* Viewport Canvas (Square 1:1) */}
                    <div
                        ref={viewportRef}
                        onMouseDown={handleMouseDown}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onWheel={handleWheel}
                        className={`relative w-full max-w-[360px] sm:max-w-[400px] aspect-square rounded-xl overflow-hidden select-none border-2 shadow-inner transition-colors ${
                            isDragging ? 'cursor-grabbing border-primary' : 'cursor-grab border-border/80 hover:border-primary/50'
                        } ${
                            bgTheme === 'checker'
                                ? 'bg-[linear-gradient(45deg,#f0f0f0_25%,transparent_25%),linear-gradient(-45deg,#f0f0f0_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f0f0f0_75%),linear-gradient(-45deg,transparent_75%,#f0f0f0_75%)] dark:bg-[linear-gradient(45deg,#262626_25%,transparent_25%),linear-gradient(-45deg,#262626_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#262626_75%),linear-gradient(-45deg,transparent_75%,#262626_75%)] bg-[size:16px_16px]'
                                : bgTheme === 'white'
                                ? 'bg-white'
                                : 'bg-zinc-900'
                        }`}
                        title="Geser mouse untuk menggeser posisi, scroll mouse untuk zoom in/out"
                    >
                        {isLoading && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 text-xs text-muted-foreground">
                                <span className="animate-spin mb-2">⏳</span>
                                <span>Memuat gambar...</span>
                            </div>
                        )}

                        {loadError && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-destructive/10 text-destructive text-xs p-4 text-center">
                                <span>{loadError}</span>
                            </div>
                        )}

                        {/* Transformed Image */}
                        {imgElement && !isLoading && (
                            <div
                                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                                style={{
                                    transform: `translate(${position.x}px, ${position.y}px)`,
                                }}
                            >
                                <img
                                    src={imgElement.src}
                                    alt="Editor preview"
                                    draggable={false}
                                    style={{
                                        transform: `rotate(${rotation}deg) scale(${effectiveScale})`,
                                        transformOrigin: 'center center',
                                        maxWidth: 'none',
                                        maxHeight: 'none',
                                    }}
                                    className="pointer-events-none transition-transform duration-75"
                                />
                            </div>
                        )}

                        {/* GRID OVERLAYS */}
                        {gridMode === 'thirds' && (
                            <div className="absolute inset-0 pointer-events-none">
                                {/* Rule of Thirds Lines */}
                                <div className="absolute left-1/3 inset-y-0 w-px bg-white/40 dark:bg-white/30 shadow-[0_0_1px_rgba(0,0,0,0.8)]" />
                                <div className="absolute left-2/3 inset-y-0 w-px bg-white/40 dark:bg-white/30 shadow-[0_0_1px_rgba(0,0,0,0.8)]" />
                                <div className="absolute top-1/3 inset-x-0 h-px bg-white/40 dark:bg-white/30 shadow-[0_0_1px_rgba(0,0,0,0.8)]" />
                                <div className="absolute top-2/3 inset-x-0 h-px bg-white/40 dark:bg-white/30 shadow-[0_0_1px_rgba(0,0,0,0.8)]" />

                                {/* Center Alignment Crosshair Guide (Amber Accent) */}
                                <div className="absolute left-1/2 inset-y-0 w-px border-l border-dashed border-amber-400/80 shadow-[0_0_2px_rgba(0,0,0,0.8)]" />
                                <div className="absolute top-1/2 inset-x-0 h-px border-t border-dashed border-amber-400/80 shadow-[0_0_2px_rgba(0,0,0,0.8)]" />

                                {/* Center Target Ring */}
                                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-7 rounded-full border border-amber-400/80 shadow-[0_0_2px_rgba(0,0,0,0.8)] flex items-center justify-center">
                                    <div className="size-1 rounded-full bg-amber-400" />
                                </div>
                            </div>
                        )}

                        {gridMode === 'fine' && (
                            <div className="absolute inset-0 pointer-events-none">
                                {/* 6x6 Fine Alignment Grid */}
                                {[16.666, 33.333, 50, 66.666, 83.333].map((pct, i) => (
                                    <React.Fragment key={i}>
                                        <div
                                            className={`absolute inset-y-0 w-px ${
                                                pct === 50
                                                    ? 'border-l border-dashed border-amber-400/90'
                                                    : 'bg-white/30 shadow-[0_0_1px_rgba(0,0,0,0.8)]'
                                            }`}
                                            style={{ left: `${pct}%` }}
                                        />
                                        <div
                                            className={`absolute inset-x-0 h-px ${
                                                pct === 50
                                                    ? 'border-t border-dashed border-amber-400/90'
                                                    : 'bg-white/30 shadow-[0_0_1px_rgba(0,0,0,0.8)]'
                                            }`}
                                            style={{ top: `${pct}%` }}
                                        />
                                    </React.Fragment>
                                ))}
                                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-6 rounded-full border border-amber-400/90 flex items-center justify-center">
                                    <div className="size-1 rounded-full bg-amber-400" />
                                </div>
                            </div>
                        )}

                        {/* Top-Right Badge Indicator */}
                        <div className="absolute top-2 right-2 flex items-center gap-1.5 pointer-events-none">
                            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-black/60 text-white backdrop-blur-xs">
                                1:1 Persegi
                            </span>
                        </div>

                        {/* Bottom-Left Hint */}
                        <div className="absolute bottom-2 left-2 text-[10px] text-white/90 bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-xs flex items-center gap-1 pointer-events-none">
                            <Move className="size-3" />
                            <span>Geser foto untuk memposisikan</span>
                        </div>
                    </div>

                    {/* Toolbar & Controls */}
                    <div className="w-full space-y-3.5 bg-muted/30 p-3.5 rounded-xl border border-border">
                        {/* Zoom Row */}
                        <div className="flex items-center gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="size-7 shrink-0"
                                onClick={() => setZoom((prev) => Math.max(0.4, Number((prev - 0.1).toFixed(2))))}
                                title="Perkecil (Zoom Out)"
                            >
                                <ZoomOut className="size-3.5" />
                            </Button>

                            <div className="flex-1 flex items-center gap-2.5">
                                <input
                                    type="range"
                                    min={0.4}
                                    max={3.0}
                                    step={0.02}
                                    value={zoom}
                                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                                    className="w-full accent-primary h-1.5 rounded-lg cursor-pointer bg-muted"
                                />
                                <span className="font-mono text-xs w-11 text-right text-muted-foreground font-medium">
                                    {Math.round(zoom * 100)}%
                                </span>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="size-7 shrink-0"
                                onClick={() => setZoom((prev) => Math.min(3.0, Number((prev + 0.1).toFixed(2))))}
                                title="Perbesar (Zoom In)"
                            >
                                <ZoomIn className="size-3.5" />
                            </Button>
                        </div>

                        {/* Quick Action Tools */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/60 text-xs">
                            <div className="flex items-center gap-1.5">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleRotate}
                                    className="h-7 text-xs px-2.5"
                                    title="Putar 90 derajat searah jarum jam"
                                >
                                    <RotateCw className="size-3.5 mr-1" />
                                    <span>Putar {rotation > 0 ? `(${rotation}°)` : ''}</span>
                                </Button>

                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleReset}
                                    className="h-7 text-xs px-2.5"
                                    title="Reset posisi dan zoom ke awal"
                                >
                                    <Maximize2 className="size-3.5 mr-1" />
                                    <span>Pusatkan</span>
                                </Button>
                            </div>

                            {/* Grid Switcher */}
                            <div className="flex items-center gap-1 bg-background p-0.5 rounded-lg border border-border">
                                <button
                                    type="button"
                                    onClick={() => setGridMode('thirds')}
                                    className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                                        gridMode === 'thirds' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                    title="Grid Garis Bantu Tengah & 3x3"
                                >
                                    Grid 3x3
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setGridMode('fine')}
                                    className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                                        gridMode === 'fine' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                    title="Grid Rapat (Presisi)"
                                >
                                    Grid Rapat
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setGridMode('none')}
                                    className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                                        gridMode === 'none' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                    title="Tanpa Garis Bantu"
                                >
                                    Polos
                                </button>
                            </div>
                        </div>

                        {/* Background Theme Switcher (for PNG transparency) */}
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                            <span>Latar Belakang Pratinjau:</span>
                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => setBgTheme('checker')}
                                    className={`px-2 py-0.5 rounded border text-[10.5px] ${
                                        bgTheme === 'checker' ? 'border-primary bg-primary/10 text-primary font-semibold' : 'border-border text-muted-foreground'
                                    }`}
                                >
                                    Transparan
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setBgTheme('white')}
                                    className={`px-2 py-0.5 rounded border text-[10.5px] ${
                                        bgTheme === 'white' ? 'border-primary bg-primary/10 text-primary font-semibold' : 'border-border text-muted-foreground'
                                    }`}
                                >
                                    Putih
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setBgTheme('dark')}
                                    className={`px-2 py-0.5 rounded border text-[10.5px] ${
                                        bgTheme === 'dark' ? 'border-primary bg-primary/10 text-primary font-semibold' : 'border-border text-muted-foreground'
                                    }`}
                                >
                                    Gelap
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-between px-5 py-3.5 border-t border-border bg-muted/20">
                    <p className="text-[11px] text-muted-foreground hidden sm:block">
                        Hasil foto akan diekspor rapi dalam format persegi 1:1 resolusi tinggi.
                    </p>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <Button type="button" variant="outline" size="sm" onClick={onClose}>
                            Batal
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            onClick={handleApply}
                            disabled={isLoading || !!loadError}
                            className="bg-[#4A070B] hover:bg-[#380508] text-white"
                        >
                            <Check className="size-4 mr-1.5" />
                            <span>Terapkan Perubahan</span>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
