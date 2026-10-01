<?php

namespace App\Notifications;

use App\Models\User;
use App\Notifications\Channels\TelegramChannel;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * One notification: in the app, by email for the important events, and in
 * Telegram for a coach who connected the bot. The text is written by
 * Notifier in the app language when the notice is sent.
 */
class AppNotice extends Notification
{
    public function __construct(
        public string $kind,
        public string $title,
        public string $body,
        public string $url,
        public bool $mail = false,
        /** @var array<string, mixed> stored with the notice, e.g. who sent a message */
        public array $extra = [],
        /** What a Telegram message shows instead of the body, e.g. the words a trainee wrote. Never stored. */
        public ?string $detail = null,
        /** False for a notice that only goes to Telegram (a follow-up in a chat that already has an unread notice). */
        public bool $store = true,
    ) {}

    /** @return list<string> */
    public function via(object $notifiable): array
    {
        $channels = [];

        if ($this->store) {
            $channels[] = 'database';
            if ($this->mail && ! empty($notifiable->email)) {
                $channels[] = 'mail';
            }
        }

        $telegram = $notifiable instanceof User ? $notifiable->telegramAccount : null;
        if ($telegram !== null && $telegram->isLinked() && $telegram->wantsKind($this->kind)) {
            $channels[] = TelegramChannel::class;
        }

        return $channels;
    }

    public function toMail(object $notifiable): MailMessage
    {
        // Names and messages written by other people end up in this text, and
        // the mail template reads it as markdown: escape it so nobody can
        // slip a link or formatting into an email.
        return (new MailMessage)
            ->subject($this->title)
            ->greeting($this->plain($this->title))
            ->line($this->plain($this->body))
            ->action(__('Open FitnessOS'), url($this->url));
    }

    private function plain(string $text): string
    {
        return (string) preg_replace('/([\\\\`*_{}\[\]()#+\-.!|<>~])/', '\\\\$1', $text);
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        return [
            ...$this->extra,
            'kind' => $this->kind,
            'title' => $this->title,
            'body' => $this->body,
            'url' => $this->url,
        ];
    }
}
