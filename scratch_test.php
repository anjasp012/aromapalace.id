<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$data = new KiriminAja\Models\ShippingFullPriceData();
$data->origin = 2101;
$data->destination = 2087;
$data->weight = 1000;
$res = KiriminAja\Services\KiriminAja::fullShippingPrice($data);
echo "results count: " . count($res->data['results']) . "\n";
echo "first item: " . json_encode($res->data['results'][0]) . "\n";
