<?php

namespace App\Providers;

use Anthropic\Client;
use App\Services\Ai\ClaudeDraftModel;
use App\Services\Ai\DisabledDraftModel;
use App\Services\Ai\DraftModel;
use App\Services\Ai\OpenAiDraftModel;
use Carbon\CarbonImmutable;
use Illuminate\Http\Middleware\TrustProxies;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // The coach AI assistant is off unless the chosen provider has an API key.
        $this->app->bind(DraftModel::class, function (): DraftModel {
            if (config('services.ai.provider') === 'anthropic') {
                $key = config('services.anthropic.api_key');
                if (! is_string($key) || $key === '') {
                    return new DisabledDraftModel;
                }

                $baseUrl = config('services.anthropic.base_url');

                return new ClaudeDraftModel(
                    new Client(apiKey: $key, baseUrl: is_string($baseUrl) && $baseUrl !== '' ? $baseUrl : null),
                    (string) config('services.anthropic.model'),
                );
            }

            $key = config('services.openai.api_key');
            if (! is_string($key) || $key === '') {
                return new DisabledDraftModel;
            }

            return new OpenAiDraftModel(
                (string) config('services.openai.base_url'),
                $key,
                (string) config('services.openai.model'),
                config('services.openai.response_format') === OpenAiDraftModel::OBJECT_MODE ? OpenAiDraftModel::OBJECT_MODE : OpenAiDraftModel::SCHEMA_MODE,
            );
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->trustProxies();
    }

    /**
     * Trust the load balancer in front of the app, when one is configured.
     */
    protected function trustProxies(): void
    {
        $proxies = config('security.trusted_proxies');

        if (is_string($proxies) && $proxies !== '') {
            TrustProxies::at($proxies === '*' ? '*' : array_map('trim', explode(',', $proxies)));
        }
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
