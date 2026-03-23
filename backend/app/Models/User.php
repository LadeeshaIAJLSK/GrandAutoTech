<?php

namespace App\Models;

use App\Enums\TechnicianType;
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
        'first_name',
        'email',
        'phone',
        'employee_code',
        'password',
        'role_id',
        'technician_type',
        'branch_id',
        'is_active',
        'gender',
        'date_of_birth',
        'join_date',
        'left_date',
        'emergency_contact_name',
        'emergency_contact_no',
        'profile_image',
        'special_notes',
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
            'date_of_birth' => 'date',
            'join_date' => 'date',
            'left_date' => 'date',
            'technician_type' => TechnicianType::class,
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
        ->withPivot('assigned_at', 'started_at', 'completed_at')
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
 * Check if user has a specific permission through their role and technician_type
 */
public function hasPermission($permissionName)
{
    if (!$this->role) {
        return false;
    }
    
    // For technician role, check both role and technician_type
    if ($this->role->name === 'technician') {
        return $this->role->permissions()
            ->where('permissions.name', $permissionName)
            ->where(function ($query) {
                // Permission is available if technician_type is null (for all technicians)
                // or if it matches the user's technician_type
                $query->whereNull('role_permissions.technician_type')
                    ->orWhere('role_permissions.technician_type', $this->technician_type?->value);
            })
            ->exists();
    }
    
    // For other roles, just check role permissions
    return $this->role->permissions()
        ->where('permissions.name', $permissionName)
        ->exists();
}
}