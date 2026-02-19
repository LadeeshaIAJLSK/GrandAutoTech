<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            [
                'name' => 'super_admin',
                'display_name' => 'Super Admin',
                'description' => 'Full system access, all modules, can manage everything',
            ],
            [
                'name' => 'branch_admin',
                'display_name' => 'Branch Admin',
                'description' => 'Branch-specific full access, can manage employees within branch',
            ],
            [
                'name' => 'accountant',
                'display_name' => 'Accountant',
                'description' => 'Financial modules only, invoicing, payments, reports',
            ],
            [
                'name' => 'employee',
                'display_name' => 'Employee (Technician)',
                'description' => 'Task-specific access, view assigned tasks, log time, request parts',
            ],
            [
                'name' => 'support_staff',
                'display_name' => 'Support Staff',
                'description' => 'Customer service, booking management, create job cards',
            ],
            [
                'name' => 'customer',
                'display_name' => 'Customer',
                'description' => 'View-only access to their own data, approve parts requests',
            ],
        ];

        foreach ($roles as $role) {
            DB::table('roles')->insert([
                'name' => $role['name'],
                'display_name' => $role['display_name'],
                'description' => $role['description'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}