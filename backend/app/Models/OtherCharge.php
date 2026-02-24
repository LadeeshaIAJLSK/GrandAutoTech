<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OtherCharge extends Model
{
    protected $fillable = [
        'job_card_id',
        'description',
        'cost_price',
        'amount',
    ];

    protected $casts = [
        'cost_price' => 'decimal:2',
        'amount' => 'decimal:2',
    ];

    public function jobCard()
    {
        return $this->belongsTo(JobCard::class);
    }
}
