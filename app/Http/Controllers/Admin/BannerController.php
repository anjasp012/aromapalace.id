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

    public function create(): Response
    {
        return Inertia::render('admin/banners/create');
    }

    public function store(Request $request): RedirectResponse
    {
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
            $request->validate([
                'image' => [
                    'file',
                    'mimes:jpeg,png,jpg,webp,gif,svg,avif,mp4,webm,ogg,mov,m4v',
                    'max:51200',
                ],
            ], [
                'image.mimes' => 'Format file media harus berupa Gambar/GIF (JPG, PNG, WEBP, GIF, SVG) atau Video (MP4, WebM, OGG, MOV).',
                'image.max' => 'Ukuran file media banner maksimal 50MB.',
            ]);

            $file = $request->file('image');
            if ($file instanceof UploadedFile && $file->isValid()) {
                $path = $file->store('banners', 'public');
                $image = Storage::url($path);
            }
        } elseif (! empty($validated['image']) && is_string($validated['image'])) {
            $image = trim($validated['image']);
        }

        if (empty($image)) {
            return back()->withErrors(['image' => 'Banner media (video, GIF, atau gambar) wajib diunggah atau cantumkan tautan URL.'])->withInput();
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
            $request->validate([
                'image' => [
                    'file',
                    'mimes:jpeg,png,jpg,webp,gif,svg,avif,mp4,webm,ogg,mov,m4v',
                    'max:51200',
                ],
            ], [
                'image.mimes' => 'Format file media harus berupa Gambar/GIF (JPG, PNG, WEBP, GIF, SVG) atau Video (MP4, WebM, OGG, MOV).',
                'image.max' => 'Ukuran file media banner maksimal 50MB.',
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
        } elseif ($request->filled('image') && is_string($validated['image'])) {
            $image = trim($validated['image']);
        }

        $validated['image'] = $image;
        $validated['button_text'] = ! empty($validated['button_text']) ? trim($validated['button_text']) : 'Belanja Promo';
        $validated['button_link'] = ! empty($validated['button_link']) ? trim($validated['button_link']) : '/products?discount=1';
        $validated['is_active'] = $request->boolean('is_active', true);

        $banner->update($validated);

        return redirect()->route('admin.banners.index')
            ->with('success', "Banner '{$banner->title}' berhasil diperbarui.");
    }

    public function toggleActive(Banner $banner): RedirectResponse
    {
        $banner->update(['is_active' => ! $banner->is_active]);

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

