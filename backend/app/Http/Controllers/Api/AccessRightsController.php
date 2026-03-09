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
     * For technician role, returns separate permission sets for employee and supervisor
     */
    public function getAllRolesWithPermissions()
    {
        $roles = Role::with(['permissions'])->get();
        $allPermissions = Permission::orderBy('module')->orderBy('name')->get();

        // Group permissions by module
        $groupedPermissions = $allPermissions->groupBy('module');

        // Separate technician role permissions by type
        $rolesFormatted = $roles->map(function($role) {
            if ($role->name === 'technician') {
                // For technician role, separate permissions by technician_type
                $employeePermissions = $role->permissions
                    ->filter(fn($p) => $p->pivot->technician_type === 'employee' || $p->pivot->technician_type === null)
                    ->values();
                
                $supervisorPermissions = $role->permissions
                    ->filter(fn($p) => $p->pivot->technician_type === 'supervisor' || $p->pivot->technician_type === null)
                    ->values();

                return [
                    'id' => $role->id,
                    'name' => $role->name,
                    'display_name' => $role->display_name,
                    'description' => $role->description,
                    'is_technician' => true,
                    'permissions_employee' => $employeePermissions,
                    'permissions_supervisor' => $supervisorPermissions,
                    'all_permissions' => $role->permissions,
                ];
            }

            return [
                'id' => $role->id,
                'name' => $role->name,
                'display_name' => $role->display_name,
                'description' => $role->description,
                'is_technician' => false,
                'permissions' => $role->permissions,
            ];
        });

        return response()->json([
            'roles' => $rolesFormatted,
            'all_permissions' => $allPermissions,
            'grouped_permissions' => $groupedPermissions
        ]);
    }

    /**
     * Update role permissions
     * For technician role, handles separate permissions for employee and supervisor
     */
    public function updateRolePermissions(Request $request, $roleId)
    {
        $user = $request->user();
        
        // Only super admin can modify permissions
        $role = DB::table('roles')->where('id', $user->role_id)->first();
        if ($role->name !== 'super_admin') {
            return response()->json(['message' => 'Only super admin can modify permissions'], 403);
        }

        $targetRole = Role::findOrFail($roleId);
        $targetRoleDB = DB::table('roles')->where('id', $roleId)->first();

        // Validation differs for technician role
        if ($targetRoleDB->name === 'technician') {
            $validated = $request->validate([
                'employee_permissions' => 'nullable|array',
                'employee_permissions.*' => 'exists:permissions,id',
                'supervisor_permissions' => 'nullable|array',
                'supervisor_permissions.*' => 'exists:permissions,id',
            ]);

            // Delete all existing technician permissions (both with and without technician_type)
            DB::table('role_permissions')->where('role_id', $roleId)->delete();

            $employeePerms = collect($validated['employee_permissions'] ?? []);
            $supervisorPerms = collect($validated['supervisor_permissions'] ?? []);

            // Permissions in BOTH arrays apply to all technicians → insert once with null type
            $sharedPerms = $employeePerms->intersect($supervisorPerms);
            foreach ($sharedPerms as $permissionId) {
                DB::table('role_permissions')->insert([
                    'role_id' => $roleId,
                    'permission_id' => $permissionId,
                    'technician_type' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // Permissions exclusive to employees
            foreach ($employeePerms->diff($supervisorPerms) as $permissionId) {
                DB::table('role_permissions')->insert([
                    'role_id' => $roleId,
                    'permission_id' => $permissionId,
                    'technician_type' => 'employee',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // Permissions exclusive to supervisors
            foreach ($supervisorPerms->diff($employeePerms) as $permissionId) {
                DB::table('role_permissions')->insert([
                    'role_id' => $roleId,
                    'permission_id' => $permissionId,
                    'technician_type' => 'supervisor',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        } else {
            // Regular role permissions (no technician_type)
            $validated = $request->validate([
                'permission_ids' => 'required|array',
                'permission_ids.*' => 'exists:permissions,id',
            ]);

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
