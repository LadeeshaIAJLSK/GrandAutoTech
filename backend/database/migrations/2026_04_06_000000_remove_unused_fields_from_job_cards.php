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
        Schema::table('job_cards', function (Blueprint $table) {
            $table->dropColumn(['initial_inspection_notes', 'recommendations']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('job_cards', function (Blueprint $table) {
            $table->text('initial_inspection_notes')->nullable()->after('customer_complaint');
            $table->text('recommendations')->nullable()->after('initial_inspection_notes');
        });
    }
};
