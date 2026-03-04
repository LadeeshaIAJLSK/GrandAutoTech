<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            BranchSeeder::class,
            RoleSeeder::class,
            PermissionSeeder::class,
            RolePermissionSeeder::class,
            UserSeeder::class,
            CustomerSeeder::class,
            VehicleSeeder::class,
            JobCardSeeder::class,
            ActivityLogSeeder::class,
        ]);
    }
}