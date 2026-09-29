<?php

namespace App\Services\Telegram;

use App\Models\TelegramAccount;
use App\Models\User;
use Illuminate\Support\Str;

/**
 * Connects a coach's Telegram chat to their account. The coach asks for a
 * link in the dashboard; opening it sends the bot a one-time token, which
 * proves the person in the chat is the logged-in coach.
 */
class TelegramLinks
{
    private const TOKEN_MINUTES = 15;

    public function __construct(private TelegramClient $telegram) {}

    /**
     * The bot can only be used once it has a token and a public username.
     */
    public function available(): bool
    {
        return $this->telegram->enabled() && (string) config('fitnessos.telegram.bot_username') !== '';
    }

    public function accountFor(User $coach): TelegramAccount
    {
        return TelegramAccount::query()->firstOrCreate(['user_id' => $coach->id]);
    }

    /**
     * A fresh one-time link. Asking again invalidates the previous one.
     *
     * @return array{url: string, expires_at: string}
     */
    public function startLink(User $coach): array
    {
        $token = Str::random(32);
        $expires = now()->addMinutes(self::TOKEN_MINUTES);

        $this->accountFor($coach)->forceFill([
            'link_token_hash' => hash('sha256', $token),
            'link_expires_at' => $expires,
        ])->save();

        return [
            'url' => 'https://t.me/'.ltrim((string) config('fitnessos.telegram.bot_username'), '@').'?start=link_'.$token,
            'expires_at' => $expires->toIso8601String(),
        ];
    }

    /**
     * Finish linking when the bot receives the token. The token works once.
     */
    public function complete(string $token, string $chatId, ?string $username): ?User
    {
        $account = TelegramAccount::query()
            ->where('link_token_hash', hash('sha256', $token))
            ->where('link_expires_at', '>', now())
            ->with('user')
            ->first();

        if ($account === null || ! $account->user->isCoach()) {
            return null;
        }

        // The chat now belongs to this coach, not to whoever linked it before.
        TelegramAccount::query()->where('chat_id', $chatId)->whereKeyNot($account->id)->update([
            'chat_id' => null,
            'username' => null,
            'linked_at' => null,
            'state' => null,
        ]);

        $account->forceFill([
            'chat_id' => $chatId,
            'username' => $username,
            'linked_at' => now(),
            'link_token_hash' => null,
            'link_expires_at' => null,
            'state' => null,
        ])->save();

        return $account->user;
    }

    public function unlink(User $coach): void
    {
        TelegramAccount::query()->where('user_id', $coach->id)->update([
            'chat_id' => null,
            'username' => null,
            'linked_at' => null,
            'link_token_hash' => null,
            'link_expires_at' => null,
            'state' => null,
        ]);
    }

    /**
     * @param  array<string, mixed>  $changes  group => bool, and digest_hour
     */
    public function updatePreferences(User $coach, array $changes): TelegramAccount
    {
        $account = $this->accountFor($coach);
        $preferences = $account->preferences ?? [];

        foreach (TelegramAccount::GROUPS as $group) {
            if (array_key_exists($group, $changes)) {
                $preferences[$group] = (bool) $changes[$group];
            }
        }
        if (isset($changes['digest_hour'])) {
            $preferences['digest_hour'] = max(0, min(23, (int) $changes['digest_hour']));
        }

        $account->forceFill(['preferences' => $preferences])->save();

        return $account;
    }

    /**
     * The linked, current coach behind a chat, if any.
     */
    public function coachForChat(string $chatId): ?TelegramAccount
    {
        $account = TelegramAccount::query()->where('chat_id', $chatId)->with('user')->first();

        return $account !== null && $account->user->isCoach() ? $account : null;
    }
}
