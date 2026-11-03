import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from '@/lib/i18n';
import {
    Eye,
    EyeOff,
    Home,
    Sparkles,
    Loader2,
    Globe,
    ArrowLeft,
} from 'lucide-react';

interface ResetPasswordProps {
    token: string;
    email: string;
}

export default function ResetPassword({ token, email }: ResetPasswordProps) {
    const { isEn, setLanguage } = useTranslation();
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        token: token,
        email: email || '',
        password: '',
        password_confirmation: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/reset-password');
    };

    return (
        <div className="fixed inset-0 h-[100dvh] max-h-[100dvh] w-full bg-[#4A070B] text-slate-100 overflow-hidden flex flex-col justify-between selection:bg-[#E5A844] selection:text-[#4A070B] overscroll-none font-sans">
            <Head title={isEn ? 'Set New Password • Aroma Palace' : 'Atur Kata Sandi Baru • Aroma Palace'} />

            {/* AMBIENT LUXURY DECORATIVE CIRCLES & BUBBLES */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#E5A844]/15 blur-3xl" />
                <div className="absolute top-1/3 left-1/4 w-[480px] h-[480px] rounded-full bg-[#8C1D24]/40 blur-3xl" />
                <div className="absolute -bottom-24 right-1/4 w-[500px] h-[500px] rounded-full bg-[#360407]/70 blur-3xl" />
                <div className="absolute bottom-10 -right-20 w-80 h-80 rounded-full bg-[#E5A844]/10 blur-2xl" />
            </div>

            {/* TOP HEADER: BRAND LOGO & HOME BUTTON */}
            <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 pt-[max(env(safe-area-inset-top),1rem)] pb-2 flex items-center justify-between shrink-0">
                <Link
                    href="/"
                    className="inline-flex items-center gap-3 group cursor-pointer"
                >
                    <img
                        src="/images/logo.png"
                        alt="Aroma Palace"
                        className="w-10 h-10 sm:w-11 sm:h-11 object-contain rounded-full shadow-md group-hover:scale-105 transition-transform shrink-0 ring-2 ring-[#E5A844]/30"
                    />
                    <span className="text-base sm:text-lg font-extrabold tracking-wider text-white uppercase font-sans">
                        Aroma Palace
                    </span>
                </Link>

                <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/90 hover:text-white transition-all bg-white/10 hover:bg-white/20 border border-white/20 px-3.5 py-2 rounded-lg backdrop-blur-md active:scale-95 shadow-sm"
                >
                    <Home className="w-3.5 h-3.5 text-[#E5A844]" />
                    <span>{isEn ? 'Home' : 'Beranda'}</span>
                </Link>
            </header>

            {/* MAIN CONTAINER */}
            <main className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 py-2 my-auto flex-1 flex items-center justify-center lg:justify-between min-h-0">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center w-full">
                    {/* LEFT SIDE: AUTH ILLUSTRATION */}
                    <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 flex-col items-center justify-center text-center relative pr-4 select-none">
                        <div className="relative max-w-[480px] xl:max-w-[560px] w-full flex items-center justify-center">
                            <div className="absolute -inset-10 bg-gradient-to-tr from-[#E5A844]/20 via-[#8C1D24]/30 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />
                            <img
                                src="/images/auth-illustration.png"
                                alt="Aroma Palace"
                                className="w-full max-h-[460px] xl:max-h-[540px] object-contain drop-shadow-2xl transition-transform duration-500 hover:scale-[1.02]"
                            />
                        </div>
                    </div>

                    {/* RIGHT SIDE: FLOATING CARD */}
                    <div className="col-span-1 lg:col-span-6 xl:col-span-5 flex justify-center lg:justify-end w-full">
                        <Card className="w-full max-w-md bg-white text-neutral-900 border-0 shadow-2xl rounded-2xl sm:rounded-3xl overflow-hidden my-auto">
                            <CardContent className="p-6 sm:p-7 space-y-4 sm:space-y-5">
                                {/* CARD HEADER */}
                                <div className="space-y-1 text-left">
                                    <h1 className="text-2xl sm:text-[26px] font-extrabold tracking-tight text-neutral-900 font-sans leading-tight">
                                        {isEn ? 'Set New Password' : 'Atur Kata Sandi Baru'}
                                    </h1>
                                    <p className="text-xs sm:text-sm text-neutral-600">
                                        {isEn
                                            ? 'Create a new, strong password to safeguard your account.'
                                            : 'Buat kata sandi baru yang kuat untuk melindungi akun Anda.'}
                                    </p>
                                </div>

                                {/* FORM */}
                                <form onSubmit={handleSubmit} className="space-y-3.5">
                                    {/* EMAIL INPUT */}
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-neutral-800 block">
                                            {isEn ? 'Email Address' : 'Alamat Email'}
                                        </label>
                                        <Input
                                            type="email"
                                            name="email"
                                            inputMode="email"
                                            autoComplete="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            className="h-11 sm:h-12 px-4 text-sm rounded-xl bg-neutral-50 text-neutral-900 border-neutral-300 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-[#4A070B] focus-visible:border-[#4A070B] transition-all"
                                            required
                                            disabled={processing}
                                        />
                                        {errors.email && (
                                            <p className="text-[11px] font-semibold text-red-600 mt-1">{errors.email}</p>
                                        )}
                                    </div>

                                    {/* NEW PASSWORD */}
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-neutral-800 block">
                                            {isEn ? 'New Password' : 'Kata Sandi Baru'}
                                        </label>
                                        <div className="relative">
                                            <Input
                                                type={showPassword ? 'text' : 'password'}
                                                name="password"
                                                autoComplete="new-password"
                                                placeholder={isEn ? 'Min. 8 characters' : 'Min. 8 karakter'}
                                                value={data.password}
                                                onChange={(e) => setData('password', e.target.value)}
                                                className="h-11 sm:h-12 pl-4 pr-11 text-sm rounded-xl bg-neutral-50 text-neutral-900 border-neutral-300 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-[#4A070B] focus-visible:border-[#4A070B] transition-all"
                                                required
                                                disabled={processing}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-neutral-700 transition-colors"
                                                tabIndex={-1}
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="w-4 h-4" />
                                                ) : (
                                                    <Eye className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                        {errors.password && (
                                            <p className="text-[11px] font-semibold text-red-600 mt-1">{errors.password}</p>
                                        )}
                                    </div>

                                    {/* CONFIRM NEW PASSWORD */}
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-neutral-800 block">
                                            {isEn ? 'Confirm New Password' : 'Konfirmasi Kata Sandi Baru'}
                                        </label>
                                        <div className="relative">
                                            <Input
                                                type={showPasswordConfirm ? 'text' : 'password'}
                                                name="password_confirmation"
                                                autoComplete="new-password"
                                                placeholder={isEn ? 'Repeat new password' : 'Ulangi kata sandi baru'}
                                                value={data.password_confirmation}
                                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                                className="h-11 sm:h-12 pl-4 pr-11 text-sm rounded-xl bg-neutral-50 text-neutral-900 border-neutral-300 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-[#4A070B] focus-visible:border-[#4A070B] transition-all"
                                                required
                                                disabled={processing}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                                                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-neutral-700 transition-colors"
                                                tabIndex={-1}
                                            >
                                                {showPasswordConfirm ? (
                                                    <EyeOff className="w-4 h-4" />
                                                ) : (
                                                    <Eye className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                        {errors.password_confirmation && (
                                            <p className="text-[11px] font-semibold text-red-600 mt-1">{errors.password_confirmation}</p>
                                        )}
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full h-11 sm:h-12 rounded-lg bg-[#4A070B] hover:bg-[#360407] active:scale-[0.98] text-white text-sm font-bold shadow-md transition-all cursor-pointer mt-2"
                                    >
                                        {processing ? (
                                            <span className="inline-flex items-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin text-[#E5A844]" />
                                                <span>{isEn ? 'Updating...' : 'Menyimpan...'}</span>
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-2">
                                                <Sparkles className="w-4 h-4 text-[#E5A844]" />
                                                <span>{isEn ? 'Update Password' : 'Perbarui Kata Sandi'}</span>
                                            </span>
                                        )}
                                    </Button>

                                    <div className="pt-2 text-center">
                                        <Link
                                            href="/login"
                                            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4A070B] hover:text-[#360407] hover:underline transition-colors"
                                        >
                                            <ArrowLeft className="w-3.5 h-3.5" />
                                            <span>{isEn ? 'Back to Sign In' : 'Kembali ke Halaman Masuk'}</span>
                                        </Link>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>

            {/* BOTTOM FOOTER */}
            <footer className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between text-[11px] text-white/60 shrink-0">
                <button
                    onClick={() => setLanguage(isEn ? 'id' : 'en')}
                    className="inline-flex items-center gap-1.5 text-white/80 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-md border border-white/10"
                >
                    <Globe className="w-3 h-3 text-[#E5A844]" />
                    <span>{isEn ? 'Bahasa Indonesia' : 'English'}</span>
                </button>
                <span>© {new Date().getFullYear()} Aroma Palace Official.</span>
            </footer>
        </div>
    );
}

