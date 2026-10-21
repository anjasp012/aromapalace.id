import React, { useState, useRef } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import {
    Search,
    Plus,
    CreditCard,
    Edit3,
    Trash2,
    RefreshCw,
    Upload,
    Image,
    Check,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';

interface PaymentMethodItem {
    id: number;
    code: string;
    name: string;
    icon?: string | null;
    created_at?: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaymentMethodsIndexProps {
    paymentMethods: {
        data: PaymentMethodItem[];
        links: PaginationLink[];
        current_page: number;
        last_page: number;
        total: number;
    };
    filters: {
        search: string;
    };
    metrics: {
        total_methods: number;
    };
}

export default function AdminPaymentMethodsIndex({
    paymentMethods,
    filters,
    metrics,
}: PaymentMethodsIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<PaymentMethodItem | null>(null);

    const [deleteTarget, setDeleteTarget] = useState<PaymentMethodItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [iconPreview, setIconPreview] = useState<string | null>(null);

    const form = useForm<{
        _method?: string;
        name: string;
        code: string;
        icon: File | string | null;
    }>({
        name: '',
        code: '',
        icon: null,
    });

    const slugify = (text: string) => {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '_')
            .replace(/[^\w_]+/g, '');
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/payment-methods', { search: search || undefined }, { preserveState: true });
    };

    const handleResetSearch = () => {
        setSearch('');
        router.get('/payment-methods');
    };

    const handleOpenCreate = () => {
        setEditingItem(null);
        setIconPreview(null);
        form.setData({
            name: '',
            code: '',
            icon: null,
        });
        form.clearErrors();
        setDialogOpen(true);
    };

    const handleOpenEdit = (pm: PaymentMethodItem) => {
        setEditingItem(pm);
        setIconPreview(pm.icon || null);
        form.setData({
            _method: 'put',
            name: pm.name,
            code: pm.code,
            icon: pm.icon || '',
        });
        form.clearErrors();
        setDialogOpen(true);
    };

    const handleNameChange = (nameVal: string) => {
        form.setData((prev) => ({
            ...prev,
            name: nameVal,
            code: editingItem ? prev.code : slugify(nameVal),
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            form.setData('icon', file);
            setIconPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingItem) {
            form.post(`/payment-methods/${editingItem.id}`, {
                forceFormData: true,
                onSuccess: () => {
                    setDialogOpen(false);
                },
            });
        } else {
            form.post('/payment-methods', {
                forceFormData: true,
                onSuccess: () => {
                    setDialogOpen(false);
                },
            });
        }
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        router.delete(`/payment-methods/${deleteTarget.id}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeleteTarget(null);
            },
        });
    };

    const renderIconBadge = (iconStr?: string | null, nameStr: string = '') => {
        if (!iconStr) {
            return (
                <div className="size-9 rounded-md bg-muted border flex items-center justify-center text-muted-foreground shrink-0">
                    <CreditCard className="size-4" />
                </div>
            );
        }

        // If it looks like a URL or file path
        if (iconStr.startsWith('http') || iconStr.startsWith('/') || iconStr.startsWith('blob:')) {
            return (
                <div className="size-9 rounded-md border bg-muted/30 overflow-hidden flex items-center justify-center p-1 shrink-0">
                    <img
                        src={iconStr}
                        alt={nameStr}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                        }}
                    />
                </div>
            );
        }

        // If it's a short text identifier like "qris", "bca", "bri", "pakasir"
        return (
            <div className="size-9 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-[10px] uppercase shrink-0">
                {iconStr.slice(0, 4)}
            </div>
        );
    };

    return (
        <AdminLayout
            title="Metode Pembayaran"
            subtitle="Kelola kanal pembayaran, virtual account, dan QRIS untuk transaksi pelanggan."
        >
            <div className="w-full space-y-6">
                {/* Header Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-foreground">Metode Pembayaran</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Total {metrics.total_methods} kanal pembayaran terdaftar di sistem.
                        </p>
                    </div>

                    <Button onClick={handleOpenCreate} size="sm" className="h-9">
                        <Plus className="size-4 mr-1.5" />
                        <span>Tambah Metode</span>
                    </Button>
                </div>

                {/* Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="p-4 pb-2">
                            <CardDescription className="text-xs">Total Kanal Pembayaran</CardDescription>
                            <CardTitle className="text-2xl font-bold">{metrics.total_methods}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <CreditCard className="size-3 text-primary" />
                                <span>Tersedia di halaman checkout</span>
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Search & Filter Toolbar */}
                <Card>
                    <CardContent className="p-3">
                        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Cari berdasarkan nama atau kode (contoh: qris, bca, mandiri)..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9 h-9 text-xs"
                                />
                            </div>
                            <Button type="submit" size="sm" variant="secondary" className="h-9">
                                Cari
                            </Button>
                            {filters.search && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleResetSearch}
                                    className="h-9 text-xs text-muted-foreground"
                                >
                                    <RefreshCw className="size-3.5 mr-1" />
                                    Reset
                                </Button>
                            )}
                        </form>
                    </CardContent>
                </Card>

                {/* Table Card */}
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                                <thead className="border-b bg-muted/30 text-muted-foreground uppercase text-[11px] font-semibold tracking-wider">
                                    <tr>
                                        <th className="p-4 w-16">Logo</th>
                                        <th className="p-4">Nama Metode</th>
                                        <th className="p-4">Kode Teknis</th>
                                        <th className="p-4 w-32 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {paymentMethods.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="p-8 text-center text-muted-foreground">
                                                <CreditCard className="size-8 mx-auto mb-2 opacity-40" />
                                                <p className="font-medium text-foreground">Tidak ada metode pembayaran ditemukan.</p>
                                                <p className="text-[11px] mt-1">Coba sesuaikan kata kunci pencarian Anda atau tambahkan baru.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        paymentMethods.data.map((pm) => (
                                            <tr key={pm.id} className="hover:bg-muted/20 transition-colors">
                                                <td className="p-4 align-middle">
                                                    {renderIconBadge(pm.icon, pm.name)}
                                                </td>
                                                <td className="p-4 align-middle font-medium text-foreground">
                                                    <div className="font-semibold text-sm">{pm.name}</div>
                                                    <div className="text-[11px] text-muted-foreground mt-0.5">ID: #{pm.id}</div>
                                                </td>
                                                <td className="p-4 align-middle">
                                                    <Badge variant="outline" className="font-mono text-[11px] bg-muted/30">
                                                        {pm.code}
                                                    </Badge>
                                                </td>
                                                <td className="p-4 align-middle text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleOpenEdit(pm)}
                                                            className="size-8 text-muted-foreground hover:text-foreground"
                                                            title="Edit Metode"
                                                        >
                                                            <Edit3 className="size-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => setDeleteTarget(pm)}
                                                            className="size-8 text-destructive hover:bg-destructive/10"
                                                            title="Hapus Metode"
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Links */}
                        {paymentMethods.links && paymentMethods.links.length > 3 && (
                            <div className="flex items-center justify-between border-t p-4">
                                <span className="text-xs text-muted-foreground">
                                    Halaman {paymentMethods.current_page} dari {paymentMethods.last_page} (Total {paymentMethods.total})
                                </span>
                                <div className="flex items-center gap-1">
                                    {paymentMethods.links.map((link, idx) => (
                                        <Button
                                            key={idx}
                                            variant={link.active ? 'default' : 'outline'}
                                            size="sm"
                                            disabled={!link.url}
                                            asChild={!!link.url}
                                            className="h-8 px-3 text-xs"
                                        >
                                            {link.url ? (
                                                <Link
                                                    href={link.url}
                                                    preserveState
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            ) : (
                                                <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                            )}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Dialog Form Create / Edit */}
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>
                                {editingItem ? 'Edit Metode Pembayaran' : 'Tambah Metode Pembayaran Baru'}
                            </DialogTitle>
                            <DialogDescription>
                                Masukkan nama kanal pembayaran, kode teknis integrasi, dan icon logo.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-4 py-2 text-xs">
                            <div className="space-y-1.5">
                                <label className="font-medium text-foreground">Nama Metode Pembayaran *</label>
                                <Input
                                    type="text"
                                    placeholder="Contoh: BCA Virtual Account"
                                    value={form.data.name}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    className="h-9"
                                    required
                                />
                                {form.errors.name && (
                                    <p className="text-destructive text-[11px]">{form.errors.name}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="font-medium text-foreground">Kode Teknis (Unique Identifier) *</label>
                                <Input
                                    type="text"
                                    placeholder="contoh: bca_va"
                                    value={form.data.code}
                                    onChange={(e) => form.setData('code', e.target.value)}
                                    className="h-9 font-mono"
                                    required
                                />
                                <p className="text-[10px] text-muted-foreground">
                                    Digunakan saat integrasi gateway & checkout (misal: qris, bca_va, mandiri_va).
                                </p>
                                {form.errors.code && (
                                    <p className="text-destructive text-[11px]">{form.errors.code}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="font-medium text-foreground">Logo / Icon</label>
                                <div className="flex items-center gap-3">
                                    <div className="size-12 rounded-lg border bg-muted/40 overflow-hidden flex items-center justify-center shrink-0 p-1">
                                        {iconPreview ? (
                                            <img
                                                src={iconPreview}
                                                alt="Preview"
                                                className="w-full h-full object-contain"
                                                onError={(e) => {
                                                    (e.target as HTMLElement).style.display = 'none';
                                                }}
                                            />
                                        ) : (
                                            <CreditCard className="size-6 text-muted-foreground/60" />
                                        )}
                                    </div>

                                    <div className="flex-1 space-y-1.5">
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />
                                        <div className="flex items-center gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="h-8 text-xs"
                                            >
                                                <Upload className="size-3.5 mr-1" />
                                                <span>Pilih File Logo</span>
                                            </Button>

                                            {iconPreview && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setIconPreview(null);
                                                        form.setData('icon', '');
                                                    }}
                                                    className="h-8 text-xs text-destructive hover:bg-destructive/10"
                                                >
                                                    Hapus
                                                </Button>
                                            )}
                                        </div>

                                        <Input
                                            type="text"
                                            placeholder="Atau masukkan URL / teks kode (misal: bca, qris)"
                                            value={typeof form.data.icon === 'string' ? form.data.icon : ''}
                                            onChange={(e) => {
                                                form.setData('icon', e.target.value);
                                                setIconPreview(e.target.value);
                                            }}
                                            className="h-8 text-xs font-mono"
                                        />
                                    </div>
                                </div>
                                {form.errors.icon && (
                                    <p className="text-destructive text-[11px]">{form.errors.icon}</p>
                                )}
                            </div>

                            <DialogFooter className="pt-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setDialogOpen(false)}
                                >
                                    Batal
                                </Button>
                                <Button type="submit" size="sm" disabled={form.processing}>
                                    {form.processing ? 'Menyimpan...' : editingItem ? 'Perbarui Metode' : 'Simpan Metode'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Dialog Delete Confirmation */}
                <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                    <DialogContent className="sm:max-w-sm">
                        <DialogHeader>
                            <div className="size-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-2">
                                <Trash2 className="size-5" />
                            </div>
                            <DialogTitle className="text-center">Hapus Metode Pembayaran?</DialogTitle>
                            <DialogDescription className="text-center text-xs leading-relaxed">
                                Apakah Anda yakin ingin menghapus metode pembayaran{' '}
                                <span className="font-semibold text-foreground">"{deleteTarget?.name}"</span>?
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="flex items-center justify-center gap-2 sm:justify-center pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setDeleteTarget(null)}
                            >
                                Batal
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                disabled={isDeleting}
                                onClick={handleDelete}
                            >
                                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    );
}
