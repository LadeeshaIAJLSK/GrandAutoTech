<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('spare_parts_requests', function (Blueprint $table) {
            // First update NULL values to defaults
            DB::statement("UPDATE spare_parts_requests SET quantity = 1 WHERE quantity IS NULL");
            DB::statement("UPDATE spare_parts_requests SET unit_cost = 0 WHERE unit_cost IS NULL");
            DB::statement("UPDATE spare_parts_requests SET selling_price = 0 WHERE selling_price IS NULL");
            DB::statement("UPDATE spare_parts_requests SET total_cost = 0 WHERE total_cost IS NULL");
        });

        // Then modify column constraints
        Schema::table('spare_parts_requests', function (Blueprint $table) {
            $table->integer('quantity')->nullable(false)->default(1)->change();
            $table->decimal('unit_cost', 10, 2)->nullable(false)->default(0)->change();
            $table->decimal('selling_price', 10, 2)->nullable(false)->default(0)->change();
            $table->decimal('total_cost', 10, 2)->nullable(false)->default(0)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('spare_parts_requests', function (Blueprint $table) {
            $table->integer('quantity')->nullable()->default(null)->change();
            $table->decimal('unit_cost', 10, 2)->nullable()->default(null)->change();
            $table->decimal('selling_price', 10, 2)->nullable()->default(null)->change();
            $table->decimal('total_cost', 10, 2)->nullable()->default(null)->change();
        });
    }
};
