<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Create approve_tasks permission
        $permissionId = DB::table('permissions')->insertGetId([
            'name' => 'approve_tasks',
            'module' => 'tasks',
            'action' => 'approve',
            'display_name' => 'Approve Tasks',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Add to super_admin (role_id = 1)
        DB::table('role_permissions')->insert([
            'role_id' => 1,
            'permission_id' => $permissionId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Add to branch_admin (role_id = 2)
        DB::table('role_permissions')->insert([
            'role_id' => 2,
            'permission_id' => $permissionId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        DB::table('permissions')->where('name', 'approve_tasks')->delete();
    }
};
