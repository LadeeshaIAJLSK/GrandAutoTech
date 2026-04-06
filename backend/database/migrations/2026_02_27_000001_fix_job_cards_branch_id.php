<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Only proceed if branch_id column exists
        if (!Schema::hasColumn('job_cards', 'branch_id')) {
            return;
        }

        // Populate branch_id from vehicle's branch for existing job cards
        try {
            DB::statement('
                UPDATE job_cards jc
                JOIN vehicles v ON jc.vehicle_id = v.id
                SET jc.branch_id = v.branch_id
                WHERE jc.branch_id IS NULL
            ');
        } catch (\Exception $e) {
            // Silently ignore if update fails (data might not exist)
        }
    }

    public function down(): void
    {
        // Nothing to do on rollback
    }
};
