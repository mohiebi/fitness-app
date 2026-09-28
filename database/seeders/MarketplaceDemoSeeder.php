<?php

namespace Database\Seeders;

use App\Models\CoachProfile;
use App\Models\User;
use App\Services\CoachingLifecycle;
use Illuminate\Database\Seeder;

/**
 * Local demo data for the coach marketplace:
 *   php artisan db:seed --class=MarketplaceDemoSeeder
 *
 * Every account uses the password "password".
 * Coaches: sara@fitnessos.test, reza@fitnessos.test, maryam@fitnessos.test, ali@fitnessos.test
 * Trainees: nima@fitnessos.test (coached by Sara), leila@fitnessos.test (no coach yet)
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
    }
}
