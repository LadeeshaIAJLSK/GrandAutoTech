<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inspections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_card_id')->constrained()->onDelete('cascade');
            $table->foreignId('task_id')->nullable()->constrained()->onDelete('cascade');
            $table->foreignId('inspected_by')->constrained('users')->onDelete('cascade');
            
            $table->enum('inspection_type', ['task', 'final', 'quality_check'])->default('task');
            $table->enum('status', ['approved', 'rejected', 'needs_revision'])->default('approved');
            $table->integer('quality_rating')->nullable(); // 1-5 stars
            $table->text('notes')->nullable();
            $table->text('issues_found')->nullable();
            $table->dateTime('inspected_at');
            $table->timestamps();
            
            $table->index('job_card_id');
            $table->index('task_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inspections');
    }
};