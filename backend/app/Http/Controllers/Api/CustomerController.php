<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CustomerController extends Controller
{
    /**
     * Check READ permission (no branch restriction)
     * Used for: VIEW operations
     */
    private function checkReadPermission($user, $permission)
    {
        $role = DB::table('roles')->where('id', $user->role_id)->first();
        
        // Super admin can read everything from all branches - no permission check needed
        if ($role->name === 'super_admin') {
            return ['allowed' => true];
        }
        
        // Other roles: check if they have permission (any branch)
        $permissions = DB::table('permissions')
            ->join('role_permissions', 'permissions.id', '=', 'role_permissions.permission_id')
            ->where('role_permissions.role_id', $user->role_id)
            ->where(function($query) use ($user) {
                $query->whereNull('role_permissions.branch_id')
                      ->orWhere('role_permissions.branch_id', $user->branch_id);
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
            ->pluck('permissions.name')
            ->toArray();
        
        if (!in_array($permission, $permissions)) {
            return ['allowed' => false, 'message' => 'Unauthorized - Permission denied in your branch'];
        }
        
        // Check branch match - branch admin can only create/edit customers for their own branch
        if ($targetBranchId !== $user->branch_id) {
            return ['allowed' => false, 'message' => 'Unauthorized - You can only manage customers in your assigned branch'];
        }
        
        return ['allowed' => true];
    }

    /**
     * Get all customers with filters and pagination
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        // Check READ permission (no branch restriction)
        $check = $this->checkReadPermission($user, 'view_customers');
        if (!$check['allowed']) {
            return response()->json(['message' => $check['message']], 403);
        }
        
        // Fetch customers AND their vehicles together
        $query = Customer::with(['vehicles', 'branch']);
        
        $userRole = DB::table('roles')->where('id', $user->role_id)->first();
        
        // Branch filtering - SUPER ADMIN can view all or filter by branch, BRANCH ADMIN can view all, others see only their branch
        // UNLESS ?all=true is specified (for job card creation where vehicles can come from other branches)
        if ($request->has('all') && $request->all === 'true') {
            // Allow all users to see customers from all branches when explicitly requested (for job card creation)
            // No branch filtering applied
        } elseif ($userRole->name === 'super_admin') {
            // Super admin: can view ALL customers from ALL branches, or filter by branch if provided
            if ($request->has('branch_id') && $request->branch_id) {
                $query->where('branch_id', $request->branch_id);
            }
        } elseif ($userRole->name === 'branch_admin') {
            // Branch admin: can view all customers from all branches (no restriction)
            // No filtering applied - they see everything
        } else {
            // Other roles (employees): filter by their own branch only
            $query->where('branch_id', $user->branch_id);
        }

        // Search filter
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('company_name', 'like', "%{$search}%");
            });
        }

        // Customer type filter
        if ($request->has('customer_type')) {
            $query->where('customer_type', $request->customer_type);
        }

        // Status filter
        if ($request->has('is_active')) {
            $query->where('is_active', $request->is_active);
        }

        $customers = $query->orderBy('created_at', 'desc')->paginate(10);

        return response()->json($customers);
    }

    /**
     * Get single customer with vehicles
     */
    public function show($id, Request $request)
    {
        $user = $request->user();
        
        // Check READ permission (no branch restriction)
        $check = $this->checkReadPermission($user, 'view_customers');
        if (!$check['allowed']) {
            return response()->json(['message' => $check['message']], 403);
        }

        $customer = Customer::with(['vehicles', 'branch'])->findOrFail($id);
        
        // Only super-admin and branch-admin can view customers from any branch
        $userRole = DB::table('roles')->where('id', $user->role_id)->first();
        if ($userRole->name !== 'super_admin' && $userRole->name !== 'branch_admin' && $customer->branch_id !== $user->branch_id) {
            return response()->json(['message' => 'You can only view customers from your own branch'], 403);
        }

        return response()->json($customer);
    }

    /**
     * Create new customer
     */
    public function store(Request $request)
    {
        $user = $request->user();
        
        // Validate input first (branch_id is required from frontend)
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|unique:customers,email',
            'phone' => 'required|string|max:20',
            'secondary_phone' => 'nullable|string|max:20',
            'address' => 'required|string',
            'city' => 'required|string|max:100',
            'id_number' => 'nullable|string|max:50',
            'company_name' => 'nullable|required_if:customer_type,business|string|max:255',
            'customer_type' => 'required|in:individual,business',
            'branch_id' => 'required|exists:branches,id',
            'is_active' => 'boolean',
            'notes' => 'nullable|string',
        ]);

        // Check WRITE permission (with branch restriction)
        // Branch admin can only create customers for their own branch
        // Super admin can create for any branch
        $check = $this->checkWritePermission($user, 'add_customers', $validated['branch_id']);
        if (!$check['allowed']) {
            return response()->json(['message' => $check['message']], 403);
        }

        $customer = Customer::create($validated);

        return response()->json([
            'message' => 'Customer created successfully',
            'customer' => $customer
        ], 201);
    }

    /**
     * Update customer
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();
        
        $customer = Customer::findOrFail($id);
        
        // Check WRITE permission (with branch restriction)
        $check = $this->checkWritePermission($user, 'update_customers', $customer->branch_id);
        if (!$check['allowed']) {
            return response()->json(['message' => $check['message']], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'nullable|email|unique:customers,email,' . $id,
            'phone' => 'sometimes|string|max:20',
            'secondary_phone' => 'nullable|string|max:20',
            'address' => 'required|string',
            'city' => 'required|string|max:100',
            'id_number' => 'nullable|string|max:50',
            'company_name' => 'nullable|required_if:customer_type,business|string|max:255',
            'customer_type' => 'sometimes|in:individual,business',
            'branch_id' => 'sometimes|exists:branches,id',
            'is_active' => 'boolean',
            'notes' => 'nullable|string',
        ]);

        // If branch_id is being changed, verify it's allowed for the user
        if ($request->has('branch_id') && $validated['branch_id'] !== $customer->branch_id) {
            $check = $this->checkWritePermission($user, 'update_customers', $validated['branch_id']);
            if (!$check['allowed']) {
                return response()->json(['message' => 'You cannot reassign customer to a different branch'], 403);
            }
        }

        $customer->update($validated);

        return response()->json([
            'message' => 'Customer updated successfully',
            'customer' => $customer
        ]);
    }

    /**
     * Delete customer
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        
        $customer = Customer::findOrFail($id);

        // Check WRITE permission (with branch restriction)
        $check = $this->checkWritePermission($user, 'delete_customers', $customer->branch_id);
        if (!$check['allowed']) {
            return response()->json(['message' => $check['message']], 403);
        }

        // Check if customer has vehicles
        if ($customer->vehicles()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete customer with registered vehicles. Please delete vehicles first.'
            ], 400);
        }

        $customer->delete();

        return response()->json([
            'message' => 'Customer deleted successfully'
        ]);
    }

    /**
     * Quick search (for autocomplete in job card creation)
     */
    public function quickSearch(Request $request)
    {
        $user = $request->user();
        $search = $request->get('query', '');
        
        $query = Customer::where('is_active', true)
            ->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        
        // Branch admin and super admin can search all customers
        $userRole = DB::table('roles')->where('id', $user->role_id)->first();
        if ($userRole->name !== 'super_admin' && $userRole->name !== 'branch_admin') {
            // Other roles: search only their branch
            $query->where('branch_id', $user->branch_id);
        }
        
        $customers = $query->limit(10)->get(['id', 'name', 'phone', 'email']);

        return response()->json($customers);
    }
}