<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->onDelete('cascade');
            $table->string('license_plate')->unique();
            $table->string('make'); // Brand (Toyota, Honda, etc.)
            $table->string('model'); // Corolla, Civic, etc.
            $table->string('year'); // 2020, 2021, etc.
            $table->string('color')->nullable();
            $table->string('vin')->nullable(); // Vehicle Identification Number
            $table->string('engine_number')->nullable();
            $table->string('chassis_number')->nullable();
            $table->integer('mileage')->nullable(); // Current odometer reading
            $table->string('fuel_type')->nullable(); // Petrol, Diesel, Electric, Hybrid
            $table->string('transmission')->nullable(); // Manual, Automatic
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            // Indexes for fast search
            $table->index('license_plate');
            $table->index('customer_id');
            $table->index('make');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicles');
    }
};