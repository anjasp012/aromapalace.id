<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Add latitude and longitude to user_addresses
        Schema::table('user_addresses', function (Blueprint $table) {
            $table->double('latitude')->nullable()->after('address');
            $table->double('longitude')->nullable()->after('latitude');
        });

        // 2. Create shipping table related to orders
        Schema::create('shipping', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->string('awb')->nullable()->index();
            $table->text('text')->nullable();
            $table->json('image')->nullable();
            $table->json('origin')->nullable();
            $table->json('destination')->nullable();
            $table->json('histories')->nullable();
            $table->timestamps();
        });

        // 3. Migrate existing order addresses and tracking numbers into shipping table
        $existingOrders = DB::table('orders')->get();
        foreach ($existingOrders as $order) {
            $origin = [
                'store_name' => 'Aroma Palace Store',
                'phone' => '081234567890',
                'address' => 'Jl. Kemang Raya No. 10, Jakarta Selatan',
                'city_name' => 'Jakarta Selatan',
                'postal_code' => '12790',
            ];

            $destination = [
                'recipient_name' => $order->recipient_name ?? null,
                'recipient_phone' => $order->recipient_phone ?? null,
                'address' => $order->shipping_address ?? null,
                'province_name' => $order->province_name ?? null,
                'city_name' => $order->city_name ?? ($order->city ?? null),
                'district_name' => $order->district_name ?? null,
                'subdistrict_name' => $order->subdistrict_name ?? null,
                'postal_code' => $order->postal_code ?? null,
                'latitude' => null,
                'longitude' => null,
            ];

            DB::table('shipping')->insert([
                'order_id' => $order->id,
                'awb' => $order->tracking_number ?? null,
                'text' => $order->tracking_number ? 'Dalam proses pengiriman' : 'Menunggu pengiriman',
                'image' => json_encode([]),
                'origin' => json_encode($origin),
                'destination' => json_encode($destination),
                'histories' => json_encode([
                    [
                        'time' => (string) ($order->created_at ?? now()),
                        'status' => 'Pesanan Dibuat',
                        'note' => 'Pesanan berhasil dibuat.',
                    ],
                ]),
                'created_at' => $order->created_at ?? now(),
                'updated_at' => $order->updated_at ?? now(),
            ]);
        }

        // 4. Drop address & tracking_number columns from orders table
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'shipping_address',
                'province_name',
                'city_name',
                'district_name',
                'subdistrict_name',
                'postal_code',
                'tracking_number',
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 1. Recreate columns in orders
        Schema::table('orders', function (Blueprint $table) {
            $table->text('shipping_address')->nullable()->after('recipient_phone');
            $table->string('province_name', 100)->nullable()->after('shipping_address');
            $table->string('city_name', 100)->nullable()->after('province_name');
            $table->string('district_name', 100)->nullable()->after('city_name');
            $table->string('subdistrict_name', 100)->nullable()->after('district_name');
            $table->string('postal_code')->nullable()->after('subdistrict_name');
            $table->string('tracking_number', 100)->nullable()->after('courier');
        });

        // 2. Restore data from shipping table
        $shippings = DB::table('shipping')->get();
        foreach ($shippings as $s) {
            $dest = json_decode($s->destination ?? '{}', true) ?: [];
            DB::table('orders')->where('id', $s->order_id)->update([
                'shipping_address' => $dest['address'] ?? null,
                'province_name' => $dest['province_name'] ?? null,
                'city_name' => $dest['city_name'] ?? null,
                'district_name' => $dest['district_name'] ?? null,
                'subdistrict_name' => $dest['subdistrict_name'] ?? null,
                'postal_code' => $dest['postal_code'] ?? null,
                'tracking_number' => $s->awb,
            ]);
        }

        // 3. Drop shipping table
        Schema::dropIfExists('shipping');

        // 4. Drop latitude and longitude from user_addresses
        Schema::table('user_addresses', function (Blueprint $table) {
            $table->dropColumn(['latitude', 'longitude']);
        });
    }
};
