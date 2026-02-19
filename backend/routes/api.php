<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\VehicleController;
use App\Http\Controllers\Api\JobCardController;

// Public routes
Route::get('/test', function () {
    return response()->json([
        'status' => 'success',
        'message' => 'Backend is working! 🚀',
        'timestamp' => now(),
        'laravel_version' => app()->version()
    ]);
});

// Auth routes
Route::post('/login', [AuthController::class, 'login']);

// Protected routes (require authentication)
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    
    // Users Management
    Route::get('/users', [UserController::class, 'index']);
    Route::get('/users/{id}', [UserController::class, 'show']);
    Route::post('/users', [UserController::class, 'store']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);
    
    // Helper routes
    Route::get('/roles', [UserController::class, 'getRoles']);
    Route::get('/branches', [UserController::class, 'getBranches']);
    
    // Customers Management
    Route::get('/customers', [CustomerController::class, 'index']);
    Route::get('/customers/{id}', [CustomerController::class, 'show']);
    Route::post('/customers', [CustomerController::class, 'store']);
    Route::put('/customers/{id}', [CustomerController::class, 'update']);
    Route::delete('/customers/{id}', [CustomerController::class, 'destroy']);
    Route::get('/customers/search/quick', [CustomerController::class, 'quickSearch']);
    
    // Vehicles Management
    Route::get('/vehicles', [VehicleController::class, 'index']);
    Route::get('/vehicles/{id}', [VehicleController::class, 'show']);
    Route::post('/vehicles', [VehicleController::class, 'store']);
    Route::put('/vehicles/{id}', [VehicleController::class, 'update']);
    Route::delete('/vehicles/{id}', [VehicleController::class, 'destroy']);
    Route::get('/vehicles/customer/{customerId}', [VehicleController::class, 'getByCustomer']);
    Route::get('/vehicles/search/quick', [VehicleController::class, 'quickSearch']);
    Route::get('/vehicles/makes/list', [VehicleController::class, 'getMakes']);

    // Job Cards Management
    Route::get('/job-cards', [JobCardController::class, 'index']);
    Route::get('/job-cards/statistics', [JobCardController::class, 'getStatistics']);
    Route::get('/job-cards/{id}', [JobCardController::class, 'show']);
    Route::post('/job-cards', [JobCardController::class, 'store']);
    Route::put('/job-cards/{id}', [JobCardController::class, 'update']);
    Route::patch('/job-cards/{id}/status', [JobCardController::class, 'updateStatus']);
    Route::delete('/job-cards/{id}', [JobCardController::class, 'destroy']);

    // Job Card Images
    Route::post('/job-cards/{id}/images', [JobCardController::class, 'uploadImages']);
    Route::delete('/job-cards/{jobCardId}/images/{imageId}', [JobCardController::class, 'deleteImage']);

    // Job Card Tasks
    Route::post('/job-cards/{id}/tasks', [JobCardController::class, 'addTask']);
});