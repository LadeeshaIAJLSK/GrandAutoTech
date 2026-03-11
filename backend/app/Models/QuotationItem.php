<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class QuotationItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'quotation_id',
        'item_type',
        'task_id',
        'category',
        'description',
        'quantity_or_hours',
        'unit_price',
        'amount',
        'notes',
        'order',
    ];

    protected $casts = [
        'quantity_or_hours' => 'decimal:2',
        'unit_price' => 'decimal:2',
        'amount' => 'decimal:2',
    ];

    // Relationships
    public function quotation()
    {
        return $this->belongsTo(Quotation::class);
    }

    public function task()
    {
        return $this->belongsTo(Task::class);
    }

    // Mutator to calculate amount
    public function setAmountAttribute($value)
    {
        $this->attributes['amount'] = $this->quantity_or_hours * $this->unit_price;
    }

    // Helper method to determine if item is a task or spare part
    public function isTask()
    {
        return $this->item_type === 'task';
    }

    public function isSparePart()
    {
        return $this->item_type === 'spare_part';
    }

    public function isOtherCharge()
    {
        return $this->item_type === 'other_charges';
    }
}

