<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AppUpdateController extends Controller
{
    /**
     * Check current mobile app version requirements and update policy.
     */
    public function check(Request $request): JsonResponse
    {
        return response()->json([
            'min_version' => (string) Setting::get('app_min_version', '1.0.0'),
            'latest_version' => (string) Setting::get('app_latest_version', '1.0.0'),
            'force_update' => filter_var(Setting::get('app_force_update', false), FILTER_VALIDATE_BOOLEAN),
            'title' => (string) Setting::get('app_update_title', 'Pembaruan Aplikasi Tersedia'),
            'message' => (string) Setting::get('app_update_message', 'Versi baru aplikasi Aroma Palace telah tersedia dengan peningkatan fitur dan stabilitas. Mohon perbarui aplikasi Anda untuk melanjutkan berbelanja.'),
            'playstore_url' => (string) Setting::get('app_playstore_url', 'https://play.google.com/store/apps/details?id=com.aromapalace.app'),
            'appstore_url' => (string) Setting::get('app_appstore_url', 'https://apps.apple.com/app/aromapalace/id6740000000'),
            'apk_url' => (string) Setting::get('app_apk_url', ''),
        ]);
    }

    /**
     * Download or redirect to the Android APK file with correct binary MIME headers.
     */
    public function downloadApk(): Response
    {
        // 1. Check if an external direct APK URL is set in CMS settings
        $apkSettingUrl = (string) Setting::get('app_apk_url', '');
        if (! empty($apkSettingUrl) && filter_var($apkSettingUrl, FILTER_VALIDATE_URL)) {
            return redirect()->away($apkSettingUrl);
        }

        // 2. Look for the physical APK file on disk
        $candidatePaths = [
            public_path('app-release.apk'),
            base_path('android/app/release/app-release.apk'),
            base_path('android/app/build/outputs/apk/release/app-release.apk'),
            base_path('android/app/build/outputs/apk/debug/app-debug.apk'),
        ];

        foreach ($candidatePaths as $filePath) {
            if (file_exists($filePath) && is_readable($filePath) && filesize($filePath) > 1000) {
                return response()->download($filePath, 'Aroma-Palace.apk', [
                    'Content-Type' => 'application/vnd.android.package-archive',
                    'Content-Disposition' => 'attachment; filename="Aroma-Palace.apk"',
                    'Content-Length' => (string) filesize($filePath),
                    'Cache-Control' => 'no-cache, private',
                ]);
            }
        }

        // 3. Fallback to Google Play Store URL from Settings
        $playStoreUrl = (string) Setting::get('app_playstore_url', '');
        if (! empty($playStoreUrl) && filter_var($playStoreUrl, FILTER_VALIDATE_URL)) {
            return redirect()->away($playStoreUrl);
        }

        return redirect()->away('https://play.google.com/store/apps/details?id=com.aromapalace.app');
    }
}
