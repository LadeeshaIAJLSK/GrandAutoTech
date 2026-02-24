<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    use HasFactory;

    protected $fillable = [
        'job_card_id',
        'task_name',
        'description',
        'category',
        'status',
        'labor_hours',
        'labor_rate_per_hour',
        'labor_cost',
        'cost_price',
        'amount',
        'started_at',
        'completed_at',
        'estimated_duration_minutes',
        'actual_duration_minutes',
        'completion_notes',
        'priority',
    ];

    protected $casts = [
        'labor_hours' => 'decimal:2',
        'labor_rate_per_hour' => 'decimal:2',
        'labor_cost' => 'decimal:2',
        'cost_price' => 'decimal:2',
        'amount' => 'decimal:2',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'estimated_duration_minutes' => 'integer',
        'actual_duration_minutes' => 'integer',
        'priority' => 'integer',
    ];

    // Relationships
    public function jobCard()
    {
        return $this->belongsTo(JobCard::class);
    }

    public function assignments()
    {
        return $this->hasMany(TaskAssignment::class);
    }

    public function assignedEmployees()
    {
        return $this->belongsToMany(User::class, 'task_assignments')
            ->withPivot('status', 'assigned_at', 'started_at', 'completed_at', 'notes')
            ->withTimestamps();
    }

    public function timeTracking()
    {
        return $this->hasMany(TaskTimeTracking::class);
    }

    public function sparePartsRequests()
    {
        return $this->hasMany(SparePartsRequest::class);
    }

    public function inspections()
    {
        return $this->hasMany(Inspection::class);
    }

    // Helper methods
    public function calculateLaborCost()
    {
        $this->labor_cost = $this->labor_hours * $this->labor_rate_per_hour;
        $this->save();
    }

    public function isCompleted()
    {
        return $this->status === 'completed';
    }

    public function getTotalTimeSpent()
    {
        return $this->timeTracking()->sum('duration_minutes');
    }
}