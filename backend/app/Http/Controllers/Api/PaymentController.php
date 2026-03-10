<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\JobCard;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    /**
     * Record payment for job card
     */
    public function store(Request $request)
    {
        $user = $request->user();
        
        $permissions = DB::table('permissions')
            ->join('role_permissions', 'permissions.id', '=', 'role_permissions.permission_id')
            ->where('role_permissions.role_id', $user->role_id)
            ->pluck('permissions.name')
            ->toArray();
        
        if (!in_array('add_payments', $permissions)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'job_card_id' => 'required|exists:job_cards,id',
            'invoice_id' => 'nullable|exists:invoices,id',
            'amount' => 'required|numeric|min:0.01',
            'payment_type' => 'required|in:advance,partial,full,refund',
            'payment_method' => 'required|in:cash,card,bank_transfer,cheque,mobile_payment,other',
            'bank_name' => 'nullable|string',
            'reference_number' => 'nullable|string',
            'payment_date' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        $jobCard = JobCard::findOrFail($validated['job_card_id']);

        // Check if advance payment and job card is completed or inspected
        if ($validated['payment_type'] === 'advance' && in_array($jobCard->status, ['completed', 'inspected'])) {
            return response()->json([
                'message' => 'Cannot add advance payment. Job card is ' . ($jobCard->status === 'completed' ? 'completed' : 'under inspection') . '.'
            ], 422);
        }

        // Generate payment number
        $paymentNumber = $this->generatePaymentNumber();

        $payment = Payment::create([
            'payment_number' => $paymentNumber,
            'job_card_id' => $jobCard->id,
            'invoice_id' => $validated['invoice_id'] ?? null,
            'customer_id' => $jobCard->customer_id,
            'received_by' => $user->id,
            'amount' => $validated['amount'],
            'payment_type' => $validated['payment_type'],
            'payment_method' => $validated['payment_method'],
            'bank_name' => $validated['bank_name'] ?? null,
            'reference_number' => $validated['reference_number'] ?? null,
            'payment_date' => $validated['payment_date'],
            'notes' => $validated['notes'] ?? null,
        ]);

        // Update job card based on payment type
        if ($validated['payment_type'] === 'advance') {
            // Advance payment — record on job card only (before invoice exists)
            $jobCard->advance_payment += $validated['amount'];
        } else {
            // Post-invoice payment — reduce job card balance
            $jobCard->balance_amount = max(0, $jobCard->balance_amount - $validated['amount']);
        }

        // Update job card payment_status
        if ($jobCard->balance_amount <= 0) {
            $jobCard->payment_status = 'paid';
        } elseif ($validated['payment_type'] === 'advance') {
            $jobCard->payment_status = 'advance_paid';
        } else {
            // partial or full payment made but balance still remains
            $jobCard->payment_status = $jobCard->balance_amount <= 0 ? 'paid' : 'partially_paid';
        }

        $jobCard->save();

        // Update invoice if exists — only reduce balance_due, never touch advance_paid here
        if ($validated['invoice_id']) {
            $invoice = Invoice::find($validated['invoice_id']);
            if ($invoice) {
                // Subtract this payment from the current outstanding balance_due
                $invoice->balance_due = max(0, $invoice->balance_due - $validated['amount']);

                if ($invoice->balance_due <= 0) {
                    $invoice->status = 'paid';
                } else {
                    $invoice->status = 'partially_paid';
                }

                $invoice->save();
            }
        }

        return response()->json([
            'message' => 'Payment recorded successfully',
            'payment' => $payment->load(['jobCard', 'customer', 'receivedBy']),
            'remaining_balance' => $jobCard->balance_amount
        ], 201);
    }

    /**
     * Get payments for job card
     */
    public function getByJobCard($jobCardId)
    {
        $payments = Payment::where('job_card_id', $jobCardId)
            ->with(['receivedBy'])
            ->orderBy('payment_date', 'desc')
            ->get();

        return response()->json($payments);
    }

    /**
     * Get single payment
     */
    public function show($id)
    {
        $payment = Payment::with(['jobCard', 'invoice', 'customer', 'receivedBy'])
            ->findOrFail($id);

        return response()->json($payment);
    }

    /**
     * Delete payment (void)
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        
        $permissions = DB::table('permissions')
            ->join('role_permissions', 'permissions.id', '=', 'role_permissions.permission_id')
            ->where('role_permissions.role_id', $user->role_id)
            ->pluck('permissions.name')
            ->toArray();
        
        if (!in_array('delete_payments', $permissions)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $payment = Payment::findOrFail($id);

        // Reverse the payment from job card (do NOT change job_card status)
        $jobCard = $payment->jobCard;
        $jobCard->advance_payment -= $payment->amount;
        $jobCard->balance_amount = $jobCard->total_amount - $jobCard->advance_payment;
        $jobCard->save();

        // Reverse from invoice if exists
        if ($payment->invoice_id) {
            $invoice = Invoice::find($payment->invoice_id);
            if ($invoice) {
                $invoice->advance_paid -= $payment->amount;
                $invoice->balance_due = $invoice->total_amount - $invoice->advance_paid;
                
                if ($invoice->balance_due > 0) {
                    $invoice->status = $invoice->advance_paid > 0 ? 'partially_paid' : 'sent';
                }
                
                $invoice->save();
            }
        }

        $payment->delete();

        return response()->json([
            'message' => 'Payment voided successfully'
        ]);
    }

    /**
     * Generate unique payment number
     */
    private function generatePaymentNumber()
    {
        $year = date('Y');
        $prefix = "PAY-{$year}-";
        
        $lastPayment = Payment::where('payment_number', 'like', "{$prefix}%")
            ->orderBy('id', 'desc')
            ->first();

        if ($lastPayment) {
            $lastNumber = intval(substr($lastPayment->payment_number, -4));
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        return $prefix . str_pad($newNumber, 4, '0', STR_PAD_LEFT);
    }
}
