import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Plus, Check, Edit2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import type { UserAddress } from '@/types/address';

interface AddressSelectorModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    addresses: UserAddress[];
    selectedAddressId?: number | null;
    onSelectAddress: (address: UserAddress) => void;
    onAddNewAddress: () => void;
    onEditAddress: (address: UserAddress) => void;
}

export default function AddressSelectorModal({
    open,
    onOpenChange,
    addresses,
    selectedAddressId,
    onSelectAddress,
    onAddNewAddress,
    onEditAddress,
}: AddressSelectorModalProps) {
    const { isEn } = useTranslation();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto p-5 sm:p-6 bg-background rounded-xl border border-border/80 shadow-2xl space-y-4">
                <DialogHeader className="pb-3 border-b border-border/70 space-y-1">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[#4A070B] dark:text-[#E8D0BA]">
                            <div className="w-7 h-7 rounded-full bg-[#4A070B]/10 dark:bg-[#E8D0BA]/15 flex items-center justify-center shrink-0">
                                <MapPin className="w-4 h-4" />
                            </div>
                            <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                                {isEn ? 'Select Delivery Address' : 'Pilih Alamat Pengiriman'}
                            </DialogTitle>
                        </div>
                    </div>
                    <DialogDescription className="text-xs text-muted-foreground">
                        {isEn
                            ? 'Select destination address from your saved addresses or add a new one.'
                            : 'Pilih alamat tujuan pengiriman dari daftar tersimpan Anda atau tambahkan alamat baru.'}
                    </DialogDescription>
                </DialogHeader>

                {/* ADD NEW BUTTON */}
                <div>
                    <Button
                        type="button"
                        onClick={() => {
                            onOpenChange(false);
                            onAddNewAddress();
                        }}
                        variant="outline"
                        className="w-full h-10 border-dashed border-[#4A070B]/40 hover:border-[#4A070B] text-[#4A070B] dark:text-[#E8D0BA] text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-none"
                    >
                        <Plus className="w-4 h-4" />
                        <span>{isEn ? '+ Add New Address' : '+ Tambah Alamat Baru'}</span>
                    </Button>
                </div>

                {/* ADDRESSES LIST */}
                <div className="space-y-3 pt-1">
                    {addresses.length === 0 ? (
                        <div className="p-6 text-center text-xs text-muted-foreground border border-dashed border-border/80 rounded-lg">
                            {isEn ? 'No addresses saved yet.' : 'Belum ada alamat pengiriman tersimpan.'}
                        </div>
                    ) : (
                        addresses.map((addr) => {
                            const isSelected = selectedAddressId === addr.id;

                            return (
                                <div
                                    key={addr.id}
                                    onClick={() => {
                                        onSelectAddress(addr);
                                        onOpenChange(false);
                                    }}
                                    className={`p-3.5 rounded-lg border transition cursor-pointer relative ${
                                        isSelected
                                            ? 'border-[#4A070B] bg-[#4A070B]/5 shadow-xs'
                                            : 'border-border/80 hover:border-[#4A070B]/50 bg-card/60'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="space-y-1 text-xs">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <Badge
                                                    variant="secondary"
                                                    className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-muted text-foreground"
                                                >
                                                    {addr.label || 'Alamat'}
                                                </Badge>
                                                {addr.is_primary && (
                                                    <Badge className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                                                        {isEn ? 'Primary' : 'Utama'}
                                                    </Badge>
                                                )}
                                                {isSelected && (
                                                    <span className="text-[10px] font-bold text-[#4A070B] dark:text-[#E8D0BA] flex items-center gap-0.5">
                                                        <Check className="w-3 h-3 text-[#4A070B] dark:text-[#E8D0BA]" />
                                                        {isEn ? 'Selected' : 'Terpilih'}
                                                    </span>
                                                )}
                                            </div>

                                            <p className="font-bold text-foreground text-xs sm:text-sm pt-0.5">
                                                {addr.recipient_name} • <span className="text-muted-foreground font-medium">{addr.recipient_phone}</span>
                                            </p>

                                            <p className="text-muted-foreground leading-relaxed">
                                                {addr.address}
                                            </p>

                                            <p className="text-[11px] text-muted-foreground font-medium">
                                                {[
                                                    addr.subdistrict_name ? `Kel. ${addr.subdistrict_name}` : null,
                                                    addr.district_name ? `Kec. ${addr.district_name}` : null,
                                                    addr.city_name,
                                                    addr.province_name,
                                                    addr.postal_code,
                                                ]
                                                    .filter(Boolean)
                                                    .join(', ')}
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onOpenChange(false);
                                                onEditAddress(addr);
                                            }}
                                            className="text-muted-foreground hover:text-[#4A070B] p-1.5 rounded-md hover:bg-muted transition cursor-pointer shrink-0"
                                            title={isEn ? 'Edit address' : 'Ubah alamat'}
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
