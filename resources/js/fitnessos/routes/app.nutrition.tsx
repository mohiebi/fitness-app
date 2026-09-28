import { createFileRoute } from '@tanstack/react-router';
import { PageHeader } from '@fitnessos/components/app-shell';
import { Card } from '@fitnessos/components/ui/card';
import { Badge } from '@fitnessos/components/ui/badge';
import { Button } from '@fitnessos/components/ui/button';
import { Progress } from '@fitnessos/components/ui/progress';
import { meals } from '@fitnessos/lib/mock-data';
import { Check, Plus, Utensils } from 'lucide-react';

export const Route = createFileRoute('/app/nutrition')({
    component: Nutrition,
});

function Nutrition() {
    return (
        <div>
            <PageHeader
                title="Nutrition"
                description="Today's plan · 2,700 kcal target"
            />
            <div className="grid gap-4 md:grid-cols-4">
                {[
                    { l: 'Calories', v: '1,840', t: '/ 2,700', p: 68 },
                    { l: 'Protein', v: '152g', t: '/ 220g', p: 69 },
                    { l: 'Carbs', v: '180g', t: '/ 260g', p: 69 },
                    { l: 'Fat', v: '62g', t: '/ 80g', p: 77 },
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
                                        {m.name}
                                    </div>
                                    <div className="text-muted-foreground text-xs">
                                        {m.time} · {m.kcal} kcal
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
                                        <Check className="mr-1 h-3 w-3" />
                                        Eaten
                                    </>
                                ) : (
                                    <>
                                        <Plus className="mr-1 h-3 w-3" />
                                        Log
                                    </>
                                )}
                            </Button>
                        </div>
                        <ul className="text-muted-foreground mt-3 space-y-1 text-sm">
                            {m.items.map((x) => (
                                <li key={x}>• {x}</li>
                            ))}
                        </ul>
                        <div className="mt-3 flex flex-wrap gap-1 text-[10px]">
                            <Badge variant="secondary">{m.p}g P</Badge>
                            <Badge variant="secondary">{m.c}g C</Badge>
                            <Badge variant="secondary">{m.f}g F</Badge>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
