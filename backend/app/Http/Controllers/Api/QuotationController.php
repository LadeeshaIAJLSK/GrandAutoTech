<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Quotation;
use App\Models\QuotationItem;
use App\Models\JobCard;
use App\Models\Task;
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
        $requestedBranchId = $request->query('branch_id');

        if ($requestedBranchId) {
            // Super admin can see any branch's quotations
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
        } 
        // No specific branch requested - show user's own branch(es)
        else {
            if ($role->name === 'branch_admin' && $user->branch_id) {
                $query->where('branch_id', $user->branch_id);
            }
        }

        $quotations = $query->orderBy('created_at', 'desc')->paginate(15);

        return response()->json($quotations);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        
        // Check authorization: super admin OR has create_quotations permission
        $isSuperAdmin = $user->role && ($user->role->name === 'super_admin');
        if (!$isSuperAdmin && !$user->hasPermission('create_quotations')) {
            return response()->json(['message' => 'Unauthorized: You do not have permission to create quotations'], 403);
        }

        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'vehicle_id' => 'required|exists:vehicles,id',
            'insurance_company' => 'nullable|string',
            'customer_complaint' => 'nullable|string',
            'inspection_notes' => 'nullable|string',
            'recommended_work' => 'nullable|string',
            'valid_until' => 'nullable|date|after:today',
            'notes' => 'nullable|string',
            'branch_id' => 'required|exists:branches,id',
        ]);

        $validated['quotation_number'] = $this->generateQuotationNumber($validated['branch_id']);
        $validated['created_by'] = $user->id;
        $validated['status'] = 'draft';

        $quotation = Quotation::create($validated);

        return response()->json([
            'message' => 'Quotation created successfully',
            'quotation' => $quotation->fresh()->load(['customer', 'vehicle', 'branch'])
        ], 201);
    }

    public function show($id)
    {
        $user = null;
        if (request()->user()) {
            $user = request()->user();
        }
        
        // Check authorization: super admin OR has view_quotations_details permission
        if ($user) {
            $isSuperAdmin = $user->role && ($user->role->name === 'super_admin');
            if (!$isSuperAdmin && !$user->hasPermission('view_quotations_details')) {
                return response()->json(['message' => 'Unauthorized: You do not have permission to view quotation details'], 403);
            }
        }
        
        $quotation = Quotation::with(['customer', 'vehicle', 'creator', 'branch', 'jobCard', 'items.task'])
            ->findOrFail($id);

        return response()->json($quotation);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        
        // Check authorization: super admin OR has edit_quotations permission
        $isSuperAdmin = $user->role && ($user->role->name === 'super_admin');
        if (!$isSuperAdmin && !$user->hasPermission('edit_quotations')) {
            return response()->json(['message' => 'Unauthorized: You do not have permission to edit quotations'], 403);
        }
        
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

    public function approve(Request $request, $id)
    {
        $user = $request->user();
        
        // Check authorization: super admin OR has approve_quotations permission
        $isSuperAdmin = $user->role && ($user->role->name === 'super_admin');
        if (!$isSuperAdmin && !$user->hasPermission('approve_quotations')) {
            return response()->json(['message' => 'Unauthorized: You do not have permission to approve quotations'], 403);
        }
        
        $quotation = Quotation::findOrFail($id);

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
        $quotation = Quotation::with('items.task')->findOrFail($id);

        if ($quotation->status !== 'approved') {
            return response()->json(['message' => 'Only approved quotations can be converted'], 400);
        }

        if ($quotation->job_card_id) {
            return response()->json(['message' => 'Already converted to job card'], 400);
        }

        // Create job card from quotation
        $jobCard = JobCard::create([
            'job_card_number' => $this->generateJobCardNumber($quotation->branch_id),
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

        // Add quotation items as tasks to job card if they exist
        foreach ($quotation->items as $item) {
            if ($item->item_type === 'task' && $item->task_id) {
                // Link existing task to job card
                $item->task->update(['job_card_id' => $jobCard->id]);
            } else if ($item->item_type === 'task') {
                // Create task from quotation item
                Task::create([
                    'job_card_id' => $jobCard->id,
                    'task_name' => $item->description,
                    'description' => $item->notes,
                    'status' => 'pending',
                    'estimated_hours' => $item->quantity_or_hours,
                ]);
            }
        }

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

    // Quotation Items Management
    public function addItem(Request $request, $quotationId)
    {
        $user = $request->user();
        
        // Check authorization: super admin OR has add_quotation_items permission
        $isSuperAdmin = $user->role && ($user->role->name === 'super_admin');
        if (!$isSuperAdmin && !$user->hasPermission('add_quotation_items')) {
            return response()->json(['message' => 'Unauthorized: You do not have permission to add quotation items'], 403);
        }
        
        $quotation = Quotation::findOrFail($quotationId);

        if ($quotation->status === 'converted') {
            return response()->json(['message' => 'Cannot edit converted quotation'], 400);
        }

        $validated = $request->validate([
            'item_type' => 'required|in:task,spare_part,other_charges',
            'task_id' => 'nullable|exists:tasks,id',
            'category' => 'nullable|string',
            'description' => 'required|string',
            'quantity_or_hours' => 'required|numeric|min:0.01',
            'unit_price' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $validated['quotation_id'] = $quotationId;
        $validated['amount'] = $validated['quantity_or_hours'] * $validated['unit_price'];
        $validated['order'] = $quotation->items()->count() + 1;

        $item = QuotationItem::create($validated);
        $quotation->calculateTotal();

        return response()->json([
            'message' => 'Item added successfully',
            'item' => $item,
        ], 201);
    }

    public function updateItem(Request $request, $quotationId, $itemId)
    {
        $quotation = Quotation::findOrFail($quotationId);
        $item = QuotationItem::where('id', $itemId)
            ->where('quotation_id', $quotationId)
            ->firstOrFail();

        if ($quotation->status === 'converted') {
            return response()->json(['message' => 'Cannot edit converted quotation'], 400);
        }

        $validated = $request->validate([
            'description' => 'nullable|string',
            'quantity_or_hours' => 'nullable|numeric|min:0.01',
            'unit_price' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        // Recalculate amount if quantity or price changed
        if (isset($validated['quantity_or_hours']) || isset($validated['unit_price'])) {
            $qty = $validated['quantity_or_hours'] ?? $item->quantity_or_hours;
            $price = $validated['unit_price'] ?? $item->unit_price;
            $validated['amount'] = $qty * $price;
        }

        $item->update($validated);
        $quotation->calculateTotal();

        return response()->json([
            'message' => 'Item updated successfully',
            'item' => $item,
        ]);
    }

    public function deleteItem(Request $request, $quotationId, $itemId)
    {
        $user = $request->user();
        
        // Check authorization: super admin OR has delete_quotation_items permission
        $isSuperAdmin = $user->role && ($user->role->name === 'super_admin');
        if (!$isSuperAdmin && !$user->hasPermission('delete_quotation_items')) {
            return response()->json(['message' => 'Unauthorized: You do not have permission to delete quotation items'], 403);
        }
        
        $quotation = Quotation::findOrFail($quotationId);
        $item = QuotationItem::where('id', $itemId)
            ->where('quotation_id', $quotationId)
            ->firstOrFail();

        if ($quotation->status === 'converted') {
            return response()->json(['message' => 'Cannot edit converted quotation'], 400);
        }

        $item->delete();
        $quotation->calculateTotal();

        return response()->json(['message' => 'Item deleted successfully']);
    }

    public function reorderItems(Request $request, $quotationId)
    {
        $quotation = Quotation::findOrFail($quotationId);

        if ($quotation->status === 'converted') {
            return response()->json(['message' => 'Cannot edit converted quotation'], 400);
        }

        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'required|integer|exists:quotation_items,id',
            'items.*.order' => 'required|integer|min:1',
        ]);

        foreach ($validated['items'] as $itemData) {
            QuotationItem::where('id', $itemData['id'])
                ->where('quotation_id', $quotationId)
                ->update(['order' => $itemData['order']]);
        }

        return response()->json(['message' => 'Items reordered successfully']);
    }

    private function generateQuotationNumber($branchId = null)
    {
        $year = date('Y');
        $branchCode = '';

        if ($branchId) {
            $branch = \App\Models\Branch::find($branchId);
            if ($branch && $branch->code) {
                // Extract only letters and take first 3 characters
                $branchCode = strtoupper(preg_replace('/[^A-Za-z]/', '', $branch->code));
                $branchCode = substr($branchCode, 0, 3);
            }
        }

        $prefix = "QT-{$branchCode}{$year}-";
        
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

    private function generateJobCardNumber($branchId = null)
    {
        $year = date('Y');
        $branchCode = '';

        if ($branchId) {
            $branch = \App\Models\Branch::find($branchId);
            if ($branch && $branch->code) {
                // Extract only letters and take first 3 characters
                $branchCode = strtoupper(preg_replace('/[^A-Za-z]/', '', $branch->code));
                $branchCode = substr($branchCode, 0, 3);
            }
        }

        $prefix = "JC-{$branchCode}-{$year}-";
        
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