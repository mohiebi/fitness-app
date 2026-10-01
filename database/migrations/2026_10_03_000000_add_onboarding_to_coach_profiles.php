<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Where a coach is in the first-run guide. Progress itself is worked out
     * from their data; this only remembers the welcome page is still to be
     * shown (set at registration) and whether they hid the checklist.
     */
    public function up(): void
    {
        Schema::table('coach_profiles', function (Blueprint $table): void {
            $table->boolean('onboarding_pending')->default(false);
            $table->timestamp('onboarding_dismissed_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('coach_profiles', function (Blueprint $table): void {
            $table->dropColumn(['onboarding_pending', 'onboarding_dismissed_at']);
        });
    }
};
