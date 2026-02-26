<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * Check READ permission (no branch restriction)
     * Used for: VIEW operations
     */
    private function checkReadPermission($user, $permission)
    {
        $role = DB::table('roles')->where('id', $user->role_id)->first();
        
        // Super admin can read everything
        if ($role->name === 'super_admin') {
            $permissions = DB::table('permissions')
                ->join('role_permissions', 'permissions.id', '=', 'role_permissions.permission_id')
                ->where('role_permissions.role_id', $user->role_id)
                ->pluck('permissions.name')
                ->toArray();
            
            if (!in_array($permission, $permissions)) {
                return ['allowed' => false, 'message' => 'Unauthorized - Permission denied'];
            }
            return ['allowed' => true];
        }
        
        // Other roles: check if they have permission (any branch)
        // Employee from Kandy can view customers from Colombo
        $permissions = DB::table('permissions')
            ->join('role_permissions', 'permissions.id', '=', 'role_permissions.permission_id')
            ->where('role_permissions.role_id', $user->role_id)
            ->pluck('permissions.name')
            ->toArray();
        
        if (!in_array($permission, $permissions)) {
            return ['allowed' => false, 'message' => 'Unauthorized - Permission denied'];
        }
        
        return ['allowed' => true];
    }

    /**
     * Check WRITE permission (with branch restriction)
     * Used for: CREATE, UPDATE, DELETE operations
     */
    private function checkWritePermission($user, $permission, $targetBranchId)
    {
        $role = DB::table('roles')->where('id', $user->role_id)->first();
        
        // Super admin can do everything
        if ($role->name === 'super_admin') {
            $permissions = DB::table('permissions')
                ->join('role_permissions', 'permissions.id', '=', 'role_permissions.permission_id')
                ->where('role_permissions.role_id', $user->role_id)
                ->pluck('permissions.name')
                ->toArray();
            
            if (!in_array($permission, $permissions)) {
                return ['allowed' => false, 'message' => 'Unauthorized - Permission denied'];
            }
            return ['allowed' => true];
        }
        
        // Other roles: check permission in their branch + must match target branch
        $permissions = DB::table('permissions')
            ->join('role_permissions', 'permissions.id', '=', 'role_permissions.permission_id')
            ->where('role_permissions.role_id', $user->role_id)
            ->where('role_permissions.branch_id', $user->branch_id)
            ->pluck('permissions.name')
            ->toArray();
        
        if (!in_array($permission, $permissions)) {
            return ['allowed' => false, 'message' => 'Unauthorized - Permission denied in your branch'];
        }
        
        // Check branch match
        if ($targetBranchId !== $user->branch_id) {
            return ['allowed' => false, 'message' => 'Unauthorized - You can only modify data in your assigned branch'];
        }
        
        return ['allowed' => true];
    }

    /**
     * Get all users (with filters and pagination)
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            
            // Check READ permission (no branch restriction)
            $check = $this->checkReadPermission($user, 'view_users');
            if (!$check['allowed']) {
                return response()->json(['message' => $check['message']], 403);
            }
            
            $query = User::with(['role', 'branch']);

            // Optional branch filter (useful for filtering results)
            if ($request->has('branch_id') && $request->branch_id) {
                $branchId = $request->branch_id;
                $userRole = DB::table('roles')->where('id', $user->role_id)->first();
                
                // Super admin can filter by any branch
                // Other roles can only filter their own branch
                if ($userRole->name === 'super_admin') {
                    $query->where('branch_id', $branchId);
                } else {
                    // For non-super-admins, only filter if it's their own branch
                    if ($branchId == $user->branch_id) {
                        $query->where('branch_id', $branchId);
                    }
                    // If they try to filter another branch, we just ignore the filter (show their branch users)
                }
            }

            // Optional role filter
            if ($request->has('role_id') && $request->role_id) {
                $query->where('role_id', $request->role_id);
            }

            // Search filter
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhere('phone', 'like', "%{$search}%")
                      ->orWhere('employee_code', 'like', "%{$search}%");
                });
            }

            // Pagination
            $users = $query->orderBy('created_at', 'desc')->paginate(10);

            return response()->json($users);
        } catch (\Exception $e) {
            \Log::error('User index error: ' . $e->getMessage());
            return response()->json(['message' => 'Something went wrong. Please try again later.'], 500);
        }
    }

    /**
     * Get single user
     */
    public function show($id, Request $request)
    {
        $user = $request->user();
        
        // Check READ permission (no branch restriction)
        $check = $this->checkReadPermission($user, 'view_users');
        if (!$check['allowed']) {
            return response()->json(['message' => $check['message']], 403);
        }

        $targetUser = User::with(['role', 'branch'])->findOrFail($id);

        return response()->json($targetUser);
    }

    /**
     * Create new user
     */
    public function store(Request $request)
    {
        $user = $request->user();
        
        // Validate input first (branch_id is required from frontend)
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'phone' => 'required|string|max:20',
            'employee_code' => 'required|string|unique:users,employee_code',
            'password' => 'required|string|min:8',
            'role_id' => 'required|exists:roles,id',
            'branch_id' => 'required|exists:branches,id',
            'is_active' => 'boolean',
        ]);

        // Check WRITE permission (with branch restriction)
        $check = $this->checkWritePermission($user, 'add_users', $validated['branch_id']);
        if (!$check['allowed']) {
            return response()->json(['message' => $check['message']], 403);
        }

        // Prevent anyone from creating super_admin users
        $requestedRoleId = $validated['role_id'];
        $requestedRole = DB::table('roles')->where('id', $requestedRoleId)->first();
        if ($requestedRole && $requestedRole->name === 'super_admin') {
            return response()->json(['message' => 'Cannot create super admin users. There is only one super admin in the system.'], 403);
        }

        // For branch admins, ensure branch_id matches their branch (already validated above)
        $role = DB::table('roles')->where('id', $user->role_id)->first();
        if ($role->name === 'branch_admin') {
            $validated['branch_id'] = $user->branch_id;
        }

        $validated['password'] = Hash::make($validated['password']);

        $newUser = User::create($validated);

        return response()->json([
            'message' => 'User created successfully',
            'user' => $newUser->load(['role', 'branch'])
        ], 201);
    }

    /**
     * Update user
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();
        
        $targetUser = User::findOrFail($id);
        
        // Check WRITE permission (with branch restriction)
        $check = $this->checkWritePermission($user, 'update_users', $targetUser->branch_id);
        if (!$check['allowed']) {
            return response()->json(['message' => $check['message']], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => ['sometimes', 'email', Rule::unique('users')->ignore($id)],
            'phone' => 'sometimes|required|string|max:20',
            'employee_code' => ['sometimes', 'required', 'string', Rule::unique('users')->ignore($id)],
            'password' => 'nullable|string|min:8',
            'role_id' => 'sometimes|exists:roles,id',
            'branch_id' => 'sometimes|required|exists:branches,id',
            'is_active' => 'boolean',
        ]);

        // Branch Admin cannot change branch
        $role = DB::table('roles')->where('id', $user->role_id)->first();
        if ($role->name === 'branch_admin') {
            unset($validated['branch_id']);
        }

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        $targetUser->update($validated);

        return response()->json([
            'message' => 'User updated successfully',
            'user' => $targetUser->load(['role', 'branch'])
        ]);
    }

    /**
     * Delete user
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        
        $targetUser = User::findOrFail($id);

        // Cannot delete yourself
        if ($targetUser->id === $user->id) {
            return response()->json(['message' => 'Cannot delete yourself'], 400);
        }
        
        // Check WRITE permission (with branch restriction)
        $check = $this->checkWritePermission($user, 'delete_users', $targetUser->branch_id);
        if (!$check['allowed']) {
            return response()->json(['message' => $check['message']], 403);
        }

        $targetUser->delete();

        return response()->json([
            'message' => 'User deleted successfully'
        ]);
    }

    /**
     * Get all roles (for dropdown)
     */
    public function getRoles()
    {
        $roles = DB::table('roles')->get();
        return response()->json($roles);
    }

    /**
     * Get all branches (for dropdown)
     */
    public function getBranches()
    {
        $branches = DB::table('branches')->where('is_active', true)->get();
        return response()->json($branches);
    }
}