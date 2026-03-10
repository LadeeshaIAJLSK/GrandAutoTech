<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Personal Information
            $table->string('first_name')->nullable()->after('name');
            $table->enum('gender', ['male', 'female', 'other'])->nullable()->after('first_name');
            $table->date('date_of_birth')->nullable()->after('gender');
            
            // Employment Information
            $table->date('join_date')->nullable()->after('date_of_birth');
            $table->date('left_date')->nullable()->after('join_date');
            
            // Emergency Contact
            $table->string('emergency_contact_name')->nullable()->after('left_date');
            $table->string('emergency_contact_no')->nullable()->after('emergency_contact_name');
            
            // Additional Info
            $table->string('profile_image')->nullable()->after('emergency_contact_no');
            $table->longText('special_notes')->nullable()->after('profile_image');
            
            // Add indexes for commonly searched fields
            $table->index('first_name');
            $table->index('gender');
            $table->index('join_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['first_name']);
            $table->dropIndex(['gender']);
            $table->dropIndex(['join_date']);
            
            $table->dropColumn([
                'first_name',
                'gender',
                'date_of_birth',
                'join_date',
                'left_date',
                'emergency_contact_name',
                'emergency_contact_no',
                'profile_image',
                'special_notes'
            ]);
        });
    }
};
