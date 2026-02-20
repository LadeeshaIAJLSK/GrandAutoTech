<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JobCard;
use App\Models\JobCardImage;
use App\Models\Task;
use App\Models\Customer;
use App\Models\Vehicle;
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
        
        // Check permission
        $permissions = DB::table('permissions')
            ->join('role_permissions', 'permissions.id', '=', 'role_permissions.permission_id')
            ->where('role_permissions.role_id', $user->role_id)
            ->pluck('permissions.name')
            ->toArray();
        
        if (!in_array('view_job_cards', $permissions)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = JobCard::with(['customer', 'vehicle', 'creator', 'branch']);

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

        // Customer filter
        if ($request->has('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        // Vehicle filter
        if ($request->has('vehicle_id')) {
            $query->where('vehicle_id', $request->vehicle_id);
        }

        // Branch filter (for super admin and branch admins)
        $role = DB::table('roles')->where('id', $user->role_id)->first();
        // NEW: If branch_id is provided in request, use it (for super admin)
        if ($request->has('branch_id') && $role->name === 'super_admin') {
            if ($request->branch_id !== 'all') {
                $query->where('branch_id', $request->branch_id);
            }
            // If 'all', don't filter by branch
        } elseif ($role->name === 'branch_admin' && $user->branch_id) {
            // Branch admin can only see their branch
            $query->where('branch_id', $user->branch_id);
        }
        // Super admin without branch filter sees all branches

        // Date range filter
        if ($request->has('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->has('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
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
            'inspections.inspector',
            'invoices',
            'payments.receivedBy'
        ])->findOrFail($id);

        // Check branch access for branch admins
        $role = DB::table('roles')->where('id', $user->role_id)->first();
        if ($role->name === 'branch_admin' && $user->branch_id !== $jobCard->branch_id) {
            return response()->json(['message' => 'Unauthorized - Different branch'], 403);
        }

        return response()->json($jobCard);
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
            'current_mileage' => 'nullable|integer|min:0',
            'customer_complaint' => 'required|string',
            'initial_inspection_notes' => 'nullable|string',
            'recommendations' => 'nullable|string',
            'estimated_completion_date' => 'nullable|date',
        ]);

        // Auto-generate job card number
        $validated['job_card_number'] = $this->generateJobCardNumber();
        $validated['created_by'] = $user->id;
        $validated['branch_id'] = $user->branch_id;
        $validated['status'] = 'pending';

        // Update vehicle mileage if provided
        if (isset($validated['current_mileage'])) {
            $vehicle = Vehicle::find($validated['vehicle_id']);
            $vehicle->updateMileage($validated['current_mileage']);
        }

        $jobCard = JobCard::create($validated);

        return response()->json([
            'message' => 'Job card created successfully',
            'job_card' => $jobCard->load(['customer', 'vehicle', 'creator'])
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
            'labor_cost' => 'nullable|numeric|min:0',
            'parts_cost' => 'nullable|numeric|min:0',
            'other_charges' => 'nullable|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'advance_payment' => 'nullable|numeric|min:0',
        ]);

        $jobCard->update($validated);

        // Recalculate totals if pricing fields updated
        if ($request->hasAny(['labor_cost', 'parts_cost', 'other_charges', 'discount', 'advance_payment'])) {
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
        $user = $request->user();
        
        $permissions = DB::table('permissions')
            ->join('role_permissions', 'permissions.id', '=', 'role_permissions.permission_id')
            ->where('role_permissions.role_id', $user->role_id)
            ->pluck('permissions.name')
            ->toArray();
        
        if (!in_array('update_job_cards', $permissions)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'status' => 'required|in:pending,in_progress,waiting_parts,waiting_customer,quality_check,completed,invoiced,paid,cancelled'
        ]);

        $jobCard = JobCard::findOrFail($id);
        $oldStatus = $jobCard->status;
        $jobCard->status = $validated['status'];

        // Auto-set completion date when status changes to completed
        if ($validated['status'] === 'completed' && !$jobCard->actual_completion_date) {
            $jobCard->actual_completion_date = now();
        }

        $jobCard->save();

        return response()->json([
            'message' => "Job card status changed from {$oldStatus} to {$validated['status']}",
            'job_card' => $jobCard
        ]);
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
            'image_type' => 'required|in:before,during,after',
            'descriptions' => 'nullable|array',
        ]);

        $jobCard = JobCard::findOrFail($id);
        $uploadedImages = [];

        foreach ($request->file('images') as $index => $image) {
            // Store image
            $path = $image->store('job-cards/' . $jobCard->id, 'public');

            // Create image record
            $jobCardImage = JobCardImage::create([
                'job_card_id' => $jobCard->id,
                'image_path' => $path,
                'image_type' => $request->image_type,
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

        $validated = $request->validate([
            'task_name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'required|in:mechanical,electrical,bodywork,painting,diagnostic,maintenance,other',
            'labor_hours' => 'nullable|numeric|min:0',
            'labor_rate_per_hour' => 'nullable|numeric|min:0',
            'estimated_duration_minutes' => 'nullable|integer|min:0',
            'priority' => 'nullable|integer|in:0,1,2',
        ]);

        $jobCard = JobCard::findOrFail($id);
        $validated['job_card_id'] = $jobCard->id;

        $task = Task::create($validated);

        // Calculate labor cost if both hours and rate provided
        if ($task->labor_hours && $task->labor_rate_per_hour) {
            $task->calculateLaborCost();
        }

        return response()->json([
            'message' => 'Task added successfully',
            'task' => $task
        ], 201);
    }

    /**
     * Get job card statistics (for dashboard)
     */
    public function getStatistics(Request $request)
    {
        $user = $request->user();
        
        $query = JobCard::query();

        // Branch filter for branch admins
        $role = DB::table('roles')->where('id', $user->role_id)->first();
        if ($role->name === 'branch_admin' && $user->branch_id) {
            $query->where('branch_id', $user->branch_id);
        }

        $stats = [
            'total' => $query->count(),
            'pending' => (clone $query)->where('status', 'pending')->count(),
            'in_progress' => (clone $query)->where('status', 'in_progress')->count(),
            'waiting_parts' => (clone $query)->where('status', 'waiting_parts')->count(),
            'quality_check' => (clone $query)->where('status', 'quality_check')->count(),
            'completed' => (clone $query)->where('status', 'completed')->count(),
            'invoiced' => (clone $query)->where('status', 'invoiced')->count(),
            'paid' => (clone $query)->where('status', 'paid')->count(),
            'total_revenue' => (clone $query)->whereIn('status', ['paid'])->sum('total_amount'),
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