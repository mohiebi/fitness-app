<?php

namespace Database\Seeders;

use App\Models\CoachProfile;
use App\Models\Exercise;
use App\Models\User;
use App\Models\WorkoutLog;
use App\Models\WorkoutPlan;
use App\Services\CoachingLifecycle;
use App\Services\TrainingPlans;
use Illuminate\Database\Seeder;

/**
 * Local demo data for the coach marketplace:
 *   php artisan db:seed --class=MarketplaceDemoSeeder
 *
 * Every account uses the password "password".
 * Coaches: sara@fitnessos.test, reza@fitnessos.test, maryam@fitnessos.test, ali@fitnessos.test
 * Trainees: nima@fitnessos.test (coached by Sara, with an active plan and two
 * logged sessions), leila@fitnessos.test (no coach yet)
 */
class MarketplaceDemoSeeder extends Seeder
{
    public function run(CoachingLifecycle $lifecycle): void
    {
        $coaches = [
            ['sara', 'سارا احمدی', 'مربی قدرتی برای مبتدی‌های پرمشغله', 'تهران', ['strength', 'fat-loss', 'womens-fitness'], 8, 3500000, true],
            ['reza', 'رضا کریمی', 'بدنسازی و عضله‌سازی اصولی', 'شیراز', ['bodybuilding', 'muscle-gain', 'nutrition'], 12, 4000000, true],
            ['maryam', 'مریم رستمی', 'یوگا و توان‌بخشی بعد از آسیب', 'اصفهان', ['yoga', 'rehab', 'pilates'], 6, 2500000, false],
            ['ali', 'علی موسوی', 'آماده‌سازی دوندگان و ورزشکاران', 'مشهد', ['running', 'sports-performance'], 10, null, false],
        ];

        foreach ($coaches as [$slug, $name, $headline, $city, $specialties, $years, $price, $verified]) {
            $user = User::query()->updateOrCreate(
                ['email' => "{$slug}@fitnessos.test"],
                ['name' => $name, 'password' => 'password', 'role' => 'coach', 'email_verified_at' => now()],
            );

            $profile = CoachProfile::query()->updateOrCreate(['user_id' => $user->id], [
                'slug' => $slug,
                'headline' => $headline,
                'bio' => "سلام! من {$name} هستم و {$years} سال است که مربیگری می‌کنم. برنامه‌ها را بر اساس زندگی واقعی شما می‌چینم و هر هفته با گزارش شما تنظیمشان می‌کنم.",
                'specialties' => $specialties,
                'certifications' => ['مربیگری درجه ۲ فدراسیون بدنسازی و پرورش اندام', 'NASM Certified Personal Trainer'],
                'years_experience' => $years,
                'city' => $city,
                'languages' => ['فارسی', 'English'],
                'online' => true,
                'in_person' => $slug !== 'ali',
                'price_from' => $price,
                'accepting_clients' => true,
                'is_published' => true,
            ]);
            $profile->forceFill(['verified_at' => $verified ? now() : null])->save();
        }

        $sara = User::query()->where('email', 'sara@fitnessos.test')->firstOrFail();

        $nima = User::query()->updateOrCreate(
            ['email' => 'nima@fitnessos.test'],
            ['name' => 'نیما رضایی', 'password' => 'password', 'role' => 'client', 'email_verified_at' => now()],
        );
        $nima->traineeProfile()->updateOrCreate([], [
            'birth_year' => 1995, 'height_cm' => 178, 'weight_kg' => 86, 'goal' => 'fat-loss',
            'experience' => 'beginner', 'limitations' => 'درد خفیف زانوی راست هنگام اسکوات عمیق',
        ])->forceFill(['health_consent_at' => now()])->save();

        if ($nima->coach_id === null) {
            $lifecycle->startDirect($sara, $nima);
        }

        User::query()->updateOrCreate(
            ['email' => 'leila@fitnessos.test'],
            ['name' => 'لیلا نوری', 'password' => 'password', 'role' => 'client', 'email_verified_at' => now()],
        );

        $this->seedTraining($sara, $nima->fresh());
    }

    /**
     * A template for Sara and an active plan with two logged sessions for Nima.
     */
    private function seedTraining(User $sara, User $nima): void
    {
        if (WorkoutPlan::query()->where('coach_id', $sara->id)->exists()) {
            return;
        }

        $plans = app(TrainingPlans::class);
        $id = fn (string $name) => Exercise::query()->whereNull('coach_id')->where('name_en', $name)->value('id');
        $days = [
            ['title' => 'روز ۱ — پایین‌تنه', 'exercises' => [
                ['exercise_id' => $id('Goblet squat'), 'sets' => 3, 'reps' => '10-12', 'rest_seconds' => 90, 'target_weight_kg' => 16, 'notes' => 'زانو را تا جایی که درد ندارد خم کن'],
                ['exercise_id' => $id('Romanian deadlift'), 'sets' => 3, 'reps' => '8-10', 'rest_seconds' => 120, 'target_weight_kg' => 40],
                ['exercise_id' => $id('Plank'), 'sets' => 3, 'reps' => '30s', 'rest_seconds' => 60],
            ]],
            ['title' => 'روز ۲ — بالاتنه', 'exercises' => [
                ['exercise_id' => $id('Dumbbell bench press'), 'sets' => 3, 'reps' => '8-12', 'rest_seconds' => 90, 'target_weight_kg' => 14],
                ['exercise_id' => $id('Lat pulldown'), 'sets' => 3, 'reps' => '10-12', 'rest_seconds' => 90, 'target_weight_kg' => 35],
                ['exercise_id' => $id('Lateral raise'), 'sets' => 2, 'reps' => '12-15', 'rest_seconds' => 60, 'target_weight_kg' => 5],
            ]],
            ['title' => 'روز ۳ — تمام بدن', 'exercises' => [
                ['exercise_id' => $id('Kettlebell swing'), 'sets' => 4, 'reps' => '15', 'rest_seconds' => 60, 'target_weight_kg' => 12],
                ['exercise_id' => $id('Push-up'), 'sets' => 3, 'reps' => '8-10', 'rest_seconds' => 60],
                ['exercise_id' => $id('Stationary bike'), 'sets' => 1, 'reps' => '15 min'],
            ]],
        ];

        $template = $plans->create($sara, ['title' => 'چربی‌سوزی مبتدی — ۳ روز در هفته']);
        $plans->sync($sara, $template, ['title' => $template->title, 'days' => $days]);

        $plan = $plans->create($sara, ['title' => 'برنامه‌ی نیما — ماه اول', 'trainee_id' => $nima->id, 'from_plan_id' => $template->id]);
        $plans->activate($sara, $plan);

        foreach ($plan->days()->with('exercises.exercise')->take(2)->get() as $index => $day) {
            $log = WorkoutLog::create([
                'trainee_id' => $nima->id,
                'workout_plan_id' => $plan->id,
                'plan_day_id' => $day->id,
                'title' => $day->title,
                'performed_on' => now()->subDays(4 - $index * 2)->toDateString(),
                'duration_minutes' => 50,
                'effort' => 7,
            ]);
            foreach ($day->exercises as $item) {
                for ($set = 1; $set <= $item->sets; $set++) {
                    $log->sets()->create([
                        'exercise_id' => $item->exercise_id,
                        'exercise_name' => $item->exercise->name,
                        'set_number' => $set,
                        'reps' => (int) $item->reps,
                        'weight_kg' => $item->target_weight_kg,
                    ]);
                }
            }
        }
    }
}
