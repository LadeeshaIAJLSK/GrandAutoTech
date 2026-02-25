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
     * Get all users (with filters and pagination)
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();

            // Start query - just get all users
            $query = User::with(['role', 'branch']);

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
            return response()->json(['message' => 'Error fetching users', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get single user
     */
    public function show($id, Request $request)
    {
        $user = $request->user();
        
        // Check permission
        $permissions = DB::table('permissions')
            ->join('role_permissions', 'permissions.id', '=', 'role_permissions.permission_id')
            ->where('role_permissions.role_id', $user->role_id)
            ->pluck('permissions.name')
            ->toArray();
        
        if (!in_array('view_users', $permissions)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $targetUser = User::with(['role', 'branch'])->findOrFail($id);

        // Branch Admin can only view users from their branch
        $role = DB::table('roles')->where('id', $user->role_id)->first();
        if ($role->name === 'branch_admin' && $user->branch_id !== $targetUser->branch_id) {
            return response()->json(['message' => 'Unauthorized - Different branch'], 403);
        }

        return response()->json($targetUser);
    }

    /**
     * Create new user
     */
    public function store(Request $request)
    {
        $user = $request->user();
        
        // Check permission
        $permissions = DB::table('permissions')
            ->join('role_permissions', 'permissions.id', '=', 'role_permissions.permission_id')
            ->where('role_permissions.role_id', $user->role_id)
            ->pluck('permissions.name')
            ->toArray();
        
        if (!in_array('add_users', $permissions)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Prevent anyone from creating super_admin users (only one super_admin allowed)
        $requestedRoleId = $request->input('role_id');
        if ($requestedRoleId) {
            $requestedRole = DB::table('roles')->where('id', $requestedRoleId)->first();
            if ($requestedRole && $requestedRole->name === 'super_admin') {
                return response()->json(['message' => 'Cannot create super admin users. There is only one super admin in the system.'], 403);
            }
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'phone' => 'nullable|string|max:20',
            'employee_code' => 'nullable|string|unique:users,employee_code',
            'password' => 'required|string|min:8',
            'role_id' => 'required|exists:roles,id',
            'branch_id' => 'nullable|exists:branches,id',
            'is_active' => 'boolean',
        ]);

        // Branch Admin can only create users in their branch
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
        
        // Check permission
        $permissions = DB::table('permissions')
            ->join('role_permissions', 'permissions.id', '=', 'role_permissions.permission_id')
            ->where('role_permissions.role_id', $user->role_id)
            ->pluck('permissions.name')
            ->toArray();
        
        if (!in_array('update_users', $permissions)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $targetUser = User::findOrFail($id);

        // Branch Admin can only update users from their branch
        $role = DB::table('roles')->where('id', $user->role_id)->first();
        if ($role->name === 'branch_admin' && $user->branch_id !== $targetUser->branch_id) {
            return response()->json(['message' => 'Unauthorized - Different branch'], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => ['sometimes', 'email', Rule::unique('users')->ignore($id)],
            'phone' => 'nullable|string|max:20',
            'employee_code' => ['nullable', 'string', Rule::unique('users')->ignore($id)],
            'password' => 'nullable|string|min:8',
            'role_id' => 'sometimes|exists:roles,id',
            'branch_id' => 'nullable|exists:branches,id',
            'is_active' => 'boolean',
        ]);

        // Branch Admin cannot change branch
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
        
        // Check permission
        $permissions = DB::table('permissions')
            ->join('role_permissions', 'permissions.id', '=', 'role_permissions.permission_id')
            ->where('role_permissions.role_id', $user->role_id)
            ->pluck('permissions.name')
            ->toArray();
        
        if (!in_array('delete_users', $permissions)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $targetUser = User::findOrFail($id);

        // Cannot delete yourself
        if ($targetUser->id === $user->id) {
            return response()->json(['message' => 'Cannot delete yourself'], 400);
        }

        // Branch Admin can only delete users from their branch
        $role = DB::table('roles')->where('id', $user->role_id)->first();
        if ($role->name === 'branch_admin' && $user->branch_id !== $targetUser->branch_id) {
            return response()->json(['message' => 'Unauthorized - Different branch'], 403);
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