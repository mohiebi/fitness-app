import {
    keepPreviousData,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { useDeferredValue, useState, type FormEvent } from 'react';
import { Button } from '@fitnessos/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@fitnessos/components/ui/dialog';
import { Input } from '@fitnessos/components/ui/input';
import { Label } from '@fitnessos/components/ui/label';
import { getJson, postJson } from '@fitnessos/lib/api';
import { t } from '@fitnessos/lib/i18n';
import {
    equipmentTypes,
    exerciseName,
    muscleGroups,
    muscleLabel,
    type Exercise,
} from '@fitnessos/lib/training';
import { cn } from '@fitnessos/lib/utils';

/** Search the exercise library (or add a custom exercise) and pick one. */
export function ExercisePicker({
    open,
    onOpenChange,
    onPick,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onPick: (exercise: Exercise) => void;
}) {
    const [q, setQ] = useState('');
    const [group, setGroup] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);
    const filters = useDeferredValue({ q, group });

    const params = new URLSearchParams();
    if (filters.q.trim()) params.set('q', filters.q.trim());
    if (filters.group) params.set('muscle_group', filters.group);

    const { data: exercises = [], isLoading } = useQuery({
        queryKey: ['fitnessos', 'exercises', params.toString()],
        queryFn: () => getJson<Exercise[]>(`/fitnessos/exercises?${params}`),
        enabled: open,
        placeholderData: keepPreviousData,
    });

    const pick = (exercise: Exercise) => {
        onPick(exercise);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[85vh] overflow-hidden sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>{t('Add an exercise')}</DialogTitle>
                </DialogHeader>

                {creating ? (
                    <CustomExerciseForm
                        initialName={q}
                        onCancel={() => setCreating(false)}
                        onCreated={(exercise) => {
                            setCreating(false);
                            pick(exercise);
                        }}
                    />
                ) : (
                    <div className="flex min-h-0 flex-col gap-3">
                        <div className="relative">
                            <Search className="text-subtle-foreground pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                            <Input
                                autoFocus
                                value={q}
                                onChange={(event) => setQ(event.target.value)}
                                placeholder={t('Search exercises')}
                                aria-label={t('Search exercises')}
                                className="ps-9"
                            />
                        </div>
                        <div
                            className="flex flex-wrap gap-1.5"
                            role="group"
                            aria-label={t('Muscle group')}
                        >
                            {Object.keys(muscleGroups).map((key) => (
                                <button
                                    key={key}
                                    type="button"
                                    aria-pressed={group === key}
                                    onClick={() =>
                                        setGroup(group === key ? null : key)
                                    }
                                    className={cn(
                                        'rounded-full border px-2.5 py-1 text-xs font-semibold',
                                        group === key
                                            ? 'border-primary bg-primary text-primary-foreground'
                                            : 'border-border text-muted-foreground hover:text-foreground',
                                    )}
                                >
                                    {muscleLabel(key)}
                                </button>
                            ))}
                        </div>
                        <ul className="divide-border -mx-2 max-h-[45vh] divide-y overflow-y-auto">
                            {exercises.map((exercise) => (
                                <li key={exercise.id}>
                                    <button
                                        type="button"
                                        onClick={() => pick(exercise)}
                                        className="hover:bg-secondary flex w-full items-center justify-between gap-3 rounded-md px-2 py-2.5 text-start"
                                    >
                                        <span className="font-medium">
                                            {exerciseName(exercise)}
                                        </span>
                                        <span className="text-muted-foreground shrink-0 text-xs">
                                            {muscleLabel(exercise.muscle_group)}
                                            {' · '}
                                            {t(
                                                equipmentTypes[
                                                    exercise.equipment
                                                ] ?? exercise.equipment,
                                            )}
                                            {exercise.custom &&
                                                ` · ${t('Custom')}`}
                                        </span>
                                    </button>
                                </li>
                            ))}
                            {!isLoading && exercises.length === 0 && (
                                <li className="text-muted-foreground px-2 py-6 text-center text-sm">
                                    {t('No exercises match.')}
                                </li>
                            )}
                        </ul>
                        <Button
                            variant="outline"
                            onClick={() => setCreating(true)}
                        >
                            <Plus />
                            {t('Create a custom exercise')}
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

function CustomExerciseForm({
    initialName,
    onCancel,
    onCreated,
}: {
    initialName: string;
    onCancel: () => void;
    onCreated: (exercise: Exercise) => void;
}) {
    const queryClient = useQueryClient();
    const [name, setName] = useState(initialName);
    const [group, setGroup] = useState('legs');
    const [equipment, setEquipment] = useState('bodyweight');
    const [videoUrl, setVideoUrl] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        setBusy(true);
        setError(null);
        try {
            const exercise = (await postJson('/fitnessos/exercises', {
                name: name.trim(),
                muscle_group: group,
                equipment,
                video_url: videoUrl.trim() || null,
            })) as Exercise;
            await queryClient.invalidateQueries({
                queryKey: ['fitnessos', 'exercises'],
            });
            onCreated(exercise);
        } catch (cause) {
            setError(
                cause instanceof Error
                    ? cause.message
                    : t('The request failed.'),
            );
        } finally {
            setBusy(false);
        }
    };

    return (
        <form className="grid gap-4" onSubmit={submit}>
            <div className="grid gap-1.5">
                <Label htmlFor="exercise-name">{t('Exercise name')}</Label>
                <Input
                    id="exercise-name"
                    required
                    maxLength={120}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
                <Choice
                    id="exercise-group"
                    label={t('Muscle group')}
                    value={group}
                    options={muscleGroups}
                    onChange={setGroup}
                />
                <Choice
                    id="exercise-equipment"
                    label={t('Equipment')}
                    value={equipment}
                    options={equipmentTypes}
                    onChange={setEquipment}
                />
            </div>
            <div className="grid gap-1.5">
                <Label htmlFor="exercise-video">
                    {t('Demo video link (optional)')}
                </Label>
                <Input
                    id="exercise-video"
                    type="url"
                    dir="ltr"
                    placeholder="https://"
                    value={videoUrl}
                    onChange={(event) => setVideoUrl(event.target.value)}
                />
            </div>
            {error && (
                <p role="alert" className="text-destructive text-sm">
                    {error}
                </p>
            )}
            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onCancel}>
                    {t('Back')}
                </Button>
                <Button type="submit" disabled={busy || !name.trim()}>
                    {busy ? t('Saving…') : t('Add exercise')}
                </Button>
            </div>
        </form>
    );
}

function Choice({
    id,
    label,
    value,
    options,
    onChange,
}: {
    id: string;
    label: string;
    value: string;
    options: Record<string, string>;
    onChange: (value: string) => void;
}) {
    return (
        <div className="grid gap-1.5">
            <Label htmlFor={id}>{label}</Label>
            <select
                id={id}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="border-input bg-background h-9 rounded-md border px-3 text-sm"
            >
                {Object.entries(options).map(([key, option]) => (
                    <option key={key} value={key}>
                        {t(option)}
                    </option>
                ))}
            </select>
        </div>
    );
}
