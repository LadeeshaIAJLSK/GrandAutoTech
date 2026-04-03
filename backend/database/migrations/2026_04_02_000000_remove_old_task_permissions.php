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
        // Delete only the old task permissions that are no longer needed
        $oldTaskPermissions = [
            'view_tasks',
            'add_tasks',
            'update_tasks',
            'delete_tasks',
            'own_tasks',
        ];

        // Get IDs of old permissions
        $taskPermissionIds = DB::table('permissions')
            ->whereIn('name', $oldTaskPermissions)
            ->pluck('id')
            ->toArray();

        // Delete role_permissions entries for these old permissions
        if (!empty($taskPermissionIds)) {
            DB::table('role_permissions')
                ->whereIn('permission_id', $taskPermissionIds)
                ->delete();
        }

        // Delete the old task permissions
        DB::table('permissions')
            ->whereIn('name', $oldTaskPermissions)
            ->delete();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // This is a destructive operation, no rollback needed
    }
};
