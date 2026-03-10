<?php

namespace Database\Seeders;

use App\Models\ActivityLog;
use App\Models\User;
use App\Models\Branch;
use Illuminate\Database\Seeder;

class ActivityLogSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::all();
        $branches = Branch::all();

        if ($users->isEmpty() || $branches->isEmpty()) {
            return;
        }

        $actions = ['created', 'updated', 'deleted', 'approved', 'rejected', 'viewed', 'downloaded'];
        $models = ['Job Card', 'Invoice', 'Quotation', 'Customer', 'Payment', 'Task'];
        $descriptions = [
            'created' => ['Created new {model} #{id}', 'Added {model} for customer'],
            'updated' => ['Updated {model} #{id}', 'Modified {model} details'],
            'deleted' => ['Deleted {model} #{id}', 'Removed {model} from system'],
            'approved' => ['Approved {model} #{id}', 'Confirmed {model}'],
            'rejected' => ['Rejected {model} #{id}', 'Declined {model}'],
            'viewed' => ['Viewed {model} #{id}', 'Accessed {model}'],
            'downloaded' => ['Downloaded {model} #{id}', 'Exported {model}'],
        ];

        $suspiciousReasons = [
            'Multiple deletions in short timeframe',
            'Unusual IP address detected',
            'Weekend access outside business hours',
            'Large payment amount processed',
            'Bulk data export',
            'Account accessed from new location',
            'Multiple failed approvals',
        ];

        // Create sample activity logs from the past 30 days
        for ($i = 0; $i < 100; $i++) {
            $user = $users->random();
            $branch = $branches->random();
            $action = $actions[array_rand($actions)];
            $model = $models[array_rand($models)];
            $isSuspicious = rand(1, 20) === 1; // 5% chance of suspicious activity
            $riskLevel = $isSuspicious ? ['high', 'medium'][rand(0, 1)] : 'low';

            $descArray = $descriptions[$action];
            $desc = $descArray[array_rand($descArray)];
            $description = str_replace(['{model}', '{id}'], [$model, rand(100, 9999)], $desc);

            ActivityLog::create([
                'user_id' => $user->id,
                'branch_id' => $branch->id,
                'action' => $action,
                'model' => $model,
                'model_id' => rand(1, 500),
                'description' => $description,
                'changes' => $isSuspicious ? json_encode(['status' => 'pending', 'amount' => rand(5000, 50000)]) : null,
                'ip_address' => sprintf('%d.%d.%d.%d', rand(0, 255), rand(0, 255), rand(0, 255), rand(0, 255)),
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'risk_level' => $riskLevel,
                'risk_reason' => $isSuspicious ? $suspiciousReasons[array_rand($suspiciousReasons)] : null,
                'is_suspicious' => $isSuspicious,
                'created_at' => now()->subDays(rand(0, 30))->subHours(rand(0, 23)),
            ]);
        }
    }
}
