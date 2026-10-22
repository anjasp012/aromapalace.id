<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'pakasir' => [
        'slug' => env('PAKASIR_SLUG', 'aromapalace-id'),
        'api_key' => env('PAKASIR_API_KEY'),
        'webhook_secret' => env('PAKASIR_WEBHOOK_SECRET'),
        'base_url' => env('PAKASIR_BASE_URL', 'https://app.pakasir.com'),
    ],

    'kiriminaja' => [
        'mode' => env('KIRIMINAJA_MODE', 'staging'),
        'api_key' => env('KIRIMINAJA_API_KEY', 'v4.local.4SJhuA3f8eNSoRjtlkJRMcGpjEELOLzSIWl8HaJ7vnYVVHUe8-NHIU-gEE7BiowIF6GYKQP_FBodo0rJw1eNXa9DvDA0xNs-RzVZN8JarOkS3ZROhXYezDbTgRQknMnNyna9E8hXdagBB6gz6MsWj9OAeKaVIzYiARCbfPQs'),
        'base_url' => env('KIRIMINAJA_BASE_URL'),
        'pin' => env('KIRIMINAJA_PIN', '123456'),
        'prefix' => env('KIRIMINAJA_PREFIX', 'ARPL'),
        'cache_store' => env('KIRIMINAJA_CACHE_STORE', 'file'),
        'cache_prefix' => env('KIRIMINAJA_CACHE_PREFIX', 'kiriminaja:'),
    ],

];
