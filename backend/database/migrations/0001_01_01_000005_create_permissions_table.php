<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('permissions', function (Blueprint $table) {
            $table->id();
            $table->string('module'); // 'customers', 'job_cards', etc.
            $table->string('action'); // 'view', 'add', 'update', 'delete', 'own_data'
            $table->string('name')->unique(); // 'view_customers', 'add_job_card'
            $table->string('display_name');
            $table->timestamps();
            
            $table->index(['module', 'action']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('permissions');
    }
};