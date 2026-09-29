<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * AI output a coach reviews before anything reaches a trainee. A draft
     * only has an effect (a sent message, a reviewed check-in, a draft plan)
     * once the coach approves it; result_id then points at what it created.
     */
    public function up(): void
    {
        Schema::create('ai_drafts', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('coach_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('trainee_id')->constrained('users')->cascadeOnDelete();
            $table->string('kind');
            $table->string('status');
            $table->unsignedBigInteger('source_id')->nullable();
            $table->text('instruction')->nullable();
            $table->text('content')->nullable();
            $table->json('plan')->nullable();
            $table->text('error')->nullable();
            $table->string('model')->nullable();
            $table->unsignedInteger('input_tokens')->nullable();
            $table->unsignedInteger('output_tokens')->nullable();
            $table->unsignedBigInteger('result_id')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('discarded_at')->nullable();
            $table->timestamps();

            $table->index(['coach_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_drafts');
    }
};
