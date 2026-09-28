import { createFileRoute } from '@tanstack/react-router';
import { PageHeader } from '@fitnessos/components/app-shell';
import { Card } from '@fitnessos/components/ui/card';
import { Button } from '@fitnessos/components/ui/button';
import { Badge } from '@fitnessos/components/ui/badge';
import { Input } from '@fitnessos/components/ui/input';
import { workoutWeek, exercises } from '@fitnessos/lib/mock-data';
import {
    GripVertical,
    Plus,
    Video,
    Search,
    Copy,
    MoreVertical,
} from 'lucide-react';
import { useState } from 'react';

export const Route = createFileRoute('/dashboard/workouts')({
    component: Workouts,
});

function Workouts() {
    const [dayIdx, setDayIdx] = useState(0);
    const day = workoutWeek.days[dayIdx];
    return (
        <div>
            <PageHeader
                title="Workout builder"
                description={`Program: Sarah Chen — Fat Loss · Week ${workoutWeek.week} of 16`}
                actions={
                    <>
                        <Button variant="outline">
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate week
                        </Button>
                        <Button>Save program</Button>
                    </>
                }
            />

            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                <div>
                    <div className="mb-4 flex flex-wrap gap-2">
                        {workoutWeek.days.map((d, i) => (
                            <Button
                                key={d.name}
                                size="sm"
                                variant={i === dayIdx ? 'default' : 'outline'}
                                onClick={() => setDayIdx(i)}
                            >
                                {d.name.split(' — ')[0]}
                            </Button>
                        ))}
                    </div>

                    <Card className="border-border/60 bg-card shadow-card-premium p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="font-semibold">{day.name}</h3>
                            <Badge variant="secondary">
                                {day.exercises.length} exercises
                            </Badge>
                        </div>

                        <div className="space-y-3">
                            {day.exercises.map((e, i) => (
                                <div
                                    key={i}
                                    className="group border-border/60 bg-background flex items-start gap-3 rounded-xl border p-4"
                                >
                                    <GripVertical className="text-muted-foreground mt-2 h-4 w-4 cursor-grab" />
                                    <div className="bg-primary/10 text-primary grid h-12 w-16 shrink-0 place-items-center rounded-lg">
                                        <Video className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">
                                                {e.name}
                                            </span>
                                            <Badge
                                                variant="outline"
                                                className="text-[10px]"
                                            >
                                                Video
                                            </Badge>
                                        </div>
                                        <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-5">
                                            <Field
                                                label="Sets"
                                                value={String(e.sets)}
                                            />
                                            <Field
                                                label="Reps"
                                                value={e.reps}
                                            />
                                            <Field
                                                label="Weight"
                                                value={e.weight}
                                            />
                                            <Field
                                                label="Rest"
                                                value={e.rest}
                                            />
                                            <Field
                                                label="Notes"
                                                value={e.notes || '—'}
                                            />
                                        </div>
                                    </div>
                                    <Button size="icon" variant="ghost">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            <Button
                                variant="outline"
                                className="w-full rounded-xl border-dashed"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add exercise
                            </Button>
                        </div>
                    </Card>
                </div>

                <Card className="border-border/60 bg-card shadow-card-premium h-fit p-4">
                    <h3 className="font-semibold">Exercise library</h3>
                    <div className="relative mt-3">
                        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                        <Input
                            placeholder="Search 2,000+ exercises…"
                            className="pl-9"
                        />
                    </div>
                    <div className="mt-3 space-y-1">
                        {exercises.map((ex) => (
                            <div
                                key={ex.name}
                                className="hover:bg-secondary flex cursor-pointer items-center justify-between rounded-lg p-2 text-sm"
                            >
                                <div>
                                    <div className="font-medium">{ex.name}</div>
                                    <div className="text-muted-foreground text-xs">
                                        {ex.muscle} · {ex.equipment}
                                    </div>
                                </div>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7"
                                >
                                    <Plus className="h-3 w-3" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}

function Field({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-secondary/50 rounded-lg p-2">
            <div className="text-muted-foreground text-xs">{label}</div>
            <div className="mt-0.5 text-sm font-medium">{value}</div>
        </div>
    );
}
