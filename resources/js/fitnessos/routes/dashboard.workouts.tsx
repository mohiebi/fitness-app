import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@fitnessos/components/app-shell";
import { Card } from "@fitnessos/components/ui/card";
import { Button } from "@fitnessos/components/ui/button";
import { Badge } from "@fitnessos/components/ui/badge";
import { Input } from "@fitnessos/components/ui/input";
import { workoutWeek, exercises } from "@fitnessos/lib/mock-data";
import { GripVertical, Plus, Video, Search, Copy, MoreVertical } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/dashboard/workouts")({ component: Workouts });

function Workouts() {
  const [dayIdx, setDayIdx] = useState(0);
  const day = workoutWeek.days[dayIdx];
  return (
    <div>
      <PageHeader title="Workout builder"
        description={`Program: Sarah Chen — Fat Loss · Week ${workoutWeek.week} of 16`}
        actions={<><Button variant="outline" className="rounded-full"><Copy className="mr-2 h-4 w-4" />Duplicate week</Button><Button className="rounded-full bg-brand-gradient text-primary-foreground">Save program</Button></>} />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="mb-4 flex flex-wrap gap-2">
            {workoutWeek.days.map((d, i) => (
              <Button key={d.name} size="sm" variant={i === dayIdx ? "default" : "outline"} className="rounded-full" onClick={() => setDayIdx(i)}>{d.name.split(" — ")[0]}</Button>
            ))}
          </div>

          <Card className="border-border/60 bg-card p-6 shadow-card-premium">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">{day.name}</h3>
              <Badge variant="secondary">{day.exercises.length} exercises</Badge>
            </div>

            <div className="space-y-3">
              {day.exercises.map((e, i) => (
                <div key={i} className="group flex items-start gap-3 rounded-xl border border-border/60 bg-background p-4">
                  <GripVertical className="mt-2 h-4 w-4 cursor-grab text-muted-foreground" />
                  <div className="grid h-12 w-16 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Video className="h-4 w-4" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2"><span className="font-medium">{e.name}</span><Badge variant="outline" className="text-[10px]">Video</Badge></div>
                    <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-5">
                      <Field label="Sets" value={String(e.sets)} />
                      <Field label="Reps" value={e.reps} />
                      <Field label="Weight" value={e.weight} />
                      <Field label="Rest" value={e.rest} />
                      <Field label="Notes" value={e.notes || "—"} />
                    </div>
                  </div>
                  <Button size="icon" variant="ghost"><MoreVertical className="h-4 w-4" /></Button>
                </div>
              ))}
              <Button variant="outline" className="w-full rounded-xl border-dashed"><Plus className="mr-2 h-4 w-4" />Add exercise</Button>
            </div>
          </Card>
        </div>

        <Card className="h-fit border-border/60 bg-card p-4 shadow-card-premium">
          <h3 className="font-semibold">Exercise library</h3>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search 2,000+ exercises…" className="pl-9" />
          </div>
          <div className="mt-3 space-y-1">
            {exercises.map(ex => (
              <div key={ex.name} className="flex cursor-pointer items-center justify-between rounded-lg p-2 text-sm hover:bg-accent/10">
                <div>
                  <div className="font-medium">{ex.name}</div>
                  <div className="text-xs text-muted-foreground">{ex.muscle} · {ex.equipment}</div>
                </div>
                <Button size="icon" variant="ghost" className="h-7 w-7"><Plus className="h-3 w-3" /></Button>
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
    <div className="rounded-lg bg-secondary/50 p-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-medium">{value}</div>
    </div>
  );
}
