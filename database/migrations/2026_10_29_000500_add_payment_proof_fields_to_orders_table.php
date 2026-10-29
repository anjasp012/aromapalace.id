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
        Schema::table('orders', function (Blueprint $table) {
            if (! Schema::hasColumn('orders', 'payment_proof')) {
                $table->string('payment_proof')->nullable()->after('payment_status');
            }
            if (! Schema::hasColumn('orders', 'payment_proof_uploaded_at')) {
                $table->timestamp('payment_proof_uploaded_at')->nullable()->after('payment_proof');
            }
            if (! Schema::hasColumn('orders', 'payment_sender_name')) {
                $table->string('payment_sender_name')->nullable()->after('payment_proof_uploaded_at');
            }
            if (! Schema::hasColumn('orders', 'payment_notes')) {
                $table->text('payment_notes')->nullable()->after('payment_sender_name');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['payment_proof', 'payment_proof_uploaded_at', 'payment_sender_name', 'payment_notes']);
        });
    }
};
