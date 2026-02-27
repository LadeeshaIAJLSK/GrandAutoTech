<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Clear existing role_permissions
        DB::table('role_permissions')->truncate();
        
        // Get role IDs
        $superAdmin = DB::table('roles')->where('name', 'super_admin')->first()->id;
        $branchAdmin = DB::table('roles')->where('name', 'branch_admin')->first()->id;
        $accountant = DB::table('roles')->where('name', 'accountant')->first()->id;
        $employee = DB::table('roles')->where('name', 'employee')->first()->id;
        $supportStaff = DB::table('roles')->where('name', 'support_staff')->first()->id;
        $customer = DB::table('roles')->where('name', 'customer')->first()->id;
        
        // Super Admin - ALL permissions
        $allPermissions = DB::table('permissions')->pluck('id');
        foreach ($allPermissions as $permissionId) {
            DB::table('role_permissions')->insert([
                'role_id' => $superAdmin,
                'permission_id' => $permissionId,
                'branch_id' => null,
                'granted' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        
        // Branch Admin - Most permissions
        $branchAdminPermissions = DB::table('permissions')
            ->whereNotIn('name', ['update_settings']) // Can't modify system settings
            ->pluck('id');
        foreach ($branchAdminPermissions as $permissionId) {
            DB::table('role_permissions')->insert([
                'role_id' => $branchAdmin,
                'permission_id' => $permissionId,
                'branch_id' => null,
                'granted' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        
        // Accountant - Financial only
        $accountantPermissions = DB::table('permissions')
            ->whereIn('module', ['dashboard', 'invoices', 'payments', 'financial_reports'])
            ->pluck('id');
        foreach ($accountantPermissions as $permissionId) {
            DB::table('role_permissions')->insert([
                'role_id' => $accountant,
                'permission_id' => $permissionId,
                'branch_id' => null,
                'granted' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        
        // Employee - Task specific
        $employeePermissions = DB::table('permissions')
            ->whereIn('name', [
                'view_dashboard',
                'own_tasks',
                'update_tasks',
                'add_spare_parts',
                'view_spare_parts',
            ])
            ->pluck('id');
        foreach ($employeePermissions as $permissionId) {
            DB::table('role_permissions')->insert([
                'role_id' => $employee,
                'permission_id' => $permissionId,
                'branch_id' => null,
                'granted' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        
        // Support Staff - Customer service
        $supportStaffPermissions = DB::table('permissions')
            ->whereIn('name', [
                'view_dashboard',
                'view_customers',
                'add_customers',
                'update_customers',
                'view_vehicles',
                'add_vehicles',
                'update_vehicles',
                'view_job_cards',
                'add_job_cards',
            ])
            ->pluck('id');
        foreach ($supportStaffPermissions as $permissionId) {
            DB::table('role_permissions')->insert([
                'role_id' => $supportStaff,
                'permission_id' => $permissionId,
                'branch_id' => null,
                'granted' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        
        // Customer - View own data only
        $customerPermissions = DB::table('permissions')
            ->whereIn('name', [
                'own_job_cards',
                'own_invoices',
                'approve_spare_parts',
            ])
            ->pluck('id');
        foreach ($customerPermissions as $permissionId) {
            DB::table('role_permissions')->insert([
                'role_id' => $customer,
                'permission_id' => $permissionId,
                'branch_id' => null,
                'granted' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
