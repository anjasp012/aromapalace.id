<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
        ]);
    }
}
