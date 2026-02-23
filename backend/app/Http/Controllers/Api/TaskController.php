<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\TaskAssignment;
use App\Models\TaskTimeTracking;
use App\Models\SparePartsRequest;
use App\Models\User;
use App\Models\JobCard;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TaskController extends Controller
{
    /**
     * Get tasks assigned to current employee
     */
    public function getMyTasks(Request $request)
    {
        $user = $request->user();
        
        // Get tasks where user is assigned
        $tasks = Task::whereHas('assignments', function($query) use ($user) {
            $query->where('user_id', $user->id);
        })
        ->with([
            'jobCard.customer',
            'jobCard.vehicle',
            'assignments' => function($query) use ($user) {
                $query->where('user_id', $user->id);
            },
            'timeTracking' => function($query) use ($user) {
                $query->where('user_id', $user->id);
            }
        ])
        ->orderBy('created_at', 'desc')
        ->get();

        return response()->json($tasks);
    }

    /**
     * Get all tasks (for super admin to see all employee tasks)
     */
    public function getAllTasks(Request $request)
    {
        $user = $request->user();
        
        // Only super admin can view all tasks
        if ($user->role->name !== 'super_admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        // Get all tasks with their assignments and relationships
        $tasks = Task::with([
            'jobCard.customer',
            'jobCard.vehicle',
            'assignments.employee',
            'timeTracking'
        ])
        ->orderBy('created_at', 'desc')
        ->get()
        ->map(function($task) {
            // Add assigned_to_user field from first assignment
            if ($task->assignments && $task->assignments->count() > 0) {
                $task->assigned_to_user = $task->assignments->first()->employee;
            }
            return $task;
        });

        return response()->json($tasks);
    }

    /**
     * Get active time tracking for user
     */
    public function getActiveTimer(Request $request)
    {
        $user = $request->user();
        
        $activeTimer = DB::table('task_time_tracking')
            ->where('user_id', $user->id)
            ->whereNull('end_time')
            ->first();
        
        if ($activeTimer) {
            $task = Task::with('jobCard')->find($activeTimer->task_id);
            return response()->json([
                'has_active_timer' => true,
                'timer' => $activeTimer,
                'task' => $task
            ]);
        }
        
        return response()->json(['has_active_timer' => false]);
    }

    /**
     * Mark task as done (employee completes) - NOW GOES TO AWAITING APPROVAL
     */
    public function markAsDone(Request $request, $id)
    {
        $user = $request->user();
        $task = Task::findOrFail($id);
        
        // Check if user is assigned to this task
        $assignment = TaskAssignment::where('task_id', $id)
            ->where('user_id', $user->id)
            ->first();
        
        if (!$assignment) {
            return response()->json(['message' => 'You are not assigned to this task'], 403);
        }
        
        // Stop any active time tracking
        $activeTracking = TaskTimeTracking::where('task_id', $id)
            ->where('user_id', $user->id)
            ->whereNull('end_time')
            ->first();
        
        if ($activeTracking) {
            $activeTracking->update([
                'end_time' => now(),
                'duration_minutes' => now()->diffInMinutes($activeTracking->start_time)
            ]);
        }
        
        // Calculate total time spent
        $totalMinutes = TaskTimeTracking::where('task_id', $id)
            ->where('user_id', $user->id)
            ->sum('duration_minutes');
        
        // Update task to AWAITING APPROVAL (not completed yet!)
        $task->update([
            'status' => 'awaiting_approval',
            'actual_duration_minutes' => $totalMinutes
        ]);
        
        // Update assignment
        $assignment->update([
            'status' => 'awaiting_approval'
        ]);
        
        return response()->json([
            'message' => 'Task submitted for approval',
            'task' => $task->fresh(),
            'total_time_spent' => $totalMinutes
        ]);
    }

    /**
     * Get tasks awaiting approval (for admin/supervisor)
     */
    public function getTasksAwaitingApproval(Request $request)
    {
        $user = $request->user();
        
        $permissions = DB::table('permissions')
            ->join('role_permissions', 'permissions.id', '=', 'role_permissions.permission_id')
            ->where('role_permissions.role_id', $user->role_id)
            ->pluck('permissions.name')
            ->toArray();
        
        if (!in_array('approve_tasks', $permissions) && !in_array($user->role->name, ['super_admin', 'branch_admin'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = Task::where('status', 'awaiting_approval')
            ->with([
                'jobCard.customer',
                'jobCard.vehicle',
                'jobCard.branch',
                'assignedEmployees',
                'timeTracking'
            ]);

        // Branch filter
        $role = DB::table('roles')->where('id', $user->role_id)->first();
        if ($role->name === 'branch_admin' && $user->branch_id) {
            $query->whereHas('jobCard', function($q) use ($user) {
                $q->where('branch_id', $user->branch_id);
            });
        }

        $tasks = $query->orderBy('created_at', 'desc')->get();

        // Group by job card
        $groupedByJobCard = $tasks->groupBy('job_card_id')->map(function($tasks, $jobCardId) {
            $jobCard = $tasks->first()->jobCard;
            return [
                'job_card' => $jobCard,
                'tasks' => $tasks,
                'all_tasks_count' => Task::where('job_card_id', $jobCardId)->count(),
                'awaiting_count' => $tasks->count(),
            ];
        })->values();

        return response()->json($groupedByJobCard);
    }

    /**
     * Approve individual task
     */
    public function approveTask(Request $request, $id)
    {
        $user = $request->user();
        
        $permissions = DB::table('permissions')
            ->join('role_permissions', 'permissions.id', '=', 'role_permissions.permission_id')
            ->where('role_permissions.role_id', $user->role_id)
            ->pluck('permissions.name')
            ->toArray();
        
        if (!in_array('approve_tasks', $permissions) && !in_array($user->role->name, ['super_admin', 'branch_admin'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'approval_notes' => 'nullable|string',
        ]);

        $task = Task::findOrFail($id);

        if ($task->status !== 'awaiting_approval') {
            return response()->json(['message' => 'Task is not awaiting approval'], 400);
        }

        $task->update([
            'status' => 'completed',
            'completed_at' => now(),
            'approval_notes' => $validated['approval_notes'] ?? null,
            'approved_by' => $user->id,
            'approved_at' => now(),
        ]);

        // Update all assignments for this task
        TaskAssignment::where('task_id', $id)->update([
            'status' => 'completed',
            'completed_at' => now(),
        ]);

        // Check if all tasks in job card are completed
        $jobCard = $task->jobCard;
        $allTasksCompleted = !Task::where('job_card_id', $jobCard->id)
            ->whereNotIn('status', ['completed', 'cancelled'])
            ->exists();

        return response()->json([
            'message' => 'Task approved',
            'task' => $task->fresh(),
            'all_tasks_completed' => $allTasksCompleted,
            'job_card' => $jobCard
        ]);
    }

    /**
     * Reject task (send back to employee)
     */
    public function rejectTask(Request $request, $id)
    {
        $user = $request->user();
        
        $permissions = DB::table('permissions')
            ->join('role_permissions', 'permissions.id', '=', 'role_permissions.permission_id')
            ->where('role_permissions.role_id', $user->role_id)
            ->pluck('permissions.name')
            ->toArray();
        
        if (!in_array('approve_tasks', $permissions) && !in_array($user->role->name, ['super_admin', 'branch_admin'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'rejection_reason' => 'required|string',
        ]);

        $task = Task::findOrFail($id);

        if ($task->status !== 'awaiting_approval') {
            return response()->json(['message' => 'Task is not awaiting approval'], 400);
        }

        $task->update([
            'status' => 'in_progress', // Send back to work
            'rejection_reason' => $validated['rejection_reason'],
            'rejected_by' => $user->id,
            'rejected_at' => now(),
        ]);

        // Update assignments
        TaskAssignment::where('task_id', $id)->update([
            'status' => 'in_progress',
        ]);

        return response()->json([
            'message' => 'Task rejected and sent back to employee',
            'task' => $task->fresh()
        ]);
    }

    /**
     * Approve entire job card (after all tasks approved)
     */
    public function approveJobCard(Request $request, $jobCardId)
    {
        $user = $request->user();
        
        $permissions = DB::table('permissions')
            ->join('role_permissions', 'permissions.id', '=', 'role_permissions.permission_id')
            ->where('role_permissions.role_id', $user->role_id)
            ->pluck('permissions.name')
            ->toArray();
        
        if (!in_array('approve_tasks', $permissions) && !in_array($user->role->name, ['super_admin', 'branch_admin'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $jobCard = JobCard::findOrFail($jobCardId);

        // Check if all tasks are completed
        $hasIncompleteTasks = Task::where('job_card_id', $jobCardId)
            ->whereNotIn('status', ['completed', 'cancelled'])
            ->exists();

        if ($hasIncompleteTasks) {
            return response()->json([
                'message' => 'Cannot approve job card. Some tasks are still incomplete.'
            ], 400);
        }

        // Update job card status
        $jobCard->update([
            'status' => 'completed',
            'completed_at' => now(),
        ]);

        return response()->json([
            'message' => 'Job card approved and marked as completed',
            'job_card' => $jobCard->fresh()
        ]);
    }

    /**
     * Get all tasks for a job card
     */
    public function index($jobCardId, Request $request)
    {
        $tasks = Task::where('job_card_id', $jobCardId)
            ->with(['assignedEmployees', 'timeTracking'])
            ->orderBy('priority', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($tasks);
    }

    /**
     * Get single task
     */
    public function show($id)
    {
        $task = Task::with([
            'jobCard',
            'assignedEmployees',
            'timeTracking.employee',
            'sparePartsRequests',
            'inspections'
        ])->findOrFail($id);

        return response()->json($task);
    }

    /**
     * Update task
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();
        
        $permissions = DB::table('permissions')
            ->join('role_permissions', 'permissions.id', '=', 'role_permissions.permission_id')
            ->where('role_permissions.role_id', $user->role_id)
            ->pluck('permissions.name')
            ->toArray();
        
        if (!in_array('update_tasks', $permissions)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $task = Task::findOrFail($id);

        $validated = $request->validate([
            'task_name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'category' => 'sometimes|in:mechanical,electrical,bodywork,painting,diagnostic,maintenance,other',
            'status' => 'sometimes|in:pending,assigned,in_progress,completed,on_hold,cancelled',
            'labor_hours' => 'nullable|numeric|min:0',
            'labor_rate_per_hour' => 'nullable|numeric|min:0',
            'priority' => 'nullable|integer|in:0,1,2',
            'completion_notes' => 'nullable|string',
        ]);

        // If status changed to completed, set completion time
        if (isset($validated['status']) && $validated['status'] === 'completed' && !$task->completed_at) {
            $validated['completed_at'] = now();
        }

        // If status changed to in_progress and no start time, set it
        if (isset($validated['status']) && $validated['status'] === 'in_progress' && !$task->started_at) {
            $validated['started_at'] = now();
        }

        $task->update($validated);

        // Recalculate labor cost if hours or rate changed
        if ($request->has('labor_hours') || $request->has('labor_rate_per_hour')) {
            $task->calculateLaborCost();
        }

        return response()->json([
            'message' => 'Task updated successfully',
            'task' => $task->fresh()
        ]);
    }

    /**
     * Delete task
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        
        $permissions = DB::table('permissions')
            ->join('role_permissions', 'permissions.id', '=', 'role_permissions.permission_id')
            ->where('role_permissions.role_id', $user->role_id)
            ->pluck('permissions.name')
            ->toArray();
        
        if (!in_array('delete_tasks', $permissions)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $task = Task::findOrFail($id);

        if ($task->status === 'completed') {
            return response()->json([
                'message' => 'Cannot delete completed tasks'
            ], 400);
        }

        $task->delete();

        return response()->json([
            'message' => 'Task deleted successfully'
        ]);
    }

    /**
     * Assign task to employees
     */
    public function assignEmployees(Request $request, $id)
    {
        $user = $request->user();
        
        $permissions = DB::table('permissions')
            ->join('role_permissions', 'permissions.id', '=', 'role_permissions.permission_id')
            ->where('role_permissions.role_id', $user->role_id)
            ->pluck('permissions.name')
            ->toArray();
        
        if (!in_array('update_tasks', $permissions)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'employee_ids' => 'required|array',
            'employee_ids.*' => 'exists:users,id',
        ]);

        $task = Task::findOrFail($id);

        // Remove existing assignments
        TaskAssignment::where('task_id', $task->id)->delete();

        // Create new assignments
        foreach ($validated['employee_ids'] as $employeeId) {
            TaskAssignment::create([
                'task_id' => $task->id,
                'user_id' => $employeeId,
                'assigned_by' => $user->id,
                'assigned_at' => now(),
                'status' => 'assigned',
            ]);
        }

        // Update task status
        if ($task->status === 'pending') {
            $task->update(['status' => 'assigned']);
        }

        return response()->json([
            'message' => 'Task assigned successfully',
            'task' => $task->fresh()->load('assignedEmployees')
        ]);
    }

    /**
     * Start working on task (for employees)
     */
    public function startTask(Request $request, $id)
    {
        $user = $request->user();
        $task = Task::findOrFail($id);

        // Check if user is assigned to this task or is super admin
        $assignment = TaskAssignment::where('task_id', $task->id)
            ->where('user_id', $user->id)
            ->first();

        if (!$assignment && $user->role->name !== 'super_admin') {
            return response()->json([
                'message' => 'You are not assigned to this task'
            ], 403);
        }

        // Create time tracking entry
        $timeTracking = TaskTimeTracking::create([
            'task_id' => $task->id,
            'user_id' => $user->id,
            'start_time' => now(),
        ]);

        // Update task status
        if ($task->status !== 'in_progress') {
            $task->update([
                'status' => 'in_progress',
                'started_at' => now()
            ]);
        }

        // Update assignment status (only if assignment exists)
        if ($assignment) {
            $assignment->update([
                'status' => 'in_progress',
                'started_at' => now()
            ]);
        }

        return response()->json([
            'message' => 'Task started',
            'time_tracking' => $timeTracking,
            'task' => $task->fresh()
        ]);
    }

    /**
     * Stop working on task (for employees)
     */
    public function stopTask(Request $request, $id)
    {
        $user = $request->user();
        $task = Task::findOrFail($id);

        // Find active time tracking entry
        $timeTracking = TaskTimeTracking::where('task_id', $task->id)
            ->where('user_id', $user->id)
            ->whereNull('end_time')
            ->latest()
            ->first();

        if (!$timeTracking) {
            return response()->json([
                'message' => 'No active time tracking found'
            ], 400);
        }

        // Update time tracking
        $timeTracking->update([
            'end_time' => now()
        ]);
        $timeTracking->calculateDuration();

        return response()->json([
            'message' => 'Task stopped',
            'time_tracking' => $timeTracking->fresh(),
            'total_time_spent' => $task->getTotalTimeSpent()
        ]);
    }

    /**
     * Complete task
     */
    public function completeTask(Request $request, $id)
    {
        $user = $request->user();
        
        $validated = $request->validate([
            'completion_notes' => 'nullable|string',
        ]);

        $task = Task::findOrFail($id);

        // Check if user is assigned or has permission or is super admin
        $assignment = TaskAssignment::where('task_id', $task->id)
            ->where('user_id', $user->id)
            ->first();

        $permissions = DB::table('permissions')
            ->join('role_permissions', 'permissions.id', '=', 'role_permissions.permission_id')
            ->where('role_permissions.role_id', $user->role_id)
            ->pluck('permissions.name')
            ->toArray();

        if (!$assignment && !in_array('update_tasks', $permissions) && $user->role->name !== 'super_admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Stop any active time tracking
        $activeTracking = TaskTimeTracking::where('task_id', $task->id)
            ->where('user_id', $user->id)
            ->whereNull('end_time')
            ->first();

        if ($activeTracking) {
            $activeTracking->update(['end_time' => now()]);
            $activeTracking->calculateDuration();
        }

        // Update task
        $task->update([
            'status' => 'completed',
            'completed_at' => now(),
            'actual_duration_minutes' => $task->getTotalTimeSpent(),
            'completion_notes' => $validated['completion_notes'] ?? $task->completion_notes,
        ]);

        // Update assignment
        if ($assignment) {
            $assignment->update([
                'status' => 'completed',
                'completed_at' => now()
            ]);
        }

        return response()->json([
            'message' => 'Task completed successfully',
            'task' => $task->fresh()->load('assignedEmployees')
        ]);
    }

    /**
     * Get available employees for assignment
     */
    public function getAvailableEmployees(Request $request)
    {
        $employees = User::whereHas('role', function($query) {
            $query->where('name', 'employee');
        })
        ->where('is_active', true)
        ->select('id', 'name', 'email', 'employee_code')
        ->get();

        return response()->json($employees);
    }
}