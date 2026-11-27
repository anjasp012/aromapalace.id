<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Banner;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class BannerController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->value();

        $bannersQuery = Banner::query()
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                        ->orWhere('title_en', 'like', "%{$search}%")
                        ->orWhere('subtitle', 'like', "%{$search}%")
                        ->orWhere('subtitle_en', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhere('description_en', 'like', "%{$search}%")
                        ->orWhere('button_link', 'like', "%{$search}%");
                });
            })
            ->latest('id');

        $banners = $bannersQuery->paginate(15)->withQueryString();

        $metrics = [
            'total_banners' => Banner::count(),
            'active_banners' => Banner::where('is_active', true)->count(),
        ];

        return Inertia::render('admin/banners/index', [
            'banners' => $banners,
            'filters' => [
                'search' => $search,
            ],
            'metrics' => $metrics,
        ]);
    }

    public function create(): Response|RedirectResponse
    {
        $existing = Banner::first();
        if ($existing) {
            return redirect()->route('admin.banners.edit', $existing)
                ->with('info', 'Hanya diperbolehkan memiliki 1 banner promosi. Anda telah diarahkan ke halaman edit banner.');
        }

        return Inertia::render('admin/banners/create');
    }

    public function store(Request $request): RedirectResponse
    {
        if (Banner::count() >= 1) {
            return redirect()->route('admin.banners.index')
                ->with('error', 'Hanya diperbolehkan memiliki maksimal 1 banner promosi. Silakan edit banner yang sudah ada.');
        }

        $file = $request->file('image');
        if ($file instanceof UploadedFile && ! $file->isValid() && $file->getError() !== UPLOAD_ERR_NO_FILE) {
            $errorMsg = match ($file->getError()) {
                UPLOAD_ERR_INI_SIZE => 'Ukuran berkas terlalu besar (maksimal 10MB untuk foto, 50MB untuk video). Silakan pilih berkas yang lebih kecil atau lakukan kompresi terlebih dahulu.',
                UPLOAD_ERR_FORM_SIZE => 'Ukuran berkas melebihi batas maksimal yang diizinkan.',
                UPLOAD_ERR_PARTIAL => 'Berkas hanya terunggah sebagian. Silakan coba unggah kembali.',
                default => 'Gagal mengunggah berkas media. Silakan coba beberapa saat lagi.',
            };

            return back()->withErrors(['image' => $errorMsg])->withInput();
        }

        $validated = $request->validate([
            'subtitle' => ['nullable', 'string', 'max:255'],
            'subtitle_en' => ['nullable', 'string', 'max:255'],
            'title' => ['required', 'string', 'max:255'],
            'title_en' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'description_en' => ['nullable', 'string', 'max:1000'],
            'image' => ['nullable'],
            'button_text' => ['nullable', 'string', 'max:100'],
            'button_text_en' => ['nullable', 'string', 'max:100'],
            'button_link' => ['nullable', 'string', 'max:255'],
            'secondary_button_text' => ['nullable', 'string', 'max:100'],
            'secondary_button_text_en' => ['nullable', 'string', 'max:100'],
            'secondary_button_link' => ['nullable', 'string', 'max:255'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $image = null;
        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $mime = $file->getMimeType() ?? '';
            $ext = strtolower($file->getClientOriginalExtension());
            $isVideo = str_starts_with($mime, 'video/') || in_array($ext, ['mp4', 'webm', 'ogg', 'mov', 'm4v']);
            $maxKb = $isVideo ? 51200 : 10240;
            $maxLabel = $isVideo ? '50MB' : '10MB';
            $typeLabel = $isVideo ? 'video' : 'foto';

            $request->validate([
                'image' => [
                    'file',
                    'mimes:jpeg,png,jpg,webp,gif,svg,avif,mp4,webm,ogg,mov,m4v',
                    "max:{$maxKb}",
                ],
            ], [
                'image.file' => 'Banner media harus berupa berkas yang valid.',
                'image.mimes' => 'Format file media harus berupa Foto/GIF (JPG, PNG, WEBP, GIF, SVG) atau Video (MP4, WebM, OGG, MOV).',
                'image.max' => "Ukuran berkas {$typeLabel} maksimal {$maxLabel}.",
            ]);

            if ($file instanceof UploadedFile && $file->isValid()) {
                $path = $file->store('banners', 'public');
                $image = Storage::url($path);
            }
        } elseif (! empty($validated['image']) && is_string($validated['image'])) {
            $image = trim($validated['image']);
        }

        if (empty($image)) {
            return back()->withErrors(['image' => 'Banner media (gambar, animasi GIF, atau video) wajib diunggah.'])->withInput();
        }

        $validated['image'] = $image;
        $validated['button_text'] = ! empty($validated['button_text']) ? trim($validated['button_text']) : 'Belanja Promo';
        $validated['button_link'] = ! empty($validated['button_link']) ? trim($validated['button_link']) : '/products?discount=1';
        $validated['is_active'] = $request->boolean('is_active', true);

        $banner = Banner::create($validated);

        return redirect()->route('admin.banners.index')
            ->with('success', "Banner '{$banner->title}' berhasil ditambahkan.");
    }

    public function edit(Banner $banner): Response
    {
        return Inertia::render('admin/banners/edit', [
            'banner' => $banner,
        ]);
    }

    public function update(Request $request, Banner $banner): RedirectResponse
    {
        $file = $request->file('image');
        if ($file instanceof UploadedFile && ! $file->isValid() && $file->getError() !== UPLOAD_ERR_NO_FILE) {
            $errorMsg = match ($file->getError()) {
                UPLOAD_ERR_INI_SIZE => 'Ukuran berkas terlalu besar (maksimal 10MB untuk foto, 50MB untuk video). Silakan pilih berkas yang lebih kecil atau lakukan kompresi terlebih dahulu.',
                UPLOAD_ERR_FORM_SIZE => 'Ukuran berkas melebihi batas maksimal yang diizinkan.',
                UPLOAD_ERR_PARTIAL => 'Berkas hanya terunggah sebagian. Silakan coba unggah kembali.',
                default => 'Gagal mengunggah berkas media. Silakan coba beberapa saat lagi.',
            };

            return back()->withErrors(['image' => $errorMsg])->withInput();
        }

        $validated = $request->validate([
            'subtitle' => ['nullable', 'string', 'max:255'],
            'subtitle_en' => ['nullable', 'string', 'max:255'],
            'title' => ['required', 'string', 'max:255'],
            'title_en' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'description_en' => ['nullable', 'string', 'max:1000'],
            'image' => ['nullable'],
            'button_text' => ['nullable', 'string', 'max:100'],
            'button_text_en' => ['nullable', 'string', 'max:100'],
            'button_link' => ['nullable', 'string', 'max:255'],
            'secondary_button_text' => ['nullable', 'string', 'max:100'],
            'secondary_button_text_en' => ['nullable', 'string', 'max:100'],
            'secondary_button_link' => ['nullable', 'string', 'max:255'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $image = $banner->image;
        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $mime = $file->getMimeType() ?? '';
            $ext = strtolower($file->getClientOriginalExtension());
            $isVideo = str_starts_with($mime, 'video/') || in_array($ext, ['mp4', 'webm', 'ogg', 'mov', 'm4v']);
            $maxKb = $isVideo ? 51200 : 10240;
            $maxLabel = $isVideo ? '50MB' : '10MB';
            $typeLabel = $isVideo ? 'video' : 'foto';

            $request->validate([
                'image' => [
                    'file',
                    'mimes:jpeg,png,jpg,webp,gif,svg,avif,mp4,webm,ogg,mov,m4v',
                    "max:{$maxKb}",
                ],
            ], [
                'image.file' => 'Banner media harus berupa berkas yang valid.',
                'image.mimes' => 'Format file media harus berupa Foto/GIF (JPG, PNG, WEBP, GIF, SVG) atau Video (MP4, WebM, OGG, MOV).',
                'image.max' => "Ukuran berkas {$typeLabel} maksimal {$maxLabel}.",
            ]);

            $file = $request->file('image');
            if ($file instanceof UploadedFile && $file->isValid()) {
                if (! empty($banner->image) && str_contains($banner->image, '/storage/banners/')) {
                    $storagePath = str_replace('/storage/', '', $banner->image);
                    Storage::disk('public')->delete($storagePath);
                }

                $path = $file->store('banners', 'public');
                $image = Storage::url($path);
            }
        } elseif ($request->filled('image') && is_string($request->input('image'))) {
            $image = trim($request->input('image'));
        }

        if (empty($image)) {
            return back()->withErrors(['image' => 'Banner media (gambar, animasi GIF, atau video) wajib diunggah.'])->withInput();
        }

        $banner->update([
            'subtitle' => $validated['subtitle'] ?? null,
            'subtitle_en' => $validated['subtitle_en'] ?? null,
            'title' => $validated['title'],
            'title_en' => $validated['title_en'] ?? null,
            'description' => $validated['description'] ?? null,
            'description_en' => $validated['description_en'] ?? null,
            'image' => $image,
            'button_text' => ! empty($validated['button_text']) ? trim($validated['button_text']) : 'Belanja Promo',
            'button_text_en' => ! empty($validated['button_text_en']) ? trim($validated['button_text_en']) : 'Shop Promo',
            'button_link' => ! empty($validated['button_link']) ? trim($validated['button_link']) : '/products?discount=1',
            'secondary_button_text' => $validated['secondary_button_text'] ?? null,
            'secondary_button_text_en' => $validated['secondary_button_text_en'] ?? null,
            'secondary_button_link' => $validated['secondary_button_link'] ?? null,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()->route('admin.banners.index')
            ->with('success', "Banner '{$banner->title}' berhasil diperbarui.");
    }

    public function toggleActive(Banner $banner): RedirectResponse
    {
        $banner->update(['is_active' => ! empty($banner->is_active) ? false : true]);

        $statusText = $banner->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return back()->with('success', "Banner '{$banner->title}' berhasil {$statusText}.");
    }

    public function destroy(Banner $banner): RedirectResponse
    {
        $title = $banner->title;

        if (! empty($banner->image) && str_contains($banner->image, '/storage/banners/')) {
            $storagePath = str_replace('/storage/', '', $banner->image);
            Storage::disk('public')->delete($storagePath);
        }

        $banner->delete();

        return redirect()->route('admin.banners.index')
            ->with('success', "Banner '{$title}' berhasil dihapus.");
    }
}
