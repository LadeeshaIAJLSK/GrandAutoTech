<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            // Dashboard
            ['module' => 'dashboard', 'action' => 'view', 'name' => 'view_dashboard', 'display_name' => 'View Dashboard'],
            ['module' => 'dashboard', 'action' => 'view_stats', 'name' => 'view_dashboard_stats', 'display_name' => 'View Dashboard Stats Cards'],
            ['module' => 'dashboard', 'action' => 'view_calendar', 'name' => 'view_dashboard_calendar', 'display_name' => 'View Dashboard Calendar'],
            ['module' => 'dashboard', 'action' => 'view_recent_jobs', 'name' => 'view_dashboard_recent_jobs', 'display_name' => 'View Dashboard Recent Job Cards'],
            ['module' => 'dashboard', 'action' => 'view_approvals', 'name' => 'view_dashboard_approvals', 'display_name' => 'View Dashboard Pending Approvals'],
            ['module' => 'dashboard', 'action' => 'view_status_breakdown', 'name' => 'view_dashboard_status_breakdown', 'display_name' => 'View Dashboard Status Breakdown'],
            
            // Users - All Users Tab
            ['module' => 'users', 'action' => 'view_all_users', 'name' => 'view_all_users', 'display_name' => 'View All Users Tab'],
            ['module' => 'users', 'action' => 'add_all_users', 'name' => 'add_all_users', 'display_name' => 'Add All Users'],
            ['module' => 'users', 'action' => 'edit_all_users', 'name' => 'edit_all_users', 'display_name' => 'Edit All Users'],
            ['module' => 'users', 'action' => 'delete_all_users', 'name' => 'delete_all_users', 'display_name' => 'Delete All Users'],
            
            // Users - Branch Admins Tab
            ['module' => 'users', 'action' => 'view_branch_admins', 'name' => 'view_branch_admins', 'display_name' => 'View Branch Admins Tab'],
            ['module' => 'users', 'action' => 'add_branch_admins', 'name' => 'add_branch_admins', 'display_name' => 'Add Branch Admins'],
            ['module' => 'users', 'action' => 'edit_branch_admins', 'name' => 'edit_branch_admins', 'display_name' => 'Edit Branch Admins'],
            ['module' => 'users', 'action' => 'delete_branch_admins', 'name' => 'delete_branch_admins', 'display_name' => 'Delete Branch Admins'],
            
            // Users - Accountants Tab
            ['module' => 'users', 'action' => 'view_accountants', 'name' => 'view_accountants', 'display_name' => 'View Accountants Tab'],
            ['module' => 'users', 'action' => 'add_accountants', 'name' => 'add_accountants', 'display_name' => 'Add Accountants'],
            ['module' => 'users', 'action' => 'edit_accountants', 'name' => 'edit_accountants', 'display_name' => 'Edit Accountants'],
            ['module' => 'users', 'action' => 'delete_accountants', 'name' => 'delete_accountants', 'display_name' => 'Delete Accountants'],
            
            // Users - Technicians Tab
            ['module' => 'users', 'action' => 'view_technicians', 'name' => 'view_technicians', 'display_name' => 'View Technicians Tab'],
            ['module' => 'users', 'action' => 'add_technicians', 'name' => 'add_technicians', 'display_name' => 'Add Technicians'],
            ['module' => 'users', 'action' => 'edit_technicians', 'name' => 'edit_technicians', 'display_name' => 'Edit Technicians'],
            ['module' => 'users', 'action' => 'delete_technicians', 'name' => 'delete_technicians', 'display_name' => 'Delete Technicians'],
            
            // Users - Support Staff Tab
            ['module' => 'users', 'action' => 'view_support_staff', 'name' => 'view_support_staff', 'display_name' => 'View Support Staff Tab'],
            ['module' => 'users', 'action' => 'add_support_staff', 'name' => 'add_support_staff', 'display_name' => 'Add Support Staff'],
            ['module' => 'users', 'action' => 'edit_support_staff', 'name' => 'edit_support_staff', 'display_name' => 'Edit Support Staff'],
            ['module' => 'users', 'action' => 'delete_support_staff', 'name' => 'delete_support_staff', 'display_name' => 'Delete Support Staff'],
            
            // Customers
            ['module' => 'customers', 'action' => 'view', 'name' => 'view_customers', 'display_name' => 'View Customers'],
            ['module' => 'customers', 'action' => 'add', 'name' => 'add_customers', 'display_name' => 'Add Customers'],
            ['module' => 'customers', 'action' => 'update', 'name' => 'update_customers', 'display_name' => 'Update Customers'],
            ['module' => 'customers', 'action' => 'delete', 'name' => 'delete_customers', 'display_name' => 'Delete Customers'],
            ['module' => 'customers', 'action' => 'own_data', 'name' => 'own_customers', 'display_name' => 'View Own Customer Data'],
            
            // Vehicles
            ['module' => 'vehicles', 'action' => 'view', 'name' => 'view_vehicles', 'display_name' => 'View Vehicles'],
            ['module' => 'vehicles', 'action' => 'add', 'name' => 'add_vehicles', 'display_name' => 'Add Vehicles'],
            ['module' => 'vehicles', 'action' => 'update', 'name' => 'update_vehicles', 'display_name' => 'Update Vehicles'],
            ['module' => 'vehicles', 'action' => 'delete', 'name' => 'delete_vehicles', 'display_name' => 'Delete Vehicles'],
            
            // Job Cards
            ['module' => 'job_cards', 'action' => 'view', 'name' => 'view_job_cards', 'display_name' => 'View Job Cards'],
            ['module' => 'job_cards', 'action' => 'add', 'name' => 'add_job_cards', 'display_name' => 'Create Job Cards'],
            ['module' => 'job_cards', 'action' => 'update', 'name' => 'update_job_cards', 'display_name' => 'Update Job Cards'],
            ['module' => 'job_cards', 'action' => 'delete', 'name' => 'delete_job_cards', 'display_name' => 'Delete Job Cards'],
            ['module' => 'job_cards', 'action' => 'own_data', 'name' => 'own_job_cards', 'display_name' => 'View Own Job Cards'],
            
            // Tasks
            ['module' => 'tasks', 'action' => 'view', 'name' => 'view_tasks', 'display_name' => 'View All Tasks'],
            ['module' => 'tasks', 'action' => 'add', 'name' => 'add_tasks', 'display_name' => 'Add Tasks'],
            ['module' => 'tasks', 'action' => 'update', 'name' => 'update_tasks', 'display_name' => 'Update Tasks'],
            ['module' => 'tasks', 'action' => 'delete', 'name' => 'delete_tasks', 'display_name' => 'Delete Tasks'],
            ['module' => 'tasks', 'action' => 'own_data', 'name' => 'own_tasks', 'display_name' => 'View Own Assigned Tasks'],
            
            // Spare Parts
            ['module' => 'spare_parts', 'action' => 'view', 'name' => 'view_spare_parts', 'display_name' => 'View Spare Parts'],
            ['module' => 'spare_parts', 'action' => 'add', 'name' => 'add_spare_parts', 'display_name' => 'Request Spare Parts'],
            ['module' => 'spare_parts', 'action' => 'update', 'name' => 'update_spare_parts', 'display_name' => 'Update Spare Parts'],
            ['module' => 'spare_parts', 'action' => 'delete', 'name' => 'delete_spare_parts', 'display_name' => 'Delete Spare Parts'],
            ['module' => 'spare_parts', 'action' => 'approve', 'name' => 'approve_spare_parts', 'display_name' => 'Approve Spare Parts Requests'],
            
            // Invoices
            ['module' => 'invoices', 'action' => 'view', 'name' => 'view_invoices', 'display_name' => 'View Invoices'],
            ['module' => 'invoices', 'action' => 'add', 'name' => 'add_invoices', 'display_name' => 'Create Invoices'],
            ['module' => 'invoices', 'action' => 'update', 'name' => 'update_invoices', 'display_name' => 'Update Invoices'],
            ['module' => 'invoices', 'action' => 'delete', 'name' => 'delete_invoices', 'display_name' => 'Delete Invoices'],
            ['module' => 'invoices', 'action' => 'own_data', 'name' => 'own_invoices', 'display_name' => 'View Own Invoices'],
            
            // Payments
            ['module' => 'payments', 'action' => 'view', 'name' => 'view_payments', 'display_name' => 'View Payments'],
            ['module' => 'payments', 'action' => 'add', 'name' => 'add_payments', 'display_name' => 'Record Payments'],
            ['module' => 'payments', 'action' => 'update', 'name' => 'update_payments', 'display_name' => 'Update Payments'],
            
            // Financial Reports
            ['module' => 'financial_reports', 'action' => 'view', 'name' => 'view_financial_reports', 'display_name' => 'View Financial Reports'],
            
            // Inspections
            ['module' => 'inspections', 'action' => 'view', 'name' => 'view_inspections', 'display_name' => 'View Inspections'],
            ['module' => 'inspections', 'action' => 'approve', 'name' => 'approve_inspections', 'display_name' => 'Approve Inspections'],
            
            // Settings
            ['module' => 'settings', 'action' => 'view', 'name' => 'view_settings', 'display_name' => 'View Settings'],
            ['module' => 'settings', 'action' => 'update', 'name' => 'update_settings', 'display_name' => 'Update Settings'],
            
            // Petty Cash
            ['module' => 'petty_cash', 'action' => 'view', 'name' => 'view_petty_cash_funds', 'display_name' => 'View Petty Cash Funds'],
            ['module' => 'petty_cash', 'action' => 'create', 'name' => 'create_petty_cash_fund', 'display_name' => 'Create Petty Cash Fund'],
            ['module' => 'petty_cash', 'action' => 'record_expense', 'name' => 'record_petty_cash_expense', 'display_name' => 'Record Petty Cash Expense'],
            ['module' => 'petty_cash', 'action' => 'approve', 'name' => 'approve_petty_cash_expense', 'display_name' => 'Approve/Reject Petty Cash Expenses'],
            ['module' => 'petty_cash', 'action' => 'replenish', 'name' => 'record_petty_cash_replenishment', 'display_name' => 'Record Petty Cash Replenishment'],
        ];

        foreach ($permissions as $permission) {
            DB::table('permissions')->updateOrInsert(
                ['name' => $permission['name']],
                [
                    'module' => $permission['module'],
                    'action' => $permission['action'],
                    'display_name' => $permission['display_name'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }
    }
}