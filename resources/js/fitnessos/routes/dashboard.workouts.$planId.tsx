import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    ArrowDown,
    ArrowUp,
    Archive,
    Copy,
    Play,
    Plus,
    Trash2,
} from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { ExercisePicker } from '@fitnessos/components/exercise-picker';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@fitnessos/components/ui/alert-dialog';
import { Badge } from '@fitnessos/components/ui/badge';
import { Button } from '@fitnessos/components/ui/button';
import { Card } from '@fitnessos/components/ui/card';
import { Input } from '@fitnessos/components/ui/input';
import { Label } from '@fitnessos/components/ui/label';
import { Textarea } from '@fitnessos/components/ui/textarea';
import { deleteJson, getJson, postJson, putJson } from '@fitnessos/lib/api';
import { formatNumber } from '@fitnessos/lib/format';
import { t } from '@fitnessos/lib/i18n';
import {
    exerciseName,
    muscleLabel,
    planStatusLabels,
    type Exercise,
    type PlanDetail,
} from '@fitnessos/lib/training';
import { cn } from '@fitnessos/lib/utils';

export const Route = createFileRoute('/dashboard/workouts/$planId')({
    component: PlanEditor,
});

type DraftItem = {
    key: string;
    id?: number;
    exercise: Exercise;
    sets: string;
    reps: string;
    rest: string;
    weight: string;
    notes: string;
};
type DraftDay = {
    key: string;
    id?: number;
    title: string;
    notes: string;
    exercises: DraftItem[];
};
type Draft = { title: string; notes: string; days: DraftDay[] };

let keySeed = 0;
const newKey = () => `k${++keySeed}`;

function toDraft(plan: PlanDetail): Draft {
    return {
        title: plan.title,
        notes: plan.notes ?? '',
        days: plan.days.map((day) => ({
            key: newKey(),
            id: day.id,
            title: day.title,
            notes: day.notes ?? '',
            exercises: day.exercises.map((item) => ({
                key: newKey(),
                id: item.id,
                exercise: item.exercise,
                sets: String(item.sets),
                reps: item.reps,
                rest: item.rest_seconds?.toString() ?? '',
                weight: item.target_weight_kg?.toString() ?? '',
                notes: item.notes ?? '',
            })),
        })),
    };
}

function toPayload(draft: Draft) {
    const numberOrNull = (value: string) =>
        value.trim() === '' ? null : Number(value);

    return {
        title: draft.title.trim(),
        notes: draft.notes.trim() || null,
        days: draft.days.map((day) => ({
            id: day.id ?? null,
            title: day.title.trim(),
            notes: day.notes.trim() || null,
            exercises: day.exercises.map((item) => ({
                id: item.id ?? null,
                exercise_id: item.exercise.id,
                sets: Number(item.sets),
                reps: item.reps.trim(),
                rest_seconds: numberOrNull(item.rest),
                target_weight_kg: numberOrNull(item.weight),
                notes: item.notes.trim() || null,
            })),
        })),
    };
}

function move<T>(list: T[], from: number, to: number): T[] {
    if (to < 0 || to >= list.length) return list;
    const copy = [...list];
    const [item] = copy.splice(from, 1);
    copy.splice(to, 0, item);
    return copy;
}

