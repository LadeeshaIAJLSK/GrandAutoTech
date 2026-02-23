<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            // We need to recreate the enum to add the new value
            DB::statement("ALTER TABLE tasks MODIFY COLUMN status ENUM('pending', 'assigned', 'in_progress', 'awaiting_approval', 'completed', 'cancelled') DEFAULT 'pending'");
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            DB::statement("ALTER TABLE tasks MODIFY COLUMN status ENUM('pending', 'assigned', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending'");
        });
    }
};