<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class KandyUserSeeder extends Seeder
{
    public function run(): void
    {
        $kandyBranchId = 2; // Kandy branch ID
        
        // Get role IDs
        $managerRole = \App\Models\Role::where('name', 'manager')->first();
        $technicianRole = \App\Models\Role::where('name', 'technician')->first();
        
        $users = [
            [
                'name' => 'Kandy Manager',
                'email' => 'kandy.manager@grandautotech.lk',
                'phone' => '0812234567',
                'password' => Hash::make('password123'),
                'employee_code' => 'KANDY-MGR-001',
                'role_id' => $managerRole?->id,
                'branch_id' => $kandyBranchId,
                'is_active' => true,
            ],
            [
                'name' => 'Kandy Technician 1',
                'email' => 'kandy.tech1@grandautotech.lk',
                'phone' => '0812345678',
                'password' => Hash::make('password123'),
                'employee_code' => 'KANDY-TECH-001',
                'role_id' => $technicianRole?->id,
                'branch_id' => $kandyBranchId,
                'is_active' => true,
            ],
            [
                'name' => 'Kandy Technician 2',
                'email' => 'kandy.tech2@grandautotech.lk',
                'phone' => '0812456789',
                'password' => Hash::make('password123'),
                'employee_code' => 'KANDY-TECH-002',
                'role_id' => $technicianRole?->id,
                'branch_id' => $kandyBranchId,
                'is_active' => true,
            ],
            [
                'name' => 'Kandy Receptionist',
                'email' => 'kandy.reception@grandautotech.lk',
                'phone' => '0812567890',
                'password' => Hash::make('password123'),
                'employee_code' => 'KANDY-REC-001',
                'role_id' => \App\Models\Role::where('name', 'receptionist')->first()?->id,
                'branch_id' => $kandyBranchId,
                'is_active' => true,
            ],
        ];
        
        foreach ($users as $user) {
            User::create($user);
        }
        
        $this->command->info('Kandy branch users created successfully!');
    }
}
