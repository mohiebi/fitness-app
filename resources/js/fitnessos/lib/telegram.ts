export type TelegramGroup =
    | 'messages'
    | 'requests'
    | 'checkins'
    | 'billing'
    | 'reviews'
    | 'digest';

export type TelegramPreferences = Record<TelegramGroup, boolean> & {
    digest_hour: number;
};

export type TelegramStatus = {
    available: boolean;
    bot_username: string | null;
    linked: boolean;
    username: string | null;
    linked_at: string | null;
    preferences: TelegramPreferences;
};

/** What the bot can tell a coach about; the text is translated where shown. */
export const telegramGroups: {
    key: TelegramGroup;
    label: string;
    hint: string;
}[] = [
    {
        key: 'messages',
        label: 'Trainee messages',
        hint: 'Read and reply to your trainees from Telegram',
    },
    {
        key: 'requests',
        label: 'Coaching requests',
        hint: 'Accept or decline new trainees with one tap',
    },
    {
        key: 'checkins',
        label: 'Check-ins',
        hint: 'Review weekly check-ins as they arrive',
    },
    {
        key: 'billing',
        label: 'Subscription and payments',
        hint: 'Payment confirmations and renewal reminders',
    },
    {
        key: 'reviews',
        label: 'New reviews',
        hint: 'When a trainee reviews you',
    },
    {
        key: 'digest',
        label: 'Morning summary',
        hint: 'One message a day with what needs you',
    },
];

/** Hours a coach can pick for the morning summary. */
export const digestHours = [6, 7, 8, 9, 10, 12, 18, 20];
