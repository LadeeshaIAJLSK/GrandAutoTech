<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Quotation extends Model
{
    use HasFactory;

    protected $fillable = [
        'quotation_number',
        'customer_id',
        'vehicle_id',
        'insurance_company',
        'created_by',
        'branch_id',
        'customer_complaint',
        'inspection_notes',
        'recommended_work',
        'labor_cost',
        'parts_cost',
        'other_charges',
        'discount',
        'total_amount',
        'status',
        'valid_until',
        'approved_at',
        'converted_at',
        'job_card_id',
        'notes',
    ];

    protected $casts = [
        'labor_cost' => 'decimal:2',
        'parts_cost' => 'decimal:2',
        'other_charges' => 'decimal:2',
        'discount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'valid_until' => 'date',
        'approved_at' => 'datetime',
        'converted_at' => 'datetime',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function jobCard()
    {
        return $this->belongsTo(JobCard::class);
    }

    public function items()
    {
        return $this->hasMany(QuotationItem::class)->orderBy('order');
    }

    public function calculateTotal()
    {
        // If quotation has items, calculate from items
        if ($this->items()->count() > 0) {
            $this->total_amount = $this->items()->sum('amount') + ($this->other_charges ?? 0) - ($this->discount ?? 0);
        } else {
            // Fallback to labor + parts calculation
            $this->total_amount = $this->labor_cost + $this->parts_cost + ($this->other_charges ?? 0) - ($this->discount ?? 0);
        }
        $this->save();
    }

    public function isExpired()
    {
        return $this->valid_until && $this->valid_until->isPast() && $this->status === 'sent';
    }
}