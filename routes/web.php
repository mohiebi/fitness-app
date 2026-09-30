<?php

use App\Http\Controllers\AiDraftController;
use App\Http\Controllers\BillingController;
use App\Http\Controllers\CalendarController;
use App\Http\Controllers\CoachDirectoryController;
use App\Http\Controllers\CoachingController;
use App\Http\Controllers\CoachProfileController;
use App\Http\Controllers\CoachReportController;
use App\Http\Controllers\CoachReviewController;
use App\Http\Controllers\ExerciseController;
use App\Http\Controllers\FitnessOsActivityController;
use App\Http\Controllers\FitnessOsClientController;
use App\Http\Controllers\FitnessOsInquiryController;
use App\Http\Controllers\FitnessOsPortalController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\TelegramController;
use App\Http\Controllers\TraineeProfileController;
use App\Http\Controllers\WorkoutLogController;
use App\Http\Controllers\WorkoutPlanController;
use Illuminate\Support\Facades\Route;

Route::view('/', 'fitnessos')->name('home');

foreach (['about', 'resources', 'contact', 'coaches'] as $page) {
    Route::view($page, 'fitnessos');
}
Route::view('coaches/{slug}', 'fitnessos')->where('slug', '[a-z0-9-]+');

// Pages from the single-coach site now live in the coach directory.
foreach (['apply', 'coaching', 'transformations'] as $page) {
    Route::permanentRedirect($page, '/coaches');
}

