import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import {
    Line,
    LineChart,
    ResponsiveContainer,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from 'recharts';
import { PageHeader } from '@fitnessos/components/app-shell';
import { Card } from '@fitnessos/components/ui/card';
import { getJson } from '@fitnessos/lib/api';

export const Route = createFileRoute('/app/progress')({ component: Progress });

type Checkin = {
    id: number;
    weight_kg: string | null;
    waist_cm: string | null;
    created_at: string;
};

function Progress() {
    const {
        data: checkins = [],
        isLoading,
        error,
    } = useQuery({
        queryKey: ['fitnessos', 'my-checkins'],
        queryFn: () => getJson<Checkin[]>('/fitnessos/checkins'),
    });
    const weights = [...checkins]
        .reverse()
        .filter((entry) => entry.weight_kg !== null)
        .map((entry) => ({
            date: new Date(entry.created_at).toLocaleDateString(),
            weight: Number(entry.weight_kg),
        }));
    const first = weights[0]?.weight;
    const latest = weights.at(-1)?.weight;

    return (
        <div>
            <PageHeader
                title="Progress"
                description="Your logged check-in measurements."
            />
            {isLoading && (
                <p className="text-muted-foreground text-sm">
                    Loading progress…
                </p>
            )}
            {error && (
                <p role="alert" className="text-destructive text-sm">
                    {error instanceof Error
                        ? error.message
                        : 'Unable to load progress.'}
                </p>
            )}
            <div className="grid gap-4 md:grid-cols-3">
                <Summary label="Check-ins" value={String(checkins.length)} />
                <Summary
                    label="Latest weight"
                    value={latest === undefined ? '—' : `${latest} kg`}
                />
                <Summary
                    label="Weight change"
                    value={
                        first === undefined || latest === undefined
                            ? '—'
                            : `${(latest - first).toFixed(1)} kg`
                    }
                />
            </div>
            <Card className="border-border/60 bg-card shadow-card-premium mt-6 p-6">
                <h2 className="mb-4 font-semibold">Weight history</h2>
                {weights.length > 0 ? (
                    <div className="h-72">
                        <ResponsiveContainer>
                            <LineChart data={weights}>
                                <CartesianGrid
                                    stroke="var(--color-border)"
                                    strokeDasharray="3 3"
                                    vertical={false}
                                />
                                <XAxis
                                    dataKey="date"
                                    stroke="var(--color-muted-foreground)"
                                    fontSize={12}
                                />
                                <YAxis
                                    stroke="var(--color-muted-foreground)"
                                    fontSize={12}
                                    domain={['dataMin - 1', 'dataMax + 1']}
                                />
                                <Tooltip
                                    contentStyle={{
                                        background: 'var(--color-popover)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 12,
                                    }}
                                />
                                <Line
                                    dataKey="weight"
                                    stroke="var(--color-chart-1)"
                                    strokeWidth={2.5}
                                    dot={{ r: 3 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <p className="text-muted-foreground text-sm">
                        Submit a check-in with your weight to see a trend.
                    </p>
                )}
            </Card>
        </div>
    );
}

function Summary({ label, value }: { label: string; value: string }) {
    return (
        <Card className="border-border/60 bg-card shadow-card-premium p-6">
            <div className="text-muted-foreground text-sm font-medium">
                {label}
            </div>
            <div className="font-display mt-2 text-3xl font-bold tabular-nums">
                {value}
            </div>
        </Card>
    );
}
