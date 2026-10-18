<?php

use App\Models\Article;
use Database\Seeders\ArticleSeeder;

beforeEach(function () {
    $this->seed(ArticleSeeder::class);
});

test('articles page renders successfully with seeded articles', function () {
    $response = $this->get(route('articles.index'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('articles')
            ->has('articles')
        );
});

test('articles page filters by search query', function () {
    $response = $this->get(route('articles.index', ['search' => 'Maceration']));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('articles')
            ->where('searchQuery', 'Maceration')
            ->has('articles')
        );
});

test('article detail page renders successfully for a valid slug', function () {
    $article = Article::firstOrFail();

    $response = $this->get(route('articles.show', $article->slug));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('article-detail')
            ->where('article.id', $article->id)
            ->where('article.slug', $article->slug)
            ->where('article.title', $article->title)
            ->has('relatedArticles')
        );
});

test('article detail page returns 404 for non-existent slug', function () {
    $response = $this->get(route('articles.show', 'artikel-yang-tidak-ada'));

    $response->assertNotFound();
});

test('home page receives articles from database', function () {
    $response = $this->get(route('home'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('home')
            ->has('articles')
        );
});
