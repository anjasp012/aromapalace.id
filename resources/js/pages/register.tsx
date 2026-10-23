import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from '@/lib/i18n';

interface RegisterProps {
    status?: string;
}

export default function Register({ status }: RegisterProps) {
    const { t } = useTranslation();
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

    return (
        <Layout>
            <Head title={`${t('auth.register_title')} - Aroma Palace`} />

            <div className="min-h-[75vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
                <div className="w-full max-w-md space-y-6">
                    {/* Header */}
                    <div className="text-center space-y-2">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-sans">
                            {t('auth.register_title')}
                        </h1>
                        <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                            {t('auth.register_subtitle')}
                        </p>
                    </div>

                    {status && (
                        <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs">
                            {status}
                        </div>
                    )}

                    {/* Card Form */}
                    <Card className="border border-border/80 shadow-none bg-card/80 backdrop-blur-xs">
                        <CardContent className="p-6 sm:p-8 space-y-5">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Name */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground block">
                                        {t('auth.full_name')}
                                    </label>
                                    <Input
                                        type="text"
                                        name="name"
                                        placeholder={t('auth.full_name_placeholder')}
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="h-10 text-base sm:text-sm shadow-none border-border/80 focus-visible:ring-1 focus-visible:ring-[#4A070B] focus-visible:border-[#4A070B]"
                                        required
                                    />
                                    {errors.name && (
                                        <p className="text-[11px] text-destructive">{errors.name}</p>
                                    )}
                                </div>

                                {/* Email */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground block">
                                        {t('auth.email')}
                                    </label>
                                    <Input
                                        type="email"
                                        name="email"
                                        placeholder={t('auth.email_placeholder')}
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        className="h-10 text-base sm:text-sm shadow-none border-border/80 focus-visible:ring-1 focus-visible:ring-[#4A070B] focus-visible:border-[#4A070B]"
                                        required
                                    />
                                    {errors.email && (
                                        <p className="text-[11px] text-destructive">{errors.email}</p>
                                    )}
                                </div>

                                {/* Password */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground block">
                                        {t('auth.password')}
                                    </label>
                                    <div className="relative">
                                        <Input
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            placeholder={t('auth.password_min')}
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            className="h-10 text-base sm:text-sm pr-10 shadow-none border-border/80 focus-visible:ring-1 focus-visible:ring-[#4A070B] focus-visible:border-[#4A070B]"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground text-xs cursor-pointer"
                                            tabIndex={-1}
                                        >
                                            {showPassword ? t('auth.hide') : t('auth.show')}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <p className="text-[11px] text-destructive">{errors.password}</p>
                                    )}
                                </div>

                                {/* Submit Button */}
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full h-10.5 rounded-md bg-[#4A070B] hover:bg-[#360407] text-white text-xs font-bold uppercase tracking-wider shadow-none transition cursor-pointer mt-2"
                                >
                                    {processing ? t('auth.registering') : t('auth.register_button')}
                                </Button>

                                {/* Login Link */}
                                <p className="text-center text-xs text-muted-foreground pt-2">
                                    {t('auth.have_account')}{' '}
                                    <Link
                                        href="/login"
                                        className="text-[#4A070B] font-bold"
                                    >
                                        {t('auth.sign_in_link')}
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
