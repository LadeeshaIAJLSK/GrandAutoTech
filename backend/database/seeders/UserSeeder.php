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
        $technicianRole = DB::table('roles')->where('name', 'technician')->first()->id;
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
                'gender' => 'male',
                'date_of_birth' => '1985-01-15',
                'join_date' => '2020-01-01',
                'emergency_contact_name' => 'Admin Contact',
                'emergency_contact_no' => '+94771234567',
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
                'gender' => 'male',
                'date_of_birth' => '1987-03-20',
                'join_date' => '2020-06-01',
                'emergency_contact_name' => 'Manager Contact',
                'emergency_contact_no' => '+94771234568',
            ],
            [
                'name' => 'Technician Sunil',
                'email' => 'technician@grandautotech.lk',
                'phone' => '+94771234570',
                'employee_code' => 'GAT004',
                'password' => Hash::make('password123'),
                'role_id' => $technicianRole,
                'branch_id' => $mainBranch,
                'is_active' => true,
                'gender' => 'male',
                'date_of_birth' => '1990-05-10',
                'join_date' => '2021-01-15',
                'emergency_contact_name' => 'Sunil Contact',
                'emergency_contact_no' => '+94771234570',
                'technician_type' => 'employee',
            ],
            [
                'name' => 'Technician Ravi',
                'email' => 'technician.kandy@grandautotech.lk',
                'phone' => '+94771234574',
                'employee_code' => 'GAT008',
                'password' => Hash::make('password123'),
                'role_id' => $technicianRole,
                'branch_id' => $kandyBranch,
                'is_active' => true,
                'gender' => 'male',
                'date_of_birth' => '1988-07-22',
                'join_date' => '2020-09-01',
                'emergency_contact_name' => 'Ravi Contact',
                'emergency_contact_no' => '+94771234574',
                'technician_type' => 'supervisor',
            ],
            [
                'name' => 'Technician Nimal',
                'email' => 'technician.nimal@grandautotech.lk',
                'phone' => '+94701234574',
                'employee_code' => 'GAT010',
                'password' => Hash::make('password123'),
                'role_id' => $technicianRole,
                'branch_id' => $mainBranch,
                'is_active' => true,
                'gender' => 'male',
                'date_of_birth' => '1988-07-22',
                'join_date' => '2020-09-01',
                'emergency_contact_name' => 'Nimal Contact',
                'emergency_contact_no' => '+94701234574',
                'technician_type' => 'supervisor',
            ],
        ];

        foreach ($users as $user) {
            // Get the role object to check if it's a technician
            $role = DB::table('roles')->where('id', $user['role_id'])->first();
            
            // Validate technician_type is set for technician roles
            if ($role->name === 'technician') {
                if (!isset($user['technician_type']) || empty($user['technician_type'])) {
                    throw new \Exception("Technician type must be specified for technician role");
                }
            } else {
                // Clear technician_type for non-technician roles
                $user['technician_type'] = null;
            }

            DB::table('users')->updateOrInsert(
                ['email' => $user['email']], // Unique constraint field
                [
                    'name' => $user['name'],
                    'phone' => $user['phone'],
                    'employee_code' => $user['employee_code'],
                    'password' => $user['password'],
                    'role_id' => $user['role_id'],
                    'branch_id' => $user['branch_id'],
                    'is_active' => $user['is_active'],
                    'gender' => $user['gender'],
                    'date_of_birth' => $user['date_of_birth'],
                    'join_date' => $user['join_date'],
                    'emergency_contact_name' => $user['emergency_contact_name'],
                    'emergency_contact_no' => $user['emergency_contact_no'],
                    'technician_type' => $user['technician_type'] ?? null,
                    'email_verified_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }
    }
}