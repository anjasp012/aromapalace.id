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
        // Migrate existing user addresses to user_addresses table if not already present
        if (Schema::hasTable('user_addresses')) {
            $users = DB::table('users')->whereNotNull('address')->where('address', '!=', '')->get();
            foreach ($users as $user) {
                $hasAddress = DB::table('user_addresses')->where('user_id', $user->id)->exists();
                if (! $hasAddress) {
                    DB::table('user_addresses')->insert([
                        'user_id' => $user->id,
                        'label' => 'Alamat Utama',
                        'recipient_name' => $user->name,
                        'recipient_phone' => $user->phone ?? '081234567890',
                        'province_id' => 6,
                        'province_name' => 'DKI Jakarta',
                        'city_id' => 151,
                        'city_name' => $user->city ?? 'Jakarta Barat',
                        'district_id' => 2087,
                        'district_name' => 'Cengkareng',
                        'subdistrict_id' => 17523,
                        'subdistrict_name' => 'Cengkareng Barat',
                        'postal_code' => $user->postal_code ?? '11730',
                        'address' => $user->address,
                        'is_primary' => true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['address', 'city', 'postal_code']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->text('address')->nullable()->after('phone');
            $table->string('city')->nullable()->after('address');
            $table->string('postal_code', 15)->nullable()->after('city');
        });
    }
};
