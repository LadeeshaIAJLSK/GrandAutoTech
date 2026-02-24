<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SparePartsRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'job_card_id',
        'task_id',
        'requested_by',
        'part_name',
        'part_number',
        'description',
        'quantity',
        'unit_cost',
        'selling_price',
        'total_cost',
        'employee_status',
        'employee_approved_by',
        'employee_approved_at',
        'employee_notes',
        'admin_status',
        'admin_approved_by',
        'admin_approved_at',
        'admin_notes',
        'customer_status',
        'customer_approved_at',
        'customer_notes',
        'overall_status',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_cost' => 'decimal:2',
        'selling_price' => 'decimal:2',
        'total_cost' => 'decimal:2',
        'employee_approved_at' => 'datetime',
        'admin_approved_at' => 'datetime',
        'customer_approved_at' => 'datetime',
    ];

    protected $appends = ['cost_price'];

    // Accessors
    public function getCostPriceAttribute()
    {
        return $this->unit_cost;
    }

    // Relationships
    public function jobCard()
    {
        return $this->belongsTo(JobCard::class);
    }

    public function task()
    {
        return $this->belongsTo(Task::class);
    }

    public function requestedBy()
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function employeeApprovedBy()
    {
        return $this->belongsTo(User::class, 'employee_approved_by');
    }

    public function adminApprovedBy()
    {
        return $this->belongsTo(User::class, 'admin_approved_by');
    }

    // Helper methods
    public function calculateTotal()
    {
        $this->total_cost = $this->quantity * $this->selling_price;
        $this->save();
    }

    public function isFullyApproved()
    {
        // Only admin and customer approval required (employee level removed)
        return $this->admin_status === 'approved' 
            && $this->customer_status === 'approved';
    }

    public function isRejected()
    {
        return $this->employee_status === 'rejected' 
            || $this->admin_status === 'rejected' 
            || $this->customer_status === 'rejected';
    }

    public function getPendingApprovalLevel()
    {
        if ($this->employee_status === 'pending') return 'employee';
        if ($this->admin_status === 'pending') return 'admin';
        if ($this->customer_status === 'pending') return 'customer';
        return null;
    }
}
