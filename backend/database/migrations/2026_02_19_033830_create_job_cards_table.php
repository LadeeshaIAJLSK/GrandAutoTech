<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('job_cards', function (Blueprint $table) {
            $table->id();
            $table->string('job_card_number')->unique(); // JC-2026-0001
            $table->foreignId('customer_id')->constrained()->onDelete('cascade');
            $table->foreignId('vehicle_id')->constrained()->onDelete('cascade');
            $table->foreignId('branch_id')->constrained()->onDelete('cascade');
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            
            // Job card details
            $table->integer('current_mileage')->nullable();
            $table->enum('status', [
                'pending',        // Just created
                'in_progress',    // Work started
                'waiting_parts',  // Waiting for spare parts approval
                'waiting_customer', // Waiting for customer approval
                'quality_check',  // In inspection
                'completed',      // All work done
                'invoiced',       // Invoice generated
                'paid',          // Payment received
                'cancelled'      // Job cancelled
            ])->default('pending');
            
            $table->text('customer_complaint')->nullable(); // What customer reported
            $table->text('initial_inspection_notes')->nullable(); // Mechanic's initial findings
            $table->text('recommendations')->nullable(); // Recommended additional work
            
            // Pricing
            $table->decimal('labor_cost', 10, 2)->default(0);
            $table->decimal('parts_cost', 10, 2)->default(0);
            $table->decimal('other_charges', 10, 2)->default(0);
            $table->decimal('discount', 10, 2)->default(0);
            $table->decimal('total_amount', 10, 2)->default(0);
            $table->decimal('advance_payment', 10, 2)->default(0);
            $table->decimal('balance_amount', 10, 2)->default(0);
            
            // Dates
            $table->dateTime('estimated_completion_date')->nullable();
            $table->dateTime('actual_completion_date')->nullable();
            $table->dateTime('delivered_date')->nullable();
            
            $table->timestamps();
            
            // Indexes
            $table->index('job_card_number');
            $table->index('customer_id');
            $table->index('vehicle_id');
            $table->index('branch_id');
            $table->index('status');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('job_cards');
    }
};