function PlanEditor() {
    const { planId } = Route.useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const {
        data: plan,
        isLoading,
        error: loadError,
    } = useQuery({
        queryKey: ['fitnessos', 'plan', planId],
        queryFn: () => getJson<PlanDetail>(`/fitnessos/plans/${planId}`),
    });
    const [draft, setDraft] = useState<Draft | null>(null);
    const [dirty, setDirty] = useState(false);
    const [busy, setBusy] = useState(false);
    const [notice, setNotice] = useState<{
        text: string;
        error: boolean;
    } | null>(null);
    const [pickerDay, setPickerDay] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState(false);

    useEffect(() => {
        if (plan && !draft) setDraft(toDraft(plan));
    }, [plan, draft]);

    if (isLoading) {
        return <p className="text-muted-foreground text-sm">{t('Loading…')}</p>;
    }
    if (loadError || !plan || !draft) {
        return (
            <p role="alert" className="text-destructive text-sm">
                {t('Plan not found.')}
            </p>
        );
    }

    const update = (change: (current: Draft) => Draft) => {
        setDraft((current) => (current ? change(current) : current));
        setDirty(true);
    };
    const updateDay = (key: string, change: (day: DraftDay) => DraftDay) =>
        update((current) => ({
            ...current,
            days: current.days.map((day) =>
                day.key === key ? change(day) : day,
            ),
        }));
    const updateItem = (
        dayKey: string,
        itemKey: string,
        change: Partial<DraftItem>,
    ) =>
        updateDay(dayKey, (day) => ({
            ...day,
            exercises: day.exercises.map((item) =>
                item.key === itemKey ? { ...item, ...change } : item,
            ),
        }));

    const refresh = async (saved?: PlanDetail) => {
        if (saved) {
            queryClient.setQueryData(['fitnessos', 'plan', planId], saved);
            setDraft(toDraft(saved));
            setDirty(false);
        }
        await queryClient.invalidateQueries({
            queryKey: ['fitnessos', 'plans'],
        });
    };

    const run = async (action: () => Promise<void>) => {
        setBusy(true);
        setNotice(null);
        try {
            await action();
        } catch (cause) {
            setNotice({
                text:
                    cause instanceof Error
                        ? cause.message
                        : t('The request failed.'),
                error: true,
            });
        } finally {
            setBusy(false);
        }
    };

    const save = async () => {
        const result = (await putJson(
            `/fitnessos/plans/${planId}`,
            toPayload(draft),
        )) as { message: string; plan: PlanDetail };
        await refresh(result.plan);
        setNotice({ text: result.message, error: false });
    };

    const activate = () =>
        run(async () => {
            if (dirty) await save();
            const result = (await postJson(
                `/fitnessos/plans/${planId}/activate`,
            )) as { message: string };
            await refresh(
                await getJson<PlanDetail>(`/fitnessos/plans/${planId}`),
            );
            setNotice({ text: result.message, error: false });
        });

    const archive = () =>
        run(async () => {
            const result = (await postJson(
                `/fitnessos/plans/${planId}/archive`,
            )) as { message: string };
            await refresh(
                await getJson<PlanDetail>(`/fitnessos/plans/${planId}`),
            );
            setNotice({ text: result.message, error: false });
        });

    const remove = () =>
        run(async () => {
            await deleteJson(`/fitnessos/plans/${planId}`);
            await refresh();
            await navigate({ to: '/dashboard/workouts' });
        });

    const addExercise = (dayKey: string, exercise: Exercise) =>
        updateDay(dayKey, (day) => ({
            ...day,
            exercises: [
                ...day.exercises,
                {
                    key: newKey(),
                    exercise,
                    sets: '3',
                    reps: '8-12',
                    rest: '90',
                    weight: '',
                    notes: '',
                },
            ],
        }));

    return (
        <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                    <Link
                        to="/dashboard/workouts"
                        className="text-muted-foreground hover:text-foreground text-sm"
                    >
                        {t('All plans')}
                    </Link>
                    <Input
                        aria-label={t('Plan name')}
                        value={draft.title}
                        maxLength={120}
                        onChange={(event) =>
                            update((current) => ({
                                ...current,
                                title: event.target.value,
                            }))
                        }
                        className="font-display mt-2 h-auto border-none bg-transparent px-0 text-3xl font-extrabold shadow-none focus-visible:ring-0 md:text-3xl"
                    />
                    <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-2 text-sm">
                        {plan.template ? (
                            <Badge variant="secondary">{t('Template')}</Badge>
                        ) : (
                            <>
                                <Badge
                                    variant="secondary"
                                    className={cn(
                                        plan.status === 'active' &&
                                            'bg-primary/15 text-primary',
                                    )}
                                >
                                    {t(planStatusLabels[plan.status])}
                                </Badge>
                                <span>
                                    {t('For :name', {
                                        name: plan.trainee?.name ?? '',
                                    })}
                                </span>
                            </>
                        )}
                        {dirty && (
                            <span className="text-sun">
                                {t('Unsaved changes')}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    {plan.template && (
                        <Button asChild variant="outline">
                            <Link
                                to="/dashboard/workouts"
                                search={{ from: planId }}
                            >
                                <Copy />
                                {t('Use for a trainee')}
                            </Link>
                        </Button>
                    )}
                    {!plan.template && plan.status !== 'active' && (
                        <Button
                            variant="outline"
                            disabled={busy}
                            onClick={() => void activate()}
                        >
                            <Play />
                            {t('Activate for trainee')}
                        </Button>
                    )}
                    {plan.status === 'active' && (
                        <Button
                            variant="outline"
                            disabled={busy}
                            onClick={() => void archive()}
                        >
                            <Archive />
                            {t('Archive')}
                        </Button>
                    )}
                    {plan.status !== 'active' && (
                        <Button
                            variant="ghost"
                            className="text-destructive"
                            disabled={busy}
                            onClick={() => setConfirmDelete(true)}
                        >
                            <Trash2 />
                            {t('Delete')}
                        </Button>
                    )}
                    <Button
                        disabled={busy || !dirty}
                        onClick={() => void run(save)}
                    >
                        {busy ? t('Saving…') : t('Save')}
                    </Button>
                </div>
            </div>

            {notice && (
                <p
                    role={notice.error ? 'alert' : 'status'}
                    className={cn(
                        'text-sm',
                        notice.error ? 'text-destructive' : 'text-volt',
                    )}
                >
                    {notice.text}
                </p>
            )}

            <Card className="p-5">
                <Label htmlFor="plan-notes">{t('Notes for the trainee')}</Label>
                <Textarea
                    id="plan-notes"
                    rows={2}
                    className="mt-2"
                    value={draft.notes}
                    placeholder={t(
                        'e.g. Warm up for 10 minutes. Stop any set that hurts.',
                    )}
                    onChange={(event) =>
                        update((current) => ({
                            ...current,
                            notes: event.target.value,
                        }))
                    }
                />
            </Card>

            {draft.days.map((day, dayIndex) => (
                <Card key={day.key} className="flex flex-col gap-4 p-5">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="bg-brand-gradient text-primary-foreground grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-extrabold">
                            {formatNumber(dayIndex + 1)}
                        </span>
                        <Input
                            aria-label={t('Day name')}
                            value={day.title}
                            maxLength={80}
                            onChange={(event) =>
                                updateDay(day.key, (current) => ({
                                    ...current,
                                    title: event.target.value,
                                }))
                            }
                            className="h-9 max-w-xs font-semibold"
                        />
                        <div className="ms-auto flex gap-1">
                            <IconButton
                                label={t('Move day up')}
                                onClick={() =>
                                    update((current) => ({
                                        ...current,
                                        days: move(
                                            current.days,
                                            dayIndex,
                                            dayIndex - 1,
                                        ),
                                    }))
                                }
                            >
                                <ArrowUp />
                            </IconButton>
                            <IconButton
                                label={t('Move day down')}
                                onClick={() =>
                                    update((current) => ({
                                        ...current,
                                        days: move(
                                            current.days,
                                            dayIndex,
                                            dayIndex + 1,
                                        ),
                                    }))
                                }
                            >
                                <ArrowDown />
                            </IconButton>
                            <IconButton
                                label={t('Remove day')}
                                onClick={() =>
                                    update((current) => ({
                                        ...current,
                                        days: current.days.filter(
                                            (item) => item.key !== day.key,
                                        ),
                                    }))
                                }
                            >
                                <Trash2 />
                            </IconButton>
                        </div>
                    </div>

                    {day.exercises.length > 0 && (
                        <div className="text-subtle-foreground hidden grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))_minmax(0,2fr)_auto] gap-2 px-1 text-xs font-semibold lg:grid">
                            <span>{t('Exercise')}</span>
                            <span>{t('Sets')}</span>
                            <span>{t('Reps')}</span>
                            <span>{t('Rest (s)')}</span>
                            <span>{t('Weight (kg)')}</span>
                            <span>{t('Coach note')}</span>
                            <span className="w-[108px]" />
                        </div>
                    )}

                    <ol className="flex flex-col gap-3">
                        {day.exercises.map((item, itemIndex) => (
                            <li
                                key={item.key}
                                className="border-border grid grid-cols-2 gap-2 rounded-lg border p-3 sm:grid-cols-4 lg:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))_minmax(0,2fr)_auto] lg:items-center lg:border-0 lg:p-1"
                            >
                                <div className="col-span-2 min-w-0 sm:col-span-4 lg:col-span-1">
                                    <div className="truncate font-medium">
                                        {exerciseName(item.exercise)}
                                    </div>
                                    <div className="text-subtle-foreground text-xs">
                                        {muscleLabel(
                                            item.exercise.muscle_group,
                                        )}
                                    </div>
                                </div>
                                <Field label={t('Sets')}>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={20}
                                        value={item.sets}
                                        onChange={(event) =>
                                            updateItem(day.key, item.key, {
                                                sets: event.target.value,
                                            })
                                        }
                                    />
                                </Field>
                                <Field label={t('Reps')}>
                                    <Input
                                        value={item.reps}
                                        maxLength={20}
                                        dir="ltr"
                                        onChange={(event) =>
                                            updateItem(day.key, item.key, {
                                                reps: event.target.value,
                                            })
                                        }
                                    />
                                </Field>
                                <Field label={t('Rest (s)')}>
                                    <Input
                                        type="number"
                                        min={0}
                                        max={900}
                                        step={15}
                                        value={item.rest}
                                        onChange={(event) =>
                                            updateItem(day.key, item.key, {
                                                rest: event.target.value,
                                            })
                                        }
                                    />
                                </Field>
                                <Field label={t('Weight (kg)')}>
                                    <Input
                                        type="number"
                                        min={0}
                                        step={0.5}
                                        value={item.weight}
                                        onChange={(event) =>
                                            updateItem(day.key, item.key, {
                                                weight: event.target.value,
                                            })
                                        }
                                    />
                                </Field>
                                <div className="col-span-2 sm:col-span-4 lg:col-span-1">
                                    <Field label={t('Coach note')}>
                                        <Input
                                            value={item.notes}
                                            maxLength={500}
                                            onChange={(event) =>
                                                updateItem(day.key, item.key, {
                                                    notes: event.target.value,
                                                })
                                            }
                                        />
                                    </Field>
                                </div>
                                <div className="col-span-2 flex justify-end gap-1 sm:col-span-4 lg:col-span-1">
                                    <IconButton
                                        label={t('Move exercise up')}
                                        onClick={() =>
                                            updateDay(day.key, (current) => ({
                                                ...current,
                                                exercises: move(
                                                    current.exercises,
                                                    itemIndex,
                                                    itemIndex - 1,
                                                ),
                                            }))
                                        }
                                    >
                                        <ArrowUp />
                                    </IconButton>
                                    <IconButton
                                        label={t('Move exercise down')}
                                        onClick={() =>
                                            updateDay(day.key, (current) => ({
                                                ...current,
                                                exercises: move(
                                                    current.exercises,
                                                    itemIndex,
                                                    itemIndex + 1,
                                                ),
                                            }))
                                        }
                                    >
                                        <ArrowDown />
                                    </IconButton>
                                    <IconButton
                                        label={t('Remove exercise')}
                                        onClick={() =>
                                            updateDay(day.key, (current) => ({
                                                ...current,
                                                exercises:
                                                    current.exercises.filter(
                                                        (other) =>
                                                            other.key !==
                                                            item.key,
                                                    ),
                                            }))
                                        }
                                    >
                                        <Trash2 />
                                    </IconButton>
                                </div>
                            </li>
                        ))}
                    </ol>

                    <Button
                        variant="outline"
                        className="self-start"
                        onClick={() => setPickerDay(day.key)}
                    >
                        <Plus />
                        {t('Add exercise')}
                    </Button>
                </Card>
            ))}

            <Button
                variant="outline"
                className="self-start border-dashed"
                disabled={draft.days.length >= 14}
                onClick={() =>
                    update((current) => ({
                        ...current,
                        days: [
                            ...current.days,
                            {
                                key: newKey(),
                                title: t('Day :number', {
                                    number: current.days.length + 1,
                                }),
                                notes: '',
                                exercises: [],
                            },
                        ],
                    }))
                }
            >
                <Plus />
                {t('Add training day')}
            </Button>

            <ExercisePicker
                open={pickerDay !== null}
                onOpenChange={(open) => !open && setPickerDay(null)}
                onPick={(exercise) =>
                    pickerDay && addExercise(pickerDay, exercise)
                }
            />

            <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {t('Delete this plan?')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {t(
                                'The plan is removed. Sessions the trainee already logged stay in their history.',
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => void remove()}>
                            {t('Delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
    return (
        <label className="grid gap-1">
            <span className="text-subtle-foreground text-xs lg:sr-only">
                {label}
            </span>
            {children}
        </label>
    );
}

function IconButton({
    label,
    onClick,
    children,
}: {
    label: string;
    onClick: () => void;
    children: ReactNode;
}) {
    return (
        <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={label}
            title={label}
            onClick={onClick}
            className="h-8 w-8"
        >
            {children}
        </Button>
    );
}
