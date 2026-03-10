<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JobCardImage extends Model
{
    use HasFactory;

    protected $fillable = [
        'job_card_id',
        'image_path',
        'image_type',
        'description',
        'order',
    ];

    protected $casts = [
        'order' => 'integer',
    ];

    // Relationships
    public function jobCard()
    {
        return $this->belongsTo(JobCard::class);
    }

    // Helper method to get full URL
    public function getImageUrlAttribute()
    {
        return asset('storage/' . $this->image_path);
    }
}