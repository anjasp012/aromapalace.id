import { Head, Link, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from '@/lib/i18n';
import {
    User,
    Mail,
    Lock,
    Eye,
    EyeOff,
    ChevronLeft,
    Sparkles,
    ShieldCheck,
    Loader2,
} from 'lucide-react';

interface RegisterProps {
    status?: string;
}

export default function Register({ status }: RegisterProps) {
    const { t, isEn } = useTranslation();
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/register');
    };

    const handleBack = () => {
        if (typeof window !== 'undefined' && window.history.length > 1) {
            window.history.back();
        } else {
            router.visit('/login');
        }
    };

    return (
        <Layout showFooter={false} showBottomNav={false}>
            <Head title={`${t('auth.register_title')} • Aroma Palace`} />

            <div className="min-h-[100dvh] flex flex-col justify-between bg-gradient-to-b from-background via-background/95 to-muted/20 px-4 sm:px-6 py-4 pt-[max(env(safe-area-inset-top),1rem)] pb-[max(env(safe-area-inset-bottom),1.5rem)]">
                {/* TOP MOBILE BAR WITH BACK NAVIGATION */}
                <div className="w-full max-w-md mx-auto flex items-center justify-between pb-3 sm:pb-6">
                    <button
                        type="button"
                        onClick={handleBack}
                        aria-label={isEn ? 'Back' : 'Kembali'}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all duration-150 p-2 -ml-2 rounded-lg active:scale-95 cursor-pointer bg-background/60 backdrop-blur-xs border border-border/50 shadow-xs"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        <span>{isEn ? 'Back' : 'Kembali'}</span>
                    </button>

                    <Link
                        href="/"
                        className="text-[11px] font-bold tracking-widest uppercase text-muted-foreground hover:text-[#4A070B] dark:hover:text-[#E8D0BA] transition-colors"
                    >
                        Aroma Palace
                    </Link>
                </div>

                {/* MAIN CONTENT AREA */}
                <div className="w-full max-w-md mx-auto my-auto space-y-6">
                    {/* BRAND LOGO MONOGRAM & TITLE */}
                    <div className="text-center space-y-2.5">
                        <div className="relative inline-flex items-center justify-center">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#4A070B] via-[#5A0A10] to-[#360407] text-[#E5A844] flex items-center justify-center shadow-lg shadow-[#4A070B]/25 ring-1 ring-[#E5A844]/30">
                                <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 animate-pulse" />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-sans">
                                {isEn ? 'Create an Account' : 'Daftar Akun Baru'}
                            </h1>
                            <p className="text-xs sm:text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                                {isEn
                                    ? 'Join our private circle of fragrance connoisseurs and collectors.'
                                    : 'Bergabunglah untuk menikmati koleksi wewangian artisanal mewah Aroma Palace.'}
                            </p>
                        </div>
                    </div>

                    {status && (
                        <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs shadow-xs font-medium">
                            {status}
                        </div>
                    )}

                    {/* REGISTER FORM CARD */}
                    <Card className="border-0 sm:border sm:border-border/80 shadow-none sm:shadow-xl bg-transparent sm:bg-card/90 sm:backdrop-blur-sm rounded-none sm:rounded-2xl">
                        <CardContent className="p-0 sm:p-7 space-y-5">
                            <form onSubmit={handleSubmit} className="space-y-4.5">
                                {/* NAME INPUT */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-foreground block tracking-tight">
                                        {t('auth.full_name')}
                                    </label>
                                    <div className="relative">
                                        <User className="w-4.5 h-4.5 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                        <Input
                                            type="text"
                                            name="name"
                                            autoComplete="name"
                                            placeholder={t('auth.full_name_placeholder')}
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            className="h-12 pl-10.5 pr-4 text-sm rounded-xl bg-background border-border/80 shadow-xs focus-visible:ring-2 focus-visible:ring-[#4A070B] dark:focus-visible:ring-[#E8D0BA] focus-visible:border-[#4A070B] transition-all"
                                            required
                                        />
                                    </div>
                                    {errors.name && (
                                        <p className="text-[11px] font-medium text-destructive mt-1">{errors.name}</p>
                                    )}
                                </div>

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
                                    <label className="text-xs font-bold text-foreground block tracking-tight">
                                        {t('auth.password')}
                                    </label>
                                    <div className="relative">
                                        <Lock className="w-4.5 h-4.5 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                        <Input
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            autoComplete="new-password"
                                            placeholder={t('auth.password_min')}
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

                                {/* SUBMIT BUTTON */}
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full h-12 rounded-xl bg-[#4A070B] hover:bg-[#360407] active:scale-[0.98] text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-[#4A070B]/20 transition-all cursor-pointer mt-2"
                                >
                                    {processing ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>{t('auth.registering')}</span>
                                        </span>
                                    ) : (
                                        <span>{t('auth.register_button')}</span>
                                    )}
                                </Button>
                            </form>

                            {/* SIGN IN REDIRECT */}
                            <div className="pt-3 border-t border-border/60 text-center">
                                <p className="text-xs text-muted-foreground">
                                    {t('auth.have_account')}{' '}
                                    <Link
                                        href="/login"
                                        className="font-bold text-[#4A070B] dark:text-[#E8D0BA] hover:underline inline-flex items-center gap-1"
                                    >
                                        <span>{t('auth.sign_in_link')}</span>
                                        <span aria-hidden="true">&rarr;</span>
                                    </Link>
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* BOTTOM TRUST BADGE */}
                <div className="w-full max-w-md mx-auto pt-6 text-center">
                    <div className="inline-flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/80 font-medium">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>{isEn ? 'Encrypted 256-bit Secure Registration' : 'Registrasi Terenkripsi 256-bit Aman'}</span>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
