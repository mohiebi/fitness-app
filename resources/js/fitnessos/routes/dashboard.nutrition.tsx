import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@fitnessos/components/app-shell";
import { Card } from "@fitnessos/components/ui/card";
import { Button } from "@fitnessos/components/ui/button";
import { Badge } from "@fitnessos/components/ui/badge";
import { Progress } from "@fitnessos/components/ui/progress";
import { meals } from "@fitnessos/lib/mock-data";
import { Plus, ShoppingCart, Repeat, Utensils } from "lucide-react";

export const Route = createFileRoute("/dashboard/nutrition")({ component: Nutrition });

function Nutrition() {
  const total = meals.reduce((a, m) => ({ kcal: a.kcal + m.kcal, p: a.p + m.p, c: a.c + m.c, f: a.f + m.f }), { kcal: 0, p: 0, c: 0, f: 0 });
  return (
    <div>
      <PageHeader title="Nutrition builder"
        description="Sarah Chen — Fat loss · 2,700 kcal target"
        actions={<><Button variant="outline"><ShoppingCart className="mr-2 h-4 w-4" />Shopping list</Button><Button>Save plan</Button></>} />

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { l: "Calories", v: `${total.kcal}`, sub: "/ 2,700 kcal", pct: (total.kcal / 2700) * 100, color: "var(--color-chart-1)" },
          { l: "Protein", v: `${total.p}g`, sub: "/ 220g", pct: (total.p / 220) * 100, color: "var(--color-chart-2)" },
          { l: "Carbs", v: `${total.c}g`, sub: "/ 260g", pct: (total.c / 260) * 100, color: "var(--color-chart-3)" },
          { l: "Fat", v: `${total.f}g`, sub: "/ 80g", pct: (total.f / 80) * 100, color: "var(--color-chart-4)" },
        ].map(m => (
          <Card key={m.l} className="border-border/60 bg-card p-5 shadow-card-premium">
            <div className="text-sm font-medium text-muted-foreground">{m.l}</div>
            <div className="mt-2 flex items-baseline gap-1"><span className="text-2xl font-semibold">{m.v}</span><span className="text-xs text-muted-foreground">{m.sub}</span></div>
            <Progress value={m.pct} className="mt-3 h-1.5" />
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {meals.map(m => (
          <Card key={m.name} className="border-border/60 bg-card p-5 shadow-card-premium">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary"><Utensils className="h-4 w-4" /></div><span className="font-semibold">{m.name}</span></div>
              <Badge variant="secondary">{m.time}</Badge>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">{m.kcal} kcal · {m.p}P {m.c}C {m.f}F</div>
            <ul className="mt-3 space-y-1 text-sm">{m.items.map(i => <li key={i} className="flex items-center gap-2"><span className="h-1 w-1 rounded-full bg-primary" />{i}</li>)}</ul>
            <div className="mt-4 flex gap-2"><Button size="sm" variant="ghost" className="flex-1"><Repeat className="mr-1 h-3 w-3" />Swap</Button><Button size="sm" variant="ghost" className="flex-1"><Plus className="mr-1 h-3 w-3" />Add food</Button></div>
          </Card>
        ))}
      </div>
    </div>
  );
}
