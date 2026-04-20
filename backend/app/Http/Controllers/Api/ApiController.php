<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller as BaseController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ApiController extends BaseController
{
    /**
     * Check READ permission (no branch restriction)
     * Used for: VIEW operations
     */
    protected function checkReadPermission(Request $request, $permission)
    {
        $user = $request->user();
        $role = DB::table('roles')->where('id', $user->role_id)->first();
        
        // Super admin can read everything
        if ($role->name === 'super_admin') {
            return ['allowed' => true];
        }
        
        // Check if user has permission (any branch)
        $hasPermission = DB::table('permissions')
            ->join('role_permissions', 'permissions.id', '=', 'role_permissions.permission_id')
            ->where('role_permissions.role_id', $user->role_id)
            ->where('permissions.name', $permission)
            ->where(function($query) use ($user) {
                $query->whereNull('role_permissions.branch_id')
                      ->orWhere('role_permissions.branch_id', $user->branch_id);
            })
            ->where(function($query) use ($user) {
                $query->whereNull('role_permissions.technician_type')
                      ->orWhere('role_permissions.technician_type', $user->technician_type?->value);
            })
            ->exists();
        
        if (!$hasPermission) {
            return ['allowed' => false, 'message' => 'Unauthorized - Permission denied'];
        }
        
        return ['allowed' => true];
    }

    /**
     * Check WRITE permission (with branch restriction)
     * Used for: CREATE, UPDATE, DELETE operations
     */
    protected function checkWritePermission(Request $request, $permission, $targetBranchId)
    {
        $user = $request->user();
        $role = DB::table('roles')->where('id', $user->role_id)->first();
        
        // Super admin can do everything
        if ($role->name === 'super_admin') {
            return ['allowed' => true];
        }
        
        // Check permission in their branch
        $hasPermission = DB::table('permissions')
            ->join('role_permissions', 'permissions.id', '=', 'role_permissions.permission_id')
            ->where('role_permissions.role_id', $user->role_id)
            ->where('permissions.name', $permission)
            ->where(function($query) use ($user) {
                $query->whereNull('role_permissions.branch_id')
                      ->orWhere('role_permissions.branch_id', $user->branch_id);
            })
            ->where(function($query) use ($user) {
                $query->whereNull('role_permissions.technician_type')
                      ->orWhere('role_permissions.technician_type', $user->technician_type?->value);
            })
            ->exists();
        
        if (!$hasPermission) {
            return ['allowed' => false, 'message' => 'Unauthorized - Permission denied'];
        }
        
        // Check branch match for non-super-admins
        if ($targetBranchId !== $user->branch_id) {
            return ['allowed' => false, 'message' => 'Unauthorized - You can only modify data in your assigned branch'];
        }
        
        return ['allowed' => true];
    }

    /**
     * Enforce branch filtering for queries
     */
    protected function applyBranchFilter($query, Request $request)
    {
        $user = $request->user();
        $role = DB::table('roles')->where('id', $user->role_id)->first();
        
        // Super admin can filter by any branch or see all
        if ($role->name === 'super_admin') {
            if ($request->has('branch_id') && $request->branch_id) {
                return $query->where('branch_id', $request->branch_id);
            }
            return $query;
        }
        
        // Non-super-admins: ALWAYS filter by their own branch
        return $query->where('branch_id', $user->branch_id);
    }

    /**
     * Authorized deny response
     */
    protected function unauthorized($message = 'Unauthorized')
    {
        return response()->json(['message' => $message], 403);
    }

    /**
     * Not found response
     */
    protected function notFound($message = 'Resource not found')
    {
        return response()->json(['message' => $message], 404);
    }

    /**
     * Validation error response
     */
    protected function validationError($errors)
    {
        return response()->json(['message' => 'Validation failed', 'errors' => $errors], 422);
    }
}
