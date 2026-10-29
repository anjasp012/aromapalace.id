<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Article;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ArticleController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->value();
        $statusFilter = (string) $request->query('status', 'all');

        $articlesQuery = Article::query()
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                        ->orWhere('slug', 'like', "%{$search}%")
                        ->orWhere('excerpt', 'like', "%{$search}%");
                });
            })
            ->when($statusFilter === 'draft', fn ($q) => $q->where('is_draft', true))
            ->when($statusFilter === 'published', fn ($q) => $q->where('is_draft', false))
            ->latest('id');

        $articles = $articlesQuery->paginate(15)->withQueryString();

        $metrics = [
            'total_articles' => Article::count(),
            'draft_count' => Article::where('is_draft', true)->count(),
            'published_count' => Article::where('is_draft', false)->count(),
        ];

        return Inertia::render('admin/articles/index', [
            'articles' => $articles,
            'filters' => [
                'search' => $search,
                'status' => $statusFilter,
            ],
            'metrics' => $metrics,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/articles/create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'title_en' => ['nullable', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:articles,slug'],
            'thumbnail' => ['nullable'],
            'read_time' => ['nullable', 'string', 'max:50'],
            'excerpt' => ['required', 'string', 'max:1000'],
            'excerpt_en' => ['nullable', 'string', 'max:1000'],
            'content' => ['required', 'string'],
            'content_en' => ['nullable', 'string'],
            'is_draft' => ['nullable', 'boolean'],
        ]);

        $thumbnail = null;
        if ($request->hasFile('thumbnail')) {
            $file = $request->file('thumbnail');
            if ($file instanceof UploadedFile && $file->isValid()) {
                $path = $file->store('articles', 'public');
                $thumbnail = Storage::url($path);
            }
        } elseif (! empty($validated['thumbnail']) && is_string($validated['thumbnail'])) {
            $thumbnail = trim($validated['thumbnail']);
        }

        $validated['thumbnail'] = $thumbnail ?: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=1200&q=80';

        if (empty($validated['slug'])) {
            $baseSlug = Str::slug($validated['title']);
            $slug = $baseSlug;
            $counter = 1;
            while (Article::where('slug', $slug)->exists()) {
                $slug = "{$baseSlug}-{$counter}";
                $counter++;
            }
            $validated['slug'] = $slug;
        } else {
            $validated['slug'] = Str::slug($validated['slug']);
        }

        $validated['read_time'] = $validated['read_time'] ?: '4 mnt';
        $validated['is_draft'] = $request->boolean('is_draft');

        $article = Article::create($validated);

        $msg = $article->is_draft
            ? "Artikel '{$article->title}' berhasil disimpan sebagai draft."
            : "Artikel '{$article->title}' berhasil dipublikasikan.";

        return redirect()->route('admin.articles.index')->with('success', $msg);
    }

    public function edit(Article $article): Response
    {
        return Inertia::render('admin/articles/edit', [
            'article' => $article,
        ]);
    }

    public function update(Request $request, Article $article): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'title_en' => ['nullable', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', Rule::unique('articles', 'slug')->ignore($article->id)],
            'thumbnail' => ['nullable'],
            'read_time' => ['nullable', 'string', 'max:50'],
            'excerpt' => ['required', 'string', 'max:1000'],
            'excerpt_en' => ['nullable', 'string', 'max:1000'],
            'content' => ['required', 'string'],
            'content_en' => ['nullable', 'string'],
            'is_draft' => ['nullable', 'boolean'],
        ]);

        $thumbnail = $article->thumbnail;
        if ($request->hasFile('thumbnail')) {
            $file = $request->file('thumbnail');
            if ($file instanceof UploadedFile && $file->isValid()) {
                $path = $file->store('articles', 'public');
                $thumbnail = Storage::url($path);
            }
        } elseif ($request->has('thumbnail')) {
            $thumbnail = is_string($validated['thumbnail']) ? trim($validated['thumbnail']) : $article->thumbnail;
        }

        $validated['thumbnail'] = $thumbnail;

        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['title']);
        } else {
            $validated['slug'] = Str::slug($validated['slug']);
        }

        $validated['read_time'] = $validated['read_time'] ?: '4 mnt';
        $validated['is_draft'] = $request->boolean('is_draft');

        $article->update($validated);

        return redirect()->route('admin.articles.index')
            ->with('success', "Artikel '{$article->title}' berhasil diperbarui.");
    }

    public function destroy(Article $article): RedirectResponse
    {
        $title = $article->title;
        $article->delete();

        return redirect()->route('admin.articles.index')
            ->with('success', "Artikel '{$title}' berhasil dihapus.");
    }
}
