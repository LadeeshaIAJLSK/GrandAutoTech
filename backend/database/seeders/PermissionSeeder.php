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
            
            // Users
            ['module' => 'users', 'action' => 'view', 'name' => 'view_users', 'display_name' => 'View Users'],
            ['module' => 'users', 'action' => 'add', 'name' => 'add_users', 'display_name' => 'Add Users'],
            ['module' => 'users', 'action' => 'update', 'name' => 'update_users', 'display_name' => 'Update Users'],
            ['module' => 'users', 'action' => 'delete', 'name' => 'delete_users', 'display_name' => 'Delete Users'],
            
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