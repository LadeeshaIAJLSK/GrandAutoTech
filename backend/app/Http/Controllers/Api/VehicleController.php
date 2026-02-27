<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Vehicle;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class VehicleController extends Controller
{
    /**
     * Get all vehicles with filters and pagination
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        // Check permission
        $permissions = DB::table('permissions')
            ->join('role_permissions', 'permissions.id', '=', 'role_permissions.permission_id')
            ->where('role_permissions.role_id', $user->role_id)
            ->pluck('permissions.name')
            ->toArray();
        
        if (!in_array('view_vehicles', $permissions)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = Vehicle::with(['customer', 'branch']);

        // Search filter
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('license_plate', 'like', "%{$search}%")
                  ->orWhere('make', 'like', "%{$search}%")
                  ->orWhere('model', 'like', "%{$search}%")
                  ->orWhere('vin', 'like', "%{$search}%");
            });
        }

        // Filter by customer
        if ($request->has('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        // Filter by make
        if ($request->has('make')) {
            $query->where('make', $request->make);
        }

        // Status filter
        if ($request->has('is_active')) {
            $query->where('is_active', $request->is_active);
        }

        $vehicles = $query->orderBy('created_at', 'desc')->paginate(10);

        return response()->json($vehicles);
    }

    /**
     * Get single vehicle
     */
    public function show($id, Request $request)
    {
        $user = $request->user();
        
        $permissions = DB::table('permissions')
            ->join('role_permissions', 'permissions.id', '=', 'role_permissions.permission_id')
            ->where('role_permissions.role_id', $user->role_id)
            ->pluck('permissions.name')
            ->toArray();
        
        if (!in_array('view_vehicles', $permissions)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $vehicle = Vehicle::with(['customer', 'branch'])->findOrFail($id);

        return response()->json($vehicle);
    }

    /**
     * Create new vehicle
     */
    public function store(Request $request)
    {
        $user = $request->user();
        
        $permissions = DB::table('permissions')
            ->join('role_permissions', 'permissions.id', '=', 'role_permissions.permission_id')
            ->where('role_permissions.role_id', $user->role_id)
            ->pluck('permissions.name')
            ->toArray();
        
        if (!in_array('add_vehicles', $permissions)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'license_plate' => 'required|string|unique:vehicles,license_plate',
            'make' => 'required|string|max:100',
            'model' => 'required|string|max:100',
            'year' => 'required|string|max:4',
            'color' => 'nullable|string|max:50',
            'vin' => 'nullable|string|max:50',
            'engine_number' => 'nullable|string|max:50',
            'chassis_number' => 'nullable|string|max:50',
            'mileage' => 'nullable|integer|min:0',
            'fuel_type' => 'nullable|string|max:50',
            'transmission' => 'nullable|string|max:50',
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        // Get customer and validate ownership for non-admin users
        $customer = Customer::findOrFail($validated['customer_id']);
        
        if ($user->role_id !== 1 && $customer->branch_id !== $user->branch_id) {
            return response()->json(['message' => 'You can only create vehicles for customers in your branch'], 403);
        }

        // Auto-link vehicle to customer's branch
        $validated['branch_id'] = $customer->branch_id;

        $vehicle = Vehicle::create($validated);

        return response()->json([
            'message' => 'Vehicle registered successfully',
            'vehicle' => $vehicle->load(['customer', 'branch'])
        ], 201);
    }

    /**
     * Update vehicle
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();
        
        $permissions = DB::table('permissions')
            ->join('role_permissions', 'permissions.id', '=', 'role_permissions.permission_id')
            ->where('role_permissions.role_id', $user->role_id)
            ->pluck('permissions.name')
            ->toArray();
        
        if (!in_array('update_vehicles', $permissions)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $vehicle = Vehicle::with('customer')->findOrFail($id);
        
        // Check branch ownership for non-admin users
        if ($user->role_id !== 1 && $vehicle->branch_id !== $user->branch_id) {
            return response()->json(['message' => 'You can only update vehicles in your branch'], 403);
        }

        $validated = $request->validate([
            'customer_id' => 'sometimes|exists:customers,id',
            'license_plate' => ['sometimes', 'string', Rule::unique('vehicles')->ignore($id)],
            'make' => 'sometimes|string|max:100',
            'model' => 'sometimes|string|max:100',
            'year' => 'sometimes|string|max:4',
            'color' => 'nullable|string|max:50',
            'vin' => 'nullable|string|max:50',
            'engine_number' => 'nullable|string|max:50',
            'chassis_number' => 'nullable|string|max:50',
            'mileage' => 'nullable|integer|min:0',
            'fuel_type' => 'nullable|string|max:50',
            'transmission' => 'nullable|string|max:50',
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        // Prevent reassigning vehicle to different branch (for non-admin)
        if (isset($validated['customer_id']) && $vehicle->customer_id !== $validated['customer_id']) {
            $newCustomer = Customer::findOrFail($validated['customer_id']);
            if ($user->role_id !== 1 && $newCustomer->branch_id !== $user->branch_id) {
                return response()->json(['message' => 'You can only reassign vehicles within your branch'], 403);
            }
            $validated['branch_id'] = $newCustomer->branch_id;
        }

        $vehicle->update($validated);

        return response()->json([
            'message' => 'Vehicle updated successfully',
            'vehicle' => $vehicle->load(['customer', 'branch'])
        ]);
    }

    /**
     * Delete vehicle
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        
        $permissions = DB::table('permissions')
            ->join('role_permissions', 'permissions.id', '=', 'role_permissions.permission_id')
            ->where('role_permissions.role_id', $user->role_id)
            ->pluck('permissions.name')
            ->toArray();
        
        if (!in_array('delete_vehicles', $permissions)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $vehicle = Vehicle::findOrFail($id);
        
        // Check branch ownership for non-admin users
        if ($user->role_id !== 1 && $vehicle->branch_id !== $user->branch_id) {
            return response()->json(['message' => 'You can only delete vehicles in your branch'], 403);
        }

        // TODO: Check if vehicle has active job cards
        // if ($vehicle->jobCards()->where('status', '!=', 'completed')->count() > 0) {
        //     return response()->json([
        //         'message' => 'Cannot delete vehicle with active job cards.'
        //     ], 400);
        // }

        $vehicle->delete();

        return response()->json([
            'message' => 'Vehicle deleted successfully'
        ]);
    }

    /**
     * Get vehicles by customer
     */
    public function getByCustomer($customerId, Request $request)
    {
        $vehicles = Vehicle::where('customer_id', $customerId)
            ->where('is_active', true)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($vehicles);
    }

    /**
     * Quick search (for autocomplete in job card creation)
     */
    public function quickSearch(Request $request)
    {
        $search = $request->get('query', '');
        
        $vehicles = Vehicle::with('customer')
            ->where('license_plate', 'like', "%{$search}%")
            ->where('is_active', true)
            ->limit(10)
            ->get();

        return response()->json($vehicles);
    }

    /**
     * Get vehicle makes (for dropdown)
     */
    public function getMakes()
    {
        $makes = Vehicle::select('make')
            ->distinct()
            ->orderBy('make')
            ->pluck('make');

        return response()->json($makes);
    }
}