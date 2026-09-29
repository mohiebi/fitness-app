import { locale, t } from './i18n';

export type Exercise = {
    id: number;
    name: string;
    name_en: string | null;
    muscle_group: string;
    equipment: string;
    video_url: string | null;
    instructions: string | null;
    custom: boolean;
};

export type PlanStatus = 'draft' | 'active' | 'archived';

export type PlanSummary = {
    id: number;
    title: string;
    status: PlanStatus;
    template: boolean;
    trainee: { id: number; name: string } | null;
    days_count: number;
    activated_at: string | null;
    updated_at: string | null;
};

export type PlanExerciseItem = {
    id?: number;
    exercise: Exercise;
    sets: number;
    reps: string;
    rest_seconds: number | null;
    target_weight_kg: number | null;
    notes: string | null;
};

export type PlanDayData = {
    id?: number;
    title: string;
    notes: string | null;
    exercises: PlanExerciseItem[];
};

export type PlanDetail = PlanSummary & {
    notes: string | null;
    days: PlanDayData[];
};

export type LoggedSet = {
    exercise_id: number | null;
    exercise_name: string;
    set_number: number;
    reps: number | null;
    weight_kg: number | null;
    completed: boolean;
};

export type WorkoutLogData = {
    id: number;
    plan_day_id: number | null;
    title: string;
    performed_on: string;
    duration_minutes: number | null;
    effort: number | null;
    notes: string | null;
    sets: LoggedSet[];
};

export type Adherence = {
    planned_per_week: number;
    weeks: { starts_on: string; done: number }[];
};

export const muscleGroups: Record<string, string> = {
    chest: 'Chest',
    back: 'Back',
    shoulders: 'Shoulders',
    arms: 'Arms',
    legs: 'Legs',
    glutes: 'Glutes',
    core: 'Core',
    'full-body': 'Full body',
    cardio: 'Cardio',
};

export const equipmentTypes: Record<string, string> = {
    barbell: 'Barbell',
    dumbbell: 'Dumbbell',
    machine: 'Machine',
    cable: 'Cable',
    bodyweight: 'Bodyweight',
    kettlebell: 'Kettlebell',
    band: 'Band',
    other: 'Other equipment',
};

export const planStatusLabels: Record<PlanStatus, string> = {
    draft: 'Draft',
    active: 'Active',
    archived: 'Archived',
};

/** Library exercises carry both names; show the one for the page language. */
export function exerciseName(
    exercise: Pick<Exercise, 'name' | 'name_en'>,
): string {
    return locale() === 'en' && exercise.name_en
        ? exercise.name_en
        : exercise.name;
}

export function muscleLabel(key: string): string {
    return t(muscleGroups[key] ?? key);
}

/** Group a session's sets by exercise, keeping the order they were logged. */
export function groupSets(
    sets: LoggedSet[],
): { name: string; sets: LoggedSet[] }[] {
    const groups = new Map<string, LoggedSet[]>();
    for (const set of sets) {
        groups.set(set.exercise_name, [
            ...(groups.get(set.exercise_name) ?? []),
            set,
        ]);
    }

    return [...groups.entries()].map(([name, items]) => ({
        name,
        sets: items,
    }));
}
