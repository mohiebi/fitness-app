<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * One row per coach. The subscription runs until paid_until, or until
     * trial_ends_at while the coach has never paid.
     */
    public function up(): void
    {
        Schema::create('coach_subscriptions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('coach_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->string('plan');
            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamp('paid_until')->nullable();
            $table->timestamp('reminded_at')->nullable();
            $table->timestamps();
        });

        // Existing coaches start a fresh trial.
        $now = now();
        $trialEnds = $now->copy()->addDays((int) config('fitnessos.trial_days'));
        DB::table('users')->whereIn('role', ['coach', 'admin'])->orderBy('id')->each(function (object $coach) use ($now, $trialEnds): void {
            DB::table('coach_subscriptions')->insert([
                'coach_id' => $coach->id,
                'plan' => config('fitnessos.trial_plan'),
                'trial_ends_at' => $trialEnds,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('coach_subscriptions');
    }
};
