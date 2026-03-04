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
        Schema::create('quotation_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quotation_id')->constrained('quotations')->onDelete('cascade');
            $table->enum('item_type', ['task', 'spare_part']); // task or spare_part
            $table->foreignId('task_id')->nullable()->constrained('tasks')->onDelete('set null');
            $table->string('description'); // Description of the item
            $table->decimal('quantity_or_hours', 8, 2); // Quantity for parts, Hours for tasks
            $table->decimal('unit_price', 10, 2); // Price per unit/hour
            $table->decimal('amount', 10, 2); // quantity_or_hours * unit_price
            $table->text('notes')->nullable();
            $table->integer('order')->default(0); // For ordering items
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quotation_items');
    }
};
