<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JobCard;
use App\Models\JobCardImage;
use App\Models\OtherCharge;
use App\Models\Task;
use App\Models\Customer;
use App\Models\Vehicle;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use App\Models\Payment;

class JobCardController extends Controller
{
    /**
     * Get all job cards with filters and pagination
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = JobCard::with(['customer', 'vehicle', 'creator', 'branch']);

        // Branch filtering - non-super admins see only their branch job cards
        if ($user->role->name !== 'super_admin') {
            $query->where('branch_id', $user->branch_id);
        }

        // Manual branch filter restricted to super-admins
        if ($request->has('branch_id') && $user->role->name === 'super_admin') {
            $query->where('branch_id', $request->branch_id);
        }

        // Search filter
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('job_card_number', 'like', "%{$search}%")
                  ->orWhereHas('customer', function($cq) use ($search) {
                      $cq->where('name', 'like', "%{$search}%")
                         ->orWhere('phone', 'like', "%{$search}%");
                  })
                  ->orWhereHas('vehicle', function($vq) use ($search) {
                      $vq->where('license_plate', 'like', "%{$search}%");
                  });
            });
        }

        // Status filter
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $jobCards = $query->orderBy('created_at', 'desc')->paginate(15);

        return response()->json($jobCards);
    }

    /**
     * Get single job card with all relationships
     */
    public function show($id, Request $request)
    {
        $user = $request->user();
        
        $permissions = DB::table('permissions')
            ->join('role_permissions', 'permissions.id', '=', 'role_permissions.permission_id')
            ->where('role_permissions.role_id', $user->role_id)
            ->pluck('permissions.name')
            ->toArray();
        
        if (!in_array('view_job_cards', $permissions)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $jobCard = JobCard::with([
            'customer',
            'vehicle',
            'branch',
            'creator',
            'images',
            'tasks.assignedEmployees',
            'tasks.timeTracking',
            'tasks.sparePartsRequests',
            'sparePartsRequests.requestedBy',
            'sparePartsRequests.employeeApprovedBy',
            'sparePartsRequests.adminApprovedBy',
            'sparePartsRequests.task.assignedEmployees',
            'inspections.inspector',
            'invoices',
            'payments.receivedBy'
        ])->findOrFail($id);

        // Check branch access for branch admins
        $role = DB::table('roles')->where('id', $user->role_id)->first();
        if ($role->name === 'branch_admin' && $user->branch_id !== $jobCard->branch_id) {
            return response()->json(['message' => 'Unauthorized - Different branch'], 403);
        }

        // Manually fetch and attach otherCharges
        $jobCard->otherCharges = OtherCharge::where('job_card_id', $jobCard->id)->get()->toArray();

        // Ensure all tasks have their assigned employees loaded
        foreach ($jobCard->tasks as $task) {
            $task->load('assignedEmployees');
        }

        // Ensure all spare parts have their tasks with assigned employees loaded
        foreach ($jobCard->sparePartsRequests as $sparePart) {
            if ($sparePart->task_id) {
                // Reload the task with its assignedEmployees
                $sparePart->task = Task::with('assignedEmployees')->find($sparePart->task_id);
            }
        }

        // Convert to array to ensure all relationships are serialized
        $jobCardArray = $jobCard->toArray();
        
        // Manually add relationships that might not have been serialized
        $jobCardArray['tasks'] = $jobCard->tasks->map(function ($task) {
            $taskArray = $task->toArray();
            $taskArray['assigned_employees'] = $task->assignedEmployees->toArray();
            return $taskArray;
        })->toArray();

        $jobCardArray['sparePartsRequests'] = $jobCard->sparePartsRequests->map(function ($sparePart) {
            $sparePartArray = $sparePart->toArray();
            if ($sparePart->task_id && $sparePart->task) {
                $sparePartArray['task'] = $sparePart->task->toArray();
                $sparePartArray['task']['assigned_employees'] = $sparePart->task->assignedEmployees->toArray();
            }
            return $sparePartArray;
        })->toArray();

        return response()->json([
            'success' => true,
            'data' => $jobCardArray
        ]);
    }

    /**
     * Create new job card
     */
    public function store(Request $request)
    {
        $user = $request->user();
        
        $permissions = DB::table('permissions')
            ->join('role_permissions', 'permissions.id', '=', 'role_permissions.permission_id')
            ->where('role_permissions.role_id', $user->role_id)
            ->pluck('permissions.name')
            ->toArray();
        
        if (!in_array('add_job_cards', $permissions)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'vehicle_id' => 'required|exists:vehicles,id',
            'branch_id' => 'required|exists:branches,id',
            'expected_completion_date' => 'nullable|date',
            'test_run_required' => 'required|boolean',
            'details' => 'nullable|string',
            'current_mileage' => 'nullable|integer',
            'tasks' => 'nullable|array',
            'tasks.*.description' => 'required|string',
            'tasks.*.category' => 'required|string',
        ]);

        // Check branch permission
        $role = DB::table('roles')->where('id', $user->role_id)->first();
        
        // Super admin can create in any branch
        if ($role->name !== 'super_admin') {
            // Non-super-admins can only create in their own branch
            if ($validated['branch_id'] !== $user->branch_id) {
                return response()->json(['message' => 'You can only create job cards in your assigned branch'], 403);
            }
        }

        // Generate job card number
        $jobCardNumber = $this->generateJobCardNumber();
        $branchId = $validated['branch_id'];

        // Create job card
        $jobCard = JobCard::create([
            'job_card_number' => $jobCardNumber,
            'customer_id' => $validated['customer_id'],
            'vehicle_id' => $validated['vehicle_id'],
            'branch_id' => $branchId,
            'created_by' => $user->id,
            'expected_completion_date' => $validated['expected_completion_date'] ?? null,
            'customer_complaint' => $validated['details'] ?? '',
            'current_mileage' => $validated['current_mileage'] ?? null,
            'status' => 'pending', // Automatically set status to pending
        ]);

        // Create tasks if provided
        if (!empty($validated['tasks'])) {
            foreach ($validated['tasks'] as $taskData) {
                Task::create([
                    'job_card_id' => $jobCard->id,
                    'task_name' => $taskData['description'],
                    'category' => $taskData['category'],
                    'status' => 'pending',
                ]);
            }
        }

        return response()->json([
            'message' => 'Job card created successfully',
            'job_card' => $jobCard->load(['customer', 'vehicle', 'tasks'])
        ], 201);
    }

