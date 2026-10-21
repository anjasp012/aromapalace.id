import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck, ArrowLeft } from 'lucide-react';

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
        post('/login');
    };

    return (
        <div className="min-h-screen w-full flex flex-col justify-between bg-[#0B090A] text-slate-100 antialiased selection:bg-[#E5A844] selection:text-[#4A070B]">
            <Head title="Admin CMS Portal Login • Aroma Palace" />

            {/* Top Bar with Storefront Link */}
            <header className="w-full px-6 py-4 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-3">
                    <img
                        src="/images/logo.png"
                        alt="Aroma Palace"
                        className="size-8 object-contain rounded-full border border-white/10 shrink-0"
                    />
                    <div className="flex flex-col leading-none">
                        <span className="text-sm font-bold tracking-wider uppercase text-white font-serif">Aroma Palace</span>
                        <span className="text-[10px] text-[#E5A844] font-mono tracking-widest uppercase">Admin CMS</span>
                    </div>
                </div>

                <a
                    href={storefront_url}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
                >
                    <ArrowLeft className="size-3.5" />
                    <span className="hidden sm:inline">Kembali ke</span> Toko Utama
                </a>
            </header>

            {/* Main Center Container */}
            <main className="flex-1 flex items-center justify-center px-4 py-12 relative overflow-hidden">
                {/* Subtle Luxury Gradient Background Lighting */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-[#4A070B]/40 via-[#8C1D24]/20 to-[#E5A844]/10 rounded-full blur-3xl pointer-events-none" />

                <div className="w-full max-w-md space-y-6 relative z-10">
                    {/* Header */}
                    <div className="text-center space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-[#E5A844]">
                            <ShieldCheck className="size-3.5" />
                            <span>PORTAL OTORISASI INTERNAL</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-serif">
                            Masuk Panel Admin
                        </h1>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                            Akses kontrol terpusat untuk katalog produk, pesanan pelanggan, dan laporan butik.
                        </p>
                    </div>

                    {/* Status Alert */}
                    {status && (
                        <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs text-center">
                            {status}
                        </div>
                    )}

                    {/* Global Email / Credential Error */}
                    {errors.email && (
                        <div className="p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-xs leading-relaxed">
                            {errors.email}
                        </div>
                    )}

                    {/* Form Card */}
                    <Card className="border border-white/10 bg-[#161416]/90 backdrop-blur-md shadow-2xl rounded-2xl">
                        <CardContent className="p-6 sm:p-8">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Email Field */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                                        <Mail className="size-3.5 text-[#E5A844]" />
                                        <span>Email Administrator</span>
                                    </label>
                                    <Input
                                        type="email"
                                        placeholder="admin@aromapalace.id"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        className="h-10.5 text-sm bg-white/5 border-white/10 text-white placeholder:text-slate-500 rounded-xl focus-visible:ring-1 focus-visible:ring-[#E5A844] focus-visible:border-[#E5A844]"
                                        required
                                        autoFocus
                                    />
                                </div>

                                {/* Password Field */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                                        <Lock className="size-3.5 text-[#E5A844]" />
                                        <span>Kata Sandi</span>
                                    </label>
                                    <div className="relative">
                                        <Input
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="••••••••••••"
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            className="h-10.5 text-sm bg-white/5 border-white/10 text-white placeholder:text-slate-500 pr-10 rounded-xl focus-visible:ring-1 focus-visible:ring-[#E5A844] focus-visible:border-[#E5A844]"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-3 text-slate-400 hover:text-white transition-colors cursor-pointer"
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <p className="text-[11px] text-red-400">{errors.password}</p>
                                    )}
                                </div>

                                {/* Remember Me */}
                                <div className="flex items-center justify-between text-xs pt-1">
                                    <label className="flex items-center gap-2 cursor-pointer text-slate-400 select-none hover:text-slate-200">
                                        <input
                                            type="checkbox"
                                            checked={data.remember}
                                            onChange={(e) => setData('remember', e.target.checked)}
                                            className="rounded border-white/20 bg-white/5 text-[#4A070B] focus:ring-[#E5A844] size-3.5"
                                        />
                                        <span>Ingat sesi masuk</span>
                                    </label>

                                    <span className="text-[11px] text-slate-500 font-mono">
                                        v2.4 LTS
                                    </span>
                                </div>

                                {/* Submit Button with Loading Spinner */}
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full h-11 rounded-xl bg-gradient-to-r from-[#4A070B] via-[#63090F] to-[#4A070B] hover:brightness-110 text-white font-bold text-xs uppercase tracking-wider border border-[#E5A844]/40 shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
                                >
                                    {processing ? (
                                        <>
                                            <Loader2 className="size-4 animate-spin text-[#E5A844]" />
                                            <span>Memverifikasi Akses...</span>
                                        </>
                                    ) : (
                                        <>
                                            <ShieldCheck className="size-4 text-[#E5A844]" />
                                            <span>Masuk ke Panel Admin</span>
                                        </>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Security Notice */}
                    <div className="text-center text-[11px] text-slate-500 leading-relaxed space-y-1">
                        <p>Area ini terenkripsi dan khusus untuk manajemen resmi Aroma Palace.</p>
                        <p>Segala aktivitas login dan perubahan data dicatat dalam log keamanan.</p>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="w-full py-4 text-center text-[11px] text-slate-600 border-t border-white/5">
                &copy; {new Date().getFullYear()} Aroma Palace Indonesia. Hak cipta dilindungi undang-undang.
            </footer>
        </div>
    );
}
