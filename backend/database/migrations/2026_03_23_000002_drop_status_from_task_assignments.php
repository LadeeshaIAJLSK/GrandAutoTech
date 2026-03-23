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
        // Drop the status column from task_assignments table
        Schema::table('task_assignments', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Restore the status column to task_assignments table
        Schema::table('task_assignments', function (Blueprint $table) {
            $table->enum('status', [
                'assigned',
                'accepted',
                'in_progress',
                'awaiting_approval',
                'completed',
                'rejected'
            ])->default('assigned')->after('completed_at');
        });
    }
};
