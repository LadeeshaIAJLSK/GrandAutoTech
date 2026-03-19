<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Vehicle extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_id',
        'branch_id',
        'license_plate',
        'make',
        'model',
        'year',
        'color',
        'vin',
        'engine_number',
        'chassis_number',
        'odometer_reading',
        'fuel_type',
        'transmission',
        'notes',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'odometer_reading' => 'integer',
    ];

    // Relationships
    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }


    // Add to existing relationships
public function jobCards()
{
    return $this->hasMany(JobCard::class);
}

// Helper methods not used 
public function getLastServiceDate()
{
    return $this->jobCards()
        ->where('status', 'completed')
        ->orderBy('actual_completion_date', 'desc')
        ->first()
        ?->actual_completion_date;
}

public function getServiceHistoryCount()//not used
{
    return $this->jobCards()->count();
}

public function updateOdometer($newOdometerReading)//not used 
{
    if ($newOdometerReading > $this->odometer_reading) {
        $this->odometer_reading = $newOdometerReading;
        $this->save();
    }
}

    // Future relationships
    // public function jobCards()
    // {
    //     return $this->hasMany(JobCard::class);
    // }
}