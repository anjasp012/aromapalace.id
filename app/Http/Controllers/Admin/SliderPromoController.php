<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SliderPromo;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class SliderPromoController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->value();

        $slidersQuery = SliderPromo::query()
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                        ->orWhere('title_en', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhere('description_en', 'like', "%{$search}%")
                        ->orWhere('link', 'like', "%{$search}%");
                });
            })
            ->latest('id');

        $sliderPromos = $slidersQuery->paginate(15)->withQueryString();

        $metrics = [
            'total_sliders' => SliderPromo::count(),
        ];

        return Inertia::render('admin/slider-promos/index', [
            'sliderPromos' => $sliderPromos,
            'filters' => [
                'search' => $search,
            ],
            'metrics' => $metrics,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/slider-promos/create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'title_en' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'description_en' => ['nullable', 'string', 'max:1000'],
            'link' => ['nullable', 'string', 'max:255'],
            'thumbnail' => ['nullable'],
        ]);

        $thumbnail = null;
        if ($request->hasFile('thumbnail')) {
            $file = $request->file('thumbnail');
            if ($file instanceof UploadedFile && $file->isValid()) {
                $path = $file->store('slider-promos', 'public');
                $thumbnail = Storage::url($path);
            }
        } elseif (! empty($validated['thumbnail']) && is_string($validated['thumbnail'])) {
            $thumbnail = trim($validated['thumbnail']);
        }

        if (empty($thumbnail)) {
            return back()->withErrors(['thumbnail' => 'Banner / thumbnail gambar wajib diunggah atau cantumkan URL gambar.'])->withInput();
        }

        $validated['thumbnail'] = $thumbnail;
        $validated['link'] = ! empty($validated['link']) ? trim($validated['link']) : '/products';

        $slider = SliderPromo::create($validated);

        return redirect()->route('admin.slider-promos.index')
            ->with('success', "Slider promo '{$slider->title}' berhasil ditambahkan.");
    }

    public function edit(SliderPromo $sliderPromo): Response
    {
        return Inertia::render('admin/slider-promos/edit', [
            'sliderPromo' => $sliderPromo,
        ]);
    }

    public function update(Request $request, SliderPromo $sliderPromo): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'title_en' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'description_en' => ['nullable', 'string', 'max:1000'],
            'link' => ['nullable', 'string', 'max:255'],
            'thumbnail' => ['nullable'],
        ]);

        $thumbnail = $sliderPromo->thumbnail;
        if ($request->hasFile('thumbnail')) {
            $file = $request->file('thumbnail');
            if ($file instanceof UploadedFile && $file->isValid()) {
                $path = $file->store('slider-promos', 'public');
                $thumbnail = Storage::url($path);
            }
        } elseif ($request->filled('thumbnail') && is_string($validated['thumbnail'])) {
            $thumbnail = trim($validated['thumbnail']);
        }

        $validated['thumbnail'] = $thumbnail;
        $validated['link'] = ! empty($validated['link']) ? trim($validated['link']) : '/products';

        $sliderPromo->update($validated);

        return redirect()->route('admin.slider-promos.index')
            ->with('success', "Slider promo '{$sliderPromo->title}' berhasil diperbarui.");
    }

    public function destroy(SliderPromo $sliderPromo): RedirectResponse
    {
        $title = $sliderPromo->title;

        if (! empty($sliderPromo->thumbnail) && str_contains($sliderPromo->thumbnail, '/storage/slider-promos/')) {
            $storagePath = str_replace('/storage/', '', $sliderPromo->thumbnail);
            Storage::disk('public')->delete($storagePath);
        }

        $sliderPromo->delete();

        return redirect()->route('admin.slider-promos.index')
            ->with('success', "Slider promo '{$title}' berhasil dihapus.");
    }
}
