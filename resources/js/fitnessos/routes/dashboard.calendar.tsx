import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    Dumbbell,
    MapPin,
    MessageSquareText,
    Phone,
    Trash2,
    UserPlus,
    Video,
    Wallet,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { PageHeader } from '@fitnessos/components/app-shell';
import { CalendarEventDialog } from '@fitnessos/components/calendar-event-dialog';
import { Badge } from '@fitnessos/components/ui/badge';
import { Button } from '@fitnessos/components/ui/button';
import { Card } from '@fitnessos/components/ui/card';
import { deleteJson, getJson } from '@fitnessos/lib/api';
import {
    type ActivityType,
    type CalendarActivity,
    type CalendarData,
    type CalendarEvent,
    dayKey,
    dayNumber,
    eventKinds,
    inMonth,
    monthGrid,
    monthTitle,
    startOfDay,
    timeLabel,
    weekdayLabels,
} from '@fitnessos/lib/calendar';
import { formatDate, formatNumber } from '@fitnessos/lib/format';
import { sep, t } from '@fitnessos/lib/i18n';
import { cn } from '@fitnessos/lib/utils';

export const Route = createFileRoute('/dashboard/calendar')({
    component: CalendarPage,
});

const kindIcons = {
    call: Phone,
    video: Video,
    in_person: MapPin,
    other: ClipboardList,
};

const activityStyle: Record<
    ActivityType | 'subscription',
    { icon: typeof Dumbbell; label: string }
> = {
    session: { icon: Dumbbell, label: 'Sessions' },
    checkin: { icon: MessageSquareText, label: 'Check-ins' },
    started: { icon: UserPlus, label: 'New trainees' },
    plan: { icon: ClipboardList, label: 'Plans activated' },
    subscription: { icon: Wallet, label: 'Subscription ends' },
};

function kindLabel(kind: CalendarEvent['kind']): string {
    return t(
        eventKinds.find((option) => option.value === kind)?.label ??
            'Something else',
    );
}

/** Which day (local) an activity row belongs on. Sessions carry a plain date. */
function activityDay(activity: CalendarActivity): string {
    return activity.type === 'session'
        ? activity.at
        : dayKey(new Date(activity.at));
}

