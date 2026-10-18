import { Head, useForm } from '@inertiajs/react';
import { type FormEvent } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from '@/components/ui/accordion';

interface Pillar {
    title: string;
    description: string;
    icon: string;
}

interface FAQ {
    q: string;
    a: string;
}

interface AboutProps {
    pillars: Pillar[];
    faqs: FAQ[];
}

export default function About({ pillars, faqs }: AboutProps) {
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
            <Head title="Tentang Atelier &amp; Konsultasi • Aroma Palace" />

            {/* HERO SECTION */}
            <section className="py-14 sm:py-20 border-b border-border bg-muted/30">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-4">
                    <Badge variant="secondary" className="mx-auto w-fit">
                        Filosofi Kami
                    </Badge>
                    <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground max-w-3xl mx-auto leading-tight">
                        Seni Meracik Wewangian Abadi dari Bahan Alami Terbaik
                    </h1>
                    <p className="max-w-2xl mx-auto text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        Lahir dari dedikasi mendalam untuk menghidupkan kembali keagungan ekstraits oriental klasik dan ekstrak botani Grasse berkualitas murni dengan waktu maserasi sempurna.
                    </p>
                </div>
            </section>

            {/* PILLARS */}
            <section className="py-12 sm:py-16 border-b border-border">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
                    <div className="text-center max-w-xl mx-auto space-y-2">
                        <Badge variant="outline">Standar Kualitas</Badge>
                        <h2 className="text-2xl sm:text-3xl tracking-tight text-foreground">
                            <span className="font-normal">Empat Pilar</span>{' '}
                            <span className="font-bold">Aroma Palace</span>
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {pillars.map((pillar, idx) => (
                            <Card key={pillar.title} className="p-6 space-y-3 shadow-none rounded-lg">
                                <Badge variant="secondary" className="font-mono text-xs w-fit">
                                    0{idx + 1}
                                </Badge>
                                <h3 className="text-base font-bold text-foreground">
                                    {pillar.title}
                                </h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    {pillar.description}
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
                                    <Badge variant="secondary" className="w-fit">Layanan Eksklusif</Badge>
                                    <CardTitle className="text-xl font-bold">Konsultasi Parfum Privat</CardTitle>
                                    <CardDescription className="text-xs">
                                        Diskusikan karakter wewangian yang cocok untuk kepribadian Anda bersama konsultan parfum kami.
                                    </CardDescription>
                                </CardHeader>

                                {wasSuccessful && (
                                    <div className="mb-4 rounded-lg bg-muted p-3 text-xs text-foreground font-medium border border-border">
                                        ✓ Permintaan konsultasi berhasil dikirim. Tim kami akan menghubungi Anda dalam 24 jam.
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-foreground">Nama Lengkap</label>
                                        <Input
                                            type="text"
                                            required
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            placeholder="Contoh: Budi Pratama"
                                            className="text-xs h-9"
                                        />
                                        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-foreground">Alamat Email</label>
                                        <Input
                                            type="email"
                                            required
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            placeholder="email@domain.com"
                                            className="text-xs h-9"
                                        />
                                        {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-foreground">Karakter Aroma yang Disukai</label>
                                        <select
                                            value={data.scent_family}
                                            onChange={(e) => setData('scent_family', e.target.value)}
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                                        >
                                            <option value="Oriental Woody">Oriental Woody (Oud, Amber, Sandalwood)</option>
                                            <option value="Velvet Floral">Velvet Floral (Taif Rose, Iris, Jasmine)</option>
                                            <option value="Clean Woody">Clean Woody (Cedar, Vetiver, Musk)</option>
                                            <option value="Fresh Citrus">Fresh Citrus (Neroli, Bergamot, Lemon)</option>
                                            <option value="Smoky Leather">Smoky Leather (Tobacco, Birch Tar, Incense)</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-foreground">Catatan / Momen Penggunaan</label>
                                        <Textarea
                                            rows={3}
                                            value={data.notes}
                                            onChange={(e) => setData('notes', e.target.value)}
                                            placeholder="Ceritakan suasana atau kesan aroma yang Anda dambakan..."
                                            className="text-xs resize-none"
                                        />
                                        {errors.notes && <p className="text-xs text-destructive">{errors.notes}</p>}
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full text-xs h-10 mt-2"
                                    >
                                        {processing ? 'Mengirim...' : 'Kirim Permintaan Konsultasi'}
                                    </Button>
                                </form>
                            </Card>
                        </div>

                        {/* FAQs Accordion */}
                        <div className="lg:col-span-6 flex flex-col justify-center space-y-4">
                            <div className="space-y-1">
                                <Badge variant="outline">Pertanyaan Umum</Badge>
                                <h2 className="text-2xl tracking-tight text-foreground">
                                    <span className="font-normal">Tanya Jawab</span>{' '}
                                    <span className="font-bold">Terpopuler</span>
                                </h2>
                            </div>

                            <Accordion type="single" collapsible defaultValue="faq-0" className="space-y-3">
                                {faqs.map((faq, index) => (
                                    <AccordionItem
                                        key={faq.q}
                                        value={`faq-${index}`}
                                        className="rounded-lg border border-border px-4"
                                    >
                                        <AccordionTrigger className="text-left text-xs sm:text-sm font-medium py-3.5 hover:no-underline">
                                            {faq.q}
                                        </AccordionTrigger>
                                        <AccordionContent className="text-xs text-muted-foreground leading-relaxed pb-3.5">
                                            {faq.a}
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
