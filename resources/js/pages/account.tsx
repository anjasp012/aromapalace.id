import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import Layout from '@/components/Layout';
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
import {
    CreditCard,
    Package,
    PackageCheck,
    Heart,
    ChevronRight,
    Crown,
    LogOut,
    KeyRound,
    MessageCircle,
    ExternalLink,
    User,
    Info,
    Store,
} from 'lucide-react';

interface UserData {
    id: number;
    name: string;
    email: string;
    role: string;
    joined_at: string;
}

interface MembershipData {
    membership_number: string;
    points: number;
    points_formatted: string;
}

interface OrderCounts {
    all: number;
    menunggu_pembayaran: number;
    diproses: number;
    dikirim: number;
    selesai: number;
}

interface AccountPageProps {
    user: UserData;
    membership: MembershipData | null;
    order_counts: OrderCounts;
    wishlist_count: number;
}

export default function AccountPage({
    user,
    membership,
    order_counts,
    wishlist_count = 0,
}: AccountPageProps) {
    const [pointsInfoOpen, setPointsInfoOpen] = useState(false);
    const [editProfileOpen, setEditProfileOpen] = useState(false);
    const [changePasswordOpen, setChangePasswordOpen] = useState(false);
    const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

    // Profile form state
    const [editName, setEditName] = useState(user.name || '');
    const [profileError, setProfileError] = useState<string | null>(null);
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

    // Password form state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

    // Clean formatted display name (Title Case)
    const displayName = user.name
        ? user.name
              .trim()
              .split(' ')
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
              .join(' ')
        : user.email.split('@')[0];

    const initial = displayName.charAt(0).toUpperCase();

    // Active in-progress orders (Diproses + Dikirim)
    const activeOrdersCount = (order_counts.diproses || 0) + (order_counts.dikirim || 0);

    const handleUpdateProfile = (e: React.FormEvent) => {
        e.preventDefault();
        setProfileError(null);

        if (!editName.trim()) {
            setProfileError('Nama tidak boleh kosong.');
            return;
        }

        setIsUpdatingProfile(true);
        router.patch(
            '/account/profile',
            { name: editName.trim() },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setEditProfileOpen(false);
                },
                onError: (errors) => {
                    setProfileError(errors.name || 'Gagal memperbarui profil.');
                },
                onFinish: () => setIsUpdatingProfile(false),
            }
        );
    };

    const handleUpdatePassword = (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError(null);

        if (newPassword.length < 8) {
            setPasswordError('Kata sandi baru minimal 8 karakter.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError('Konfirmasi kata sandi tidak cocok.');
            return;
        }

        setIsUpdatingPassword(true);
        router.patch(
            '/account/password',
            {
                current_password: currentPassword,
                password: newPassword,
                password_confirmation: confirmPassword,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setChangePasswordOpen(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                },
                onError: (errors) => {
                    setPasswordError(errors.current_password || errors.password || 'Gagal memperbarui kata sandi.');
                },
                onFinish: () => setIsUpdatingPassword(false),
            }
        );
    };

    return (
        <Layout showFooter={false}>
            <Head title="Akun Saya • Aroma Palace" />

            <div className="min-h-screen bg-[#F8F9FA] dark:bg-background">
                {/* MAIN CONTENT CONTAINER */}
                <div className="max-w-xl mx-auto px-4 pt-4 sm:pt-6 pb-20">
                    {/* Profile & Points Card */}
                    <div className="rounded-2xl bg-card border border-border/80 shadow-xs p-4 sm:p-5 mb-3.5">
                        {/* User Profile Header (Avatar + Name + Sejak) */}
                        <div className="flex items-center gap-3.5 sm:gap-4 pb-3.5">
                            {/* Avatar with Verified Ring */}
                            <div className="relative shrink-0">
                                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-br from-[#E5A844] via-[#F3CE7A] to-[#8C1D24] p-0.5 shadow-md">
                                    <div className="w-full h-full rounded-full bg-[#4A070B] flex items-center justify-center text-white text-2xl font-serif font-bold uppercase select-none">
                                        {initial}
                                    </div>
                                </div>
                                <div
                                    className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-[#E5A844] text-[#4A070B] flex items-center justify-center ring-2 ring-card shadow-xs"
                                    title="Akun Terverifikasi"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            </div>

                            {/* Name and Join Date */}
                            <div className="min-w-0 flex-1">
                                <h1 className="text-base sm:text-lg font-bold text-foreground truncate leading-snug">
                                    {displayName}
                                </h1>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Sejak {user.joined_at}
                                </p>
                            </div>
                        </div>

                        {/* Royale Points Pill (Matching reference saldotoco Rp0 >) */}
                        <Link
                            href="/membership"
                            className="rounded-xl sm:rounded-2xl bg-[#FDF8EE] dark:bg-amber-950/25 border border-[#F3E7C4] dark:border-amber-800/30 px-4 py-3 flex items-center justify-between gap-3 transition hover:border-[#E5A844]/60 group cursor-pointer shadow-2xs"
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-xs sm:text-sm font-semibold text-foreground">
                                    Royale Points
                                </span>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setPointsInfoOpen(true);
                                    }}
                                    className="text-muted-foreground/70 hover:text-foreground transition cursor-pointer"
                                    title="Informasi Poin"
                                >
                                    <Info className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            <div className="flex items-center gap-1.5">
                                <Crown className="w-4 h-4 text-[#E5A844]" />
                                <span className="text-xs sm:text-sm font-extrabold text-[#4A070B] dark:text-[#E8D0BA]">
                                    {membership ? `${membership.points_formatted} Poin` : '0 Poin'}
                                </span>
                                <ChevronRight className="w-4 h-4 text-[#E5A844] group-hover:translate-x-0.5 transition-transform" />
                            </div>
                        </Link>
                    </div>

                    {/* Pesanan Saya Card (Matching reference Pesanan Saya -> Lihat Semua) */}
                    <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-2xs mb-3.5 space-y-3.5">
                        <div className="flex items-center justify-between pb-2.5 border-b border-border/70">
                            <h2 className="text-xs sm:text-sm font-bold text-foreground">
                                Pesanan Saya
                            </h2>
                            <Link
                                href="/account/orders"
                                className="text-xs font-semibold text-[#4A070B] dark:text-[#E8D0BA] flex items-center gap-1 hover:underline group"
                            >
                                <span>Lihat Semua</span>
                                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                        </div>

                        {/* 3 Status Columns (Matching reference: Belum Dibayar, Berlangsung, Tiba di Tujuan) */}
                        <div className="grid grid-cols-3 gap-2 text-center">
                            {/* Belum Dibayar */}
                            <Link
                                href="/account/orders?status=menunggu_pembayaran"
                                className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl hover:bg-muted/50 transition group"
                            >
                                <div className="relative">
                                    <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                                        <CreditCard className="w-5 h-5" />
                                    </div>
                                    {order_counts.menunggu_pembayaran > 0 && (
                                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                                            {order_counts.menunggu_pembayaran}
                                        </span>
                                    )}
                                </div>
                                <span className="text-[11px] sm:text-xs font-medium text-foreground">
                                    Belum Dibayar
                                </span>
                            </Link>

                            {/* Berlangsung (Diproses + Dikirim) */}
                            <Link
                                href="/account/orders?status=diproses"
                                className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl hover:bg-muted/50 transition group"
                            >
                                <div className="relative">
                                    <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                                        <Package className="w-5 h-5" />
                                    </div>
                                    {activeOrdersCount > 0 && (
                                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-600 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                                            {activeOrdersCount}
                                        </span>
                                    )}
                                </div>
                                <span className="text-[11px] sm:text-xs font-medium text-foreground">
                                    Berlangsung
                                </span>
                            </Link>

                            {/* Tiba di Tujuan (Selesai) */}
                            <Link
                                href="/account/orders?status=selesai"
                                className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl hover:bg-muted/50 transition group"
                            >
                                <div className="relative">
                                    <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                                        <PackageCheck className="w-5 h-5" />
                                    </div>
                                    {order_counts.selesai > 0 && (
                                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                                            {order_counts.selesai}
                                        </span>
                                    )}
                                </div>
                                <span className="text-[11px] sm:text-xs font-medium text-foreground">
                                    Tiba di Tujuan
                                </span>
                            </Link>
                        </div>
                    </div>

                    {/* Aktivitas Saya List (Matching reference Aktivitas Saya list) */}
                    <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2 px-1">
                            <span className="w-1.5 h-4.5 rounded-full bg-[#E5A844]" />
                            <h3 className="text-sm font-bold text-foreground">
                                Aktivitas Saya
                            </h3>
                        </div>

                        <div className="rounded-2xl border border-border/80 bg-card divide-y divide-border/60 overflow-hidden shadow-2xs">
                            {/* Profil Pengguna (Matching reference anjas putra row) */}
                            <button
                                type="button"
                                onClick={() => setEditProfileOpen(true)}
                                className="w-full flex items-center justify-between p-3.5 hover:bg-muted/40 transition cursor-pointer text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-full bg-amber-500/10 text-[#E5A844] flex items-center justify-center shrink-0">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs sm:text-sm font-semibold text-foreground">
                                        {displayName}
                                    </span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            </button>

                            {/* Favorit Saya (Matching reference Favorit Saya row) */}
                            <Link
                                href="/wishlist"
                                className="flex items-center justify-between p-3.5 hover:bg-muted/40 transition cursor-pointer"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                                        <Heart className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs sm:text-sm font-semibold text-foreground">
                                        Favorit Saya
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {wishlist_count > 0 && (
                                        <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                                            {wishlist_count} item
                                        </Badge>
                                    )}
                                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                </div>
                            </Link>

                            {/* Lokasi Butik & Toko (Matching reference Toko Favorit row) */}
                            <Link
                                href="/stores"
                                className="flex items-center justify-between p-3.5 hover:bg-muted/40 transition cursor-pointer"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-full bg-sky-500/10 text-sky-600 flex items-center justify-center shrink-0">
                                        <Store className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs sm:text-sm font-semibold text-foreground">
                                        Lokasi Butik &amp; Toko
                                    </span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            </Link>

                            {/* Royale Club */}
                            <Link
                                href="/membership"
                                className="flex items-center justify-between p-3.5 hover:bg-muted/40 transition cursor-pointer"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-full bg-amber-500/15 text-[#E5A844] flex items-center justify-center shrink-0">
                                        <Crown className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs sm:text-sm font-semibold text-foreground">
                                        Royale Club Membership
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {membership?.tier_label && (
                                        <Badge className="bg-[#4A070B] text-white text-[10px] px-2 py-0.5">
                                            {membership.tier_label}
                                        </Badge>
                                    )}
                                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                </div>
                            </Link>

                            {/* Keamanan & Kata Sandi */}
                            <button
                                type="button"
                                onClick={() => setChangePasswordOpen(true)}
                                className="w-full flex items-center justify-between p-3.5 hover:bg-muted/40 transition cursor-pointer text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-full bg-slate-500/10 text-slate-600 flex items-center justify-center shrink-0">
                                        <KeyRound className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs sm:text-sm font-semibold text-foreground">
                                        Keamanan &amp; Kata Sandi
                                    </span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            </button>

                            {/* WhatsApp VIP Concierge */}
                            <a
                                href="https://wa.me/6281234567890?text=Halo%20Aroma%20Palace,%20saya%20ingin%20konsultasi%20parfum"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-3.5 hover:bg-muted/40 transition cursor-pointer"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                                        <MessageCircle className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs sm:text-sm font-semibold text-foreground">
                                        WhatsApp VIP Concierge
                                    </span>
                                </div>
                                <ExternalLink className="w-4 h-4 text-muted-foreground" />
                            </a>
                        </div>
                    </div>

                    {/* Tombol Keluar dari Akun */}
                    <div className="pt-1">
                        <Button
                            variant="outline"
                            onClick={() => setLogoutConfirmOpen(true)}
                            className="w-full text-xs font-semibold py-4 rounded-xl border-destructive/25 text-destructive hover:bg-destructive/10 cursor-pointer shadow-xs flex items-center justify-center gap-2"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Keluar dari Akun</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* MODAL 1: UBAH PROFIL / NAMA */}
            <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
                <DialogContent className="w-[calc(100vw-32px)] max-w-md p-5 sm:p-6 rounded-2xl">
                    <form onSubmit={handleUpdateProfile}>
                        <DialogHeader className="text-left space-y-1">
                            <DialogTitle className="text-base font-bold text-foreground">
                                Edit Informasi Profil
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground">
                                Ubah nama tampilan yang digunakan pada akun Anda.
                            </DialogDescription>
                        </DialogHeader>

                        {profileError && (
                            <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-xs font-medium my-2">
                                {profileError}
                            </div>
                        )}

                        <div className="space-y-3.5 my-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-foreground">Nama Lengkap</label>
                                <Input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    placeholder="Nama Anda"
                                    required
                                    className="text-xs rounded-xl"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-foreground">Email (Tetap)</label>
                                <Input
                                    type="email"
                                    value={user.email}
                                    disabled
                                    className="text-xs rounded-xl bg-muted/50 text-muted-foreground cursor-not-allowed"
                                />
                            </div>
                        </div>

                        <DialogFooter className="flex flex-row justify-end gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setEditProfileOpen(false)}
                                disabled={isUpdatingProfile}
                                className="cursor-pointer rounded-xl"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={isUpdatingProfile}
                                className="bg-[#4A070B] hover:bg-[#360407] text-white cursor-pointer rounded-xl"
                            >
                                {isUpdatingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* MODAL 2: UBAH KATA SANDI */}
            <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
                <DialogContent className="w-[calc(100vw-32px)] max-w-md p-5 sm:p-6 rounded-2xl">
                    <form onSubmit={handleUpdatePassword}>
                        <DialogHeader className="text-left space-y-1">
                            <DialogTitle className="text-base font-bold text-foreground">
                                Ubah Kata Sandi
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground">
                                Masukkan kata sandi saat ini dan buat kata sandi baru.
                            </DialogDescription>
                        </DialogHeader>

                        {passwordError && (
                            <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-xs font-medium my-2">
                                {passwordError}
                            </div>
                        )}

                        <div className="space-y-3.5 my-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-foreground">Kata Sandi Saat Ini</label>
                                <Input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="Kata sandi saat ini"
                                    required
                                    className="text-xs rounded-xl"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-foreground">Kata Sandi Baru</label>
                                <Input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Minimal 8 karakter"
                                    required
                                    className="text-xs rounded-xl"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-foreground">Konfirmasi Kata Sandi Baru</label>
                                <Input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Ulangi kata sandi baru"
                                    required
                                    className="text-xs rounded-xl"
                                />
                            </div>
                        </div>

                        <DialogFooter className="flex flex-row justify-end gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setChangePasswordOpen(false)}
                                disabled={isUpdatingPassword}
                                className="cursor-pointer rounded-xl"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={isUpdatingPassword}
                                className="bg-[#4A070B] hover:bg-[#360407] text-white cursor-pointer rounded-xl"
                            >
                                {isUpdatingPassword ? 'Memperbarui...' : 'Ubah Kata Sandi'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* MODAL 3: ROYALE POINTS INFO */}
            <Dialog open={pointsInfoOpen} onOpenChange={setPointsInfoOpen}>
                <DialogContent className="w-[calc(100vw-32px)] max-w-sm p-5 sm:p-6 rounded-2xl">
                    <DialogHeader className="text-left space-y-2">
                        <div className="w-10 h-10 rounded-2xl bg-[#E5A844]/20 text-[#E5A844] flex items-center justify-center">
                            <Crown className="w-5 h-5" />
                        </div>
                        <DialogTitle className="text-base font-bold text-foreground">
                            Tentang Royale Points
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                            Royale Points adalah program loyalitas untuk setiap transaksi di Aroma Palace. Poin dapat ditukarkan dengan voucher diskon belanja.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2.5 my-3 text-xs bg-muted/40 p-3.5 rounded-2xl border border-border/80">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Nilai Poin</span>
                            <span className="font-bold text-foreground">1 Poin = Rp 1</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Tier Saat Ini</span>
                            <span className="font-bold text-[#4A070B] dark:text-[#E8D0BA]">
                                {membership?.tier_label || 'Anggota Standar'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Pengali Poin</span>
                            <span className="font-bold text-foreground">
                                {membership ? `${membership.multiplier}x` : '1x'}
                            </span>
                        </div>
                    </div>

                    <DialogFooter className="pt-1">
                        <Button
                            asChild
                            size="sm"
                            className="w-full bg-[#4A070B] hover:bg-[#360407] text-white cursor-pointer rounded-xl"
                        >
                            <Link href="/membership">
                                Buka Halaman Royale Club
                            </Link>
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* MODAL 4: KONFIRMASI KELUAR */}
            <Dialog open={logoutConfirmOpen} onOpenChange={setLogoutConfirmOpen}>
                <DialogContent className="w-[calc(100vw-32px)] max-w-sm p-5 sm:p-6 rounded-2xl">
                    <DialogHeader className="text-left space-y-2">
                        <DialogTitle className="text-base font-bold text-foreground">
                            Konfirmasi Keluar
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                            Apakah Anda yakin ingin keluar dari akun Aroma Palace Anda?
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="flex flex-row justify-end gap-2 pt-3">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setLogoutConfirmOpen(false)}
                            className="cursor-pointer rounded-xl"
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                                router.post('/logout');
                            }}
                            className="cursor-pointer rounded-xl"
                        >
                            Ya, Keluar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Layout>
    );
}
