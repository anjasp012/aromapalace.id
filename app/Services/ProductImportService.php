<?php

namespace App\Services;

use App\Models\Brand;
use App\Models\Product;
use App\Models\ProductGallery;
use App\Models\ProductVariant;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductImportService
{
    /**
     * Cache of resolved brands in this session to prevent duplicate queries and duplicate creations.
     *
     * @var array<string, Brand>
     */
    protected array $brandCache = [];

    /**
     * Cache of products created or found in this import batch.
     *
     * @var array<string, Product>
     */
    protected array $productCache = [];

    /**
     * Parse uploaded file or raw text into raw rows of string arrays.
     *
     * @return array<int, array<int, string>>
     */
    public function parseInput(UploadedFile|string $input): array
    {
        if ($input instanceof UploadedFile) {
            $ext = strtolower($input->getClientOriginalExtension());
            $realPath = $input->getRealPath();

            if ($ext === 'xlsx' || $ext === 'xls') {
                return $this->parseXlsxFile($realPath);
            }

            return $this->parseCsvFile($realPath);
        }

        return $this->parseRawText($input);
    }

    /**
     * Parse raw pasted text (e.g. from Excel copy-paste: tab-separated or comma-separated).
     *
     * @return array<int, array<int, string>>
     */
    public function parseRawText(string $rawText): array
    {
        $lines = preg_split('/\r\n|\r|\n/', trim($rawText));
        if (empty($lines)) {
            return [];
        }

        // Detect delimiter on the first non-empty line
        $firstLine = '';
        foreach ($lines as $line) {
            if (trim($line) !== '') {
                $firstLine = $line;
                break;
            }
        }

        if ($firstLine === '') {
            return [];
        }

        $delimiters = ["\t", ",", ";"];
        $bestDelimiter = "\t";
        $maxCount = 0;
        foreach ($delimiters as $delim) {
            $count = count(str_getcsv($firstLine, $delim, '"', '\\'));
            if ($count > $maxCount) {
                $maxCount = $count;
                $bestDelimiter = $delim;
            }
        }

        $rows = [];
        foreach ($lines as $line) {
            if (trim($line) === '') {
                continue;
            }

            $parsed = str_getcsv($line, $bestDelimiter, '"', '\\');
            $cleanRow = array_map(fn ($cell) => trim((string) $cell), $parsed);

            if (array_filter($cleanRow, fn ($v) => $v !== '') !== []) {
                $rows[] = $cleanRow;
            }
        }

        return $rows;
    }

    /**
     * Parse a CSV file with automatic delimiter detection.
     *
     * @return array<int, array<int, string>>
     */
    public function parseCsvFile(string $filePath): array
    {
        $handle = fopen($filePath, 'r');
        if (! $handle) {
            return [];
        }

        $firstLine = fgets($handle);
        if ($firstLine === false) {
            fclose($handle);

            return [];
        }

        // Detect delimiter: comma, tab, or semicolon
        $delimiters = [',', "\t", ';'];
        $bestDelimiter = ',';
        $maxCount = 0;
        foreach ($delimiters as $delim) {
            $count = count(str_getcsv($firstLine, $delim, '"', '\\'));
            if ($count > $maxCount) {
                $maxCount = $count;
                $bestDelimiter = $delim;
            }
        }

        rewind($handle);
        $rows = [];
        while (($data = fgetcsv($handle, 0, $bestDelimiter, '"', '\\')) !== false) {
            $cleanRow = array_map(fn ($cell) => trim((string) $cell), $data);
            if (array_filter($cleanRow, fn ($v) => $v !== '') !== []) {
                $rows[] = $cleanRow;
            }
        }
        fclose($handle);

        return $rows;
    }

    /**
     * Parse an XLSX file natively using ZipArchive or pure-PHP gzinflate fallback.
     *
     * @return array<int, array<int, string>>
     */
    public function parseXlsxFile(string $filePath): array
    {
        $sharedStringsXml = null;
        $sheetXml = null;

        if (class_exists(\ZipArchive::class)) {
            $zip = new \ZipArchive();
            if ($zip->open($filePath) === true) {
                $sharedStringsXml = $zip->getFromName('xl/sharedStrings.xml') ?: null;
                $sheetXml = $zip->getFromName('xl/worksheets/sheet1.xml')
                    ?: $zip->getFromName('xl/worksheets/sheet.xml')
                    ?: null;
                $zip->close();
            }
        }

        if (! $sheetXml) {
            $extracted = $this->extractZipFilesManually($filePath, [
                'xl/sharedStrings.xml',
                'xl/worksheets/sheet1.xml',
                'xl/worksheets/sheet.xml',
            ]);
            $sharedStringsXml = $extracted['xl/sharedStrings.xml'] ?? null;
            $sheetXml = $extracted['xl/worksheets/sheet1.xml'] ?? $extracted['xl/worksheets/sheet.xml'] ?? null;
        }

        if ($sheetXml) {
            return $this->parseXmlSheet($sheetXml, $sharedStringsXml);
        }

        return $this->parseCsvFile($filePath);
    }

    /**
     * Pure-PHP ZIP extractor for specific targets without requiring ext-zip.
     *
     * @param  array<int, string>  $targetFiles
     * @return array<string, string>
     */
    protected function extractZipFilesManually(string $zipPath, array $targetFiles): array
    {
        $data = @file_get_contents($zipPath);
        if (! $data) {
            return [];
        }

        $result = [];
        $offset = 0;
        $len = strlen($data);

        while ($offset + 30 <= $len) {
            if (substr($data, $offset, 4) !== "PK\x03\x04") {
                break;
            }

            $method = unpack('v', substr($data, $offset + 8, 2))[1];
            $compSize = unpack('V', substr($data, $offset + 18, 4))[1];
            $nameLen = unpack('v', substr($data, $offset + 26, 2))[1];
            $extraLen = unpack('v', substr($data, $offset + 28, 2))[1];

            $fileName = substr($data, $offset + 30, $nameLen);
            $contentOffset = $offset + 30 + $nameLen + $extraLen;

            if (in_array($fileName, $targetFiles, true)) {
                $compData = substr($data, $contentOffset, $compSize);
                if ($method === 0) {
                    $result[$fileName] = $compData;
                } elseif ($method === 8 && function_exists('gzinflate')) {
                    $inflated = @gzinflate($compData);
                    if ($inflated !== false) {
                        $result[$fileName] = $inflated;
                    }
                }
            }

            $offset = $contentOffset + $compSize;
        }

        return $result;
    }

    /**
     * Parse extracted worksheet XML and shared strings.
     *
     * @return array<int, array<int, string>>
     */
    protected function parseXmlSheet(string $sheetXml, ?string $sharedStringsXml): array
    {
        $sharedStrings = [];
        if ($sharedStringsXml) {
            $sXml = @simplexml_load_string($sharedStringsXml);
            if ($sXml) {
                foreach ($sXml->si as $si) {
                    if (isset($si->t)) {
                        $sharedStrings[] = (string) $si->t;
                    } elseif (isset($si->r)) {
                        $text = '';
                        foreach ($si->r as $r) {
                            $text .= (string) $r->t;
                        }
                        $sharedStrings[] = $text;
                    } else {
                        $sharedStrings[] = '';
                    }
                }
            }
        }

        $sheet = @simplexml_load_string($sheetXml);
        if (! $sheet || ! isset($sheet->sheetData)) {
            return [];
        }

        $rows = [];
        foreach ($sheet->sheetData->row as $row) {
            $rowData = [];
            foreach ($row->c as $cell) {
                $type = (string) $cell['t'];
                $val = (string) $cell->v;

                if ($type === 's' && isset($sharedStrings[(int) $val])) {
                    $cellValue = $sharedStrings[(int) $val];
                } elseif ($type === 'inlineStr' && isset($cell->is->t)) {
                    $cellValue = (string) $cell->is->t;
                } else {
                    $cellValue = $val;
                }

                $ref = (string) $cell['r'];
                $colLetters = preg_replace('/[0-9]/', '', $ref);
                $colIndex = $this->colLetterToIndex($colLetters);

                $rowData[$colIndex] = trim($cellValue);
            }

            if (! empty($rowData)) {
                $maxCol = max(array_keys($rowData));
                $denseRow = [];
                for ($i = 0; $i <= $maxCol; $i++) {
                    $denseRow[$i] = $rowData[$i] ?? '';
                }
                if (array_filter($denseRow, fn ($v) => $v !== '') !== []) {
                    $rows[] = $denseRow;
                }
            }
        }

        return $rows;
    }

    /**
     * Convert Excel column letters (A, B, C... AA) to 0-based integer index.
     */
    protected function colLetterToIndex(string $letters): int
    {
        $letters = strtoupper($letters);
        $index = 0;
        $len = strlen($letters);
        for ($i = 0; $i < $len; $i++) {
            $index = $index * 26 + (ord($letters[$i]) - 64);
        }

        return max(0, $index - 1);
    }

    /**
     * Normalize raw rows into structured import row dictionaries with column mapping.
     *
     * @param  array<int, array<int, string>>  $rawRows
     * @return array<int, array{brand: string, product: string, price: string, varian: string}>
     */
    public function normalizeRows(array $rawRows): array
    {
        if (empty($rawRows)) {
            return [];
        }

        // Determine if first row is a header
        $headerMap = [
            'brand' => 0,
            'product' => 1,
            'price' => 2,
            'varian' => 3,
        ];

        $firstRow = $rawRows[0];
        $isHeader = false;

        $tempMap = [];
        foreach ($firstRow as $idx => $cell) {
            $normalized = strtolower(trim($cell));
            if (in_array($normalized, ['brand', 'merek', 'merk'], true)) {
                $tempMap['brand'] = $idx;
                $isHeader = true;
            } elseif (in_array($normalized, ['product', 'produk', 'nama produk', 'name'], true)) {
                $tempMap['product'] = $idx;
                $isHeader = true;
            } elseif (in_array($normalized, ['price', 'harga', 'harga jual', 'price idr'], true)) {
                $tempMap['price'] = $idx;
                $isHeader = true;
            } elseif (in_array($normalized, ['varian', 'variant', 'ukuran', 'volume', 'size'], true)) {
                $tempMap['varian'] = $idx;
                $isHeader = true;
            }
        }

        $dataRows = $rawRows;
        if ($isHeader) {
            $headerMap = array_merge($headerMap, $tempMap);
            array_shift($dataRows);
        }

        $normalizedList = [];
        foreach ($dataRows as $row) {
            $brand = $row[$headerMap['brand']] ?? '';
            $product = $row[$headerMap['product']] ?? '';
            $price = $row[$headerMap['price']] ?? '';
            $varian = $row[$headerMap['varian']] ?? '';

            // Skip if completely blank
            if ($brand === '' && $product === '' && $price === '' && $varian === '') {
                continue;
            }

            $normalizedList[] = [
                'brand' => trim((string) $brand),
                'product' => trim((string) $product),
                'price' => trim((string) $price),
                'varian' => trim((string) $varian),
            ];
        }

        return $normalizedList;
    }

    /**
     * Preview normalized rows: resolve brand ID, clean price, calculate volume, and detect new vs existing products.
     *
     * @param  array<int, array{brand: string, product: string, price: string, varian: string}>  $rows
     * @return array{
     *     rows: array<int, array{
     *         index: int,
     *         brand_name: string,
     *         brand_id: int|null,
     *         brand_status: 'found'|'new'|'empty',
     *         product_name: string,
     *         product_status: 'new'|'exists',
     *         price_raw: string,
     *         price_clean: int,
     *         price_formatted: string,
     *         varian_name: string,
     *         volume: int,
     *         is_valid: bool
     *     }>,
     *     total_rows: int,
     *     valid_rows: int,
     *     brands_found_count: int,
     *     brands_new_count: int,
     *     products_new_count: int,
     *     products_existing_count: int
     * }
     */
    public function preview(array $rows): array
    {
        $resolvedRows = [];
        $existingProductNames = Product::pluck('name')->map(fn ($n) => mb_strtolower(trim($n)))->all();
        $existingProductSlugs = Product::pluck('slug')->all();

        $brandsFound = 0;
        $brandsNew = 0;
        $productsNew = 0;
        $productsExisting = 0;
        $seenProductNamesInBatch = [];

        foreach ($rows as $index => $row) {
            $brandName = $row['brand'];
            $productName = $row['product'] ?: '-';
            $priceRaw = $row['price'];
            $varianName = $row['varian'] ?: '-';

            // 1. Resolve Brand
            $brandId = null;
            $brandStatus = 'empty';

            if ($brandName !== '' && $brandName !== '-') {
                $matchedBrand = $this->findBrandByName($brandName);
                if ($matchedBrand) {
                    $brandId = $matchedBrand->id;
                    $brandStatus = 'found';
                    $brandsFound++;
                } else {
                    $brandStatus = 'new';
                    $brandsNew++;
                }
            }

            // 2. Clean Price
            $cleanPrice = $this->cleanPrice($priceRaw);
            $formattedPrice = 'Rp '.number_format($cleanPrice, 0, ',', '.');

            // 3. Variant Volume
            $volume = $this->extractVolume($varianName);

            // 4. Product Status
            $lowerProdName = mb_strtolower(trim($productName));
            $isExisting = in_array($lowerProdName, $existingProductNames, true)
                || in_array(Str::slug($productName), $existingProductSlugs, true)
                || in_array($lowerProdName, $seenProductNamesInBatch, true);

            if ($isExisting) {
                $productStatus = 'exists';
                $productsExisting++;
            } else {
                $productStatus = 'new';
                $productsNew++;
                $seenProductNamesInBatch[] = $lowerProdName;
            }

            $resolvedRows[] = [
                'index' => $index + 1,
                'brand_name' => $brandName ?: '-',
                'brand_id' => $brandId,
                'brand_status' => $brandStatus,
                'product_name' => $productName,
                'product_status' => $productStatus,
                'price_raw' => $priceRaw,
                'price_clean' => $cleanPrice,
                'price_formatted' => $formattedPrice,
                'varian_name' => $varianName,
                'volume' => $volume,
                'is_valid' => true,
            ];
        }

        return [
            'rows' => $resolvedRows,
            'total_rows' => count($resolvedRows),
            'valid_rows' => count($resolvedRows),
            'brands_found_count' => $brandsFound,
            'brands_new_count' => $brandsNew,
            'products_new_count' => $productsNew,
            'products_existing_count' => $productsExisting,
        ];
    }

    /**
     * Execute the import inside a database transaction.
     *
     * @param  array<int, array{brand: string, product: string, price: string, varian: string}>  $rows
     * @return array{
     *     products_created: int,
     *     products_updated: int,
     *     variants_created: int,
     *     variants_updated: int,
     *     brands_created: int,
     *     total_processed: int
     * }
     */
    public function executeImport(array $rows): array
    {
        $productsCreated = 0;
        $productsUpdated = 0;
        $variantsCreated = 0;
        $variantsUpdated = 0;
        $brandsCreated = 0;

        DB::transaction(function () use (
            $rows,
            &$productsCreated,
            &$productsUpdated,
            &$variantsCreated,
            &$variantsUpdated,
            &$brandsCreated
        ) {
            foreach ($rows as $row) {
                $brandName = trim((string) ($row['brand'] ?? ''));
                $productName = trim((string) ($row['product'] ?? '')) ?: '-';
                $priceRaw = $row['price'] ?? '0';
                $varianName = trim((string) ($row['varian'] ?? '')) ?: '-';

                // 1. Resolve or create Brand
                $brandId = null;
                if ($brandName !== '' && $brandName !== '-') {
                    $brand = $this->resolveOrCreateBrand($brandName, $brandsCreated);
                    $brandId = $brand?->id;
                }

                // 2. Resolve or create Product
                $product = $this->resolveOrCreateProduct($productName, $brandId, $productsCreated, $productsUpdated);

                // 3. Resolve or create Product Variant
                $cleanPrice = $this->cleanPrice((string) $priceRaw);
                $volume = $this->extractVolume($varianName);

                $this->resolveOrCreateVariant(
                    $product,
                    $varianName,
                    $volume,
                    $cleanPrice,
                    $variantsCreated,
                    $variantsUpdated
                );
            }
        });

        return [
            'products_created' => $productsCreated,
            'products_updated' => $productsUpdated,
            'variants_created' => $variantsCreated,
            'variants_updated' => $variantsUpdated,
            'brands_created' => $brandsCreated,
            'total_processed' => count($rows),
        ];
    }

    /**
     * Find brand by name or create a new one if not found.
     */
    protected function resolveOrCreateBrand(string $brandName, int &$brandsCreated): ?Brand
    {
        $cacheKey = mb_strtolower(trim($brandName));
        if (isset($this->brandCache[$cacheKey])) {
            return $this->brandCache[$cacheKey];
        }

        $brand = $this->findBrandByName($brandName);

        if (! $brand) {
            $uniqueSlug = $this->generateUniqueBrandSlug($brandName);
            $brand = Brand::create([
                'name' => trim($brandName),
                'slug' => $uniqueSlug,
                'description' => '-',
                'description_en' => '-',
            ]);
            $brandsCreated++;
        }

        $this->brandCache[$cacheKey] = $brand;

        return $brand;
    }

    /**
     * Find existing brand by matching name (case-insensitive and trimmed).
     */
    protected function findBrandByName(string $brandName): ?Brand
    {
        $trimmed = trim($brandName);

        // 1. Exact case-insensitive match
        $brand = Brand::whereRaw('LOWER(TRIM(name)) = ?', [mb_strtolower($trimmed)])->first();
        if ($brand) {
            return $brand;
        }

        // 2. Match without spaces (e.g. ALFARES vs AL FARES)
        $noSpace = str_replace(' ', '', mb_strtolower($trimmed));

        return Brand::whereRaw("LOWER(REPLACE(name, ' ', '')) = ?", [$noSpace])->first();
    }

    /**
     * Resolve existing product by name/slug or create a new one.
     */
    protected function resolveOrCreateProduct(
        string $productName,
        ?int $brandId,
        int &$productsCreated,
        int &$productsUpdated
    ): Product {
        $cacheKey = mb_strtolower(trim($productName));
        if (isset($this->productCache[$cacheKey])) {
            return $this->productCache[$cacheKey];
        }

        // Check if product exists in database by name or slug
        $product = Product::whereRaw('LOWER(TRIM(name)) = ?', [$cacheKey])
            ->orWhere('slug', Str::slug($productName))
            ->first();

        if ($product) {
            // Update to draft as requested ("aku import ulang ya nanti, update jadi draft")
            $updates = ['is_draft' => true];
            if ($brandId && ! $product->brand_id) {
                $updates['brand_id'] = $brandId;
            }
            $product->update($updates);
            $productsUpdated++;
        } else {
            $slug = $this->generateUniqueProductSlug($productName);

            $product = Product::create([
                'name' => $productName,
                'slug' => $slug,
                'brand_id' => $brandId,
                'description' => '-',
                'description_en' => '-',
                'is_draft' => true,
                'is_new_arrivals' => false,
                'is_best_sellers' => false,
                'is_special_offers' => false,
            ]);

            $productsCreated++;
        }

        $this->productCache[$cacheKey] = $product;

        return $product;
    }

    /**
     * Resolve existing product variant or create a new one.
     */
    protected function resolveOrCreateVariant(
        Product $product,
        string $variantName,
        int $volume,
        int $price,
        int &$variantsCreated,
        int &$variantsUpdated
    ): ProductVariant {
        $existingVariant = ProductVariant::where('product_id', $product->id)
            ->where(function ($q) use ($variantName, $volume) {
                $q->whereRaw('LOWER(TRIM(name)) = ?', [mb_strtolower(trim($variantName))]);
                if ($volume > 0) {
                    $q->orWhere('volume', $volume);
                }
            })
            ->first();

        if ($existingVariant) {
            $existingVariant->update([
                'price' => $price > 0 ? $price : $existingVariant->price,
                'stock' => max($existingVariant->stock, 20),
            ]);
            $variantsUpdated++;

            return $existingVariant;
        }

        $variantSlug = Str::slug($variantName) ?: 'v1';
        $sku = 'AP-'.$product->id.'-'.($volume ?: '0').'-'.$variantSlug;

        $variant = ProductVariant::create([
            'product_id' => $product->id,
            'name' => $variantName,
            'volume' => $volume,
            'price' => $price,
            'original_price' => null,
            'discount_percent' => null,
            'sku' => $sku,
            'stock' => 20,
        ]);

        $variantsCreated++;

        return $variant;
    }

    /**
     * Clean and parse price strings into integer (e.g. "412,500" -> 412500, "Rp 412.500,00" -> 412500).
     */
    public function cleanPrice(string $priceStr): int
    {
        $str = trim($priceStr);
        if ($str === '') {
            return 0;
        }

        // Strip decimal zero cents at end (e.g. ,00 or .00)
        $str = preg_replace('/[,\.]00$/', '', $str);

        // Remove non-digit characters
        $digits = preg_replace('/[^\d]/', '', $str);

        return (int) $digits;
    }

    /**
     * Extract volume in integer milliliters (e.g. "100 ml" -> 100, "1 Liter" -> 1000).
     */
    public function extractVolume(string $varianStr): int
    {
        $raw = mb_strtolower(trim($varianStr));
        if (str_contains($raw, 'liter') || (str_contains($raw, 'l') && ! str_contains($raw, 'ml'))) {
            $num = (float) filter_var($raw, FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);

            return (int) round($num * 1000);
        }

        $intVal = (int) filter_var($raw, FILTER_SANITIZE_NUMBER_INT);

        return max(0, $intVal);
    }

    /**
     * Generate unique slug for products.
     */
    protected function generateUniqueProductSlug(string $name): string
    {
        $baseSlug = Str::slug($name) ?: 'produk';
        $slug = $baseSlug;
        $count = 1;

        while (Product::where('slug', $slug)->exists()) {
            $count++;
            $slug = "{$baseSlug}-{$count}";
        }

        return $slug;
    }

    /**
     * Generate unique slug for brands.
     */
    protected function generateUniqueBrandSlug(string $name): string
    {
        $baseSlug = Str::slug($name) ?: 'brand';
        $slug = $baseSlug;
        $count = 1;

        while (Brand::where('slug', $slug)->exists()) {
            $count++;
            $slug = "{$baseSlug}-{$count}";
        }

        return $slug;
    }

    /**
     * Generate a downloadable sample CSV template.
     */
    public function generateTemplateCsv(): string
    {
        $output = fopen('php://temp', 'r+');
        fputcsv($output, ['Brand', 'Product', 'Price', 'Varian'], ',', '"', '\\');
        fputcsv($output, [
            'AL FARES',
            'Al Fares Khayal Al Faris Edp inspired by Parfums De Marly Greenley',
            '412,500',
            '100 ml',
        ], ',', '"', '\\');

        rewind($output);
        $csv = stream_get_contents($output);
        fclose($output);

        return (string) $csv;
    }
}

