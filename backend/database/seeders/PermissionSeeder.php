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
            
            // Customers & Vehicles Tab
            ['module' => 'customers_vehicles', 'action' => 'view_tab', 'name' => 'view_customers_vehicles_tab', 'display_name' => 'View Customers & Vehicles Tab'],
            
            // Customers
            ['module' => 'customers', 'action' => 'view', 'name' => 'view_customers', 'display_name' => 'View Customers'],
            ['module' => 'customers', 'action' => 'add', 'name' => 'add_customers', 'display_name' => 'Add Customers'],
            ['module' => 'customers', 'action' => 'update', 'name' => 'update_customers', 'display_name' => 'Update Customers'],
            ['module' => 'customers', 'action' => 'delete', 'name' => 'delete_customers', 'display_name' => 'Delete Customers'],
            
            // Vehicles
            ['module' => 'vehicles', 'action' => 'view', 'name' => 'view_vehicles', 'display_name' => 'View Vehicles'],
            ['module' => 'vehicles', 'action' => 'add', 'name' => 'add_vehicles', 'display_name' => 'Add Vehicles'],
            ['module' => 'vehicles', 'action' => 'update', 'name' => 'update_vehicles', 'display_name' => 'Update Vehicles'],
            ['module' => 'vehicles', 'action' => 'delete', 'name' => 'delete_vehicles', 'display_name' => 'Delete Vehicles'],
            
            // My Tasks Tab
            ['module' => 'my_tasks', 'action' => 'view_tab', 'name' => 'view_my_tasks_tab', 'display_name' => 'View My Tasks Tab'],
            
            // Tasks - Own Data (requires view_my_tasks_tab to be checked first)
            ['module' => 'my_tasks', 'action' => 'own_data', 'name' => 'view_own_tasks', 'display_name' => 'View Own Tasks Details'],
            
            // Tasks - All With Filter (requires view_my_tasks_tab and view_own_tasks to be checked first)
            ['module' => 'my_tasks', 'action' => 'view_all', 'name' => 'view_all_tasks_with_filter', 'display_name' => 'View All Tasks with Filtering'],
            
            // Task Approval Tab
            ['module' => 'my_tasks', 'action' => 'view_approval_tab', 'name' => 'view_task_approval_tab', 'display_name' => 'View Task Approval Tab'],
            
            // Task Approval Actions (requires view_task_approval_tab)
            ['module' => 'my_tasks', 'action' => 'approve', 'name' => 'approve_tasks', 'display_name' => 'Approve Tasks'],
            ['module' => 'my_tasks', 'action' => 'reject', 'name' => 'reject_tasks', 'display_name' => 'Reject Tasks'],
            ['module' => 'my_tasks', 'action' => 'mark_inspected', 'name' => 'mark_task_inspected', 'display_name' => 'Mark Task as Inspected'],
            
            // Job Cards Tab
            ['module' => 'job_cards', 'action' => 'view_tab', 'name' => 'view_job_cards_tab', 'display_name' => 'View Job Cards Tab'],
            
            // Job Cards Actions (requires view_job_cards_tab)
            ['module' => 'job_cards', 'action' => 'view', 'name' => 'view_job_cards', 'display_name' => 'View Job Card Details'],
            ['module' => 'job_cards', 'action' => 'create', 'name' => 'create_job_cards', 'display_name' => 'Create Job Cards'],
            ['module' => 'job_cards', 'action' => 'edit', 'name' => 'edit_job_cards', 'display_name' => 'Edit Job Cards'],
            ['module' => 'job_cards', 'action' => 'delete', 'name' => 'delete_job_cards', 'display_name' => 'Delete Job Cards'],
            
            // Job Card Detail Sections (requires view_job_cards)
            ['module' => 'job_card_detail', 'action' => 'view_overview', 'name' => 'view_job_card_overview', 'display_name' => 'View Job Card Overview'],
            ['module' => 'job_card_detail', 'action' => 'view_tasks', 'name' => 'view_job_card_tasks', 'display_name' => 'View Job Card Tasks'],
            ['module' => 'job_card_detail', 'action' => 'add_task', 'name' => 'add_job_card_task', 'display_name' => 'Add Task to Job Card'],
            ['module' => 'job_card_detail', 'action' => 'assign_task', 'name' => 'assign_job_card_task', 'display_name' => 'Assign Employee to Task'],
            ['module' => 'job_card_detail', 'action' => 'edit_task', 'name' => 'edit_job_card_task', 'display_name' => 'Edit Job Card Task'],
            ['module' => 'job_card_detail', 'action' => 'delete_task', 'name' => 'delete_job_card_task', 'display_name' => 'Delete Job Card Task'],
            
            ['module' => 'job_card_detail', 'action' => 'view_spare_parts', 'name' => 'view_job_card_spare_parts', 'display_name' => 'View Spare Parts Section'],
            ['module' => 'job_card_detail', 'action' => 'add_spare_part', 'name' => 'add_job_card_spare_part', 'display_name' => 'Add Spare Part Request'],
            ['module' => 'job_card_detail', 'action' => 'edit_spare_part', 'name' => 'edit_job_card_spare_part', 'display_name' => 'Edit Spare Part Details'],
            ['module' => 'job_card_detail', 'action' => 'delete_spare_part', 'name' => 'delete_job_card_spare_part', 'display_name' => 'Delete Spare Part Request'],
            ['module' => 'job_card_detail', 'action' => 'approve_spare_part', 'name' => 'approve_job_card_spare_part', 'display_name' => 'Approve Spare Part Request'],
            ['module' => 'job_card_detail', 'action' => 'supervisor_approve_spare_part', 'name' => 'approve_job_card_spare_part_supervisor', 'display_name' => 'Supervisor Approval (Level 1)'],
            ['module' => 'job_card_detail', 'action' => 'customer_approve_spare_part', 'name' => 'approve_job_card_spare_part_customer', 'display_name' => 'Customer Approval (Level 2)'],
            ['module' => 'job_card_detail', 'action' => 'reject_spare_part', 'name' => 'reject_job_card_spare_part', 'display_name' => 'Reject Spare Part Request'],
            ['module' => 'job_card_detail', 'action' => 'confirm_delivery', 'name' => 'confirm_job_card_spare_part_delivery', 'display_name' => 'Confirm Spare Part Delivery'],
            ['module' => 'job_card_detail', 'action' => 'update_status', 'name' => 'update_job_card_spare_part_status', 'display_name' => 'Update Spare Part Status'],
            
            ['module' => 'job_card_detail', 'action' => 'view_advance_payments', 'name' => 'view_job_card_advance_payments', 'display_name' => 'View Advance Payments Section'],
            
            ['module' => 'job_card_detail', 'action' => 'view_services_pricing', 'name' => 'view_job_card_services_pricing', 'display_name' => 'View Services Pricing Management'],
            ['module' => 'job_card_detail', 'action' => 'edit_services_pricing', 'name' => 'edit_job_card_services_pricing', 'display_name' => 'Edit Services Pricing'],
            
            ['module' => 'job_card_detail', 'action' => 'view_spare_parts_pricing', 'name' => 'view_job_card_spare_parts_pricing', 'display_name' => 'View Spare Parts Pricing Management'],
            ['module' => 'job_card_detail', 'action' => 'edit_spare_parts_pricing', 'name' => 'edit_job_card_spare_parts_pricing', 'display_name' => 'Edit Spare Parts Pricing'],
            
            ['module' => 'job_card_detail', 'action' => 'view_additional_charges', 'name' => 'view_job_card_additional_charges', 'display_name' => 'View Additional Charges & Services'],
            ['module' => 'job_card_detail', 'action' => 'add_additional_charge', 'name' => 'add_job_card_additional_charge', 'display_name' => 'Add Additional Charge'],
            
            ['module' => 'job_card_detail', 'action' => 'view_cost_analysis', 'name' => 'view_job_card_cost_analysis', 'display_name' => 'View Cost Analysis & Profit Breakdown'],
            ['module' => 'job_card_detail', 'action' => 'view_payment_summary', 'name' => 'view_job_card_payment_summary', 'display_name' => 'View Payment Summary'],
            ['module' => 'job_card_detail', 'action' => 'view_history', 'name' => 'view_job_card_history', 'display_name' => 'View Job Card History'],
            
            // Spare Parts
            ['module' => 'spare_parts', 'action' => 'view', 'name' => 'view_spare_parts', 'display_name' => 'View Spare Parts'],
            ['module' => 'spare_parts', 'action' => 'add', 'name' => 'add_spare_parts', 'display_name' => 'Request Spare Parts'],
            ['module' => 'spare_parts', 'action' => 'update', 'name' => 'update_spare_parts', 'display_name' => 'Update Spare Parts'],
            ['module' => 'spare_parts', 'action' => 'delete', 'name' => 'delete_spare_parts', 'display_name' => 'Delete Spare Parts'],
            ['module' => 'spare_parts', 'action' => 'approve', 'name' => 'approve_spare_parts', 'display_name' => 'Approve Spare Parts Requests'],
            
            // Payments
            ['module' => 'payments', 'action' => 'view', 'name' => 'view_payments', 'display_name' => 'View Payments'],
            ['module' => 'payments', 'action' => 'add', 'name' => 'add_payments', 'display_name' => 'Record Payments'],
            ['module' => 'payments', 'action' => 'update', 'name' => 'update_payments', 'display_name' => 'Update Payments'],
            
            // Financial Reports Tab
            ['module' => 'financial_reports', 'action' => 'view_tab', 'name' => 'view_financial_reports_tab', 'display_name' => 'View Financial Reports Tab'],
            
            // Financial Reports Actions (requires view_financial_reports_tab)
            ['module' => 'financial_reports', 'action' => 'view', 'name' => 'view_financial_reports', 'display_name' => 'View Financial Reports'],
            
            // Settings
            ['module' => 'settings', 'action' => 'view', 'name' => 'view_settings', 'display_name' => 'View Settings'],
            ['module' => 'settings', 'action' => 'update', 'name' => 'update_settings', 'display_name' => 'Update Settings'],
            
            // Petty Cash Tab
            ['module' => 'petty_cash', 'action' => 'view_tab', 'name' => 'view_petty_cash_tab', 'display_name' => 'View Petty Cash Tab'],
            
            // Petty Cash Sub-Tabs (requires view_petty_cash_tab)
            ['module' => 'petty_cash', 'action' => 'view_overview', 'name' => 'view_petty_cash_overview', 'display_name' => 'View Petty Cash Overview'],
            ['module' => 'petty_cash', 'action' => 'view_expenses', 'name' => 'view_petty_cash_expenses', 'display_name' => 'View Petty Cash Expenses'],
            ['module' => 'petty_cash', 'action' => 'view_summary', 'name' => 'view_petty_cash_summary', 'display_name' => 'View Petty Cash Summary'],
            
            // Petty Cash Actions
            ['module' => 'petty_cash', 'action' => 'create', 'name' => 'create_petty_cash_fund', 'display_name' => 'Create Petty Cash Fund'],
            ['module' => 'petty_cash', 'action' => 'record_expense', 'name' => 'record_petty_cash_expense', 'display_name' => 'Record Petty Cash Expense'],
            ['module' => 'petty_cash', 'action' => 'replenish', 'name' => 'record_petty_cash_replenishment', 'display_name' => 'Record Petty Cash Replenishment'],
            ['module' => 'petty_cash', 'action' => 'delete', 'name' => 'delete_petty_cash_fund', 'display_name' => 'Delete Petty Cash Fund'],
            
            // Quotations Tab
            ['module' => 'quotations', 'action' => 'view_tab', 'name' => 'view_quotations_tab', 'display_name' => 'View Quotations Tab'],
            
            // Quotations Actions (requires view_quotations_tab)
            ['module' => 'quotations', 'action' => 'create', 'name' => 'create_quotations', 'display_name' => 'Create Quotations'],
            ['module' => 'quotations', 'action' => 'view_details', 'name' => 'view_quotations_details', 'display_name' => 'View Quotation Details'],
            ['module' => 'quotations', 'action' => 'edit', 'name' => 'edit_quotations', 'display_name' => 'Edit Quotations'],
            ['module' => 'quotations', 'action' => 'delete', 'name' => 'delete_quotations', 'display_name' => 'Delete Quotations'],
            ['module' => 'quotations', 'action' => 'approve', 'name' => 'approve_quotations', 'display_name' => 'Approve Quotations'],
            ['module' => 'quotations', 'action' => 'add_item', 'name' => 'add_quotation_items', 'display_name' => 'Add Items to Quotation'],
            ['module' => 'quotations', 'action' => 'edit_item', 'name' => 'edit_quotation_items', 'display_name' => 'Edit Quotation Items'],
            ['module' => 'quotations', 'action' => 'delete_item', 'name' => 'delete_quotation_items', 'display_name' => 'Delete Quotation Items'],
            ['module' => 'quotations', 'action' => 'print', 'name' => 'print_quotations', 'display_name' => 'Print Quotations'],
            
            // Invoice Management Tab
            ['module' => 'invoices', 'action' => 'view_tab', 'name' => 'view_invoices_tab', 'display_name' => 'View Invoice Management Tab'],
            
            // Invoice Management Actions (requires view_invoices_tab)
            ['module' => 'invoices', 'action' => 'view_details', 'name' => 'view_invoice_details', 'display_name' => 'View Invoice Details'],
            ['module' => 'invoices', 'action' => 'generate', 'name' => 'generate_invoices', 'display_name' => 'Generate Invoices'],
            ['module' => 'invoices', 'action' => 'record_payment', 'name' => 'record_invoice_payment', 'display_name' => 'Record Invoice Payment'],
            ['module' => 'invoices', 'action' => 'print', 'name' => 'print_invoices', 'display_name' => 'Print Invoices'],
            ['module' => 'invoices', 'action' => 'download_report', 'name' => 'download_invoice_report', 'display_name' => 'Download Invoice Report'],
            
            // Third Party Services Tab
            ['module' => 'third_party_services', 'action' => 'view_tab', 'name' => 'view_third_party_services_tab', 'display_name' => 'View Third Party Services Tab'],
            
            // Third Party Services Actions (requires view_third_party_services_tab)
            ['module' => 'third_party_services', 'action' => 'add_provider', 'name' => 'add_third_party_provider', 'display_name' => 'Add New Third Party Provider'],
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