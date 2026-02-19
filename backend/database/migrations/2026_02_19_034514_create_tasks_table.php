<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_card_id')->constrained()->onDelete('cascade');
            $table->string('task_name'); // "Engine Oil Change", "Brake Pad Replacement"
            $table->text('description')->nullable();
            $table->enum('category', [
                'mechanical',
                'electrical',
                'bodywork',
                'painting',
                'diagnostic',
                'maintenance',
                'other'
            ])->default('mechanical');
            
            $table->enum('status', [
                'pending',
                'assigned',
                'in_progress',
                'completed',
                'on_hold',
                'cancelled'
            ])->default('pending');
            
            // Pricing
            $table->decimal('labor_hours', 5, 2)->default(0);
            $table->decimal('labor_rate_per_hour', 10, 2)->default(0);
            $table->decimal('labor_cost', 10, 2)->default(0);
            
            // Time tracking
            $table->dateTime('started_at')->nullable();
            $table->dateTime('completed_at')->nullable();
            $table->integer('estimated_duration_minutes')->nullable();
            $table->integer('actual_duration_minutes')->nullable();
            
            $table->text('completion_notes')->nullable();
            $table->integer('priority')->default(0); // 0=normal, 1=high, 2=urgent
            
            $table->timestamps();
            
            $table->index('job_card_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};