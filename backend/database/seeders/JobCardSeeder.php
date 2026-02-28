<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\JobCard;
use App\Models\Customer;
use App\Models\Vehicle;
use App\Models\User;
use App\Models\Branch;
use App\Models\Task;

class JobCardSeeder extends Seeder
{
    public function run(): void
    {
        $branches = Branch::all();

        foreach ($branches as $branch) {
            // Get customers and vehicles from this branch
            $customers = Customer::where('branch_id', $branch->id)->get();
            $vehicles = Vehicle::where('branch_id', $branch->id)->get();
            
            // Get branch creator user
            $creator = User::where('branch_id', $branch->id)->first();

            if ($customers->isEmpty() || $vehicles->isEmpty() || !$creator) {
                continue;
            }

            // Create 2 job cards per branch
            foreach (range(1, 2) as $i) {
                $customer = $customers->random();
                $vehicle = $vehicles->random();

                $jobCard = JobCard::create([
                    'job_card_number' => $this->generateJobCardNumber(),
                    'customer_id' => $customer->id,
                    'vehicle_id' => $vehicle->id,
                    'branch_id' => $branch->id,
                    'created_by' => $creator->id,
                    'current_mileage' => rand(40000, 150000),
                    'status' => collect(['pending', 'in_progress', 'completed'])->random(),
                    'customer_complaint' => 'Engine making noise during startup',
                    'initial_inspection_notes' => 'Inspection done. Starter motor issue detected.',
                    'recommendations' => 'Replace starter motor and battery terminals',
                    'labor_cost' => rand(2000, 8000),
                    'parts_cost' => rand(5000, 20000),
                    'discount' => rand(0, 2000),
                    'advance_payment' => rand(5000, 15000),
                ]);

                // Calculate totals
                $jobCard->total_amount = $jobCard->labor_cost + $jobCard->parts_cost - $jobCard->discount;
                $jobCard->balance_amount = $jobCard->total_amount - $jobCard->advance_payment;
                $jobCard->save();

                // Create 2-3 tasks
                foreach (range(1, rand(2, 3)) as $j) {
                    Task::create([
                        'job_card_id' => $jobCard->id,
                        'task_name' => collect([
                            'Replace starter motor',
                            'Check battery terminals',
                            'Engine diagnostics',
                            'Fluid level check',
                            'Test run vehicle'
                        ])->random(),
                        'category' => collect(['mechanical', 'electrical', 'diagnostic'])->random(),
                        'status' => 'pending',
                    ]);
                }
            }
        }

        $this->command->info('✅ Job cards seeded successfully!');
    }

    private function generateJobCardNumber(): string
    {
        $year = date('Y');
        $count = JobCard::count() + 1;
        return "JC-{$year}-" . str_pad($count, 4, '0', STR_PAD_LEFT);
    }
}
