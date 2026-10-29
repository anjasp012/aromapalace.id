<?php

namespace App\Support;

use App\Models\Setting;

/**
 * Mobile app update policy shown by resources/js/components/AppUpdateModal.tsx.
 *
 * iOS and Android are versioned and released separately (App Store review vs Play Store),
 * so each platform has its own minimum/latest version. The shared app_min_version /
 * app_latest_version settings remain as a fallback.
 */
class AppUpdatePolicy
{
    public const DEFAULT_TITLE = 'Pembaruan Aplikasi Tersedia';

    public const DEFAULT_MESSAGE = 'Versi baru aplikasi Aroma Palace telah tersedia dengan peningkatan fitur dan stabilitas. Mohon perbarui aplikasi Anda untuk melanjutkan berbelanja.';

    public const DEFAULT_PLAYSTORE_URL = 'https://play.google.com/store/apps/details?id=com.aromapalace.app';

    public const DEFAULT_APPSTORE_URL = 'https://apps.apple.com/app/id6825154655';

    /**
     * @return array<string, mixed>
     */
    public static function toArray(): array
    {
        $minVersion = (string) Setting::get('app_min_version', '1.0.0');
        $latestVersion = (string) Setting::get('app_latest_version', '1.0.0');

        return [
            'min_version' => $minVersion,
            'latest_version' => $latestVersion,
            'force_update' => filter_var(Setting::get('app_force_update', false), FILTER_VALIDATE_BOOLEAN),
            'title' => (string) Setting::get('app_update_title', self::DEFAULT_TITLE),
            'message' => (string) Setting::get('app_update_message', self::DEFAULT_MESSAGE),
            'playstore_url' => (string) Setting::get('app_playstore_url', self::DEFAULT_PLAYSTORE_URL),
            'appstore_url' => (string) Setting::get('app_appstore_url', self::DEFAULT_APPSTORE_URL),
            'platforms' => [
                'ios' => [
                    'min_version' => (string) Setting::get('app_min_version_ios', $minVersion),
                    'latest_version' => (string) Setting::get('app_latest_version_ios', $latestVersion),
                ],
                'android' => [
                    'min_version' => (string) Setting::get('app_min_version_android', $minVersion),
                    'latest_version' => (string) Setting::get('app_latest_version_android', $latestVersion),
                ],
            ],
        ];
    }
}
