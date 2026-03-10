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

            // Total cost - simplified approach
            $totalCost = DB::table('tasks')
                ->where('status', 'completed')
                ->sum(DB::raw('COALESCE(cost_price, 0)'));

            if ($totalCost == 0) {
                $totalCost = 0;
            }

            // Outstanding dues
            $outstandingDues = JobCard::where('balance_amount', '>', 0)->sum('balance_amount');

            // Paid job cards count
            $paidJobCards = JobCard::where('payment_status', 'paid')
                ->whereBetween('updated_at', [$startDate, $endDate])
                ->count();

            return response()->json([
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
}