    /**
     * Update job card
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();
        
        $permissions = DB::table('permissions')
            ->join('role_permissions', 'permissions.id', '=', 'role_permissions.permission_id')
            ->where('role_permissions.role_id', $user->role_id)
            ->pluck('permissions.name')
            ->toArray();
        
        if (!in_array('update_job_cards', $permissions)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $jobCard = JobCard::findOrFail($id);

        // Check branch ownership for non-admin users
        if ($user->role->name !== 'super_admin' && $jobCard->branch_id !== $user->branch_id) {
            return response()->json(['message' => 'You can only update job cards in your branch'], 403);
        }

        if (!$jobCard->canBeEdited()) {
            return response()->json([
                'message' => 'Cannot edit job card in current status'
            ], 400);
        }

        $validated = $request->validate([
            'current_mileage' => 'nullable|integer|min:0',
            'customer_complaint' => 'sometimes|string',
            'initial_inspection_notes' => 'nullable|string',
            'recommendations' => 'nullable|string',
            'estimated_completion_date' => 'nullable|date',
            'parts_cost' => 'nullable|numeric|min:0',
            'other_charges' => 'nullable|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'advance_payment' => 'nullable|numeric|min:0',
        ]);

        $jobCard->update($validated);

        // Recalculate totals if pricing fields updated
        if ($request->hasAny(['parts_cost', 'other_charges', 'discount', 'advance_payment'])) {
            $jobCard->calculateTotals();
        }

        return response()->json([
            'message' => 'Job card updated successfully',
            'job_card' => $jobCard->fresh()->load(['customer', 'vehicle'])
        ]);
    }

    /**
     * Update job card status
     */
    public function updateStatus(Request $request, $id)
    {
        return response()->json(['message' => 'This endpoint is no longer available.'], 410);
    }

