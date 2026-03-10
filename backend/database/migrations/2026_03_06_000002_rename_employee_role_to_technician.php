<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('roles')
            ->where('name', 'employee')
            ->update([
                'name' => 'technician',
                'display_name' => 'Technician',
            ]);
    }

    public function down(): void
    {
        DB::table('roles')
            ->where('name', 'technician')
            ->update([
                'name' => 'employee',
                'display_name' => 'Employee (Technician)',
            ]);
    }
};
