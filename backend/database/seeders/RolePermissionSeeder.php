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
        $technician = DB::table('roles')->where('name', 'technician')->first()->id;
        $supportStaff = DB::table('roles')->where('name', 'support_staff')->first()->id;
        $customer = DB::table('roles')->where('name', 'customer')->first()->id;
        
        // Super Admin - ALL permissions
        $allPermissions = DB::table('permissions')->pluck('id');
        foreach ($allPermissions as $permissionId) {
            DB::table('role_permissions')->updateOrInsert(
                ['role_id' => $superAdmin, 'permission_id' => $permissionId],
                [
                    'technician_type' => null,
                    'branch_id' => null,
                    'granted' => true,
                    'updated_at' => now(),
                ]
            );
        }
        
        // Branch Admin - Most permissions
        $branchAdminPermissions = DB::table('permissions')
            ->whereNotIn('name', ['update_settings']) // Can't modify system settings
            ->pluck('id');
        foreach ($branchAdminPermissions as $permissionId) {
            DB::table('role_permissions')->updateOrInsert(
                ['role_id' => $branchAdmin, 'permission_id' => $permissionId],
                [
                    'technician_type' => null,
                    'branch_id' => null,
                    'granted' => true,
                    'updated_at' => now(),
                ]
            );
        }
        
        // Accountant - Financial only + view all users tab
        $accountantPermissions = DB::table('permissions')
            ->whereIn('module', ['dashboard', 'invoices', 'payments', 'financial_reports'])
            ->orWhereIn('name', ['view_users', 'view_all_users'])
            ->pluck('id');
        foreach ($accountantPermissions as $permissionId) {
            DB::table('role_permissions')->updateOrInsert(
                ['role_id' => $accountant, 'permission_id' => $permissionId],
                [
                    'technician_type' => null,
                    'branch_id' => null,
                    'granted' => true,
                    'updated_at' => now(),
                ]
            );
        }
        
        // Technician - My Tasks
        $technicianPermissions = DB::table('permissions')
            ->whereIn('name', [
                'view_dashboard',
                'view_dashboard_stats',
                'view_dashboard_recent_jobs',
                'view_my_tasks_tab',
                'view_own_tasks',
                'view_all_tasks_with_filter',
                'add_spare_parts',
                'view_spare_parts',
                'view_users',
                'view_all_users',
            ])
            ->pluck('id');
        foreach ($technicianPermissions as $permissionId) {
            DB::table('role_permissions')->updateOrInsert(
                ['role_id' => $technician, 'permission_id' => $permissionId],
                [
                    'technician_type' => null, // Applies to all technicians
                    'branch_id' => null,
                    'granted' => true,
                    'updated_at' => now(),
                ]
            );
        }
        
        // Support Staff - Customer service + user management
        $supportStaffPermissions = DB::table('permissions')
            ->whereIn('name', [
                'view_dashboard',
                'view_dashboard_stats',
                'view_dashboard_recent_jobs',
                'view_dashboard_status_breakdown',
                'view_customers_vehicles_tab',
                'view_customers',
                'add_customers',
                'update_customers',
                'view_vehicles',
                'add_vehicles',
                'update_vehicles',
                'view_job_cards_tab',
                'view_job_cards',
                'create_job_cards',
                'edit_job_cards',
                'delete_job_cards',
                'view_job_card_overview',
                'view_job_card_tasks',
                'add_job_card_task',
                'assign_job_card_task',
                'edit_job_card_task',
                'delete_job_card_task',
                'view_job_card_spare_parts',
                'add_job_card_spare_part',
                'approve_job_card_spare_part',
                'reject_job_card_spare_part',
                'view_job_card_advance_payments',
                'view_job_card_services_pricing',
                'edit_job_card_services_pricing',
                'view_job_card_spare_parts_pricing',
                'edit_job_card_spare_parts_pricing',
                'view_job_card_additional_charges',
                'add_job_card_additional_charge',
                'view_job_card_cost_analysis',
                'view_job_card_payment_summary',
                'view_job_card_history',
                'view_users',
                'view_all_users',
                'view_technicians',
                'view_support_staff',
            ])
            ->pluck('id');
        foreach ($supportStaffPermissions as $permissionId) {
            DB::table('role_permissions')->updateOrInsert(
                ['role_id' => $supportStaff, 'permission_id' => $permissionId],
                [
                    'technician_type' => null,
                    'branch_id' => null,
                    'granted' => true,
                    'updated_at' => now(),
                ]
            );
        }
        
        // Customer - View own data only
        $customerPermissions = DB::table('permissions')
            ->whereIn('name', [
                'own_invoices',
                'approve_spare_parts',
            ])
            ->pluck('id');
        foreach ($customerPermissions as $permissionId) {
            DB::table('role_permissions')->updateOrInsert(
                ['role_id' => $customer, 'permission_id' => $permissionId],
                [
                    'technician_type' => null,
                    'branch_id' => null,
                    'granted' => true,
                    'updated_at' => now(),
                ]
            );
        }
    }
}
