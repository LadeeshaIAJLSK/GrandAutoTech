<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActivityLog extends Model
{
    protected $fillable = [
        'user_id',
        'branch_id',
        'action',
        'model',
        'model_id',
        'description',
        'changes',
        'ip_address',
        'user_agent',
        'risk_level',
        'risk_reason',
        'is_suspicious',
    ];

    protected $casts = [
        'changes' => 'array',
        'is_suspicious' => 'boolean',
        'created_at' => 'datetime',
    ];

    public const UPDATED_AT = null; // Only has created_at, not updated_at

    // Relationships
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    // Scopes
    public function scopeByBranch($query, $branchId)
    {
        return $query->where('branch_id', $branchId);
    }

    public function scopeByUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeByAction($query, $action)
    {
        return $query->where('action', $action);
    }

    public function scopeSuspicious($query)
    {
        return $query->where('is_suspicious', true);
    }

    public function scopeHighRisk($query)
    {
        return $query->where('risk_level', 'high');
    }

    public function scopeRecentFirst($query)
    {
        return $query->orderBy('created_at', 'desc');
    }

    // Static method to log an activity
    public static function log($userId, $branchId, $action, $model, $modelId, $description, $changes = null)
    {
        return self::create([
            'user_id' => $userId,
            'branch_id' => $branchId,
            'action' => $action,
            'model' => $model,
            'model_id' => $modelId,
            'description' => $description,
            'changes' => $changes,
        ]);
    }
}
