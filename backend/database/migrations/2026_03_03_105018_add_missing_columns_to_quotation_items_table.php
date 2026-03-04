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
        Schema::table('quotation_items', function (Blueprint $table) {
            if (!Schema::hasColumn('quotation_items', 'quotation_id')) {
                $table->foreignId('quotation_id')->constrained('quotations')->onDelete('cascade')->first();
            }
            if (!Schema::hasColumn('quotation_items', 'item_type')) {
                $table->enum('item_type', ['task', 'spare_part'])->after('quotation_id');
            }
            if (!Schema::hasColumn('quotation_items', 'task_id')) {
                $table->foreignId('task_id')->nullable()->constrained('tasks')->onDelete('set null')->after('item_type');
            }
            if (!Schema::hasColumn('quotation_items', 'description')) {
                $table->string('description')->after('task_id');
            }
            if (!Schema::hasColumn('quotation_items', 'quantity_or_hours')) {
                $table->decimal('quantity_or_hours', 8, 2)->after('description');
            }
            if (!Schema::hasColumn('quotation_items', 'unit_price')) {
                $table->decimal('unit_price', 10, 2)->after('quantity_or_hours');
            }
            if (!Schema::hasColumn('quotation_items', 'amount')) {
                $table->decimal('amount', 10, 2)->after('unit_price');
            }
            if (!Schema::hasColumn('quotation_items', 'notes')) {
                $table->text('notes')->nullable()->after('amount');
            }
            if (!Schema::hasColumn('quotation_items', 'order')) {
                $table->integer('order')->default(0)->after('notes');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('quotation_items', function (Blueprint $table) {
            if (Schema::hasColumn('quotation_items', 'quotation_id')) {
                $table->dropForeignKeyIfExists(['quotation_id']);
                $table->dropColumn('quotation_id');
            }
            if (Schema::hasColumn('quotation_items', 'item_type')) {
                $table->dropColumn('item_type');
            }
            if (Schema::hasColumn('quotation_items', 'task_id')) {
                $table->dropForeignKeyIfExists(['task_id']);
                $table->dropColumn('task_id');
            }
            if (Schema::hasColumn('quotation_items', 'description')) {
                $table->dropColumn('description');
            }
            if (Schema::hasColumn('quotation_items', 'quantity_or_hours')) {
                $table->dropColumn('quantity_or_hours');
            }
            if (Schema::hasColumn('quotation_items', 'unit_price')) {
                $table->dropColumn('unit_price');
            }
            if (Schema::hasColumn('quotation_items', 'amount')) {
                $table->dropColumn('amount');
            }
            if (Schema::hasColumn('quotation_items', 'notes')) {
                $table->dropColumn('notes');
            }
            if (Schema::hasColumn('quotation_items', 'order')) {
                $table->dropColumn('order');
            }
        });
    }
};
