<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A coach's payment for a subscription period. Telegram payments go
     * pending -> submitted (receipt sent to the bot) -> paid or rejected.
     */
    public function up(): void
    {
        Schema::create('subscription_payments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('coach_id')->constrained('users')->cascadeOnDelete();
            $table->string('plan');
            $table->unsignedBigInteger('amount');
            $table->unsignedSmallInteger('period_days');
            $table->string('status')->index();
            $table->string('method');
            $table->string('reference')->unique();
            $table->string('telegram_chat_id')->nullable()->index();
            $table->string('receipt_file_id')->nullable();
            $table->string('reviewed_by')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscription_payments');
    }
};
