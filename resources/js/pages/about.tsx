import { Head, useForm } from '@inertiajs/react';
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
        title: 'Ekstraksi Berkelanjutan',
        title_en: 'Ethical Extraction',
        description: 'Ekstraksi botani panen liar dan esensi kayu dari budidaya berkelanjutan yang bersumber langsung dari perajin lokal berdedikasi.',
        description_en: 'Wild-harvested botanical extractions and sustainably cultivated wood essences sourced straight from indigenous forest stewards.',
        icon: 'leaf',
    },
    {
        title: 'Maserasi Sempurna',
        title_en: 'Masterful Maceration',
        description: 'Setiap racikan dimaserasi minimal 180 hari dalam ruang gelap bersuhu terjaga guna menyatukan harmonisasi akord aroma tingkat tinggi.',
        description_en: 'Every batch is allowed to macerate for a minimum of 180 days in temperature-controlled darkness to harmonize intricate accord layers.',
        icon: 'clock',
    },
    {
        title: 'Konsentrasi Ekstrak Tinggi',
        title_en: 'High Concentration',
        description: 'Kami menolak parfum yang diencerkan berlebihan. Seluruh formula Aroma Palace memiliki 20% hingga 35% konsentrat minyak wangi murni.',
        description_en: 'We reject diluted fragrances. All Aroma Palace formulas possess 20% to 35% pure aromatic concentrate for unparalleled sillage and longevity.',
        icon: 'sparkles',
    },
    {
        title: 'Atelier Privat Eksklusif',
        title_en: 'Bespoke Atelier',
        description: 'Konsultasi olfaktori personal yang dirancang khusus untuk memandu Anda menemukan wewangian signature yang mencerminkan aura sejati Anda.',
        description_en: 'Private olfactory consultations tailored to compose a one-of-a-kind scent signature echoing your memories and personal aura.',
        icon: 'fingerprint',
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
    const { t, pickText } = useTranslation();
    const activePillars = (pillars && Array.isArray(pillars) && pillars.length > 0) ? pillars : DEFAULT_PILLARS;
    const activeFaqs = (faqs && Array.isArray(faqs) && faqs.length > 0) ? faqs : DEFAULT_FAQS;

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
            <section className="py-14 sm:py-20 border-b border-border bg-background">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-4">
                    <Badge variant="secondary" className="mx-auto w-fit">
                        {t('about.philosophy_badge')}
                    </Badge>
                    <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground max-w-3xl mx-auto leading-tight">
                        {t('about.hero_title')}
                    </h1>
                    <p className="max-w-2xl mx-auto text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {t('about.hero_subtitle')}
                    </p>
                </div>
            </section>

            {/* PILLARS */}
            <section className="py-12 sm:py-16 border-b border-border">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
                    <div className="text-center max-w-xl mx-auto space-y-2">
                        <Badge variant="outline">{t('about.quality_standard')}</Badge>
                        <h2 className="text-2xl sm:text-3xl tracking-tight text-foreground">
                            <span className="font-normal">{t('about.four_pillars_prefix')}</span>{' '}
                            <span className="font-bold">Aroma Palace</span>
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {activePillars.map((pillar, idx) => (
                            <Card key={pillar.title} className="p-6 space-y-3 shadow-none rounded-lg">
                                <Badge variant="secondary" className="font-mono text-xs w-fit">
                                    0{idx + 1}
                                </Badge>
                                <h3 className="text-base font-bold text-foreground">
                                    {pickText(pillar.title, pillar.title_en)}
                                </h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    {pickText(pillar.description, pillar.description_en)}
                                </p>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* CONSULTATION & FAQS SECTION */}
            <section className="py-12 sm:py-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        {/* Consultation Form */}
                        <div className="lg:col-span-6">
                            <Card className="p-6 sm:p-8 shadow-none rounded-lg">
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
