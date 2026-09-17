<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\FitnessOsInquiryController;
use App\Http\Controllers\FitnessOsClientController;
use App\Http\Controllers\FitnessOsActivityController;
use App\Http\Controllers\FitnessOsPortalController;

Route::view('/', 'fitnessos')->name('home');

foreach (['about', 'coaching', 'transformations', 'resources', 'contact', 'apply'] as $page) {
    Route::view($page, 'fitnessos');
}

Route::post('fitnessos/apply', [FitnessOsInquiryController::class, 'application'])->middleware('throttle:5,1');
Route::post('fitnessos/contact', [FitnessOsInquiryController::class, 'contact'])->middleware('throttle:5,1');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('portal', FitnessOsPortalController::class)->name('portal');
    Route::get('fitnessos/checkins/{client?}', [FitnessOsActivityController::class, 'checkins']);
    Route::post('fitnessos/checkins', [FitnessOsActivityController::class, 'storeCheckin']);
    Route::get('fitnessos/messages/{client?}', [FitnessOsActivityController::class, 'messages']);
    Route::post('fitnessos/messages', [FitnessOsActivityController::class, 'sendMessage']);

    Route::middleware('fitness.role:coach')->group(function () {
        Route::get('fitnessos/leads', [FitnessOsInquiryController::class, 'leads']);
        Route::get('fitnessos/contact-messages', [FitnessOsInquiryController::class, 'contactMessages']);
        Route::patch('fitnessos/leads/{lead}', [FitnessOsInquiryController::class, 'updateLead']);
        Route::get('fitnessos/clients', [FitnessOsClientController::class, 'index']);
        Route::post('fitnessos/clients', [FitnessOsClientController::class, 'store']);
        Route::get('fitnessos/clients/{client}', [FitnessOsClientController::class, 'show']);
        Route::get('fitnessos/conversations', [FitnessOsActivityController::class, 'conversations']);
        Route::patch('fitnessos/checkins/{checkin}', [FitnessOsActivityController::class, 'reviewCheckin']);
        Route::view('dashboard', 'fitnessos')->name('dashboard');
        Route::view('dashboard/{path}', 'fitnessos')->where('path', '.*');
    });

    Route::middleware('fitness.role:client')->group(function () {
        Route::view('app', 'fitnessos')->name('client.app');
        Route::view('app/{path}', 'fitnessos')->where('path', '.*');
    });
});

require __DIR__.'/settings.php';
