<?php

namespace App\Services\Telegram;

use App\Models\TelegramAccount;
use App\Models\User;
use App\Services\Telegram\Screens\CheckinsScreen;
use App\Services\Telegram\Screens\DraftsScreen;
use App\Services\Telegram\Screens\InboxScreen;
use App\Services\Telegram\Screens\RequestsScreen;
use App\Services\Telegram\Screens\Screen;
use App\Services\Telegram\Screens\TodayScreen;
use App\Services\Telegram\Screens\TraineesScreen;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Throwable;

/**
 * The bot a coach talks to once their Telegram is connected: the same
 * work as the dashboard, from a phone.
 *
 * Menu buttons and slash commands open a screen; buttons on a message
 * carry "<screen>:<action>:<id>" and go back to that screen; plain text is
 * only accepted when a screen asked for it (a reply, feedback, an edit).
 * Every action is checked against the linked coach, so a made-up id can
 * never reach another coach's trainees.
 */
class CoachBot
{
    /** Menu command => the screen that opens for it. */
    private const COMMAND_SCREENS = [
        'today' => 'day',
        'requests' => 'req',
        'messages' => 'inb',
        'trainees' => 'trn',
        'checkins' => 'chk',
        'drafts' => 'ai',
    ];

    public function __construct(
        private TelegramClient $telegram,
        private TelegramLinks $links,
        private TodayScreen $today,
        private RequestsScreen $requests,
        private TraineesScreen $trainees,
        private InboxScreen $inbox,
        private CheckinsScreen $checkins,
        private DraftsScreen $drafts,
    ) {}

    /**
     * /start link_<token>: finish connecting a chat to a coach account.
     */
    public function link(string $chatId, string $token, ?string $username): void
    {
        $coach = $this->links->complete($token, $chatId, $username);

        if ($coach === null) {
            $this->telegram->sendMessage($chatId, __('This connection link has expired. Open your FitnessOS dashboard and tap Connect Telegram again.'));

            return;
        }

        $this->welcome($chatId, $coach);
    }

    public function welcome(string $chatId, User $coach): void
    {
        $this->telegram->sendMenu($chatId, implode("\n", [
            __('Hi :name, your Telegram is connected to FitnessOS. 🎉', ['name' => '<b>'.Tg::esc($coach->name).'</b>']),
            __('Use the menu below to answer requests, messages and check-ins. Type /help to see everything I can do.'),
        ]), Menu::rows());
    }

    /**
     * Anyone who has not connected a coach account gets pointed at the dashboard.
     */
    public function introduce(string $chatId): void
    {
        $this->telegram->sendMessage($chatId, implode("\n", [
            __('This is the FitnessOS coach bot.'),
            __('To connect it, open Settings → Integrations in your coach dashboard and tap Connect Telegram.'),
            __('To pay for FitnessOS, open Billing in your coach dashboard and tap Pay with Telegram. Then send the transfer receipt here.'),
        ]));
    }

    /**
     * A message from a chat that is linked to a coach.
     *
     * @param  array<string, mixed>  $message
     */
    public function message(TelegramAccount $account, array $message): void
    {
        $chat = new BotChat($this->telegram, $account);
        $text = trim((string) ($message['text'] ?? ''));

        try {
            $this->route($chat, $text);
        } catch (Throwable $e) {
            $this->fail($chat, $e);
        }
    }

    /**
     * A button was tapped.
     *
     * @param  array<string, mixed>  $callback
     */
    public function callback(array $callback): void
    {
        $callbackId = (string) ($callback['id'] ?? '');
        $chatId = (string) ($callback['message']['chat']['id'] ?? '');
        $account = $chatId === '' ? null : $this->links->coachForChat($chatId);

        if ($account === null) {
            $this->telegram->answerCallback($callbackId, __('Connect your coach account first.'));

            return;
        }

        $messageId = isset($callback['message']['message_id']) ? (int) $callback['message']['message_id'] : null;
        $chat = new BotChat($this->telegram, $account, $messageId);

        try {
            $chat->forget();
            [$screen, $action, $args] = $this->parse((string) ($callback['data'] ?? ''));
            $this->screen($screen)?->tap($chat, $action, $args);
        } catch (Throwable $e) {
            $this->fail($chat, $e);
        }

        $this->telegram->answerCallback($callbackId, $chat->toast);
    }

    private function route(BotChat $chat, string $text): void
    {
        $command = Menu::screenFor($text);
        if ($command !== null) {
            $chat->forget();
            $this->screen(self::COMMAND_SCREENS[$command] ?? '')?->show($chat);

            return;
        }

        switch (strtolower(explode('@', $text)[0])) {
            case '/start':
            case '/menu':
                $chat->forget();
                $this->welcome($chat->id(), $chat->coach());

                return;
            case '/help':
                $chat->send($this->help());

                return;
            case '/cancel':
                $chat->forget();
                $chat->send(__('Canceled.'));

                return;
            case '/unlink':
                $this->links->unlink($chat->coach());
                $this->telegram->sendMessage($chat->id(), __('Telegram is disconnected from your FitnessOS account.'));

                return;
        }

        // A screen that needs typed text stored "<screen>.<what>" and the record id.
        $expected = $chat->account->expected();
        if ($expected !== null && $text !== '' && ! str_starts_with($text, '/')) {
            [$screen, $type] = explode('.', $expected['type'].'.', 2);
            $this->screen($screen)?->typed($chat, rtrim($type, '.'), $expected['id'], $text);

            return;
        }

        $chat->send(__('Use the menu below, or type /help.'));
    }

    /**
     * @return array{0: string, 1: string, 2: list<string>}
     */
    private function parse(string $data): array
    {
        $parts = explode(':', $data);

        return [array_shift($parts), (string) array_shift($parts), $parts];
    }

    private function screen(string $key): ?Screen
    {
        return match ($key) {
            'day' => $this->today,
            'req' => $this->requests,
            'trn' => $this->trainees,
            'inb' => $this->inbox,
            'chk' => $this->checkins,
            'ai' => $this->drafts,
            default => null,
        };
    }

    private function help(): string
    {
        return implode("\n", [
            __('<b>What I can do</b>'),
            __('📊 /today — what needs you right now'),
            __('📥 /requests — accept or decline new trainees'),
            __('💬 /messages — trainees waiting for your reply'),
            __('✅ /checkins — check-ins to review'),
            __('🤖 /drafts — AI drafts waiting for your approval'),
            __('👥 /trainees — your trainees and their plans'),
            __('/menu — show the menu'),
            __('/cancel — cancel what I was doing'),
            __('/unlink — disconnect Telegram'),
        ]);
    }

    /**
     * Tell the coach what went wrong, in words, and keep the details in the log.
     */
    private function fail(BotChat $chat, Throwable $e): void
    {
        if ($e instanceof ValidationException) {
            $message = collect($e->errors())->flatten()->first();
        } elseif ($e instanceof ModelNotFoundException || ($e instanceof HttpException && $e->getStatusCode() === 404)) {
            $message = __('That was not found. It may have changed.');
        } else {
            Log::error('Telegram coach bot failed', ['coach' => $chat->coach()->id, 'error' => $e->getMessage()]);
            $message = __('Something went wrong. Please try again.');
        }

        $chat->toast = is_string($message) ? $message : __('Something went wrong. Please try again.');

        // A tap gets a pop-up; typed text has no button to attach one to.
        if ($chat->messageId === null) {
            $chat->send(Tg::esc($chat->toast));
        }
    }
}
