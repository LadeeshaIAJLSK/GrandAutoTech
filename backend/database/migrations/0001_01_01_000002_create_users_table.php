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
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('phone')->nullable();
            $table->string('employee_code')->nullable()->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            
            // Role-based access control
            $table->foreignId('role_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('branch_id')->nullable()->constrained()->onDelete('set null');
            
            $table->boolean('is_active')->default(true);

            // Remember me functionality
            $table->rememberToken();
            $table->timestamps();
            
            // Indexes for performance
            $table->index('email');
            $table->index('phone');
            $table->index('employee_code');
            $table->index('role_id');
            $table->index('branch_id');
            $table->index('is_active');
        });

        // ...existing code...
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};