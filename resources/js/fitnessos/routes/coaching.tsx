import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicNav, Footer } from "@fitnessos/components/public-nav";
import { Card } from "@fitnessos/components/ui/card";
import { Badge } from "@fitnessos/components/ui/badge";
import { Button } from "@fitnessos/components/ui/button";
import { pricing, services, process, faqs } from "@fitnessos/lib/mock-data";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@fitnessos/components/ui/accordion";
import { Check, Target, Users, Utensils, Moon, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/coaching")({
  head: () => ({ meta: [
    { title: "Coaching — FitnessOS" },
    { name: "description", content: "Explore our 1:1 coaching, group programs and nutrition services." },
  ]}),
  component: Coaching,
});

function Coaching() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <section className="border-b border-border bg-card/40">
        <div className="mx-auto max-w-4xl px-6 py-24 text-center">
          <div className="text-sm font-semibold text-primary">Coaching</div>
          <h1 className="mt-3 text-5xl font-semibold tracking-tight md:text-6xl">
            Programs built for your life.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Choose the path that fits — 1:1 personal coaching, high-touch nutrition, or a proven group cohort.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {services.map((s) => {
            const Icon = s.icon === "target" ? Target : s.icon === "users" ? Users : s.icon === "utensils" ? Utensils : Moon;
            return (
              <Card key={s.title} className="border-border/60 bg-card p-6 shadow-card-premium">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
                <h3 className="mt-4 font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="border-y border-border/60 bg-card/40">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">The process</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-4">
            {process.map(p => (
              <Card key={p.n} className="border-border/60 bg-card p-6 shadow-card-premium">
                <div className="text-xs font-mono text-primary">{p.n}</div>
                <h3 className="mt-2 font-semibold">{p.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">Pricing</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {pricing.map(p => (
            <Card key={p.name} className={`relative border-border/60 bg-card p-8 shadow-card-premium ${p.featured ? "border-primary" : ""}`}>
              {p.featured && <Badge className="absolute -top-3 left-8">Most popular</Badge>}
              <h3 className="text-lg font-semibold">{p.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
              <div className="mt-6 flex items-baseline gap-1"><span className="text-5xl font-semibold">${p.price}</span><span className="text-muted-foreground">{p.period}</span></div>
              <Button asChild className="mt-6 w-full" variant={p.featured ? "default" : "outline"}><Link to="/apply">{p.cta}</Link></Button>
              <ul className="mt-6 space-y-3 text-sm">
                {p.features.map(f => <li key={f} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{f}</li>)}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-20">
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">FAQ</h2>
        <Accordion type="single" collapsible className="mt-8">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`f${i}`}>
              <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <Card className="border-primary/30 bg-card p-12 text-center">
          <h3 className="text-3xl font-semibold">Apply for coaching</h3>
          <p className="mt-2 text-muted-foreground">We only take on 20 new clients per month.</p>
          <Button asChild size="lg" className="mt-6"><Link to="/apply">Start application <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
        </Card>
      </section>
      <Footer />
    </div>
  );
}
