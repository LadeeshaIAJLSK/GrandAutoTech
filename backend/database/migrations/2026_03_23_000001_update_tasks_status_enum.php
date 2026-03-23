<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update tasks table status enum to include 'accepted' and 'rejected', remove 'on_hold'
        DB::statement("ALTER TABLE tasks MODIFY COLUMN status ENUM('pending', 'assigned', 'accepted', 'in_progress', 'awaiting_approval', 'completed', 'rejected', 'cancelled') DEFAULT 'pending'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to previous status enum
        DB::statement("ALTER TABLE tasks MODIFY COLUMN status ENUM('pending', 'assigned', 'in_progress', 'awaiting_approval', 'completed', 'on_hold', 'cancelled') DEFAULT 'pending'");
    }
};
