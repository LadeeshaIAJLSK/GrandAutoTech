<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\JobCard;
use App\Models\Customer;
use App\Models\Vehicle;
use App\Models\User;

class JobCardSeeder extends Seeder
{
    public function run(): void
    {
        // Make sure we have customers and vehicles
        $customers = Customer::all();
        $vehicles = Vehicle::all();
        $creator = User::where('email', 'admin@grandautotech.lk')->first();

        if ($customers->isEmpty() || $vehicles->isEmpty()) {
            $this->command->info('Please create customers and vehicles first!');
            return;
        }

        $jobCards = [
            [
                'job_card_number' => 'JC-2026-0001',
                'customer_id' => $customers->first()->id,
                'vehicle_id' => $vehicles->first()->id,
                'created_by' => $creator->id,
                'branch_id' => 1,
                'current_mileage' => 45000,
                'status' => 'in_progress',
                'customer_complaint' => 'Engine making unusual noise and slight vibration at high speeds',
                'initial_inspection_notes' => 'Checked engine bay, found loose timing belt. Recommend full timing belt replacement.',
                'labor_cost' => 15000,
                'parts_cost' => 25000,
                'other_charges' => 2000,
                'total_amount' => 42000,
                'advance_payment' => 10000,
                'balance_amount' => 32000,
                'estimated_completion_date' => now()->addDays(2),
            ],
            [
                'job_card_number' => 'JC-2026-0002',
                'customer_id' => $customers->count() > 1 ? $customers[1]->id : $customers->first()->id,
                'vehicle_id' => $vehicles->count() > 1 ? $vehicles[1]->id : $vehicles->first()->id,
                'created_by' => $creator->id,
                'branch_id' => 1,
                'current_mileage' => 78000,
                'status' => 'waiting_parts',
                'customer_complaint' => 'Brake pads worn out, squeaking noise when braking',
                'initial_inspection_notes' => 'Front brake pads at 10%, rear at 25%. Recommend full brake pad replacement.',
                'labor_cost' => 8000,
                'parts_cost' => 12000,
                'total_amount' => 20000,
                'estimated_completion_date' => now()->addDays(1),
            ],
            [
                'job_card_number' => 'JC-2026-0003',
                'customer_id' => $customers->first()->id,
                'vehicle_id' => $vehicles->first()->id,
                'created_by' => $creator->id,
                'branch_id' => 1,
                'current_mileage' => 52000,
                'status' => 'completed',
                'customer_complaint' => 'Regular service - oil change and filter replacement',
                'initial_inspection_notes' => 'Standard service. All fluids checked.',
                'labor_cost' => 3000,
                'parts_cost' => 5000,
                'total_amount' => 8000,
                'advance_payment' => 8000,
                'balance_amount' => 0,
                'estimated_completion_date' => now()->subDays(1),
                'actual_completion_date' => now()->subHours(3),
            ],
        ];

        foreach ($jobCards as $jobCardData) {
            JobCard::create($jobCardData);
        }

        $this->command->info('Job cards seeded successfully!');
    }
}
