<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Populate branch_id from vehicle's branch for existing job cards
        DB::statement('
            UPDATE job_cards jc
            JOIN vehicles v ON jc.vehicle_id = v.id
            SET jc.branch_id = v.branch_id
            WHERE jc.branch_id IS NULL
        ');

        // Drop the old foreign key constraint with SET NULL
        Schema::table('job_cards', function (Blueprint $table) {
            $table->dropForeign('job_cards_branch_id_foreign');
        });

        // Recreate with CASCADE delete
        Schema::table('job_cards', function (Blueprint $table) {
            $table->foreign('branch_id')->references('id')->on('branches')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('job_cards', function (Blueprint $table) {
            $table->dropForeign('job_cards_branch_id_foreign');
            $table->foreign('branch_id')->references('id')->on('branches')->onDelete('set null')->nullable();
        });
    }
};
