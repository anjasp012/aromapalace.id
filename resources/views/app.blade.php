<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <meta name="mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="default">
        <meta name="format-detection" content="telephone=no">
        @php
            $currentHost = request()->getHost();
            $adminDomain = config('app.admin_domain', env('ADMIN_DOMAIN', 'admin.aromapalace.id'));
            $isAdminDomain = $currentHost === $adminDomain || str_starts_with($currentHost, 'admin.') || request()->is('admin*') || request()->is('manajemen-*');
        @endphp

        @if (! $isAdminDomain)
            <meta name="apple-itunes-app" content="app-id=6825154655">
        @else
            <meta name="admin-cms" content="true">
        @endif

        <link rel="icon" type="image/png" href="/images/logo.png">
        <link rel="manifest" href="/manifest.json">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        <x-inertia::head>
            <title>{{ config('app.name', 'Aroma Palace - Parfum Mewah Dubai') }}</title>
        </x-inertia::head>
    </head>
    <body class="bg-white font-sans text-[#111827] antialiased flex flex-col min-h-screen" style="font-family: 'Outfit', sans-serif;">
        <x-inertia::app />
    </body>
</html>
