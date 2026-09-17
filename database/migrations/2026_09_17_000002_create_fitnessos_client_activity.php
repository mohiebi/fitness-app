<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fitnessos_checkins', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('client_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('coach_id')->constrained('users')->cascadeOnDelete();
            $table->decimal('weight_kg', 6, 2)->nullable();
            $table->decimal('waist_cm', 6, 2)->nullable();
            $table->decimal('sleep_hours', 4, 1)->nullable();
            $table->unsignedInteger('steps')->nullable();
            $table->unsignedTinyInteger('energy')->nullable();
            $table->unsignedTinyInteger('hunger')->nullable();
            $table->text('reflection')->nullable();
            $table->text('adjustments')->nullable();
            $table->string('status')->default('Pending');
            $table->timestamps();
        });

        Schema::create('fitnessos_messages', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('coach_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('client_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('sender_id')->constrained('users')->cascadeOnDelete();
            $table->text('body');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fitnessos_messages');
        Schema::dropIfExists('fitnessos_checkins');
    }
};
