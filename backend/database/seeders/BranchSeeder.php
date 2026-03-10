<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BranchSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('branches')->insert([
            [
                'name' => 'Main Branch - Colombo',
                'code' => 'HQ001',
                'address' => 'No. 123, Galle Road, Colombo 03',
                'phone' => '+94112345678',
                'email' => 'colombo@grandautotech.lk',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Kandy Branch',
                'code' => 'KDY001',
                'address' => 'No. 456, Peradeniya Road, Kandy',
                'phone' => '+94812345678',
                'email' => 'kandy@grandautotech.lk',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}