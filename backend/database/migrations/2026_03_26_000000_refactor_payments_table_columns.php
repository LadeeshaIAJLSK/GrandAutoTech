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
        Schema::table('payments', function (Blueprint $table) {
            // Add specific columns for each payment method
            $table->string('card_number')->nullable()->after('bank_name');
            $table->string('cheque_number')->nullable()->after('card_number');
            $table->string('bank_transaction_id')->nullable()->after('cheque_number');
            
            // Drop the generic reference_number column
            $table->dropColumn('reference_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            // Add back the generic reference_number column
            $table->string('reference_number')->nullable()->after('bank_name');
            
            // Drop the specific columns
            $table->dropColumn(['card_number', 'cheque_number', 'bank_transaction_id']);
        });
    }
};
