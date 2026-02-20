<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\TaskAssignment;
use App\Models\TaskTimeTracking;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TaskController extends Controller
{
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

        // Check if user is assigned to this task
        $assignment = TaskAssignment::where('task_id', $task->id)
            ->where('user_id', $user->id)
            ->first();

        if (!$assignment) {
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

        // Update assignment status
        $assignment->update([
            'status' => 'in_progress',
            'started_at' => now()
        ]);

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

        // Check if user is assigned or has permission
        $assignment = TaskAssignment::where('task_id', $task->id)
            ->where('user_id', $user->id)
            ->first();

        $permissions = DB::table('permissions')
            ->join('role_permissions', 'permissions.id', '=', 'role_permissions.permission_id')
            ->where('role_permissions.role_id', $user->role_id)
            ->pluck('permissions.name')
            ->toArray();

        if (!$assignment && !in_array('update_tasks', $permissions)) {
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