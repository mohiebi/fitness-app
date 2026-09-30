<?php

namespace App\Services\Telegram;

use Closure;
use DefStudio\Telegraph\Client\TelegraphResponse;
use DefStudio\Telegraph\Enums\ChatActions;
use DefStudio\Telegraph\Exceptions\TelegramWebhookException;
use DefStudio\Telegraph\Facades\Telegraph as TelegraphFacade;
use DefStudio\Telegraph\Keyboard\Button;
use DefStudio\Telegraph\Keyboard\Keyboard;
use DefStudio\Telegraph\Keyboard\ReplyButton;
use DefStudio\Telegraph\Keyboard\ReplyKeyboard;
use DefStudio\Telegraph\Models\TelegraphBot;
use DefStudio\Telegraph\Telegraph;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Log;

/**
 * FitnessOS's Telegram messaging, on top of defstudio/telegraph. The rest
 * of the app speaks in plain arrays (inline keyboard rows of
 * ['text' => ..., 'callback_data' => ...] or ['url' => ...]); this is the
 * one place that turns them into Bot API calls. Every call is best effort:
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
        $message = $this->chat($chatId)->html($text)->withoutPreview();
        if ($keyboard) {
            $message = $message->keyboard($this->inline($keyboard));
        }

        return $this->messageId($this->deliver($message, fn () => $this->plain($message, $text)));
    }

    /**
     * A message that pins a keyboard of buttons under the chat box.
     *
     * @param  list<list<string>>  $rows  button labels
     */
    public function sendMenu(string $chatId, string $text, array $rows): ?int
    {
        $keyboard = ReplyKeyboard::make()->resize()->persistent();
        foreach ($rows as $row) {
            $keyboard = $keyboard->row(array_map(fn (string $label) => ReplyButton::make($label), $row));
        }

        $message = $this->chat($chatId)->html($text)->replyKeyboard($keyboard);

        return $this->messageId($this->deliver($message, fn () => $this->plain($message, $text)));
    }

    /**
     * Replace a message's text and buttons.
     *
     * @param  list<list<array<string, string>>>|null  $keyboard  inline keyboard rows
     */
    public function editMessage(string $chatId, int $messageId, string $text, ?array $keyboard = null): void
    {
        $message = $this->chat($chatId)->edit($messageId)->html($text)->withoutPreview()->keyboard($this->inline($keyboard ?? []));

        $this->deliver($message, fn () => $this->plain($message, $text));
    }

    /**
     * Forward a photo Telegram already has (by file id) with a caption.
     *
     * @param  list<list<array<string, string>>>|null  $keyboard  inline keyboard rows
     */
    public function sendPhoto(string $chatId, string $fileId, string $caption, ?array $keyboard = null): void
    {
        $this->sendFile('sendPhoto', 'photo', $chatId, $fileId, $caption, $keyboard);
    }

    /**
     * @param  list<list<array<string, string>>>|null  $keyboard  inline keyboard rows
     */
    public function sendDocument(string $chatId, string $fileId, string $caption, ?array $keyboard = null): void
    {
        $this->sendFile('sendDocument', 'document', $chatId, $fileId, $caption, $keyboard);
    }

    public function editCaption(string $chatId, int $messageId, string $caption): void
    {
        $this->deliver(
            $this->chat($chatId)->withEndpoint('editMessageCaption')
                ->withData('chat_id', $chatId)
                ->withData('message_id', $messageId)
                ->withData('caption', $caption)
                ->withData('parse_mode', Telegraph::PARSE_HTML),
        );
    }

    /**
     * Stop the loading spinner on a tapped button, optionally with a toast.
     */
    public function answerCallback(string $callbackId, ?string $text = null): void
    {
        $answer = $this->api()->withEndpoint(Telegraph::ENDPOINT_ANSWER_WEBHOOK)->withData('callback_query_id', $callbackId);
        if ($text !== null && $text !== '') {
            $answer = $answer->withData('text', $text);
        }

        $this->deliver($answer);
    }

    /**
     * Show "typing…" while a slow reply (like an AI draft) is prepared.
     */
    public function typing(string $chatId): void
    {
        $this->deliver($this->chat($chatId)->chatAction(ChatActions::TYPING));
    }

    /**
     * Point Telegram at this app. The webhook URL is the package's route,
     * on TELEGRAM_WEBHOOK_DOMAIN (or the app URL, which must be HTTPS).
     */
    public function registerWebhook(string $secret): bool
    {
        $this->ensureBot();

        try {
            $response = $this->deliver($this->api()->registerWebhook(secretToken: $secret));
        } catch (TelegramWebhookException $e) {
            Log::warning('Telegram webhook not registered', ['error' => $e->getMessage()]);

            return false;
        }

        return $response?->telegraphOk() ?? false;
    }

    /**
     * The slash-command list Telegram shows in its menu.
     *
     * @param  list<array{command: string, description: string}>  $commands
     */
    public function setCommands(array $commands): bool
    {
        $described = [];
        foreach ($commands as $command) {
            $described[$command['command']] = $command['description'];
        }

        return $this->deliver($this->api()->registerBotCommands($described))?->telegraphOk() ?? false;
    }

    /**
     * The bot's row in Telegraph's table. Sending never needs it, but the
     * webhook route looks the bot up by token.
     */
    public function ensureBot(): TelegraphBot
    {
        return TelegraphBot::query()->firstOrCreate(
            ['token' => $this->token()],
            ['name' => (string) (config('fitnessos.telegram.bot_username') ?: 'FitnessOS')],
        );
    }

    /**
     * @param  list<list<array<string, string>>>|null  $keyboard
     */
    private function sendFile(string $endpoint, string $field, string $chatId, string $fileId, string $caption, ?array $keyboard): void
    {
        $file = $this->chat($chatId)->withEndpoint($endpoint)
            ->withData('chat_id', $chatId)
            ->withData($field, $fileId)
            ->withData('caption', $caption)
            ->withData('parse_mode', Telegraph::PARSE_HTML);
        if ($keyboard) {
            $file = $file->keyboard($this->inline($keyboard));
        }

        $this->deliver($file);
    }

    /**
     * Turn the app's plain button rows into a Telegraph keyboard. Callback
     * data like "req:acc:4" is kept exactly as written.
     *
     * @param  list<list<array<string, string>>>  $rows
     */
    private function inline(array $rows): Keyboard
    {
        $keyboard = Keyboard::make();

        foreach ($rows as $row) {
            $buttons = [];
            foreach ($row as $definition) {
                $button = Button::make($definition['text']);

                if (isset($definition['url'])) {
                    $button = $button->url($definition['url']);
                } elseif (isset($definition['callback_data'])) {
                    [$key, $value] = explode(':', $definition['callback_data'], 2) + [1 => ''];
                    $button = $button->param($key, $value);
                }

                $buttons[] = $button;
            }

            $keyboard = $keyboard->row($buttons);
        }

        return $keyboard;
    }

    /**
     * Telegram rejects text with broken HTML. Rather than lose the message,
     * resend it as plain text (escaped, so it is valid HTML with no tags).
     */
    private function plain(Telegraph $message, string $html): Telegraph
    {
        return $message->withData('text', htmlspecialchars(html_entity_decode(strip_tags($html)), ENT_NOQUOTES));
    }

    /**
     * @param  (Closure(): Telegraph)|null  $plainFallback  used when Telegram can't parse the HTML
     */
    private function deliver(Telegraph $request, ?Closure $plainFallback = null): ?TelegraphResponse
    {
        if (! $this->enabled()) {
            return null;
        }

        try {
            $response = $request->send();
        } catch (ConnectionException $e) {
            Log::warning('Telegram API unreachable', ['error' => $e->getMessage()]);

            return null;
        }

        if ($response->telegraphError()) {
            $description = (string) $response->json('description');

            if ($plainFallback !== null && str_contains($description, "can't parse entities")) {
                return $this->deliver($plainFallback());
            }

            // Tapping the same button twice re-sends identical text; that is fine.
            if (! str_contains($description, 'message is not modified')) {
                Log::warning('Telegram API call failed', ['status' => $response->status(), 'body' => $description]);
            }
        }

        return $response;
    }

    private function messageId(?TelegraphResponse $response): ?int
    {
        $id = $response?->telegraphMessageId();

        return $id !== null && $id > 0 ? $id : null;
    }

    /** Calls to the bot itself (no chat). */
    private function api(): Telegraph
    {
        return TelegraphFacade::bot($this->token());
    }

    private function chat(string $chatId): Telegraph
    {
        return $this->api()->chat($chatId);
    }

    private function token(): string
    {
        return (string) config('fitnessos.telegram.bot_token');
    }
}
