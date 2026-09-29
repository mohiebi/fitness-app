<?php

namespace App\Models;

use App\Services\CoachSubscriptions;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property int $user_id
 * @property string $slug
 * @property string|null $headline
 * @property string|null $bio
 * @property list<string>|null $specialties
 * @property list<string>|null $certifications
 * @property int|null $years_experience
 * @property string|null $city
 * @property list<string>|null $languages
 * @property bool $online
 * @property bool $in_person
 * @property int|null $price_from
 * @property bool $accepting_clients
 * @property int|null $max_clients
 * @property string|null $avatar_path
 * @property bool $is_published
 * @property CarbonInterface|null $verified_at
 * @property-read User $user
 */
#[Fillable([
    'slug', 'headline', 'bio', 'specialties', 'certifications', 'years_experience', 'city', 'languages',
    'online', 'in_person', 'price_from', 'accepting_clients', 'max_clients', 'is_published',
])]
class CoachProfile extends Model
{
    protected $attributes = [
        'online' => true,
        'in_person' => false,
        'accepting_clients' => true,
        'is_published' => false,
    ];

    protected function casts(): array
    {
        return [
            'specialties' => 'array',
            'certifications' => 'array',
            'languages' => 'array',
            'online' => 'boolean',
            'in_person' => 'boolean',
            'accepting_clients' => 'boolean',
            'is_published' => 'boolean',
            'verified_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return HasMany<CoachReview, $this> */
    public function reviews(): HasMany
    {
        return $this->hasMany(CoachReview::class, 'coach_id', 'user_id');
    }

    /**
     * Average rating and count of visible reviews. Uses rating_avg and
     * rating_count when the query already loaded them.
     *
     * @return array{average: float|null, count: int}
     */
    public function ratingSummary(): array
    {
        $count = $this->getAttribute('rating_count') ?? $this->reviews()->visible()->count();
        $average = $this->getAttribute('rating_avg') ?? ($count > 0 ? $this->reviews()->visible()->avg('rating') : null);

        return [
            'average' => $average !== null ? round((float) $average, 1) : null,
            'count' => (int) $count,
        ];
    }

    /** @param Builder<CoachProfile> $query */
    public function scopePublished(Builder $query): void
    {
        $query->where('is_published', true);
    }

    public static function uniqueSlugFor(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name) ?: 'coach';
        $slug = $base;
        $suffix = 2;

        while (static::query()->where('slug', $slug)->when($ignoreId, fn ($q) => $q->whereKeyNot($ignoreId))->exists()) {
            $slug = $base.'-'.$suffix++;
        }

        return $slug;
    }

    public function activeClientCount(): int
    {
        return Coaching::query()->where('coach_id', $this->user_id)->where('status', Coaching::ACTIVE)->count();
    }

    public function hasCapacity(): bool
    {
        if (! $this->accepting_clients) {
            return false;
        }

        $limit = $this->traineeLimit();

        return $limit === null || $this->activeClientCount() < $limit;
    }

    /**
     * The lower of the coach's own cap and their plan's limit (null = none).
     * A lapsed subscription allows no new trainees.
     */
    public function traineeLimit(): ?int
    {
        $planLimit = app(CoachSubscriptions::class)->traineeLimit($this->user);

        return match (true) {
            $planLimit === null => $this->max_clients,
            $this->max_clients === null => $planLimit,
            default => min($planLimit, $this->max_clients),
        };
    }

    /** @return array<string, mixed> */
    public function toPublicArray(): array
    {
        return [
            'slug' => $this->slug,
            'name' => $this->user->name,
            'headline' => $this->headline,
            'bio' => $this->bio,
            'specialties' => $this->specialties ?? [],
            'certifications' => $this->certifications ?? [],
            'years_experience' => $this->years_experience,
            'city' => $this->city,
            'languages' => $this->languages ?? [],
            'online' => $this->online,
            'in_person' => $this->in_person,
            'price_from' => $this->price_from,
            'accepting_clients' => $this->hasCapacity(),
            'avatar_url' => $this->avatar_path ? Storage::disk('public')->url($this->avatar_path) : null,
            'verified' => $this->verified_at !== null,
            'rating' => $this->ratingSummary(),
        ];
    }
}
