<?php

use Database\Seeders\ExerciseLibrarySeeder;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // coach_id null = the shared library; otherwise a coach's custom exercise.
        Schema::create('exercises', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('coach_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->string('name');
            $table->string('name_en')->nullable();
            $table->string('muscle_group')->index();
            $table->string('equipment');
            $table->string('video_url')->nullable();
            $table->text('instructions')->nullable();
            $table->timestamps();
        });

        // trainee_id null = a reusable template.
        Schema::create('workout_plans', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('coach_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('trainee_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->text('notes')->nullable();
            $table->string('status')->default('draft');
            $table->timestamp('activated_at')->nullable();
            $table->timestamp('archived_at')->nullable();
            $table->timestamps();

            $table->index(['trainee_id', 'status']);
        });

        Schema::create('plan_days', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('workout_plan_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('position');
            $table->string('title');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('plan_exercises', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('plan_day_id')->constrained()->cascadeOnDelete();
            $table->foreignId('exercise_id')->constrained()->restrictOnDelete();
            $table->unsignedSmallInteger('position');
            $table->unsignedTinyInteger('sets');
            $table->string('reps', 20);
            $table->unsignedSmallInteger('rest_seconds')->nullable();
            $table->decimal('target_weight_kg', 6, 2)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // Logs keep a copy of names so history survives plan edits.
        Schema::create('workout_logs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('trainee_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('workout_plan_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('plan_day_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->date('performed_on');
            $table->unsignedSmallInteger('duration_minutes')->nullable();
            $table->unsignedTinyInteger('effort')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['trainee_id', 'performed_on']);
        });

        Schema::create('workout_log_sets', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('workout_log_id')->constrained()->cascadeOnDelete();
            $table->foreignId('exercise_id')->nullable()->constrained()->nullOnDelete();
            $table->string('exercise_name');
            $table->unsignedTinyInteger('set_number');
            $table->unsignedSmallInteger('reps')->nullable();
            $table->decimal('weight_kg', 6, 2)->nullable();
            $table->boolean('completed')->default(true);
            $table->timestamps();
        });

        (new ExerciseLibrarySeeder)->run();
    }

    public function down(): void
    {
        Schema::dropIfExists('workout_log_sets');
        Schema::dropIfExists('workout_logs');
        Schema::dropIfExists('plan_exercises');
        Schema::dropIfExists('plan_days');
        Schema::dropIfExists('workout_plans');
        Schema::dropIfExists('exercises');
    }
};
