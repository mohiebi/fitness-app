import { createFileRoute } from '@tanstack/react-router';
import { PageHeader } from '@fitnessos/components/app-shell';
import { StatCard } from '@fitnessos/components/stat-card';
import { Card } from '@fitnessos/components/ui/card';
import { Badge } from '@fitnessos/components/ui/badge';
import { Button } from '@fitnessos/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@fitnessos/components/ui/table';
import { revenueSeries, clients } from '@fitnessos/lib/mock-data';
import {
    formatNumber,
    formatToman,
    localizeNumbers,
} from '@fitnessos/lib/format';
import {
    DollarSign,
    TrendingUp,
    RefreshCcw,
    AlertCircle,
    Download,
} from 'lucide-react';
import {
    Area,
    AreaChart,
    ResponsiveContainer,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from 'recharts';

import { t } from '@fitnessos/lib/i18n';
export const Route = createFileRoute('/dashboard/payments')({
    component: Payments,
});

// Sample figures, in toman.
const payments = clients.slice(0, 6).map((c, i) => ({
    client: c.name,
    avatar: c.avatar,
    amount: [1_990_000, 3_990_000, 1_990_000, 990_000, 1_990_000, 3_990_000][i],
    status: ['Paid', 'Paid', 'Pending', 'Failed', 'Paid', 'Paid'][i],
    date: ['Nov 1', 'Nov 1', 'Nov 3', 'Oct 28', 'Oct 30', 'Oct 25'][i],
}));

function Payments() {
    const series = revenueSeries.map((point) => ({ ...point, m: t(point.m) }));

    return (
        <div>
            <PageHeader
                title={t('Payments')}
                description={t('Track revenue, subscriptions and invoices.')}
                actions={
                    <Button variant="outline">
                        <Download className="me-2 h-4 w-4" />
                        {t('Export CSV')}
                    </Button>
                }
            />

            <div className="grid gap-4 md:grid-cols-4">
                <StatCard
                    label={t('MRR')}
                    value={formatToman(42_180_000)}
                    delta={localizeNumbers('+18%')}
                    trend="up"
                    icon={DollarSign}
                />
                <StatCard
                    label={t('LTV')}
                    value={formatToman(2_840_000)}
                    delta={localizeNumbers('+9%')}
                    trend="up"
                    icon={TrendingUp}
                />
                <StatCard
                    label={t('Churn')}
                    value={localizeNumbers('3.2%')}
                    delta={localizeNumbers('-0.8%')}
                    trend="up"
                    icon={RefreshCcw}
                />
                <StatCard
                    label={t('Failed payments')}
                    value={1}
                    delta={t('needs action')}
                    trend="down"
                    icon={AlertCircle}
                />
            </div>

            <Card className="border-border/60 bg-card shadow-card-premium mt-6 p-6">
                <h3 className="mb-4 font-semibold">{t('Revenue trend')}</h3>
                <p className="text-muted-foreground mb-2 text-xs">
                    {t('In millions of toman')}
                </p>
                <div className="h-64">
                    <ResponsiveContainer>
                        <AreaChart data={series}>
                            <defs>
                                <linearGradient
                                    id="p"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop
                                        offset="0%"
                                        stopColor="var(--color-chart-1)"
                                        stopOpacity={0.5}
                                    />
                                    <stop
                                        offset="100%"
                                        stopColor="var(--color-chart-1)"
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
                                dataKey="m"
                                stroke="var(--color-muted-foreground)"
                                fontSize={12}
                            />
                            <YAxis
                                stroke="var(--color-muted-foreground)"
                                fontSize={12}
                                tickFormatter={(v: number) =>
                                    formatNumber(v / 1000)
                                }
                            />
                            <Tooltip
                                formatter={(v) => formatNumber(Number(v))}
                                contentStyle={{
                                    background: 'var(--color-popover)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 12,
                                }}
                            />
                            <Area
                                dataKey="revenue"
                                stroke="var(--color-chart-1)"
                                fill="url(#p)"
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            <Card className="border-border/60 bg-card shadow-card-premium mt-6 p-6">
                <h3 className="mb-4 font-semibold">
                    {t('Recent transactions')}
                </h3>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('Client')}</TableHead>
                            <TableHead>{t('Amount')}</TableHead>
                            <TableHead>{t('Status')}</TableHead>
                            <TableHead>{t('Date')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {payments.map((p) => (
                            <TableRow key={p.client + p.date}>
                                <TableCell className="font-medium">
                                    {t(p.client)}
                                </TableCell>
                                <TableCell>{formatToman(p.amount)}</TableCell>
                                <TableCell>
                                    <Badge
                                        className={
                                            p.status === 'Paid'
                                                ? 'bg-primary/15 text-primary'
                                                : p.status === 'Pending'
                                                  ? 'bg-chart-3/20 text-chart-3'
                                                  : 'bg-destructive/15 text-destructive'
                                        }
                                    >
                                        {t(p.status)}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {t(p.date)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
