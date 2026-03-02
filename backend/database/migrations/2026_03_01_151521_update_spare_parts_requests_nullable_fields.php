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
        Schema::table('spare_parts_requests', function (Blueprint $table) {
            $table->integer('quantity')->nullable()->default(null)->change();
            $table->decimal('unit_cost', 10, 2)->nullable()->default(null)->change();
            $table->decimal('selling_price', 10, 2)->nullable()->default(null)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('spare_parts_requests', function (Blueprint $table) {
            $table->integer('quantity')->nullable(false)->default(1)->change();
            $table->decimal('unit_cost', 10, 2)->nullable(false)->default(0)->change();
            $table->decimal('selling_price', 10, 2)->nullable(false)->default(0)->change();
        });
    }
};
