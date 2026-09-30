import { createFileRoute } from '@tanstack/react-router';
import { formatNumber } from '@fitnessos/lib/format';
import { PageHeader } from '@fitnessos/components/app-shell';
import { Card } from '@fitnessos/components/ui/card';
import {
    weightSeries,
    strengthSeries,
    adherenceSeries,
} from '@fitnessos/lib/mock-data';
import {
    Line,
    LineChart,
    AreaChart,
    Area,
    BarChart,
    Bar,
    ResponsiveContainer,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    Legend,
} from 'recharts';

import { t } from '@fitnessos/lib/i18n';
export const Route = createFileRoute('/dashboard/progress')({
    component: Progress,
});

// Sample data labels ("W3", "Mon") shown in the page's language.
const week = (label: string) =>
    t('Week :n', { n: formatNumber(Number(label.slice(1))) });

function Progress() {
    const weights = weightSeries.map((point) => ({
        ...point,
        w: week(point.w),
    }));
    const strength = strengthSeries.map((point) => ({
        ...point,
        w: week(point.w),
    }));
    const adherence = adherenceSeries.map((point) => ({
        ...point,
        d: t(point.d),
    }));

    return (
        <div>
            <PageHeader
                title={t('Progress')}
                description={`${t('Sarah Chen')} — ${t('12-week transformation snapshot.')}`}
            />

            <div className="grid gap-6 lg:grid-cols-2">
                <Chart title={t('Weight (kg)')}>
                    <LineChart data={weights}>
                        <CartesianGrid
                            stroke="var(--color-border)"
                            strokeDasharray="3 3"
                            vertical={false}
                        />
                        <XAxis
                            dataKey="w"
                            stroke="var(--color-muted-foreground)"
                            fontSize={12}
                        />
                        <YAxis
                            stroke="var(--color-muted-foreground)"
                            fontSize={12}
                            tickFormatter={(v: number) => formatNumber(v)}
                            domain={['dataMin - 1', 'dataMax + 1']}
                        />
                        <Tooltip
                            contentStyle={ttStyle}
                            formatter={(v) => formatNumber(Number(v))}
                        />
                        <Line
                            dataKey="weight"
                            name={t('Weight')}
                            stroke="var(--color-chart-1)"
                            strokeWidth={2.5}
                            dot={{ r: 3 }}
                        />
                    </LineChart>
                </Chart>
                <Chart title={t('Strength (kg)')}>
                    <LineChart data={strength}>
                        <CartesianGrid
                            stroke="var(--color-border)"
                            strokeDasharray="3 3"
                            vertical={false}
                        />
                        <XAxis
                            dataKey="w"
                            stroke="var(--color-muted-foreground)"
                            fontSize={12}
                        />
                        <YAxis
                            stroke="var(--color-muted-foreground)"
                            fontSize={12}
                            tickFormatter={(v: number) => formatNumber(v)}
                        />
                        <Tooltip
                            contentStyle={ttStyle}
                            formatter={(v) => formatNumber(Number(v))}
                        />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Line
                            dataKey="squat"
                            name={t('Squat')}
                            stroke="var(--color-chart-1)"
                            strokeWidth={2}
                        />
                        <Line
                            dataKey="bench"
                            name={t('Bench press')}
                            stroke="var(--color-chart-2)"
                            strokeWidth={2}
                        />
                        <Line
                            dataKey="deadlift"
                            name={t('Deadlift')}
                            stroke="var(--color-chart-3)"
                            strokeWidth={2}
                        />
                    </LineChart>
                </Chart>
                <Chart title={t('Body fat estimate')}>
                    <AreaChart
                        data={weights.map((w, i) => ({
                            w: w.w,
                            bf: 32 - i * 0.9,
                        }))}
                    >
                        <defs>
                            <linearGradient id="bf" x1="0" y1="0" x2="0" y2="1">
                                <stop
                                    offset="0%"
                                    stopColor="var(--color-chart-2)"
                                    stopOpacity={0.5}
                                />
                                <stop
                                    offset="100%"
                                    stopColor="var(--color-chart-2)"
                                    stopOpacity={0}
                                />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            stroke="var(--color-border)"
                            strokeDasharray="3 3"
                            vertical={false}
                        />
                        <XAxis
                            dataKey="w"
                            stroke="var(--color-muted-foreground)"
                            fontSize={12}
                        />
                        <YAxis
                            stroke="var(--color-muted-foreground)"
                            fontSize={12}
                            tickFormatter={(v: number) => formatNumber(v)}
                        />
                        <Tooltip
                            contentStyle={ttStyle}
                            formatter={(v) => formatNumber(Number(v))}
                        />
                        <Area
                            dataKey="bf"
                            name={t('Body fat estimate')}
                            stroke="var(--color-chart-2)"
                            fill="url(#bf)"
                            strokeWidth={2}
                        />
                    </AreaChart>
                </Chart>
                <Chart title={t('Adherence')}>
                    <BarChart data={adherence}>
                        <CartesianGrid
                            stroke="var(--color-border)"
                            strokeDasharray="3 3"
                            vertical={false}
                        />
                        <XAxis
                            dataKey="d"
                            stroke="var(--color-muted-foreground)"
                            fontSize={12}
                        />
                        <YAxis
                            stroke="var(--color-muted-foreground)"
                            fontSize={12}
                            tickFormatter={(v: number) => formatNumber(v)}
                        />
                        <Tooltip
                            contentStyle={ttStyle}
                            formatter={(v) => formatNumber(Number(v))}
                        />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar
                            dataKey="workout"
                            name={t('Workouts')}
                            fill="var(--color-chart-1)"
                            radius={[6, 6, 0, 0]}
                        />
                        <Bar
                            dataKey="nutrition"
                            name={t('Nutrition')}
                            fill="var(--color-chart-2)"
                            radius={[6, 6, 0, 0]}
                        />
                    </BarChart>
                </Chart>
            </div>

            <Card className="border-border/60 bg-card shadow-card-premium mt-6 p-6">
                <h3 className="mb-4 font-semibold">
                    {t('Progress photos timeline')}
                </h3>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
                    {[47, 13, 44, 45, 33, 52].map((i, idx) => (
                        <div
                            key={i}
                            className="relative overflow-hidden rounded-xl"
                        >
                            <img
                                src={`https://images.unsplash.com/photo-15${94381898411 + i * 100}?w=300&auto=format&fit=crop`}
                                className="aspect-[3/4] w-full object-cover"
                                alt=""
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src =
                                        `https://i.pravatar.cc/300?img=${i}`;
                                }}
                            />
                            <div className="from-background/80 absolute inset-x-0 bottom-0 bg-gradient-to-t to-transparent p-2 text-xs">
                                {week(`W${idx * 2 + 1}`)}
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}

const ttStyle = {
    background: 'var(--color-popover)',
    border: '1px solid var(--color-border)',
    borderRadius: 12,
};

function Chart({ title, children }: { title: string; children: any }) {
    return (
        <Card className="border-border/60 bg-card shadow-card-premium p-6">
            <h3 className="mb-4 font-semibold">{title}</h3>
            <div className="h-64">
                <ResponsiveContainer>{children}</ResponsiveContainer>
            </div>
        </Card>
    );
}
