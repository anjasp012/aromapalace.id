<?php

use App\Models\LoyaltyPointHistory;
use App\Models\Order;
use App\Models\User;
use App\Models\Voucher;
use App\Services\MembershipService;
use Inertia\Testing\AssertableInertia as Assert;

test('guest can view membership page with catalog', function () {
    $response = $this->get(route('membership.index'));

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('membership')
            ->where('is_member', false)
            ->where('membership', null)
            ->has('rewards')
        );
});

test('user can join royale membership and receive 100 bonus welcome points', function () {
    $user = User::factory()->create([
        'name' => 'Sultan Hamengku',
        'email' => 'sultan@aromapalace.id',
    ]);

    expect($user->membership)->toBeNull();

    $response = $this->actingAs($user)->post(route('membership.join'));

    $response->assertSessionHas('success');

    $membership = $user->fresh()->membership;
    expect($membership)->not->toBeNull();
    expect($membership->points)->toBe(100);
    expect($membership->lifetime_points)->toBe(100);
    expect($membership->membership_number)->toStartWith('AP-ROYALE-');

    // Check point history recorded
    $history = LoyaltyPointHistory::where('membership_id', $membership->id)->first();
    expect($history)->not->toBeNull();
    expect($history->type)->toBe('bonus');
    expect($history->points)->toBe(100);
    expect($history->balance_after)->toBe(100);
});

test('authenticated member can view their membership status, points, and history', function () {
    $user = User::factory()->create();
    $service = app(MembershipService::class);
    $service->join($user);

    $response = $this->actingAs($user)->get(route('membership.index'));

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('membership')
            ->where('is_member', true)
            ->where('membership.points', 100)
            ->has('histories', 1)
            ->has('rewards')
        );
});

test('completing an order awards loyalty points only when status is selesai (1 point per Rp 10.000 spent)', function () {
    $user = User::factory()->create();
    $service = app(MembershipService::class);
    $membership = $service->join($user);

    // Initial points: 100
    expect($membership->points)->toBe(100);

    // Create an order of Rp 500.000 with status diproses
    $order = Order::create([
        'order_number' => 'ARPL-ORDER-TEST-PTS',
        'user_id' => $user->id,
        'recipient_name' => 'Dimas',
        'recipient_phone' => '081234567890',
        'address' => 'Jl. Senopati',
        'city' => 'Jakarta Selatan',
        'payment_method' => 'credit_card',
        'payment_status' => 'paid',
        'status' => 'diproses',
        'subtotal' => 500000,
        'discount_amount' => 0,
        'total_amount' => 500000,
    ]);

    // Should NOT award points while status is diproses
    $result = $service->awardOrderPoints($order);
    expect($result)->toBeNull();

    $membership->refresh();
    expect($membership->points)->toBe(100);

    // Now update status to selesai
    $order->update(['status' => 'selesai']);

    // Should award points when status is selesai
    $service->awardOrderPoints($order);

    $membership->refresh();
    expect($membership->points)->toBe(150);
    expect($membership->lifetime_points)->toBe(150);

    // Verify history was created
    $orderHistory = LoyaltyPointHistory::where('membership_id', $membership->id)
        ->where('type', 'earned')
        ->first();

    expect($orderHistory)->not->toBeNull();
    expect($orderHistory->points)->toBe(50);
    expect($orderHistory->balance_after)->toBe(150);
    expect($orderHistory->reference_id)->toBe('ARPL-ORDER-TEST-PTS');
});

test('user can redeem loyalty points for a voucher reward', function () {
    $user = User::factory()->create();
    $service = app(MembershipService::class);
    $membership = $service->join($user);

    // Give user 500 points
    $membership->update([
        'points' => 500,
        'lifetime_points' => 500,
    ]);

    $reward = Voucher::where('voucher_type', 'reward')->whereNull('user_id')->where('points_required', '<=', 500)->first();
    if (! $reward) {
        $reward = Voucher::create([
            'code' => 'REW-TEST50K',
            'name' => 'Voucher Diskon Rp 50.000',
            'description' => 'Potongan langsung Rp 50.000',
            'points_required' => 200,
            'type' => 'fixed',
            'value' => 50000,
            'min_order_amount' => 150000,
            'voucher_type' => 'reward',
            'user_id' => null,
            'is_active' => true,
        ]);
    }

    $response = $this->actingAs($user)->post(route('membership.redeem', $reward));

    $response->assertSessionHas('success');

    $membership->refresh();
    expect($membership->points)->toBe(500 - $reward->points_required);

    // Check that a redeemed voucher was created in vouchers table for this user
    $userVoucher = Voucher::where('user_id', $user->id)->where('value', $reward->value)->latest()->first();
    expect($userVoucher)->not->toBeNull();
    expect($userVoucher->is_active)->toBeTrue();
    expect($userVoucher->code)->toStartWith('REW-');

    // Check that redemption history was logged
    $redeemHistory = LoyaltyPointHistory::where('membership_id', $membership->id)
        ->where('type', 'redeemed')
        ->first();

    expect($redeemHistory)->not->toBeNull();
    expect($redeemHistory->points)->toBe(-$reward->points_required);
    expect($redeemHistory->reference_id)->toBe($userVoucher->code);
});

test('user cannot redeem reward if points are insufficient', function () {
    $user = User::factory()->create();
    $service = app(MembershipService::class);
    $membership = $service->join($user);

    // User only has 100 points
    expect($membership->points)->toBe(100);

    $reward = Voucher::create([
        'code' => 'REW-TEST200K',
        'name' => 'Voucher Diskon Rp 200.000',
        'description' => 'Potongan langsung Rp 200.000',
        'points_required' => 800,
        'type' => 'fixed',
        'value' => 200000,
        'min_order_amount' => 500000,
        'voucher_type' => 'reward',
        'user_id' => null,
        'is_active' => true,
    ]);

    $response = $this->actingAs($user)->post(route('membership.redeem', $reward));

    $response->assertSessionHas('error');
    $membership->refresh();
    expect($membership->points)->toBe(100);
});
