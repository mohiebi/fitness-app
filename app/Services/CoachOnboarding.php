<?php

namespace App\Services;

use App\Models\Coaching;
use App\Models\CoachProfile;
use App\Models\User;
use App\Models\WorkoutPlan;
use App\Services\Telegram\TelegramLinks;
use Illuminate\Validation\ValidationException;

/**
 * The first-run guide for a new coach: set up the profile, publish it,
 * connect Telegram, build a plan and get a first trainee. Each step is
 * worked out from what the coach has actually done, so it can't drift out
 * of date, and the guide disappears by itself once the essentials are done.
 */
class CoachOnboarding
{
    public function __construct(private TelegramLinks $telegram) {}

    /**
     * @return array<string, mixed>
     */
    public function summary(User $coach): array
    {
        $profile = $this->profile($coach);
        $steps = $this->steps($coach, $profile);

        $required = array_filter($steps, fn (array $step) => ! $step['optional']);
        $complete = $required !== [] && count(array_filter($required, fn (array $step) => $step['done'])) === count($required);

        return [
            'steps' => $steps,
            'done' => count(array_filter($steps, fn (array $step) => $step['done'])),
            'total' => count($steps),
            'complete' => $complete,
            'dismissed' => $profile->onboarding_dismissed_at !== null,
            'slug' => $profile->slug,
            'public_url' => $profile->is_published ? url('/coaches/'.$profile->slug) : null,
            'missing_profile' => $this->missing($profile),
        ];
    }

    /**
     * Publish the profile from the guide, once it has what trainees need to see.
     */
    public function publish(User $coach): CoachProfile
    {
        $profile = $this->profile($coach);
        $missing = $this->missing($profile);

        if ($missing !== []) {
            throw ValidationException::withMessages([
                'profile' => __('Add a headline, a bio and at least one specialty before publishing.'),
            ]);
        }

        $profile->update(['is_published' => true]);

        return $profile;
    }

    public function dismiss(User $coach): void
    {
        $this->profile($coach)->forceFill(['onboarding_dismissed_at' => now()])->save();
    }

    public function restore(User $coach): void
    {
        $this->profile($coach)->forceFill(['onboarding_dismissed_at' => null])->save();
    }

    /**
     * Mark that a newly registered coach should see the welcome page once.
     */
    public function expectWelcome(User $coach): void
    {
        $this->profile($coach)->forceFill(['onboarding_pending' => true])->save();
    }

    /**
     * Whether to send the coach to the welcome page now. Only once, and
     * only while there is still something to set up.
     */
    public function takeWelcome(User $coach): bool
    {
        $profile = $this->profile($coach);

        if (! $profile->onboarding_pending) {
            return false;
        }

        $profile->forceFill(['onboarding_pending' => false])->save();

        return ! $this->summary($coach)['complete'];
    }

    /**
     * @return list<array{key: string, done: bool, optional: bool, blocked: bool}>
     */
    private function steps(User $coach, CoachProfile $profile): array
    {
        $ready = $this->missing($profile) === [];

        $steps = [
            ['key' => 'profile', 'done' => $ready, 'optional' => false, 'blocked' => false],
            ['key' => 'photo', 'done' => $profile->avatar_path !== null, 'optional' => true, 'blocked' => false],
            ['key' => 'publish', 'done' => $profile->is_published, 'optional' => false, 'blocked' => ! $ready && ! $profile->is_published],
        ];

        if ($this->telegram->available()) {
            $steps[] = ['key' => 'telegram', 'done' => $this->telegram->accountFor($coach)->isLinked(), 'optional' => false, 'blocked' => false];
        }

        $steps[] = ['key' => 'plan', 'done' => WorkoutPlan::query()->where('coach_id', $coach->id)->exists(), 'optional' => true, 'blocked' => false];
        $steps[] = ['key' => 'trainee', 'done' => Coaching::query()->where('coach_id', $coach->id)->whereIn('status', [Coaching::ACTIVE, Coaching::REQUESTED])->exists(), 'optional' => true, 'blocked' => false];

        return $steps;
    }

    /**
     * What a trainee needs to see on a profile before it can go live.
     *
     * @return list<string>
     */
    private function missing(CoachProfile $profile): array
    {
        return array_values(array_filter([
            trim((string) $profile->headline) === '' ? 'headline' : null,
            trim((string) $profile->bio) === '' ? 'bio' : null,
            empty($profile->specialties) ? 'specialties' : null,
        ]));
    }

    private function profile(User $coach): CoachProfile
    {
        return $coach->coachProfile()->firstOrCreate([], [
            'slug' => CoachProfile::uniqueSlugFor($coach->name),
        ]);
    }
}
