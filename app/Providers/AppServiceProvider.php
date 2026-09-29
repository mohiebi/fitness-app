<?php

namespace App\Providers;

use Anthropic\Client;
use App\Services\Ai\ClaudeDraftModel;
use App\Services\Ai\DisabledDraftModel;
use App\Services\Ai\DraftModel;
use Carbon\CarbonImmutable;
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
        // The coach AI assistant is off unless an API key is configured.
        $this->app->bind(DraftModel::class, function (): DraftModel {
            $key = config('services.anthropic.api_key');
            if (! is_string($key) || $key === '') {
                return new DisabledDraftModel;
            }

            $baseUrl = config('services.anthropic.base_url');

            return new ClaudeDraftModel(
                new Client(apiKey: $key, baseUrl: is_string($baseUrl) && $baseUrl !== '' ? $baseUrl : null),
                (string) config('services.anthropic.model'),
            );
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
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
