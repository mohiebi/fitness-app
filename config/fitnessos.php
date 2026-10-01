<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Coach subscriptions
    |--------------------------------------------------------------------------
    |
    | Coaches pay FitnessOS for prepaid periods. Prices are in toman. A coach
    | without a running trial or paid period is hidden from the directory
    | and can't take new trainees; existing trainees are not affected.
    |
    */

    'trial_days' => (int) env('FITNESSOS_TRIAL_DAYS', 14),

    'period_days' => 30,

    'plans' => [
        'starter' => [
            'name' => 'Starter',
            'price' => (int) env('FITNESSOS_STARTER_PRICE', 490000),
            'max_trainees' => 10,
        ],
        'pro' => [
            'name' => 'Pro',
            'price' => (int) env('FITNESSOS_PRO_PRICE', 990000),
            'max_trainees' => null,
        ],
    ],

    // Trainees can review a coach after training together this long.
    'review_min_days' => 14,

    // Plan used during the free trial.
    'trial_plan' => 'pro',

    /*
    |--------------------------------------------------------------------------
    | Payments through the Telegram bot
    |--------------------------------------------------------------------------
    |
    | Coaches pay by card-to-card transfer and send the receipt to the bot;
    | an admin approves it from the admin chat. Leave the token empty to
    | turn the bot off (payments can still be confirmed from the CLI).
    |
    */

    'telegram' => [
        'bot_token' => env('TELEGRAM_BOT_TOKEN'),
        'bot_username' => env('TELEGRAM_BOT_USERNAME'),
        'webhook_secret' => env('TELEGRAM_WEBHOOK_SECRET'),
        'admin_chat_id' => env('TELEGRAM_ADMIN_CHAT_ID'),
        // The bot always speaks this language, whatever the website's is.
        'locale' => env('TELEGRAM_LOCALE', 'fa'),
        // The clock coaches mean when they pick the hour of their morning summary.
        'timezone' => env('TELEGRAM_TIMEZONE', 'Asia/Tehran'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Operations: alerts, health and backups
    |--------------------------------------------------------------------------
    |
    | Server errors and failed backups are sent to the admin Telegram chat.
    | The health check turns red when the scheduler stops or backups stop
    | succeeding, so an uptime monitor pointed at /health notices even when
    | the app itself is fine.
    |
    */

    'ops' => [
        'alerts' => (bool) env('ALERTS_ENABLED', true),
        // At most this many alerts an hour, so a failing page can't flood the chat.
        'alerts_per_hour' => 20,
        // The same error is only sent once in this many minutes.
        'alert_repeat_minutes' => 15,

        // Production must have a running scheduler and recent backups; other
        // environments only report them.
        'require_scheduler' => (bool) env('OPS_REQUIRE_SCHEDULER', env('APP_ENV') === 'production'),
        'require_backups' => (bool) env('OPS_REQUIRE_BACKUPS', env('APP_ENV') === 'production'),

        'backup' => [
            'path' => env('BACKUP_PATH', storage_path('app/backups')),
            'keep_days' => (int) env('BACKUP_KEEP_DAYS', 14),
            // Also copy each backup to this filesystem disk (config/filesystems.php), e.g. S3 or SFTP.
            'disk' => env('BACKUP_DISK'),
            'disk_path' => env('BACKUP_DISK_PATH', 'fitnessos-backups'),
        ],
    ],

    'payment_card' => [
        'number' => env('PAYMENT_CARD_NUMBER'),
        'holder' => env('PAYMENT_CARD_HOLDER'),
    ],

];
