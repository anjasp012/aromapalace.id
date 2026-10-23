import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from '@/lib/i18n';
import {
    Mail,
    Lock,
    Eye,
    EyeOff,
    Home,
    Sparkles,
    Loader2,
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
        <div className="min-h-[100dvh] w-full flex flex-col justify-between bg-gradient-to-b from-background via-background/95 to-muted/20 px-4 sm:px-6 py-4 sm:py-8 pt-[max(env(safe-area-inset-top),1rem)] pb-[max(env(safe-area-inset-bottom),1.5rem)] selection:bg-[#4A070B] selection:text-white">
            <Head title={`${t('auth.login_title')} • Aroma Palace`} />

            {/* TOP BAR WITH BUTTON TO HOME */}
            <header className="w-full max-w-md mx-auto flex items-center justify-between pb-4 sm:pb-6">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all duration-150 px-3 py-2 rounded-xl active:scale-95 cursor-pointer bg-card/60 backdrop-blur-xs border border-border/60 shadow-xs"
                >
                    <Home className="w-4 h-4 text-[#4A070B] dark:text-[#E8D0BA]" />
                    <span>{isEn ? 'Home' : 'Beranda'}</span>
                </Link>

                <Link
                    href="/"
                    className="text-xs font-bold tracking-widest uppercase text-muted-foreground hover:text-[#4A070B] dark:hover:text-[#E8D0BA] transition-colors"
                >
                    Aroma Palace
                </Link>
            </header>

            {/* MAIN FORM CONTAINER */}
            <main className="w-full max-w-md mx-auto my-auto space-y-6">
                {/* BRAND MONOGRAM & TITLE */}
                <div className="text-center space-y-2.5">
                    <Link href="/" className="inline-block transition-transform hover:scale-105 active:scale-95">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#4A070B] via-[#5A0A10] to-[#360407] text-[#E5A844] flex items-center justify-center shadow-lg shadow-[#4A070B]/25 ring-1 ring-[#E5A844]/30 mx-auto">
                            <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 animate-pulse" />
                        </div>
                    </Link>

                    <div className="space-y-1">
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-sans">
                            {isEn ? 'Welcome Back' : 'Selamat Datang'}
                        </h1>
                        <p className="text-xs sm:text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                            {isEn
                                ? 'Sign in to access your luxury fragrance collection and order status.'
                                : 'Masuk untuk mengakses koleksi parfum impian dan status pesanan Anda.'}
                        </p>
                    </div>
                </div>

                {/* REDIRECT NOTICE & STATUS BANNERS */}
                {notice && (
                    <div className="p-3.5 rounded-xl border border-[#4A070B]/30 bg-[#4A070B]/10 text-[#4A070B] dark:text-[#E8D0BA] text-xs flex items-start gap-2.5 shadow-xs">
                        <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-[#E5A844]" />
                        <span className="leading-relaxed font-medium">{notice}</span>
                    </div>
                )}

                {status && (
                    <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs shadow-xs font-medium">
                        {status}
                    </div>
                )}

                {/* LOGIN CARD */}
                <Card className="border-0 sm:border sm:border-border/80 shadow-none sm:shadow-xl bg-transparent sm:bg-card/90 sm:backdrop-blur-sm rounded-none sm:rounded-2xl">
                    <CardContent className="p-0 sm:p-7 space-y-5">
                        <form onSubmit={handleSubmit} className="space-y-4.5">
                            {/* EMAIL INPUT */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-foreground block tracking-tight">
                                    {t('auth.email')}
                                </label>
                                <div className="relative">
                                    <Mail className="w-4.5 h-4.5 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    <Input
                                        type="email"
                                        name="email"
                                        inputMode="email"
                                        autoComplete="email"
                                        autoCapitalize="none"
                                        autoCorrect="off"
                                        spellCheck={false}
                                        placeholder={t('auth.email_placeholder')}
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        className="h-12 pl-10.5 pr-4 text-sm rounded-xl bg-background border-border/80 shadow-xs focus-visible:ring-2 focus-visible:ring-[#4A070B] dark:focus-visible:ring-[#E8D0BA] focus-visible:border-[#4A070B] transition-all"
                                        required
                                    />
                                </div>
                                {errors.email && (
                                    <p className="text-[11px] font-medium text-destructive mt-1">{errors.email}</p>
                                )}
                            </div>

                            {/* PASSWORD INPUT */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-foreground block tracking-tight">
                                        {t('auth.password')}
                                    </label>
                                </div>
                                <div className="relative">
                                    <Lock className="w-4.5 h-4.5 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    <Input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        autoComplete="current-password"
                                        placeholder="••••••••"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        className="h-12 pl-10.5 pr-11 text-sm rounded-xl bg-background border-border/80 shadow-xs focus-visible:ring-2 focus-visible:ring-[#4A070B] dark:focus-visible:ring-[#E8D0BA] focus-visible:border-[#4A070B] transition-all"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-1 top-1 bottom-1 w-10 flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95 transition-all cursor-pointer rounded-lg"
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
                                    <p className="text-[11px] font-medium text-destructive mt-1">{errors.password}</p>
                                )}
                            </div>

                            {/* REMEMBER ME & FORGOT PASSWORD */}
                            <div className="flex items-center justify-between text-xs pt-0.5">
                                <label className="flex items-center gap-2.5 cursor-pointer text-muted-foreground select-none py-1">
                                    <input
                                        type="checkbox"
                                        checked={data.remember}
                                        onChange={(e) => setData('remember', e.target.checked)}
                                        className="w-4 h-4 rounded-md border-border/80 text-[#4A070B] focus:ring-[#4A070B] cursor-pointer"
                                    />
                                    <span className="font-medium text-foreground/80">{t('auth.remember_me')}</span>
                                </label>
                                <Link
                                    href="/support"
                                    className="text-[11px] font-semibold text-[#4A070B] dark:text-[#E8D0BA] hover:underline cursor-pointer py-1"
                                >
                                    {t('auth.forgot_password')}
                                </Link>
                            </div>

                            {/* SUBMIT BUTTON */}
                            <Button
                                type="submit"
                                disabled={processing}
                                className="w-full h-12 rounded-xl bg-[#4A070B] hover:bg-[#360407] active:scale-[0.98] text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-[#4A070B]/20 transition-all cursor-pointer mt-2"
                            >
                                {processing ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>{t('auth.processing')}</span>
                                    </span>
                                ) : (
                                    <span>{t('auth.sign_in_button')}</span>
                                )}
                            </Button>
                        </form>

                        {/* REGISTRATION REDIRECT */}
                        <div className="pt-3 border-t border-border/60 text-center">
                            <p className="text-xs text-muted-foreground">
                                {t('auth.no_account')}{' '}
                                <Link
                                    href="/register"
                                    className="font-bold text-[#4A070B] dark:text-[#E8D0BA] hover:underline inline-flex items-center gap-1"
                                >
                                    <span>{t('auth.register_now')}</span>
                                    <span aria-hidden="true">&rarr;</span>
                                </Link>
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </main>

            {/* SPACER FOR CLEAN VERTICAL BALANCE */}
            <div className="py-2" aria-hidden="true" />
        </div>
    );
}
