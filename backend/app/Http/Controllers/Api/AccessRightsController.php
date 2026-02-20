<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\Permission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AccessRightsController extends Controller
{
    /**
     * Get all roles with their permissions
     */
    public function getAllRolesWithPermissions()
    {
        $roles = Role::with(['permissions'])->get();
        $allPermissions = Permission::orderBy('module')->orderBy('name')->get();

        // Group permissions by module
        $groupedPermissions = $allPermissions->groupBy('module');

        return response()->json([
            'roles' => $roles,
            'all_permissions' => $allPermissions,
            'grouped_permissions' => $groupedPermissions
        ]);
    }

    /**
     * Update role permissions
     */
    public function updateRolePermissions(Request $request, $roleId)
    {
        $user = $request->user();
        
        // Only super admin can modify permissions
        $role = DB::table('roles')->where('id', $user->role_id)->first();
        if ($role->name !== 'super_admin') {
            return response()->json(['message' => 'Only super admin can modify permissions'], 403);
        }

        $validated = $request->validate([
            'permission_ids' => 'required|array',
            'permission_ids.*' => 'exists:permissions,id',
        ]);

        $targetRole = Role::findOrFail($roleId);

        // Delete existing permissions
        DB::table('role_permissions')->where('role_id', $roleId)->delete();

        // Add new permissions
        foreach ($validated['permission_ids'] as $permissionId) {
            DB::table('role_permissions')->insert([
                'role_id' => $roleId,
                'permission_id' => $permissionId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return response()->json([
            'message' => "Permissions updated for {$targetRole->display_name}",
            'role' => $targetRole->fresh()->load('permissions')
        ]);
    }

    /**
     * Get users by role
     */
    public function getUsersByRole($roleId)
    {
        $users = DB::table('users')
            ->join('roles', 'users.role_id', '=', 'roles.id')
            ->where('users.role_id', $roleId)
            ->select('users.*', 'roles.name as role_name', 'roles.display_name as role_display_name')
            ->get();

        return response()->json($users);
    }

    /**
     * Get permission statistics
     */
    public function getPermissionStats()
    {
        $stats = [
            'total_permissions' => Permission::count(),
            'total_roles' => Role::count(),
            'permissions_by_module' => Permission::select('module', DB::raw('count(*) as count'))
                ->groupBy('module')
                ->get(),
        ];

        return response()->json($stats);
    }
}