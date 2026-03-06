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

        // Only modify unique constraint if it still exists
        try {
            // Drop the old unique constraint
            DB::statement('ALTER TABLE `' . $table . '` DROP INDEX `role_permissions_role_id_permission_id_unique`');
            
            // Create new unique constraint that includes technician_type
            DB::statement('ALTER TABLE `' . $table . '` ADD UNIQUE KEY `role_permissions_role_id_permission_id_technician_type_unique` (`role_id`, `permission_id`, `technician_type`)');
        } catch (\Exception $e) {
            // If constraint doesn't exist or operation fails, that's ok - maybe it's already been modified
        }
    }

    public function down(): void
    {
        $table = 'role_permissions';
        
        try {
            DB::statement('ALTER TABLE `' . $table . '` DROP INDEX `role_permissions_role_id_permission_id_technician_type_unique`');
            DB::statement('ALTER TABLE `' . $table . '` ADD UNIQUE KEY `role_permissions_role_id_permission_id_unique` (`role_id`, `permission_id`)');
        } catch (\Exception $e) {
            // Ignore errors
        }
        
        if (Schema::hasColumn($table, 'technician_type')) {
            Schema::table($table, function (Blueprint $t) {
                $t->dropColumn('technician_type');
            });
        }
    }
};
