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
                'title' => 'Ekstraksi Berkelanjutan',
                'title_en' => 'Ethical Extraction',
                'description' => 'Ekstraksi botani panen liar dan esensi kayu dari budidaya berkelanjutan yang bersumber langsung dari perajin lokal berdedikasi.',
                'description_en' => 'Wild-harvested botanical extractions and sustainably cultivated wood essences sourced straight from indigenous forest stewards.',
                'icon' => 'leaf',
            ],
            [
                'title' => 'Maserasi Sempurna',
                'title_en' => 'Masterful Maceration',
                'description' => 'Setiap racikan dimaserasi minimal 180 hari dalam ruang gelap bersuhu terjaga guna menyatukan harmonisasi akord aroma tingkat tinggi.',
                'description_en' => 'Every batch is allowed to macerate for a minimum of 180 days in temperature-controlled darkness to harmonize intricate accord layers.',
                'icon' => 'clock',
            ],
            [
                'title' => 'Konsentrasi Ekstrak Tinggi',
                'title_en' => 'High Concentration',
                'description' => 'Kami menolak parfum yang diencerkan berlebihan. Seluruh formula Aroma Palace memiliki 20% hingga 35% konsentrat minyak wangi murni.',
                'description_en' => 'We reject diluted fragrances. All Aroma Palace formulas possess 20% to 35% pure aromatic concentrate for unparalleled sillage and longevity.',
                'icon' => 'sparkles',
            ],
            [
                'title' => 'Atelier Privat Eksklusif',
                'title_en' => 'Bespoke Atelier',
                'description' => 'Konsultasi olfaktori personal yang dirancang khusus untuk memandu Anda menemukan wewangian signature yang mencerminkan aura sejati Anda.',
                'description_en' => 'Private olfactory consultations tailored to compose a one-of-a-kind scent signature echoing your memories and personal aura.',
                'icon' => 'fingerprint',
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
