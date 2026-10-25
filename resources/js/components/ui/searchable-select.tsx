import React, { useState, useMemo, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronDown, Search, X, Loader2 } from 'lucide-react';

export interface SearchableOption {
    id: number | string;
    name: string;
    type?: string;
    postal_code?: string;
    [key: string]: any;
}

interface SearchableSelectProps {
    options: SearchableOption[];
    value: number | string | '';
    fallbackLabel?: string;
    onChange: (value: number | string, option?: SearchableOption) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    disabled?: boolean;
    loading?: boolean;
    className?: string;
    emptyMessage?: string;
    id?: string;
}

export default function SearchableSelect({
    options = [],
    value,
    fallbackLabel,
    onChange,
    placeholder = 'Pilih...',
    searchPlaceholder = 'Cari...',
    disabled = false,
    loading = false,
    className,
    emptyMessage = 'Tidak ditemukan hasil pencarian.',
    id,
}: SearchableSelectProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    // Find the currently selected option object
    const selectedOption = useMemo(() => {
        if (value === '' || value === null || value === undefined) return null;
        const found = options.find((opt) => String(opt.id) === String(value));
        if (found) return found;
        if (fallbackLabel) {
            return { id: value, name: fallbackLabel };
        }
        return null;
    }, [options, value, fallbackLabel]);

    const getOptionLabel = (opt?: SearchableOption | null): string => {
        if (!opt) return '';
        return opt.name || opt.provinsi_name || opt.kabupaten_name || opt.kecamatan_name || opt.kelurahan_name || '';
    };

    // Filter options based on search query
    const filteredOptions = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return options;

        return options.filter((opt) => {
            const label = getOptionLabel(opt);
            const nameMatch = label.toLowerCase().includes(query);
            const typeMatch = opt.type?.toLowerCase().includes(query);
            const postalMatch = opt.postal_code?.toLowerCase().includes(query);
            return nameMatch || typeMatch || postalMatch;
        });
    }, [options, search]);

    // Reset search when popover opens without forcing autofocus
    useEffect(() => {
        if (open) {
            setSearch('');
        }
    }, [open]);

    const touchStartY = useRef<number | null>(null);
    const isSwiping = useRef(false);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartY.current = e.touches[0]?.clientY ?? null;
        isSwiping.current = false;
        e.stopPropagation();
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (touchStartY.current !== null && e.touches[0]) {
            const delta = Math.abs(e.touches[0].clientY - touchStartY.current);
            if (delta > 6) {
                isSwiping.current = true;
            }
        }
        e.stopPropagation();
    };

    const handleTouchEnd = () => {
        touchStartY.current = null;
        setTimeout(() => {
            isSwiping.current = false;
        }, 120);
    };

    const handleSelect = (option: SearchableOption) => {
        if (isSwiping.current) return;
        onChange(option.id, option);
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen} modal={false}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    id={id}
                    disabled={disabled || loading}
                    className={cn(
                        'flex h-9 w-full items-center justify-between gap-2 rounded-md border border-border/80 bg-background px-3 py-1.5 text-xs text-foreground transition-all hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#4A070B] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer select-none text-left',
                        className
                    )}
                >
                    <span className="truncate flex-1">
                        {loading ? (
                            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>Memuat data...</span>
                            </span>
                        ) : selectedOption ? (
                            <span className="font-medium text-foreground">
                                {selectedOption.type ? `${selectedOption.type} ` : ''}
                                {getOptionLabel(selectedOption)}
                                {selectedOption.postal_code ? (
                                    <span className="text-muted-foreground ml-1.5 text-[11px]">
                                        ({selectedOption.postal_code})
                                    </span>
                                ) : null}
                            </span>
                        ) : (
                            <span className="text-muted-foreground">{placeholder}</span>
                        )}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-60 text-muted-foreground shrink-0" />
                </button>
            </PopoverTrigger>

            <PopoverContent
                portalled={false}
                align="start"
                sideOffset={4}
                className="p-1.5 w-[var(--radix-popover-trigger-width)] min-w-[260px] max-w-[380px] bg-popover/95 backdrop-blur-md border border-border/80 rounded-lg shadow-xl z-50 overscroll-contain touch-pan-y"
            >
                {/* Search Bar */}
                <div className="relative mb-1">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={searchPlaceholder}
                        className="w-full h-8 pl-8 pr-7 text-xs rounded-md bg-muted/40 border border-border/60 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#4A070B] focus:bg-background"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && filteredOptions.length > 0) {
                                e.preventDefault();
                                handleSelect(filteredOptions[0]);
                            }
                        }}
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={() => setSearch('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    )}
                </div>

                {/* Options List */}
                <div
                    className="max-h-56 overflow-y-auto overscroll-contain touch-pan-y divide-y divide-border/30 rounded-md [-webkit-overflow-scrolling:touch]"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onWheel={(e) => e.stopPropagation()}
                >
                    {filteredOptions.length === 0 ? (
                        <div className="p-3 text-center text-xs text-muted-foreground">
                            {emptyMessage}
                        </div>
                    ) : (
                        filteredOptions.map((opt) => {
                            const isSelected = String(opt.id) === String(value);
                            return (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => handleSelect(opt)}
                                    className={cn(
                                        'w-full flex items-center justify-between gap-2 px-2.5 py-2 text-xs rounded-md transition-colors text-left cursor-pointer select-none touch-pan-y',
                                        isSelected
                                            ? 'bg-[#4A070B]/10 text-[#4A070B] dark:text-[#E8D0BA] font-semibold'
                                            : 'hover:bg-muted/50 text-foreground'
                                    )}
                                >
                                    <div className="truncate flex-1">
                                        <span>
                                            {opt.type ? `${opt.type} ` : ''}
                                            {getOptionLabel(opt)}
                                        </span>
                                        {opt.postal_code && (
                                            <span className="text-[10.5px] text-muted-foreground ml-1.5 font-normal">
                                                - {opt.postal_code}
                                            </span>
                                        )}
                                    </div>
                                    {isSelected && <Check className="w-3.5 h-3.5 text-[#4A070B] dark:text-[#E8D0BA] shrink-0" />}
                                </button>
                            );
                        })
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
