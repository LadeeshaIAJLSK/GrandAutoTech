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
            'reference_number' => 'nullable|string',
            'payment_date' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        $jobCard = JobCard::findOrFail($validated['job_card_id']);

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
            'reference_number' => $validated['reference_number'] ?? null,
            'payment_date' => $validated['payment_date'],
            'notes' => $validated['notes'] ?? null,
        ]);

        // Update job card balance
        $jobCard->advance_payment += $validated['amount'];
        $jobCard->balance_amount = $jobCard->total_amount - $jobCard->advance_payment;
        
        // Update status if fully paid
        if ($jobCard->balance_amount <= 0) {
            $jobCard->status = 'paid';
        }
        
        $jobCard->save();

        // Update invoice if exists
        if ($validated['invoice_id']) {
            $invoice = Invoice::find($validated['invoice_id']);
            if ($invoice) {
                $totalPaid = $invoice->advance_paid + $validated['amount'];
                $invoice->advance_paid = $totalPaid;
                $invoice->balance_due = $invoice->total_amount - $totalPaid;
                
                if ($invoice->balance_due <= 0) {
                    $invoice->status = 'paid';
                } elseif ($totalPaid > 0) {
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

        // Reverse the payment from job card
        $jobCard = $payment->jobCard;
        $jobCard->advance_payment -= $payment->amount;
        $jobCard->balance_amount = $jobCard->total_amount - $jobCard->advance_payment;
        
        if ($jobCard->status === 'paid' && $jobCard->balance_amount > 0) {
            $jobCard->status = 'invoiced';
        }
        
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
