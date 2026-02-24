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
        // Change to VARCHAR temporarily to allow any value
        DB::statement("ALTER TABLE task_assignments MODIFY status VARCHAR(50)");
        
        // Change back to ENUM with awaiting_approval added
        DB::statement("ALTER TABLE task_assignments MODIFY status ENUM('assigned','accepted','in_progress','awaiting_approval','completed','rejected') NOT NULL DEFAULT 'assigned'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE task_assignments MODIFY status VARCHAR(50)");
        DB::statement("ALTER TABLE task_assignments MODIFY status ENUM('assigned','accepted','in_progress','completed','rejected') NOT NULL DEFAULT 'assigned'");
    }
};
