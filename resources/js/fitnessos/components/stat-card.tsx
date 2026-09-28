import { Link } from '@tanstack/react-router';
import { Card } from '@fitnessos/components/ui/card';
import {
    ArrowDown,
    ArrowRight,
    ArrowUp,
    Minus,
    type LucideIcon,
} from 'lucide-react';
import { cn } from '@fitnessos/lib/utils';
import { formatNumber } from '@fitnessos/lib/format';
import type { ReactNode } from 'react';

export function StatCard({
    label,
    value,
    delta,
    trend,
    icon: Icon,
    hint,
}: {
    label: string;
    value: string | number;
    delta?: string;
    trend?: 'up' | 'down' | 'flat';
    icon?: LucideIcon;
    hint?: string;
}) {
    const TrendIcon =
        trend === 'up' ? ArrowUp : trend === 'down' ? ArrowDown : Minus;
    const trendColor =
        trend === 'up'
            ? 'text-primary'
            : trend === 'down'
              ? 'text-destructive'
              : 'text-muted-foreground';
    return (
        <Card className="p-5">
            <div className="flex items-start justify-between gap-3">
                <div className="text-muted-foreground text-sm font-semibold">
                    {label}
                </div>
                {Icon && (
                    <div className="bg-primary/10 text-primary ring-primary/20 grid h-9 w-9 shrink-0 place-items-center rounded-full ring-1">
                        <Icon className="h-4 w-4" />
                    </div>
                )}
            </div>
            <div className="font-display mt-3 text-3xl font-extrabold tabular-nums md:text-4xl">
                {typeof value === 'number' ? formatNumber(value) : value}
            </div>
            {delta && (
                <div
                    className={cn(
                        'mt-1.5 flex items-center gap-1 font-mono text-xs',
                        trendColor,
                    )}
                >
                    <TrendIcon className="h-3 w-3" />
                    <span>{delta}</span>
                    {hint && (
                        <span className="text-subtle-foreground ms-1">
                            {hint}
                        </span>
                    )}
                </div>
            )}
        </Card>
    );
}

export function ActionTile({
    label,
    value,
    meta,
    action,
    to,
    tone = 'default',
}: {
    label: string;
    value: number;
    meta?: string;
    action: string;
    to: string;
    tone?: 'default' | 'alert';
}) {
    return (
        <Card className="flex flex-col gap-3 px-5 py-[18px]">
            <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground flex items-center gap-2 text-sm font-semibold">
                    {tone === 'alert' && value > 0 && (
                        <span className="bg-destructive h-2 w-2 rounded-full" />
                    )}
                    {label}
                </span>
                {meta && (
                    <span className="text-subtle-foreground font-mono text-[11px]">
                        {meta}
                    </span>
                )}
            </div>
            <div
                className={cn(
                    'font-display text-[44px] leading-none font-extrabold tabular-nums',
                    tone === 'alert' && value > 0 && 'text-destructive',
                )}
            >
                {formatNumber(value)}
            </div>
            <Link
                to={to}
                className="text-primary inline-flex min-h-6 items-center gap-1.5 self-start text-sm font-bold hover:underline"
            >
                {action}{' '}
                <ArrowRight
                    className="h-[15px] w-[15px] rtl:rotate-180"
                    strokeWidth={2.4}
                />
            </Link>
        </Card>
    );
}

export function ChartCard({
    title,
    description,
    children,
    actions,
}: {
    title: string;
    description?: string;
    children: ReactNode;
    actions?: ReactNode;
}) {
    return (
        <Card className="relative overflow-hidden p-6">
            <div className="bg-energy-gradient pointer-events-none absolute inset-x-8 top-0 h-px opacity-70" />
            <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-lg font-semibold">{title}</h3>
                    {description && (
                        <p className="text-muted-foreground mt-1 text-sm">
                            {description}
                        </p>
                    )}
                </div>
                {actions}
            </div>
            {children}
        </Card>
    );
}
