<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Replace the placeholder App Store link (id6740000000) with the real Aroma Palace app.
     */
    public function up(): void
    {
        DB::table('settings')
            ->where('key', 'app_appstore_url')
            ->where('value', 'like', '%id6740000000%')
            ->update(['value' => 'https://apps.apple.com/app/id6825154655', 'updated_at' => now()]);
    }

    public function down(): void
    {
        //
    }
};
