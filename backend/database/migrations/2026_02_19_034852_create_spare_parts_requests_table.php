<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('spare_parts_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_card_id')->constrained()->onDelete('cascade');
            $table->foreignId('task_id')->nullable()->constrained()->onDelete('cascade');
            $table->foreignId('requested_by')->constrained('users')->onDelete('cascade');
            
            $table->string('part_name');
            $table->string('part_number')->nullable();
            $table->text('description')->nullable();
            $table->integer('quantity')->default(1);
            
            // Pricing
            $table->decimal('unit_cost', 10, 2)->default(0);
            $table->decimal('selling_price', 10, 2)->default(0);
            $table->decimal('total_cost', 10, 2)->default(0);
            
            // 3-Level Approval Status
            $table->enum('employee_status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->foreignId('employee_approved_by')->nullable()->constrained('users');
            $table->dateTime('employee_approved_at')->nullable();
            $table->text('employee_notes')->nullable();
            
            $table->enum('admin_status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->foreignId('admin_approved_by')->nullable()->constrained('users');
            $table->dateTime('admin_approved_at')->nullable();
            $table->text('admin_notes')->nullable();
            
            $table->enum('customer_status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->dateTime('customer_approved_at')->nullable();
            $table->text('customer_notes')->nullable();
            
            $table->enum('overall_status', [
                'pending',
                'approved',
                'rejected',
                'ordered',
                'process',
                'delivered'
            ])->default('pending');
            
            $table->timestamps();
            
            $table->index('job_card_id');
            $table->index('task_id');
            $table->index('overall_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('spare_parts_requests');
    }
};