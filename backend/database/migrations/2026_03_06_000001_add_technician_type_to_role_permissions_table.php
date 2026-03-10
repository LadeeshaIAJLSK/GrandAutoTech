<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $table = 'role_permissions';
        
        // Check if column already exists
        if (!Schema::hasColumn($table, 'technician_type')) {
            Schema::table($table, function (Blueprint $t) {
                $t->enum('technician_type', ['employee', 'supervisor'])->nullable()->after('permission_id');
            });
        }

        // No need to change the unique constraint - it already allows NULL values
        // Multiple rows with different technician_type values (including NULL) are allowed
    }

    public function down(): void
    {
        $table = 'role_permissions';
        
        if (Schema::hasColumn($table, 'technician_type')) {
            Schema::table($table, function (Blueprint $t) {
                $t->dropColumn('technician_type');
            });
        }
    }
};
