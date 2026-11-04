import { Head, Link, useForm } from '@inertiajs/react';
import { type FormEvent } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from '@/components/ui/accordion';
import { useTranslation } from '@/lib/i18n';
import { Gem, Crown, Handshake, Sparkles, ArrowRight, Store } from 'lucide-react';

interface Pillar {
    title: string;
    title_en?: string;
    description: string;
    description_en?: string;
    icon: string;
}

interface FAQ {
    q: string;
    q_en?: string;
    a: string;
    a_en?: string;
}

const DEFAULT_PILLARS: Pillar[] = [
    {
        title: 'Keaslian Terjamin',
        title_en: 'Authenticity',
        description: 'Setiap wewangian adalah janji keaslian, dikurasi dengan cermat demi memastikan kualitas otentik dan rasa percaya diri dalam setiap pembelian.',
        description_en: 'Every fragrance is a promise of originality, sourced with care to ensure genuine quality and confidence in every purchase.',
        icon: 'gem',
    },
    {
        title: 'Kurasi Keunggulan',
        title_en: 'Curated Excellence',
        description: 'Kurasi pilihan istimewa dari merek parfum Timur Tengah dan internasional ternama, dipilih dengan penuh pertimbangan untuk setiap selera dan momen.',
        description_en: 'An exceptional selection of renowned Middle Eastern and international perfume brands, thoughtfully chosen for every taste and occasion.',
        icon: 'crown',
    },
    {
        title: 'Layanan Personal',
        title_en: 'Personalized Service',
        description: 'Pengalaman eksplorasi wewangian yang ramah dan menyenangkan, dipandu oleh layanan penuh perhatian untuk membantu setiap pelanggan menemukan aroma sempurna mereka.',
        description_en: 'A welcoming fragrance discovery experience, guided by attentive service to help every customer find their perfect scent.',
        icon: 'handshake',
    },
    {
        title: 'Kemewahan Terjangkau',
        title_en: 'Accessible Luxury',
        description: 'Mendekatkan kekayaan dan kemewahan seni wewangian bermutu tinggi kepada para pecinta aroma di seluruh Indonesia.',
        description_en: 'Bringing the richness and sophistication of fine perfumery closer to fragrance lovers across Indonesia.',
        icon: 'sparkles',
    },
];

const DEFAULT_FAQS: FAQ[] = [
    {
        q: 'Berapa lama ketahanan aroma Extrait de Parfum Aroma Palace di kulit?',
        q_en: 'How long does an Aroma Palace Extrait de Parfum last on skin?',
        a: 'Koleksi Extrait de Parfum kami mengandung konsentrasi minyak 28% hingga 35%, memberikan ketahanan 12 hingga 18 jam di kulit dan berhari-hari pada kain pakaian.',
        a_en: 'Our Extraits boast a 28% to 35% oil concentration, yielding 12 to 18 hours of continuous presence on skin and days on fine garments.',
    },
    {
        q: 'Apakah saya bisa mencoba sample kit sebelum membeli botol penuh?',
        q_en: 'Can I request a sample kit before purchasing a full bottle?',
        a: 'Tentu. Discovery Coffret kami mencakup lima botol mini 3ml beserta voucher belanja yang dapat digunakan untuk potongan harga pembelian botol 50ml atau 100ml.',
        a_en: 'Yes. The Discovery Coffret includes five 3ml miniature sprays alongside a voucher reimbursable towards any full-sized 50ml or 100ml bottle.',
    },
    {
        q: 'Dari mana asal bahan baku wewangian didatangkan?',
        q_en: 'Where are the raw ingredients sourced?',
        a: 'Mawar Taif dari Arab Saudi, minyak gaharu dari hutan lestari Kalimantan, mawar Centifolia dari Grasse Prancis, dan cendana murni dari Mysore India.',
        a_en: 'Taif roses from Saudi Arabia, agarwood from sustainable Kalimantan reserves, Centifolia roses from Grasse, and Mysore sandalwood from regulated plantations.',
    },
];

interface AboutProps {
    pillars?: Pillar[];
    faqs?: FAQ[];
}

