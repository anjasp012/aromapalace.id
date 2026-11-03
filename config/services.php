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

    'rajaongkir' => [
        'shipping_key' => env('RAJAONGKIR_API_SPIPPING_KEY', env('RAJAONGKIR_API_SHIPPING_KEY', env('RAJAONGKIR_SHIPPING_KEY'))),
        'payment_key' => env('RAJAONGKIR_API_PAYMENT_KEY', env('RAJAONGKIR_PAYMENT_KEY')),
        'callback_url' => env('RAJAONGKIR_API_CALLBACK_URL', env('RAJAONGKIR_CALLBACK_URL')),
        'callback_api_key' => env('RAJAONGKIR_API_CALLBACK_API_KEY', env('RAJAONGKIR_CALLBACK_API_KEY')),
    ],
];
