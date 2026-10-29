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
        Schema::table('payment_methods', function (Blueprint $table) {
            if (! Schema::hasColumn('payment_methods', 'type')) {
                $table->string('type')->default('automatic')->after('icon')->index();
            }
            if (! Schema::hasColumn('payment_methods', 'account_number')) {
                $table->string('account_number')->nullable()->after('type');
            }
            if (! Schema::hasColumn('payment_methods', 'account_name')) {
                $table->string('account_name')->nullable()->after('account_number');
            }
            if (! Schema::hasColumn('payment_methods', 'instructions')) {
                $table->text('instructions')->nullable()->after('account_name');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payment_methods', function (Blueprint $table) {
            $table->dropColumn(['type', 'account_number', 'account_name', 'instructions']);
        });
    }
};
