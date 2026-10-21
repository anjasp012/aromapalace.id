import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import {
    ArrowLeft,
    Save,
    User as UserIcon,
    Shield,
    Users,
    Lock,
    Eye,
    EyeOff,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface UserData {
    id: number;
    name: string;
    email: string;
    role: 'customer' | 'admin';
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    postal_code?: string | null;
}

interface AdminUserEditProps {
    user: UserData;
}

export default function AdminUserEdit({ user }: AdminUserEditProps) {
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, put, processing, errors } = useForm<{
        name: string;
        email: string;
        role: 'customer' | 'admin';
        password: string;
    }>({
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'customer',
        password: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/users/${user.id}`);
    };

    return (
        <AdminLayout
            title={`Edit Pengguna: ${user.name}`}
            subtitle="Perbarui data identitas, email, hak akses perizinan, atau reset kata sandi."
        >
            <Head title={`Edit Pengguna: ${user.name} - Admin Panel`} />

            <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-6">
                {/* Header Actions */}
                <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" asChild className="p-0 hover:bg-transparent">
                        <Link href="/users" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="size-4" />
                            <span>Kembali ke Daftar Pengguna</span>
                        </Link>
                    </Button>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/users">Batal</Link>
                        </Button>
                        <Button type="submit" size="sm" disabled={processing} className="cursor-pointer">
                            <Save className="size-4 mr-1.5" />
                            <span>{processing ? 'Menyimpan...' : 'Perbarui Pengguna'}</span>
                        </Button>
                    </div>
                </div>

                {/* Form Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Informasi Akun Pengguna</CardTitle>
                        <CardDescription>
                            Edit data nama, email, dan tingkatan peran akun dalam sistem.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">Nama Lengkap *</label>
                            <Input
                                type="text"
                                placeholder="Nama lengkap"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className="h-9 text-xs"
                                required
                            />
                            {errors.name && <p className="text-destructive text-xs">{errors.name}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">Alamat Email *</label>
                            <Input
                                type="email"
                                placeholder="user@aromapalace.id"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                className="h-9 text-xs"
                                required
                            />
                            {errors.email && <p className="text-destructive text-xs">{errors.email}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">Hak Akses (Role) *</label>
                            <Select
                                value={data.role}
                                onValueChange={(val: 'customer' | 'admin') => setData('role', val)}
                            >
                                <SelectTrigger className="h-9 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="customer">Pelanggan (Customer)</SelectItem>
                                    <SelectItem value="admin">Administrator (Admin CMS)</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-[11px] text-muted-foreground">
                                {data.role === 'admin'
                                    ? 'Akses penuh ke dashboard admin, katalog produk, kelola pesanan dan konfigurasi.'
                                    : 'Akun pelanggan reguler storefront.'}
                            </p>
                            {errors.role && <p className="text-destructive text-xs">{errors.role}</p>}
                        </div>

                        <div className="space-y-1.5 pt-2 border-t border-border">
                            <label className="text-xs font-semibold text-foreground">
                                Ganti Password (Opsional)
                            </label>
                            <div className="relative">
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Kosongkan jika tidak ingin mengubah password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    className="h-9 text-xs pr-10"
                                    minLength={8}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                                >
                                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                </button>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                Masukkan minimal 8 karakter hanya jika Anda ingin mereset password pengguna.
                            </p>
                            {errors.password && <p className="text-destructive text-xs">{errors.password}</p>}
                        </div>
                    </CardContent>
                </Card>

                {/* Footer Save Button */}
                <div className="flex items-center justify-end gap-3 pt-2">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/users">Batal</Link>
                    </Button>
                    <Button type="submit" size="sm" disabled={processing} className="cursor-pointer">
                        <Save className="size-4 mr-1.5" />
                        <span>{processing ? 'Menyimpan...' : 'Perbarui Pengguna'}</span>
                    </Button>
                </div>
            </form>
        </AdminLayout>
    );
}
