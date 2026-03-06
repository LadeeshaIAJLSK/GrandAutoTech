<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $permissions = [
            // Petty Cash
            ['module' => 'petty_cash', 'action' => 'view', 'name' => 'view_petty_cash_funds', 'display_name' => 'View Petty Cash Funds'],
            ['module' => 'petty_cash', 'action' => 'create', 'name' => 'create_petty_cash_fund', 'display_name' => 'Create Petty Cash Fund'],
            ['module' => 'petty_cash', 'action' => 'edit', 'name' => 'edit_petty_cash_fund', 'display_name' => 'Edit Petty Cash Fund'],
            ['module' => 'petty_cash', 'action' => 'record_expense', 'name' => 'record_petty_cash_expense', 'display_name' => 'Record Petty Cash Expense'],
            ['module' => 'petty_cash', 'action' => 'approve', 'name' => 'approve_petty_cash_expense', 'display_name' => 'Approve/Reject Petty Cash Expenses'],
            ['module' => 'petty_cash', 'action' => 'replenish', 'name' => 'record_petty_cash_replenishment', 'display_name' => 'Record Petty Cash Replenishment'],
        ];

        foreach ($permissions as $permission) {
            // Check if permission already exists to avoid duplicates
            $exists = DB::table('permissions')
                ->where('name', $permission['name'])
                ->exists();

            if (!$exists) {
                DB::table('permissions')->insert([
                    'module' => $permission['module'],
                    'action' => $permission['action'],
                    'name' => $permission['name'],
                    'display_name' => $permission['display_name'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('permissions')->whereIn('name', [
            'view_petty_cash_funds',
            'create_petty_cash_fund',
            'edit_petty_cash_fund',
            'record_petty_cash_expense',
            'approve_petty_cash_expense',
            'record_petty_cash_replenishment',
        ])->delete();
    }
};
