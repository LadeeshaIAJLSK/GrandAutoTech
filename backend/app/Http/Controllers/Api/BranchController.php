<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BranchController extends Controller
{
    /**
     * Get all branches
     */
    public function index(Request $request)
    {
        $branches = Branch::withCount(['users', 'jobCards'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($branches);
    }

    /**
     * Get single branch with details
     */
    public function show($id)
    {
        $branch = Branch::with(['users', 'jobCards'])
            ->withCount(['users', 'jobCards'])
            ->findOrFail($id);

        return response()->json($branch);
    }

    /**
     * Create new branch
     */
    public function store(Request $request)
    {
        $user = $request->user();
        
        // Only super admin can create branches
        $role = DB::table('roles')->where('id', $user->role_id)->first();
        if ($role->name !== 'super_admin') {
            return response()->json(['message' => 'Only super admin can create branches'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:branches,name',
            'code' => 'required|string|max:255|unique:branches,code',
            'address' => 'required|string',
            'city' => 'required|string|max:100',
            'phone' => 'required|string|max:20',
            'email' => 'nullable|email|max:255',
            'is_active' => 'boolean',
        ]);

        $branch = Branch::create($validated);

        return response()->json([
            'message' => 'Branch created successfully',
            'branch' => $branch
        ], 201);
    }

    /**
     * Update branch
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();
        
        // Only super admin can update branches
        $role = DB::table('roles')->where('id', $user->role_id)->first();
        if ($role->name !== 'super_admin') {
            return response()->json(['message' => 'Only super admin can update branches'], 403);
        }

        $branch = Branch::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255|unique:branches,name,' . $id,
            'code' => 'sometimes|string|max:255|unique:branches,code,' . $id,
            'address' => 'sometimes|string',
            'city' => 'sometimes|string|max:100',
            'phone' => 'sometimes|string|max:20',
            'email' => 'nullable|email|max:255',
            'is_active' => 'sometimes|boolean',
        ]);

        $branch->update($validated);

        return response()->json([
            'message' => 'Branch updated successfully',
            'branch' => $branch->fresh()
        ]);
    }

    /**
     * Delete branch
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        
        // Only super admin can delete branches
        $role = DB::table('roles')->where('id', $user->role_id)->first();
        if ($role->name !== 'super_admin') {
            return response()->json(['message' => 'Only super admin can delete branches'], 403);
        }

        $branch = Branch::findOrFail($id);

        // Check if branch has users
        $userCount = DB::table('users')->where('branch_id', $id)->count();
        if ($userCount > 0) {
            return response()->json([
                'message' => "Cannot delete branch. It has {$userCount} user(s) assigned. Please reassign users first."
            ], 400);
        }

        // Check if branch has job cards
        $jobCardCount = DB::table('job_cards')->where('branch_id', $id)->count();
        if ($jobCardCount > 0) {
            return response()->json([
                'message' => "Cannot delete branch. It has {$jobCardCount} job card(s). You can deactivate it instead."
            ], 400);
        }

        $branch->delete();

        return response()->json([
            'message' => 'Branch deleted successfully'
        ]);
    }

    /**
     * Toggle branch active status
     */
    public function toggleStatus(Request $request, $id)
    {
        $user = $request->user();
        
        // Only super admin
        $role = DB::table('roles')->where('id', $user->role_id)->first();
        if ($role->name !== 'super_admin') {
            return response()->json(['message' => 'Only super admin can toggle branch status'], 403);
        }

        $branch = Branch::findOrFail($id);
        $branch->is_active = !$branch->is_active;
        $branch->save();

        return response()->json([
            'message' => $branch->is_active ? 'Branch activated' : 'Branch deactivated',
            'branch' => $branch
        ]);
    }

    /**
     * Get branch statistics
     */
    public function getStatistics($id)
    {
        $branch = Branch::findOrFail($id);

        $stats = [
            'total_users' => DB::table('users')->where('branch_id', $id)->count(),
            'total_job_cards' => DB::table('job_cards')->where('branch_id', $id)->count(),
            'pending_job_cards' => DB::table('job_cards')
                ->where('branch_id', $id)
                ->where('status', 'pending')
                ->count(),
            'completed_job_cards' => DB::table('job_cards')
                ->where('branch_id', $id)
                ->where('status', 'completed')
                ->count(),
            'total_revenue' => DB::table('payments')
                ->join('job_cards', 'payments.job_card_id', '=', 'job_cards.id')
                ->where('job_cards.branch_id', $id)
                ->sum('payments.amount'),
            'outstanding_dues' => DB::table('job_cards')
                ->where('branch_id', $id)
                ->where('balance_amount', '>', 0)
                ->sum('balance_amount'),
        ];

        return response()->json([
            'branch' => $branch,
            'statistics' => $stats
        ]);
    }
}