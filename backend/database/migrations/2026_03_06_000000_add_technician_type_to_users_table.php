<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Add technician_type column (only applicable for technician role)
            // Values: 'employee', 'supervisor', null for non-technicians
            $table->enum('technician_type', ['employee', 'supervisor'])->nullable()->after('role_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('technician_type');
        });
    }
};
