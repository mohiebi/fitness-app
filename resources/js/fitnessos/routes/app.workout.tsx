import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@fitnessos/components/app-shell";
import { Card } from "@fitnessos/components/ui/card";
import { Button } from "@fitnessos/components/ui/button";
import { Badge } from "@fitnessos/components/ui/badge";
import { workoutWeek } from "@fitnessos/lib/mock-data";
import { Play, Check, Timer, Video, ChevronRight, Notebook } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/workout")({ component: Workout });

function Workout() {
  const day = workoutWeek.days[0];
  const [done, setDone] = useState<Record<number, boolean>>({});
  return (
    <div>
      <PageHeader title={day.name} description="Rest ~2 min between sets. Log honestly." />

      <Card className="mb-6 border-primary/30 bg-hero-gradient p-6 shadow-glow">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/20"><Timer className="h-5 w-5 text-primary" /></div>
            <div><div className="text-sm font-medium text-muted-foreground">Rest timer</div><div className="text-3xl font-mono font-semibold">02:00</div></div>
          </div>
          <div className="flex gap-2"><Button variant="outline">Skip</Button><Button><Play className="mr-2 h-4 w-4" />Start</Button></div>
        </div>
      </Card>

      <div className="space-y-4">
        {day.exercises.map((e, i) => (
          <Card key={i} className={`border-border/60 bg-card p-5 shadow-card-premium ${done[i] ? "opacity-70" : ""}`}>
            <div className="flex gap-4">
              <div className="grid h-24 w-32 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Video className="h-6 w-6" /></div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2"><span className="font-semibold">{e.name}</span><Badge variant="outline" className="text-[10px]">Video</Badge></div>
                <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
                  {[["Sets", e.sets], ["Reps", e.reps], ["Weight", e.weight], ["Rest", e.rest]].map(([k, v]) => (
                    <div key={String(k)} className="rounded-lg bg-secondary/50 p-2"><div className="text-xs capitalize text-muted-foreground">{String(k)}</div><div className="mt-0.5 text-sm font-medium">{String(v)}</div></div>
                  ))}
                </div>
                {e.notes && <div className="mt-3 flex items-start gap-2 rounded-lg bg-primary/5 p-2 text-xs text-muted-foreground"><Notebook className="mt-0.5 h-3 w-3 shrink-0 text-primary" /><span>{e.notes}</span></div>}
              </div>
              <Button size="sm" variant={done[i] ? "default" : "outline"} className={`rounded-full ${done[i] ? "bg-primary text-primary-foreground" : ""}`}
                onClick={() => setDone({ ...done, [i]: !done[i] })}>
                {done[i] ? <><Check className="mr-1 h-3 w-3" />Done</> : "Mark done"}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Button className="mt-6 w-full">Finish workout <ChevronRight className="ml-2 h-4 w-4" /></Button>
    </div>
  );
}
