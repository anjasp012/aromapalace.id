<?php

use App\Models\Brand;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Http\UploadedFile;

beforeEach(function () {
    $this->withServerVariables([
        'HTTP_HOST' => config('app.admin_domain', 'admin.aromapalace.id'),
    ]);
});

test('guest cannot access product import routes and is redirected to login', function () {
    $this->get(route('admin.products.import.template'))->assertRedirect(route('admin.login'));
    $this->post(route('admin.products.import.preview'))->assertRedirect(route('admin.login'));
    $this->post(route('admin.products.import'))->assertRedirect(route('admin.login'));
});

test('admin can download product import csv template', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)
        ->get(route('admin.products.import.template'));

    $response->assertOk()
        ->assertHeader('Content-Disposition', 'attachment; filename="template_import_produk.csv"');

    $content = $response->getContent();
    expect($content)->toContain('Brand,Product,Price,Volume,Varian')
        ->toContain('AL FARES')
        ->toContain('100 ml')
        ->toContain('EDP');
});

test('admin can preview import data from raw text with 5 columns', function () {
    $admin = User::factory()->admin()->create();
    $existingBrand = Brand::create([
        'name' => 'AL FARES',
        'slug' => 'al-fares',
        'description' => '-',
    ]);

    $rawText = "Brand\tProduct\tPrice\tVolume\tVarian\nAL FARES\tAl Fares Khayal Al Faris inspired by Parfums De Marly Greenley\t412,500\t100 ml\tEDP";

    $response = $this->actingAs($admin)
        ->postJson(route('admin.products.import.preview'), [
            'raw_text' => $rawText,
        ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'data' => [
                'total_rows' => 1,
                'brands_found_count' => 1,
                'brands_new_count' => 0,
                'products_new_count' => 1,
                'rows' => [
                    [
                        'brand_name' => 'AL FARES',
                        'brand_id' => $existingBrand->id,
                        'brand_status' => 'found',
                        'product_name' => 'Al Fares Khayal Al Faris inspired by Parfums De Marly Greenley',
                        'price_clean' => 412500,
                        'volume' => 100,
                        'volume_raw' => '100 ml',
                        'varian_name' => 'EDP',
                    ],
                ],
            ],
        ]);
});

test('admin can preview import data from raw text', function () {
    $admin = User::factory()->admin()->create();
    $existingBrand = Brand::create([
        'name' => 'AL FARES',
        'slug' => 'al-fares',
        'description' => '-',
    ]);

    $rawText = "Brand\tProduct\tPrice\tVarian\nAL FARES\tAl Fares Khayal Al Faris Edp inspired by Parfums De Marly Greenley\t412,500\t100 ml";

    $response = $this->actingAs($admin)
        ->postJson(route('admin.products.import.preview'), [
            'raw_text' => $rawText,
        ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'data' => [
                'total_rows' => 1,
                'brands_found_count' => 1,
                'brands_new_count' => 0,
                'products_new_count' => 1,
                'rows' => [
                    [
                        'brand_name' => 'AL FARES',
                        'brand_id' => $existingBrand->id,
                        'brand_status' => 'found',
                        'product_name' => 'Al Fares Khayal Al Faris Edp inspired by Parfums De Marly Greenley',
                        'price_clean' => 412500,
                        'varian_name' => '100 ml',
                        'volume' => 100,
                    ],
                ],
            ],
        ]);
});

test('admin can preview import data from uploaded csv file', function () {
    $admin = User::factory()->admin()->create();

    $csvContent = "Brand,Product,Price,Varian\nLATTAFA,\"Lattafa Asad EDP\",350000,100 ml\n";
    $file = UploadedFile::fake()->createWithContent('import.csv', $csvContent);

    $response = $this->actingAs($admin)
        ->post(route('admin.products.import.preview'), [
            'file' => $file,
        ], ['Accept' => 'application/json']);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'data' => [
                'total_rows' => 1,
                'brands_new_count' => 1,
                'products_new_count' => 1,
            ],
        ]);
});

