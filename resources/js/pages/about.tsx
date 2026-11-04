import { Head } from '@inertiajs/react';
import Layout from '@/components/Layout';
import { useTranslation } from '@/lib/i18n';
import { Gem, Crown, Handshake, Sparkles } from 'lucide-react';

interface AboutProps {
    pillars?: unknown;
    faqs?: unknown;
}

const PILLARS = [
    {
        title: 'Authenticity',
        title_id: 'Keaslian Terjamin',
        description: 'Every fragrance is a promise of originality, sourced with care to ensure genuine quality and confidence in every purchase.',
        description_id: 'Setiap wewangian adalah janji keaslian, dikurasi dengan cermat demi memastikan kualitas otentik dan rasa percaya diri dalam setiap pembelian.',
        icon: Gem,
    },
    {
        title: 'Curated Excellence',
        title_id: 'Kurasi Keunggulan',
        description: 'An exceptional selection of renowned Middle Eastern and international perfume brands, thoughtfully chosen for every taste and occasion.',
        description_id: 'Kurasi pilihan istimewa dari merek parfum Timur Tengah dan internasional ternama, dipilih dengan penuh pertimbangan untuk setiap selera dan momen.',
        icon: Crown,
    },
    {
        title: 'Personalized Service',
        title_id: 'Layanan Personal',
        description: 'A welcoming fragrance discovery experience, guided by attentive service to help every customer find their perfect scent.',
        description_id: 'Pengalaman eksplorasi wewangian yang ramah dan menyenangkan, dipandu oleh layanan penuh perhatian untuk membantu setiap pelanggan menemukan aroma sempurna mereka.',
        icon: Handshake,
    },
    {
        title: 'Accessible Luxury',
        title_id: 'Kemewahan Terjangkau',
        description: 'Bringing the richness and sophistication of fine perfumery closer to fragrance lovers across Indonesia.',
        description_id: 'Mendekatkan kekayaan dan kemewahan seni wewangian bermutu tinggi kepada para pecinta aroma di seluruh Indonesia.',
        icon: Sparkles,
    },
];

export default function About(_props: AboutProps) {
    const { isEn } = useTranslation();

    return (
        <Layout>
            <Head title={isEn ? 'Our Story • Aroma Palace' : 'Cerita Kami • Aroma Palace'} />

            {/* PAGE HEADER BANNER (Matches cart.tsx style) */}
            <div className="border-b border-border/70 bg-background py-10 sm:py-14">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-3">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl tracking-tight text-foreground">
                        <span className="font-light">{isEn ? 'OUR' : 'CERITA'}</span>{' '}
                        <span className="font-bold text-[#4A070B] dark:text-[#E8D0BA]">{isEn ? 'STORY' : 'KAMI'}</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {isEn ? 'a heritage of scent, a world of elegance' : 'warisan aroma, dunia keanggunan'}
                    </p>
                </div>
            </div>

            {/* BODY STORY CONTENT SECTION */}
            <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                <div className="space-y-6 sm:space-y-8 text-center text-sm sm:text-base text-muted-foreground leading-relaxed">
                    <p className="text-base sm:text-lg font-medium text-foreground leading-relaxed">
                        {isEn
                            ? 'Welcome to Aroma Palace, where the richness of Middle Eastern perfumery meets modern elegance.'
                            : 'Selamat datang di Aroma Palace, tempat kekayaan seni wewangian Timur Tengah berpadu dengan keanggunan modern.'}
                    </p>
                    <p>
                        {isEn
                            ? 'Inspired by the luxurious fragrance culture of the Middle East, Aroma Palace is a destination for those who appreciate the art of fine perfumery. We bring together an exceptional selection of fragrances from renowned international perfume houses, offering scents that celebrate individuality, sophistication, and timeless beauty.'
                            : 'Terinspirasi oleh budaya wewangian mewah khas Timur Tengah, Aroma Palace adalah destinasi bagi para pencinta seni wewangian bermutu tinggi. Kami menghadirkan kurasi pilihan wewangian istimewa dari rumah parfum internasional ternama, menawarkan aroma yang merayakan keunikan individu, kemewahan, dan keindahan abadi.'}
                    </p>
                    <p>
                        {isEn
                            ? 'We believe a fragrance is more than just a scent. It is an expression of personality, a reflection of style, and a memory waiting to be created.'
                            : 'Kami meyakini bahwa wewangian lebih dari sekadar aroma. Parfum adalah ekspresi kepribadian, cerminan gaya hidup, dan kenangan indah yang menanti untuk diciptakan.'}
                    </p>
                    <p>
                        {isEn
                            ? 'From the deep, captivating richness of oud and amber to fresh, floral, woody, and contemporary compositions, our carefully selected collection offers something for every mood, occasion, and personality.'
                            : 'Dari kekayaan mendalam dan memikat oud serta amber, hingga komposisi segar, floral, woody, dan kontemporer, koleksi kurasi pilihan kami menawarkan wewangian untuk setiap suasana hati, momen istimewa, dan kepribadian.'}
                    </p>
                    <p>
                        {isEn
                            ? "Whether you're discovering your signature scent, exploring something new, or searching for the perfect gift, Aroma Palace invites you to experience the pleasure of fragrance discovery."
                            : 'Baik saat Anda mencari signature scent sejati, menjelajahi aroma baru, maupun mencari hadiah yang sempurna, Aroma Palace mengundang Anda untuk merasakan kenikmatan petualangan wewangian ini.'}
                    </p>
                </div>
            </section>

            {/* FOUR PILLARS OF EXCELLENCE SECTION */}
            <section className="border-t border-border/70 bg-muted/15 py-12 sm:py-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
                    <div className="text-center space-y-3 max-w-2xl mx-auto">
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl tracking-tight text-foreground font-bold">
                            {isEn ? 'Our Four Pillars of Excellence' : 'Empat Pilar Keunggulan Kami'}
                        </h2>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                            {isEn
                                ? 'At Aroma Palace, our commitment to exceptional fragrances is built upon four principles that define who we are and the experience we deliver.'
                                : 'Di Aroma Palace, komitmen kami terhadap wewangian istimewa dibangun di atas empat prinsip utama yang mendefinisikan siapa kami dan pengalaman yang kami hadirkan.'}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 min-[380px]:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6">
                        {PILLARS.map((pillar) => (
                            <div
                                key={pillar.title}
                                className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 text-center flex flex-col items-center space-y-3 shadow-xs hover:border-[#4A070B]/40 dark:hover:border-[#E8D0BA]/40 transition-colors"
                            >
                                <div className="text-[#4A070B] dark:text-[#E8D0BA] mb-0.5">
                                    <pillar.icon className="w-7 h-7 sm:w-8 sm:h-8 stroke-[1.6]" />
                                </div>
                                <h3 className="text-sm sm:text-base lg:text-lg font-bold text-foreground tracking-tight">
                                    {isEn ? pillar.title : pillar.title_id}
                                </h3>
                                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                    {isEn ? pillar.description : pillar.description_id}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </Layout>
    );
}
