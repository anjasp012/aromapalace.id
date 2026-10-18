<?php

use App\Models\Article;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('guest cannot access admin article routes and is redirected to login', function () {
    $this->get('/admin/articles')->assertRedirect('/login');
    $this->get('/admin/articles/create')->assertRedirect('/login');
});

test('regular customer receives 403 forbidden when accessing article management', function () {
    $customer = User::factory()->create(['role' => 'customer']);

    $this->actingAs($customer)
        ->get('/admin/articles')
        ->assertForbidden();
});

test('admin can view articles index with metrics', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)
        ->get('/admin/articles');

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/articles/index')
            ->has('articles.data')
            ->has('metrics')
        );
});

test('admin can view article create page', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)
        ->get('/admin/articles/create');

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/articles/create')
        );
});

test('admin can store a new article', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)
        ->post('/admin/articles', [
            'title' => 'Panduan Memilih Parfum Musim Panas',
            'slug' => 'panduan-memilih-parfum-musim-panas',
            'thumbnail' => 'https://example.com/summer.jpg',
            'read_time' => '3 mnt',
            'excerpt' => 'Tips memilih wewangian segar untuk cuaca tropis.',
            'content' => 'Parfum citrus dan aquatic sangat ideal untuk cuaca panas karena tidak pekat.',
        ]);

    $response->assertRedirect('/admin/articles');
    $this->assertDatabaseHas('articles', [
        'title' => 'Panduan Memilih Parfum Musim Panas',
        'slug' => 'panduan-memilih-parfum-musim-panas',
    ]);
});

test('admin can view article edit page', function () {
    $admin = User::factory()->admin()->create();
    $article = Article::create([
        'title' => 'Sample Article For Edit',
        'slug' => 'sample-article-for-edit',
        'excerpt' => 'Short excerpt',
        'content' => 'Full content text',
    ]);

    $response = $this->actingAs($admin)
        ->get("/admin/articles/{$article->id}/edit");

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/articles/edit')
            ->has('article')
        );
});

test('admin can update an article', function () {
    $admin = User::factory()->admin()->create();
    $article = Article::create([
        'title' => 'Original Title',
        'slug' => 'original-title',
        'excerpt' => 'Original excerpt',
        'content' => 'Original content',
    ]);

    $response = $this->actingAs($admin)
        ->put("/admin/articles/{$article->id}", [
            'title' => 'Updated Title',
            'slug' => 'updated-title',
            'thumbnail' => 'https://example.com/updated.jpg',
            'read_time' => '5 mnt',
            'excerpt' => 'Updated excerpt text.',
            'content' => 'Updated content body.',
        ]);

    $response->assertRedirect('/admin/articles');
    $this->assertDatabaseHas('articles', [
        'id' => $article->id,
        'title' => 'Updated Title',
        'slug' => 'updated-title',
    ]);
});

test('admin can delete an article', function () {
    $admin = User::factory()->admin()->create();
    $article = Article::create([
        'title' => 'Article To Delete',
        'slug' => 'article-to-delete',
        'excerpt' => 'Short excerpt',
        'content' => 'Full content text',
    ]);

    $response = $this->actingAs($admin)
        ->delete("/admin/articles/{$article->id}");

    $response->assertRedirect('/admin/articles');
    $this->assertDatabaseMissing('articles', [
        'id' => $article->id,
    ]);
});

test('admin can store an article with uploaded thumbnail file', function () {
    Storage::fake('public');
    $admin = User::factory()->admin()->create();

    $file = UploadedFile::fake()->image('cover.jpg', 800, 600);

    $response = $this->actingAs($admin)
        ->post('/admin/articles', [
            'title' => 'Artikel Baru Dengan File Thumbnail',
            'slug' => 'artikel-baru-dengan-file-thumbnail',
            'thumbnail' => $file,
            'read_time' => '5 mnt',
            'excerpt' => 'Ringkasan artikel cover file.',
            'content' => 'Isi konten lengkap artikel.',
        ]);

    $response->assertRedirect('/admin/articles');

    $article = Article::where('slug', 'artikel-baru-dengan-file-thumbnail')->first();
    expect($article)->not->toBeNull();
    expect($article->thumbnail)->toContain('/storage/articles/');

    $storedPath = str_replace('/storage/', '', $article->thumbnail);
    Storage::disk('public')->assertExists($storedPath);
});

test('admin can update an article with uploaded thumbnail file', function () {
    Storage::fake('public');
    $admin = User::factory()->admin()->create();

    $article = Article::create([
        'title' => 'Artikel Lama',
        'slug' => 'artikel-lama',
        'thumbnail' => 'https://example.com/old-cover.jpg',
        'excerpt' => 'Excerpt lama',
        'content' => 'Content lama',
    ]);

    $file = UploadedFile::fake()->image('new-cover.png', 800, 600);

    // Using POST with _method=put to simulate multipart form submit
    $response = $this->actingAs($admin)
        ->post("/admin/articles/{$article->id}", [
            '_method' => 'put',
            'title' => 'Artikel Lama Berubah',
            'slug' => 'artikel-lama-berubah',
            'thumbnail' => $file,
            'read_time' => '6 mnt',
            'excerpt' => 'Excerpt baru',
            'content' => 'Content baru',
        ]);

    $response->assertRedirect('/admin/articles');

    $article->refresh();
    expect($article->title)->toBe('Artikel Lama Berubah');
    expect($article->thumbnail)->toContain('/storage/articles/');

    $storedPath = str_replace('/storage/', '', $article->thumbnail);
    Storage::disk('public')->assertExists($storedPath);
});
