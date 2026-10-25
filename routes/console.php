<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Auto cancel pending orders older than 24 hours, restore stock, and push FCM notification
Schedule::command('orders:cancel-expired')->everyTenMinutes();

// Auto complete delivered orders older than 3 days
Schedule::command('orders:auto-complete')->everyTenMinutes();
