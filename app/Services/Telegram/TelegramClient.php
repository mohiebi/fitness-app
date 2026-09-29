<?php

namespace App\Services\Telegram;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * The few Telegram Bot API methods the payment bot needs.
 */
class TelegramClient
{
    public function enabled(): bool
    {
        $token = config('fitnessos.telegram.bot_token');

        return is_string($token) && $token !== '';
    }

    /**
     * @param  list<list<array<string, string>>>|null  $keyboard  inline keyboard rows
     */
    public function sendMessage(string $chatId, string $text, ?array $keyboard = null): void
    {
        $this->call('sendMessage', array_filter([
            'chat_id' => $chatId,
            'text' => $text,
            'parse_mode' => 'HTML',
            'reply_markup' => $keyboard ? ['inline_keyboard' => $keyboard] : null,
        ]));
    }

    /**
     * @param  list<list<array<string, string>>>|null  $keyboard  inline keyboard rows
     */
    public function sendPhoto(string $chatId, string $fileId, string $caption, ?array $keyboard = null): void
    {
        $this->call('sendPhoto', array_filter([
            'chat_id' => $chatId,
            'photo' => $fileId,
            'caption' => $caption,
            'parse_mode' => 'HTML',
            'reply_markup' => $keyboard ? ['inline_keyboard' => $keyboard] : null,
        ]));
    }

    /**
     * @param  list<list<array<string, string>>>|null  $keyboard  inline keyboard rows
     */
    public function sendDocument(string $chatId, string $fileId, string $caption, ?array $keyboard = null): void
    {
        $this->call('sendDocument', array_filter([
            'chat_id' => $chatId,
            'document' => $fileId,
            'caption' => $caption,
            'parse_mode' => 'HTML',
            'reply_markup' => $keyboard ? ['inline_keyboard' => $keyboard] : null,
        ]));
    }

    public function editCaption(string $chatId, int $messageId, string $caption): void
    {
        $this->call('editMessageCaption', [
            'chat_id' => $chatId,
            'message_id' => $messageId,
            'caption' => $caption,
            'parse_mode' => 'HTML',
        ]);
    }

    public function answerCallback(string $callbackId, string $text): void
    {
        $this->call('answerCallbackQuery', ['callback_query_id' => $callbackId, 'text' => $text]);
    }

    public function setWebhook(string $url, string $secret): bool
    {
        return (bool) ($this->call('setWebhook', [
            'url' => $url,
            'secret_token' => $secret,
            'allowed_updates' => ['message', 'callback_query'],
        ])['ok'] ?? false);
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function call(string $method, array $payload): array
    {
        if (! $this->enabled()) {
            return [];
        }

        try {
            $response = $this->http()->post($method, $payload);
        } catch (ConnectionException $e) {
            Log::warning('Telegram API unreachable', ['method' => $method, 'error' => $e->getMessage()]);

            return [];
        }

        if ($response->failed()) {
            Log::warning('Telegram API call failed', ['method' => $method, 'status' => $response->status(), 'body' => $response->json('description')]);
        }

        return (array) $response->json();
    }

    private function http(): PendingRequest
    {
        $base = rtrim((string) config('fitnessos.telegram.api_base_url'), '/');

        return Http::baseUrl($base.'/bot'.config('fitnessos.telegram.bot_token').'/')
            ->acceptJson()
            ->asJson()
            ->timeout(10);
    }
}