    /**
     * Upload images to job card
     */
    public function uploadImages(Request $request, $id)
    {
        $user = $request->user();
        
        $permissions = DB::table('permissions')
            ->join('role_permissions', 'permissions.id', '=', 'role_permissions.permission_id')
            ->where('role_permissions.role_id', $user->role_id)
            ->pluck('permissions.name')
            ->toArray();
        
        if (!in_array('add_job_cards', $permissions)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'images' => 'required|array|max:10',
            'images.*' => 'image|mimes:jpeg,png,jpg|max:5120', // 5MB max
            'image_type' => 'nullable|in:before,during,after',
            'descriptions' => 'nullable|array',
        ]);

        $jobCard = JobCard::findOrFail($id);
        $uploadedImages = [];
        $imageType = $request->image_type ?? 'before'; // Default to 'before' if not provided

        foreach ($request->file('images') as $index => $image) {
            // Store image
            $path = $image->store('job-cards/' . $jobCard->id, 'public');

            // Create image record
            $jobCardImage = JobCardImage::create([
                'job_card_id' => $jobCard->id,
                'image_path' => $path,
                'image_type' => $imageType,
                'description' => $request->descriptions[$index] ?? null,
                'order' => $index,
            ]);

            $uploadedImages[] = $jobCardImage;
        }

