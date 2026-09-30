<?php

namespace App\Telegram;

use App\Services\Telegram\TelegramBot;
use DefStudio\Telegraph\Handlers\WebhookHandler;
use DefStudio\Telegraph\Models\TelegraphBot;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Telegraph's webhook entry point for the FitnessOS bot. Telegraph
 * resolves the bot from the URL and hands the update here; the update is
 * passed on whole to TelegramBot, which knows the coach bot's screens.
 *
 * The bot always speaks Persian, whatever language the website is set to.
 */
class CoachWebhookHandler extends WebhookHandler
{
    public function __construct(private TelegramBot $router)
    {
        parent::__construct();
    }

    public function handle(Request $request, TelegraphBot $bot): void
    {
        App::setLocale((string) config('fitnessos.telegram.locale'));

        try {
            $this->router->handle($request->all());
        } catch (Throwable $e) {
            // Answer 200 anyway so Telegram doesn't keep retrying the update.
            Log::error('Telegram update failed', ['error' => $e->getMessage(), 'update_id' => $request->input('update_id')]);
        }
    }
}
