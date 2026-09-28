import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ChevronRight, Plus, Video } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { PageHeader } from '@fitnessos/components/app-shell';
import { NoCoachCard, useMyCoaching } from '@fitnessos/components/no-coach';
import {
    AdherenceCard,
    SessionList,
} from '@fitnessos/components/training-summary';
import { Button } from '@fitnessos/components/ui/button';
import { Card } from '@fitnessos/components/ui/card';
import { Input } from '@fitnessos/components/ui/input';
import { Label } from '@fitnessos/components/ui/label';
import { Slider } from '@fitnessos/components/ui/slider';
import { Textarea } from '@fitnessos/components/ui/textarea';
import { deleteJson, getJson, postJson } from '@fitnessos/lib/api';
import { formatDate, formatNumber } from '@fitnessos/lib/format';
import { t } from '@fitnessos/lib/i18n';
import {
    exerciseName,
    type Adherence,
    type PlanDayData,
    type PlanDetail,
    type WorkoutLogData,
} from '@fitnessos/lib/training';
import { cn } from '@fitnessos/lib/utils';

export const Route = createFileRoute('/app/workout')({
    component: Workout,
    validateSearch: (search: Record<string, unknown>): { day?: number } => ({
        day:
            typeof search.day === 'number' || typeof search.day === 'string'
                ? Number(search.day) || undefined
                : undefined,
    }),
});

type MyPlan = {
    plan: PlanDetail | null;
    last_logs: Record<string, WorkoutLogData>;
    adherence: Adherence;
};

function Workout() {
    const { day: dayId } = Route.useSearch();
    const { data: coaching } = useMyCoaching();
    const { data, isLoading } = useQuery({
        queryKey: ['fitnessos', 'my-plan'],
        queryFn: () => getJson<MyPlan>('/fitnessos/my-plan'),
    });

    if (isLoading || !data) {
        return <p className="text-muted-foreground text-sm">{t('Loading…')}</p>;
    }

    const day = data.plan?.days.find((item) => item.id === dayId);
    if (data.plan && day) {
        return (
            <SessionLogger
                plan={data.plan}
                day={day}
                lastLog={day.id ? data.last_logs[day.id] : undefined}
            />
        );
    }

    return (
        <div className="flex flex-col gap-5">
            <PageHeader
                title={data.plan?.title ?? t('Workout')}
                description={
                    data.plan?.notes ??
                    (data.plan
                        ? t("Pick today's workout and log each set as you go.")
                        : undefined)
                }
            />

            {!data.plan &&
                (coaching && !coaching.active ? (
                    <NoCoachCard
                        pendingCoachName={coaching.pending?.coach.name}
                    />
                ) : (
                    <Card className="text-muted-foreground p-6 text-sm">
                        {t(
                            'Your coach has not assigned a plan yet. You will see it here as soon as they do.',
                        )}
                    </Card>
                ))}

            {data.plan && (
                <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
                    <ol className="flex flex-col gap-3">
                        {data.plan.days.map((planDay, index) => {
                            const last = planDay.id
                                ? data.last_logs[planDay.id]
                                : undefined;
                            return (
                                <li key={planDay.id}>
                                    <DayCard
                                        index={index}
                                        day={planDay}
                                        lastDone={last?.performed_on}
                                    />
                                </li>
                            );
                        })}
                    </ol>
                    <AdherenceCard adherence={data.adherence} />
                </div>
            )}

            <History />
        </div>
    );
}

function DayCard({
    index,
    day,
    lastDone,
}: {
    index: number;
    day: PlanDayData;
    lastDone?: string;
}) {
    const navigate = useNavigate();

    return (
        <Card className="flex flex-col gap-3 p-5">
            <div className="flex flex-wrap items-center gap-3">
                <span className="bg-brand-gradient text-primary-foreground grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-extrabold">
                    {formatNumber(index + 1)}
                </span>
                <div className="min-w-0 flex-1">
                    <h2 className="font-semibold">{day.title}</h2>
                    <div className="text-muted-foreground text-xs">
                        {lastDone
                            ? t('Last done :date', {
                                  date: formatDate(lastDone, {
                                      weekday: 'long',
                                      day: 'numeric',
                                      month: 'long',
                                  }),
                              })
                            : t('Not done yet')}
                    </div>
                </div>
                <Button
                    disabled={day.exercises.length === 0}
                    onClick={() =>
                        void navigate({
                            to: '/app/workout',
                            search: { day: day.id },
                        })
                    }
                >
                    {t('Start')}
                    <ChevronRight className="rtl:rotate-180" />
                </Button>
            </div>
            <ul className="text-muted-foreground grid gap-1 text-sm">
                {day.exercises.map((item) => (
                    <li key={item.id} className="flex justify-between gap-3">
                        <span className="text-foreground">
                            {exerciseName(item.exercise)}
                        </span>
                        <span dir="ltr">
                            {formatNumber(item.sets)} × {item.reps}
                        </span>
                    </li>
                ))}
            </ul>
        </Card>
    );
}

