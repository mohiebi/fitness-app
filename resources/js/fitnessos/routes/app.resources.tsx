import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@fitnessos/components/app-shell";
import { Card } from "@fitnessos/components/ui/card";
import { Badge } from "@fitnessos/components/ui/badge";
import { resources } from "@fitnessos/lib/mock-data";

export const Route = createFileRoute("/app/resources")({ component: Resources });

function Resources() {
  return (
    <div>
      <PageHeader title="Resources" description="Guides, videos and tools from your coach." />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {resources.map(r => (
          <Card key={r.id} className="group overflow-hidden transition">
            <div className="aspect-[16/10] overflow-hidden p-2 pb-0"><img src={r.img} className="h-full w-full rounded-md object-cover" alt={r.title} /></div>
            <div className="p-5">
              <div className="flex gap-2 text-xs text-muted-foreground"><Badge variant="secondary">{r.cat}</Badge><span>{r.read}</span></div>
              <h3 className="mt-3 font-semibold">{r.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{r.excerpt}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
