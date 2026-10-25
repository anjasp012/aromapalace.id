<?php

use App\Services\KiriminAjaService;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;

test('getPickupSchedules parses successful carrier schedules and ignores holidays', function () {
    Http::fake([
        '*/api/mitra/v2/schedules' => Http::response([
            'status' => true,
            'schedules' => [
                [
                    'clock' => '2026-10-26 08:00:00',
                    'until' => '22:00',
                    'libur' => false,
                ],
                [
                    'clock' => '2026-10-26 11:00:00',
                    'until' => '22:00',
                    'libur' => true, // Holiday, should be ignored
                ],
                [
                    'clock' => '2026-10-26 14:00:00',
                    'until' => '22:00',
                    'libur' => false,
                ],
            ],
        ], 200),
    ]);

    $service = app(KiriminAjaService::class);
    $schedules = $service->getPickupSchedules();

    expect($schedules)->toHaveCount(2)
        ->and($schedules[0]['clock'])->toBe('2026-10-26 08:00:00')
        ->and($schedules[0]['is_fallback'])->toBeFalse()
        ->and($schedules[1]['clock'])->toBe('2026-10-26 14:00:00')
        ->and($schedules[1]['is_fallback'])->toBeFalse();
});

test('getPickupSchedules returns fallback slots when carrier returns empty or holidays', function () {
    Http::fake([
        '*/api/mitra/v2/schedules' => Http::response([
            'status' => true,
            'schedules' => [],
        ], 200),
    ]);

    $service = app(KiriminAjaService::class);
    $schedules = $service->getPickupSchedules();

    expect($schedules)->not->toBeEmpty()
        ->and($schedules[0])->toHaveKeys(['clock', 'until', 'is_fallback'])
        ->and($schedules[0]['is_fallback'])->toBeTrue();
});

test('getPickupSchedules returns fallback slots safely on network timeout or exception', function () {
    Http::fake([
        '*/api/mitra/v2/schedules' => function () {
            throw new ConnectionException('Connection timed out');
        },
    ]);

    $service = app(KiriminAjaService::class);
    $schedules = $service->getPickupSchedules();

    expect($schedules)->not->toBeEmpty()
        ->and($schedules[0]['is_fallback'])->toBeTrue();
});
