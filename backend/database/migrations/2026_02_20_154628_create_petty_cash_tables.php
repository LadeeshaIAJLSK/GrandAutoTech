<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Petty Cash Funds (main fund tracking)
        Schema::create('petty_cash_funds', function (Blueprint $table) {
            $table->id();
            $table->string('fund_name'); // e.g., "Main Office Fund", "Workshop Fund"
            $table->foreignId('branch_id')->constrained()->onDelete('cascade');
            $table->foreignId('custodian_id')->constrained('users')->onDelete('cascade'); // Who manages it
            $table->decimal('initial_amount', 10, 2);
            $table->decimal('current_balance', 10, 2);
            $table->decimal('replenishment_threshold', 10, 2)->default(1000); // Alert when below this
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Petty Cash Transactions
        Schema::create('petty_cash_transactions', function (Blueprint $table) {
            $table->id();
            $table->string('transaction_number')->unique(); // PC-2026-0001
            $table->foreignId('fund_id')->constrained('petty_cash_funds')->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Who made transaction
            $table->enum('type', ['expense', 'replenishment']); // expense = money out, replenishment = money in
            $table->decimal('amount', 10, 2);
            $table->string('category'); // fuel, supplies, parts, tools, delivery, misc
            $table->string('description');
            $table->string('receipt_number')->nullable();
            $table->string('receipt_image')->nullable(); // Store receipt photo
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->dateTime('approved_at')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->text('rejection_reason')->nullable();
            $table->date('transaction_date');
            $table->timestamps();
            
            $table->index('transaction_number');
            $table->index('fund_id');
            $table->index('status');
        });

        // Petty Cash Categories
        Schema::create('petty_cash_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('icon')->default('💰');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('petty_cash_transactions');
        Schema::dropIfExists('petty_cash_funds');
        Schema::dropIfExists('petty_cash_categories');
    }
};