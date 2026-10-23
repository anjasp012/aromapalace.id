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
    HelpCircle,
    MessageCircle,
} from 'lucide-react';

interface LoginProps {
    status?: string;
    notice?: string;
}

export default function Login({ status, notice }: LoginProps) {
    const { t, isEn } = useTranslation();
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
        <div className="min-h-[100dvh] w-full bg-[#4A070B] text-slate-100 relative overflow-x-hidden flex flex-col justify-between selection:bg-[#E5A844] selection:text-[#4A070B]">
            <Head title={`${t('auth.login_title')} • Aroma Palace`} />

            {/* AMBIENT LUXURY DECORATIVE CIRCLES & BUBBLES (Matching Reference Aesthetics) */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                {/* Big glow circles */}
                <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#E5A844]/15 blur-3xl" />
                <div className="absolute top-1/3 left-1/4 w-[480px] h-[480px] rounded-full bg-[#8C1D24]/40 blur-3xl" />
                <div className="absolute -bottom-24 right-1/4 w-[500px] h-[500px] rounded-full bg-[#360407]/70 blur-3xl" />
                <div className="absolute bottom-10 -right-20 w-80 h-80 rounded-full bg-[#E5A844]/10 blur-2xl" />

                {/* Decorative Solid Ambient Rings (Just like screenshot) */}
                <div className="hidden lg:block absolute top-28 left-[18%] w-16 h-16 rounded-full border-4 border-[#E5A844]/40 animate-pulse" />
                <div className="hidden lg:block absolute bottom-24 left-[10%] w-24 h-24 rounded-full border-[6px] border-[#E5A844]/25" />
                <div className="hidden lg:block absolute top-[45%] left-[4%] w-10 h-10 rounded-full bg-[#E5A844]/20" />
                <div className="hidden lg:block absolute bottom-36 left-[38%] w-14 h-14 rounded-full bg-[#8C1D24]/60" />
            </div>

            {/* TOP HEADER: BRAND LOGO & HOME BUTTON */}
            <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 pt-[max(env(safe-area-inset-top),1.25rem)] pb-4 flex items-center justify-between">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2.5 group cursor-pointer"
                >
                    <img
                        src="/images/logo.png"
                        alt="Aroma Palace"
                        className="h-9 w-auto brightness-0 invert drop-shadow-md group-hover:scale-105 transition-transform"
                    />
                    <span className="text-sm font-extrabold tracking-wider text-white uppercase font-sans hidden sm:inline-block">
                        Aroma Palace
                    </span>
                </Link>

                <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/90 hover:text-white transition-all bg-white/10 hover:bg-white/20 border border-white/20 px-3.5 py-2 rounded-xl backdrop-blur-md active:scale-95 shadow-sm"
                >
                    <Home className="w-3.5 h-3.5 text-[#E5A844]" />
                    <span>{isEn ? 'Home' : 'Beranda'}</span>
                </Link>
            </header>

            {/* MAIN CONTAINER: 2-COLUMN LAYOUT ON DESKTOP */}
            <main className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 py-4 sm:py-8 my-auto flex-1 flex items-center justify-center lg:justify-between">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center w-full">
                    {/* LEFT SIDE: ILLUSTRATION & BRAND STORY (Visible on Desktop) */}
                    <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 flex-col items-center justify-center text-center relative pr-4">
                        <div className="relative max-w-[460px] w-full">
                            {/* Ambient Glow behind image */}
                            <div className="absolute -inset-4 bg-gradient-to-tr from-[#E5A844]/25 via-[#8C1D24]/40 to-transparent rounded-3xl blur-2xl -z-10" />

                            {/* Crisp Illustration Container */}
                            <div className="rounded-3xl overflow-hidden shadow-2xl border border-white/20 bg-white/95 backdrop-blur-md p-2">
                                <img
                                    src="/images/auth-illustration.jpg"
                                    alt="Aroma Palace Experience"
                                    className="w-full h-auto object-cover rounded-2xl"
                                />
                            </div>

                            {/* Floating Boutique Caption Badge */}
                            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/35 backdrop-blur-md border border-white/15 text-white/90 text-xs shadow-lg">
                                <Sparkles className="w-3.5 h-3.5 text-[#E5A844]" />
                                <span>{isEn ? 'Authentic Luxury Fragrance Curation' : 'Koleksi Wewangian Mewah 100% Original'}</span>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT SIDE: FLOATING CRISP WHITE CARD (Matching Screenshot) */}
                    <div className="col-span-1 lg:col-span-6 xl:col-span-5 flex justify-center lg:justify-end w-full">
                        <Card className="w-full max-w-md bg-white text-neutral-900 border-0 shadow-2xl rounded-2xl sm:rounded-3xl overflow-hidden">
                            <CardContent className="p-6 sm:p-8 space-y-6">
                                {/* CARD HEADER */}
                                <div className="space-y-1.5 text-left">
                                    <h1 className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-neutral-900 font-sans leading-tight">
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
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {/* EMAIL INPUT */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-neutral-800 block">
                                            {t('auth.email')}
                                        </label>
                                        <Input
                                            type="email"
                                            name="email"
                                            inputMode="email"
                                            autoComplete="email"
                                            autoCapitalize="none"
                                            autoCorrect="off"
                                            spellCheck={false}
                                            placeholder="Masukkan email atau nomor handphone"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            className="h-12 px-4 text-sm rounded-xl bg-neutral-50 text-neutral-900 border-neutral-300 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-[#4A070B] focus-visible:border-[#4A070B] transition-all"
                                            required
                                        />
                                        <p className="text-[11px] text-neutral-400">
                                            Contoh: user@aromapalace.id atau 08123456789
                                        </p>
                                        {errors.email && (
                                            <p className="text-[11px] font-semibold text-red-600 mt-1">{errors.email}</p>
                                        )}
                                    </div>

                                    {/* PASSWORD INPUT */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-semibold text-neutral-800 block">
                                                {t('auth.password')}
                                            </label>
                                        </div>
                                        <div className="relative">
                                            <Input
                                                type={showPassword ? 'text' : 'password'}
                                                name="password"
                                                autoComplete="current-password"
                                                placeholder="Masukkan kata sandi akun Anda"
                                                value={data.password}
                                                onChange={(e) => setData('password', e.target.value)}
                                                className="h-12 pl-4 pr-11 text-sm rounded-xl bg-neutral-50 text-neutral-900 border-neutral-300 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-[#4A070B] focus-visible:border-[#4A070B] transition-all"
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

                                    {/* REMEMBER ME & FORGOT PASSWORD */}
                                    <div className="flex items-center justify-between text-xs pt-1">
                                        <label className="flex items-center gap-2 cursor-pointer text-neutral-600 select-none">
                                            <input
                                                type="checkbox"
                                                checked={data.remember}
                                                onChange={(e) => setData('remember', e.target.checked)}
                                                className="w-4 h-4 rounded border-neutral-300 text-[#4A070B] focus:ring-[#4A070B] cursor-pointer"
                                            />
                                            <span className="font-medium text-neutral-700">{t('auth.remember_me')}</span>
                                        </label>
                                        <Link
                                            href="/support"
                                            className="text-[11px] font-semibold text-[#4A070B] hover:text-[#360407] hover:underline cursor-pointer"
                                        >
                                            {t('auth.forgot_password')}
                                        </Link>
                                    </div>

                                    {/* SUBMIT BUTTON (Vibrant & Prominent like screenshot) */}
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full h-12 rounded-xl bg-[#4A070B] hover:bg-[#360407] active:scale-[0.98] text-white text-sm font-bold shadow-md transition-all cursor-pointer mt-3"
                                    >
                                        {processing ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span>{t('auth.processing')}</span>
                                            </span>
                                        ) : (
                                            <span>{isEn ? 'Sign In' : 'Selanjutnya'}</span>
                                        )}
                                    </Button>
                                </form>

                                {/* BUTUH BANTUAN FOOTER (Matching screenshot) */}
                                <div className="pt-3 border-t border-neutral-100 text-center space-y-1 text-xs text-neutral-500">
                                    <p className="font-medium text-neutral-600">
                                        {isEn ? 'Need help?' : 'Butuh bantuan?'}
                                    </p>
                                    <p className="text-[11.5px]">
                                        {isEn ? 'Visit ' : 'Kunjungi '}
                                        <Link href="/support" className="font-bold text-[#4A070B] hover:underline">
                                            {isEn ? 'Help Center' : 'Pusat Bantuan'}
                                        </Link>
                                        {' '}{isEn ? 'or ' : 'atau '}
                                        <a
                                            href="https://wa.me/6281234567890?text=Halo%20Aroma%20Palace,%20saya%20butuh%20bantuan%20akun"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-bold text-[#4A070B] hover:underline"
                                        >
                                            {isEn ? 'Contact Concierge' : 'Hubungi Concierge'}
                                        </a>
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>

            {/* BOTTOM SAFE-AREA FOOTER SPACING */}
            <footer className="relative z-10 w-full py-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] text-center text-[11px] text-white/50">
                <span>&copy; {new Date().getFullYear()} Aroma Palace Haute Parfumerie. All rights reserved.</span>
            </footer>
        </div>
    );
}
