<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'phone',
        'employee_code',
        'password',
        'role_id',
        'branch_id',
        'is_active',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Relationships
     */
    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }


    // Add these relationships
public function createdJobCards()
{
    return $this->hasMany(JobCard::class, 'created_by');
}

public function taskAssignments()
{
    return $this->hasMany(TaskAssignment::class, 'user_id');
}

public function assignedTasks()
{
    return $this->belongsToMany(Task::class, 'task_assignments')
        ->withPivot('status', 'assigned_at', 'started_at', 'completed_at')
        ->withTimestamps();
}

public function timeTracking()
{
    return $this->hasMany(TaskTimeTracking::class, 'user_id');
}

public function sparePartsRequests()
{
    return $this->hasMany(SparePartsRequest::class, 'requested_by');
}

public function inspections()
{
    return $this->hasMany(Inspection::class, 'inspected_by');
}

public function createdInvoices()
{
    return $this->hasMany(Invoice::class, 'created_by');
}

public function receivedPayments()
{
    return $this->hasMany(Payment::class, 'received_by');
}

/**
 * Check if user has a specific permission through their role
 */
public function hasPermission($permissionName)
{
    if (!$this->role) {
        return false;
    }
    
    return $this->role->permissions()
        ->where('permissions.name', $permissionName)
        ->exists();
}
}