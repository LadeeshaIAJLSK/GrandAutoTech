<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PettyCashFund;
use App\Models\PettyCashTransaction;
use App\Models\PettyCashCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class PettyCashController extends Controller
{
    // Get all funds
    public function getFunds(Request $request)
    {
        $user = $request->user();
        
        $query = PettyCashFund::with(['branch', 'custodian']);

        $role = DB::table('roles')->where('id', $user->role_id)->first();
        $requestedBranchId = $request->query('branch_id');

        // If a specific branch is requested
        if ($requestedBranchId) {
            // Super admin can see any branch's funds
            if ($role->name === 'super_admin') {
                $query->where('branch_id', $requestedBranchId);
            }
            // Branch admin can only see their own branch
            elseif ($role->name === 'branch_admin' && $user->branch_id == $requestedBranchId) {
                $query->where('branch_id', $requestedBranchId);
            }
            // Unauthorized access to other branches
            elseif ($role->name === 'branch_admin' && $user->branch_id != $requestedBranchId) {
                return response()->json(['message' => 'Unauthorized: You can only view your own branch'], 403);
            }
            else {
                return response()->json(['message' => 'Unauthorized access'], 403);
            }
        } 
        // No specific branch requested - show user's own branch(es)
        else {
            if ($role->name === 'branch_admin' && $user->branch_id) {
                $query->where('branch_id', $user->branch_id);
            }
            // Super admins see all funds (no filter needed)
            // Other roles see only their branch's funds if they have one
            elseif ($role->name !== 'super_admin' && $user->branch_id) {
                $query->where('branch_id', $user->branch_id);
            }
        }

        $funds = $query->get();

        return response()->json($funds);
    }

    // Create fund
    public function createFund(Request $request)
    {
        $user = $request->user();
        
        // Check permission
        if (!$user->hasPermission('create_petty_cash_fund')) {
            return response()->json(['message' => 'Unauthorized: You do not have permission to create funds'], 403);
        }

        $validated = $request->validate([
            'fund_name' => 'required|string|max:255',
            'initial_amount' => 'required|numeric|min:0',
            'replenishment_threshold' => 'nullable|numeric|min:0',
            'branch_id' => 'required|exists:branches,id',
        ]);

        $userRole = DB::table('roles')->where('id', $user->role_id)->first();
        
        // Check authorization: super_admin can access all branches, branch_admin only their own
        if ($userRole->name === 'branch_admin' && $user->branch_id !== $validated['branch_id']) {
            return response()->json(['message' => 'Unauthorized: Branch admin can only create funds for their own branch'], 403);
        }

        $fund = PettyCashFund::create([
            'fund_name' => $validated['fund_name'],
            'branch_id' => $validated['branch_id'],
            'custodian_id' => $user->id,
            'initial_amount' => $validated['initial_amount'],
            'current_balance' => $validated['initial_amount'],
            'replenishment_threshold' => $validated['replenishment_threshold'] ?? 1000,
        ]);

        return response()->json([
            'message' => 'Petty cash fund created',
            'fund' => $fund
        ], 201);
    }

    // Get transactions
    public function getTransactions(Request $request)
    {
        $user = $request->user();
        
        $query = PettyCashTransaction::with(['fund', 'user', 'approvedBy']);

        if ($request->fund_id) {
            $query->where('fund_id', $request->fund_id);
        }

        // Filter by branch_id if requested - ensure user has access
        if ($request->branch_id) {
            $role = DB::table('roles')->where('id', $user->role_id)->first();
            
            // Super admin can see any branch's transactions
            if ($role->name === 'super_admin') {
                // Filter transactions through their fund's branch
                $query->whereHas('fund', fn($q) => $q->where('branch_id', $request->branch_id));
            }
            // Branch admin can only see their own branch's transactions
            elseif ($role->name === 'branch_admin' && $user->branch_id == $request->branch_id) {
                $query->whereHas('fund', fn($q) => $q->where('branch_id', $request->branch_id));
            }
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->type) {
            $query->where('type', $request->type);
        }

        if ($request->start_date && $request->end_date) {
            $query->whereBetween('transaction_date', [$request->start_date, $request->end_date]);
        }

        $transactions = $query->orderBy('transaction_date', 'desc')->paginate(20);

        return response()->json($transactions);
    }

    // Record expense
    public function recordExpense(Request $request)
    {
        $user = $request->user();

        // Check permission
        if (!$user->hasPermission('record_petty_cash_expense')) {
            return response()->json(['message' => 'Unauthorized: You do not have permission to record expenses'], 403);
        }

        $validated = $request->validate([
            'fund_id' => 'required|exists:petty_cash_funds,id',
            'amount' => 'required|numeric|min:0.01',
            'category' => 'required|string',
            'description' => 'required|string',
            'receipt_number' => 'nullable|string',
            'receipt_image' => 'nullable|image|max:5120',
            'transaction_date' => 'required|date',
        ]);

        $fund = PettyCashFund::findOrFail($validated['fund_id']);
        $userRole = DB::table('roles')->where('id', $user->role_id)->first();

        // Check branch authorization: branch_admin can only record expenses for their branch
        if ($userRole->name === 'branch_admin' && $user->branch_id !== $fund->branch_id) {
            return response()->json(['message' => 'Unauthorized: Branch admin can only record expenses for their branch'], 403);
        }

        // Check if enough balance
        if ($fund->current_balance < $validated['amount']) {
            return response()->json(['message' => 'Insufficient petty cash balance'], 400);
        }

        // Handle receipt upload
        $receiptPath = null;
        if ($request->hasFile('receipt_image')) {
            $receiptPath = $request->file('receipt_image')->store('petty-cash-receipts', 'public');
        }

        $transaction = PettyCashTransaction::create([
            'transaction_number' => $this->generateTransactionNumber(),
            'fund_id' => $fund->id,
            'user_id' => $user->id,
            'type' => 'expense',
            'amount' => $validated['amount'],
            'category' => $validated['category'],
            'description' => $validated['description'],
            'receipt_number' => $validated['receipt_number'] ?? null,
            'receipt_image' => $receiptPath,
            'transaction_date' => $validated['transaction_date'],
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Expense recorded successfully',
            'transaction' => $transaction->fresh()
        ], 201);
    }

    // Approve transaction
    public function approveTransaction(Request $request, $id)
    {
        $user = $request->user();

        // Check permission
        if (!$user->hasPermission('approve_petty_cash_expense')) {
            return response()->json(['message' => 'Unauthorized: You do not have permission to approve expenses'], 403);
        }

        $transaction = PettyCashTransaction::findOrFail($id);
        $fund = $transaction->fund;
        $userRole = DB::table('roles')->where('id', $user->role_id)->first();

        // Check branch authorization
        if ($userRole->name === 'branch_admin' && $user->branch_id !== $fund->branch_id) {
            return response()->json(['message' => 'Unauthorized: Branch admin can only approve expenses for their branch'], 403);
        }

        if ($transaction->status !== 'pending') {
            return response()->json(['message' => 'Transaction already processed'], 400);
        }

        $transaction->update([
            'status' => 'approved',
            'approved_by' => $user->id,
            'approved_at' => now(),
        ]);

        // Update fund balance
        $fund->updateBalance($transaction->amount, $transaction->type);

        return response()->json([
            'message' => 'Transaction approved',
            'transaction' => $transaction->fresh(),
            'new_balance' => $fund->current_balance
        ]);
    }

    // Reject transaction
    public function rejectTransaction(Request $request, $id)
    {
        $user = $request->user();

        // Check permission
        if (!$user->hasPermission('approve_petty_cash_expense')) {
            return response()->json(['message' => 'Unauthorized: You do not have permission to reject expenses'], 403);
        }

        $validated = $request->validate([
            'rejection_reason' => 'required|string',
        ]);

        $transaction = PettyCashTransaction::findOrFail($id);
        $fund = $transaction->fund;
        $userRole = DB::table('roles')->where('id', $user->role_id)->first();

        // Check branch authorization
        if ($userRole->name === 'branch_admin' && $user->branch_id !== $fund->branch_id) {
            return response()->json(['message' => 'Unauthorized: Branch admin can only reject expenses for their branch'], 403);
        }

        if ($transaction->status !== 'pending') {
            return response()->json(['message' => 'Transaction already processed'], 400);
        }

        $transaction->update([
            'status' => 'rejected',
            'approved_by' => $user->id,
            'approved_at' => now(),
            'rejection_reason' => $validated['rejection_reason'],
        ]);

        return response()->json([
            'message' => 'Transaction rejected',
            'transaction' => $transaction->fresh()
        ]);
    }

    // Record replenishment
    public function recordReplenishment(Request $request)
    {
        $validated = $request->validate([
            'fund_id' => 'required|exists:petty_cash_funds,id',
            'amount' => 'required|numeric|min:0.01',
            'description' => 'required|string',
            'transaction_date' => 'required|date',
        ]);

        $user = $request->user();

        $transaction = PettyCashTransaction::create([
            'transaction_number' => $this->generateTransactionNumber(),
            'fund_id' => $validated['fund_id'],
            'user_id' => $user->id,
            'type' => 'replenishment',
            'amount' => $validated['amount'],
            'category' => 'replenishment',
            'description' => $validated['description'],
            'transaction_date' => $validated['transaction_date'],
            'status' => 'approved', // Auto-approve replenishments
            'approved_by' => $user->id,
            'approved_at' => now(),
        ]);

        // Update balance immediately
        $fund = PettyCashFund::find($validated['fund_id']);
        $fund->updateBalance($validated['amount'], 'replenishment');

        return response()->json([
            'message' => 'Replenishment recorded',
            'transaction' => $transaction->fresh(),
            'new_balance' => $fund->current_balance
        ], 201);
    }

    // Get categories
    public function getCategories()
    {
        $categories = PettyCashCategory::where('is_active', true)->get();
        return response()->json($categories);
    }

    // Get summary report
    public function getSummary(Request $request)
    {
        $user = $request->user();
        $fundId = $request->fund_id;
        $startDate = $request->start_date ?? now()->startOfMonth();
        $endDate = $request->end_date ?? now();
        $branchId = $request->branch_id;

        $query = PettyCashTransaction::where('status', 'approved')
            ->whereBetween('transaction_date', [$startDate, $endDate]);

        if ($fundId) {
            $query->where('fund_id', $fundId);
        }

        // Filter by branch_id if requested
        if ($branchId) {
            $role = DB::table('roles')->where('id', $user->role_id)->first();
            
            // Super admin can see any branch's summary
            if ($role->name === 'super_admin') {
                $query->whereHas('fund', fn($q) => $q->where('branch_id', $branchId));
            }
            // Branch admin can only see their own branch's summary
            elseif ($role->name === 'branch_admin' && $user->branch_id == $branchId) {
                $query->whereHas('fund', fn($q) => $q->where('branch_id', $branchId));
            }
        }

        $totalExpenses = (clone $query)->where('type', 'expense')->sum('amount');
        $totalReplenishments = (clone $query)->where('type', 'replenishment')->sum('amount');

        $expensesByCategory = PettyCashTransaction::where('status', 'approved')
            ->where('type', 'expense')
            ->whereBetween('transaction_date', [$startDate, $endDate])
            ->when($fundId, fn($q) => $q->where('fund_id', $fundId))
            ->when($branchId, fn($q) => $q->whereHas('fund', fn($subQ) => $subQ->where('branch_id', $branchId)))
            ->select('category', DB::raw('SUM(amount) as total'))
            ->groupBy('category')
            ->get();

        return response()->json([
            'total_expenses' => $totalExpenses,
            'total_replenishments' => $totalReplenishments,
            'net_cash_flow' => $totalReplenishments - $totalExpenses,
            'expenses_by_category' => $expensesByCategory,
        ]);
    }

    private function generateTransactionNumber()
    {
        $year = date('Y');
        $prefix = "PC-{$year}-";
        
        $last = PettyCashTransaction::where('transaction_number', 'like', "{$prefix}%")
            ->orderBy('id', 'desc')
            ->first();

        if ($last) {
            $lastNumber = intval(substr($last->transaction_number, -4));
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        return $prefix . str_pad($newNumber, 4, '0', STR_PAD_LEFT);
    }
}