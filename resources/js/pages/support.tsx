import React, { useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from '@/components/ui/accordion';
import {
    Headphones,
    MessageCircle,
    Mail,
    MapPin,
    Clock,
    Sparkles,
    ShieldCheck,
    Truck,
    Crown,
    Send,
    CheckCircle2,
    AlertCircle,
    ExternalLink,
    HelpCircle,
    Compass,
    ArrowRight,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface FAQItem {
    category: string;
    q: string;
    q_en: string;
    a: string;
    a_en: string;
}

interface SupportProps {
    faqs: FAQItem[];
    channels: {
        whatsapp: string;
        whatsapp_url: string;
        email: string;
        operating_hours: string;
        operating_hours_en: string;
        instagram: string;
    };
}

export default function SupportPage({ faqs = [], channels }: SupportProps) {
    const { isEn } = useTranslation();
    const flash = usePage<{ flash?: { success?: string | null; error?: string | null } }>().props.flash;

    const { data, setData, post, processing, errors, reset, recentlySuccessful } = useForm({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/support/inquiry', {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };

    return (
        <Layout>
            <Head title={isEn ? 'Customer Care & Support • Aroma Palace' : 'Layanan Pelanggan & Bantuan • Aroma Palace'} />

            {/* HERO MARKETING & SUPPORT BANNER */}
            <div className="border-b border-border/70 bg-gradient-to-b from-[#4A070B]/10 via-[#4A070B]/5 to-background py-10 sm:py-16">
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#4A070B] text-white shadow-sm">
                        <Headphones className="w-3.5 h-3.5 text-[#E5A844]" />
                        <span>{isEn ? 'VIP Concierge & Support' : 'Layanan Concierge & Bantuan'}</span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
                        <span className="font-light">{isEn ? 'How May We' : 'Bagaimana Kami Dapat'}</span>{' '}
                        <span className="font-bold text-[#4A070B] dark:text-[#E8D0BA]">
                            {isEn ? 'Assist You?' : 'Membantu Anda?'}
                        </span>
                    </h1>

                    <p className="max-w-2xl mx-auto text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {isEn
                            ? 'Our dedicated Olfactory Concierge and Customer Care team is here to assist with fragrance consultations, order tracking, boutique inquiries, and client satisfaction.'
                            : 'Tim Concierge Olfaktori dan Layanan Pelanggan Aroma Palace berdedikasi penuh untuk memandu konsultasi wewangian, pelacakan pesanan, informasi butik, dan kepuasan Anda.'}
                    </p>

                    <div className="pt-2 flex items-center justify-center gap-2 sm:gap-6 text-xs text-muted-foreground flex-wrap">
                        <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-[#E5A844]" />
                            <span>{isEn ? '24/7 VIP Concierge Service' : 'Layanan Concierge 24 Jam'}</span>
                        </div>
                        <span className="hidden sm:inline">•</span>
                        <div className="flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-[#E5A844]" />
                            <span>{isEn ? '100% Authentic Guarantee' : 'Garansi 100% Orisinalitas'}</span>
                        </div>
                        <span className="hidden sm:inline">•</span>
                        <div className="flex items-center gap-1.5">
                            <Truck className="w-3.5 h-3.5 text-[#E5A844]" />
                            <span>{isEn ? 'Nationwide Insured Delivery' : 'Pengiriman Berasuransi'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT CONTAINER */}
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
                {/* 4 PRIMARY CONTACT CHANNELS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* WhatsApp VIP */}
                    <a
                        href={channels.whatsapp_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/40 transition group flex flex-col justify-between"
                    >
                        <div className="space-y-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                <MessageCircle className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-foreground group-hover:text-emerald-600 transition">
                                    WhatsApp VIP Concierge
                                </h2>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {isEn ? 'Direct real-time chat with our luxury fragrance advisors.' : 'Konsultasi cepat langsung via WhatsApp dengan kurator aroma kami.'}
                                </p>
                            </div>
                        </div>
                        <div className="pt-4 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            <span>{channels.whatsapp}</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                        </div>
                    </a>

                    {/* Email Support */}
                    <a
                        href={`mailto:${channels.email}`}
                        className="p-5 rounded-2xl border border-border/80 bg-card hover:bg-muted/40 transition group flex flex-col justify-between"
                    >
                        <div className="space-y-3">
                            <div className="w-10 h-10 rounded-xl bg-[#4A070B]/10 text-[#4A070B] dark:text-[#E8D0BA] flex items-center justify-center">
                                <Mail className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-foreground group-hover:text-[#4A070B] transition">
                                    {isEn ? 'Official Email Support' : 'Layanan Surel Resmi'}
                                </h2>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {isEn ? 'For order inquiries, corporate gifts, and formal briefs.' : 'Untuk pertanyaan pesanan, pesanan korporat, dan pengaduan.'}
                                </p>
                            </div>
                        </div>
                        <div className="pt-4 flex items-center gap-1.5 text-xs font-semibold text-[#4A070B] dark:text-[#E8D0BA]">
                            <span className="truncate">{channels.email}</span>
                            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                        </div>
                    </a>

                    {/* Boutique Locations */}
                    <Link
                        href="/stores"
                        className="p-5 rounded-2xl border border-border/80 bg-card hover:bg-muted/40 transition group flex flex-col justify-between"
                    >
                        <div className="space-y-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center">
                                <MapPin className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-foreground group-hover:text-amber-600 transition">
                                    {isEn ? 'Boutique Locations' : 'Lokasi Butik Fisik'}
                                </h2>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {isEn ? 'Experience olfactory testing in our physical boutique galleries.' : 'Kunjungi butik fisik kami untuk merasakan langsung aroma parfum.'}
                                </p>
                            </div>
                        </div>
                        <div className="pt-4 flex items-center gap-1.5 text-xs font-semibold text-amber-600">
                            <span>{isEn ? 'Explore Stores' : 'Lihat Lokasi Butik'}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                    </Link>

                    {/* Fragrance Atelier */}
                    <Link
                        href="/about"
                        className="p-5 rounded-2xl border border-border/80 bg-card hover:bg-muted/40 transition group flex flex-col justify-between"
                    >
                        <div className="space-y-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-600 flex items-center justify-center">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-foreground group-hover:text-purple-600 transition">
                                    {isEn ? 'About Atelier & Scent' : 'Tentang Atelier & Profil'}
                                </h2>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {isEn ? 'Discover our extraction philosophy and bespoke scent sessions.' : 'Ketahui filosofi ekstraksi wewangian dan konsultasi privat.'}
                                </p>
                            </div>
                        </div>
                        <div className="pt-4 flex items-center gap-1.5 text-xs font-semibold text-purple-600">
                            <span>{isEn ? 'Learn More' : 'Pelajari Selengkapnya'}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                    </Link>
                </div>

                {/* MARKETING HIGHLIGHTS BANNER (App Store Marketing URL showcase) */}
                <div className="p-6 sm:p-8 rounded-3xl border border-[#E5A844]/40 bg-gradient-to-r from-[#360407] via-[#4A070B] to-[#2B0305] text-white shadow-xl relative overflow-hidden">
                    <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-[#E5A844]/20 via-transparent to-transparent pointer-events-none" />

                    <div className="relative z-10 max-w-3xl space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#E5A844] text-[#360407]">
                            <Crown className="w-3.5 h-3.5" />
                            <span>{isEn ? 'Royale Club Loyalty Privileges' : 'Keistimewaan Royale Club'}</span>
                        </div>

                        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                            {isEn ? 'Elevate Your Fragrance Experience' : 'Tingkatkan Pengalaman Olfaktori Anda'}
                        </h2>

                        <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
                            {isEn
                                ? 'Join Aroma Palace Royale Club to unlock complimentary discovery sets, earn reward points on every luxury purchase, and gain private previews of limited edition Dubai Extraits.'
                                : 'Bergabunglah dengan Royale Club Aroma Palace untuk menikmati sampel coffret gratis, kumpulkan poin reward di setiap transaksi, dan dapatkan akses awal koleksi langka Dubai Extraits.'}
                        </p>

                        <div className="pt-2 flex items-center gap-3 flex-wrap">
                            <Link href="/membership">
                                <Button size="sm" className="bg-gradient-to-r from-[#F7D070] to-[#E5A844] hover:from-[#E5A844] hover:to-[#C98A2C] text-[#360407] font-bold text-xs px-5 h-10 rounded-xl cursor-pointer">
                                    {isEn ? 'Join Royale Club (Complimentary)' : 'Gabung Royale Club (Gratis)'}
                                </Button>
                            </Link>
                            <Link href="/products">
                                <Button variant="outline" size="sm" className="border-white/30 text-white hover:bg-white/10 text-xs font-semibold h-10 px-5 rounded-xl cursor-pointer">
                                    {isEn ? 'Explore Fragrance Catalog' : 'Jelajahi Katalog Parfum'}
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* TWO COLUMNS: FAQ (LEFT) & INQUIRY FORM (RIGHT) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* FAQ ACCORDION (7 COLS) */}
                    <div className="lg:col-span-7 space-y-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-[#4A070B] dark:text-[#E8D0BA]">
                                <HelpCircle className="w-4 h-4 text-[#E5A844]" />
                                <span className="text-xs font-bold uppercase tracking-wider">
                                    {isEn ? 'Frequently Asked Questions' : 'Tanya Jawab Populer'}
                                </span>
                            </div>
                            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                                {isEn ? 'Quick Answers & Help' : 'Pusat Jawaban Cepat'}
                            </h2>
                        </div>

                        <Accordion type="single" collapsible defaultValue="faq-0" className="w-full space-y-2">
                            {faqs.map((faq, idx) => (
                                <AccordionItem
                                    key={idx}
                                    value={`faq-${idx}`}
                                    className="border border-border/80 rounded-xl px-4 bg-card"
                                >
                                    <AccordionTrigger className="text-xs sm:text-sm font-semibold hover:no-underline py-3 text-left">
                                        {isEn ? faq.q_en : faq.q}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-xs text-muted-foreground leading-relaxed pb-4">
                                        {isEn ? faq.a_en : faq.a}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>

                        <div className="p-4 rounded-xl border border-border/80 bg-muted/20 flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                                {isEn ? 'Have legal or privacy concerns?' : 'Pertanyaan seputar hukum atau privasi?'}
                            </span>
                            <Link href="/privacy-policy" className="font-semibold text-[#4A070B] dark:text-[#E8D0BA] hover:underline">
                                {isEn ? 'Read Privacy Policy →' : 'Baca Kebijakan Privasi →'}
                            </Link>
                        </div>
                    </div>

                    {/* CONTACT INQUIRY FORM (5 COLS) */}
                    <div className="lg:col-span-5">
                        <Card className="border border-border/80 shadow-md rounded-2xl overflow-hidden">
                            <div className="p-5 sm:p-6 space-y-4">
                                <div className="space-y-1">
                                    <h3 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                                        <Send className="w-4 h-4 text-[#E5A844]" />
                                        <span>{isEn ? 'Send Us a Message' : 'Kirim Pesan ke Tim Concierge'}</span>
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        {isEn
                                            ? 'Fill out the form below. Our response time is typically under 2 hours.'
                                            : 'Kirimkan pertanyaan atau pesan Anda. Tim kami akan merespons dalam hitungan jam.'}
                                    </p>
                                </div>

                                {flash?.success && (
                                    <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                                        <span>{flash.success}</span>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-3">
                                    <div>
                                        <label className="text-[11px] font-semibold text-foreground block mb-1">
                                            {isEn ? 'Your Name' : 'Nama Lengkap'} *
                                        </label>
                                        <Input
                                            type="text"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            placeholder={isEn ? 'e.g. Alexander Smith' : 'cth. Anjas Permana'}
                                            className="text-xs h-9"
                                            required
                                        />
                                        {errors.name && <p className="text-[10px] text-destructive mt-1">{errors.name}</p>}
                                    </div>

                                    <div>
                                        <label className="text-[11px] font-semibold text-foreground block mb-1">
                                            Email *
                                        </label>
                                        <Input
                                            type="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            placeholder="name@example.com"
                                            className="text-xs h-9"
                                            required
                                        />
                                        {errors.email && <p className="text-[10px] text-destructive mt-1">{errors.email}</p>}
                                    </div>

                                    <div>
                                        <label className="text-[11px] font-semibold text-foreground block mb-1">
                                            {isEn ? 'WhatsApp / Mobile (Optional)' : 'Nomor WhatsApp (Opsional)'}
                                        </label>
                                        <Input
                                            type="tel"
                                            value={data.phone}
                                            onChange={(e) => setData('phone', e.target.value)}
                                            placeholder="+62 8..."
                                            className="text-xs h-9"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[11px] font-semibold text-foreground block mb-1">
                                            {isEn ? 'Subject' : 'Perihal / Topik'} *
                                        </label>
                                        <Input
                                            type="text"
                                            value={data.subject}
                                            onChange={(e) => setData('subject', e.target.value)}
                                            placeholder={isEn ? 'e.g. Order Tracking #AP-1234' : 'cth. Pelacakan Pesanan #AP-1234'}
                                            className="text-xs h-9"
                                            required
                                        />
                                        {errors.subject && <p className="text-[10px] text-destructive mt-1">{errors.subject}</p>}
                                    </div>

                                    <div>
                                        <label className="text-[11px] font-semibold text-foreground block mb-1">
                                            {isEn ? 'Message Brief' : 'Pesan Anda'} *
                                        </label>
                                        <Textarea
                                            value={data.message}
                                            onChange={(e) => setData('message', e.target.value)}
                                            placeholder={isEn ? 'Provide details regarding your inquiry...' : 'Tuliskan detail pertanyaan atau bantuan yang Anda butuhkan...'}
                                            className="text-xs min-h-[90px]"
                                            required
                                        />
                                        {errors.message && <p className="text-[10px] text-destructive mt-1">{errors.message}</p>}
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full bg-[#4A070B] hover:bg-[#360407] text-white text-xs font-bold h-10 rounded-xl cursor-pointer mt-2"
                                    >
                                        {processing ? (
                                            <span>{isEn ? 'Transmitting...' : 'Mengirim Pesan...'}</span>
                                        ) : (
                                            <span className="flex items-center justify-center gap-1.5">
                                                <span>{isEn ? 'Send Message to Concierge' : 'Kirim Pesan ke Concierge'}</span>
                                                <Send className="w-3.5 h-3.5" />
                                            </span>
                                        )}
                                    </Button>
                                </form>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
