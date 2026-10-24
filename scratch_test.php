<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$s = app(App\Services\KiriminAjaService::class);
echo "1. Couriers:\n";
$couriers = $s->getCouriers();
echo "Count: " . count($couriers) . " | Sample: " . json_encode($couriers[0]) . "\n";

echo "2. Provinces:\n";
$provinces = $s->getProvinces();
echo "Count: " . count($provinces) . " | Sample: " . json_encode($provinces[0]) . "\n";

echo "3. Shipping Rates (Origin 2101 to Dest 2087, 1000g):\n";
$rates = $s->getShippingRates(2101, 2087, 1000);
echo "Count: " . count($rates) . " | Sample: " . json_encode($rates[0]) . "\n";
