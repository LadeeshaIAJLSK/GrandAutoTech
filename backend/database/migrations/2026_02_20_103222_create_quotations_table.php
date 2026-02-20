<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quotations', function (Blueprint $table) {
            $table->id();
            $table->string('quotation_number')->unique(); // QT-2026-0001
            $table->foreignId('customer_id')->constrained()->onDelete('cascade');
            $table->foreignId('vehicle_id')->constrained()->onDelete('cascade');
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->foreignId('branch_id')->nullable()->constrained()->onDelete('set null');
            
            $table->text('customer_complaint')->nullable();
            $table->text('inspection_notes')->nullable();
            $table->text('recommended_work')->nullable();
            
            // Pricing
            $table->decimal('labor_cost', 10, 2)->default(0);
            $table->decimal('parts_cost', 10, 2)->default(0);
            $table->decimal('other_charges', 10, 2)->default(0);
            $table->decimal('discount', 10, 2)->default(0);
            $table->decimal('total_amount', 10, 2)->default(0);
            
            $table->enum('status', [
                'draft',
                'sent',
                'approved',
                'rejected',
                'converted', // Converted to job card
                'expired'
            ])->default('draft');
            
            $table->date('valid_until')->nullable();
            $table->dateTime('approved_at')->nullable();
            $table->dateTime('converted_at')->nullable();
            $table->foreignId('job_card_id')->nullable()->constrained()->onDelete('set null');
            
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->index('quotation_number');
            $table->index('customer_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quotations');
    }
};