import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import {
    Building2,
    Phone,
    Mail,
    MessageSquare,
    Save,
    Sparkles,
    Store,
    Loader2,
    Eye,
    EyeOff,
    Smartphone,
    ArrowUpCircle,
    CreditCard,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface SettingsIndexProps {
    settings: Record<string, any>;
}

export default function SettingsIndex({
    settings = {},
}: SettingsIndexProps) {
    const { data, setData, post, processing, errors } = useForm({
        // Kontak & Profil Toko
        store_name: settings.store_name || '',
        store_email: settings.store_email || '',
        store_phone: settings.store_phone || '',
        store_whatsapp: settings.store_whatsapp || '',
        store_description: settings.store_description || '',

        // Integrasi Payment Gateway (RajaOngkir / Komerce Collaborator)
        rajaongkir_payment_mode: settings.rajaongkir_payment_mode || 'sandbox',
        rajaongkir_payment_key: settings.rajaongkir_payment_key || '',
        rajaongkir_callback_api_key: settings.rajaongkir_callback_api_key || '',
        rajaongkir_callback_url: settings.rajaongkir_callback_url || '',

        // Mobile App Update (Capacitor)
        app_min_version: settings.app_min_version || '1.0.0',
        app_latest_version: settings.app_latest_version || '1.0.0',
        app_force_update: Boolean(settings.app_force_update === '1' || settings.app_force_update === true || settings.app_force_update === 1),
        app_update_title: settings.app_update_title || 'Pembaruan Aplikasi Tersedia',
        app_update_message: settings.app_update_message || 'Versi baru aplikasi Aroma Palace telah tersedia dengan peningkatan fitur dan stabilitas. Mohon perbarui aplikasi Anda untuk melanjutkan berbelanja.',
        app_playstore_url: settings.app_playstore_url || 'https://play.google.com/store/apps/details?id=com.aromapalace.app',
        app_appstore_url: settings.app_appstore_url || 'https://apps.apple.com/app/aromapalace/id6740000000',
        app_apk_url: settings.app_apk_url || '',
    });

    const [showPaymentKey, setShowPaymentKey] = useState(false);
    const [showCallbackKey, setShowCallbackKey] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/pengaturan', {
            preserveScroll: true,
        });
    };

    return (
        <AdminLayout
            title="Pengaturan Toko & Sistem"
            subtitle="Kelola profil kontak resmi butik, integrasi payment gateway, dan pembaruan aplikasi mobile."
        >
            <Head title="Pengaturan Toko & Payment Gateway - Admin Aroma Palace" />

            <form onSubmit={handleSubmit} className="w-full space-y-6 pb-12">
                {/* Header Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 sm:p-6 rounded-2xl border shadow-xs">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="p-2 rounded-xl bg-[#4A070B]/10 text-[#4A070B] dark:bg-[#4A070B]/20 dark:text-red-400">
                                <Store className="size-5" />
                            </span>
                            <h1 className="text-xl font-bold tracking-tight text-foreground">
                                Pengaturan Toko &amp; Payment Gateway
                            </h1>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                            Data kontak resmi butik untuk invoice dan CS, kredensial gerbang pembayaran, serta kontrol pembaruan aplikasi mobile.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <Button
                            type="submit"
                            disabled={processing}
                            className="bg-[#4A070B] hover:bg-[#380508] text-white shadow-xs gap-2 px-5 font-medium cursor-pointer"
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />
                                    <span>Menyimpan...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="size-4" />
                                    <span>Simpan Perubahan</span>
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* KOLOM KIRI: PROFIL TOKO & PAYMENT GATEWAY (lg:col-span-6) */}
                    <div className="lg:col-span-6 space-y-6">
                        {/* BAGIAN 1: KONTAK & PROFIL TOKO */}
                        <Card className="shadow-xs border-border/80">
                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-2 text-[#4A070B] dark:text-red-400">
                                    <Building2 className="size-4.5" />
                                    <CardTitle className="text-base font-bold">Profil &amp; Kontak Toko</CardTitle>
                                </div>
                                <CardDescription className="text-xs">
                                    Informasi identitas butik resmi Aroma Palace yang tertera pada invoice dan dukungan pelanggan.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Nama Toko */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                                        <span>Nama Toko / Brand</span>
                                        <span className="text-destructive">*</span>
                                    </label>
                                    <Input
                                        type="text"
                                        placeholder="Aroma Palace Official"
                                        value={data.store_name}
                                        onChange={(e) => setData('store_name', e.target.value)}
                                        className="h-10 text-sm"
                                        required
                                    />
                                    {errors.store_name && (
                                        <p className="text-xs text-destructive">{errors.store_name}</p>
                                    )}
                                </div>

                                {/* Email Resmi */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                        <Mail className="size-3.5 text-muted-foreground" />
                                        <span>Email Dukungan / CS</span>
                                    </label>
                                    <Input
                                        type="email"
                                        placeholder="support@aromapalace.id"
                                        value={data.store_email}
                                        onChange={(e) => setData('store_email', e.target.value)}
                                        className="h-10 text-sm"
                                    />
                                    {errors.store_email && (
                                        <p className="text-xs text-destructive">{errors.store_email}</p>
                                    )}
                                </div>

                                {/* Nomor Telepon */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                        <Phone className="size-3.5 text-muted-foreground" />
                                        <span>Nomor Telepon Toko</span>
                                    </label>
                                    <Input
                                        type="tel"
                                        placeholder="081288889999"
                                        value={data.store_phone}
                                        onChange={(e) => setData('store_phone', e.target.value)}
                                        className="h-10 text-sm"
                                    />
                                    {errors.store_phone && (
                                        <p className="text-xs text-destructive">{errors.store_phone}</p>
                                    )}
                                </div>

                                {/* WhatsApp Official */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                        <MessageSquare className="size-3.5 text-emerald-600" />
                                        <span>WhatsApp Customer Service</span>
                                    </label>
                                    <Input
                                        type="tel"
                                        placeholder="6281288889999"
                                        value={data.store_whatsapp}
                                        onChange={(e) => setData('store_whatsapp', e.target.value)}
                                        className="h-10 text-sm"
                                    />
                                    <p className="text-[11px] text-muted-foreground">
                                        Gunakan format internasional (contoh: 6281234567890) untuk integrasi tombol chat WhatsApp langsung.
                                    </p>
                                    {errors.store_whatsapp && (
                                        <p className="text-xs text-destructive">{errors.store_whatsapp}</p>
                                    )}
                                </div>

                                {/* Deskripsi / Tagline Toko */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                        <Sparkles className="size-3.5 text-amber-600" />
                                        <span>Slogan / Deskripsi Singkat</span>
                                    </label>
                                    <Textarea
                                        placeholder="Destinasi eksklusif wewangian mewah berkelas dunia..."
                                        rows={3}
                                        value={data.store_description}
                                        onChange={(e) => setData('store_description', e.target.value)}
                                        className="text-sm resize-none"
                                    />
                                    {errors.store_description && (
                                        <p className="text-xs text-destructive">{errors.store_description}</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* BAGIAN 2: INTEGRASI PAYMENT GATEWAY */}
                        <Card className="shadow-xs border-border/80">
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-[#4A070B] dark:text-red-400">
                                        <CreditCard className="size-4.5" />
                                        <CardTitle className="text-base font-bold">Integrasi Payment Gateway</CardTitle>
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className={
                                            data.rajaongkir_payment_mode === 'production'
                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300 font-semibold text-[11px]'
                                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300 font-semibold text-[11px]'
                                        }
                                    >
                                        {data.rajaongkir_payment_mode === 'production' ? 'Production (Live)' : 'Sandbox (Uji Coba)'}
                                    </Badge>
                                </div>
                                <CardDescription className="text-xs">
                                    Konfigurasi kredensial Payment Gateway otomatis untuk Virtual Account dan QRIS.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Mode Lingkungan Payment */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                                        <span>Mode Lingkungan Pembayaran</span>
                                        <span className="text-destructive">*</span>
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setData('rajaongkir_payment_mode', 'sandbox')}
                                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                                data.rajaongkir_payment_mode === 'sandbox'
                                                    ? 'border-amber-500 bg-amber-500/10 text-amber-950 dark:text-amber-200 ring-1 ring-amber-500'
                                                    : 'border-border/80 hover:bg-muted/40 text-muted-foreground'
                                            }`}
                                        >
                                            <div className="font-bold text-xs">Sandbox (Uji Coba)</div>
                                            <div className="text-[10px] opacity-80 mt-0.5">api-sandbox.collaborator.komerce.id</div>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setData('rajaongkir_payment_mode', 'production')}
                                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                                data.rajaongkir_payment_mode === 'production'
                                                    ? 'border-[#4A070B] bg-[#4A070B]/10 text-[#4A070B] dark:text-red-300 ring-1 ring-[#4A070B]'
                                                    : 'border-border/80 hover:bg-muted/40 text-muted-foreground'
                                            }`}
                                        >
                                            <div className="font-bold text-xs">Production (Live)</div>
                                            <div className="text-[10px] opacity-80 mt-0.5">api.collaborator.komerce.id</div>
                                        </button>
                                    </div>
                                    {errors.rajaongkir_payment_mode && (
                                        <p className="text-xs text-destructive">{errors.rajaongkir_payment_mode}</p>
                                    )}
                                </div>

                                {/* Payment API Key */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-semibold text-foreground">API Key Pembayaran (x-api-key)</label>
                                        <button
                                            type="button"
                                            onClick={() => setShowPaymentKey(!showPaymentKey)}
                                            className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer select-none"
                                        >
                                            {showPaymentKey ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                                            <span>{showPaymentKey ? 'Sembunyikan' : 'Lihat'}</span>
                                        </button>
                                    </div>
                                    <Input
                                        type={showPaymentKey ? 'text' : 'password'}
                                        value={data.rajaongkir_payment_key}
                                        onChange={(e) => setData('rajaongkir_payment_key', e.target.value)}
                                        placeholder="Masukkan API Key Pembayaran..."
                                        className="h-10 text-xs font-mono"
                                    />
                                    {errors.rajaongkir_payment_key && (
                                        <p className="text-xs text-destructive">{errors.rajaongkir_payment_key}</p>
                                    )}
                                </div>

                                {/* Callback API Key (Signature Secret) */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-semibold text-foreground">Callback API Key (Webhook Secret HMAC)</label>
                                        <button
                                            type="button"
                                            onClick={() => setShowCallbackKey(!showCallbackKey)}
                                            className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer select-none"
                                        >
                                            {showCallbackKey ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                                            <span>{showCallbackKey ? 'Sembunyikan' : 'Lihat'}</span>
                                        </button>
                                    </div>
                                    <Input
                                        type={showCallbackKey ? 'text' : 'password'}
                                        value={data.rajaongkir_callback_api_key}
                                        onChange={(e) => setData('rajaongkir_callback_api_key', e.target.value)}
                                        placeholder="Secret key untuk verifikasi X-Callback-Api-Key..."
                                        className="h-10 text-xs font-mono"
                                    />
                                    {errors.rajaongkir_callback_api_key && (
                                        <p className="text-xs text-destructive">{errors.rajaongkir_callback_api_key}</p>
                                    )}
                                </div>

                                {/* Callback URL */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">URL Webhook / Callback Notifikasi</label>
                                    <Input
                                        type="text"
                                        value={data.rajaongkir_callback_url}
                                        onChange={(e) => setData('rajaongkir_callback_url', e.target.value)}
                                        placeholder="https://aromapalace.id/rajaongkir/callbackpayment"
                                        className="h-10 text-xs font-mono"
                                    />
                                    <p className="text-[11px] text-muted-foreground">
                                        Endpoint yang akan menerima webhook pembayaran sukses dari gateway.
                                    </p>
                                    {errors.rajaongkir_callback_url && (
                                        <p className="text-xs text-destructive">{errors.rajaongkir_callback_url}</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* KOLOM KANAN: PEMBARUAN APLIKASI MOBILE (lg:col-span-6) */}
                    <div className="lg:col-span-6 space-y-6">
                        <Card className="shadow-xs border-border/80">
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-[#4A070B] dark:text-red-400">
                                        <Smartphone className="size-4.5" />
                                        <CardTitle className="text-base font-bold">Pembaruan Aplikasi Mobile</CardTitle>
                                    </div>
                                    <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300 gap-1 text-[11px]">
                                        <ArrowUpCircle className="size-3" />
                                        Capacitor OTA
                                    </Badge>
                                </div>
                                <CardDescription className="text-xs">
                                    Kontrol versi aplikasi mobile Android &amp; iOS. Atur versi rilis terbaru dan tentukan apakah pembaruan bersifat wajib (force update modal tidak bisa ditutup) atau opsional.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Toggle Wajib Update */}
                                <label className="flex items-start gap-3 p-3 rounded-xl border border-border/80 bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(data.app_force_update)}
                                        onChange={(e) => setData('app_force_update', e.target.checked)}
                                        className="size-4 mt-0.5 rounded border-gray-300 text-[#4A070B] focus:ring-[#4A070B]"
                                    />
                                    <div className="flex-1 space-y-1">
                                        <div className="text-xs font-semibold text-foreground flex items-center gap-2">
                                            <span>Wajib Update (Kunci Aplikasi)</span>
                                            {data.app_force_update ? (
                                                <Badge variant="destructive" className="text-[10px] py-0 px-1.5 h-4">
                                                    Wajib Aktif
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 text-muted-foreground">
                                                    Opsional
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                                            Bila diaktifkan, dialog pembaruan di aplikasi mobile tidak dapat ditutup dan tombol back dinonaktifkan sampai pengguna memperbarui aplikasi.
                                        </p>
                                    </div>
                                </label>

                                {/* Input Versi */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                                            <span>Versi Minimum yang Diizinkan</span>
                                            <span className="text-[10px] text-muted-foreground font-mono">Semver</span>
                                        </label>
                                        <Input
                                            type="text"
                                            placeholder="1.0.0"
                                            value={data.app_min_version}
                                            onChange={(e) => setData('app_min_version', e.target.value)}
                                            className="h-10 text-xs font-mono"
                                        />
                                        <p className="text-[10px] text-muted-foreground">
                                            Versi di bawah ini otomatis dipaksa update (wajib).
                                        </p>
                                        {errors.app_min_version && (
                                            <p className="text-xs text-destructive">{errors.app_min_version}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                                            <span>Versi Terbaru di App Store</span>
                                            <span className="text-[10px] text-muted-foreground font-mono">Semver</span>
                                        </label>
                                        <Input
                                            type="text"
                                            placeholder="1.1.0"
                                            value={data.app_latest_version}
                                            onChange={(e) => setData('app_latest_version', e.target.value)}
                                            className="h-10 text-xs font-mono"
                                        />
                                        <p className="text-[10px] text-muted-foreground">
                                            Nomor versi rilis terbaru yang siap diunduh.
                                        </p>
                                        {errors.app_latest_version && (
                                            <p className="text-xs text-destructive">{errors.app_latest_version}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Judul & Pesan Update */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">
                                        Judul Notifikasi Pembaruan
                                    </label>
                                    <Input
                                        type="text"
                                        placeholder="Pembaruan Aplikasi Tersedia"
                                        value={data.app_update_title}
                                        onChange={(e) => setData('app_update_title', e.target.value)}
                                        className="h-10 text-sm"
                                    />
                                    {errors.app_update_title && (
                                        <p className="text-xs text-destructive">{errors.app_update_title}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">
                                        Pesan Pembaruan / Catatan Rilis
                                    </label>
                                    <Textarea
                                        rows={3}
                                        placeholder="Tuliskan catatan rilis fitur baru atau perbaikan bug..."
                                        value={data.app_update_message}
                                        onChange={(e) => setData('app_update_message', e.target.value)}
                                        className="text-sm resize-none"
                                    />
                                    {errors.app_update_message && (
                                        <p className="text-xs text-destructive">{errors.app_update_message}</p>
                                    )}
                                </div>

                                {/* URL Store */}
                                <div className="space-y-3 pt-1">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-foreground">
                                            URL Google Play Store (Android)
                                        </label>
                                        <Input
                                            type="url"
                                            placeholder="https://play.google.com/store/apps/details?id=com.aromapalace.app"
                                            value={data.app_playstore_url}
                                            onChange={(e) => setData('app_playstore_url', e.target.value)}
                                            className="h-10 text-xs font-mono"
                                        />
                                        {errors.app_playstore_url && (
                                            <p className="text-xs text-destructive">{errors.app_playstore_url}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-foreground">
                                            URL Apple App Store (iOS)
                                        </label>
                                        <Input
                                            type="url"
                                            placeholder="https://apps.apple.com/app/aromapalace/id6740000000"
                                            value={data.app_appstore_url}
                                            onChange={(e) => setData('app_appstore_url', e.target.value)}
                                            className="h-10 text-xs font-mono"
                                        />
                                        {errors.app_appstore_url && (
                                            <p className="text-xs text-destructive">{errors.app_appstore_url}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-foreground">
                                            URL Langsung APK Android (Opsional)
                                        </label>
                                        <Input
                                            type="url"
                                            placeholder="https://storage.googleapis.com/.../Aroma-Palace.apk"
                                            value={data.app_apk_url}
                                            onChange={(e) => setData('app_apk_url', e.target.value)}
                                            className="h-10 text-xs font-mono"
                                        />
                                        <p className="text-[11px] text-muted-foreground">
                                            Bila dikosongkan, tombol unduh APK di website akan mengunduh file APK resmi langsung dari server butik (/app-release.apk).
                                        </p>
                                        {errors.app_apk_url && (
                                            <p className="text-xs text-destructive">{errors.app_apk_url}</p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Bottom Submit Action */}
                <div className="flex items-center justify-end gap-3 pt-2">
                    <Button
                        type="submit"
                        disabled={processing}
                        size="lg"
                        className="bg-[#4A070B] hover:bg-[#380508] text-white shadow-xs gap-2 px-8 font-semibold rounded-xl cursor-pointer"
                    >
                        {processing ? (
                            <>
                                <Loader2 className="size-4 animate-spin" />
                                <span>Menyimpan Pengaturan...</span>
                            </>
                        ) : (
                            <>
                                <Save className="size-4" />
                                <span>Simpan Semua Pengaturan</span>
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </AdminLayout>
    );
}
