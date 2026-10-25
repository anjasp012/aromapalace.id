import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Eye,
    EyeOff,
    Loader2,
    Lock,
    Mail,
    ShieldCheck,
    ArrowLeft,
    Sparkles,
    Gem,
    PackageCheck,
    LockKeyhole,
} from 'lucide-react';

import { clearUserClientCache } from '@/lib/cache-cleanup';

interface AdminLoginProps {
    status?: string | null;
    storefront_url?: string;
}

export default function AdminLogin({ status, storefront_url = 'https://aromapalace.id' }: AdminLoginProps) {
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        clearUserClientCache();
        post('/login');
    };

    return (
        <div className="min-h-screen w-full bg-[#0B090A] text-slate-100 antialiased selection:bg-[#E5A844] selection:text-[#4A070B] flex flex-col lg:grid lg:grid-cols-12 overflow-x-hidden">
            <Head title="Admin CMS Portal Login • Aroma Palace" />

            {/* Left Decorative Luxury Panel (Visible on lg screens) */}
            <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 relative flex-col justify-between p-12 xl:p-16 bg-gradient-to-br from-[#1A0508] via-[#120406] to-[#0A0809] border-r border-white/5 overflow-hidden">
                {/* Ambient Radial Lights */}
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#E5A844]/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-1/2 -right-24 w-[450px] h-[450px] bg-[#4A070B]/50 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 left-1/3 w-80 h-80 bg-[#8C1D24]/20 rounded-full blur-3xl pointer-events-none" />

                {/* Subtle Geometric Luxury Pattern Overlay */}
                <div
                    className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{
                        backgroundImage: `radial-gradient(circle at 1px 1px, #E5A844 1px, transparent 0)`,
                        backgroundSize: '36px 36px',
                    }}
                />

                {/* Left Header: Brand Emblem */}
                <div className="relative z-10 flex items-center gap-3.5">
                    <div className="relative">
                        <img
                            src="/images/logo.png"
                            alt="Aroma Palace"
                            className="size-11 object-contain rounded-full border border-[#E5A844]/40 shadow-[0_0_20px_rgba(229,168,68,0.25)] shrink-0"
                        />
                        <div className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full bg-emerald-500 border-2 border-[#120406]" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-base font-serif font-bold tracking-widest uppercase text-white">
                                Aroma Palace
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider bg-[#E5A844]/15 text-[#E5A844] border border-[#E5A844]/30">
                                Maison
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono tracking-wider">
                            Haute Parfumerie &bull; Executive Portal
                        </p>
                    </div>
                </div>

                {/* Left Center: Visual Narrative Showcase */}
                <div className="relative z-10 max-w-xl my-auto py-12 space-y-8">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-xs text-[#E5A844] font-medium">
                            <Sparkles className="size-3.5 text-[#E5A844]" />
                            <span>Konsol Pusat Manajemen Parfum</span>
                        </div>

                        <h1 className="text-3xl xl:text-4xl 2xl:text-5xl font-serif font-bold tracking-tight text-white leading-[1.15]">
                            Mengorkestrasi Seni Aroma dalam Satu Kendali Presisi.
                        </h1>

                        <p className="text-sm xl:text-base text-slate-400 leading-relaxed font-light">
                            Selamat datang di portal administrasi resmi Aroma Palace. Kelola katalog koleksi eksklusif, pantau pesanan butik nasional, dan berikan layanan wewangian terbaik untuk setiap pelanggan setia.
                        </p>
                    </div>

                    {/* Feature Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
                        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 backdrop-blur-xs hover:border-[#E5A844]/40 transition-colors">
                            <div className="size-8 rounded-lg bg-[#E5A844]/10 border border-[#E5A844]/20 flex items-center justify-center text-[#E5A844] mb-3">
                                <Gem className="size-4" />
                            </div>
                            <div className="text-xs font-semibold text-white">Katalog &amp; Varian</div>
                            <div className="text-[11px] text-slate-400 mt-1 leading-snug">
                                Kontrol piramida notes, konsentrasi, dan stok gerai.
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 backdrop-blur-xs hover:border-[#E5A844]/40 transition-colors">
                            <div className="size-8 rounded-lg bg-[#E5A844]/10 border border-[#E5A844]/20 flex items-center justify-center text-[#E5A844] mb-3">
                                <PackageCheck className="size-4" />
                            </div>
                            <div className="text-xs font-semibold text-white">Pesanan Butik</div>
                            <div className="text-[11px] text-slate-400 mt-1 leading-snug">
                                Proses transaksi, pelacakan kurir, dan faktur invoice.
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 backdrop-blur-xs hover:border-[#E5A844]/40 transition-colors">
                            <div className="size-8 rounded-lg bg-[#E5A844]/10 border border-[#E5A844]/20 flex items-center justify-center text-[#E5A844] mb-3">
                                <LockKeyhole className="size-4" />
                            </div>
                            <div className="text-xs font-semibold text-white">Akses Terenkripsi</div>
                            <div className="text-[11px] text-slate-400 mt-1 leading-snug">
                                Perlindungan sesi berlapis dan audit aktivitas log.
                            </div>
                        </div>
                    </div>
                </div>

                {/* Left Footer: Quote & Assurance */}
                <div className="relative z-10 pt-6 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                    <p className="italic font-serif text-slate-400/90 max-w-md">
                        &ldquo;A fragrance is the invisible garment that speaks before words are spoken.&rdquo;
                    </p>
                    <span className="text-[11px] font-mono text-[#E5A844]/80 hidden xl:inline">
                        Aroma Palace Indonesia
                    </span>
                </div>
            </div>

            {/* Right Form Panel */}
            <div className="flex-1 lg:col-span-6 xl:col-span-5 flex flex-col justify-between p-6 sm:p-10 xl:p-12 relative z-10 bg-[#0B090A]">
                {/* Top Nav: Back to Storefront Link */}
                <div className="flex items-center justify-between w-full">
                    <div className="lg:hidden flex items-center gap-2.5">
                        <img
                            src="/images/logo.png"
                            alt="Aroma Palace"
                            className="size-8 object-contain rounded-full border border-[#E5A844]/40 shrink-0"
                        />
                        <div className="flex flex-col leading-none">
                            <span className="text-sm font-serif font-bold text-white tracking-wide">Aroma Palace</span>
                            <span className="text-[10px] text-[#E5A844] font-mono tracking-widest uppercase">Admin CMS</span>
                        </div>
                    </div>

                    <div className="hidden lg:block">
                        {/* Placeholder for alignment */}
                    </div>

                    <a
                        href={storefront_url}
                        className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-[#E5A844]/40 transition-all cursor-pointer"
                    >
                        <ArrowLeft className="size-3.5" />
                        <span>Ke Toko Utama</span>
                    </a>
                </div>

                {/* Form Container (Vertically Centered) */}
                <div className="w-full max-w-md mx-auto my-auto py-8 space-y-6">
                    {/* Header */}
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#E5A844]/10 border border-[#E5A844]/20 text-[11px] font-mono text-[#E5A844]">
                            <ShieldCheck className="size-3.5 text-[#E5A844]" />
                            <span>OTORISASI ADMINISTRATOR</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-white">
                            Masuk ke Panel Kendali
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-light">
                            Gunakan alamat email dan kata sandi yang telah terdaftar dengan hak akses administrator.
                        </p>
                    </div>

                    {/* Status Alert */}
                    {status && (
                        <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs flex items-center gap-2.5">
                            <span className="size-1.5 rounded-full bg-emerald-400 shrink-0" />
                            <span>{status}</span>
                        </div>
                    )}

                    {/* Global Credential Error */}
                    {errors.email && (
                        <div className="p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-xs flex items-start gap-2.5 leading-relaxed">
                            <span className="size-1.5 rounded-full bg-red-400 mt-1 shrink-0" />
                            <span>{errors.email}</span>
                        </div>
                    )}

                    {/* Login Card Form */}
                    <div className="p-6 sm:p-7 rounded-2xl border border-white/10 bg-[#141113]/90 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
                        {/* Glow corner line */}
                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#E5A844]/50 to-transparent" />

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Email Input */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                                    <span className="flex items-center gap-1.5">
                                        <Mail className="size-3.5 text-[#E5A844]" />
                                        Email Administrator
                                    </span>
                                </label>
                                <Input
                                    type="email"
                                    placeholder="nama@aromapalace.id"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    autoComplete="email"
                                    className="h-11 text-sm bg-white/[0.04] border-white/10 text-white placeholder:text-slate-500 rounded-xl focus-visible:ring-1 focus-visible:ring-[#E5A844] focus-visible:border-[#E5A844] transition-all"
                                    required
                                />
                            </div>

                            {/* Password Input */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                                    <span className="flex items-center gap-1.5">
                                        <Lock className="size-3.5 text-[#E5A844]" />
                                        Kata Sandi
                                    </span>
                                </label>
                                <div className="relative">
                                    <Input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••••••"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        autoComplete="current-password"
                                        className="h-11 text-sm bg-white/[0.04] border-white/10 text-white placeholder:text-slate-500 pr-10 rounded-xl focus-visible:ring-1 focus-visible:ring-[#E5A844] focus-visible:border-[#E5A844] transition-all"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-3 text-slate-400 hover:text-white transition-colors cursor-pointer p-0.5"
                                        tabIndex={-1}
                                        aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                                    >
                                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-[11px] text-red-400">{errors.password}</p>
                                )}
                            </div>

                            {/* Remember Session Toggle */}
                            <div className="flex items-center justify-between text-xs pt-0.5">
                                <label className="flex items-center gap-2.5 cursor-pointer text-slate-400 select-none hover:text-slate-200 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={data.remember}
                                        onChange={(e) => setData('remember', e.target.checked)}
                                        className="rounded border-white/20 bg-white/5 text-[#8C1D24] focus:ring-[#E5A844] size-3.5 cursor-pointer"
                                    />
                                    <span>Ingat sesi masuk saya</span>
                                </label>
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                disabled={processing}
                                className="w-full h-11.5 rounded-xl bg-gradient-to-r from-[#4A070B] via-[#731219] to-[#4A070B] hover:brightness-110 text-white font-semibold text-xs uppercase tracking-wider border border-[#E5A844]/40 shadow-[0_4px_20px_rgba(74,7,11,0.5)] transition-all cursor-pointer flex items-center justify-center gap-2"
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin text-[#E5A844]" />
                                        <span>Memverifikasi Otorisasi...</span>
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheck className="size-4 text-[#E5A844]" />
                                        <span>Masuk ke Konsol Admin</span>
                                    </>
                                )}
                            </Button>
                        </form>
                    </div>

                    {/* Security Notice */}
                    <div className="text-center text-[11px] text-slate-500 leading-relaxed space-y-1">
                        <p className="flex items-center justify-center gap-1.5 text-slate-400">
                            <Lock className="size-3 text-[#E5A844]" />
                            <span>Koneksi aman terenkripsi SSL 256-bit</span>
                        </p>
                        <p>Akses terbatas hanya untuk staf &amp; pengelola resmi Aroma Palace Indonesia.</p>
                    </div>
                </div>

                {/* Bottom Footer */}
                <div className="w-full text-center text-[11px] text-slate-600 border-t border-white/5 pt-4">
                    &copy; {new Date().getFullYear()} Aroma Palace Indonesia &bull; All Rights Reserved
                </div>
            </div>
        </div>
    );
}
