<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PageController extends Controller
{
    /**
     * Display the Privacy Policy page.
     * Required for Apple App Store and Google Play Store compliance.
     */
    public function privacyPolicy(): Response
    {
        return Inertia::render('privacy-policy', [
            'last_updated' => '2026-04-01',
            'support_email' => 'privacy@aromapalace.id',
            'dpo_contact' => '+62 812-3456-7890',
        ]);
    }

    /**
     * Display the Customer Support and Marketing page.
     * Serves as official Support / Marketing URL for App Store & Play Store.
     */
    public function support(): Response
    {
        $faqs = [
            [
                'category' => 'orders',
                'q' => 'Bagaimana cara melacak pengiriman pesanan wewangian saya?',
                'q_en' => 'How can I track the shipment of my fragrance order?',
                'a' => 'Setelah pesanan diproses, nomor resi kurir (JNE / SiCepat / Anteraja / Kurir Butik) akan langsung tertera di menu Transaksi Akun Anda dan dikirimkan melalui notifikasi aplikasi serta email.',
                'a_en' => 'Once your order is dispatched, the courier tracking code will be immediately available in your Account Transactions menu and notified via in-app push and email.',
            ],
            [
                'category' => 'authenticity',
                'q' => 'Apakah seluruh parfum Aroma Palace dijamin 100% orisinal?',
                'q_en' => 'Are all Aroma Palace perfumes guaranteed 100% authentic?',
                'a' => 'Seluruh flacon parfum kami didatangkan langsung dari rumah wewangian ternama di Dubai dan Prancis dengan batch code resmi terdaftar. Kami memberikan garansi pengembalian dana 100% jika terbukti tidak orisinal.',
                'a_en' => 'All our flacons are directly sourced from distinguished perfumery houses in Dubai and France with official traceable batch codes. We provide an unconditional 100% refund guarantee if proven non-authentic.',
            ],
            [
                'category' => 'consultation',
                'q' => 'Bagaimana cara menjadwalkan konsultasi aroma privat di butik?',
                'q_en' => 'How do I book a bespoke private fragrance consultation?',
                'a' => 'Anda dapat memesan sesi olfaktori personal melalui form Konsultasi Aroma di halaman Tentang Kami atau menghubungi WhatsApp VIP Concierge kami untuk reservasi langsung di butik terdekat.',
                'a_en' => 'You can book a personal olfactory session via the Fragrance Consultation form on our About Atelier page or contact our WhatsApp VIP Concierge for priority boutique booking.',
            ],
            [
                'category' => 'account',
                'q' => 'Bagaimana cara mengajukan penghapusan akun dan data pribadi saya?',
                'q_en' => 'How do I request deletion of my account and personal data?',
                'a' => 'Sesuai komitmen privasi dan kepatuhan standar App Store, Anda dapat menghapus akun secara mandiri melalui menu Akun > Pengaturan Profil > Hapus Akun, atau mengirimkan email ke privacy@aromapalace.id.',
                'a_en' => 'In accordance with our privacy commitment and App Store compliance, you can delete your account directly inside Account > Profile Settings > Delete Account, or by emailing privacy@aromapalace.id.',
            ],
            [
                'category' => 'returns',
                'q' => 'Bagaimana kebijakan retur jika botol parfum rusak saat pengiriman?',
                'q_en' => 'What is the return policy if a perfume flacon arrives damaged?',
                'a' => 'Jika botol tiba dalam kondisi pecah atau mengalami kebocoran saat pengiriman, mohon sertakan video unboxing resmi dalam kurun waktu 2x24 jam. Kami akan mengirimkan unit pengganti baru tanpa biaya tambahan.',
                'a_en' => 'If a flacon arrives damaged or leaking, please provide an official unboxing video within 48 hours of receipt. We will dispatch an immediate replacement unit at no extra charge.',
            ],
        ];

        return Inertia::render('support', [
            'faqs' => $faqs,
            'channels' => [
                'whatsapp' => '+62 812-3456-7890',
                'whatsapp_url' => 'https://wa.me/6281234567890?text=Halo%20VIP%20Concierge%20Aroma%20Palace%2C%20saya%20butuh%20bantuan.',
                'email' => 'concierge@aromapalace.id',
                'operating_hours' => 'Senin - Minggu: 08:00 - 22:00 WIB (VIP Concierge 24 Jam)',
                'operating_hours_en' => 'Monday - Sunday: 08:00 - 22:00 WIB (VIP Concierge 24/7)',
                'instagram' => 'https://instagram.com/aromapalace.id',
            ],
        ]);
    }

    /**
     * Handle support contact inquiry submission.
     */
    public function supportInquiry(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:150'],
            'phone' => ['nullable', 'string', 'max:25'],
            'subject' => ['required', 'string', 'max:150'],
            'message' => ['required', 'string', 'max:1000'],
        ]);

        return back()->with('success', "Terima kasih, {$validated['name']}! Pesan Anda telah diterima oleh tim Customer Concierge kami dan akan dibalas dalam 1x24 jam.");
    }
}
