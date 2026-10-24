<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$s = app(App\Services\KiriminAjaService::class);
$rates = $s->getShippingRates(2101, 2087, 1000);
echo "Rates count: " . count($rates) . "\n";
if (!empty($rates)) {
    echo "First rate: " . json_encode($rates[0]) . "\n";
    echo "Second rate: " . json_encode($rates[1]) . "\n";
}
