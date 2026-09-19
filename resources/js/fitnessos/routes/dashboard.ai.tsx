import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@fitnessos/components/app-shell";
import { Card } from "@fitnessos/components/ui/card";
import { Button } from "@fitnessos/components/ui/button";
import { Textarea } from "@fitnessos/components/ui/textarea";
import { Badge } from "@fitnessos/components/ui/badge";
import { aiPrompts } from "@fitnessos/lib/mock-data";
import { Sparkles, Dumbbell, Utensils, TrendingUp, Instagram, MessageSquare, Clipboard, ArrowUp, Wand2 } from "lucide-react";

export const Route = createFileRoute("/dashboard/ai")({ component: AI });

const iconMap: Record<string, any> = { dumbbell: Dumbbell, utensils: Utensils, "trending-up": TrendingUp, instagram: Instagram, "message-square": MessageSquare, clipboard: Clipboard };

const recent = [
  { title: "Meal plan for Sarah — cutting phase", when: "2h ago" },
  { title: "Instagram carousel: protein myths", when: "Yesterday" },
  { title: "12-week hypertrophy program", when: "2d ago" },
  { title: "Check-in reply — David missed 3 sessions", when: "3d ago" },
];

function AI() {
  return (
    <div>
      <PageHeader title="AI Assistant" description="Your coaching co-pilot. Build plans, replies and content in seconds." />

      <Card className="relative overflow-hidden border-primary/30 bg-card p-8">
        <div className="mb-4 flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /><span className="text-sm font-medium">Ask FitnessOS AI</span></div>
        <Textarea rows={4} placeholder="e.g. Build a 12-week strength program for a 45-year-old beginner with a bad shoulder…" className="border-border/60 bg-background/60 text-base backdrop-blur" />
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-primary/30 bg-primary/10">GPT-Coach v2</Badge>
          <Badge variant="outline">Personalized to your voice</Badge>
          <Button className="ml-auto"><Wand2 className="mr-2 h-4 w-4" />Generate <ArrowUp className="ml-2 h-4 w-4" /></Button>
        </div>
      </Card>

      <div className="mt-8">
        <h3 className="mb-4 text-sm font-semibold text-muted-foreground">Suggested prompts</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {aiPrompts.map(p => {
            const Icon = iconMap[p.icon] || Sparkles;
            return (
              <Card key={p.title} className="group cursor-pointer border-border/60 bg-card p-5 shadow-card-premium transition hover:border-primary/40">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
                <h4 className="mt-4 font-semibold">{p.title}</h4>
                <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="mt-8">
        <h3 className="mb-4 text-sm font-semibold text-muted-foreground">Recent conversations</h3>
        <Card className="border-border/60 bg-card p-2 shadow-card-premium">
          {recent.map(r => (
            <div key={r.title} className="flex cursor-pointer items-center justify-between rounded-xl p-4 hover:bg-secondary">
              <div><div className="text-sm font-medium">{r.title}</div><div className="text-xs text-muted-foreground">{r.when}</div></div>
              <Button size="sm" variant="ghost">Open</Button>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
