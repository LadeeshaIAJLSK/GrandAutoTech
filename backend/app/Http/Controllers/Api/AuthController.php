<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use App\Models\User;

class AuthController extends Controller
{
    /**
     * Login user and return token with permissions
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
            'remember_me' => 'nullable|boolean',
        ]);

        $user = User::where('email', $request->email)->first();

        // Check if user exists and password is correct
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Invalid credentials'
            ], 401);
        }

        // Check if user is active
        if (!$user->is_active) {
            return response()->json([
                'message' => 'Your account has been deactivated'
            ], 403);
        }

        // Get user's role
        $role = DB::table('roles')->where('id', $user->role_id)->first();

        // Get user's permissions (global and branch-specific)
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

        // Get branch info if user has one
        $branch = null;
        if ($user->branch_id) {
            $branch = DB::table('branches')->where('id', $user->branch_id)->first();
        }

        // Handle remember me functionality
        if ($request->remember_me) {
            $rememberToken = \Illuminate\Support\Str::random(60);
            $user->remember_token = $rememberToken;
            $user->save();
        } else {
            // Clear remember token if not checking remember me
            $user->remember_token = null;
            $user->save();
        }

        // Create token  Login once → get token → send token every request

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'employee_code' => $user->employee_code,
                'role' => [
                    'id' => $role->id,
                    'name' => $role->name,
                    'display_name' => $role->display_name,
                ],
                'branch' => $branch ? [
                    'id' => $branch->id,
                    'name' => $branch->name,
                    'code' => $branch->code,
                ] : null,
                'permissions' => $permissions,
            ],
            'token' => $token,
        ], 200);
    }

    /**
     * Logout user (revoke token)
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully'
        ], 200);
    }

    /**
     * Get authenticated user info havent't used yet, but this will be useful for fetching user details on 
     * frontend after login and also for token validation on each request
     */
    public function me(Request $request)
    {
        $user = $request->user();
        
        $role = DB::table('roles')->where('id', $user->role_id)->first();
        
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

        // Does this user have branch assigned? Fetch that branch 

        $branch = null;
        if ($user->branch_id) {
            $branch = DB::table('branches')->where('id', $user->branch_id)->first();
        }

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'employee_code' => $user->employee_code,
                'role' => [
                    'id' => $role->id,
                    'name' => $role->name,
                    'display_name' => $role->display_name,
                ],
                'branch' => $branch ? [
                    'id' => $branch->id,
                    'name' => $branch->name,
                    'code' => $branch->code,
                ] : null,
                'permissions' => $permissions,
            ],
        ], 200);
    }
}