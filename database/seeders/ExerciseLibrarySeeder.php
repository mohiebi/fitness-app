<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * The shared exercise library every coach can use. Runs from the training
 * migration and is safe to run again: existing names are left alone.
 */
class ExerciseLibrarySeeder extends Seeder
{
    /** @var list<array{0: string, 1: string, 2: string, 3: string}> [name, name_en, muscle_group, equipment] */
    private const EXERCISES = [
        ['اسکوات با هالتر', 'Back squat', 'legs', 'barbell'],
        ['فرانت اسکوات', 'Front squat', 'legs', 'barbell'],
        ['گابلت اسکوات', 'Goblet squat', 'legs', 'dumbbell'],
        ['لانج با دمبل', 'Dumbbell lunge', 'legs', 'dumbbell'],
        ['اسکوات بلغاری', 'Bulgarian split squat', 'legs', 'dumbbell'],
        ['پرس پا', 'Leg press', 'legs', 'machine'],
        ['جلو پا ماشین', 'Leg extension', 'legs', 'machine'],
        ['پشت پا خوابیده', 'Lying leg curl', 'legs', 'machine'],
        ['ساق پا ایستاده', 'Standing calf raise', 'legs', 'machine'],
        ['ددلیفت', 'Deadlift', 'back', 'barbell'],
        ['ددلیفت رومانیایی', 'Romanian deadlift', 'glutes', 'barbell'],
        ['هیپ تراست', 'Hip thrust', 'glutes', 'barbell'],
        ['پل باسن', 'Glute bridge', 'glutes', 'bodyweight'],
        ['پرس سینه با هالتر', 'Bench press', 'chest', 'barbell'],
        ['پرس سینه شیب مثبت دمبل', 'Incline dumbbell press', 'chest', 'dumbbell'],
        ['پرس سینه با دمبل', 'Dumbbell bench press', 'chest', 'dumbbell'],
        ['قفسه سینه با دمبل', 'Dumbbell fly', 'chest', 'dumbbell'],
        ['کراس اوور', 'Cable crossover', 'chest', 'cable'],
        ['شنا سوئدی', 'Push-up', 'chest', 'bodyweight'],
        ['بارفیکس', 'Pull-up', 'back', 'bodyweight'],
        ['زیربغل سیم‌کش از جلو', 'Lat pulldown', 'back', 'cable'],
        ['زیربغل هالتر خم', 'Barbell row', 'back', 'barbell'],
        ['زیربغل تک دمبل', 'One-arm dumbbell row', 'back', 'dumbbell'],
        ['قایقی نشسته', 'Seated cable row', 'back', 'cable'],
        ['پرس سرشانه با هالتر', 'Overhead press', 'shoulders', 'barbell'],
        ['پرس سرشانه با دمبل', 'Dumbbell shoulder press', 'shoulders', 'dumbbell'],
        ['نشر از جانب', 'Lateral raise', 'shoulders', 'dumbbell'],
        ['فیس پول', 'Face pull', 'shoulders', 'cable'],
        ['جلو بازو با هالتر', 'Barbell curl', 'arms', 'barbell'],
        ['جلو بازو چکشی', 'Hammer curl', 'arms', 'dumbbell'],
        ['پشت بازو سیم‌کش', 'Triceps pushdown', 'arms', 'cable'],
        ['دیپ پارالل', 'Dip', 'arms', 'bodyweight'],
        ['پلانک', 'Plank', 'core', 'bodyweight'],
        ['پلانک پهلو', 'Side plank', 'core', 'bodyweight'],
        ['زیر شکم خلبانی', 'Hanging leg raise', 'core', 'bodyweight'],
        ['کرانچ با سیم‌کش', 'Cable crunch', 'core', 'cable'],
        ['کتل‌بل سوئینگ', 'Kettlebell swing', 'full-body', 'kettlebell'],
        ['بورپی', 'Burpee', 'full-body', 'bodyweight'],
        ['دویدن روی تردمیل', 'Treadmill run', 'cardio', 'machine'],
        ['دوچرخه ثابت', 'Stationary bike', 'cardio', 'machine'],
        ['طناب زدن', 'Jump rope', 'cardio', 'other'],
        ['روئینگ ماشین', 'Rowing machine', 'cardio', 'machine'],
    ];

    public function run(): void
    {
        $existing = DB::table('exercises')->whereNull('coach_id')->pluck('name')->all();
        $now = now();

        $rows = collect(self::EXERCISES)
            ->reject(fn (array $exercise) => in_array($exercise[0], $existing, true))
            ->map(fn (array $exercise) => [
                'name' => $exercise[0],
                'name_en' => $exercise[1],
                'muscle_group' => $exercise[2],
                'equipment' => $exercise[3],
                'created_at' => $now,
                'updated_at' => $now,
            ])
            ->values()
            ->all();

        if ($rows !== []) {
            DB::table('exercises')->insert($rows);
        }
    }
}
