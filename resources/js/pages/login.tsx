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
} from 'lucide-react';

interface LoginProps {
    status?: string;
    notice?: string;
}

export default function Login({ status, notice }: LoginProps) {
    const { t, isEn, setLanguage } = useTranslation();
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
        <div className="fixed inset-0 h-[100dvh] max-h-[100dvh] w-full bg-[#4A070B] text-slate-100 overflow-hidden flex flex-col justify-between selection:bg-[#E5A844] selection:text-[#4A070B] overscroll-none">
            <Head title={`${t('auth.login_title')} • Aroma Palace`} />

            {/* AMBIENT LUXURY DECORATIVE CIRCLES & BUBBLES */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                {/* Big glow circles */}
                <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#E5A844]/15 blur-3xl" />
                <div className="absolute top-1/3 left-1/4 w-[480px] h-[480px] rounded-full bg-[#8C1D24]/40 blur-3xl" />
                <div className="absolute -bottom-24 right-1/4 w-[500px] h-[500px] rounded-full bg-[#360407]/70 blur-3xl" />
                <div className="absolute bottom-10 -right-20 w-80 h-80 rounded-full bg-[#E5A844]/10 blur-2xl" />

                {/* Decorative Solid Ambient Rings (Matching reference aesthetics) */}
                <div className="hidden lg:block absolute top-28 left-[18%] w-16 h-16 rounded-full border-4 border-[#E5A844]/40 animate-pulse" />
                <div className="hidden lg:block absolute bottom-24 left-[10%] w-24 h-24 rounded-full border-[6px] border-[#E5A844]/25" />
                <div className="hidden lg:block absolute top-[45%] left-[4%] w-10 h-10 rounded-full bg-[#E5A844]/20" />
                <div className="hidden lg:block absolute bottom-36 left-[38%] w-14 h-14 rounded-full bg-[#8C1D24]/60" />
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

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setLanguage(isEn ? 'id' : 'en')}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/90 hover:text-white transition-all bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-2 rounded-lg backdrop-blur-md active:scale-95 shadow-sm cursor-pointer"
                        title={isEn ? 'Ganti ke Bahasa Indonesia' : 'Switch to English'}
                    >
                        <Globe className="w-3.5 h-3.5 text-[#E5A844]" />
                        <span>{isEn ? '🇮🇩 ID' : '🇬🇧 EN'}</span>
                    </button>

                    <Link
                        href="/"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/90 hover:text-white transition-all bg-white/10 hover:bg-white/20 border border-white/20 px-3.5 py-2 rounded-lg backdrop-blur-md active:scale-95 shadow-sm"
                    >
                        <Home className="w-3.5 h-3.5 text-[#E5A844]" />
                        <span>{isEn ? 'Home' : 'Beranda'}</span>
                    </Link>
                </div>
            </header>

            {/* MAIN CONTAINER: 2-COLUMN LAYOUT ON DESKTOP */}
            <main className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 py-2 my-auto flex-1 flex items-center justify-center lg:justify-between min-h-0">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center w-full">
                    {/* LEFT SIDE: AUTH ILLUSTRATION (Matching Reference Screenshot) */}
                    <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 flex-col items-center justify-center text-center relative pr-4 select-none">
                        <div className="relative max-w-[480px] xl:max-w-[560px] w-full flex items-center justify-center">
                            {/* Ambient Glow behind illustration */}
                            <div className="absolute -inset-10 bg-gradient-to-tr from-[#E5A844]/20 via-[#8C1D24]/30 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

                            <img
                                src="/images/auth-illustration.png"
                                alt="Aroma Palace Shopping Experience"
                                className="w-full max-h-[460px] xl:max-h-[540px] object-contain drop-shadow-2xl transition-transform duration-500 hover:scale-[1.02]"
                            />
                        </div>
                    </div>

                    {/* RIGHT SIDE: FLOATING CRISP WHITE CARD (Matching Screenshot) */}
                    <div className="col-span-1 lg:col-span-6 xl:col-span-5 flex justify-center lg:justify-end w-full">
                        <Card className="w-full max-w-md bg-white text-neutral-900 border-0 shadow-2xl rounded-2xl sm:rounded-3xl overflow-hidden my-auto">
                            <CardContent className="p-6 sm:p-7 space-y-4 sm:space-y-5">
                                {/* CARD HEADER */}
                                <div className="space-y-1 text-left">
                                    <h1 className="text-2xl sm:text-[26px] font-extrabold tracking-tight text-neutral-900 font-sans leading-tight">
                                        {isEn ? 'Hello, Welcome Back!' : 'Halo, Selamat Datang!'}
                                    </h1>
                                    <p className="text-xs sm:text-sm text-neutral-600">
                                        {isEn ? "Don't have an account?" : 'Belum punya akun?'}{' '}
                                        <Link
                                            href="/register"
                                            className="font-bold text-[#4A070B] hover:text-[#360407] hover:underline"
                                        >
                                            {isEn ? 'Register Now' : 'Daftar Sekarang'}
                                        </Link>
                                    </p>
                                </div>

                                {/* STATUS OR NOTICE ALERTS */}
                                {notice && (
                                    <div className="p-3 rounded-xl border border-[#4A070B]/20 bg-[#4A070B]/5 text-[#4A070B] text-xs flex items-start gap-2">
                                        <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-[#E5A844]" />
                                        <span className="leading-relaxed font-medium">{notice}</span>
                                    </div>
                                )}

                                {status && (
                                    <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-50 text-emerald-800 text-xs font-medium">
                                        {status}
                                    </div>
                                )}

                                {/* LOGIN FORM */}
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
                                            autoCapitalize="none"
                                            autoCorrect="off"
                                            spellCheck={false}
                                            placeholder={isEn ? 'Enter your email or phone number' : 'Masukkan email atau nomor handphone'}
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            className="h-11 sm:h-12 px-4 text-sm rounded-xl bg-neutral-50 text-neutral-900 border-neutral-300 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-[#4A070B] focus-visible:border-[#4A070B] transition-all"
                                            required
                                        />
                                        {errors.email && (
                                            <p className="text-[11px] font-semibold text-red-600 mt-1">{errors.email}</p>
                                        )}
                                    </div>

                                    {/* PASSWORD INPUT */}
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-semibold text-neutral-800 block">
                                                {isEn ? 'Password' : 'Kata Sandi'}
                                            </label>
                                        </div>
                                        <div className="relative">
                                            <Input
                                                type={showPassword ? 'text' : 'password'}
                                                name="password"
                                                autoComplete="current-password"
                                                placeholder={isEn ? 'Enter your account password' : 'Masukkan kata sandi akun Anda'}
                                                value={data.password}
                                                onChange={(e) => setData('password', e.target.value)}
                                                className="h-11 sm:h-12 pl-4 pr-11 text-sm rounded-xl bg-neutral-50 text-neutral-900 border-neutral-300 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-[#4A070B] focus-visible:border-[#4A070B] transition-all"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-1 top-1 bottom-1 w-10 flex items-center justify-center text-neutral-500 hover:text-neutral-900 active:scale-95 transition-all cursor-pointer rounded-lg"
                                                tabIndex={-1}
                                                aria-label={showPassword ? t('auth.hide') : t('auth.show')}
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="w-4.5 h-4.5" />
                                                ) : (
                                                    <Eye className="w-4.5 h-4.5" />
                                                )}
                                            </button>
                                        </div>
                                        {errors.password && (
                                            <p className="text-[11px] font-semibold text-red-600 mt-1">{errors.password}</p>
                                        )}
                                    </div>

                                    {/* REMEMBER ME */}
                                    <div className="flex items-center text-xs pt-0.5">
                                        <label className="flex items-center gap-2 cursor-pointer text-neutral-600 select-none">
                                            <input
                                                type="checkbox"
                                                checked={data.remember}
                                                onChange={(e) => setData('remember', e.target.checked)}
                                                className="w-4 h-4 rounded border-neutral-300 text-[#4A070B] focus:ring-[#4A070B] cursor-pointer"
                                            />
                                            <span className="font-medium text-neutral-700">{isEn ? 'Remember me' : 'Ingat saya'}</span>
                                        </label>
                                    </div>

                                    {/* SUBMIT BUTTON (Vibrant & Prominent like screenshot) */}
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full h-11 sm:h-12 rounded-lg bg-[#4A070B] hover:bg-[#360407] active:scale-[0.98] text-white text-sm font-bold shadow-md transition-all cursor-pointer mt-2"
                                    >
                                        {processing ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span>{isEn ? 'Signing In...' : 'Memproses...'}</span>
                                            </span>
                                        ) : (
                                            <span>{isEn ? 'Sign In' : 'Selanjutnya'}</span>
                                        )}
                                    </Button>
                                </form>

                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
