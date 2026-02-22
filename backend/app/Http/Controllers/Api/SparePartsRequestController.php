<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SparePartsRequest;
use App\Models\JobCard;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SparePartsRequestController extends Controller
{
    /**
     * Get all spare parts requests for a job card
     */
    public function index($jobCardId)
    {
        $parts = SparePartsRequest::where('job_card_id', $jobCardId)
            ->with(['task', 'requestedBy', 'employeeApprovedBy', 'adminApprovedBy'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($parts);
    }

    /**
     * Create spare parts request
     */
    public function store(Request $request, $jobCardId)
    {
        $user = $request->user();
        
        $permissions = DB::table('permissions')
            ->join('role_permissions', 'permissions.id', '=', 'role_permissions.permission_id')
            ->where('role_permissions.role_id', $user->role_id)
            ->pluck('permissions.name')
            ->toArray();
        
        if (!in_array('add_spare_parts', $permissions)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'task_id' => 'nullable|exists:tasks,id',
            'part_name' => 'required|string|max:255',
            'part_number' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'quantity' => 'required|integer|min:1',
            'unit_cost' => 'required|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
        ]);

        $jobCard = JobCard::findOrFail($jobCardId);

        $part = SparePartsRequest::create([
            'job_card_id' => $jobCard->id,
            'task_id' => $validated['task_id'] ?? null,
            'requested_by' => $user->id,
            'part_name' => $validated['part_name'],
            'part_number' => $validated['part_number'] ?? null,
            'description' => $validated['description'] ?? null,
            'quantity' => $validated['quantity'],
            'unit_cost' => $validated['unit_cost'],
            'selling_price' => $validated['selling_price'],
        ]);

        $part->calculateTotal();

        return response()->json([
            'message' => 'Spare part requested successfully',
            'part' => $part->fresh()
        ], 201);
    }

    /**
     * Update spare parts request
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();
        
        $permissions = DB::table('permissions')
            ->join('role_permissions', 'permissions.id', '=', 'role_permissions.permission_id')
            ->where('role_permissions.role_id', $user->role_id)
            ->pluck('permissions.name')
            ->toArray();
        
        if (!in_array('update_spare_parts', $permissions)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $part = SparePartsRequest::findOrFail($id);

        // Can only edit if not yet approved
        if ($part->overall_status !== 'pending') {
            return response()->json([
                'message' => 'Cannot edit approved/rejected parts'
            ], 400);
        }

        $validated = $request->validate([
            'part_name' => 'sometimes|string|max:255',
            'part_number' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'quantity' => 'sometimes|integer|min:1',
            'unit_cost' => 'sometimes|numeric|min:0',
            'selling_price' => 'sometimes|numeric|min:0',
        ]);

        $part->update($validated);
        $part->calculateTotal();

        return response()->json([
            'message' => 'Spare part updated successfully',
            'part' => $part->fresh()
        ]);
    }

    /**
     * Delete spare parts request
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        
        $permissions = DB::table('permissions')
            ->join('role_permissions', 'permissions.id', '=', 'role_permissions.permission_id')
            ->where('role_permissions.role_id', $user->role_id)
            ->pluck('permissions.name')
            ->toArray();
        
        if (!in_array('delete_spare_parts', $permissions)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $part = SparePartsRequest::findOrFail($id);

        // Can only delete if pending
        if ($part->overall_status !== 'pending') {
            return response()->json([
                'message' => 'Cannot delete approved/rejected parts'
            ], 400);
        }

        $part->delete();

        return response()->json([
            'message' => 'Spare part deleted successfully'
        ]);
    }

    /**
     * Employee approval (Level 1)
     */
    public function employeeApprove(Request $request, $id)
    {
        $user = $request->user();
        
        $validated = $request->validate([
            'status' => 'required|in:approved,rejected',
            'notes' => 'nullable|string',
        ]);

        $part = SparePartsRequest::findOrFail($id);

        // Check if user is employee/technician
        $role = DB::table('roles')->where('id', $user->role_id)->first();
        if (!in_array($role->name, ['employee', 'super_admin', 'branch_admin'])) {
            return response()->json(['message' => 'Only employees can perform this action'], 403);
        }

        if ($part->employee_status !== 'pending') {
            return response()->json(['message' => 'Already processed by employee'], 400);
        }

        $part->update([
            'employee_status' => $validated['status'],
            'employee_approved_by' => $user->id,
            'employee_approved_at' => now(),
            'employee_notes' => $validated['notes'] ?? null,
        ]);

        // If rejected, mark overall status as rejected
        if ($validated['status'] === 'rejected') {
            $part->update(['overall_status' => 'rejected']);
        }

        return response()->json([
            'message' => "Employee {$validated['status']} the request",
            'part' => $part->fresh()
        ]);
    }

    /**
     * Admin approval (Level 1)
     */
    public function adminApprove(Request $request, $id)
    {
        $user = $request->user();
        
        $validated = $request->validate([
            'status' => 'required|in:approved,rejected',
            'notes' => 'nullable|string',
        ]);

        $part = SparePartsRequest::findOrFail($id);

        // Check if user is admin
        $role = DB::table('roles')->where('id', $user->role_id)->first();
        if (!in_array($role->name, ['super_admin', 'branch_admin'])) {
            return response()->json(['message' => 'Only admins can perform this action'], 403);
        }

        if ($part->admin_status !== 'pending') {
            return response()->json(['message' => 'Already processed by admin'], 400);
        }

        $part->update([
            'admin_status' => $validated['status'],
            'admin_approved_by' => $user->id,
            'admin_approved_at' => now(),
            'admin_notes' => $validated['notes'] ?? null,
        ]);

        // If rejected, mark overall status as rejected
        if ($validated['status'] === 'rejected') {
            $part->update(['overall_status' => 'rejected']);
        }

        return response()->json([
            'message' => "Admin {$validated['status']} the request",
            'part' => $part->fresh()
        ]);
    }

    /**
     * Customer approval (Level 3)
     */
    public function customerApprove(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|in:approved,rejected',
            'notes' => 'nullable|string',
        ]);

        $part = SparePartsRequest::findOrFail($id);

        // Must be approved by admin first
        if ($part->admin_status !== 'approved') {
            return response()->json(['message' => 'Must be approved by admin first'], 400);
        }

        if ($part->customer_status !== 'pending') {
            return response()->json(['message' => 'Already processed by customer'], 400);
        }

        $part->update([
            'customer_status' => $validated['status'],
            'customer_approved_at' => now(),
            'customer_notes' => $validated['notes'] ?? null,
        ]);

        // Update overall status
        if ($validated['status'] === 'rejected') {
            $part->update(['overall_status' => 'rejected']);
        } else {
            // Both levels approved (Admin & Customer)!
            $part->update(['overall_status' => 'approved']);
        }

        return response()->json([
            'message' => "Customer {$validated['status']} the request",
            'part' => $part->fresh()
        ]);
    }

    /**
     * Get pending approvals for current user
     */
    public function getPendingApprovals(Request $request)
    {
        $user = $request->user();
        $role = DB::table('roles')->where('id', $user->role_id)->first();

        $query = SparePartsRequest::with(['jobCard.customer', 'jobCard.vehicle', 'requestedBy']);

        if (in_array($role->name, ['super_admin', 'branch_admin'])) {
            // Admin level approvals only
            $query->where('admin_status', 'pending');
        } else {
            return response()->json([]);
        }

        $parts = $query->orderBy('created_at', 'desc')->get();

        return response()->json($parts);
    }

    /**
     * Confirm delivery (parts received by warehouse/customer)
     */
    public function confirmDelivery(Request $request, $id)
    {
        $user = $request->user();
        
        $part = SparePartsRequest::findOrFail($id);

        // Must be either 'approved' (have it) or 'received' (ordered and got it)
        if (!in_array($part->overall_status, ['approved', 'received'])) {
            return response()->json([
                'message' => 'Parts must be approved by admin and customer first'
            ], 400);
        }

        // Check authorization: must be the requesting employee OR authorized staff
        $isAuthorizedStaff = in_array($user->role->name ?? '', ['super_admin', 'branch_admin']);
        $isRequestingEmployee = $part->requested_by === $user->id;
        
        if (!$isAuthorizedStaff && !$isRequestingEmployee) {
            return response()->json([
                'message' => 'Only the requesting employee or authorized staff can confirm delivery'
            ], 403);
        }

        // Update status to installed (fully delivered)
        $part->update([
            'overall_status' => 'installed'
        ]);

        return response()->json([
            'message' => '✅ Parts delivery confirmed!',
            'part' => $part->fresh()
        ]);
    }

    /**
     * Update part status (ordered, received, installed)
     */
    public function updateStatus(Request $request, $id)
    {
        $user = $request->user();
        
        $permissions = DB::table('permissions')
            ->join('role_permissions', 'permissions.id', '=', 'role_permissions.permission_id')
            ->where('role_permissions.role_id', $user->role_id)
            ->pluck('permissions.name')
            ->toArray();
        
        if (!in_array('update_spare_parts', $permissions)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'overall_status' => 'required|in:ordered,received,installed',
            'actual_cost' => 'nullable|numeric|min:0',
        ]);

        $part = SparePartsRequest::findOrFail($id);

        // Must be fully approved first
        if (!$part->isFullyApproved()) {
            return response()->json([
                'message' => 'Part must be fully approved first'
            ], 400);
        }

        $updateData = [
            'overall_status' => $validated['overall_status']
        ];

        // If marking as received, save the actual cost
        if ($validated['overall_status'] === 'received' && isset($validated['actual_cost'])) {
            $updateData['unit_cost'] = $validated['actual_cost'];
            $updateData['total_cost'] = $validated['actual_cost'] * $part->quantity;
        }

        $part->update($updateData);

        return response()->json([
            'message' => "Status updated to {$validated['overall_status']}",
            'part' => $part->fresh()
        ]);
    }
}