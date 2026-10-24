<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$apiKey = \App\Models\Setting::get("kiriminaja_api_key");
$mode = \App\Models\Setting::get("kiriminaja_mode", "staging");
$baseUrl = $mode === 'production' ? 'https://client.kiriminaja.com' : 'https://tdev.kiriminaja.com';

$res = \Illuminate\Support\Facades\Http::withToken($apiKey)->post("{$baseUrl}/api/mitra/city", [
    'provinsi_id' => 6,
]);
echo "Status: " . $res->status() . "\n";
echo "Body: " . $res->body() . "\n";
