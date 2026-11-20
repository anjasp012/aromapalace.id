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
        $file = $request->file('thumbnail');
        if ($file instanceof UploadedFile && ! $file->isValid() && $file->getError() !== UPLOAD_ERR_NO_FILE) {
            $errorMsg = match ($file->getError()) {
                UPLOAD_ERR_INI_SIZE => 'Ukuran berkas terlalu besar (maksimal 10MB untuk foto, 50MB untuk video). Silakan pilih berkas yang lebih kecil atau lakukan kompresi terlebih dahulu.',
                UPLOAD_ERR_FORM_SIZE => 'Ukuran berkas melebihi batas maksimal yang diizinkan.',
                UPLOAD_ERR_PARTIAL => 'Berkas hanya terunggah sebagian. Silakan coba unggah kembali.',
                default => 'Gagal mengunggah berkas media. Silakan coba beberapa saat lagi.',
            };
            return back()->withErrors(['thumbnail' => $errorMsg])->withInput();
        }

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
            $mime = $file->getMimeType() ?? '';
            $ext = strtolower($file->getClientOriginalExtension());
            $isVideo = str_starts_with($mime, 'video/') || in_array($ext, ['mp4', 'webm', 'ogg', 'mov', 'm4v']);
            $maxKb = $isVideo ? 51200 : 10240;
            $maxLabel = $isVideo ? '50MB' : '10MB';
            $typeLabel = $isVideo ? 'video' : 'foto';

            $request->validate([
                'thumbnail' => [
                    'file',
                    'mimes:jpeg,png,jpg,webp,gif,svg,avif,mp4,webm,ogg,mov,m4v',
                    "max:{$maxKb}",
                ],
            ], [
                'thumbnail.file' => 'Banner media harus berupa berkas yang valid.',
                'thumbnail.mimes' => 'Format file harus berupa Foto/GIF (JPG, PNG, WEBP, GIF, SVG) atau Video (MP4, WebM, OGG, MOV).',
                'thumbnail.max' => "Ukuran berkas {$typeLabel} maksimal {$maxLabel}.",
            ]);

            if ($file instanceof UploadedFile && $file->isValid()) {
                $path = $file->store('slider-promos', 'public');
                $thumbnail = Storage::url($path);
            }
        } elseif (! empty($validated['thumbnail']) && is_string($validated['thumbnail'])) {
            $thumbnail = trim($validated['thumbnail']);
        }

        if (empty($thumbnail)) {
            return back()->withErrors(['thumbnail' => 'Banner media (gambar, animasi GIF, atau video) wajib diunggah.'])->withInput();
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
        $file = $request->file('thumbnail');
        if ($file instanceof UploadedFile && ! $file->isValid() && $file->getError() !== UPLOAD_ERR_NO_FILE) {
            $errorMsg = match ($file->getError()) {
                UPLOAD_ERR_INI_SIZE => 'Ukuran berkas terlalu besar (maksimal 10MB untuk foto, 50MB untuk video). Silakan pilih berkas yang lebih kecil atau lakukan kompresi terlebih dahulu.',
                UPLOAD_ERR_FORM_SIZE => 'Ukuran berkas melebihi batas maksimal yang diizinkan.',
                UPLOAD_ERR_PARTIAL => 'Berkas hanya terunggah sebagian. Silakan coba unggah kembali.',
                default => 'Gagal mengunggah berkas media. Silakan coba beberapa saat lagi.',
            };
            return back()->withErrors(['thumbnail' => $errorMsg])->withInput();
        }

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
            $mime = $file->getMimeType() ?? '';
            $ext = strtolower($file->getClientOriginalExtension());
            $isVideo = str_starts_with($mime, 'video/') || in_array($ext, ['mp4', 'webm', 'ogg', 'mov', 'm4v']);
            $maxKb = $isVideo ? 51200 : 10240;
            $maxLabel = $isVideo ? '50MB' : '10MB';
            $typeLabel = $isVideo ? 'video' : 'foto';

            $request->validate([
                'thumbnail' => [
                    'file',
                    'mimes:jpeg,png,jpg,webp,gif,svg,avif,mp4,webm,ogg,mov,m4v',
                    "max:{$maxKb}",
                ],
            ], [
                'thumbnail.file' => 'Banner media harus berupa berkas yang valid.',
                'thumbnail.mimes' => 'Format file harus berupa Foto/GIF (JPG, PNG, WEBP, GIF, SVG) atau Video (MP4, WebM, OGG, MOV).',
                'thumbnail.max' => "Ukuran berkas {$typeLabel} maksimal {$maxLabel}.",
            ]);

            if ($file instanceof UploadedFile && $file->isValid()) {
                if (! empty($sliderPromo->thumbnail) && str_contains($sliderPromo->thumbnail, '/storage/slider-promos/')) {
                    $storagePath = str_replace('/storage/', '', $sliderPromo->thumbnail);
                    Storage::disk('public')->delete($storagePath);
                }

                $path = $file->store('slider-promos', 'public');
                $thumbnail = Storage::url($path);
            }
        } elseif ($request->filled('thumbnail') && is_string($request->input('thumbnail'))) {
            $thumbnail = trim($request->input('thumbnail'));
        }

        if (empty($thumbnail)) {
            return back()->withErrors(['thumbnail' => 'Banner media (gambar, animasi GIF, atau video) wajib diunggah.'])->withInput();
        }

        $sliderPromo->update([
            'title' => $validated['title'],
            'title_en' => $validated['title_en'] ?? null,
            'description' => $validated['description'] ?? null,
            'description_en' => $validated['description_en'] ?? null,
            'link' => ! empty($validated['link']) ? trim($validated['link']) : '/products',
            'thumbnail' => $thumbnail,
        ]);

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
