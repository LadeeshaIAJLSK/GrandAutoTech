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
            ->with(['task.assignedEmployees', 'requestedBy', 'employeeApprovedBy', 'adminApprovedBy'])
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
        
        if (!$user->hasPermission('add_job_card_spare_part')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'task_id' => 'nullable|exists:tasks,id',
            'part_name' => 'required|string|max:255',
            'part_number' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'quantity' => 'nullable|integer|min:0',
        ]);

        $jobCard = JobCard::findOrFail($jobCardId);

        // If task_id is provided, check if task status allows requesting parts
        if ($validated['task_id']) {
            $task = \App\Models\Task::findOrFail($validated['task_id']);
            
            // Only allow requesting parts if task is 'assigned' or 'in_progress'
            if (!in_array($task->status, ['assigned', 'in_progress'])) {
                return response()->json([
                    'message' => 'Cannot request spare parts for this task. Task must be in assigned or in progress status.',
                    'task_status' => $task->status
                ], 422);
            }
        }

        $part = SparePartsRequest::create([
            'job_card_id' => $jobCard->id,
            'task_id' => $validated['task_id'] ?? null,
            'requested_by' => $user->id,
            'part_name' => $validated['part_name'],
            'part_number' => $validated['part_number'] ?? null,
            'description' => $validated['description'] ?? null,
            'quantity' => $validated['quantity'],
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
        
        // Check if user is super admin
        $isSuperAdmin = $user->role && ($user->role->name === 'super_admin');
        
        // Check authorization: super admin OR has edit_job_card_spare_part permission
        if (!$isSuperAdmin && !$user->hasPermission('edit_job_card_spare_part')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $part = SparePartsRequest::findOrFail($id);

        // Can only edit if not yet approved, UNLESS user is super admin or requesting force_update
        if (!$isSuperAdmin && !$request->get('force_update') && $part->overall_status !== 'pending') {
            return response()->json([
                'message' => 'Cannot edit approved/rejected parts'
            ], 400);
        }

        $validated = $request->validate([
            'task_id' => 'nullable|exists:tasks,id',
            'part_name' => 'sometimes|string|max:255',
            'part_number' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'quantity' => 'nullable|integer|min:0',
            'unit_cost' => 'sometimes|numeric|min:0',
            'cost_price' => 'sometimes|numeric|min:0',
            'selling_price' => 'sometimes|numeric|min:0',
        ]);

        // Map cost_price to unit_cost if provided
        if (isset($validated['cost_price'])) {
            $validated['unit_cost'] = $validated['cost_price'];
            unset($validated['cost_price']);
        }

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
        
        if (!$user->hasPermission('delete_job_card_spare_part')) {
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
        
        if (!$user->hasPermission('approve_job_card_spare_part')) {
            return response()->json(['message' => 'You do not have permission to approve spare parts'], 403);
        }

        $validated = $request->validate([
            'status' => 'required|in:approved,rejected',
            'notes' => 'nullable|string',
        ]);

        $part = SparePartsRequest::findOrFail($id);

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
     * Admin approval (Level 1 - Supervisor)
     */
    public function adminApprove(Request $request, $id)
    {
        $user = $request->user();
        
        // Check if user is super admin
        $isSuperAdmin = $user->role && ($user->role->name === 'super_admin');
        
        // Check authorization: super admin OR has approve_job_card_spare_part_supervisor permission
        if (!$isSuperAdmin && !$user->hasPermission('approve_job_card_spare_part_supervisor')) {
            return response()->json(['message' => 'You do not have permission to approve spare parts (Supervisor Level)'], 403);
        }

        $validated = $request->validate([
            'status' => 'required|in:approved,rejected',
            'notes' => 'nullable|string',
        ]);

        $part = SparePartsRequest::findOrFail($id);

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
     * Customer approval (Level 2)
     */
    public function customerApprove(Request $request, $id)
    {
        $user = $request->user();
        
        // Check if user is super admin
        $isSuperAdmin = $user->role && ($user->role->name === 'super_admin');
        
        // Check authorization: super admin OR has approve_job_card_spare_part_customer permission
        if (!$isSuperAdmin && !$user->hasPermission('approve_job_card_spare_part_customer')) {
            return response()->json(['message' => 'You do not have permission to approve spare parts (Customer Level)'], 403);
        }
        
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
     * Confirm delivery (parts handed over to employee)
     */
    public function confirmDelivery(Request $request, $id)
    {
        $user = $request->user();
        
        // Check authorization: must have confirm_job_card_spare_part_delivery permission OR be super admin
        $isSuperAdmin = $user->role && ($user->role->name === 'super_admin');
        if (!$isSuperAdmin && !$user->hasPermission('confirm_job_card_spare_part_delivery')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        $part = SparePartsRequest::findOrFail($id);

        // Must be in 'process' status (either from stock or received from supplier)
        if ($part->overall_status !== 'process') {
            return response()->json([
                'message' => 'Parts must be in process status (available)'
            ], 400);
        }

        // Update status to delivered
        $part->update([
            'overall_status' => 'delivered'
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
        
        // Check authorization: must have update_job_card_spare_part_status permission OR be super admin
        $isSuperAdmin = $user->role && ($user->role->name === 'super_admin');
        if (!$isSuperAdmin && !$user->hasPermission('update_job_card_spare_part_status')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        $part = SparePartsRequest::findOrFail($id);

        $validated = $request->validate([
            'overall_status' => 'required|in:ordered,process,delivered',
            'actual_cost' => 'nullable|numeric|min:0',
        ]);

        // Must be fully approved first
        if (!$part->isFullyApproved()) {
            return response()->json([
                'message' => 'Part must be fully approved first'
            ], 400);
        }

        $updateData = [
            'overall_status' => $validated['overall_status']
        ];

        // If marking as process (received from supplier), save the actual cost
        if ($validated['overall_status'] === 'process' && isset($validated['actual_cost'])) {
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