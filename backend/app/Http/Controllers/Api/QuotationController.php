<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Quotation;
use App\Models\JobCard;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class QuotationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        $query = Quotation::with(['customer', 'vehicle', 'creator']);

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('quotation_number', 'like', "%{$search}%")
                  ->orWhereHas('customer', function($cq) use ($search) {
                      $cq->where('name', 'like', "%{$search}%");
                  });
            });
        }

        // Status filter
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Branch filter
        $role = DB::table('roles')->where('id', $user->role_id)->first();
        if ($role->name === 'branch_admin' && $user->branch_id) {
            $query->where('branch_id', $user->branch_id);
        }

        $quotations = $query->orderBy('created_at', 'desc')->paginate(15);

        return response()->json($quotations);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'vehicle_id' => 'required|exists:vehicles,id',
            'customer_complaint' => 'nullable|string',
            'inspection_notes' => 'nullable|string',
            'recommended_work' => 'nullable|string',
            'labor_cost' => 'required|numeric|min:0',
            'parts_cost' => 'required|numeric|min:0',
            'other_charges' => 'nullable|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'valid_until' => 'nullable|date|after:today',
            'notes' => 'nullable|string',
        ]);

        $validated['quotation_number'] = $this->generateQuotationNumber();
        $validated['created_by'] = $user->id;
        $validated['branch_id'] = $user->branch_id;
        $validated['status'] = 'draft';

        $quotation = Quotation::create($validated);
        $quotation->calculateTotal();

        return response()->json([
            'message' => 'Quotation created successfully',
            'quotation' => $quotation->fresh()->load(['customer', 'vehicle'])
        ], 201);
    }

    public function show($id)
    {
        $quotation = Quotation::with(['customer', 'vehicle', 'creator', 'jobCard'])
            ->findOrFail($id);

        return response()->json($quotation);
    }

    public function update(Request $request, $id)
    {
        $quotation = Quotation::findOrFail($id);

        if ($quotation->status === 'converted') {
            return response()->json(['message' => 'Cannot edit converted quotation'], 400);
        }

        $validated = $request->validate([
            'customer_complaint' => 'nullable|string',
            'inspection_notes' => 'nullable|string',
            'recommended_work' => 'nullable|string',
            'labor_cost' => 'sometimes|numeric|min:0',
            'parts_cost' => 'sometimes|numeric|min:0',
            'other_charges' => 'nullable|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'valid_until' => 'nullable|date|after:today',
            'notes' => 'nullable|string',
        ]);

        $quotation->update($validated);
        $quotation->calculateTotal();

        return response()->json([
            'message' => 'Quotation updated successfully',
            'quotation' => $quotation->fresh()
        ]);
    }

    public function sendToCustomer($id)
    {
        $quotation = Quotation::findOrFail($id);

        if ($quotation->status !== 'draft') {
            return response()->json(['message' => 'Only draft quotations can be sent'], 400);
        }

        $quotation->update(['status' => 'sent']);

        return response()->json([
            'message' => 'Quotation sent to customer',
            'quotation' => $quotation->fresh()
        ]);
    }

    public function approve($id)
    {
        $quotation = Quotation::findOrFail($id);

        if ($quotation->status !== 'sent') {
            return response()->json(['message' => 'Only sent quotations can be approved'], 400);
        }

        $quotation->update([
            'status' => 'approved',
            'approved_at' => now()
        ]);

        return response()->json([
            'message' => 'Quotation approved',
            'quotation' => $quotation->fresh()
        ]);
    }

    public function convertToJobCard($id)
    {
        $user = request()->user();
        $quotation = Quotation::findOrFail($id);

        if ($quotation->status !== 'approved') {
            return response()->json(['message' => 'Only approved quotations can be converted'], 400);
        }

        if ($quotation->job_card_id) {
            return response()->json(['message' => 'Already converted to job card'], 400);
        }

        // Create job card from quotation
        $jobCard = JobCard::create([
            'job_card_number' => $this->generateJobCardNumber(),
            'customer_id' => $quotation->customer_id,
            'vehicle_id' => $quotation->vehicle_id,
            'branch_id' => $quotation->branch_id,
            'created_by' => $user->id,
            'customer_complaint' => $quotation->customer_complaint,
            'initial_inspection_notes' => $quotation->inspection_notes,
            'recommendations' => $quotation->recommended_work,
            'labor_cost' => $quotation->labor_cost,
            'parts_cost' => $quotation->parts_cost,
            'other_charges' => $quotation->other_charges,
            'discount' => $quotation->discount,
            'total_amount' => $quotation->total_amount,
            'status' => 'pending',
        ]);

        $quotation->update([
            'status' => 'converted',
            'converted_at' => now(),
            'job_card_id' => $jobCard->id
        ]);

        return response()->json([
            'message' => 'Quotation converted to job card successfully',
            'job_card' => $jobCard->load(['customer', 'vehicle']),
            'quotation' => $quotation->fresh()
        ], 201);
    }

    private function generateQuotationNumber()
    {
        $year = date('Y');
        $prefix = "QT-{$year}-";
        
        $last = Quotation::where('quotation_number', 'like', "{$prefix}%")
            ->orderBy('id', 'desc')
            ->first();

        if ($last) {
            $lastNumber = intval(substr($last->quotation_number, -4));
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        return $prefix . str_pad($newNumber, 4, '0', STR_PAD_LEFT);
    }

    private function generateJobCardNumber()
    {
        $year = date('Y');
        $prefix = "JC-{$year}-";
        
        $lastJobCard = JobCard::where('job_card_number', 'like', "{$prefix}%")
            ->orderBy('id', 'desc')
            ->first();

        if ($lastJobCard) {
            $lastNumber = intval(substr($lastJobCard->job_card_number, -4));
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        return $prefix . str_pad($newNumber, 4, '0', STR_PAD_LEFT);
    }
}