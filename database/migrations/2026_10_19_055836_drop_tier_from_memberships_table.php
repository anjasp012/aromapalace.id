<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasColumn('memberships', 'tier')) {
            Schema::table('memberships', function (Blueprint $table) {
                $table->dropColumn('tier');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasColumn('memberships', 'tier')) {
            Schema::table('memberships', function (Blueprint $table) {
                $table->string('tier', 30)->default('bronze')->after('membership_number');
            });
        }
    }
};
