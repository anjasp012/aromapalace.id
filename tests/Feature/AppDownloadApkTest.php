<?php

use App\Models\Setting;

test('app release apk endpoint serves binary apk download with correct headers', function () {
    $response = $this->get('/app-release.apk');

    $response->assertOk();
    $response->assertHeader('Content-Type', 'application/vnd.android.package-archive');
    expect($response->headers->get('Content-Disposition'))->toContain('attachment');
    expect($response->headers->get('Content-Disposition'))->toContain('Aroma-Palace.apk');
});

test('download apk alias endpoint serves binary apk download', function () {
    $response = $this->get('/download/apk');

    $response->assertOk();
    $response->assertHeader('Content-Type', 'application/vnd.android.package-archive');
});

test('download apk redirects to custom external apk url if set in settings', function () {
    Setting::set('app_apk_url', 'https://storage.googleapis.com/custom/aroma.apk', 'app_update', 'string');

    $response = $this->get('/app-release.apk');

    $response->assertRedirect('https://storage.googleapis.com/custom/aroma.apk');

    Setting::where('key', 'app_apk_url')->delete();
    Setting::clearCache();
});