type SetDraft = { reps: string; weight: string; completed: boolean };

function SessionLogger({
    plan,
    day,
    lastLog,
}: {
    plan: PlanDetail;
    day: PlanDayData;
    lastLog?: WorkoutLogData;
}) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    // Prefill from the last time this day was done, then from the plan targets.
    const [sets, setSets] = useState<SetDraft[][]>(() =>
        day.exercises.map((item) => {
            const previous = (lastLog?.sets ?? []).filter(
                (set) => set.exercise_id === item.exercise.id,
            );
            return Array.from({ length: item.sets }, (_, index) => ({
                reps: previous[index]?.reps?.toString() ?? '',
                weight:
                    previous[index]?.weight_kg?.toString() ??
                    item.target_weight_kg?.toString() ??
                    '',
                completed: false,
            }));
        }),
    );
    const [effort, setEffort] = useState(7);
    const [duration, setDuration] = useState('');
    const [notes, setNotes] = useState('');
    const [performedOn, setPerformedOn] = useState(() =>
        new Date().toLocaleDateString('en-CA'),
    );
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const updateSet = (
        exerciseIndex: number,
        setIndex: number,
        change: Partial<SetDraft>,
    ) =>
        setSets((current) =>
            current.map((list, i) =>
                i === exerciseIndex
                    ? list.map((set, j) =>
                          j === setIndex ? { ...set, ...change } : set,
                      )
                    : list,
            ),
        );

    const completedCount = sets.flat().filter((set) => set.completed).length;

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        setBusy(true);
        setError(null);
        try {
            const payloadSets = day.exercises.flatMap((item, exerciseIndex) =>
                sets[exerciseIndex]
                    .map((set, setIndex) => ({
                        exercise_id: item.exercise.id,
                        set_number: setIndex + 1,
                        reps: set.reps === '' ? null : Number(set.reps),
                        weight_kg:
                            set.weight === '' ? null : Number(set.weight),
                        completed: set.completed,
                    }))
                    .filter((set) => set.completed || set.reps !== null),
            );
            if (payloadSets.length === 0) {
                setError(t('Tick at least one set you finished.'));
                setBusy(false);
                return;
            }
            await postJson('/fitnessos/workout-logs', {
                plan_day_id: day.id,
                performed_on: performedOn,
                effort,
                duration_minutes: duration ? Number(duration) : null,
                notes: notes.trim() || null,
                sets: payloadSets,
            });
            await Promise.all([
                queryClient.invalidateQueries({
                    queryKey: ['fitnessos', 'my-plan'],
                }),
                queryClient.invalidateQueries({
                    queryKey: ['fitnessos', 'workout-logs'],
                }),
            ]);
            await navigate({ to: '/app/workout', search: {} });
        } catch (cause) {
            setError(
                cause instanceof Error
                    ? cause.message
                    : t('The request failed.'),
            );
            setBusy(false);
        }
    };

    return (
        <form onSubmit={submit} className="flex flex-col gap-4">
            <PageHeader
                eyebrow={plan.title}
                title={day.title}
                description={t(
                    'Enter reps and weight, and tick each set when it is done.',
                )}
            />

            {day.exercises.map((item, exerciseIndex) => (
                <Card key={item.id} className="flex flex-col gap-3 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                            <h2 className="font-semibold">
                                {exerciseName(item.exercise)}
                            </h2>
                            <div
                                className="text-muted-foreground text-sm"
                                dir="auto"
                            >
                                {t('Target: :sets × :reps', {
                                    sets: formatNumber(item.sets),
                                    reps: item.reps,
                                })}
                                {item.rest_seconds !== null &&
                                    ` · ${t('Rest :seconds s', { seconds: formatNumber(item.rest_seconds) })}`}
                            </div>
                            {item.notes && (
                                <p className="text-aqua mt-1 text-sm">
                                    {item.notes}
                                </p>
                            )}
                        </div>
                        {item.exercise.video_url && (
                            <Button asChild variant="ghost" size="sm">
                                <a
                                    href={item.exercise.video_url}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <Video />
                                    {t('Watch demo')}
                                </a>
                            </Button>
                        )}
                    </div>

                    <ol className="flex flex-col gap-2">
                        {sets[exerciseIndex].map((set, setIndex) => (
                            <li
                                key={setIndex}
                                className={cn(
                                    'grid grid-cols-[2rem_1fr_1fr_auto] items-center gap-2',
                                    set.completed && 'opacity-70',
                                )}
                            >
                                <span className="text-subtle-foreground text-sm font-semibold">
                                    {formatNumber(setIndex + 1)}
                                </span>
                                <Input
                                    type="number"
                                    inputMode="numeric"
                                    min={0}
                                    aria-label={t('Reps for set :number', {
                                        number: setIndex + 1,
                                    })}
                                    placeholder={t('Reps')}
                                    value={set.reps}
                                    onChange={(event) =>
                                        updateSet(exerciseIndex, setIndex, {
                                            reps: event.target.value,
                                        })
                                    }
                                />
                                <Input
                                    type="number"
                                    inputMode="decimal"
                                    min={0}
                                    step={0.5}
                                    aria-label={t('Weight for set :number', {
                                        number: setIndex + 1,
                                    })}
                                    placeholder={t('kg')}
                                    value={set.weight}
                                    onChange={(event) =>
                                        updateSet(exerciseIndex, setIndex, {
                                            weight: event.target.value,
                                        })
                                    }
                                />
                                <Button
                                    type="button"
                                    size="icon"
                                    variant={
                                        set.completed ? 'default' : 'outline'
                                    }
                                    aria-pressed={set.completed}
                                    aria-label={t('Set :number done', {
                                        number: setIndex + 1,
                                    })}
                                    onClick={() =>
                                        updateSet(exerciseIndex, setIndex, {
                                            completed: !set.completed,
                                        })
                                    }
                                >
                                    <Check />
                                </Button>
                            </li>
                        ))}
                    </ol>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="self-start"
                        disabled={sets[exerciseIndex].length >= 20}
                        onClick={() =>
                            setSets((current) =>
                                current.map((list, i) =>
                                    i === exerciseIndex
                                        ? [
                                              ...list,
                                              {
                                                  reps: '',
                                                  weight:
                                                      list.at(-1)?.weight ?? '',
                                                  completed: false,
                                              },
                                          ]
                                        : list,
                                ),
                            )
                        }
                    >
                        <Plus />
                        {t('Add set')}
                    </Button>
                </Card>
            ))}

            <Card className="grid gap-4 p-5 sm:grid-cols-2">
                <div className="grid gap-2 sm:col-span-2">
                    <Label>
                        {t('How hard was it?')} · {formatNumber(effort)}/
                        {formatNumber(10)}
                    </Label>
                    <Slider
                        value={[effort]}
                        min={1}
                        max={10}
                        step={1}
                        onValueChange={(value) => setEffort(value[0])}
                    />
                </div>
                <div className="grid gap-1.5">
                    <Label htmlFor="performed-on">{t('Date')}</Label>
                    <Input
                        id="performed-on"
                        type="date"
                        value={performedOn}
                        max={new Date().toLocaleDateString('en-CA')}
                        onChange={(event) => setPerformedOn(event.target.value)}
                    />
                </div>
                <div className="grid gap-1.5">
                    <Label htmlFor="duration">{t('Duration (minutes)')}</Label>
                    <Input
                        id="duration"
                        type="number"
                        min={1}
                        max={600}
                        value={duration}
                        onChange={(event) => setDuration(event.target.value)}
                    />
                </div>
                <div className="grid gap-1.5 sm:col-span-2">
                    <Label htmlFor="session-notes">
                        {t('Notes for your coach')}
                    </Label>
                    <Textarea
                        id="session-notes"
                        rows={3}
                        value={notes}
                        placeholder={t(
                            'How did it feel? Any pain or anything that was too easy?',
                        )}
                        onChange={(event) => setNotes(event.target.value)}
                    />
                </div>
            </Card>

            {error && (
                <p role="alert" className="text-destructive text-sm">
                    {error}
                </p>
            )}
            <div className="flex flex-wrap gap-2">
                <Button type="submit" size="lg" disabled={busy}>
                    {busy
                        ? t('Saving…')
                        : t('Finish workout (:count sets)', {
                              count: formatNumber(completedCount),
                          })}
                </Button>
                <Button
                    type="button"
                    size="lg"
                    variant="ghost"
                    onClick={() =>
                        void navigate({ to: '/app/workout', search: {} })
                    }
                >
                    {t('Cancel')}
                </Button>
            </div>
        </form>
    );
}

function History() {
    const queryClient = useQueryClient();
    const { data: logs = [] } = useQuery({
        queryKey: ['fitnessos', 'workout-logs'],
        queryFn: () => getJson<WorkoutLogData[]>('/fitnessos/workout-logs'),
    });

    const remove = async (log: WorkoutLogData) => {
        if (!window.confirm(t('Delete this session?'))) return;
        await deleteJson(`/fitnessos/workout-logs/${log.id}`);
        await Promise.all([
            queryClient.invalidateQueries({
                queryKey: ['fitnessos', 'workout-logs'],
            }),
            queryClient.invalidateQueries({
                queryKey: ['fitnessos', 'my-plan'],
            }),
        ]);
    };

    return (
        <Card className="flex flex-col gap-4 p-5">
            <h2 className="font-semibold">{t('Your sessions')}</h2>
            <SessionList
                logs={logs}
                empty={t('Sessions you log show up here.')}
                onDelete={(log) => void remove(log)}
            />
        </Card>
    );
}
