<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_number',
        'job_card_id',
        'customer_id',
        'created_by',
        'labor_charges',
        'parts_charges',
        'other_charges',
        'subtotal',
        'discount_amount',
        'tax_amount',
        'total_amount',
        'advance_paid',
        'balance_due',
        'status',
        'invoice_date',
        'due_date',
        'notes',
    ];

    protected $casts = [
        'labor_charges' => 'decimal:2',
        'parts_charges' => 'decimal:2',
        'other_charges' => 'decimal:2',
        'subtotal' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'advance_paid' => 'decimal:2',
        'balance_due' => 'decimal:2',
        'invoice_date' => 'date',
        'due_date' => 'date',
    ];

    // Relationships
    public function jobCard()
    {
        return $this->belongsTo(JobCard::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    // Helper methods
    public function calculateTotals()
    {
        $this->subtotal = $this->labor_charges + $this->parts_charges + $this->other_charges;
        $this->total_amount = $this->subtotal - $this->discount_amount + $this->tax_amount;
        $this->balance_due = $this->total_amount - $this->advance_paid;
        $this->save();
    }

    public function isPaid()
    {
        return $this->status === 'paid' || $this->balance_due <= 0;
    }

    public function isOverdue()
    {
        return $this->due_date && $this->due_date->isPast() && !$this->isPaid();
    }

    public function getTotalPaidAttribute()
    {
        return $this->payments()->sum('amount');
    }
}