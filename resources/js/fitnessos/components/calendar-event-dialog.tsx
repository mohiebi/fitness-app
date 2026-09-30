import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@fitnessos/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@fitnessos/components/ui/dialog';
import { Input } from '@fitnessos/components/ui/input';
import { Label } from '@fitnessos/components/ui/label';
import { Textarea } from '@fitnessos/components/ui/textarea';
import { getJson, postJson } from '@fitnessos/lib/api';
import { type EventKind, eventKinds } from '@fitnessos/lib/calendar';
import { t } from '@fitnessos/lib/i18n';

const selectClass =
    'border-input bg-background h-9 w-full rounded-md border px-3 text-sm';

/** The value a datetime-local input wants: local time, no timezone. */
function localInputValue(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Adds an appointment to the coach's calendar, optionally with a trainee. */
export function CalendarEventDialog({
    open,
    onOpenChange,
    day,
    onCreated,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    day: Date;
    onCreated: () => void | Promise<void>;
}) {
    const [title, setTitle] = useState('');
    const [kind, setKind] = useState<EventKind>('video');
    const [startsAt, setStartsAt] = useState(() => {
        const start = new Date(day);
        start.setHours(9, 0, 0, 0);

        return localInputValue(start);
    });
    const [duration, setDuration] = useState('');
    const [traineeId, setTraineeId] = useState('');
    const [notes, setNotes] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { data: trainees = [] } = useQuery({
        queryKey: ['fitnessos', 'clients'],
        queryFn: () =>
            getJson<{ id: string; name: string }[]>('/fitnessos/clients'),
        enabled: open,
    });

    const save = async () => {
        setBusy(true);
        setError(null);
        try {
            await postJson('/fitnessos/calendar/events', {
                title,
                kind,
                starts_at: new Date(startsAt).toISOString(),
                duration_minutes: duration ? Number(duration) : null,
                trainee_id: traineeId ? Number(traineeId) : null,
                notes: notes || null,
            });
            onOpenChange(false);
            setTitle('');
            setNotes('');
            setDuration('');
            setTraineeId('');
            await onCreated();
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
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('New event')}</DialogTitle>
                    <DialogDescription>
                        {t(
                            'Add a call, video session or in-person session to your calendar.',
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="event-title">{t('Title')}</Label>
                        <Input
                            id="event-title"
                            value={title}
                            maxLength={120}
                            onChange={(event) => setTitle(event.target.value)}
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="event-kind">{t('Type')}</Label>
                            <select
                                id="event-kind"
                                className={selectClass}
                                value={kind}
                                onChange={(event) =>
                                    setKind(event.target.value as EventKind)
                                }
                            >
                                {eventKinds.map((option) => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {t(option.label)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="event-trainee">
                                {t('Trainee')}
                            </Label>
                            <select
                                id="event-trainee"
                                className={selectClass}
                                value={traineeId}
                                onChange={(event) =>
                                    setTraineeId(event.target.value)
                                }
                            >
                                <option value="">
                                    {t('No one in particular')}
                                </option>
                                {trainees.map((trainee) => (
                                    <option key={trainee.id} value={trainee.id}>
                                        {trainee.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="event-start">
                                {t('Date and time')}
                            </Label>
                            <Input
                                id="event-start"
                                type="datetime-local"
                                value={startsAt}
                                onChange={(event) =>
                                    setStartsAt(event.target.value)
                                }
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="event-duration">
                                {t('Length in minutes (optional)')}
                            </Label>
                            <Input
                                id="event-duration"
                                type="number"
                                min={5}
                                max={600}
                                value={duration}
                                onChange={(event) =>
                                    setDuration(event.target.value)
                                }
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="event-notes">
                            {t('Notes (optional)')}
                        </Label>
                        <Textarea
                            id="event-notes"
                            rows={3}
                            maxLength={1000}
                            value={notes}
                            onChange={(event) => setNotes(event.target.value)}
                        />
                    </div>
                </div>

                {error && (
                    <p role="alert" className="text-destructive text-sm">
                        {error}
                    </p>
                )}

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        {t('Cancel')}
                    </Button>
                    <Button
                        disabled={busy || title.trim() === '' || !startsAt}
                        onClick={() => void save()}
                    >
                        {busy ? t('Saving…') : t('Add event')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
