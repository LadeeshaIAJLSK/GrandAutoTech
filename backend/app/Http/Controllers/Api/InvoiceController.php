<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\JobCard;
use App\Models\OtherCharge;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InvoiceController extends Controller
{
    /**
     * List all invoices (for invoice management table)
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Invoice::with(['jobCard.customer', 'jobCard.vehicle', 'jobCard.branch']);

        if ($user->role->name !== 'super_admin') {
            $query->whereHas('jobCard', fn($q) => $q->where('branch_id', $user->branch_id));
        }

        if ($request->branch_id && $user->role->name === 'super_admin') {
            $query->whereHas('jobCard', fn($q) => $q->where('branch_id', $request->branch_id));
        }

        $invoices = $query->orderBy('created_at', 'desc')->get();
        return response()->json($invoices);
    }

    /**
     * Generate invoice from job card
     */
    public function generateFromJobCard(Request $request, $jobCardId)
    {
        $request->validate([
            'discount_amount' => 'nullable|numeric|min:0',
        ]);

        $jobCard = JobCard::with([
            'customer',
            'tasks',
            'sparePartsRequests',
        ])->findOrFail($jobCardId);

        // Prevent duplicate invoices
        $existing = Invoice::where('job_card_id', $jobCardId)->first();
        if ($existing) {
            return response()->json(['message' => 'Invoice already exists for this job card', 'invoice' => $existing], 422);
        }

        DB::beginTransaction();
        try {
            // Labor from completed tasks
            $laborCharges = $jobCard->tasks
                ->where('status', 'completed')
                ->sum('amount');

            // Parts from spare parts with selling price
            $partsCharges = $jobCard->sparePartsRequests
                ->sum('selling_price');

            // Other charges
            $otherChargesTotal = OtherCharge::where('job_card_id', $jobCardId)->sum('amount');

            $subtotal = $laborCharges + $partsCharges + $otherChargesTotal;
            $discountAmount = $request->discount_amount ?? 0;
            $totalAmount = max(0, $subtotal - $discountAmount);

            // Advance payment from payments table (source of truth), fallback to job card field
            $advancePaid = Payment::where('job_card_id', $jobCardId)
                ->where('payment_type', 'advance')
                ->sum('amount');
            if ($advancePaid == 0) {
                $advancePaid = $jobCard->advance_payment ?? 0;
            }
            $balanceDue = max(0, $totalAmount - $advancePaid);

            // Determine status
            if ($balanceDue <= 0) {
                $status = 'paid';
            } elseif ($advancePaid > 0) {
                $status = 'partially_paid';
            } else {
                $status = 'sent';
            }

            // Generate invoice number
            $year = now()->year;
            $month = now()->format('m');
            $count = Invoice::whereYear('created_at', $year)->whereMonth('created_at', $month)->count() + 1;
            $invoiceNumber = 'INV' . $year . $month . str_pad($count, 5, '0', STR_PAD_LEFT);

            $invoice = Invoice::create([
                'invoice_number'  => $invoiceNumber,
                'job_card_id'     => $jobCardId,
                'customer_id'     => $jobCard->customer_id,
                'created_by'      => $request->user()->id,
                'labor_charges'   => $laborCharges,
                'parts_charges'   => $partsCharges,
                'other_charges'   => $otherChargesTotal,
                'subtotal'        => $subtotal,
                'discount_amount' => $discountAmount,
                'tax_amount'      => 0,
                'total_amount'    => $totalAmount,
                'advance_paid'    => $advancePaid,
                'balance_due'     => $balanceDue,
                'status'          => $status,
                'invoice_date'    => now()->toDateString(),
                'due_date'        => now()->addDays(30)->toDateString(),
            ]);

            DB::commit();

            return response()->json($invoice->load('jobCard.customer', 'jobCard.vehicle'), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to generate invoice: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get invoice by job card ID
     */
    public function getByJobCard($jobCardId)
    {
        $invoice = Invoice::where('job_card_id', $jobCardId)
            ->with(['jobCard.customer', 'jobCard.vehicle'])
            ->first();

        if (!$invoice) {
            return response()->json(null, 404);
        }

        return response()->json($invoice);
    }

    /**
     * Get single invoice
     */
    public function show($id)
    {
        $invoice = Invoice::with(['jobCard.customer', 'jobCard.vehicle'])->findOrFail($id);
        return response()->json($invoice);
    }

    /**
     * Update invoice (apply discount, update status)
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'discount_amount' => 'nullable|numeric|min:0',
            'status'          => 'nullable|in:draft,sent,paid,partially_paid,overdue,cancelled',
            'notes'           => 'nullable|string',
        ]);

        $invoice = Invoice::findOrFail($id);

        if ($request->has('discount_amount')) {
            $discount = $request->discount_amount;
            $totalAmount = max(0, $invoice->subtotal - $discount);
            $balanceDue = max(0, $totalAmount - $invoice->advance_paid);

            // Recalculate paid amounts from post-invoice payments
            $paidAmount = Payment::where('job_card_id', $invoice->job_card_id)
                ->whereIn('payment_type', ['partial', 'full'])
                ->sum('amount');
            $balanceDue = max(0, $balanceDue - $paidAmount);

            if ($balanceDue <= 0) {
                $status = 'paid';
            } elseif ($invoice->advance_paid > 0 || $paidAmount > 0) {
                $status = 'partially_paid';
            } else {
                $status = 'sent';
            }

            $invoice->update([
                'discount_amount' => $discount,
                'total_amount'    => $totalAmount,
                'balance_due'     => $balanceDue,
                'status'          => $status,
            ]);
        }

        if ($request->has('status')) {
            $invoice->update(['status' => $request->status]);
        }

        if ($request->has('notes')) {
            $invoice->update(['notes' => $request->notes]);
        }

        return response()->json($invoice->fresh());
    }
}
