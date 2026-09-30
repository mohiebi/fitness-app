import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import {
    Clock,
    Dumbbell,
    MessageSquareText,
    RefreshCcw,
    Star,
    UserCheck,
    UserPlus,
    Users,
} from 'lucide-react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    RadialBar,
    RadialBarChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { PageHeader } from '@fitnessos/components/app-shell';
import { ChartCard, StatCard } from '@fitnessos/components/stat-card';
import { Card } from '@fitnessos/components/ui/card';
import { getJson } from '@fitnessos/lib/api';
import { formatDate, formatNumber } from '@fitnessos/lib/format';
import { t } from '@fitnessos/lib/i18n';
import type { Reports } from '@fitnessos/lib/reports';

export const Route = createFileRoute('/dashboard/reports')({
    component: ReportsPage,
});

const tooltipStyle = {
    background: 'var(--color-popover)',
    border: '1px solid var(--color-border)',
    borderRadius: 12,
};

/** A percentage, or a dash while there is nothing to measure yet. */
function percent(value: number | null): string {
    return value === null ? '—' : `${formatNumber(value)}٪`;
}

function weekLabel(weekStart: string): string {
    return formatDate(weekStart, { month: 'short', day: 'numeric' });
}

function ReportsPage() {
    const { data, isLoading } = useQuery({
        queryKey: ['fitnessos', 'reports'],
        queryFn: () => getJson<Reports>('/fitnessos/reports'),
    });

    if (isLoading || !data) {
        return <p className="text-muted-foreground text-sm">{t('Loading…')}</p>;
    }

    const { summary } = data;
    const empty = summary.active_trainees === 0 && summary.new_trainees === 0;
    const growth = data.growth.map((row) => ({
        ...row,
        label: weekLabel(row.week_start),
    }));
    const sessions = data.sessions.map((row) => ({
        ...row,
        label: weekLabel(row.week_start),
    }));
    const checkins = data.checkins.map((row) => ({
        ...row,
        label: weekLabel(row.week_start),
    }));

    return (
        <div>
            <PageHeader
                title={t('Reports')}
                description={t(
                    'Your numbers, worked out from your trainees, workouts and check-ins.',
                )}
            />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    label={t('Active trainees')}
                    value={summary.active_trainees}
                    icon={Users}
                />
                <StatCard
                    label={t('New in 30 days')}
                    value={summary.new_trainees}
                    icon={UserPlus}
                />
                <StatCard
                    label={t('Retention')}
                    value={percent(summary.retention)}
                    hint={t('still training after 30 days')}
                    delta={t('of trainees')}
                    trend="flat"
                    icon={RefreshCcw}
                />
                <StatCard
                    label={t('Requests accepted')}
                    value={percent(summary.acceptance)}
                    hint={t('last 90 days')}
                    delta={t('of answered requests')}
                    trend="flat"
                    icon={UserCheck}
                />
                <StatCard
                    label={t('Workouts completed')}
                    value={percent(summary.workout_completion)}
                    hint={t('last 4 weeks')}
                    delta={t('of planned sessions')}
                    trend="flat"
                    icon={Dumbbell}
                />
                <StatCard
                    label={t('Check-ins reviewed')}
                    value={percent(summary.checkin_response)}
                    hint={t('last 4 weeks')}
                    delta={t('of check-ins received')}
                    trend="flat"
                    icon={MessageSquareText}
                />
                <StatCard
                    label={t('Average review time')}
                    value={
                        summary.avg_review_hours === null
                            ? '—'
                            : t(':hours h', {
                                  hours: formatNumber(summary.avg_review_hours),
                              })
                    }
                    icon={Clock}
                />
                <StatCard
                    label={t('Rating')}
                    value={
                        summary.rating === null
                            ? '—'
                            : formatNumber(summary.rating)
                    }
                    hint={t(':count reviews', {
                        count: formatNumber(summary.review_count),
                    })}
                    delta={t('out of 5')}
                    trend="flat"
                    icon={Star}
                />
            </div>

            {empty && (
                <Card className="mt-6 p-6">
                    <p className="text-muted-foreground text-sm">
                        {t(
                            'No data yet. Once you have trainees, their workouts and check-ins show up here.',
                        )}{' '}
                        <Link
                            to="/dashboard/requests"
                            className="text-primary font-semibold hover:underline"
                        >
                            {t('View requests')}
                        </Link>
                    </p>
                </Card>
            )}

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <ChartCard
                        title={t('Trainee growth')}
                        description={t(
                            'Active trainees and new ones each week',
                        )}
                    >
                        <div className="h-72">
                            <ResponsiveContainer>
                                <LineChart data={growth}>
                                    <CartesianGrid
                                        stroke="var(--color-border)"
                                        strokeDasharray="3 3"
                                        vertical={false}
                                    />
                                    <XAxis
                                        dataKey="label"
                                        stroke="var(--color-muted-foreground)"
                                        fontSize={12}
                                    />
                                    <YAxis
                                        allowDecimals={false}
                                        stroke="var(--color-muted-foreground)"
                                        fontSize={12}
                                        tickFormatter={(v: number) =>
                                            formatNumber(v)
                                        }
                                    />
                                    <Tooltip
                                        contentStyle={tooltipStyle}
                                        formatter={(v) =>
                                            formatNumber(Number(v))
                                        }
                                    />
                                    <Legend wrapperStyle={{ fontSize: 12 }} />
                                    <Line
                                        dataKey="active"
                                        name={t('Active trainees')}
                                        stroke="var(--color-chart-1)"
                                        strokeWidth={2.5}
                                    />
                                    <Line
                                        dataKey="started"
                                        name={t('New trainees')}
                                        stroke="var(--color-chart-2)"
                                        strokeWidth={2.5}
                                    />
                                    <Line
                                        dataKey="ended"
                                        name={t('Ended')}
                                        stroke="var(--color-chart-3)"
                                        strokeWidth={2}
                                        strokeDasharray="4 4"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </ChartCard>
                </div>

                <ChartCard
                    title={t('Workouts completed')}
                    description={t('Last 4 weeks, against the plans')}
                >
                    <div className="h-72">
                        {summary.workout_completion === null ? (
                            <p className="text-muted-foreground pt-24 text-center text-sm">
                                {t('No active plans yet.')}
                            </p>
                        ) : (
                            <ResponsiveContainer>
                                <RadialBarChart
                                    innerRadius="50%"
                                    outerRadius="90%"
                                    data={[
                                        {
                                            name: t('Workouts completed'),
                                            value: summary.workout_completion,
                                            fill: 'var(--color-chart-1)',
                                        },
                                    ]}
                                    startAngle={90}
                                    endAngle={-270}
                                >
                                    <RadialBar
                                        background
                                        dataKey="value"
                                        cornerRadius={20}
                                    />
                                    <text
                                        x="50%"
                                        y="50%"
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        className="fill-foreground"
                                        style={{
                                            fontSize: 40,
                                            fontWeight: 600,
                                        }}
                                    >
                                        {percent(summary.workout_completion)}
                                    </text>
                                </RadialBarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </ChartCard>

                <div className="lg:col-span-2">
                    <ChartCard
                        title={t('Sessions each week')}
                        description={t(
                            'Workouts your trainees logged, against what their plans ask for',
                        )}
                    >
                        <div className="h-64">
                            <ResponsiveContainer>
                                <BarChart data={sessions}>
                                    <CartesianGrid
                                        stroke="var(--color-border)"
                                        strokeDasharray="3 3"
                                        vertical={false}
                                    />
                                    <XAxis
                                        dataKey="label"
                                        stroke="var(--color-muted-foreground)"
                                        fontSize={12}
                                    />
                                    <YAxis
                                        allowDecimals={false}
                                        stroke="var(--color-muted-foreground)"
                                        fontSize={12}
                                        tickFormatter={(v: number) =>
                                            formatNumber(v)
                                        }
                                    />
                                    <Tooltip
                                        contentStyle={tooltipStyle}
                                        formatter={(v) =>
                                            formatNumber(Number(v))
                                        }
                                    />
                                    <Legend wrapperStyle={{ fontSize: 12 }} />
                                    <Bar
                                        dataKey="done"
                                        name={t('Logged')}
                                        fill="var(--color-chart-1)"
                                        radius={[6, 6, 0, 0]}
                                    />
                                    <Bar
                                        dataKey="planned"
                                        name={t('Planned per week')}
                                        fill="var(--color-chart-2)"
                                        radius={[6, 6, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </ChartCard>
                </div>

                <ChartCard
                    title={t('Check-ins each week')}
                    description={t('Received and reviewed')}
                >
                    <div className="h-64">
                        <ResponsiveContainer>
                            <BarChart data={checkins}>
                                <CartesianGrid
                                    stroke="var(--color-border)"
                                    strokeDasharray="3 3"
                                    vertical={false}
                                />
                                <XAxis
                                    dataKey="label"
                                    stroke="var(--color-muted-foreground)"
                                    fontSize={12}
                                />
                                <YAxis
                                    allowDecimals={false}
                                    stroke="var(--color-muted-foreground)"
                                    fontSize={12}
                                    tickFormatter={(v: number) =>
                                        formatNumber(v)
                                    }
                                />
                                <Tooltip
                                    contentStyle={tooltipStyle}
                                    formatter={(v) => formatNumber(Number(v))}
                                />
                                <Legend wrapperStyle={{ fontSize: 12 }} />
                                <Bar
                                    dataKey="submitted"
                                    name={t('Received')}
                                    fill="var(--color-chart-2)"
                                    radius={[6, 6, 0, 0]}
                                />
                                <Bar
                                    dataKey="reviewed"
                                    name={t('Reviewed')}
                                    fill="var(--color-chart-1)"
                                    radius={[6, 6, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>

                <div className="lg:col-span-3">
                    <ChartCard
                        title={t('Adherence by trainee')}
                        description={t(
                            'Sessions in the last 4 weeks against the plan, lowest first',
                        )}
                    >
                        {data.trainees.length === 0 ? (
                            <p className="text-muted-foreground text-sm">
                                {t('You have no trainees yet.')}
                            </p>
                        ) : (
                            <ul className="divide-border/60 divide-y">
                                {data.trainees.map((trainee) => (
                                    <li
                                        key={trainee.id}
                                        className="flex items-center gap-4 py-3"
                                    >
                                        <Link
                                            to="/dashboard/clients/$id"
                                            params={{ id: String(trainee.id) }}
                                            className="min-w-0 flex-1 truncate text-sm font-medium hover:underline"
                                        >
                                            {trainee.name}
                                        </Link>
                                        <div className="bg-muted h-2 w-40 overflow-hidden rounded-full">
                                            <div
                                                className="bg-primary h-full rounded-full"
                                                style={{
                                                    width: `${trainee.percent ?? 0}%`,
                                                }}
                                            />
                                        </div>
                                        <span className="text-muted-foreground w-28 text-end text-xs tabular-nums">
                                            {trainee.percent === null
                                                ? t('No plan')
                                                : t(':done of :planned', {
                                                      done: formatNumber(
                                                          trainee.done,
                                                      ),
                                                      planned: formatNumber(
                                                          trainee.planned,
                                                      ),
                                                  })}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </ChartCard>
                </div>
            </div>
        </div>
    );
}
