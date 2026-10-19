<?php

use App\Models\User;
use App\Services\MembershipService;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;

test('guest is redirected to login when visiting account hub', function () {
    $response = $this->get(route('account.index'));

    $response->assertRedirect(route('login'));
});

test('authenticated user can view their account hub', function () {
    $user = User::factory()->create([
        'name' => 'Anjas Putra',
        'email' => 'anjas@aromapalace.id',
    ]);

    app(MembershipService::class)->join($user);

    $response = $this->actingAs($user)->get(route('account.index'));

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('account')
            ->where('user.name', 'Anjas Putra')
            ->where('user.email', 'anjas@aromapalace.id')
            ->has('membership')
            ->has('order_counts')
            ->where('wishlist_count', 0)
        );
});

test('user can update their profile name', function () {
    $user = User::factory()->create([
        'name' => 'Old Name',
    ]);

    $response = $this->actingAs($user)->patch(route('account.profile.update'), [
        'name' => 'New Luxe Name',
    ]);

    $response->assertSessionHas('success');
    expect($user->fresh()->name)->toBe('New Luxe Name');
});

test('user can update their password with valid current password', function () {
    $user = User::factory()->create([
        'password' => Hash::make('oldpassword123'),
    ]);

    $response = $this->actingAs($user)->patch(route('account.password.update'), [
        'current_password' => 'oldpassword123',
        'password' => 'newpassword123',
        'password_confirmation' => 'newpassword123',
    ]);

    $response->assertSessionHas('success');
    expect(Hash::check('newpassword123', $user->fresh()->password))->toBeTrue();
});