Route::get('fitnessos/coaches', [CoachDirectoryController::class, 'index']);
Route::get('fitnessos/coaches/{slug}', [CoachDirectoryController::class, 'show']);
Route::get('fitnessos/coaches/{slug}/reviews', [CoachReviewController::class, 'index']);
Route::post('fitnessos/contact', [FitnessOsInquiryController::class, 'contact'])->middleware('throttle:5,1');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('portal', FitnessOsPortalController::class)->name('portal');
    Route::get('fitnessos/checkins/{client?}', [FitnessOsActivityController::class, 'checkins']);
    Route::post('fitnessos/checkins', [FitnessOsActivityController::class, 'storeCheckin']);
    Route::get('fitnessos/messages/{client?}', [FitnessOsActivityController::class, 'messages']);
    Route::post('fitnessos/messages', [FitnessOsActivityController::class, 'sendMessage']);
    Route::post('fitnessos/coachings/{coaching}/end', [CoachingController::class, 'end']);
    Route::get('fitnessos/notifications', [NotificationController::class, 'index']);
    Route::post('fitnessos/notifications/read', [NotificationController::class, 'read']);

    Route::get('fitnessos/contact-messages', [FitnessOsInquiryController::class, 'contactMessages'])->middleware('fitness.role:admin');

    Route::middleware('fitness.role:coach')->group(function () {
        Route::get('fitnessos/clients', [FitnessOsClientController::class, 'index']);
        Route::post('fitnessos/clients', [FitnessOsClientController::class, 'store']);
        Route::get('fitnessos/clients/{client}', [FitnessOsClientController::class, 'show']);
        Route::get('fitnessos/conversations', [FitnessOsActivityController::class, 'conversations']);
        Route::patch('fitnessos/checkins/{checkin}', [FitnessOsActivityController::class, 'reviewCheckin']);
        Route::get('fitnessos/coach-profile', [CoachProfileController::class, 'show']);
        Route::put('fitnessos/coach-profile', [CoachProfileController::class, 'update']);
        Route::post('fitnessos/coach-profile/avatar', [CoachProfileController::class, 'avatar']);
        Route::get('fitnessos/coachings', [CoachingController::class, 'index']);
        Route::post('fitnessos/coachings/{coaching}/accept', [CoachingController::class, 'accept']);
        Route::post('fitnessos/coachings/{coaching}/decline', [CoachingController::class, 'decline']);
        Route::get('fitnessos/reports', CoachReportController::class);
        Route::get('fitnessos/calendar', [CalendarController::class, 'index']);
        Route::post('fitnessos/calendar/events', [CalendarController::class, 'store'])->middleware('throttle:60,1');
        Route::delete('fitnessos/calendar/events/{event}', [CalendarController::class, 'destroy']);
        Route::get('fitnessos/coach-reviews', [CoachReviewController::class, 'coachIndex']);
        Route::post('fitnessos/coach-reviews/{review}/reply', [CoachReviewController::class, 'reply']);
        Route::get('fitnessos/billing', [BillingController::class, 'show']);
        Route::post('fitnessos/billing/payments', [BillingController::class, 'store'])->middleware('throttle:10,1');
        Route::post('fitnessos/billing/payments/{payment}/cancel', [BillingController::class, 'cancel']);
        Route::get('fitnessos/telegram', [TelegramController::class, 'show']);
        Route::post('fitnessos/telegram/link', [TelegramController::class, 'link'])->middleware('throttle:10,1');
        Route::put('fitnessos/telegram', [TelegramController::class, 'update']);
        Route::delete('fitnessos/telegram', [TelegramController::class, 'destroy']);
        Route::get('fitnessos/ai/status', [AiDraftController::class, 'status']);
        Route::get('fitnessos/ai/drafts', [AiDraftController::class, 'index']);
        Route::post('fitnessos/ai/drafts', [AiDraftController::class, 'store'])->middleware('throttle:20,1');
        Route::post('fitnessos/ai/drafts/{draft}/approve', [AiDraftController::class, 'approve']);
        Route::post('fitnessos/ai/drafts/{draft}/discard', [AiDraftController::class, 'discard']);
        Route::get('fitnessos/exercises', [ExerciseController::class, 'index']);
        Route::post('fitnessos/exercises', [ExerciseController::class, 'store']);
        Route::get('fitnessos/plans', [WorkoutPlanController::class, 'index']);
        Route::post('fitnessos/plans', [WorkoutPlanController::class, 'store']);
        Route::get('fitnessos/plans/{plan}', [WorkoutPlanController::class, 'show']);
        Route::put('fitnessos/plans/{plan}', [WorkoutPlanController::class, 'update']);
        Route::delete('fitnessos/plans/{plan}', [WorkoutPlanController::class, 'destroy']);
        Route::post('fitnessos/plans/{plan}/activate', [WorkoutPlanController::class, 'activate']);
        Route::post('fitnessos/plans/{plan}/archive', [WorkoutPlanController::class, 'archive']);
        Route::get('fitnessos/trainees/{trainee}/training', [WorkoutPlanController::class, 'training']);
        Route::view('dashboard', 'fitnessos')->name('dashboard');
        Route::view('dashboard/{path}', 'fitnessos')->where('path', '.*');
    });

    Route::middleware('fitness.role:client')->group(function () {
        Route::get('fitnessos/trainee-profile', [TraineeProfileController::class, 'show']);
        Route::put('fitnessos/trainee-profile', [TraineeProfileController::class, 'update']);
        Route::get('fitnessos/my-coaching', [CoachingController::class, 'mine']);
        Route::post('fitnessos/coachings', [CoachingController::class, 'store'])->middleware('throttle:10,1');
        Route::post('fitnessos/coachings/{coaching}/withdraw', [CoachingController::class, 'withdraw']);
        Route::get('fitnessos/my-reviews', [CoachReviewController::class, 'mine']);
        Route::post('fitnessos/coachings/{coaching}/review', [CoachReviewController::class, 'store'])->middleware('throttle:10,1');
        Route::get('fitnessos/my-plan', [WorkoutLogController::class, 'myPlan']);
        Route::get('fitnessos/workout-logs', [WorkoutLogController::class, 'index']);
        Route::post('fitnessos/workout-logs', [WorkoutLogController::class, 'store'])->middleware('throttle:30,1');
        Route::delete('fitnessos/workout-logs/{log}', [WorkoutLogController::class, 'destroy']);
        Route::view('app', 'fitnessos')->name('client.app');
        Route::view('app/{path}', 'fitnessos')->where('path', '.*');
    });
});

require __DIR__.'/settings.php';
