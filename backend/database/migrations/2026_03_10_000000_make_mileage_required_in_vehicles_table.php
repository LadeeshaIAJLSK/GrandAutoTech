<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vehicles', function (Blueprint $table) {
            // Make mileage required (remove nullable)
            $table->integer('mileage')->nullable(false)->change();
        });
    }

    public function down(): void
    {
        Schema::table('vehicles', function (Blueprint $table) {
            // Revert to nullable if migration is rolled back
            $table->integer('mileage')->nullable()->change();
        });
    }
};
