<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\JobCard;
use App\Models\Customer;
use App\Models\Vehicle;
use App\Models\User;
use App\Models\Branch;

class JobCardSeeder extends Seeder
{
    public function run(): void
    {
        $branches = Branch::all();
        
        $complaints = [
            'Engine making noise during startup',
            'Brake pedal feels soft',
            'Air conditioning not cooling',
            'Check engine light is on',
            'Steering wheel vibrating',
            'Strange smell from engine bay',
            'Transmission slipping',
            'Battery drains quickly',
            'Headlights flickering',
            'Suspension noise over bumps'
        ];

        $inspectionNotes = [
            'Inspection done. Starter motor issue detected.',
            'Preliminary check completed. Brake fluid needs replacement.',
            'Air con compressor not engaging properly.',
            'ECU scanned for fault codes.',
            'Steering alignment checked.',
            'Serpentine belt showing wear.',
            'Automatic transmission fluid level low.',
            'Battery terminal corrosion found.',
            'Electrical connections loose.',
            'Shock absorber seals leaking.'
        ];

        $recommendations = [
            'Replace starter motor and battery terminals',
            'Replace brake pads and check rotor condition',
            'Recharge AC and check refrigerant level',
            'Clear fault codes and test drive',
            'Check front wheel alignment',
            'Replace serpentine belt and tensioner',
            'Flush and refill transmission fluid',
            'Clean battery terminals and check alternator',
            'Tighten and test electrical system',
            'Replace shock absorbers'
        ];

        foreach ($branches as $branch) {
            // Get customers and vehicles from this branch
            $customers = Customer::where('branch_id', $branch->id)->get();
            $vehicles = Vehicle::where('branch_id', $branch->id)->get();
            
            // Get branch creator user
            $creator = User::where('branch_id', $branch->id)->first();

            if ($customers->isEmpty() || $vehicles->isEmpty() || !$creator) {
                continue;
            }

            // Create job cards with different aging (spread across time)
            // Old (90+ days ago), Mid (30-60 days ago), Recent (0-30 days)
            $agingPeriods = [
                ['days' => 120, 'count' => 3, 'statuses' => ['completed']],
                ['days' => 50, 'count' => 3, 'statuses' => ['in_progress', 'completed']],
                ['days' => 10, 'count' => 3, 'statuses' => ['pending', 'in_progress']],
            ];

            foreach ($agingPeriods as $period) {
                foreach (range(1, $period['count']) as $i) {
                    $customer = $customers->random();
                    $vehicle = $vehicles->random();
                    $createdDate = now()->subDays($period['days']);

                    $jobCard = JobCard::create([
                        'job_card_number' => $this->generateJobCardNumber(),
                        'customer_id' => $customer->id,
                        'vehicle_id' => $vehicle->id,
                        'branch_id' => $branch->id,
                        'created_by' => $creator->id,
                        'current_mileage' => rand(40000, 150000),
                        'status' => 'pending',
                        'customer_complaint' => $complaints[array_rand($complaints)],
                        'initial_inspection_notes' => $inspectionNotes[array_rand($inspectionNotes)],
                        'recommendations' => $recommendations[array_rand($recommendations)],
                    ]);
                }
            }
        }

        $this->command->info('✅ Job cards seeded successfully for all branches with aging data!');
    }

    private function generateJobCardNumber(): string
    {
        $year = date('Y');
        $count = JobCard::count() + 1;
        return "JC-{$year}-" . str_pad($count, 4, '0', STR_PAD_LEFT);
    }
}