export default function About({
    pillars = DEFAULT_PILLARS,
    faqs = DEFAULT_FAQS,
}: AboutProps) {
    const { t, pickText, isEn } = useTranslation();
    const activePillars = (pillars && Array.isArray(pillars) && pillars.length > 0) ? pillars : DEFAULT_PILLARS;
    const activeFaqs = (faqs && Array.isArray(faqs) && faqs.length > 0) ? faqs : DEFAULT_FAQS;

    const renderPillarIcon = (iconName: string) => {
        switch (iconName.toLowerCase()) {
            case 'gem':
            case 'diamond':
            case 'authenticity':
                return <Gem className="w-8 h-8 stroke-[1.6] text-[#4A070B] dark:text-[#E8D0BA]" />;
            case 'crown':
            case 'curated':
                return <Crown className="w-8 h-8 stroke-[1.6] text-[#4A070B] dark:text-[#E8D0BA]" />;
            case 'handshake':
            case 'service':
                return <Handshake className="w-8 h-8 stroke-[1.6] text-[#4A070B] dark:text-[#E8D0BA]" />;
            case 'sparkles':
            case 'luxury':
            default:
                return <Sparkles className="w-8 h-8 stroke-[1.6] text-[#4A070B] dark:text-[#E8D0BA]" />;
        }
    };

    const { data, setData, post, processing, errors, reset, wasSuccessful } = useForm({
        name: '',
        email: '',
        scent_family: 'Oriental Woody',
        notes: '',
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post('/consultation', {
            onSuccess: () => reset(),
        });
    };

    return (
        <Layout>
            <Head title={`${t('about.meta_title')}`} />

            {/* HERO SECTION */}
            <section className="py-14 sm:py-20 border-b border-border bg-gradient-to-b from-background via-card/30 to-background">
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
                    <Badge variant="secondary" className="mx-auto w-fit uppercase tracking-widest text-[11px] font-semibold px-3 py-1 bg-amber-500/10 border-amber-500/20 text-[#4A070B] dark:text-[#E8D0BA]">
                        {isEn ? 'About Us' : 'Tentang Kami'}
                    </Badge>

                    {/* Main Headline & Subtitle */}
                    <div className="space-y-3 max-w-4xl mx-auto">
                        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground font-serif uppercase">
                            OUR STORY
                        </h1>
                        <p className="text-lg sm:text-2xl md:text-3xl font-serif text-[#4A070B] dark:text-[#E8D0BA] font-semibold tracking-normal">
                            A Heritage of Scent, A World of Elegance
                        </p>
                    </div>

                    {/* Welcome & Opening Story */}
                    <div className="max-w-3xl mx-auto space-y-4 pt-1">
                        <p className="text-base sm:text-lg font-medium text-foreground/95 leading-relaxed font-serif">
                            Welcome to Aroma Palace, where the richness of Middle Eastern perfumery meets modern elegance.
                        </p>
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                            {isEn
                                ? 'Inspired by the luxurious fragrance culture of the Middle East, Aroma Palace is a destination for those who appreciate the art of fine perfumery. We bring together an exceptional selection of fragrances from renowned international perfume houses, offering scents that celebrate individuality, sophistication, and timeless beauty.'
                                : 'Terinspirasi oleh budaya wewangian mewah khas Timur Tengah, Aroma Palace adalah destinasi bagi para pencinta seni wewangian bermutu tinggi. Kami menghadirkan kurasi pilihan wewangian istimewa dari rumah parfum internasional ternama, menawarkan aroma yang merayakan keunikan individu, kemewahan, dan keindahan abadi.'}
                        </p>
                    </div>
                </div>
            </section>

            {/* BRAND ESSENCE & PHILOSOPHY (QUOTE CALLOUT) */}
            <section className="py-12 sm:py-16 border-b border-border bg-background">
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-12">
                    {/* Core Belief Highlight */}
                    <div className="relative p-8 sm:p-12 rounded-2xl bg-gradient-to-br from-[#4A070B]/5 via-amber-500/5 to-transparent border border-[#4A070B]/15 dark:border-[#E8D0BA]/15 text-center max-w-3xl mx-auto shadow-xs">
                        <span className="text-4xl sm:text-5xl text-[#4A070B] dark:text-[#E8D0BA] font-serif leading-none block mb-3 opacity-60">“</span>
                        <blockquote className="text-base sm:text-xl md:text-2xl font-medium text-foreground tracking-wide font-serif leading-relaxed italic max-w-2xl mx-auto">
                            {isEn
                                ? 'We believe a fragrance is more than just a scent. It is an expression of personality, a reflection of style, and a memory waiting to be created.'
                                : 'Kami meyakini bahwa wewangian lebih dari sekadar aroma. Parfum adalah ekspresi kepribadian, cerminan gaya hidup, dan kenangan indah yang menanti untuk diciptakan.'}
                        </blockquote>
                        <div className="mt-5 flex items-center justify-center gap-2">
                            <div className="h-px w-8 bg-[#4A070B]/30 dark:bg-[#E8D0BA]/30" />
                            <span className="text-[11px] uppercase tracking-widest font-bold text-[#4A070B] dark:text-[#E8D0BA]">Aroma Palace</span>
                            <div className="h-px w-8 bg-[#4A070B]/30 dark:bg-[#E8D0BA]/30" />
                        </div>
                    </div>

                    {/* Scent Spectrum Paragraph */}
                    <div className="text-center max-w-3xl mx-auto space-y-3">
                        <Badge variant="outline" className="text-xs font-semibold px-3 py-1">
                            {isEn ? 'The Fragrance Spectrum' : 'Kekayaan Spektrum Wewangian'}
                        </Badge>
                        <p className="text-sm sm:text-base text-foreground/90 font-medium leading-relaxed">
                            {isEn
                                ? 'From the deep, captivating richness of oud and amber to fresh, floral, woody, and contemporary compositions, our carefully selected collection offers something for every mood, occasion, and personality.'
                                : 'Dari kekayaan mendalam dan memikat oud serta amber, hingga komposisi segar, floral, woody, dan kontemporer, koleksi kurasi pilihan kami menawarkan wewangian untuk setiap suasana hati, momen istimewa, dan kepribadian.'}
                        </p>
                    </div>

                    {/* FOUR PILLARS OF EXCELLENCE */}
                    <div className="space-y-8 pt-4">
                        <div className="text-center max-w-2xl mx-auto space-y-3">
                            <Badge variant="secondary" className="uppercase tracking-widest text-[11px] font-semibold px-3 py-1 bg-amber-500/10 border-amber-500/20 text-[#4A070B] dark:text-[#E8D0BA]">
                                {t('about.pillars_badge')}
                            </Badge>
                            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-serif">
                                {t('about.pillars_title')}
                            </h2>
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                {t('about.pillars_subtitle')}
                            </p>
                        </div>

                        {/* 4 Pillars Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            {activePillars.map((pillar) => (
                                <Card
                                    key={pillar.title_en || pillar.title}
                                    className="p-6 sm:p-7 flex flex-col items-center text-center space-y-3.5 shadow-none rounded-2xl border border-border/80 bg-card/60 hover:border-[#4A070B]/30 dark:hover:border-[#E8D0BA]/30 hover:shadow-xs transition-all duration-200"
                                >
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-amber-500/10 dark:bg-amber-400/10 mb-1">
                                        {renderPillarIcon(pillar.icon)}
                                    </div>
                                    <h3 className="text-base sm:text-lg font-bold text-foreground font-serif tracking-tight">
                                        {pickText(pillar.title, pillar.title_en)}
                                    </h3>
                                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                        {pickText(pillar.description, pillar.description_en)}
                                    </p>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Invitation & Discovery Banner */}
                    <div className="p-8 sm:p-10 rounded-2xl bg-gradient-to-r from-[#4A070B] via-[#5C0A0E] to-[#4A070B] text-white text-center space-y-4 shadow-sm">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-200 text-xs font-semibold">
                            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                            <span>{isEn ? 'Fragrance Discovery' : 'Petualangan Wewangian'}</span>
                        </div>
                        <p className="text-sm sm:text-base md:text-lg text-white/95 max-w-2xl mx-auto leading-relaxed font-medium">
                            {isEn
                                ? "Whether you're discovering your signature scent, exploring something new, or searching for the perfect gift, Aroma Palace invites you to experience the pleasure of fragrance discovery."
                                : 'Baik saat Anda mencari signature scent sejati, menjelajahi aroma baru, maupun mencari hadiah yang sempurna, Aroma Palace mengundang Anda untuk merasakan kenikmatan petualangan wewangian ini.'}
                        </p>
                        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                            <Link href="/products">
                                <Button className="h-10 px-5 rounded-md font-bold text-xs sm:text-sm bg-[#FFC400] hover:bg-[#E5B000] text-black shadow-none cursor-pointer flex items-center gap-1.5 transition">
                                    <span>{isEn ? 'Explore Fragrance Collection' : 'Jelajahi Koleksi Parfum'}</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </Button>
                            </Link>
                            <Link href="/stores">
                                <Button variant="outline" className="h-10 px-5 rounded-md font-bold text-xs sm:text-sm text-white border-white/30 hover:bg-white/10 hover:text-white cursor-pointer shadow-none flex items-center gap-1.5 transition">
                                    <Store className="w-3.5 h-3.5" />
                                    <span>{isEn ? 'Find Boutiques' : 'Temukan Butik Kami'}</span>
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* CONSULTATION & FAQS SECTION */}
            <section className="py-12 sm:py-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        {/* Consultation Form */}
                        <div className="lg:col-span-6">
                            <Card className="p-6 sm:p-8 shadow-none rounded-xl border border-border/80 bg-card/60">
                                <CardHeader className="p-0 pb-6 space-y-1.5">
                                    <Badge variant="secondary" className="w-fit">{t('about.consultation_badge')}</Badge>
                                    <CardTitle className="text-xl font-bold">{t('about.consultation_title')}</CardTitle>
                                    <CardDescription className="text-xs">
                                        {t('about.consultation_desc')}
                                    </CardDescription>
                                </CardHeader>

                                {wasSuccessful && (
                                    <div className="mb-4 rounded-lg bg-muted p-3 text-xs text-foreground font-medium border border-border">
                                        {t('about.consultation_success')}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-foreground">{t('auth.full_name')}</label>
                                        <Input
                                            type="text"
                                            required
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            placeholder={t('about.name_placeholder')}
                                            className="text-xs h-9"
                                        />
                                        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-foreground">{t('auth.email')}</label>
                                        <Input
                                            type="email"
                                            required
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            placeholder={t('about.email_placeholder')}
                                            className="text-xs h-9"
                                        />
                                        {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-foreground">{t('about.scent_family_label')}</label>
                                        <select
                                            value={data.scent_family}
                                            onChange={(e) => setData('scent_family', e.target.value)}
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                                        >
                                            <option value="Oriental Woody">{t('about.family_woody')}</option>
                                            <option value="Velvet Floral">{t('about.family_floral')}</option>
                                            <option value="Clean Woody">{t('about.family_clean')}</option>
                                            <option value="Fresh Citrus">{t('about.family_citrus')}</option>
                                            <option value="Smoky Leather">{t('about.family_leather')}</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-foreground">{t('about.notes_label')}</label>
                                        <Textarea
                                            rows={3}
                                            value={data.notes}
                                            onChange={(e) => setData('notes', e.target.value)}
                                            placeholder={t('about.notes_placeholder')}
                                            className="text-xs resize-none"
                                        />
                                        {errors.notes && <p className="text-xs text-destructive">{errors.notes}</p>}
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full text-xs h-10 mt-2"
                                    >
                                        {processing ? t('about.submitting') : t('about.submit_consultation')}
                                    </Button>
                                </form>
                            </Card>
                        </div>

                        {/* FAQs Accordion */}
                        <div className="lg:col-span-6 flex flex-col justify-center space-y-4">
                            <div className="space-y-1">
                                <Badge variant="outline">{t('about.faq_badge')}</Badge>
                                <h2 className="text-2xl tracking-tight text-foreground">
                                    <span className="font-normal">{t('about.faq_prefix')}</span>{' '}
                                    <span className="font-bold">{t('about.faq_suffix')}</span>
                                </h2>
                            </div>

                            <Accordion type="single" collapsible defaultValue="faq-0" className="space-y-3">
                                {activeFaqs.map((faq, index) => (
                                    <AccordionItem
                                        key={faq.q}
                                        value={`faq-${index}`}
                                        className="rounded-lg border border-border px-4"
                                    >
                                        <AccordionTrigger className="text-left text-xs sm:text-sm font-medium py-3.5 hover:no-underline">
                                            {pickText(faq.q, faq.q_en)}
                                        </AccordionTrigger>
                                        <AccordionContent className="text-xs text-muted-foreground leading-relaxed pb-3.5">
                                            {pickText(faq.a, faq.a_en)}
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </div>
                    </div>
                </div>
            </section>
        </Layout>
    );
}
