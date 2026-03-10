<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vehicles', function (Blueprint $table) {
            // Rename mileage column to odometer_reading
            $table->renameColumn('mileage', 'odometer_reading');
        });
    }

    public function down(): void
    {
        Schema::table('vehicles', function (Blueprint $table) {
            // Revert to mileage if migration is rolled back
            $table->renameColumn('odometer_reading', 'mileage');
        });
    }
};
