<?php

namespace App\Http\Controllers;

use App\Models\Article;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ArticleController extends Controller
{
    /**
     * Display a listing of fragrance articles & journals.
     */
    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search', $request->input('q', '')));

        $query = Article::published()->latest();

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('excerpt', 'like', "%{$search}%")
                    ->orWhere('content', 'like', "%{$search}%");
            });
        }

        $articles = $query->get()->map(fn (Article $art) => $this->formatArticleCard($art))->values()->all();

        return Inertia::render('articles', [
            'articles' => $articles,
            'searchQuery' => $search,
        ]);
    }

    /**
     * Display the specified article detail page.
     */
    public function show(string $slug): Response
    {
        $article = Article::published()
            ->where('slug', $slug)
            ->firstOrFail();

        $relatedArticles = Article::published()
            ->where('id', '!=', $article->id)
            ->latest()
            ->take(4)
            ->get()
            ->map(fn (Article $art) => $this->formatArticleCard($art))
            ->values()
            ->all();

        return Inertia::render('article-detail', [
            'article' => [
                'id' => $article->id,
                'slug' => $article->slug,
                'title' => $article->title,
                'title_en' => $article->title_en,
                'readTime' => $article->read_time,
                'date' => $article->created_at->format('d M Y'),
                'thumbnail' => $article->thumbnail,
                'excerpt' => $article->excerpt,
                'excerpt_en' => $article->excerpt_en,
                'content' => $article->content,
                'content_en' => $article->content_en,
            ],
            'relatedArticles' => $relatedArticles,
        ]);
    }

    /**
     * Format an Article model into standard ArticleItem shape for cards.
     *
     * @return array<string, mixed>
     */
    private function formatArticleCard(Article $art): array
    {
        return [
            'id' => $art->id,
            'slug' => $art->slug,
            'title' => $art->title,
            'title_en' => $art->title_en,
            'readTime' => $art->read_time,
            'date' => $art->created_at->format('d M Y'),
            'excerpt' => $art->excerpt,
            'excerpt_en' => $art->excerpt_en,
            'thumbnail' => $art->thumbnail,
        ];
    }
}
