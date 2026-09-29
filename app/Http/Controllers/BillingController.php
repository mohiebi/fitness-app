<?php

namespace App\Http\Controllers;

use App\Models\SubscriptionPayment;
use App\Services\CoachSubscriptions;
use App\Services\Payments\SubscriptionPayments;
use App\Services\Telegram\TelegramClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Coach billing: current subscription, plans, and paying through the
 * Telegram bot.
 */
class BillingController extends Controller
{
    public function __construct(
        private CoachSubscriptions $subscriptions,
        private SubscriptionPayments $payments,
        private TelegramClient $telegram,
    ) {}

    public function show(Request $request): JsonResponse
    {
        $coach = $request->user();
        $payments = SubscriptionPayment::query()->where('coach_id', $coach->id)->latest('id')->limit(20)->get();
        $open = $payments->first(fn (SubscriptionPayment $payment) => $payment->isOpen() && $payment->method === SubscriptionPayment::TELEGRAM);

        return response()->json([
            'subscription' => $this->subscriptions->for($coach)->toSummaryArray(),
            'active_trainees' => $coach->coachProfile?->activeClientCount() ?? 0,
            'plans' => collect($this->subscriptions->plans())
                ->map(fn (array $plan, string $key) => ['key' => $key, ...$plan])
                ->values(),
            'period_days' => (int) config('fitnessos.period_days'),
            'telegram_enabled' => $this->telegramReady(),
            'open_payment' => $open ? [...$open->toSummaryArray(), 'telegram_url' => $this->payments->telegramLink($open)] : null,
            'payments' => $payments->map(fn (SubscriptionPayment $payment) => $payment->toSummaryArray()),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'plan' => ['required', Rule::in(array_keys($this->subscriptions->plans()))],
        ]);

        abort_unless($this->telegramReady(), 503, __('Online payment is not available yet. Please contact support to renew.'));

        $payment = $this->payments->start($request->user(), $data['plan']);

        return response()->json([...$payment->toSummaryArray(), 'telegram_url' => $this->payments->telegramLink($payment)], 201);
    }

    public function cancel(Request $request, SubscriptionPayment $payment): JsonResponse
    {
        abort_unless($payment->coach_id === $request->user()->id, 404);
        $this->payments->cancel($payment);

        return response()->json(['message' => __('Payment canceled.')]);
    }

    private function telegramReady(): bool
    {
        return $this->telegram->enabled()
            && (string) config('fitnessos.telegram.bot_username') !== ''
            && (string) config('fitnessos.payment_card.number') !== '';
    }
}
