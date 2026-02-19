<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->string('payment_number')->unique(); // PAY-2026-0001
            $table->foreignId('job_card_id')->constrained()->onDelete('cascade');
            $table->foreignId('invoice_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('customer_id')->constrained()->onDelete('cascade');
            $table->foreignId('received_by')->constrained('users')->onDelete('cascade');
            
            $table->decimal('amount', 10, 2);
            $table->enum('payment_type', ['advance', 'partial', 'full', 'refund'])->default('full');
            $table->enum('payment_method', [
                'cash',
                'card',
                'bank_transfer',
                'cheque',
                'mobile_payment',
                'other'
            ])->default('cash');
            
            $table->string('reference_number')->nullable(); // Cheque number, transaction ID
            $table->date('payment_date');
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->index('job_card_id');
            $table->index('invoice_id');
            $table->index('customer_id');
            $table->index('payment_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};