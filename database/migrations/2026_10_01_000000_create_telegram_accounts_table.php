<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The Telegram chat a coach connected to the bot. A row exists from the
     * moment the coach asks for a link; chat_id stays empty until the bot
     * receives the one-time token.
     */
    public function up(): void
    {
        Schema::create('telegram_accounts', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('chat_id')->nullable()->unique();
            $table->string('username')->nullable();
            $table->string('link_token_hash', 64)->nullable()->index();
            $table->timestamp('link_expires_at')->nullable();
            $table->timestamp('linked_at')->nullable();
            // What the bot is waiting for next, e.g. the text of a reply.
            $table->json('state')->nullable();
            $table->json('preferences')->nullable();
            $table->date('last_digest_on')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('telegram_accounts');
    }
};
