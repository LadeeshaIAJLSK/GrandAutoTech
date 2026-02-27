<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Customer;

class CustomerSeeder extends Seeder
{
    public function run(): void
    {
        $customers = [
            [
                'name' => 'John Doe',
                'email' => 'john@example.com',
                'phone' => '0771234567',
                'secondary_phone' => '0761234567',
                'address' => '123 Main Street',
                'city' => 'Colombo',
                'id_number' => '123456789V',
                'customer_type' => 'individual',
                'branch_id' => 1,
                'is_active' => true,
                'notes' => 'Regular customer',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Jane Smith',
                'email' => 'jane@example.com',
                'phone' => '0772234567',
                'secondary_phone' => '0762234567',
                'address' => '456 Oak Avenue',
                'city' => 'Kandy',
                'id_number' => '987654321V',
                'customer_type' => 'individual',
                'branch_id' => 2,
                'is_active' => true,
                'notes' => 'Preferred customer',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'ABC Auto Services',
                'email' => 'info@abcauto.com',
                'phone' => '0773234567',
                'secondary_phone' => null,
                'address' => '789 Business Park',
                'city' => 'Colombo',
                'id_number' => '456123789',
                'company_name' => 'ABC Auto Services',
                'customer_type' => 'business',
                'branch_id' => 1,
                'is_active' => true,
                'notes' => 'Corporate client',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Michael Johnson',
                'email' => 'michael@example.com',
                'phone' => '0774234567',
                'secondary_phone' => '0764234567',
                'address' => '321 Park Road',
                'city' => 'Galle',
                'id_number' => '654321987V',
                'customer_type' => 'individual',
                'branch_id' => 3,
                'is_active' => true,
                'notes' => 'New customer',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Sarah Williams',
                'email' => 'sarah@example.com',
                'phone' => '0775234567',
                'secondary_phone' => '0765234567',
                'address' => '654 Elm Street',
                'city' => 'Matara',
                'id_number' => '321654987V',
                'customer_type' => 'individual',
                'branch_id' => 1,
                'is_active' => true,
                'notes' => 'Regular customer',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        foreach ($customers as $customer) {
            Customer::create($customer);
        }
    }
}
