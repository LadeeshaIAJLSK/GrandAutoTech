<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PettyCashCategory;

class PettyCashCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Fuel & Transportation', 'icon' => '⛽'],
            ['name' => 'Office Supplies', 'icon' => '📎'],
            ['name' => 'Small Parts', 'icon' => '🔩'],
            ['name' => 'Tools & Equipment', 'icon' => '🔧'],
            ['name' => 'Delivery & Courier', 'icon' => '📦'],
            ['name' => 'Food & Refreshments', 'icon' => '☕'],
            ['name' => 'Cleaning Supplies', 'icon' => '🧹'],
            ['name' => 'Utilities', 'icon' => '💡'],
            ['name' => 'Miscellaneous', 'icon' => '💰'],
        ];

        foreach ($categories as $category) {
            PettyCashCategory::create($category);
        }
    }
}
