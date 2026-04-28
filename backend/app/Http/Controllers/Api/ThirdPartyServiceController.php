<?php

namespace App\Http\Controllers\Api;

use App\Models\ThirdPartyService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ThirdPartyServiceController extends ApiController
{
    /**
     * Get all third party services
     */
    public function index(Request $request)
    {
        Log::info('🔵 === ThirdPartyServiceController::index() CALLED ===');
        try {
            // Check permission - can read service listings
            Log::info('🔵 Checking read permission...');
            $check = $this->checkReadPermission($request, 'view_third_party_services_tab');
            Log::info('🔵 Permission check result: ' . json_encode($check));
            if (!$check['allowed']) {
                Log::info('🔴 Permission denied, returning unauthorized');
                return $this->unauthorized($check['message']);
            }
            Log::info('🟢 Permission granted, continuing...');

            $query = ThirdPartyService::query();
            $user = $request->user()->load('role'); // Load role relationship

            Log::info('=== API Request ===');
            Log::info('User ID: ' . $user->id);
            Log::info('User Name: ' . $user->name);
            Log::info('User Branch ID: ' . ($user->branch_id ?? 'NULL'));
            Log::info('User Role loaded: ' . ($user->role ? 'YES' : 'NO'));
            Log::info('User Role ID: ' . ($user->role ? $user->role->id : 'NULL'));
            Log::info('User Role Name: ' . ($user->role ? $user->role->name : 'NULL'));
            Log::info('Request all params: ' . json_encode($request->all()));
            Log::info('Condition check: role->name !== "super_admin" = ' . var_export(($user->role && $user->role->name !== 'super_admin'), true));

            // For non-super-admins, only show their own branch's services
            if ($user->role->name !== 'super_admin') {
                Log::info('Not super admin - filtering to branch ' . $user->branch_id);
                $query->where('branch_id', $user->branch_id);
            } else {
                Log::info('Is super admin - no restriction');
            }

            // Super admin can filter by specific branch
            if ($user->role->name === 'super_admin' && $request->has('branch_id')) {
                $branchId = $request->input('branch_id');
                Log::info('Super admin filtering by branch_id: ' . $branchId);
                $query->where('branch_id', $branchId);
            }

            // Search
            if ($request->has('search')) {
                $search = $request->input('search');
                $query->where(function ($q) use ($search) {
                    $q->where('company_name', 'like', "%{$search}%")
                        ->orWhere('telephone_number', 'like', "%{$search}%")
                        ->orWhere('email_address', 'like', "%{$search}%");
                });
            }

            // Status filter
            if ($request->has('is_active')) {
                $query->where('is_active', $request->boolean('is_active'));
            }

            $services = $query->with('branch')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $services
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch third party services',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get single third party service
     */
    public function show($id, Request $request)
    {
        try {
            $service = ThirdPartyService::with('branch')->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $service
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Service not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Create new third party service
     */
    public function store(Request $request)
    {
        try {
            // Check permission to add provider
            $check = $this->checkReadPermission($request, 'add_third_party_provider');
            if (!$check['allowed']) {
                return response()->json(['success' => false, 'message' => $check['message']], 403);
            }

            $validated = $request->validate([
                'company_name' => 'required|string|max:255',
                'telephone_number' => 'required|string|max:20',
                'email_address' => 'nullable|email|max:255',
                'services_offered' => 'nullable|array',
                'is_active' => 'boolean',
                'branch_id' => 'required|integer|exists:branches,id'
            ]);

            $user = $request->user()->load('role'); // Load role relationship

            // For non-super-admins, force their own branch
            if ($user->role->name !== 'super_admin') {
                $validated['branch_id'] = (int) $user->branch_id;
            } else {
                // Ensure branch_id is integer for super_admin too
                $validated['branch_id'] = (int) $validated['branch_id'];
            }

            $validated['is_active'] = $validated['is_active'] ?? true;
            $validated['services_offered'] = $validated['services_offered'] ?? [];

            $service = ThirdPartyService::create($validated);

            return response()->json([
                'success' => true,
                'message' => 'Service provider created successfully',
                'data' => $service->load('branch')
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create service provider',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update third party service
     */
    public function update(Request $request, $id)
    {
        try {
            // Check permission
            $check = $this->checkReadPermission($request, 'add_third_party_provider');
            if (!$check['allowed']) {
                return response()->json(['success' => false, 'message' => $check['message']], 403);
            }

            $service = ThirdPartyService::findOrFail($id);
            $user = $request->user()->load('role'); // Load role relationship

            // For non-super-admins, only allow editing their own branch's services
            if ($user->role->name !== 'super_admin' && $user->branch_id != $service->branch_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'You can only edit services for your own branch'
                ], 403);
            }

            $validated = $request->validate([
                'company_name' => 'sometimes|required|string|max:255',
                'telephone_number' => 'sometimes|required|string|max:20',
                'email_address' => 'nullable|email|max:255',
                'services_offered' => 'nullable|array',
                'is_active' => 'boolean',
                'branch_id' => 'sometimes|required|integer|exists:branches,id'
            ]);

            // For branch_admin, force their own branch (prevent branch change)
            if ($user->role->name === 'branch_admin' && isset($validated['branch_id'])) {
                $validated['branch_id'] = (int) $user->branch_id;
            } elseif (isset($validated['branch_id'])) {
                // Ensure branch_id is integer for super_admin
                $validated['branch_id'] = (int) $validated['branch_id'];
            }

            $service->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Service provider updated successfully',
                'data' => $service->load('branch')
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update service provider',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete third party service
     */
    public function destroy($id, Request $request)
    {
        try {
            $service = ThirdPartyService::findOrFail($id);
            $user = $request->user()->load('role'); // Load role relationship

            // For branch_admin, only allow deleting their own branch's services
            if ($user->role->name === 'branch_admin' && $user->branch_id != $service->branch_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'You can only delete services for your own branch'
                ], 403);
            }

            $service->delete();

            return response()->json([
                'success' => true,
                'message' => 'Service provider deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete service provider',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
