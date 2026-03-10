<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PettyCashFund extends Model
{
    use HasFactory;

    protected $fillable = [
        'fund_name',
        'branch_id',
        'custodian_id',
        'initial_amount',
        'current_balance',
        'replenishment_threshold',
        'is_active',
    ];

    protected $casts = [
        'initial_amount' => 'decimal:2',
        'current_balance' => 'decimal:2',
        'replenishment_threshold' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function custodian()
    {
        return $this->belongsTo(User::class, 'custodian_id');
    }

    public function transactions()
    {
        return $this->hasMany(PettyCashTransaction::class, 'fund_id');
    }

    public function needsReplenishment()
    {
        return $this->current_balance < $this->replenishment_threshold;
    }

    public function updateBalance($amount, $type)
    {
        if ($type === 'expense') {
            $this->current_balance -= $amount;
        } else {
            $this->current_balance += $amount;
        }
        $this->save();
    }
}