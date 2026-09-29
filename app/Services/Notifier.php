<?php

namespace App\Services;

use App\Models\Coaching;
use App\Models\CoachReview;
use App\Models\SubscriptionPayment;
use App\Models\User;
use App\Models\WorkoutPlan;
use App\Notifications\AppNotice;
use App\Services\Telegram\Tg;
use App\Support\LocalFormat;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Tells people what happened, in the app and by email for the important
 * events. A failed email never breaks the action that triggered it.
 */
class Notifier
{
    public function coachingRequested(Coaching $coaching): void
    {
        $this->send($coaching->coach, 'coaching_requested',
            __('New coaching request'),
            __(':name asked to train with you.', ['name' => $coaching->trainee->name]),
            '/dashboard/requests', mail: true,
            extra: ['coaching_id' => $coaching->id], detail: $coaching->request_message);
    }

    public function coachingAccepted(Coaching $coaching): void
    {
        $this->send($coaching->trainee, 'coaching_accepted',
            __(':name accepted your request', ['name' => $coaching->coach->name]),
            __('You can now chat with your coach and send weekly check-ins.'),
            '/app/coach', mail: true);
    }

    public function coachingDeclined(Coaching $coaching): void
    {
        $this->send($coaching->trainee, 'coaching_declined',
            __('Your request was not accepted'),
            __(':name can\'t take you on right now. Other coaches are waiting.', ['name' => $coaching->coach->name]),
            '/coaches');
    }

    public function coachingEnded(Coaching $coaching, User $by): void
    {
        $other = $by->id === $coaching->coach_id ? $coaching->trainee : $coaching->coach;
        $this->send($other, 'coaching_ended',
            __('Coaching ended'),
            __(':name ended your coaching.', ['name' => $by->name]),
            $other->isCoach() ? '/dashboard/clients' : '/app/coach');
    }

    public function messageReceived(User $recipient, User $sender, ?string $body = null): void
    {
        // One unread notice per conversation is enough in the app; Telegram
        // has no unread badge, so every message still reaches a linked coach.
        $alreadyUnread = $recipient->unreadNotifications()
            ->where('data->kind', 'message')
            ->where('data->sender_id', $sender->id)
            ->exists();

        $this->send($recipient, 'message',
            __('New message from :name', ['name' => $sender->name]),
            __('Open the chat to reply.'),
            $recipient->isCoach() ? '/dashboard/messages?client='.$sender->id : '/app/messages',
            extra: ['sender_id' => $sender->id], detail: $body, store: ! $alreadyUnread);
    }

    public function checkinSubmitted(User $coach, User $trainee, ?int $checkinId = null, ?string $reflection = null): void
    {
        $this->send($coach, 'checkin_submitted',
            __(':name sent a check-in', ['name' => $trainee->name]),
            __('Review it and send feedback.'),
            '/dashboard/checkins',
            extra: $checkinId === null ? [] : ['checkin_id' => $checkinId], detail: $reflection);
    }

    public function checkinReviewed(User $trainee, User $coach): void
    {
        $this->send($trainee, 'checkin_reviewed',
            __(':name reviewed your check-in', ['name' => $coach->name]),
            __('Read the feedback in your chat.'),
            '/app/messages');
    }

    public function planActivated(WorkoutPlan $plan): void
    {
        if ($plan->trainee === null) {
            return;
        }

        $this->send($plan->trainee, 'plan_activated',
            __('You have a new training plan'),
            __(':title is ready. Open it to start your first workout.', ['title' => $plan->title]),
            '/app/workout', mail: true);
    }

    public function paymentConfirmed(SubscriptionPayment $payment): void
    {
        $this->send($payment->coach, 'payment_confirmed',
            __('Payment confirmed'),
            __('Your subscription is active until :date.', ['date' => LocalFormat::date($payment->coach->subscription()->first()?->endsAt())]),
            '/dashboard/billing', mail: true);
    }

    public function paymentRejected(SubscriptionPayment $payment): void
    {
        $this->send($payment->coach, 'payment_rejected',
            __('Payment not confirmed'),
            __('We could not confirm your payment :reference. Please check the receipt and contact support.', ['reference' => $payment->reference]),
            '/dashboard/billing', mail: true);
    }

    public function subscriptionEnding(User $coach, int $days): void
    {
        $this->send($coach, 'subscription_ending',
            __('Your subscription ends in :days days', ['days' => LocalFormat::number($days)]),
            __('Renew so trainees can keep finding you in the coach directory.'),
            '/dashboard/billing', mail: true);
    }

    public function reviewReceived(CoachReview $review): void
    {
        $coach = User::query()->find($review->coach_id);
        if ($coach === null) {
            return;
        }

        $this->send($coach, 'review_received',
            __('New review: :rating stars', ['rating' => LocalFormat::number($review->rating)]),
            __('A trainee reviewed you. You can reply from your public profile.'),
            '/dashboard/profile');
    }

    /**
     * @param  array<string, mixed>  $extra
     */
    private function send(User $user, string $kind, string $title, string $body, string $url, bool $mail = false, array $extra = [], ?string $detail = null, bool $store = true): void
    {
        try {
            $user->notify(new AppNotice($kind, $title, $body, $url, $mail, $extra, Tg::clip($detail, 500) ?: null, $store));
        } catch (Throwable $e) {
            Log::warning('Notification failed', ['kind' => $kind, 'user' => $user->id, 'error' => $e->getMessage()]);
        }
    }
}
