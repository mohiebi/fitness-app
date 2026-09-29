<?php

namespace App\Services\Telegram;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * The Telegram Bot API methods FitnessOS uses. Every call is best effort:
 * an unreachable Telegram is logged and never breaks the caller.
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
     * @return int|null the id of the sent message
     */
    public function sendMessage(string $chatId, string $text, ?array $keyboard = null): ?int
    {
        $response = $this->withPlainFallback('sendMessage', array_filter([
            'chat_id' => $chatId,
            'text' => $text,
            'parse_mode' => 'HTML',
            'link_preview_options' => ['is_disabled' => true],
            'reply_markup' => $keyboard ? ['inline_keyboard' => $keyboard] : null,
        ]), 'text');

        $id = $response['result']['message_id'] ?? null;

        return is_int($id) ? $id : null;
    }

    /**
     * A message that pins a keyboard of buttons under the chat box.
     *
     * @param  list<list<string>>  $rows  button labels
     */
    public function sendMenu(string $chatId, string $text, array $rows): ?int
    {
        $response = $this->withPlainFallback('sendMessage', [
            'chat_id' => $chatId,
            'text' => $text,
            'parse_mode' => 'HTML',
            'reply_markup' => [
                'keyboard' => array_map(fn (array $row) => array_map(fn (string $label) => ['text' => $label], $row), $rows),
                'resize_keyboard' => true,
                'is_persistent' => true,
            ],
        ], 'text');

        $id = $response['result']['message_id'] ?? null;

        return is_int($id) ? $id : null;
    }

    /**
     * Replace a message's text and buttons.
     *
     * @param  list<list<array<string, string>>>|null  $keyboard  inline keyboard rows
     */
    public function editMessage(string $chatId, int $messageId, string $text, ?array $keyboard = null): void
    {
        $this->withPlainFallback('editMessageText', array_filter([
            'chat_id' => $chatId,
            'message_id' => $messageId,
            'text' => $text,
            'parse_mode' => 'HTML',
            'link_preview_options' => ['is_disabled' => true],
            'reply_markup' => ['inline_keyboard' => $keyboard ?? []],
        ], fn ($value) => $value !== null), 'text');
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

    /**
     * Stop the loading spinner on a tapped button, optionally with a toast.
     */
    public function answerCallback(string $callbackId, ?string $text = null): void
    {
        $this->call('answerCallbackQuery', array_filter([
            'callback_query_id' => $callbackId,
            'text' => $text,
        ]));
    }

    /**
     * Show "typing…" while a slow reply (like an AI draft) is prepared.
     */
    public function typing(string $chatId): void
    {
        $this->call('sendChatAction', ['chat_id' => $chatId, 'action' => 'typing']);
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
     * The slash-command list Telegram shows in its menu.
     *
     * @param  list<array{command: string, description: string}>  $commands
     */
    public function setCommands(array $commands): bool
    {
        return (bool) ($this->call('setMyCommands', ['commands' => $commands])['ok'] ?? false);
    }

    /**
     * Telegram rejects text with broken HTML. Rather than lose the message,
     * resend it as plain text.
     *
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function withPlainFallback(string $method, array $payload, string $textKey): array
    {
        $response = $this->call($method, $payload);

        $description = (string) ($response['description'] ?? '');
        if (($response['ok'] ?? true) === false && str_contains($description, "can't parse entities")) {
            $payload['parse_mode'] = null;
            $payload[$textKey] = html_entity_decode(strip_tags((string) $payload[$textKey]));

            return $this->call($method, array_filter($payload, fn ($value) => $value !== null));
        }

        return $response;
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

        $body = (array) $response->json();

        if ($response->failed()) {
            $description = (string) ($body['description'] ?? '');

            // Tapping the same button twice re-sends identical text; that is fine.
            if (! str_contains($description, 'message is not modified') && ! str_contains($description, "can't parse entities")) {
                Log::warning('Telegram API call failed', ['method' => $method, 'status' => $response->status(), 'body' => $description]);
            }
        }

        return $body;
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
