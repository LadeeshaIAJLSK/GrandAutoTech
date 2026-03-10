<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Inspection extends Model
{
    use HasFactory;

    protected $fillable = [
        'job_card_id',
        'task_id',
        'inspected_by',
        'inspection_type',
        'status',
        'quality_rating',
        'notes',
        'issues_found',
        'inspected_at',
    ];

    protected $casts = [
        'quality_rating' => 'integer',
        'inspected_at' => 'datetime',
    ];

    // Relationships
    public function jobCard()
    {
        return $this->belongsTo(JobCard::class);
    }

    public function task()
    {
        return $this->belongsTo(Task::class);
    }

    public function inspector()
    {
        return $this->belongsTo(User::class, 'inspected_by');
    }

    // Helper methods
    public function isApproved()
    {
        return $this->status === 'approved';
    }

    public function needsRevision()
    {
        return $this->status === 'needs_revision';
    }
}
