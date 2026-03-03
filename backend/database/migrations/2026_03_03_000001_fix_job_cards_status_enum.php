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
        // First, clean up any invalid status values in existing records
        DB::statement("UPDATE job_cards SET status = 'pending' WHERE status NOT IN ('pending', 'in_progress', 'completed', 'inspected')");
        
        // Fix the job_cards status enum to include all required values
        DB::statement("ALTER TABLE job_cards MODIFY COLUMN status ENUM('pending', 'in_progress', 'completed', 'inspected') NOT NULL DEFAULT 'pending'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE job_cards MODIFY COLUMN status ENUM('pending', 'in_progress', 'completed') NOT NULL DEFAULT 'pending'");
    }
};
