import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

interface LoginProps {
    status?: string;
    notice?: string;
}

export default function Login({ status, notice }: LoginProps) {
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
        <Layout>
            <Head title="Masuk ke Akun - Aroma Palace" />

            <div className="min-h-[75vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background via-muted/20 to-background">
                <div className="w-full max-w-md space-y-6">
                    {/* Header */}
                    <div className="text-center space-y-2">

                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-sans">
                            Masuk ke Akun
                        </h1>
                        <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                            Akses keranjang belanja, wishlist wewangian impian, dan penawaran eksklusif Aroma Palace.
                        </p>
                    </div>

                    {/* Notice if redirected from cart or wishlist */}
                    {notice && (
                        <div className="p-3.5 rounded-lg border border-[#4A070B]/30 bg-[#4A070B]/10 text-[#4A070B] text-xs flex items-start gap-2.5">
                            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{notice}</span>
                        </div>
                    )}

                    {status && (
                        <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs">
                            {status}
                        </div>
                    )}

                    {/* Card Form */}
                    <Card className="border border-border/80 shadow-none bg-card/80 backdrop-blur-xs">
                        <CardContent className="p-6 sm:p-8 space-y-5">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Email */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground block">
                                        Alamat Email
                                    </label>
                                    <Input
                                        type="email"
                                        name="email"
                                        placeholder="nama@email.com"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        className="h-10 text-xs shadow-none border-border/80 focus-visible:ring-1 focus-visible:ring-[#4A070B] focus-visible:border-[#4A070B]"
                                        required
                                        autoFocus
                                    />
                                    {errors.email && (
                                        <p className="text-[11px] text-destructive">{errors.email}</p>
                                    )}
                                </div>

                                {/* Password */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-semibold text-foreground block">
                                            Kata Sandi
                                        </label>
                                    </div>
                                    <div className="relative">
                                        <Input
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            placeholder="••••••••"
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            className="h-10 text-xs pr-10 shadow-none border-border/80 focus-visible:ring-1 focus-visible:ring-[#4A070B] focus-visible:border-[#4A070B]"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground text-xs cursor-pointer"
                                            tabIndex={-1}
                                        >
                                            {showPassword ? 'Tutup' : 'Lihat'}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <p className="text-[11px] text-destructive">{errors.password}</p>
                                    )}
                                </div>

                                {/* Remember Me */}
                                <div className="flex items-center justify-between text-xs pt-1">
                                    <label className="flex items-center gap-2 cursor-pointer text-muted-foreground select-none">
                                        <input
                                            type="checkbox"
                                            checked={data.remember}
                                            onChange={(e) => setData('remember', e.target.checked)}
                                            className="rounded border-border text-[#4A070B] focus:ring-[#4A070B]"
                                        />
                                        <span>Ingat saya</span>
                                    </label>
                                    <span className="text-[11px] text-[#4A070B] cursor-pointer">
                                        Lupa kata sandi?
                                    </span>
                                </div>

                                {/* Submit Button */}
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full h-10.5 rounded-md bg-[#4A070B] hover:bg-[#360407] text-white text-xs font-bold uppercase tracking-wider shadow-none transition cursor-pointer mt-2"
                                >
                                    {processing ? 'Memproses...' : 'Masuk Sekarang'}
                                </Button>

                                {/* Register Link */}
                                <p className="text-center text-xs text-muted-foreground pt-2">
                                    Belum memiliki akun?{' '}
                                    <Link
                                        href="/register"
                                        className="text-[#4A070B] font-bold"
                                    >
                                        Daftar Sekarang
                                    </Link>
                                </p>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </Layout>
    );
}
