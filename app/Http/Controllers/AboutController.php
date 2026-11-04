<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AboutController extends Controller
{
    /**
     * Display the About page outlining brand philosophy and consultation form.
     */
    public function index(): Response
    {
        $pillars = [
            [
                'title' => 'Keaslian Terjamin',
                'title_en' => 'Authenticity',
                'description' => 'Setiap wewangian adalah janji keaslian, dikurasi dengan cermat demi memastikan kualitas otentik dan rasa percaya diri dalam setiap pembelian.',
                'description_en' => 'Every fragrance is a promise of originality, sourced with care to ensure genuine quality and confidence in every purchase.',
                'icon' => 'gem',
            ],
            [
                'title' => 'Kurasi Keunggulan',
                'title_en' => 'Curated Excellence',
                'description' => 'Kurasi pilihan istimewa dari merek parfum Timur Tengah dan internasional ternama, dipilih dengan penuh pertimbangan untuk setiap selera dan momen.',
                'description_en' => 'An exceptional selection of renowned Middle Eastern and international perfume brands, thoughtfully chosen for every taste and occasion.',
                'icon' => 'crown',
            ],
            [
                'title' => 'Layanan Personal',
                'title_en' => 'Personalized Service',
                'description' => 'Pengalaman eksplorasi wewangian yang ramah dan menyenangkan, dipandu oleh layanan penuh perhatian untuk membantu setiap pelanggan menemukan aroma sempurna mereka.',
                'description_en' => 'A welcoming fragrance discovery experience, guided by attentive service to help every customer find their perfect scent.',
                'icon' => 'handshake',
            ],
            [
                'title' => 'Kemewahan Terjangkau',
                'title_en' => 'Accessible Luxury',
                'description' => 'Mendekatkan kekayaan dan kemewahan seni wewangian bermutu tinggi kepada para pecinta aroma di seluruh Indonesia.',
                'description_en' => 'Bringing the richness and sophistication of fine perfumery closer to fragrance lovers across Indonesia.',
                'icon' => 'sparkles',
            ],
        ];

        $faqs = [
            [
                'q' => 'Berapa lama ketahanan aroma Extrait de Parfum Aroma Palace di kulit?',
                'q_en' => 'How long does an Aroma Palace Extrait de Parfum last on skin?',
                'a' => 'Koleksi Extrait de Parfum kami mengandung konsentrasi minyak 28% hingga 35%, memberikan ketahanan 12 hingga 18 jam di kulit dan berhari-hari pada kain pakaian.',
                'a_en' => 'Our Extraits boast a 28% to 35% oil concentration, yielding 12 to 18 hours of continuous presence on skin and days on fine garments.',
            ],
            [
                'q' => 'Apakah saya bisa mencoba sample kit sebelum membeli botol penuh?',
                'q_en' => 'Can I request a sample kit before purchasing a full bottle?',
                'a' => 'Tentu. Discovery Coffret kami mencakup lima botol mini 3ml beserta voucher belanja yang dapat digunakan untuk potongan harga pembelian botol 50ml atau 100ml.',
                'a_en' => 'Yes. The Discovery Coffret includes five 3ml miniature sprays alongside a voucher reimbursable towards any full-sized 50ml or 100ml bottle.',
            ],
            [
                'q' => 'Dari mana asal bahan baku wewangian didatangkan?',
                'q_en' => 'Where are the raw ingredients sourced?',
                'a' => 'Mawar Taif dari Arab Saudi, minyak gaharu dari hutan lestari Kalimantan, mawar Centifolia dari Grasse Prancis, dan cendana murni dari Mysore India.',
                'a_en' => 'Taif roses from Saudi Arabia, agarwood from sustainable Kalimantan reserves, Centifolia roses from Grasse, and Mysore sandalwood from regulated plantations.',
            ],
        ];

        return Inertia::render('about', [
            'pillars' => $pillars,
            'faqs' => $faqs,
        ]);
    }

    /**
     * Handle the private fragrance consultation request.
     */
    public function consultation(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:150'],
            'scent_family' => ['required', 'string', 'max:50'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        return back()->with('success', "Thank you, {$validated['name']}! Your fragrance consultation appointment request has been scheduled with our Master Parfumeur.");
    }
}
