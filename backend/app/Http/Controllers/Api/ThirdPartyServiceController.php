<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ThirdPartyService;
use Illuminate\Http\Request;

class ThirdPartyServiceController extends Controller
{
    /**
     * Get all third party services
     */
    public function index(Request $request)
    {
        try {
            $query = ThirdPartyService::query();
            $user = $request->user();

            // For branch_admin, only show their own branch's services
            if ($user->role->name === 'branch_admin') {
                $query->where('branch_id', $user->branch_id);
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
            $validated = $request->validate([
                'company_name' => 'required|string|max:255',
                'telephone_number' => 'required|string|max:20',
                'email_address' => 'nullable|email|max:255',
                'services_offered' => 'nullable|array',
                'is_active' => 'boolean',
                'branch_id' => 'required|exists:branches,id'
            ]);

            $user = $request->user();

            // For branch_admin, force their own branch
            if ($user->role->name === 'branch_admin') {
                $validated['branch_id'] = $user->branch_id;
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
            $service = ThirdPartyService::findOrFail($id);
            $user = $request->user();

            // For branch_admin, only allow editing their own branch's services
            if ($user->role->name === 'branch_admin' && $user->branch_id != $service->branch_id) {
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
                'branch_id' => 'sometimes|required|exists:branches,id'
            ]);

            // For branch_admin, force their own branch (prevent branch change)
            if ($user->role->name === 'branch_admin') {
                $validated['branch_id'] = $user->branch_id;
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
            $user = $request->user();

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