function CalendarPage() {
    const queryClient = useQueryClient();
    const [anchor, setAnchor] = useState(() => new Date());
    const [selected, setSelected] = useState(() => startOfDay(new Date()));
    const [adding, setAdding] = useState(false);

    const grid = useMemo(() => monthGrid(anchor), [anchor]);
    const from = grid.first.toISOString();
    const to = grid.end.toISOString();

    const { data } = useQuery({
        queryKey: ['fitnessos', 'calendar', from, to],
        queryFn: () =>
            getJson<CalendarData>(
                `/fitnessos/calendar?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
            ),
        placeholderData: (previous) => previous,
    });

    const refresh = () =>
        queryClient.invalidateQueries({ queryKey: ['fitnessos', 'calendar'] });

    const remove = async (event: CalendarEvent) => {
        await deleteJson(`/fitnessos/calendar/events/${event.id}`);
        await refresh();
    };

    const byDay = useMemo(() => {
        const events = new Map<string, CalendarEvent[]>();
        const activity = new Map<string, CalendarActivity[]>();

        for (const event of data?.events ?? []) {
            const key = dayKey(new Date(event.starts_at));
            events.set(key, [...(events.get(key) ?? []), event]);
        }
        for (const row of data?.activity ?? []) {
            const key = activityDay(row);
            activity.set(key, [...(activity.get(key) ?? []), row]);
        }

        return { events, activity };
    }, [data]);

    const subscriptionDay = data?.subscription_ends_at
        ? dayKey(new Date(data.subscription_ends_at))
        : null;
    const todayKey = dayKey(new Date());
    const selectedKey = dayKey(selected);
    const selectedEvents = byDay.events.get(selectedKey) ?? [];
    const selectedActivity = byDay.activity.get(selectedKey) ?? [];

    return (
        <div>
            <PageHeader
                title={t('Calendar')}
                description={monthTitle(grid.start)}
                actions={
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            aria-label={t('Previous month')}
                            onClick={() => setAnchor(grid.previous)}
                        >
                            <ChevronRight className="h-4 w-4 ltr:hidden" />
                            <ChevronLeft className="h-4 w-4 rtl:hidden" />
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setAnchor(new Date());
                                setSelected(startOfDay(new Date()));
                            }}
                        >
                            {t('Today')}
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            aria-label={t('Next month')}
                            onClick={() => setAnchor(grid.next)}
                        >
                            <ChevronLeft className="h-4 w-4 ltr:hidden" />
                            <ChevronRight className="h-4 w-4 rtl:hidden" />
                        </Button>
                        <Button onClick={() => setAdding(true)}>
                            {t('New event')}
                        </Button>
                    </div>
                }
            />

            <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
                <Card className="p-4 sm:p-6">
                    <div className="text-muted-foreground mb-3 grid grid-cols-7 text-center text-sm font-medium">
                        {weekdayLabels().map((label) => (
                            <div key={label}>{label}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {grid.days.map((day) => {
                            const key = dayKey(day);
                            const events = byDay.events.get(key) ?? [];
                            const activity = byDay.activity.get(key) ?? [];
                            const counts = (
                                [
                                    'session',
                                    'checkin',
                                    'started',
                                    'plan',
                                ] as const
                            )
                                .map((type) => ({
                                    type,
                                    count: activity.filter(
                                        (row) => row.type === type,
                                    ).length,
                                }))
                                .filter((entry) => entry.count > 0);

                            return (
                                <button
                                    type="button"
                                    key={key}
                                    onClick={() => setSelected(day)}
                                    aria-label={formatDate(day)}
                                    aria-pressed={key === selectedKey}
                                    className={cn(
                                        'min-h-[84px] rounded-lg border p-1.5 text-start text-xs transition-colors sm:min-h-[100px] sm:p-2',
                                        key === selectedKey
                                            ? 'border-primary bg-primary/10'
                                            : key === todayKey
                                              ? 'border-primary/60 bg-primary/5'
                                              : 'border-border/60 hover:bg-muted/40',
                                        !inMonth(
                                            day,
                                            grid.start,
                                            grid.length,
                                        ) && 'opacity-40',
                                    )}
                                >
                                    <div
                                        className={cn(
                                            'font-semibold',
                                            key === todayKey
                                                ? 'text-primary'
                                                : 'text-muted-foreground',
                                        )}
                                    >
                                        {dayNumber(day)}
                                    </div>
                                    <div className="mt-1 space-y-1">
                                        {events.slice(0, 2).map((event) => (
                                            <div
                                                key={event.id}
                                                className="bg-primary/15 text-primary truncate rounded px-1.5 py-0.5 text-[10px]"
                                            >
                                                {timeLabel(event.starts_at)}{' '}
                                                {event.title}
                                            </div>
                                        ))}
                                        {events.length > 2 && (
                                            <div className="text-muted-foreground text-[10px]">
                                                {t('+:count more', {
                                                    count: formatNumber(
                                                        events.length - 2,
                                                    ),
                                                })}
                                            </div>
                                        )}
                                        <div className="text-muted-foreground flex flex-wrap gap-x-2 gap-y-0.5 text-[10px]">
                                            {counts.map(({ type, count }) => {
                                                const Icon =
                                                    activityStyle[type].icon;

                                                return (
                                                    <span
                                                        key={type}
                                                        className="inline-flex items-center gap-0.5"
                                                        title={t(
                                                            activityStyle[type]
                                                                .label,
                                                        )}
                                                    >
                                                        <Icon className="h-3 w-3" />
                                                        {formatNumber(count)}
                                                    </span>
                                                );
                                            })}
                                            {key === subscriptionDay && (
                                                <Wallet
                                                    className="text-destructive h-3 w-3"
                                                    aria-label={t(
                                                        'Subscription ends',
                                                    )}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </Card>

                <div className="flex flex-col gap-6">
                    <Card className="h-fit p-6">
                        <h3 className="font-semibold">
                            {formatDate(selected, {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                            })}
                        </h3>

                        {selectedEvents.length === 0 &&
                            selectedActivity.length === 0 &&
                            selectedKey !== subscriptionDay && (
                                <p className="text-muted-foreground mt-3 text-sm">
                                    {t('Nothing on this day.')}
                                </p>
                            )}

                        <div className="mt-4 space-y-3">
                            {selectedKey === subscriptionDay && (
                                <div className="border-destructive/40 flex items-center gap-3 rounded-xl border p-3 text-sm">
                                    <Wallet className="text-destructive h-4 w-4" />
                                    {t('Your subscription ends today.')}
                                </div>
                            )}
                            {selectedEvents.map((event) => (
                                <EventRow
                                    key={event.id}
                                    event={event}
                                    onDelete={() => void remove(event)}
                                />
                            ))}
                            {selectedActivity.map((row, index) => {
                                const { icon: Icon, label } =
                                    activityStyle[row.type];

                                return (
                                    <div
                                        key={`${row.type}-${index}`}
                                        className="text-muted-foreground flex items-start gap-3 text-sm"
                                    >
                                        <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                                        <span>
                                            <span className="text-foreground font-medium">
                                                {row.trainee.name}
                                            </span>
                                            {sep()}
                                            {t(label)}
                                            {row.label &&
                                                row.type !== 'checkin' &&
                                                `${sep()}${row.label}`}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>

                    <Card className="h-fit p-6">
                        <h3 className="font-semibold">{t('Upcoming')}</h3>
                        {(data?.upcoming ?? []).length === 0 ? (
                            <p className="text-muted-foreground mt-3 text-sm">
                                {t('No upcoming events.')}
                            </p>
                        ) : (
                            <div className="mt-4 space-y-3">
                                {data?.upcoming.map((event) => (
                                    <EventRow
                                        key={event.id}
                                        event={event}
                                        showDate
                                        onDelete={() => void remove(event)}
                                    />
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
            </div>

            {adding && (
                <CalendarEventDialog
                    open
                    onOpenChange={setAdding}
                    day={selected}
                    onCreated={refresh}
                />
            )}
        </div>
    );
}

function EventRow({
    event,
    onDelete,
    showDate = false,
}: {
    event: CalendarEvent;
    onDelete: () => void;
    showDate?: boolean;
}) {
    const Icon = kindIcons[event.kind];

    return (
        <div className="border-border/60 flex items-center gap-3 rounded-xl border p-3">
            <div className="bg-primary/10 text-primary grid h-10 w-10 shrink-0 place-items-center rounded-lg">
                <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">
                    {event.title}
                </div>
                <div className="text-muted-foreground truncate text-xs">
                    {showDate &&
                        `${formatDate(event.starts_at, { month: 'short', day: 'numeric' })}${sep()}`}
                    {timeLabel(event.starts_at)}
                    {event.duration_minutes &&
                        `${sep()}${t(':minutes min', { minutes: formatNumber(event.duration_minutes) })}`}
                    {event.trainee && `${sep()}${event.trainee.name}`}
                </div>
                <Badge variant="secondary" className="mt-1">
                    {kindLabel(event.kind)}
                </Badge>
            </div>
            <Button
                variant="ghost"
                size="icon"
                aria-label={t('Delete event')}
                onClick={onDelete}
            >
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    );
}
