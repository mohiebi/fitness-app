<?php

namespace App\Services\Telegram\Screens;

use App\Models\SubscriptionPayment;
use App\Services\CoachSubscriptions;
use App\Services\Payments\SubscriptionPayments;
use App\Services\Telegram\BotChat;
use App\Services\Telegram\PaymentBot;
use App\Services\Telegram\Tg;
use App\Support\LocalFormat;
use App\Support\Trans;

/**
 * The coach's FitnessOS subscription: what they have, how long it lasts,
 * and renewing by card transfer. The receipt they send next goes to the
 * admin chat exactly as when they start from the dashboard.
 */
class BillingScreen extends Screen
{
    public function __construct(
        private CoachSubscriptions $subscriptions,
        private SubscriptionPayments $payments,
        private PaymentBot $paymentBot,
    ) {}

    public function show(BotChat $chat): void
    {
        $coach = $chat->coach();
        $subscription = $this->subscriptions->for($coach);
        $plans = $this->subscriptions->plans();
        $lines = ['💳 <b>'.__('Your subscription').'</b>', ''];

        $planName = Trans::text($plans[$subscription->plan]['name'] ?? $subscription->plan);
        $ends = $subscription->endsAt();

        if (! $subscription->isActive()) {
            $lines[] = __('Your subscription has ended. You are hidden from the coach directory and can not take new trainees; your current trainees are not affected.');
        } else {
            $lines[] = ($subscription->onTrial()
                ? __('🎁 Free trial (:plan plan) until :date', ['plan' => $planName, 'date' => LocalFormat::date($ends)])
                : __('✅ :plan plan until :date', ['plan' => $planName, 'date' => LocalFormat::date($ends)]));
        }

        $limit = $subscription->maxTrainees();
        $lines[] = __('👥 Trainees: :count of :limit', [
            'count' => LocalFormat::number($coach->coachProfile?->activeClientCount() ?? 0),
            'limit' => $limit === null ? __('unlimited') : LocalFormat::number($limit),
        ]);

        $open = SubscriptionPayment::query()
            ->where('coach_id', $coach->id)
            ->whereIn('status', [SubscriptionPayment::PENDING, SubscriptionPayment::SUBMITTED])
            ->latest('id')
            ->first();

        $rows = [];
        if ($open !== null) {
            $lines[] = '';
            $lines[] = $open->status === SubscriptionPayment::SUBMITTED
                ? __('⏳ Your receipt (:reference) is being checked. We will confirm here.', ['reference' => '<code>'.$open->reference.'</code>'])
                : __('⏳ Waiting for your receipt (:reference). Send a photo of it here.', ['reference' => '<code>'.$open->reference.'</code>']);

            if ($open->status === SubscriptionPayment::PENDING) {
                $rows[] = Tg::row([
                    Tg::button(__('💳 Show card details'), 'bill:pay:'.$open->plan),
                    Tg::button(__('✖️ Cancel payment'), 'bill:cancel:'.$open->id),
                ]);
            }
        } elseif ($this->canPay()) {
            $lines[] = '';
            $lines[] = __('Renew for :days days (paid in advance, no automatic renewal):', ['days' => LocalFormat::number((int) config('fitnessos.period_days'))]);
            foreach ($plans as $key => $plan) {
                $rows[] = Tg::row([Tg::button(
                    __(':plan — :price toman', ['plan' => Trans::text($plan['name']), 'price' => LocalFormat::number($plan['price'])]),
                    'bill:pay:'.$key,
                )]);
            }
        } else {
            $lines[] = '';
            $lines[] = __('Online payment is not available yet. Please contact support to renew.');
        }

        $rows[] = Tg::row([Tg::dashboard(__('🌐 Open billing in dashboard'), '/dashboard/billing')]);

        $chat->show(implode("\n", $lines), Tg::keyboard($rows));
    }

    public function tap(BotChat $chat, string $action, array $args): void
    {
        match ($action) {
            'pay' => $this->pay($chat, (string) ($args[0] ?? '')),
            'cancel' => $this->cancel($chat, (int) ($args[0] ?? 0)),
            default => $this->show($chat),
        };
    }

    private function pay(BotChat $chat, string $plan): void
    {
        if (! $this->canPay() || ! array_key_exists($plan, $this->subscriptions->plans())) {
            $chat->toast = __('Online payment is not available yet. Please contact support to renew.');

            return;
        }

        $payment = $this->payments->start($chat->coach(), $plan);
        $this->paymentBot->instructions($payment, $chat->id());
        $this->show($chat);
    }

    private function cancel(BotChat $chat, int $paymentId): void
    {
        $payment = SubscriptionPayment::query()->where('coach_id', $chat->coach()->id)->find($paymentId);

        if ($payment === null) {
            $chat->toast = __('That payment was not found.');

            return;
        }

        $this->payments->cancel($payment);
        $chat->toast = __('Payment canceled.');
        $this->show($chat);
    }

    private function canPay(): bool
    {
        return (string) config('fitnessos.payment_card.number') !== '';
    }
}
