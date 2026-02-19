<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Vehicle extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_id',
        'license_plate',
        'make',
        'model',
        'year',
        'color',
        'vin',
        'engine_number',
        'chassis_number',
        'mileage',
        'fuel_type',
        'transmission',
        'notes',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'mileage' => 'integer',
    ];

    // Relationships
    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }


    // Add to existing relationships
public function jobCards()
{
    return $this->hasMany(JobCard::class);
}

// Helper methods
public function getLastServiceDate()
{
    return $this->jobCards()
        ->where('status', 'completed')
        ->orderBy('actual_completion_date', 'desc')
        ->first()
        ?->actual_completion_date;
}

public function getServiceHistoryCount()
{
    return $this->jobCards()->count();
}

public function updateMileage($newMileage)
{
    if ($newMileage > $this->mileage) {
        $this->mileage = $newMileage;
        $this->save();
    }
}

    // Future relationships
    // public function jobCards()
    // {
    //     return $this->hasMany(JobCard::class);
    // }
}