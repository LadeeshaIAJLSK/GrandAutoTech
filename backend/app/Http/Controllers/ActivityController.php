<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\Request;

class ActivityController extends Controller
{
    // Get activity logs with filtering
    public function index(Request $request)
    {
        $user = auth()->user();
        $query = ActivityLog::with(['user:id,name,email', 'branch:id,name'])
            ->recentFirst();

        // Super admins can see all branches, others see only their branch
        if ($user->role->name !== 'super_admin') {
            $query->where('branch_id', $user->branch_id);
        } else if ($request->has('branch_id')) {
            // Super admin filtering by specific branch
            $query->where('branch_id', $request->branch_id);
        }

        // Filter by action
        if ($request->has('action') && $request->action) {
            $query->where('action', $request->action);
        }

        // Filter by user
        if ($request->has('user_id') && $request->user_id) {
            $query->where('user_id', $request->user_id);
        }

        // Filter by model (Job Card, Invoice, etc)
        if ($request->has('model') && $request->model) {
            $query->where('model', $request->model);
        }

        // Show only suspicious activities
        if ($request->has('suspicious') && $request->suspicious === 'true') {
            $query->where('is_suspicious', true);
        }

        // Filter by risk level
        if ($request->has('risk_level') && $request->risk_level) {
            $query->where('risk_level', $request->risk_level);
        }

        // Date range filter
        if ($request->has('from_date')) {
            $query->whereDate('created_at', '>=', $request->from_date);
        }
        if ($request->has('to_date')) {
            $query->whereDate('created_at', '<=', $request->to_date);
        }

        // Search in description
        if ($request->has('search') && $request->search) {
            $search = '%' . $request->search . '%';
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', $search)
                  ->orWhere('risk_reason', 'like', $search);
            });
        }

        $logs = $query->paginate($request->get('per_page', 50));

        return response()->json($logs);
    }

    // Get activity statistics
    public function statistics(Request $request)
    {
        $user = auth()->user();
        $query = ActivityLog::query();

        // Super admins can see all branches
        if ($user->role->name !== 'super_admin') {
            $query->where('branch_id', $user->branch_id);
        } else if ($request->has('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        $stats = [
            'total_activities' => $query->count(),
            'suspicious_activities' => $query->clone()->where('is_suspicious', true)->count(),
            'high_risk_activities' => $query->clone()->where('risk_level', 'high')->count(),
            'activities_today' => $query->clone()->whereDate('created_at', today())->count(),
            'top_actions' => $query->clone()
                ->selectRaw('action, count(*) as count')
                ->groupBy('action')
                ->orderBy('count', 'desc')
                ->limit(5)
                ->get(),
            'most_active_users' => $query->clone()
                ->with('user:id,name')
                ->selectRaw('user_id, count(*) as count')
                ->groupBy('user_id')
                ->orderBy('count', 'desc')
                ->limit(5)
                ->get(),
        ];

        return response()->json($stats);
    }

    // Get unique values for filters
    public function filters(Request $request)
    {
        $user = auth()->user();
        $query = ActivityLog::query();

        if ($user->role->name !== 'super_admin') {
            $query->where('branch_id', $user->branch_id);
        } else if ($request->has('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        $filters = [
            'actions' => $query->clone()->distinct('action')->pluck('action'),
            'models' => $query->clone()->distinct('model')->pluck('model'),
            'risk_levels' => ['low', 'medium', 'high'],
            'users' => $query->clone()
                ->with('user:id,name')
                ->distinct('user_id')
                ->get(['user_id'])
                ->pluck('user')
                ->unique('id'),
        ];

        return response()->json($filters);
    }
}
