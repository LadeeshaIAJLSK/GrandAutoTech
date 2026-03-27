<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\JobCard;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function financialSummary(Request $request)
    {
        try {
            $user = $request->user();
            
            // Date filters - handle both string and date formats
            $startDate = $request->get('start_date', now()->startOfMonth()->toDateString());
            $endDate = $request->get('end_date', now()->endOfMonth()->toDateString());

            // Ensure dates are properly formatted
            $startDate = date('Y-m-d', strtotime($startDate));
            $endDate = date('Y-m-d', strtotime($endDate));

            // Total revenue from payments
            $totalRevenue = Payment::whereBetween('payment_date', [$startDate, $endDate])->sum('amount');

            // Total billable amount (what customers should pay)
            $tasksAmount = DB::table('tasks')
                ->where('status', 'completed')
                ->sum(DB::raw('COALESCE(amount, 0)'));

            $sparePartsAmount = DB::table('spare_parts_requests')
                ->whereIn('overall_status', ['approved', 'ordered', 'process', 'delivered'])
                ->sum(DB::raw('CAST(COALESCE(selling_price, 0) AS DECIMAL(10,2)) * CAST(COALESCE(quantity, 1) AS DECIMAL(10,2))'));

            $otherChargesAmount = DB::table('other_charges')
                ->sum(DB::raw('COALESCE(amount, 0)'));

            $totalAmount = floatval($tasksAmount) + floatval($sparePartsAmount) + floatval($otherChargesAmount);

            // Total cost from all sources
            $tasksCost = DB::table('tasks')
                ->where('status', 'completed')
                ->sum(DB::raw('COALESCE(cost_price, 0)'));

            $sparePartsCost = DB::table('spare_parts_requests')
                ->whereIn('overall_status', ['approved', 'ordered', 'process', 'delivered'])
                ->sum(DB::raw('COALESCE(total_cost, 0)'));

            $otherChargesCost = DB::table('other_charges')
                ->sum(DB::raw('COALESCE(cost_price, 0)'));

            $totalCost = floatval($tasksCost) + floatval($sparePartsCost) + floatval($otherChargesCost);

            // Outstanding dues
            $outstandingDues = floatval($totalAmount) - floatval($totalRevenue);

            // Paid job cards count
            $paidJobCards = JobCard::where('payment_status', 'paid')
                ->whereBetween('updated_at', [$startDate, $endDate])
                ->count();

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

        $query = Payment::with(['jobCard.customer'])
            ->whereBetween('payment_date', [$startDate, $endDate]);

        // Branch filter
        $role = DB::table('roles')->where('id', $user->role_id)->first();
        if ($role->name === 'branch_admin' && $user->branch_id) {
            $query->whereHas('jobCard', function($q) use ($user) {
                $q->where('branch_id', $user->branch_id);
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

        $query = DB::table('tasks')
            ->whereBetween(DB::raw('DATE(created_at)'), [$startDate, $endDate])
            ->select(
                'category',
                DB::raw('COUNT(*) as count'),
                DB::raw('SUM(COALESCE(cost_price, 0)) as total_cost'),
                DB::raw('SUM(COALESCE(amount, 0)) as total_amount')
            )
            ->groupBy('category');

        if ($category) {
            $query->where('category', $category);
        }

        $tasks = $query->orderBy('total_amount', 'desc')->get();
        $categories = DB::table('tasks')->select('category')->distinct()->orderBy('category')->pluck('category');

        return response()->json([
            'tasks' => $tasks,
            'categories' => $categories
        ]);
    }

    public function sparePartsReport(Request $request)
    {
        $startDate = $request->get('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->get('end_date', now()->endOfMonth()->toDateString());

        $query = DB::table('spare_parts_requests')
            ->whereBetween(DB::raw('DATE(created_at)'), [$startDate, $endDate])
            ->whereIn('overall_status', ['approved', 'ordered', 'process', 'delivered'])
            ->select(
                'part_name',
                'part_number',
                DB::raw('COUNT(*) as count'),
                DB::raw('SUM(COALESCE(quantity, 1)) as total_quantity'),
                DB::raw('SUM(CAST(COALESCE(unit_cost, 0) AS DECIMAL(10,2)) * CAST(COALESCE(quantity, 1) AS DECIMAL(10,2))) as total_cost'),
                DB::raw('SUM(CAST(COALESCE(selling_price, 0) AS DECIMAL(10,2)) * CAST(COALESCE(quantity, 1) AS DECIMAL(10,2))) as total_selling_price')
            )
            ->groupBy('part_name', 'part_number')
            ->orderBy('total_selling_price', 'desc')
            ->get();

        return response()->json($query);
    }

    public function otherChargesReport(Request $request)
    {
        $startDate = $request->get('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->get('end_date', now()->endOfMonth()->toDateString());

        $query = DB::table('other_charges')
            ->whereBetween(DB::raw('DATE(created_at)'), [$startDate, $endDate])
            ->select(
                'description',
                DB::raw('COUNT(*) as count'),
                DB::raw('SUM(COALESCE(cost_price, 0)) as total_cost'),
                DB::raw('SUM(COALESCE(amount, 0)) as total_amount')
            )
            ->groupBy('description')
            ->orderBy('total_amount', 'desc')
            ->get();

        return response()->json($query);
    }
}