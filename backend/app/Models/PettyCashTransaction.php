<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PettyCashTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'transaction_number',
        'fund_id',
        'user_id',
        'type',
        'amount',
        'category',
        'description',
        'receipt_number',
        'receipt_image',
        'approved_by',
        'approved_at',
        'status',
        'rejection_reason',
        'transaction_date',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'approved_at' => 'datetime',
        'transaction_date' => 'date',
    ];

    public function fund()
    {
        return $this->belongsTo(PettyCashFund::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}