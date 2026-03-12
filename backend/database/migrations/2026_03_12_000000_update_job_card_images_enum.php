<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // MySQL: Alter the enum to add new values
        DB::statement("ALTER TABLE job_card_images MODIFY image_type ENUM('before', 'during', 'after', 'front', 'back', 'right', 'left', 'interior1', 'interior2', 'dashboard', 'top', 'other1', 'other2') DEFAULT 'before'");
    }

    public function down(): void
    {
        // Revert to original enum
        DB::statement("ALTER TABLE job_card_images MODIFY image_type ENUM('before', 'during', 'after') DEFAULT 'before'");
    }
};
