<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\JobCard;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InvoiceController extends Controller
{
    /**
     * Generate invoice from job card
     */
    public function generateFromJobCard(Request $request, $jobCardId)
    {
        $user = $request->user();
        
        $permissions = DB::table('permissions')
            ->join('role_permissions', 'permissions.id', '=', 'role_permissions.permission_id')
            ->where('role_permissions.role_id', $user->role_id)
            ->pluck('permissions.name')
            ->toArray();
        
        if (!in_array('add_invoices', $permissions)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $jobCard = JobCard::with(['tasks', 'sparePartsRequests', 'customer'])->findOrFail($jobCardId);

        // Check if job card is inspected
        if ($jobCard->status !== 'inspected') {
            return response()->json([
                'message' => 'Job card must be marked as inspected before generating invoice',
                'current_status' => $jobCard->status
            ], 400);
        }

        // Validate spare parts pricing
        $sparePartsWithoutPricing = $jobCard->sparePartsRequests
            ->whereIn('overall_status', ['delivered', 'installed'])
            ->filter(function($part) {
                return $part->unit_cost == 0 || $part->selling_price == 0;
            });
        
        if ($sparePartsWithoutPricing->count() > 0) {
            $partNames = $sparePartsWithoutPricing->pluck('part_name')->toArray();
            return response()->json([
                'message' => 'Cannot generate invoice. The following spare parts have missing or zero pricing (cost price and/or selling price must be greater than 0):',
                'incomplete_parts' => $partNames
            ], 422);
        }

        // Validate services (tasks) pricing
        $tasksWithoutPricing = $jobCard->tasks
            ->where('status', 'completed')
            ->filter(function($task) {
                return $task->cost_price == 0 || $task->amount == 0;
            });
        
        if ($tasksWithoutPricing->count() > 0) {
            $taskNames = $tasksWithoutPricing->pluck('task_name')->toArray();
            return response()->json([
                'message' => 'Cannot generate invoice. The following services have missing or zero pricing (cost price and/or amount must be greater than 0):',
                'incomplete_tasks' => $taskNames
            ], 422);
        }

        // Check if invoice already exists
        $existingInvoice = Invoice::where('job_card_id', $jobCard->id)->first();
        if ($existingInvoice) {
            return response()->json([
                'message' => 'Invoice already exists for this job card',
                'invoice' => $existingInvoice
            ], 400);
        }

        // Calculate totals
        $laborCharges = $jobCard->tasks->sum('labor_cost');
        $partsCharges = $jobCard->sparePartsRequests
            ->where('overall_status', 'installed')
            ->sum('total_cost');
        $otherCharges = $jobCard->other_charges ?? 0;
        $discountAmount = $jobCard->discount ?? 0;

        $subtotal = $laborCharges + $partsCharges + $otherCharges;
        $totalAmount = $subtotal - $discountAmount;
        $advancePaid = $jobCard->advance_payment ?? 0;
        $balanceDue = $totalAmount - $advancePaid;

        // Generate invoice number
        $invoiceNumber = $this->generateInvoiceNumber();

        $invoice = Invoice::create([
            'invoice_number' => $invoiceNumber,
            'job_card_id' => $jobCard->id,
            'customer_id' => $jobCard->customer_id,
            'created_by' => $user->id,
            'labor_charges' => $laborCharges,
            'parts_charges' => $partsCharges,
            'other_charges' => $otherCharges,
            'subtotal' => $subtotal,
            'discount_amount' => $discountAmount,
            'tax_amount' => 0, // Can add tax calculation if needed
            'total_amount' => $totalAmount,
            'advance_paid' => $advancePaid,
            'balance_due' => $balanceDue,
            'status' => $balanceDue > 0 ? 'sent' : 'sent',
            'invoice_date' => now(),
            'due_date' => now()->addDays(7),
        ]);

        // Update job card status
        $jobCard->update([
            'status' => 'sent',
            'total_amount' => $totalAmount,
            'balance_amount' => $balanceDue
        ]);

        return response()->json([
            'message' => 'Invoice generated successfully',
            'invoice' => $invoice->load(['jobCard', 'customer'])
        ], 201);
    }

    /**
     * Get invoice by ID
     */
    public function show($id)
    {
        $invoice = Invoice::with([
            'jobCard.tasks',
            'jobCard.sparePartsRequests',
            'jobCard.vehicle',
            'customer',
            'payments'
        ])->findOrFail($id);

        return response()->json($invoice);
    }

    /**
     * Get invoice by job card
     */
    public function getByJobCard($jobCardId)
    {
        $invoice = Invoice::with(['payments'])
            ->where('job_card_id', $jobCardId)
            ->first();

        if (!$invoice) {
            return response()->json(['message' => 'No invoice found'], 404);
        }

        return response()->json($invoice);
    }

    /**
     * Update invoice
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();
        
        $permissions = DB::table('permissions')
            ->join('role_permissions', 'permissions.id', '=', 'role_permissions.permission_id')
            ->where('role_permissions.role_id', $user->role_id)
            ->pluck('permissions.name')
            ->toArray();
        
        if (!in_array('update_invoices', $permissions)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $invoice = Invoice::findOrFail($id);

        $validated = $request->validate([
            'discount_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'due_date' => 'nullable|date',
        ]);

        $invoice->update($validated);
        $invoice->calculateTotals();

        return response()->json([
            'message' => 'Invoice updated successfully',
            'invoice' => $invoice->fresh()
        ]);
    }

    /**
     * Generate unique invoice number
     */
    private function generateInvoiceNumber()
    {
        $year = date('Y');
        $prefix = "INV-{$year}-";
        
        $lastInvoice = Invoice::where('invoice_number', 'like', "{$prefix}%")
            ->orderBy('id', 'desc')
            ->first();

        if ($lastInvoice) {
            $lastNumber = intval(substr($lastInvoice->invoice_number, -4));
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        return $prefix . str_pad($newNumber, 4, '0', STR_PAD_LEFT);
    }
}
