<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'secondary_phone',
        'address',
        'city',
        'id_number',
        'company_name',
        'customer_type',
        'branch_id',
        'is_active',
        'notes',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    // Relationships
    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function vehicles()
    {
        return $this->hasMany(Vehicle::class);
    }


    // Add to existing relationships
public function jobCards()
{
    return $this->hasMany(JobCard::class);
}

public function invoices()
{
    return $this->hasMany(Invoice::class);
}

public function payments()
{
    return $this->hasMany(Payment::class);
}

// Helper methods
public function getTotalSpentAttribute()
{
    return $this->payments()->sum('amount');
}

public function getActiveJobCardsCountAttribute()
{
    return $this->jobCards()->whereNotIn('status', ['completed', 'cancelled', 'paid'])->count();
}

    // Future relationships
    // public function jobCards()
    // {
    //     return $this->hasMany(JobCard::class);
    // }
}