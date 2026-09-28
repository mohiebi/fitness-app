import { Card } from '@fitnessos/components/ui/card';
import { formatDate, formatNumber } from '@fitnessos/lib/format';
import { locale, t } from '@fitnessos/lib/i18n';
import {
    groupSets,
    type Adherence,
    type WorkoutLogData,
} from '@fitnessos/lib/training';
import { cn } from '@fitnessos/lib/utils';

/** Sessions done per week against the plan, newest week first. */
export function AdherenceCard({ adherence }: { adherence: Adherence }) {
    const planned = adherence.planned_per_week;
    const thisWeek = adherence.weeks[0]?.done ?? 0;
    const scale = Math.max(
        planned,
        ...adherence.weeks.map((week) => week.done),
        1,
    );

    return (
        <Card className="flex flex-col gap-4 p-5">
            <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-semibold">{t('Last 7 days')}</h2>
                <span className="font-display text-2xl font-extrabold">
                    {planned > 0
                        ? t(':done of :planned sessions', {
                              done: formatNumber(thisWeek),
                              planned: formatNumber(planned),
                          })
                        : t(':done sessions', { done: formatNumber(thisWeek) })}
                </span>
            </div>
            <ol
                className="grid grid-cols-4 items-end gap-3"
                aria-label={t('Sessions per week')}
            >
                {[...adherence.weeks].reverse().map((week, index, weeks) => {
                    const current = index === weeks.length - 1;
                    const met = planned > 0 && week.done >= planned;
                    return (
                        <li
                            key={week.starts_on}
                            className="flex flex-col items-center gap-1.5"
                        >
                            <span className="text-xs font-semibold">
                                {formatNumber(week.done)}
                            </span>
                            <div className="bg-secondary flex h-20 w-full items-end overflow-hidden rounded-md">
                                <div
                                    className={cn(
                                        'w-full rounded-md',
                                        met
                                            ? 'bg-primary'
                                            : current
                                              ? 'bg-aqua'
                                              : 'bg-input',
                                    )}
                                    style={{
                                        height: `${Math.max((week.done / scale) * 100, 4)}%`,
                                    }}
                                />
                            </div>
                            <span className="text-subtle-foreground text-[11px]">
                                {current
                                    ? t('This week')
                                    : formatDate(week.starts_on, {
                                          day: 'numeric',
                                          month: 'short',
                                      })}
                            </span>
                        </li>
                    );
                })}
            </ol>
            {planned === 0 && (
                <p className="text-muted-foreground text-xs">
                    {t('No active plan, so there is no weekly target yet.')}
                </p>
            )}
        </Card>
    );
}

/** A list of logged sessions with their sets grouped by exercise. */
export function SessionList({
    logs,
    empty,
    onDelete,
}: {
    logs: WorkoutLogData[];
    empty: string;
    onDelete?: (log: WorkoutLogData) => void;
}) {
    if (logs.length === 0) {
        return <p className="text-muted-foreground text-sm">{empty}</p>;
    }

    return (
        <ol className="flex flex-col gap-3">
            {logs.map((log) => (
                <li
                    key={log.id}
                    className="border-border rounded-xl border p-4"
                >
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="font-semibold">{log.title}</span>
                        <span className="text-muted-foreground text-sm">
                            {formatDate(log.performed_on, {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                            })}
                        </span>
                        {log.effort !== null && (
                            <span className="text-muted-foreground text-xs">
                                {t('Effort :value/10', {
                                    value: formatNumber(log.effort),
                                })}
                            </span>
                        )}
                        {log.duration_minutes !== null && (
                            <span className="text-muted-foreground text-xs">
                                {t(':value min', {
                                    value: formatNumber(log.duration_minutes),
                                })}
                            </span>
                        )}
                        {onDelete && (
                            <button
                                type="button"
                                onClick={() => onDelete(log)}
                                className="text-subtle-foreground hover:text-destructive ms-auto text-xs"
                            >
                                {t('Delete')}
                            </button>
                        )}
                    </div>
                    <ul className="mt-2 grid gap-1 text-sm">
                        {groupSets(log.sets).map((group) => (
                            <li
                                key={group.name}
                                className="flex flex-wrap gap-x-2"
                            >
                                <span className="font-medium">
                                    {group.name}
                                </span>
                                <span
                                    className="text-muted-foreground"
                                    dir="auto"
                                >
                                    {group.sets
                                        .filter((set) => set.completed)
                                        .map((set) =>
                                            set.weight_kg !== null
                                                ? `${formatNumber(set.reps ?? 0)}×${formatNumber(set.weight_kg)}`
                                                : formatNumber(set.reps ?? 0),
                                        )
                                        .join(locale() === 'fa' ? '، ' : ', ')}
                                </span>
                            </li>
                        ))}
                    </ul>
                    {log.notes && (
                        <p className="text-muted-foreground mt-2 text-sm whitespace-pre-line">
                            {log.notes}
                        </p>
                    )}
                </li>
            ))}
        </ol>
    );
}
