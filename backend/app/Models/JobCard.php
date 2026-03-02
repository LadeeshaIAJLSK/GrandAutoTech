<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\OtherCharge;

class JobCard extends Model
{
    use HasFactory;

    protected $fillable = [
        'job_card_number',
        'customer_id',
        'vehicle_id',
        'branch_id',
        'created_by',
        'current_mileage',
        'status',
        'customer_complaint',
        'initial_inspection_notes',
        'recommendations',
        'labor_cost',
        'parts_cost',
        'other_charges',
        'discount',
        'total_amount',
        'advance_payment',
        'balance_amount',
        'estimated_completion_date',
        'actual_completion_date',
        'delivered_date',
    ];

    protected $casts = [
        'labor_cost' => 'decimal:2',
        'parts_cost' => 'decimal:2',
        'other_charges' => 'decimal:2',
        'discount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'advance_payment' => 'decimal:2',
        'balance_amount' => 'decimal:2',
        'estimated_completion_date' => 'datetime',
        'actual_completion_date' => 'datetime',
        'delivered_date' => 'datetime',
    ];

    // Relationships
    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function images()
    {
        return $this->hasMany(JobCardImage::class)->orderBy('order');
    }

    public function tasks()
    {
        return $this->hasMany(Task::class);
    }

    public function sparePartsRequests()
    {
        return $this->hasMany(SparePartsRequest::class);
    }

    public function inspections()
    {
        return $this->hasMany(Inspection::class);
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function otherCharges()
    {
        return $this->hasMany(OtherCharge::class);
    }

    // Helper methods
    public function calculateTotals()
    {
        $this->total_amount = $this->labor_cost + $this->parts_cost + $this->other_charges - $this->discount;
        $this->balance_amount = $this->total_amount - $this->advance_payment;
        $this->save();
    }

    public function isCompleted()
    {
        return $this->status === 'completed' || $this->status === 'invoiced' || $this->status === 'paid';
    }

    public function canBeEdited()
    {
        return !in_array($this->status, ['completed', 'invoiced', 'paid', 'cancelled']);
    }

    /**
     * Update job card status based on related tasks
     * pending -> in_progress when any task starts
     */
    public function updateStatusBasedOnTasks()
    {
        // Check if any task is in progress
        $hasInProgressTask = $this->tasks()->where('status', 'in_progress')->exists();
        
        if ($hasInProgressTask && $this->status === 'pending') {
            $this->update(['status' => 'in_progress']);
        }
    }

    /**
     * Check if all tasks are completed and approved
     */
    public function areAllTasksApproved()
    {
        $tasks = $this->tasks()->get();
        
        if ($tasks->isEmpty()) {
            return false; // No tasks, cannot be approved
        }

        foreach ($tasks as $task) {
            // Check if task is completed
            if ($task->status !== 'completed') {
                return false;
            }

            // Check if task has inspection and it's approved
            $taskInspections = $task->inspections;
            if ($taskInspections->isEmpty()) {
                return false; // No inspection for this task
            }

            $allInspectionsApproved = $taskInspections->every(function($inspection) {
                return $inspection->status === 'approved';
            });

            if (!$allInspectionsApproved) {
                return false;
            }
        }

        return true;
    }

    /**
     * Mark inspection as completed and update job card status
     */
    public function markInspectionCompleted()
    {
        // Check if all tasks are approved before marking inspection complete
        if ($this->areAllTasksApproved()) {
            $this->update(['status' => 'completed']);
            return true;
        }
        return false;
    }
}