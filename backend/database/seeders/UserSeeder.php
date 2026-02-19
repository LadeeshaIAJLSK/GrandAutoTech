<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Get role and branch IDs
        $superAdminRole = DB::table('roles')->where('name', 'super_admin')->first()->id;
        $branchAdminRole = DB::table('roles')->where('name', 'branch_admin')->first()->id;
        $accountantRole = DB::table('roles')->where('name', 'accountant')->first()->id;
        $employeeRole = DB::table('roles')->where('name', 'employee')->first()->id;
        $supportStaffRole = DB::table('roles')->where('name', 'support_staff')->first()->id;
        
        $mainBranch = DB::table('branches')->where('code', 'HQ001')->first()->id;
        $kandyBranch = DB::table('branches')->where('code', 'KDY001')->first()->id;
        
        $users = [
            [
                'name' => 'Super Admin',
                'email' => 'admin@grandautotech.lk',
                'phone' => '+94771234567',
                'employee_code' => 'GAT001',
                'password' => Hash::make('password123'),
                'role_id' => $superAdminRole,
                'branch_id' => null, // Access all branches
                'is_active' => true,
            ],
            [
                'name' => 'Colombo Branch Manager',
                'email' => 'colombo.manager@grandautotech.lk',
                'phone' => '+94771234568',
                'employee_code' => 'GAT002',
                'password' => Hash::make('password123'),
                'role_id' => $branchAdminRole,
                'branch_id' => $mainBranch,
                'is_active' => true,
            ],
            [
                'name' => 'Accountant John',
                'email' => 'accountant@grandautotech.lk',
                'phone' => '+94771234569',
                'employee_code' => 'GAT003',
                'password' => Hash::make('password123'),
                'role_id' => $accountantRole,
                'branch_id' => $mainBranch,
                'is_active' => true,
            ],
            [
                'name' => 'Technician Sunil',
                'email' => 'technician@grandautotech.lk',
                'phone' => '+94771234570',
                'employee_code' => 'GAT004',
                'password' => Hash::make('password123'),
                'role_id' => $employeeRole,
                'branch_id' => $mainBranch,
                'is_active' => true,
            ],
            [
                'name' => 'Support Staff Nimal',
                'email' => 'support@grandautotech.lk',
                'phone' => '+94771234571',
                'employee_code' => 'GAT005',
                'password' => Hash::make('password123'),
                'role_id' => $supportStaffRole,
                'branch_id' => $mainBranch,
                'is_active' => true,
            ],
        ];

        foreach ($users as $user) {
            DB::table('users')->insert([
                'name' => $user['name'],
                'email' => $user['email'],
                'phone' => $user['phone'],
                'employee_code' => $user['employee_code'],
                'password' => $user['password'],
                'role_id' => $user['role_id'],
                'branch_id' => $user['branch_id'],
                'is_active' => $user['is_active'],
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}