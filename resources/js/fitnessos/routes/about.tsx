import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicNav, Footer } from "@fitnessos/components/public-nav";
import { Card } from "@fitnessos/components/ui/card";
import { Badge } from "@fitnessos/components/ui/badge";
import { Button } from "@fitnessos/components/ui/button";
import { coach } from "@fitnessos/lib/mock-data";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [
    { title: "About — FitnessOS" },
    { name: "description", content: "The story behind FitnessOS and the coaches building it." },
  ]}),
  component: About,
});

function About() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <section className="mx-auto max-w-4xl px-6 py-24">
        <div className="text-sm font-semibold text-primary">About</div>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight md:text-6xl">
          Coaches deserve better software.
        </h1>
        <p className="mt-6 text-lg text-muted-foreground">
          FitnessOS was born inside a real coaching business. After years of gluing together spreadsheets, Notion pages,
          Telegram groups and 4 separate SaaS tools, we built the platform we always wished existed.
        </p>
        <img src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1600&auto=format&fit=crop" className="mt-10 aspect-[16/9] w-full rounded-2xl object-cover shadow-card-premium" alt="Team" />

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {[
            { t: "Coach-first", d: "Every feature ships only after 20+ working coaches use it in production." },
            { t: "Design matters", d: "Your clients will actually open the app. That's half the battle." },
            { t: "AI where it helps", d: "We use AI to remove admin — not to replace the human coach." },
          ].map(v => (
            <Card key={v.t} className="border-border/60 bg-card p-6 shadow-card-premium">
              <h3 className="font-semibold">{v.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{v.d}</p>
            </Card>
          ))}
        </div>

        <div className="mt-20 grid gap-8 md:grid-cols-[240px_1fr] md:items-center">
          <img src={coach.avatar} className="h-60 w-60 rounded-3xl object-cover" alt={coach.name} />
          <div>
            <Badge variant="secondary">Founder & Head Coach</Badge>
            <h2 className="mt-3 text-3xl font-semibold">{coach.name}</h2>
            <p className="mt-3 text-muted-foreground">{coach.bio}</p>
          </div>
        </div>

        <div className="mt-20 rounded-2xl border border-border/60 bg-card p-10 text-center">
          <h3 className="text-2xl font-semibold">Want to see the platform?</h3>
          <p className="mt-2 text-muted-foreground">Tour the coach dashboard and client app.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Button asChild><Link to="/dashboard">Open dashboard <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            <Button asChild variant="outline"><Link to="/apply">Apply for coaching</Link></Button>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
