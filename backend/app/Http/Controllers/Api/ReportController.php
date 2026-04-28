<?php

namespace App\Http\Controllers\Api;

use App\Models\Payment;
use App\Models\JobCard;
use App\Models\Invoice;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends ApiController
{
    public function financialSummary(Request $request)
    {
        try {
            // Check permission
            $check = $this->checkReadPermission($request, 'view_financial_reports');
            if (!$check['allowed']) {
                return $this->unauthorized($check['message']);
            }

            $user = $request->user();
            
            // Date filters - handle both string and date formats
            $startDate = $request->get('start_date', now()->startOfMonth()->toDateString());
            $endDate = $request->get('end_date', now()->endOfMonth()->toDateString());
            $branchId = $request->get('branch_id');

            // Super admin can filter by any branch, others only see their branch
            if ($user->role->name !== 'super_admin') {
                $branchId = $user->branch_id;
            }

            // Ensure dates are properly formatted
            $startDate = date('Y-m-d', strtotime($startDate));
            $endDate = date('Y-m-d', strtotime($endDate));

            // Build branch filter for queries
            $branchFilter = function($query) use ($branchId) {
                if ($branchId) {
                    $query->where('branch_id', $branchId);
                }
            };

            // Total revenue from payments (filtered by branch if provided)
            $paymentQuery = Payment::whereBetween('payment_date', [$startDate, $endDate]);
            if ($branchId) {
                $paymentQuery->whereHas('jobCard', $branchFilter);
            }
            $totalRevenue = $paymentQuery->sum('amount');

            // Total billable amount (what customers should pay)
            $tasksQuery = DB::table('tasks')
                ->where('tasks.status', 'completed')
                ->whereBetween(DB::raw('DATE(tasks.created_at)'), [$startDate, $endDate]);
            if ($branchId) {
                $tasksQuery->join('job_cards', 'tasks.job_card_id', '=', 'job_cards.id')
                    ->where('job_cards.branch_id', $branchId);
            }
            $tasksAmount = $tasksQuery->sum(DB::raw('COALESCE(tasks.amount, 0)'));

            $sparePartsQuery = DB::table('spare_parts_requests')
                ->whereIn('spare_parts_requests.overall_status', ['approved', 'ordered', 'process', 'delivered'])
                ->whereBetween(DB::raw('DATE(spare_parts_requests.created_at)'), [$startDate, $endDate]);
            if ($branchId) {
                $sparePartsQuery->join('job_cards', 'spare_parts_requests.job_card_id', '=', 'job_cards.id')
                    ->where('job_cards.branch_id', $branchId);
            }
            $sparePartsAmount = $sparePartsQuery->sum(DB::raw('CAST(COALESCE(spare_parts_requests.selling_price, 0) AS DECIMAL(10,2)) * CAST(COALESCE(spare_parts_requests.quantity, 1) AS DECIMAL(10,2))'));

            $otherChargesQuery = DB::table('other_charges')
                ->whereBetween(DB::raw('DATE(other_charges.created_at)'), [$startDate, $endDate]);
            if ($branchId) {
                $otherChargesQuery->join('job_cards', 'other_charges.job_card_id', '=', 'job_cards.id')
                    ->where('job_cards.branch_id', $branchId);
            }
            $otherChargesAmount = $otherChargesQuery->sum(DB::raw('COALESCE(other_charges.amount, 0)'));

            $totalAmount = floatval($tasksAmount) + floatval($sparePartsAmount) + floatval($otherChargesAmount);

            // Total cost from all sources
            $tasksCostQuery = DB::table('tasks')
                ->where('tasks.status', 'completed')
                ->whereBetween(DB::raw('DATE(tasks.created_at)'), [$startDate, $endDate]);
            if ($branchId) {
                $tasksCostQuery->join('job_cards', 'tasks.job_card_id', '=', 'job_cards.id')
                    ->where('job_cards.branch_id', $branchId);
            }
            $tasksCost = $tasksCostQuery->sum(DB::raw('COALESCE(tasks.cost_price, 0)'));

            $sparePartsCostQuery = DB::table('spare_parts_requests')
                ->whereIn('spare_parts_requests.overall_status', ['approved', 'ordered', 'process', 'delivered'])
                ->whereBetween(DB::raw('DATE(spare_parts_requests.created_at)'), [$startDate, $endDate]);
            if ($branchId) {
                $sparePartsCostQuery->join('job_cards', 'spare_parts_requests.job_card_id', '=', 'job_cards.id')
                    ->where('job_cards.branch_id', $branchId);
            }
            $sparePartsCost = $sparePartsCostQuery->sum(DB::raw('CAST(COALESCE(spare_parts_requests.unit_cost, 0) AS DECIMAL(10,2)) * CAST(COALESCE(spare_parts_requests.quantity, 1) AS DECIMAL(10,2))'));

            $otherChargesCostQuery = DB::table('other_charges')
                ->whereBetween(DB::raw('DATE(other_charges.created_at)'), [$startDate, $endDate]);
            if ($branchId) {
                $otherChargesCostQuery->join('job_cards', 'other_charges.job_card_id', '=', 'job_cards.id')
                    ->where('job_cards.branch_id', $branchId);
            }
            $otherChargesCost = $otherChargesCostQuery->sum(DB::raw('COALESCE(other_charges.cost_price, 0)'));

            $totalCost = floatval($tasksCost) + floatval($sparePartsCost) + floatval($otherChargesCost);

            // Outstanding dues
            $outstandingDues = floatval($totalAmount) - floatval($totalRevenue);

            // Paid job cards count
            $paidJobCardsQuery = JobCard::where('payment_status', 'paid')
                ->whereBetween('updated_at', [$startDate, $endDate]);
            if ($branchId) {
                $paidJobCardsQuery->where('branch_id', $branchId);
            }
            $paidJobCards = $paidJobCardsQuery->count();

            return response()->json([
                'total_amount' => floatval($totalAmount) ?? 0,
                'total_revenue' => floatval($totalRevenue) ?? 0,
                'total_cost' => floatval($totalCost) ?? 0,
                'outstanding_dues' => floatval($outstandingDues) ?? 0,
                'paid_job_cards' => $paidJobCards,
                'period' => [
                    'start' => $startDate,
                    'end' => $endDate
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
                'total_amount' => 0,
                'total_revenue' => 0,
                'total_cost' => 0,
                'outstanding_dues' => 0,
                'paid_job_cards' => 0
            ], 500);
        }
    }

    public function paymentMethodBreakdown(Request $request)
    {
        $startDate = $request->get('start_date', now()->startOfMonth());
        $endDate = $request->get('end_date', now()->endOfMonth());

        $breakdown = Payment::whereBetween('payment_date', [$startDate, $endDate])
            ->select(
                'payment_method',
                DB::raw('COUNT(*) as count'),
                DB::raw('SUM(amount) as total_amount')
            )
            ->groupBy('payment_method')
            ->orderBy('total_amount', 'desc')
            ->get();

        return response()->json($breakdown);
    }

    public function outstandingDuesReport(Request $request)
    {
        $user = $request->user();
        
        $query = JobCard::with(['customer', 'vehicle'])
            ->where('balance_amount', '>', 0)
            ->whereIn('status', ['inspected', 'completed', 'in_progress']);

        // Branch filter
        $role = DB::table('roles')->where('id', $user->role_id)->first();
        if ($role->name === 'branch_admin' && $user->branch_id) {
            $query->where('branch_id', $user->branch_id);
        }

        $jobCards = $query->orderBy('balance_amount', 'desc')->get();

        $totalDue = $jobCards->sum('balance_amount');

        return response()->json([
            'total_outstanding' => $totalDue,
            'count' => $jobCards->count(),
            'job_cards' => $jobCards
        ]);
    }

    public function bankBreakdown(Request $request)
    {
        $startDate = $request->get('start_date', now()->startOfMonth());
        $endDate = $request->get('end_date', now()->endOfMonth());

        $breakdown = Payment::whereBetween('payment_date', [$startDate, $endDate])
            ->where('bank_name', '!=', null)
            ->select(
                'bank_name',
                DB::raw('COUNT(*) as count'),
                DB::raw('SUM(amount) as total_amount')
            )
            ->groupBy('bank_name')
            ->orderBy('total_amount', 'desc')
            ->get();

        return response()->json($breakdown);
    }

    public function paymentTransactions(Request $request)
    {
        $user = $request->user();
        $startDate = $request->get('start_date', now()->startOfMonth());
        $endDate = $request->get('end_date', now()->endOfMonth());
        $branchId = $request->get('branch_id');

        $query = Payment::with(['jobCard.customer'])
            ->whereBetween('payment_date', [$startDate, $endDate]);

        // Branch filter
        $role = DB::table('roles')->where('id', $user->role_id)->first();
        if ($role->name === 'branch_admin' && $user->branch_id) {
            // Branch admin can only see their own branch
            $branchId = $user->branch_id;
        }

        if ($branchId) {
            $query->whereHas('jobCard', function($q) use ($branchId) {
                $q->where('branch_id', $branchId);
            });
        }

        $transactions = $query->orderBy('payment_date', 'desc')->get();

        $formattedTransactions = $transactions->map(function($payment) {
            return [
                'id' => $payment->id,
                'job_card_number' => $payment->jobCard->job_card_number ?? 'N/A',
                'customer_name' => $payment->jobCard?->customer?->name ?? 'N/A',
                'payment_method' => $payment->payment_method,
                'payment_type' => $payment->payment_type,
                'bank_name' => $payment->bank_name,
                'reference_number' => $payment->reference_number,
                'payment_date' => $payment->payment_date,
                'amount' => $payment->amount,
            ];
        });

        return response()->json($formattedTransactions);
    }

    public function dailyRevenue(Request $request)
    {
        $startDate = $request->get('start_date', now()->subDays(30));
        $endDate = $request->get('end_date', now());

        $dailyRevenue = Payment::whereBetween('payment_date', [$startDate, $endDate])
            ->select(
                DB::raw('DATE(payment_date) as date'),
                DB::raw('SUM(amount) as total')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return response()->json($dailyRevenue);
    }

    public function tasksReport(Request $request)
    {
        $category = $request->get('category', '');
        $startDate = $request->get('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->get('end_date', now()->endOfMonth()->toDateString());
        $branchId = $request->get('branch_id');

        $query = DB::table('tasks')
            ->whereBetween(DB::raw('DATE(tasks.created_at)'), [$startDate, $endDate])
            ->join('job_cards', 'tasks.job_card_id', '=', 'job_cards.id')
            ->leftJoin('task_assignments', 'tasks.id', '=', 'task_assignments.task_id')
            ->leftJoin('users', 'task_assignments.user_id', '=', 'users.id')
            ->select(
                'tasks.id',
                'tasks.task_name',
                'tasks.category',
                'tasks.status',
                'tasks.cost_price',
                'tasks.amount',
                'tasks.created_at as date',
                'job_cards.job_card_number',
                'job_cards.branch_id',
                DB::raw("GROUP_CONCAT(CONCAT(users.first_name, ' ', users.last_name) SEPARATOR ', ') as assigned_employees")
            )
            ->groupBy('tasks.id');

        if ($branchId) {
            $query->where('job_cards.branch_id', $branchId);
        }

        if ($category) {
            $query->where('tasks.category', $category);
        }

        $tasks = $query->orderBy('tasks.created_at', 'desc')->get();
        
        // Format the response with proper date formatting
        $tasks = $tasks->map(function ($task) {
            return [
                'id' => $task->id,
                'task_name' => $task->task_name,
                'category' => $task->category,
                'status' => $task->status,
                'cost' => floatval($task->cost_price),
                'amount' => floatval($task->amount),
                'date' => Carbon::parse($task->date)->format('Y-m-d'),
                'jobcard_no' => $task->job_card_number,
                'assigned_employees' => $task->assigned_employees ?? 'Unassigned'
            ];
        });
        
        $categoriesQuery = DB::table('tasks')
            ->whereBetween(DB::raw('DATE(tasks.created_at)'), [$startDate, $endDate])
            ->join('job_cards', 'tasks.job_card_id', '=', 'job_cards.id')
            ->select('tasks.category as category')
            ->distinct()
            ->orderBy('category');
        
        if ($branchId) {
            $categoriesQuery->where('job_cards.branch_id', $branchId);
        }
        $categories = $categoriesQuery->pluck('category');

        return response()->json([
            'tasks' => $tasks,
            'categories' => $categories
        ]);
    }

    public function sparePartsReport(Request $request)
    {
        $startDate = $request->get('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->get('end_date', now()->endOfMonth()->toDateString());
        $branchId = $request->get('branch_id');

        $query = DB::table('spare_parts_requests')
            ->whereBetween(DB::raw('DATE(spare_parts_requests.created_at)'), [$startDate, $endDate])
            ->whereIn('spare_parts_requests.overall_status', ['approved', 'ordered', 'process', 'delivered'])
            ->join('job_cards', 'spare_parts_requests.job_card_id', '=', 'job_cards.id')
            ->select(
                'spare_parts_requests.id',
                'spare_parts_requests.part_name',
                'spare_parts_requests.part_number',
                'spare_parts_requests.quantity',
                'spare_parts_requests.unit_cost',
                'spare_parts_requests.selling_price',
                'spare_parts_requests.created_at as date',
                'job_cards.job_card_number',
                'job_cards.status as job_card_status',
                'job_cards.branch_id'
            );

        if ($branchId) {
            $query->where('job_cards.branch_id', $branchId);
        }

        $result = $query->orderBy('spare_parts_requests.created_at', 'desc')->get();

        // Format the response with proper calculations and date formatting
        $result = $result->map(function ($item) {
            return [
                'id' => $item->id,
                'part_name' => $item->part_name,
                'part_number' => $item->part_number ?? 'N/A',
                'quantity' => floatval($item->quantity ?? 1),
                'unit_cost' => floatval($item->unit_cost ?? 0),
                'total_cost' => floatval(($item->unit_cost ?? 0) * ($item->quantity ?? 1)),
                'selling_price' => floatval($item->selling_price ?? 0),
                'total_selling_price' => floatval(($item->selling_price ?? 0) * ($item->quantity ?? 1)),
                'date' => Carbon::parse($item->date)->format('Y-m-d'),
                'jobcard_no' => $item->job_card_number,
                'jobcard_status' => $item->job_card_status
            ];
        });

        return response()->json($result);
    }

    public function otherChargesReport(Request $request)
    {
        $startDate = $request->get('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->get('end_date', now()->endOfMonth()->toDateString());
        $branchId = $request->get('branch_id');

        $query = DB::table('other_charges')
            ->whereBetween(DB::raw('DATE(other_charges.created_at)'), [$startDate, $endDate])
            ->join('job_cards', 'other_charges.job_card_id', '=', 'job_cards.id')
            ->select(
                'other_charges.id',
                'other_charges.description',
                'other_charges.cost_price',
                'other_charges.amount',
                'other_charges.created_at as date',
                'job_cards.job_card_number',
                'job_cards.status as job_card_status',
                'job_cards.branch_id'
            );

        if ($branchId) {
            $query->where('job_cards.branch_id', $branchId);
        }

        $result = $query->orderBy('other_charges.created_at', 'desc')->get();

        // Format the response with proper calculations and date formatting
        $result = $result->map(function ($item) {
            return [
                'id' => $item->id,
                'description' => $item->description,
                'cost_price' => floatval($item->cost_price ?? 0),
                'amount' => floatval($item->amount ?? 0),
                'profit' => floatval(($item->amount ?? 0) - ($item->cost_price ?? 0)),
                'date' => Carbon::parse($item->date)->format('Y-m-d'),
                'jobcard_no' => $item->job_card_number,
                'jobcard_status' => $item->job_card_status
            ];
        });

        return response()->json($result);
    }
}