<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\VehicleController;
use App\Http\Controllers\Api\JobCardController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\SparePartsRequestController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\QuotationController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\PettyCashController;
use App\Http\Controllers\Api\AccessRightsController;


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

    // Tasks Management
    Route::get('/job-cards/{jobCardId}/tasks', [TaskController::class, 'index']);
    Route::get('/tasks/{id}', [TaskController::class, 'show']);
    Route::put('/tasks/{id}', [TaskController::class, 'update']);
    Route::delete('/tasks/{id}', [TaskController::class, 'destroy']);
    Route::post('/tasks/{id}/assign', [TaskController::class, 'assignEmployees']);
    Route::post('/tasks/{id}/start', [TaskController::class, 'startTask']);
    Route::post('/tasks/{id}/stop', [TaskController::class, 'stopTask']);
    Route::post('/tasks/{id}/complete', [TaskController::class, 'completeTask']);
    Route::get('/employees/available', [TaskController::class, 'getAvailableEmployees']);


    // Spare Parts Management
Route::get('/job-cards/{jobCardId}/spare-parts', [SparePartsRequestController::class, 'index']);
Route::post('/job-cards/{jobCardId}/spare-parts', [SparePartsRequestController::class, 'store']);
Route::put('/spare-parts/{id}', [SparePartsRequestController::class, 'update']);
Route::delete('/spare-parts/{id}', [SparePartsRequestController::class, 'destroy']);

// Approval Workflow
Route::post('/spare-parts/{id}/approve/employee', [SparePartsRequestController::class, 'employeeApprove']);
Route::post('/spare-parts/{id}/approve/admin', [SparePartsRequestController::class, 'adminApprove']);
Route::post('/spare-parts/{id}/approve/customer', [SparePartsRequestController::class, 'customerApprove']);
Route::get('/spare-parts/pending/approvals', [SparePartsRequestController::class, 'getPendingApprovals']);

// Status Updates
Route::patch('/spare-parts/{id}/status', [SparePartsRequestController::class, 'updateStatus']);



// Invoice Management
Route::post('/job-cards/{jobCardId}/invoice/generate', [InvoiceController::class, 'generateFromJobCard']);
Route::get('/invoices/{id}', [InvoiceController::class, 'show']);
Route::get('/job-cards/{jobCardId}/invoice', [InvoiceController::class, 'getByJobCard']);
Route::put('/invoices/{id}', [InvoiceController::class, 'update']);

// Payment Management
Route::post('/payments', [PaymentController::class, 'store']);
Route::get('/payments/{id}', [PaymentController::class, 'show']);
Route::get('/job-cards/{jobCardId}/payments', [PaymentController::class, 'getByJobCard']);
Route::delete('/payments/{id}', [PaymentController::class, 'destroy']);


// Quotations
Route::get('/quotations', [QuotationController::class, 'index']);
Route::post('/quotations', [QuotationController::class, 'store']);
Route::get('/quotations/{id}', [QuotationController::class, 'show']);
Route::put('/quotations/{id}', [QuotationController::class, 'update']);
Route::post('/quotations/{id}/send', [QuotationController::class, 'sendToCustomer']);
Route::post('/quotations/{id}/approve', [QuotationController::class, 'approve']);
Route::post('/quotations/{id}/convert', [QuotationController::class, 'convertToJobCard']);

// Financial Reports
Route::get('/reports/financial-summary', [ReportController::class, 'financialSummary']);
Route::get('/reports/payment-methods', [ReportController::class, 'paymentMethodBreakdown']);
Route::get('/reports/outstanding-dues', [ReportController::class, 'outstandingDuesReport']);
Route::get('/reports/daily-revenue', [ReportController::class, 'dailyRevenue']);

Route::get('/petty-cash/funds', [PettyCashController::class, 'getFunds']);
Route::post('/petty-cash/funds', [PettyCashController::class, 'createFund']);
Route::get('/petty-cash/transactions', [PettyCashController::class, 'getTransactions']);
Route::post('/petty-cash/expense', [PettyCashController::class, 'recordExpense']);
Route::post('/petty-cash/replenishment', [PettyCashController::class, 'recordReplenishment']);
Route::post('/petty-cash/transactions/{id}/approve', [PettyCashController::class, 'approveTransaction']);
Route::post('/petty-cash/transactions/{id}/reject', [PettyCashController::class, 'rejectTransaction']);
Route::get('/petty-cash/categories', [PettyCashController::class, 'getCategories']);
Route::get('/petty-cash/summary', [PettyCashController::class, 'getSummary']);

// Access Rights Management (Super Admin Only)
Route::get('/access-rights/roles', [AccessRightsController::class, 'getAllRolesWithPermissions']);
Route::put('/access-rights/roles/{roleId}', [AccessRightsController::class, 'updateRolePermissions']);
Route::get('/access-rights/roles/{roleId}/users', [AccessRightsController::class, 'getUsersByRole']);
Route::get('/access-rights/stats', [AccessRightsController::class, 'getPermissionStats']);

// Multi-Branch Statistics (Super Admin Only)
Route::get('/branches/statistics', [JobCardController::class, 'getBranchStatistics']);
});