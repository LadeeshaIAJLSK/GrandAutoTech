<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('quotation_items', function (Blueprint $table) {
            // Change the enum to include 'other_charges'
            // For MySQL, we need to modify the enum type
            if (DB::getDriverName() === 'mysql') {
                DB::statement("ALTER TABLE quotation_items MODIFY item_type ENUM('task', 'spare_part', 'other_charges') NOT NULL");
            } else {
                // For other databases, drop and recreate the column
                $table->dropColumn('item_type');
                $table->enum('item_type', ['task', 'spare_part', 'other_charges'])->after('quotation_id');
            }

            // Add category column if it doesn't exist
            if (!Schema::hasColumn('quotation_items', 'category')) {
                $table->string('category')->nullable()->after('item_type');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('quotation_items', function (Blueprint $table) {
            if (DB::getDriverName() === 'mysql') {
                DB::statement("ALTER TABLE quotation_items MODIFY item_type ENUM('task', 'spare_part') NOT NULL");
            } else {
                $table->dropColumn('item_type');
                $table->enum('item_type', ['task', 'spare_part'])->after('quotation_id');
            }
            
            if (Schema::hasColumn('quotation_items', 'category')) {
                $table->dropColumn('category');
            }
        });
    }
};

