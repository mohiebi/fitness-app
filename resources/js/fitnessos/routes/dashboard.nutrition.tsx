import { createFileRoute } from '@tanstack/react-router';
import { PageHeader } from '@fitnessos/components/app-shell';
import { Card } from '@fitnessos/components/ui/card';
import { Button } from '@fitnessos/components/ui/button';
import { Badge } from '@fitnessos/components/ui/badge';
import { Progress } from '@fitnessos/components/ui/progress';
import { meals } from '@fitnessos/lib/mock-data';
import { formatNumber, localizeNumbers } from '@fitnessos/lib/format';
import { sep, t } from '@fitnessos/lib/i18n';
import { Plus, ShoppingCart, Repeat, Utensils } from 'lucide-react';

export const Route = createFileRoute('/dashboard/nutrition')({
    component: Nutrition,
});

function Nutrition() {
    const total = meals.reduce(
        (a, m) => ({
            kcal: a.kcal + m.kcal,
            p: a.p + m.p,
            c: a.c + m.c,
            f: a.f + m.f,
        }),
        { kcal: 0, p: 0, c: 0, f: 0 },
    );
    return (
        <div>
            <PageHeader
                title={t('Nutrition builder')}
                description={`${t('Sarah Chen')} — ${t('Fat loss')}${sep()}${t(':kcal kcal target', { kcal: formatNumber(2700) })}`}
                actions={
                    <>
                        <Button variant="outline">
                            <ShoppingCart className="me-2 h-4 w-4" />
                            {t('Shopping list')}
                        </Button>
                        <Button>{t('Save plan')}</Button>
                    </>
                }
            />

            <div className="grid gap-4 md:grid-cols-4">
                {[
                    {
                        l: t('Calories'),
                        v: formatNumber(total.kcal),
                        sub: `/ ${formatNumber(2700)} ${t('kcal')}`,
                        pct: (total.kcal / 2700) * 100,
                        color: 'var(--color-chart-1)',
                    },
                    {
                        l: t('Protein'),
                        v: t(':value g', { value: formatNumber(total.p) }),
                        sub: `/ ${t(':value g', { value: formatNumber(220) })}`,
                        pct: (total.p / 220) * 100,
                        color: 'var(--color-chart-2)',
                    },
                    {
                        l: t('Carbs'),
                        v: t(':value g', { value: formatNumber(total.c) }),
                        sub: `/ ${t(':value g', { value: formatNumber(260) })}`,
                        pct: (total.c / 260) * 100,
                        color: 'var(--color-chart-3)',
                    },
                    {
                        l: t('Fat'),
                        v: t(':value g', { value: formatNumber(total.f) }),
                        sub: `/ ${t(':value g', { value: formatNumber(80) })}`,
                        pct: (total.f / 80) * 100,
                        color: 'var(--color-chart-4)',
                    },
                ].map((m) => (
                    <Card
                        key={m.l}
                        className="border-border/60 bg-card shadow-card-premium p-5"
                    >
                        <div className="text-muted-foreground text-sm font-medium">
                            {m.l}
                        </div>
                        <div className="mt-2 flex items-baseline gap-1">
                            <span className="text-2xl font-semibold">
                                {m.v}
                            </span>
                            <span className="text-muted-foreground text-xs">
                                {m.sub}
                            </span>
                        </div>
                        <Progress value={m.pct} className="mt-3 h-1.5" />
                    </Card>
                ))}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {meals.map((m) => (
                    <Card
                        key={m.name}
                        className="border-border/60 bg-card shadow-card-premium p-5"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="bg-primary/10 text-primary grid h-8 w-8 place-items-center rounded-lg">
                                    <Utensils className="h-4 w-4" />
                                </div>
                                <span className="font-semibold">
                                    {t(m.name)}
                                </span>
                            </div>
                            <Badge variant="secondary">
                                {localizeNumbers(m.time)}
                            </Badge>
                        </div>
                        <div className="text-muted-foreground mt-3 text-xs">
                            {t(':kcal kcal', { kcal: formatNumber(m.kcal) })}
                            {sep()}
                            {t(':p g protein', { p: formatNumber(m.p) })}
                            {sep()}
                            {t(':c g carbs', { c: formatNumber(m.c) })}
                            {sep()}
                            {t(':f g fat', { f: formatNumber(m.f) })}
                        </div>
                        <ul className="mt-3 space-y-1 text-sm">
                            {m.items.map((i) => (
                                <li key={i} className="flex items-center gap-2">
                                    <span className="bg-primary h-1 w-1 rounded-full" />
                                    {localizeNumbers(t(i))}
                                </li>
                            ))}
                        </ul>
                        <div className="mt-4 flex gap-2">
                            <Button
                                size="sm"
                                variant="ghost"
                                className="flex-1"
                            >
                                <Repeat className="me-1 h-3 w-3" />
                                {t('Swap')}
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="flex-1"
                            >
                                <Plus className="me-1 h-3 w-3" />
                                {t('Add food')}
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
