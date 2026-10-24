<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$s = app(App\Services\KiriminAjaService::class);
$res = KiriminAja\Services\KiriminAja::getProvince();
var_dump($res);
