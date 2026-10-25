<?php

use App\Models\Setting;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Http;

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

$apiKey = Setting::get('kiriminaja_api_key');
$mode = Setting::get('kiriminaja_mode', 'staging');
$baseUrl = $mode === 'production' ? 'https://client.kiriminaja.com' : 'https://tdev.kiriminaja.com';

$res = Http::withToken($apiKey)->post("{$baseUrl}/api/mitra/city", [
    'provinsi_id' => 6,
]);
echo 'Status: '.$res->status()."\n";
echo 'Body: '.$res->body()."\n";
