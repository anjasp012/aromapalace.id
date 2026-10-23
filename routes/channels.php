<?php

use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('orders.{orderNumber}', function (User $user, string $orderNumber) {
    if ($user->isAdmin()) {
        return true;
    }

    return $user->orders()->where('order_number', $orderNumber)->exists();
});

Broadcast::channel('admin', function (User $user) {
    return $user->isAdmin();
});
