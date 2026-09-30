<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    // Coach AI assistant. Without an API key for the chosen provider the
    // assistant is switched off and the app works as before.
    'ai' => [
        // "openai" (any OpenAI-compatible endpoint) or "anthropic".
        'provider' => env('AI_PROVIDER', 'openai'),
        'daily_drafts_per_coach' => (int) env('AI_DAILY_DRAFTS_PER_COACH', 60),
    ],

    'openai' => [
        'api_key' => env('OPENAI_API_KEY'),
        // Any endpoint that speaks the Chat Completions API. AI_BASE_URL
        // wins so one setting works whichever provider is chosen.
        'base_url' => env('AI_BASE_URL', env('OPENAI_BASE_URL', 'https://api.openai.com/v1')),
        'model' => env('AI_MODEL', env('OPENAI_MODEL', 'gpt-4o')),
        // "json_schema" (structured outputs) or "json_object" for gateways
        // that only support plain JSON mode.
        'response_format' => env('OPENAI_RESPONSE_FORMAT', 'json_schema'),
    ],

    'anthropic' => [
        'api_key' => env('ANTHROPIC_API_KEY'),
        // Set AI_BASE_URL to route through a gateway or proxy.
        'base_url' => env('AI_BASE_URL', env('ANTHROPIC_BASE_URL')),
        'model' => env('AI_MODEL', 'claude-opus-5'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

];
