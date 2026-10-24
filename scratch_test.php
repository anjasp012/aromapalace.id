<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

Illuminate\Support\Facades\Cache::forget('kiriminaja:provinces');
$s = app(App\Services\KiriminAjaService::class);
$provinces = $s->getProvinces();
echo "Provinces count: " . count($provinces) . "\n";
echo "First province: " . json_encode($provinces[0]) . "\n";

$data = new KiriminAja\Models\ShippingFullPriceData();
$data->origin = 2101;
$data->destination = 2087;
$data->weight = 1000;
$res = KiriminAja\Services\KiriminAja::fullShippingPrice($data);
$pricing = $res->data['pricing'] ?? [];
echo "Pricing count: " . count($pricing) . "\n";
echo "First pricing item: " . json_encode($pricing[0]) . "\n";
