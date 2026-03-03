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
        $user = $request->user();
        
        // Date filters
        $startDate = $request->get('start_date', now()->startOfMonth());
        $endDate = $request->get('end_date', now()->endOfMonth());

        $query = Payment::whereBetween('payment_date', [$startDate, $endDate]);

        // Branch filter
        $role = DB::table('roles')->where('id', $user->role_id)->first();
        if ($role->name === 'branch_admin' && $user->branch_id) {
            $query->whereHas('jobCard', function($q) use ($user) {
                $q->where('branch_id', $user->branch_id);
            });
        }

        // Total revenue
        $totalRevenue = $query->sum('amount');

        // Revenue by payment method
        $revenueByMethod = Payment::whereBetween('payment_date', [$startDate, $endDate])
            ->select('payment_method', DB::raw('SUM(amount) as total'))
            ->groupBy('payment_method')
            ->get();

        // Outstanding dues
        $outstandingDues = JobCard::where('balance_amount', '>', 0)
            ->whereIn('status', ['inspected', 'completed'])
            ->sum('balance_amount');

        // Paid job cards
        $paidJobCards = JobCard::where('status', 'inspected')
            ->whereBetween('updated_at', [$startDate, $endDate])
            ->count();

        // Total invoiced
        $totalInvoiced = Invoice::whereBetween('invoice_date', [$startDate, $endDate])
            ->sum('total_amount');

        return response()->json([
            'total_revenue' => $totalRevenue,
            'revenue_by_method' => $revenueByMethod,
            'outstanding_dues' => $outstandingDues,
            'paid_job_cards' => $paidJobCards,
            'total_invoiced' => $totalInvoiced,
            'period' => [
                'start' => $startDate,
                'end' => $endDate
            ]
        ]);
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
}