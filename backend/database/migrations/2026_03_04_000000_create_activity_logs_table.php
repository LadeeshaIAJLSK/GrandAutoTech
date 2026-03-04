<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('branch_id')->constrained()->onDelete('cascade');
            $table->string('action'); // 'created', 'updated', 'deleted', 'viewed', 'downloaded', 'exported', 'approved', 'rejected'
            $table->string('model'); // Job Card, Invoice, User, Customer, etc.
            $table->unsignedBigInteger('model_id')->nullable(); // ID of the affected record
            $table->text('description');
            $table->json('changes')->nullable(); // What changed (old vs new values)
            $table->string('ip_address')->nullable();
            $table->string('user_agent')->nullable();
            $table->enum('risk_level', ['low', 'medium', 'high'])->default('low'); // For flagging suspicious activities
            $table->text('risk_reason')->nullable(); // Why it's flagged as medium/high risk
            $table->boolean('is_suspicious')->default(false); // Did something unusual happen?
            $table->timestamp('created_at'); // When it happened
            $table->index(['user_id', 'created_at']);
            $table->index(['branch_id', 'created_at']);
            $table->index(['action', 'created_at']);
            $table->index('is_suspicious');
            $table->index('risk_level');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
