<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('job_card_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_card_id')->constrained()->onDelete('cascade');
            $table->string('image_path'); // Storage path
            $table->enum('image_type', ['before', 'during', 'after', 'front', 'back', 'right', 'left', 'interior1', 'interior2', 'dashboard', 'top', 'other1', 'other2'])->default('before');
            $table->text('description')->nullable();
            $table->integer('order')->default(0); // Display order
            $table->timestamps();
            
            $table->index('job_card_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('job_card_images');
    }
};