import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
    ShieldCheck,
    Lock,
    UserCheck,
    Database,
    Trash2,
    Eye,
    Bell,
    Mail,
    Phone,
    HelpCircle,
    ArrowRight,
    CheckCircle2,
    FileText,
    ExternalLink,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface PrivacyPolicyProps {
    last_updated?: string;
    support_email?: string;
    dpo_contact?: string;
}

export default function PrivacyPolicyPage({
    last_updated = '2026-04-01',
    support_email = 'privacy@aromapalace.id',
    dpo_contact = '+62 812-3456-7890',
}: PrivacyPolicyProps) {
    const { isEn } = useTranslation();
    const [activeSection, setActiveSection] = useState<string>('overview');

    const sections = [
        {
            id: 'collection',
            icon: <Database className="w-4 h-4 text-[#E5A844]" />,
            title: isEn ? '1. Information We Collect' : '1. Informasi yang Kami Kumpulkan',
            summary: isEn
                ? 'We collect information you provide directly, device telemetry, and transaction logs.'
                : 'Kami mengumpulkan data identitas akun, informasi transaksi, dan telemetri perangkat.',
            content: isEn ? (
                <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
                    <p>
                        When you interact with the Aroma Palace application and online atelier, we may collect the following categories of information:
                    </p>
                    <ul className="list-disc pl-5 space-y-1.5">
                        <li>
                            <strong className="text-foreground">Personal Identification:</strong> Full name, email address, WhatsApp/mobile telephone number, and delivery street addresses.
                        </li>
                        <li>
                            <strong className="text-foreground">Account Credentials:</strong> Hashed passwords, Royale Club membership tier status, collected reward points, and consultation preferences.
                        </li>
                        <li>
                            <strong className="text-foreground">Payment &amp; Transaction Details:</strong> Order items, invoice numbers, chosen payment channel (QRIS, Virtual Account, or Bank Transfer). We do not store raw card credentials; all financial processing is secured via certified national gateways (Pakasir / Bank switches).
                        </li>
                        <li>
                            <strong className="text-foreground">Technical &amp; Push Data:</strong> Device model, operating system (iOS/Android), IP address, language settings, and Firebase Cloud Messaging (FCM) device push tokens to deliver real-time order status updates.
                        </li>
                    </ul>
                </div>
            ) : (
                <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
                    <p>
                        Saat Anda menggunakan aplikasi Aroma Palace dan berbelanja di butik online kami, kami mengumpulkan kategori data berikut:
                    </p>
                    <ul className="list-disc pl-5 space-y-1.5">
                        <li>
                            <strong className="text-foreground">Identitas Pribadi:</strong> Nama lengkap, alamat surel (email), nomor telepon/WhatsApp, dan alamat fisik pengiriman pesanan.
                        </li>
                        <li>
                            <strong className="text-foreground">Data Akun &amp; Keanggotaan:</strong> Kata sandi terenkripsi (hash), tier keanggotaan Royale Club, saldo poin wewangian, dan riwayat konsultasi olfaktori.
                        </li>
                        <li>
                            <strong className="text-foreground">Transaksi &amp; Pembayaran:</strong> Rincian produk pesanan, nomor faktur, dan metode pembayaran yang dipilih (QRIS, VA Bank). Kami tidak pernah menyimpan nomor kartu kredit/debit secara langsung; pembayaran diproses melalui gerbang pembayaran terlisensi Bank Indonesia (Pakasir).
                        </li>
                        <li>
                            <strong className="text-foreground">Informasi Perangkat &amp; Token Notifikasi:</strong> Model perangkat, versi sistem operasi (iOS/Android), alamat IP, preferensi bahasa, serta token Firebase Cloud Messaging (FCM) untuk pengiriman notifikasi status pesanan secara langsung.
                        </li>
                    </ul>
                </div>
            ),
        },
        {
            id: 'usage',
            icon: <Eye className="w-4 h-4 text-[#E5A844]" />,
            title: isEn ? '2. How We Use Your Data' : '2. Penggunaan Informasi Pribadi',
            summary: isEn
                ? 'Your data is strictly utilized to process orders, enhance recommendations, and safeguard accounts.'
                : 'Data Anda digunakan untuk memproses pesanan, meningkatkan kenyamanan belanja, dan keamanan akun.',
            content: isEn ? (
                <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
                    <p>We process your personal information exclusively for lawful purposes:</p>
                    <ul className="list-disc pl-5 space-y-1.5">
                        <li>Fulfilling, packaging, and dispatching your perfume orders to your specified destination.</li>
                        <li>Delivering automated transactional alerts, delivery milestones, and order tracking notifications.</li>
                        <li>Administering the Royale Club loyalty program, computing reward point balances, and validating vouchers.</li>
                        <li>Personalizing scent recommendations based on past purchases and olfactory accords.</li>
                        <li>Detecting, preventing, and mitigating fraudulent transactions or suspicious account takeovers.</li>
                    </ul>
                </div>
            ) : (
                <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
                    <p>Kami memanfaatkan informasi pribadi Anda untuk tujuan berikut:</p>
                    <ul className="list-disc pl-5 space-y-1.5">
                        <li>Memproses, mengemas dengan proteksi khusus, dan mengirimkan pesanan parfum ke alamat tujuan Anda.</li>
                        <li>Mengirimkan pembaruan status transaksi, konfirmasi pembayaran, serta nomor resi pelacakan pengiriman.</li>
                        <li>Mengelola sistem loyalitas Royale Club, akumulasi poin belanja, serta penerapan kupon diskon eksklusif.</li>
                        <li>Memberikan rekomendasi notes aroma wewangian yang disesuaikan dengan preferensi Anda.</li>
                        <li>Mendeteksi, mencegah, dan menanggulangi tindak penipuan atau penyalahgunaan akun.</li>
                    </ul>
                </div>
            ),
        },
        {
            id: 'security',
            icon: <Lock className="w-4 h-4 text-[#E5A844]" />,
            title: isEn ? '3. Data Protection & Security' : '3. Perlindungan & Keamanan Data',
            summary: isEn
                ? 'Bank-grade SSL 256-bit encryption protects all communications and sensitive records.'
                : 'Enkripsi SSL 256-bit standar perbankan melindungi seluruh transmisi dan catatan sensitif Anda.',
            content: isEn ? (
                <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
                    <p>
                        We enforce rigorous administrative, technical, and physical safeguards to defend your confidential data against unauthorized access, loss, or alteration:
                    </p>
                    <ul className="list-disc pl-5 space-y-1.5">
                        <li>All communications are encrypted in transit via industry-standard TLS / SSL 256-bit protocols.</li>
                        <li>Database entries for passwords and sensitive credentials are safeguarded with one-way bcrypt cryptographic hashes.</li>
                        <li>Access to customer records is strictly limited to authorized personnel under strict non-disclosure agreements.</li>
                        <li>Regular vulnerability assessments and automated penetration tests are carried out on our cloud infrastructure.</li>
                    </ul>
                </div>
            ) : (
                <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
                    <p>
                        Kami menerapkan standar teknis dan manajerial ketat guna melindungi kerahasiaan informasi Anda:
                    </p>
                    <ul className="list-disc pl-5 space-y-1.5">
                        <li>Seluruh transmisi data dienkripsi menggunakan protokol aman TLS/SSL 256-bit bersertifikat.</li>
                        <li>Kata sandi akun dilindungi dengan algoritma hashing satu arah (bcrypt) yang tidak dapat dibaca oleh staf internal sekalipun.</li>
                        <li>Akses terhadap basis data pelanggan dibatasi secara ketat hanya untuk personel concierge resmi yang terikat perjanjian kerahasiaan.</li>
                        <li>Audit berkala dan pembaruan patch keamanan sistem dilakukan secara berkesinambungan.</li>
                    </ul>
                </div>
            ),
        },
        {
            id: 'sharing',
            icon: <UserCheck className="w-4 h-4 text-[#E5A844]" />,
            title: isEn ? '4. Third-Party Disclosures' : '4. Pembagian Data kepada Pihak Ketiga',
            summary: isEn
                ? 'We never sell your data. We share only with vetted fulfillment and payment partners.'
                : 'Kami tidak pernah menjual data Anda. Data hanya dibagikan ke mitra logistik dan pembayaran resmi.',
            content: isEn ? (
                <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
                    <p>
                        Aroma Palace does <strong className="text-foreground">not sell, rent, or monetize</strong> your personal data. Disclosures are limited solely to:
                    </p>
                    <ul className="list-disc pl-5 space-y-1.5">
                        <li>
                            <strong className="text-foreground">Logistics &amp; Couriers:</strong> Delivery couriers (JNE, SiCepat, Anteraja, and Boutique private couriers) receive only your recipient name, destination address, and phone number necessary for package handover.
                        </li>
                        <li>
                            <strong className="text-foreground">Payment Gateways:</strong> Pakasir, bank payment gateways, and QRIS processors for settlement verification.
                        </li>
                        <li>
                            <strong className="text-foreground">Push Infrastructure:</strong> Google Firebase Cloud Messaging for delivering real-time notification tokens.
                        </li>
                        <li>
                            <strong className="text-foreground">Legal Compliance:</strong> When strictly mandated by Indonesian statutory law or competent judicial authorities.
                        </li>
                    </ul>
                </div>
            ) : (
                <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
                    <p>
                        Aroma Palace <strong className="text-foreground">tidak pernah menjual atau memperjualbelikan</strong> data Anda kepada pihak periklanan manapun. Pembagian data terbatas hanya kepada:
                    </p>
                    <ul className="list-disc pl-5 space-y-1.5">
                        <li>
                            <strong className="text-foreground">Mitra Logistik &amp; Kurir:</strong> Layanan ekspedisi (JNE, SiCepat, Anteraja, dan Kurir Privat Butik) hanya menerima nama, alamat pengantaran, dan nomor telepon penerima yang esensial demi kelancaran serah terima paket.
                        </li>
                        <li>
                            <strong className="text-foreground">Mitra Pembayaran Resmi:</strong> Gateway Pakasir dan penyelenggara QRIS terdaftar Bank Indonesia untuk verifikasi pelunasan tagihan.
                        </li>
                        <li>
                            <strong className="text-foreground">Infrastruktur Notifikasi:</strong> Google Firebase Cloud Messaging untuk menyalurkan sinyal notifikasi ke ponsel Anda.
                        </li>
                        <li>
                            <strong className="text-foreground">Kewajiban Hukum:</strong> Apabila secara sah diwajibkan oleh peraturan perundang-undangan Republik Indonesia.
                        </li>
                    </ul>
                </div>
            ),
        },
        {
            id: 'deletion',
            icon: <Trash2 className="w-4 h-4 text-destructive" />,
            title: isEn ? '5. Your Rights & Account Deletion' : '5. Hak Pengguna & Prosedur Hapus Akun',
            summary: isEn
                ? 'In accordance with Apple App Store guidelines, you hold full autonomy to delete your account & data.'
                : 'Sesuai kepatuhan Apple App Store, Anda memiliki hak penuh untuk menghapus akun dan data pribadi kapan saja.',
            content: isEn ? (
                <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
                    <p>
                        We respect your right to privacy and self-determination over your personal records:
                    </p>
                    <ul className="list-disc pl-5 space-y-1.5">
                        <li>
                            <strong className="text-foreground">Instant Self-Service Account Deletion:</strong> You can delete your account directly inside the app at any time. Simply navigate to{' '}
                            <Link href="/account" className="text-[#4A070B] dark:text-[#E8D0BA] underline font-semibold">
                                Account &gt; Profile &gt; Delete Account
                            </Link>
                            . Confirming deletion immediately wipes your profile, wishlist, address records, and push tokens.
                        </li>
                        <li>
                            <strong className="text-foreground">Data Export &amp; Rectification:</strong> You may request a machine-readable archive of your order records or update outdated details via your account portal or by emailing our Data Protection Officer.
                        </li>
                        <li>
                            <strong className="text-foreground">Assisted Deletion via Email:</strong> Alternatively, you can email{' '}
                            <a href={`mailto:${support_email}`} className="text-[#4A070B] dark:text-[#E8D0BA] underline font-semibold">
                                {support_email}
                            </a>{' '}
                            with subject <em>&ldquo;Account Deletion Request&rdquo;</em> from your registered email. Our compliance team will process the erasure within 48 business hours.
                        </li>
                    </ul>
                </div>
            ) : (
                <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
                    <p>
                        Kami menghormati kedaulatan Anda atas kepemilikan data pribadi:
                    </p>
                    <ul className="list-disc pl-5 space-y-1.5">
                        <li>
                            <strong className="text-foreground">Penghapusan Akun Mandiri (Self-Service):</strong> Sesuai panduan resmi Apple App Store (Guideline 5.1.1 v), Anda dapat menghapus akun beserta seluruh data riwayatnya langsung di dalam aplikasi melalui menu{' '}
                            <Link href="/account" className="text-[#4A070B] dark:text-[#E8D0BA] underline font-semibold">
                                Akun &gt; Pengaturan &gt; Hapus Akun
                            </Link>
                            . Konfirmasi penghapusan akan segera menghapus data profil, wishlist, alamat, dan token notifikasi Anda secara permanen.
                        </li>
                        <li>
                            <strong className="text-foreground">Koreksi &amp; Hak Akses:</strong> Anda berhak meninjau, mengubah, atau memperbarui informasi akun kapan saja melalui dasbor profil.
                        </li>
                        <li>
                            <strong className="text-foreground">Bantuan Penghapusan Melalui Email:</strong> Anda juga dapat mengirimkan permohonan melalui email ke{' '}
                            <a href={`mailto:${support_email}`} className="text-[#4A070B] dark:text-[#E8D0BA] underline font-semibold">
                                {support_email}
                            </a>{' '}
                            dengan judul <em>&ldquo;Permohonan Penghapusan Akun&rdquo;</em> menggunakan alamat email yang terdaftar. Tim kami akan menyelesaikannya dalam waktu maksimal 2 hari kerja.
                        </li>
                    </ul>
                </div>
            ),
        },
        {
            id: 'children',
            icon: <ShieldCheck className="w-4 h-4 text-[#E5A844]" />,
            title: isEn ? "6. Children's Privacy" : '6. Perlindungan Privasi Anak',
            summary: isEn
                ? 'Our services are directed to customers aged 17 and above.'
                : 'Layanan kami ditujukan bagi pengguna yang telah berusia 17 tahun ke atas.',
            content: isEn ? (
                <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
                    <p>
                        Aroma Palace does not knowingly collect, solicit, or maintain personal information from individuals under the age of 17 without verifiable parental or guardian consent. If we discover that a minor under 17 has provided us with personal information without parental authorization, we will promptly purge such data from our databases.
                    </p>
                </div>
            ) : (
                <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
                    <p>
                        Layanan butik dan aplikasi Aroma Palace ditujukan untuk pelanggan yang telah berusia minimal 17 tahun atau yang telah didampingi oleh orang tua/wali sah. Kami tidak secara sengaja mengumpulkan data anak di bawah umur. Apabila kami mengetahui adanya data anak di bawah 17 tahun yang tersimpan tanpa persetujuan wali, kami akan segera menghapus data tersebut dari sistem kami.
                    </p>
                </div>
            ),
        },
        {
            id: 'contact',
            icon: <Mail className="w-4 h-4 text-[#E5A844]" />,
            title: isEn ? '7. Data Protection Officer (DPO) Contact' : '7. Kontak Petugas Perlindungan Data',
            summary: isEn
                ? 'Reach out to our dedicated privacy concierge for any inquiry.'
                : 'Hubungi petugas privasi kami untuk setiap pertanyaan atau penegakan hak data Anda.',
            content: (
                <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
                    <p>
                        {isEn
                            ? 'If you have questions, inquiries, or complaints regarding this Privacy Policy or your data protection rights, please contact our Data Protection Officer:'
                            : 'Apabila Anda memiliki pertanyaan, klarifikasi, atau keluhan seputar Kebijakan Privasi ini atau hak data Anda, silakan hubungi tim kami:'}
                    </p>
                    <div className="p-4 rounded-xl border border-border/80 bg-muted/30 space-y-2">
                        <div className="flex items-center gap-2 text-foreground font-semibold">
                            <ShieldCheck className="w-4 h-4 text-[#E5A844]" />
                            <span>Aroma Palace Legal &amp; Data Protection Office</span>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                            <div><strong>Email:</strong> <a href={`mailto:${support_email}`} className="text-[#4A070B] dark:text-[#E8D0BA] underline">{support_email}</a></div>
                            <div><strong>WhatsApp Concierge:</strong> <a href={`https://wa.me/${dpo_contact.replace(/[^0-9]/g, '')}`} className="text-[#4A070B] dark:text-[#E8D0BA] underline">{dpo_contact}</a></div>
                            <div><strong>Address:</strong> Menara Aroma Lt. 18, Kawasan Mega Kuningan, Jakarta Selatan 12950, Indonesia</div>
                        </div>
                    </div>
                </div>
            ),
        },
    ];

    return (
        <Layout>
            <Head title={isEn ? 'Privacy Policy • Aroma Palace' : 'Kebijakan Privasi • Aroma Palace'} />

            {/* HERO HEADER */}
            <div className="border-b border-border/70 bg-gradient-to-b from-[#4A070B]/5 via-background to-background py-10 sm:py-16">
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#4A070B]/10 dark:bg-[#E8D0BA]/15 text-[#4A070B] dark:text-[#E8D0BA] border border-[#4A070B]/20">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#E5A844]" />
                        <span>{isEn ? 'Official Privacy Commitment' : 'Komitmen Privasi Resmi'}</span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
                        {isEn ? 'Privacy Policy' : 'Kebijakan Privasi'}
                    </h1>

                    <p className="max-w-2xl mx-auto text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {isEn
                            ? 'Your trust is our foremost fragrance. Learn how Aroma Palace safeguards, processes, and respects your personal identity across our mobile apps and digital atelier.'
                            : 'Kepercayaan Anda adalah wewangian paling berharga bagi kami. Pelajari bagaimana Aroma Palace menjaga, memproses, dan menghormati data pribadi Anda di seluruh platform aplikasi mobile dan atelier digital kami.'}
                    </p>

                    <div className="pt-2 flex items-center justify-center gap-4 text-xs text-muted-foreground">
                        <span>{isEn ? 'Effective Date:' : 'Terakhir Diperbarui:'} <strong className="text-foreground">{last_updated}</strong></span>
                        <span>•</span>
                        <span>{isEn ? 'Standard:' : 'Kepatuhan:'} <strong className="text-foreground">App Store &amp; GDPR / UU PDP</strong></span>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                {/* QUICK ACCOUNT DELETION BANNER (Apple Guideline 5.1.1 v compliant) */}
                <div className="mb-8 p-4 sm:p-5 rounded-2xl border border-destructive/30 bg-destructive/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start sm:items-center gap-3.5">
                        <div className="w-10 h-10 rounded-full bg-destructive/15 text-destructive flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                            <Trash2 className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-foreground">
                                {isEn ? 'Looking to delete your account or personal data?' : 'Ingin menghapus akun atau data pribadi Anda?'}
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                {isEn
                                    ? 'You have complete control to permanently erase your profile and records directly inside the app.'
                                    : 'Anda memiliki kendali penuh untuk menghapus profil dan riwayat akun secara permanen langsung di dalam aplikasi.'}
                            </p>
                        </div>
                    </div>
                    <Link href="/account" className="shrink-0">
                        <Button variant="destructive" size="sm" className="text-xs font-semibold h-9 px-4">
                            <span>{isEn ? 'Manage / Delete Account' : 'Kelola / Hapus Akun'}</span>
                            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                        </Button>
                    </Link>
                </div>

                {/* POLICY SECTIONS */}
                <div className="space-y-6">
                    {sections.map((section) => (
                        <Card key={section.id} id={section.id} className="border border-border/80 shadow-none overflow-hidden">
                            <div className="p-5 sm:p-6 space-y-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                        {section.icon}
                                    </div>
                                    <h2 className="text-base sm:text-lg font-bold text-foreground">
                                        {section.title}
                                    </h2>
                                </div>
                                <p className="text-xs font-medium text-muted-foreground border-b border-border/60 pb-3">
                                    {section.summary}
                                </p>
                                <div className="pt-1">
                                    {section.content}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* FOOTER CALLOUT */}
                <div className="mt-10 p-6 rounded-2xl border border-border/80 bg-muted/20 text-center space-y-3">
                    <h3 className="text-sm font-bold text-foreground">
                        {isEn ? 'Need further clarification?' : 'Butuh penjelasan lebih lanjut?'}
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-lg mx-auto">
                        {isEn
                            ? 'Our dedicated Customer Concierge and Data Protection Officers are at your service 24/7.'
                            : 'Tim Customer Concierge dan Petugas Perlindungan Data kami siap melayani Anda.'}
                    </p>
                    <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
                        <Link href="/support">
                            <Button variant="outline" size="sm" className="text-xs font-semibold h-9 px-4">
                                {isEn ? 'Customer Support Hub' : 'Pusat Bantuan & Dukungan'}
                            </Button>
                        </Link>
                        <a
                            href={`https://wa.me/${dpo_contact.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Button size="sm" className="bg-[#4A070B] hover:bg-[#360407] text-white text-xs font-semibold h-9 px-4">
                                <span>WhatsApp VIP Concierge</span>
                                <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                            </Button>
                        </a>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
