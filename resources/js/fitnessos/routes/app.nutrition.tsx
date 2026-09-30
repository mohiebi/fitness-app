import { createFileRoute } from '@tanstack/react-router';
import { PageHeader } from '@fitnessos/components/app-shell';
import { Card } from '@fitnessos/components/ui/card';
import { Badge } from '@fitnessos/components/ui/badge';
import { Button } from '@fitnessos/components/ui/button';
import { Progress } from '@fitnessos/components/ui/progress';
import { meals } from '@fitnessos/lib/mock-data';
import { formatNumber, localizeNumbers } from '@fitnessos/lib/format';
import { sep, t } from '@fitnessos/lib/i18n';
import { Check, Plus, Utensils } from 'lucide-react';

export const Route = createFileRoute('/app/nutrition')({
    component: Nutrition,
});

function Nutrition() {
    return (
        <div>
            <PageHeader
                title={t('Nutrition')}
                description={`${t("Today's plan")}${sep()}${t(':kcal kcal target', { kcal: formatNumber(2700) })}`}
            />
            <div className="grid gap-4 md:grid-cols-4">
                {[
                    {
                        l: t('Calories'),
                        v: formatNumber(1840),
                        t: `/ ${formatNumber(2700)}`,
                        p: 68,
                    },
                    {
                        l: t('Protein'),
                        v: t(':value g', { value: formatNumber(152) }),
                        t: `/ ${t(':value g', { value: formatNumber(220) })}`,
                        p: 69,
                    },
                    {
                        l: t('Carbs'),
                        v: t(':value g', { value: formatNumber(180) }),
                        t: `/ ${t(':value g', { value: formatNumber(260) })}`,
                        p: 69,
                    },
                    {
                        l: t('Fat'),
                        v: t(':value g', { value: formatNumber(62) }),
                        t: `/ ${t(':value g', { value: formatNumber(80) })}`,
                        p: 77,
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
                                {m.t}
                            </span>
                        </div>
                        <Progress value={m.p} className="mt-3 h-1.5" />
                    </Card>
                ))}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
                {meals.map((m, i) => (
                    <Card
                        key={m.name}
                        className="border-border/60 bg-card shadow-card-premium p-5"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/10 text-primary grid h-10 w-10 place-items-center rounded-xl">
                                    <Utensils className="h-4 w-4" />
                                </div>
                                <div>
                                    <div className="font-semibold">
                                        {t(m.name)}
                                    </div>
                                    <div className="text-muted-foreground text-xs">
                                        {localizeNumbers(m.time)}
                                        {sep()}
                                        {t(':kcal kcal', {
                                            kcal: formatNumber(m.kcal),
                                        })}
                                    </div>
                                </div>
                            </div>
                            <Button
                                size="sm"
                                variant={i < 2 ? 'default' : 'outline'}
                                className={`rounded-full ${i < 2 ? 'bg-primary text-primary-foreground' : ''}`}
                            >
                                {i < 2 ? (
                                    <>
                                        <Check className="me-1 h-3 w-3" />
                                        {t('Eaten')}
                                    </>
                                ) : (
                                    <>
                                        <Plus className="me-1 h-3 w-3" />
                                        {t('Log')}
                                    </>
                                )}
                            </Button>
                        </div>
                        <ul className="text-muted-foreground mt-3 space-y-1 text-sm">
                            {m.items.map((x) => (
                                <li key={x}>• {localizeNumbers(t(x))}</li>
                            ))}
                        </ul>
                        <div className="mt-3 flex flex-wrap gap-1 text-[10px]">
                            <Badge variant="secondary">
                                {t(':p g protein', { p: formatNumber(m.p) })}
                            </Badge>
                            <Badge variant="secondary">
                                {t(':c g carbs', { c: formatNumber(m.c) })}
                            </Badge>
                            <Badge variant="secondary">
                                {t(':f g fat', { f: formatNumber(m.f) })}
                            </Badge>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