        return response()->json([
            'message' => count($uploadedImages) . ' image(s) uploaded successfully',
            'images' => $uploadedImages
        ], 201);
    }

    /**
     * Delete job card image
     */
    public function deleteImage($jobCardId, $imageId, Request $request)
    {
        $user = $request->user();
        
        $permissions = DB::table('permissions')
            ->join('role_permissions', 'permissions.id', '=', 'role_permissions.permission_id')
            ->where('role_permissions.role_id', $user->role_id)
            ->pluck('permissions.name')
            ->toArray();
        
        if (!in_array('delete_job_cards', $permissions)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $image = JobCardImage::where('job_card_id', $jobCardId)
            ->where('id', $imageId)
            ->firstOrFail();

        // Delete file from storage
        Storage::disk('public')->delete($image->image_path);

        // Delete database record
        $image->delete();

        return response()->json([
            'message' => 'Image deleted successfully'
        ]);
    }

    /**
     * Add task to job card
     */
    public function addTask(Request $request, $id)
    {
        $user = $request->user();
        
        $permissions = DB::table('permissions')
            ->join('role_permissions', 'permissions.id', '=', 'role_permissions.permission_id')
            ->where('role_permissions.role_id', $user->role_id)
            ->pluck('permissions.name')
            ->toArray();
        
        if (!in_array('add_tasks', $permissions)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $jobCard = JobCard::findOrFail($id);

        // Check if job card is completed or inspected
        if (in_array($jobCard->status, ['completed', 'inspected'])) {
            return response()->json([
                'message' => 'Cannot add tasks. Job card is ' . ($jobCard->status === 'completed' ? 'completed' : 'under inspection') . '.'
            ], 422);
        }

        $validated = $request->validate([
            'task_name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'required|in:mechanical,electrical,bodywork,painting,diagnostic,maintenance,other',
        ]);

        $validated['job_card_id'] = $jobCard->id;
        $validated['status'] = 'pending'; // Ensure default status is pending

        $task = Task::create($validated);

        return response()->json([
            'message' => 'Task added successfully',
            'task' => $task
        ], 201);
    }

    /**
     * Add charge to job card
     */
    public function addCharge(Request $request, $id)
    {
        $user = $request->user();
        
        $permissions = DB::table('permissions')
            ->join('role_permissions', 'permissions.id', '=', 'role_permissions.permission_id')
            ->where('role_permissions.role_id', $user->role_id)
            ->pluck('permissions.name')
            ->toArray();
        
        if (!in_array('add_job_cards', $permissions)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'description' => 'required|string|max:255',
            'cost_price' => 'required|numeric|min:0',
            'amount' => 'required|numeric|min:0',
        ]);

        $jobCard = JobCard::findOrFail($id);
        
        // Create the charge record
        $charge = OtherCharge::create([
            'job_card_id' => $jobCard->id,
            'description' => $validated['description'],
            'cost_price' => $validated['cost_price'],
            'amount' => $validated['amount'],
        ]);

        // Update job card other_charges total
        $jobCard->other_charges += $validated['amount'];
        $jobCard->save();

        return response()->json([
            'message' => 'Charge added successfully',
            'charge' => $charge
        ], 201);
    }

    /**
     * Get job card statistics (for dashboard)
     */
    public function getStatistics(Request $request)
    {
        $user = $request->user();
        
        $query = JobCard::query();

        // Branch filter
        $role = DB::table('roles')->where('id', $user->role_id)->first();
        if ($role->name === 'branch_admin' && $user->branch_id) {
            $query->where('branch_id', $user->branch_id);
        } elseif ($role->name === 'super_admin' && $request->has('branch_id')) {
            // Super admins can filter by any branch
            $query->where('branch_id', $request->branch_id);
        }

        $stats = [
            'total' => $query->count(),
            'pending' => (clone $query)->where('status', 'pending')->count(),
            'in_progress' => (clone $query)->where('status', 'in_progress')->count(),
            'completed' => (clone $query)->where('status', 'completed')->count(),
            'inspected' => (clone $query)->where('status', 'inspected')->count(),
            'total_revenue' => (clone $query)->whereIn('status', ['inspected'])->sum('total_amount'),
        ];

        return response()->json($stats);
    }

    /**
     * Generate unique job card number
     */
    private function generateJobCardNumber()
    {
        $year = date('Y');
        $prefix = "JC-{$year}-";
        
        // Get the last job card number for this year
        $lastJobCard = JobCard::where('job_card_number', 'like', "{$prefix}%")
            ->orderBy('id', 'desc')
            ->first();

        if ($lastJobCard) {
            // Extract the number part and increment
            $lastNumber = intval(substr($lastJobCard->job_card_number, -4));
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        return $prefix . str_pad($newNumber, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Delete job card
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        
        $permissions = DB::table('permissions')
            ->join('role_permissions', 'permissions.id', '=', 'role_permissions.permission_id')
            ->where('role_permissions.role_id', $user->role_id)
            ->pluck('permissions.name')
            ->toArray();
        
        if (!in_array('delete_job_cards', $permissions)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $jobCard = JobCard::findOrFail($id);

        // Check branch ownership for non-admin users
        if ($user->role->name !== 'super_admin' && $jobCard->branch_id !== $user->branch_id) {
            return response()->json(['message' => 'You can only delete job cards in your branch'], 403);
        }

        // Only allow deletion of pending or cancelled job cards
        if (!in_array($jobCard->status, ['pending', 'cancelled'])) {
            return response()->json([
                'message' => 'Cannot delete job card in current status. Only pending or cancelled job cards can be deleted.'
            ], 400);
        }

        // Delete associated images from storage
        foreach ($jobCard->images as $image) {
            Storage::disk('public')->delete($image->image_path);
        }

        $jobCard->delete();

        return response()->json([
            'message' => 'Job card deleted successfully'
        ]);
    }

    /**
     * Get statistics for all branches (super admin only)
     */
    public function getBranchStatistics(Request $request)
    {
        $user = $request->user();
        $role = DB::table('roles')->where('id', $user->role_id)->first();
        
        if ($role->name !== 'super_admin') {
            return response()->json(['message' => 'Super admin only'], 403);
        }

        $branches = DB::table('branches')->get();
        $stats = [];

        foreach ($branches as $branch) {
            $branchStats = [
                'branch_id' => $branch->id,
                'branch_name' => $branch->name,
                'total_job_cards' => JobCard::where('branch_id', $branch->id)->count(),
                'pending' => JobCard::where('branch_id', $branch->id)->where('status', 'pending')->count(),
                'in_progress' => JobCard::where('branch_id', $branch->id)->where('status', 'in_progress')->count(),
                'completed' => JobCard::where('branch_id', $branch->id)->where('status', 'completed')->count(),
                'total_revenue' => Payment::whereHas('jobCard', function($q) use ($branch) {
                    $q->where('branch_id', $branch->id);
                })->sum('amount'),
                'outstanding' => JobCard::where('branch_id', $branch->id)
                    ->where('balance_amount', '>', 0)
                    ->sum('balance_amount'),
            ];
            $stats[] = $branchStats;
        }

        return response()->json([
            'total_branches' => count($branches),
            'branch_stats' => $stats,
            'overall' => [
                'total_job_cards' => JobCard::count(),
                'total_revenue' => Payment::sum('amount'),
                'total_outstanding' => JobCard::where('balance_amount', '>', 0)->sum('balance_amount'),
            ]
        ]);
    }
}