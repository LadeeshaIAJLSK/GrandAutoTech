<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
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
        
        // Super admin can read everything - no permission check needed
        if ($role->name === 'super_admin') {
            return ['allowed' => true];
        }
        
        // Other roles: check if they have permission (any branch)
        // Employee from Kandy can view customers from Colombo
        $permissions = DB::table('permissions')
            ->join('role_permissions', 'permissions.id', '=', 'role_permissions.permission_id')
            ->where('role_permissions.role_id', $user->role_id)
            ->where(function($query) use ($user) {
                $query->whereNull('role_permissions.branch_id')
                      ->orWhere('role_permissions.branch_id', $user->branch_id);
            })
            ->where(function($query) use ($user) {
                // Check if permission applies to this user's technician_type
                $query->whereNull('role_permissions.technician_type')
                      ->orWhere('role_permissions.technician_type', $user->technician_type?->value);
            })
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
        
        // Super admin can do everything - no permission or branch check needed
        if ($role->name === 'super_admin') {
            return ['allowed' => true];
        }
        
        // Other roles: check permission in their branch + must match target branch
        $permissions = DB::table('permissions')
            ->join('role_permissions', 'permissions.id', '=', 'role_permissions.permission_id')
            ->where('role_permissions.role_id', $user->role_id)
            ->where(function($query) use ($user) {
                $query->whereNull('role_permissions.branch_id')
                      ->orWhere('role_permissions.branch_id', $user->branch_id);
            })
            ->where(function($query) use ($user) {
                // Check if permission applies to this user's technician_type
                $query->whereNull('role_permissions.technician_type')
                      ->orWhere('role_permissions.technician_type', $user->technician_type?->value);
            })
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
            
            $userRole = DB::table('roles')->where('id', $user->role_id)->first();
            
            // Branch filtering - SUPER ADMIN can filter by any branch, others see only their branch
            if ($userRole->name === 'super_admin') {
                // Super admin: optional branch filter
                if ($request->has('branch_id') && $request->branch_id) {
                    $query->where('branch_id', $request->branch_id);
                }
            } else {
                // Non-super-admins: ALWAYS filter by their own branch only
                $query->where('branch_id', $user->branch_id);
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
            'first_name' => 'nullable|string|max:255',
            'email' => 'required|email|unique:users,email',
            'phone' => 'required|string|max:20',
            'password' => 'required|string|min:8',
            'role_id' => 'required|exists:roles,id',
            'technician_type' => 'nullable|in:employee,supervisor',
            'branch_id' => 'required|exists:branches,id',
            'is_active' => 'nullable|in:0,1,true,false',
            'gender' => 'required|in:male,female,other',
            'date_of_birth' => 'required|date',
            'join_date' => 'required|date',
            'left_date' => 'nullable|date',
            'emergency_contact_name' => 'required|string|max:255',
            'emergency_contact_no' => 'required|string|max:20',
            'profile_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            'special_notes' => 'nullable|string',
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

        // Validate technician_type is required when role is technician
        if ($requestedRole && $requestedRole->name === 'technician') {
            if (!isset($validated['technician_type']) || empty($validated['technician_type'])) {
                return response()->json(['message' => 'Technician type (employee or supervisor) is required for technician role'], 422);
            }
        } else {
            // Clear technician_type if role is not technician
            $validated['technician_type'] = null;
        }

        // For branch admins, ensure branch_id matches their branch (already validated above)
        $role = DB::table('roles')->where('id', $user->role_id)->first();
        if ($role->name === 'branch_admin') {
            $validated['branch_id'] = $user->branch_id;
        }

        // Auto-generate employee_code based on branch
        $branch = DB::table('branches')->where('id', $validated['branch_id'])->first();
        if (!$branch) {
            return response()->json(['message' => 'Branch not found'], 404);
        }

        // Get the next sequence number for this branch
        $branchCode = strtolower(substr($branch->code, 0, 3)); // Use first 3 letters of branch code
        $lastEmployee = DB::table('users')
            ->where('branch_id', $validated['branch_id'])
            ->where('employee_code', 'like', $branchCode . '%')
            ->orderBy('employee_code', 'desc')
            ->first();

        if ($lastEmployee) {
            // Extract the numeric part and increment
            $lastNumber = intval(substr($lastEmployee->employee_code, strlen($branchCode)));
            $nextNumber = $lastNumber + 1;
        } else {
            // First employee in this branch
            $nextNumber = 1;
        }

        // Generate the employee code (e.g., col001, kan002)
        $validated['employee_code'] = $branchCode . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);

        $validated['password'] = Hash::make($validated['password']);

        // Convert is_active to boolean
        if (isset($validated['is_active'])) {
            $validated['is_active'] = filter_var($validated['is_active'], FILTER_VALIDATE_BOOLEAN);
        } else {
            $validated['is_active'] = true; // Default to true
        }

        // Handle file upload if present
        if ($request->hasFile('profile_image')) {
            $file = $request->file('profile_image');
            $path = $file->store('profiles', 'public');
            $validated['profile_image'] = $path;
        }

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
            'first_name' => 'nullable|string|max:255',
            'email' => ['sometimes', 'email', Rule::unique('users')->ignore($id)],
            'phone' => 'sometimes|required|string|max:20',
            'employee_code' => ['sometimes', 'required', 'string', Rule::unique('users')->ignore($id)],
            'password' => 'nullable|string|min:8',
            'role_id' => 'sometimes|exists:roles,id',
            'technician_type' => 'nullable|in:employee,supervisor',
            'branch_id' => 'sometimes|required|exists:branches,id',
            'is_active' => 'nullable|in:0,1,true,false',
            'gender' => 'sometimes|required|in:male,female,other',
            'date_of_birth' => 'sometimes|required|date',
            'join_date' => 'sometimes|required|date',
            'left_date' => 'nullable|date',
            'emergency_contact_name' => 'sometimes|required|string|max:255',
            'emergency_contact_no' => 'sometimes|required|string|max:20',
            'profile_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            'special_notes' => 'nullable|string',
        ]);

        // If role_id is being updated, validate technician_type
        if (isset($validated['role_id'])) {
            $newRole = DB::table('roles')->where('id', $validated['role_id'])->first();
            if ($newRole && $newRole->name === 'technician') {
                if (!isset($validated['technician_type']) || empty($validated['technician_type'])) {
                    return response()->json(['message' => 'Technician type (employee or supervisor) is required for technician role'], 422);
                }
            } else {
                // Clear technician_type if role is not technician
                $validated['technician_type'] = null;
            }
        } elseif (isset($validated['technician_type'])) {
            // If updating technician_type, ensure current role is technician
            $currentRole = DB::table('roles')->where('id', $targetUser->role_id)->first();
            if (!$currentRole || $currentRole->name !== 'technician') {
                return response()->json(['message' => 'Technician type can only be set for technician role'], 422);
            }
        }

        // Branch Admin cannot change branch
        $role = DB::table('roles')->where('id', $user->role_id)->first();
        if ($role->name === 'branch_admin') {
            unset($validated['branch_id']);
        }

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        // Convert is_active to boolean
        if (isset($validated['is_active'])) {
            $validated['is_active'] = filter_var($validated['is_active'], FILTER_VALIDATE_BOOLEAN);
        }

        // Handle file upload if present
        if ($request->hasFile('profile_image')) {
            $file = $request->file('profile_image');
            // Delete old image if exists
            if ($targetUser->profile_image) {
                Storage::disk('public')->delete($targetUser->profile_image);
            }
            $path = $file->store('profiles', 'public');
            $validated['profile_image'] = $path;
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
    public function getRoles(Request $request)
    {
        $user = $request->user();
        $userRole = DB::table('roles')->where('id', $user->role_id)->first();
        
        $query = DB::table('roles')
            ->where('name', '!=', 'customer'); // Exclude customer role - customers are not employees
        
        // Branch admins cannot see super_admin role
        if ($userRole->name === 'branch_admin') {
            $query->where('name', '!=', 'super_admin');
        }
        
        $roles = $query->get();
        return response()->json($roles);
    }

    /**
     * Get all branches (for dropdown)
     */
    public function getBranches(Request $request)
    {
        $user = $request->user();
        $userRole = DB::table('roles')->where('id', $user->role_id)->first();
        
        // Super admin can see all branches, others see only their own
        if ($userRole->name === 'super_admin') {
            $branches = DB::table('branches')->where('is_active', true)->get();
        } else {
            $branches = DB::table('branches')
                ->where('id', $user->branch_id)
                ->where('is_active', true)
                ->get();
        }
        
        return response()->json($branches);
    }
}