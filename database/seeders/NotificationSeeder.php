<?php

namespace Database\Seeders;

use App\Models\Notification;
use App\Models\Order;
use Illuminate\Database\Seeder;

class NotificationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $latestOrder = Order::latest('id')->first();
        $orderNumber = $latestOrder ? $latestOrder->order_number : 'ORD-20261022-001';
        $orderId = $latestOrder ? $latestOrder->id : 1;

        Notification::firstOrCreate(
            ['title' => "🛍️ Pesanan Baru Masuk! #{$orderNumber}"],
            [
                'for_admin' => true,
                'type' => 'new_order',
                'body' => 'Pesanan baru dari Budi Santoso senilai Rp 1.450.000 sedang menunggu diproses.',
                'url' => "/manajemen-pesanan/{$orderId}",
                'data' => ['order_id' => $orderId, 'order_number' => $orderNumber],
                'is_read' => false,
                'created_at' => now()->subMinutes(12),
            ]
        );

        Notification::firstOrCreate(
            ['title' => "💰 Pembayaran Diterima! #{$orderNumber}"],
            [
                'for_admin' => true,
                'type' => 'payment_success',
                'body' => 'Pembayaran Rp 1.450.000 via BCA Virtual Account telah lunas.',
                'url' => "/manajemen-pesanan/{$orderId}",
                'data' => ['order_id' => $orderId, 'order_number' => $orderNumber],
                'is_read' => false,
                'created_at' => now()->subMinutes(8),
            ]
        );

        Notification::firstOrCreate(
            ['title' => '🎁 Voucher Promo Diaktifkan'],
            [
                'for_admin' => true,
                'type' => 'voucher_reward',
                'body' => 'Voucher AROMA20 (Diskon 20%) telah disiarkan ke pelanggan.',
                'url' => '/manajemen-voucher',
                'data' => ['voucher_code' => 'AROMA20'],
                'is_read' => true,
                'read_at' => now()->subHours(1),
                'created_at' => now()->subHours(2),
            ]
        );
    }
}