test('admin can execute product import and create brand, product with default dash values, and variants', function () {
    $admin = User::factory()->admin()->create();

    $rows = [
        [
            'brand' => 'AL FARES',
            'product' => 'Al Fares Khayal Al Faris Edp inspired by Parfums De Marly Greenley',
            'price' => '412,500',
            'varian' => '100 ml',
        ],
    ];

    $response = $this->actingAs($admin)
        ->postJson(route('admin.products.import'), [
            'rows' => $rows,
        ]);

    $response->assertOk()
        ->assertJson(['success' => true]);

    // Check brand was created and matched
    $brand = Brand::where('name', 'AL FARES')->first();
    expect($brand)->not->toBeNull();

    // Check product was created with dash for required description, as draft, and without fake galleries
    $product = Product::where('name', 'Al Fares Khayal Al Faris Edp inspired by Parfums De Marly Greenley')->first();
    expect($product)->not->toBeNull()
        ->and($product->brand_id)->toBe($brand->id)
        ->and($product->description)->toBe('-')
        ->and($product->description_en)->toBe('-')
        ->and($product->is_draft)->toBeTrue()
        ->and($product->galleries()->count())->toBe(0);

    // Check variant
    $variant = ProductVariant::where('product_id', $product->id)->first();
    expect($variant)->not->toBeNull()
        ->and($variant->name)->toBe('100 ml')
        ->and($variant->volume)->toBe(100)
        ->and($variant->price)->toBe(412500)
        ->and($variant->stock)->toBe(20);
});

test('admin can execute product import with 5 columns saving variant name to variant and volume to volume', function () {
    $admin = User::factory()->admin()->create();

    $rows = [
        [
            'brand' => 'AL FARES',
            'product' => 'Al Fares Khayal Al Faris inspired by Parfums De Marly Greenley',
            'price' => '412,500',
            'volume' => '100 ml',
            'varian' => 'EDP',
        ],
    ];

    $response = $this->actingAs($admin)
        ->postJson(route('admin.products.import'), [
            'rows' => $rows,
        ]);

    $response->assertOk()
        ->assertJson(['success' => true]);

    $product = Product::where('name', 'Al Fares Khayal Al Faris inspired by Parfums De Marly Greenley')->first();
    expect($product)->not->toBeNull()
        ->and($product->is_draft)->toBeTrue();

    $variant = ProductVariant::where('product_id', $product->id)->first();
    expect($variant)->not->toBeNull()
        ->and($variant->name)->toBe('EDP')
        ->and($variant->volume)->toBe(100)
        ->and($variant->price)->toBe(412500)
        ->and($variant->stock)->toBe(20);
});

test('cleanPrice correctly handles various price formats without adding trailing zeros', function () {
    $service = new \App\Services\ProductImportService();

    expect($service->cleanPrice('412,500'))->toBe(412500)
        ->and($service->cleanPrice('412.500'))->toBe(412500)
        ->and($service->cleanPrice('412500'))->toBe(412500)
        ->and($service->cleanPrice('412,500.0'))->toBe(412500)
        ->and($service->cleanPrice('412,500.00'))->toBe(412500)
        ->and($service->cleanPrice('412500.0'))->toBe(412500)
        ->and($service->cleanPrice('412500.00'))->toBe(412500)
        ->and($service->cleanPrice('412.500,0'))->toBe(412500)
        ->and($service->cleanPrice('412.500,00'))->toBe(412500)
        ->and($service->cleanPrice('Rp 412,500'))->toBe(412500)
        ->and($service->cleanPrice('Rp. 412.500,-'))->toBe(412500)
        ->and($service->cleanPrice('4,125,000'))->toBe(4125000)
        ->and($service->cleanPrice('4.125.000'))->toBe(4125000);
});

test('importing multiple variants for the same product attaches variants to single product', function () {
    $admin = User::factory()->admin()->create();

    $rows = [
        [
            'brand' => 'AL FARES',
            'product' => 'Al Fares Khayal Al Faris',
            'price' => '250,000',
            'varian' => '50 ml',
        ],
        [
            'brand' => 'AL FARES',
            'product' => 'Al Fares Khayal Al Faris',
            'price' => '412,500',
            'varian' => '100 ml',
        ],
    ];

    $response = $this->actingAs($admin)
        ->postJson(route('admin.products.import'), [
            'rows' => $rows,
        ]);

    $response->assertOk();

    // Verify only 1 product exists with that name
    $products = Product::where('name', 'Al Fares Khayal Al Faris')->get();
    expect($products)->toHaveCount(1);

    // Verify both variants exist on the product
    $variants = ProductVariant::where('product_id', $products->first()->id)->get();
    expect($variants)->toHaveCount(2)
        ->and($variants->pluck('volume')->all())->toContain(50, 100);
});

