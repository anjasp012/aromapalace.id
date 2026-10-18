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
                'title' => 'Ethical Extraction',
                'description' => 'Wild-harvested botanical extractions and sustainably cultivated wood essences sourced straight from indigenous forest stewards.',
                'icon' => 'leaf',
            ],
            [
                'title' => 'Masterful Maceration',
                'description' => 'Every batch is allowed to macerate for a minimum of 180 days in temperature-controlled darkness to harmonize intricate accord layers.',
                'icon' => 'clock',
            ],
            [
                'title' => 'High Concentration',
                'description' => 'We reject diluted fragrances. All Aroma Palace formulas possess 20% to 35% pure aromatic concentrate for unparalleled sillage and longevity.',
                'icon' => 'sparkles',
            ],
            [
                'title' => 'Bespoke Atelier',
                'description' => 'Private olfactory consultations tailored to compose a one-of-a-kind scent signature echoing your memories and personal aura.',
                'icon' => 'fingerprint',
            ],
        ];

        $faqs = [
            [
                'q' => 'How long does an Aroma Palace Extrait de Parfum last on skin?',
                'a' => 'Our Extraits boast a 28% to 35% oil concentration, yielding 12 to 18 hours of continuous presence on skin and days on fine garments.',
            ],
            [
                'q' => 'Can I request a sample kit before purchasing a full produk?',
                'a' => 'Yes. The Discovery Coffret includes five 3ml miniature sprays alongside a voucher reimbursable towards any full-sized 50ml or 100ml bottle.',
            ],
            [
                'q' => 'Where are the raw ingredients sourced?',
                'a' => 'Taif roses from Saudi Arabia, agarwood from sustainable Kalimantan reserves, Centifolia roses from Grasse, and Mysore sandalwood from regulated plantations.',
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
