import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PublicNav, Footer } from "@fitnessos/components/public-nav";
import { Card } from "@fitnessos/components/ui/card";
import { Badge } from "@fitnessos/components/ui/badge";
import { Button } from "@fitnessos/components/ui/button";
import { transformations } from "@fitnessos/lib/mock-data";

export const Route = createFileRoute("/transformations")({
  head: () => ({ meta: [
    { title: "Transformations — FitnessOS" },
    { name: "description", content: "Real client transformations from FitnessOS coaches." },
  ]}),
  component: Transformations,
});

const filters = ["All", "Fat loss", "Muscle gain", "Recomp", "Strength", "Postpartum"];

function Transformations() {
  const [f, setF] = useState("All");
  const filtered = f === "All" ? transformations : transformations.filter(t => t.goal === f);
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <section className="border-b border-border bg-card/40">
        <div className="mx-auto max-w-4xl px-6 py-24 text-center">
          <div className="text-sm font-semibold text-primary">Transformations</div>
          <h1 className="mt-3 text-5xl font-semibold tracking-tight md:text-6xl">Proof over promises.</h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">500+ transformations. 94% completion rate. Zero photoshop.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8 flex flex-wrap gap-2">
          {filters.map(x => (
            <Button key={x} size="sm" variant={f === x ? "default" : "outline"} onClick={() => setF(x)}>{x}</Button>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(t => (
            <Card key={t.id} className="group overflow-hidden border-border/60 bg-card shadow-card-premium transition-all">
              <div className="grid grid-cols-2 gap-0.5">
                <div className="relative">
                  <img src={t.before} className="aspect-[3/4] w-full object-cover" alt="before" />
                  <Badge className="absolute left-2 top-2 bg-background/70 backdrop-blur">Before</Badge>
                </div>
                <div className="relative">
                  <img src={t.after} className="aspect-[3/4] w-full object-cover" alt="after" />
                  <Badge className="absolute left-2 top-2 bg-primary/80 text-primary-foreground backdrop-blur">After</Badge>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{t.name}</div>
                  <Badge className="bg-primary/15 text-primary">{t.lost}</Badge>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{t.weeks} weeks · {t.goal}</div>
                <p className="mt-3 text-sm text-muted-foreground">"{t.quote}"</p>
              </div>
            </Card>
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border/60 p-16 text-center text-muted-foreground">No transformations in this category yet.</div>
        )}
      </section>
      <Footer />
    </div>
  );
}
