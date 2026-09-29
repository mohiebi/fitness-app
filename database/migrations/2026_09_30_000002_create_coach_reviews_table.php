<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Reviews tied to a real coaching, one per coaching, so only people
     * who actually trained with a coach can review them.
     */
    public function up(): void
    {
        Schema::create('coach_reviews', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('coach_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('trainee_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('coaching_id')->unique()->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('rating');
            $table->text('comment')->nullable();
            $table->text('coach_reply')->nullable();
            $table->timestamp('replied_at')->nullable();
            $table->timestamp('hidden_at')->nullable();
            $table->timestamps();

            $table->index(['coach_id', 'hidden_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('coach_reviews');
    }
};
