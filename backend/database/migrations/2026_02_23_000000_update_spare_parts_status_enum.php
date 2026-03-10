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
        DB::statement("ALTER TABLE spare_parts_requests MODIFY overall_status VARCHAR(50)");
        
        // Update sent to process
        DB::statement("UPDATE spare_parts_requests SET overall_status = 'process' WHERE overall_status = 'sent'");
        
        // Change back to ENUM with new values
        DB::statement("ALTER TABLE spare_parts_requests MODIFY overall_status ENUM('pending', 'approved', 'rejected', 'ordered', 'process', 'delivered') NOT NULL DEFAULT 'pending'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE spare_parts_requests MODIFY overall_status VARCHAR(50)");
        DB::statement("UPDATE spare_parts_requests SET overall_status = 'sent' WHERE overall_status = 'process'");
        DB::statement("ALTER TABLE spare_parts_requests MODIFY overall_status ENUM('pending', 'approved', 'rejected', 'ordered', 'sent') NOT NULL DEFAULT 'pending'");
    }
};