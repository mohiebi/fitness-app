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
        'api_base_url' => env('TELEGRAM_API_BASE_URL', 'https://api.telegram.org'),
        // The clock coaches mean when they pick the hour of their morning summary.
        'timezone' => env('TELEGRAM_TIMEZONE', 'Asia/Tehran'),
    ],

    'payment_card' => [
        'number' => env('PAYMENT_CARD_NUMBER'),
        'holder' => env('PAYMENT_CARD_HOLDER'),
    ],

];
