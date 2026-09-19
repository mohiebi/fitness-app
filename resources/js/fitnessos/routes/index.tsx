import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  ArrowRight,
  Check,
  ClipboardCheck,
  Dumbbell,
  Home as HomeIcon,
  LineChart,
  MessageSquare,
  Moon,
  Plus,
  Star,
  Target,
  Users,
  Utensils,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@fitnessos/components/ui/avatar";
import { Button } from "@fitnessos/components/ui/button";
import { Card } from "@fitnessos/components/ui/card";
import { Footer, PublicNav } from "@fitnessos/components/public-nav";
import { coach, faqs, pricing, process, services, testimonials, transformations } from "@fitnessos/lib/mock-data";

export const Route = createFileRoute("/")({ component: Home });

const serviceIcons = {
  target: Target,
  users: Users,
  utensils: Utensils,
  moon: Moon,
};

function Home() {
  const heroQuote = transformations[1];

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />

      <main>
        <section className="mx-auto grid max-w-7xl gap-12 px-6 pb-16 pt-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:pt-16">
          <div>
            <div className="flex items-center gap-2.5 text-[15px] font-semibold text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-primary" />
              1:1 online coaching with {coach.name}
            </div>
            <h1 className="mt-6 max-w-[660px] font-display text-5xl font-bold leading-none tracking-tight sm:text-6xl lg:text-[76px]">
              Train with a plan that changes when you do.
            </h1>
            <p className="mt-6 max-w-[540px] text-lg leading-relaxed text-muted-foreground md:text-[19px]">
              Custom training and nutrition in one app. Every week you check in, {coach.name.split(" ")[0]} reads it, and your plan is adjusted to how the week actually went.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="h-[54px] px-7">
                <Link to="/apply">Apply for coaching <ArrowRight strokeWidth={2.6} /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-[54px] px-6">
                <Link to="/transformations">See client results</Link>
              </Button>
            </div>
            <p className="mt-3.5 text-sm text-subtle-foreground">Applications reviewed within 24 hours.</p>
            {heroQuote && (
              <figure className="mt-10 flex max-w-[540px] items-center gap-3.5 border-t border-border pt-6">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-secondary text-sm font-bold">
                  {heroQuote.name.split(" ").map((part) => part[0]).join("")}
                </div>
                <figcaption>
                  <blockquote className="text-base font-semibold">“{heroQuote.quote}”</blockquote>
                  <div className="mt-0.5 text-[13px] text-subtle-foreground">{heroQuote.name} · {heroQuote.goal.toLowerCase()} · {heroQuote.weeks} weeks</div>
                </figcaption>
              </figure>
            )}
          </div>

          <div className="relative flex justify-center lg:justify-end lg:pr-6">
            <PhonePreview />
            <Card className="absolute bottom-3 left-0 hidden w-[280px] p-4 shadow-[0_24px_48px_-20px_rgb(0_0_0/0.7)] lg:block">
              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-xs font-bold">
                  {coach.name.split(" ").map((part) => part[0]).join("")}
                </div>
                <div>
                  <div className="text-sm font-bold">Week 9 feedback</div>
                  <div className="text-xs text-subtle-foreground">from {coach.name.split(" ")[0]}, your coach</div>
                </div>
              </div>
              <p className="mt-3 text-sm leading-normal text-muted-foreground">
                Weight is down 0.6 kg. Sleep dipped under 6 hours twice, so we're moving Friday's session to Saturday morning.
              </p>
              <div className="mt-3 flex gap-2 font-mono text-xs">
                <span className="rounded-full bg-secondary px-2.5 py-1">−0.6 kg</span>
                <span className="rounded-full bg-secondary px-2.5 py-1">3/5 sessions</span>
              </div>
            </Card>
          </div>
        </section>

        <section aria-label="How coaching works" className="mx-auto max-w-7xl px-6 pb-24">
          <ol className="grid gap-8 border-t border-border pt-7 sm:grid-cols-2 lg:grid-cols-4">
            {process.map((step) => (
              <li key={step.n}>
                <span className="font-mono text-[13px] text-primary">{step.n}</span>
                <h2 className="mt-2 text-[22px] font-semibold">{step.title}</h2>
                <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{step.desc}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="border-y border-border bg-card/40">
          <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 md:grid-cols-[320px_1fr] md:items-center">
            <img src={coach.avatar} className="aspect-square w-full max-w-[320px] rounded-2xl object-cover" alt={`Portrait of ${coach.name}`} />
            <div>
              <SectionHeader eyebrow="Your coach" title={coach.name} />
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">{coach.bio}</p>
              <ul className="mt-6 flex flex-wrap gap-2">
                {["NASM CPT", "PN Level 1", "Former D1 athlete", "10+ years"].map((credential) => (
                  <li key={credential} className="rounded-full border border-input px-3.5 py-1.5 text-[13px] font-semibold text-muted-foreground">
                    {credential}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-24">
          <SectionHeader eyebrow="Coaching" title="What's included" />
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {services.map((service) => {
              const Icon = serviceIcons[service.icon as keyof typeof serviceIcons] ?? Target;
              return (
                <Card key={service.title} className="p-6">
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-secondary">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold">{service.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{service.desc}</p>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-24">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeader eyebrow="Results" title="Client results" />
            <Link to="/transformations" className="inline-flex items-center gap-1.5 text-[15px] font-bold text-primary hover:underline">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {transformations.slice(0, 3).map((result) => (
              <Card key={result.id} className="overflow-hidden">
                <div className="grid grid-cols-2 gap-1.5 p-2">
                  <figure className="relative">
                    <img src={result.before} alt={`${result.name} before`} className="aspect-[3/4] w-full rounded-md object-cover" loading="lazy" />
                    <figcaption className="absolute left-2 top-2 rounded-full bg-background/85 px-2.5 py-1 text-xs font-semibold">Before</figcaption>
                  </figure>
                  <figure className="relative">
                    <img src={result.after} alt={`${result.name} after`} className="aspect-[3/4] w-full rounded-md object-cover" loading="lazy" />
                    <figcaption className="absolute left-2 top-2 rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground">After</figcaption>
                  </figure>
                </div>
                <div className="px-5 pb-6 pt-3">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold">{result.name}</h3>
                    <span className="font-mono text-sm text-primary">{result.lost}</span>
                  </div>
                  <div className="mt-1 text-[13px] text-subtle-foreground">{result.goal} · {result.weeks} weeks</div>
                  <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">“{result.quote}”</p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section className="border-y border-border bg-card/40">
          <div className="mx-auto max-w-7xl px-6 py-24">
            <SectionHeader eyebrow="Testimonials" title="What clients say" />
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {testimonials.map((quote) => (
                <figure key={quote.name} className="rounded-lg border border-border bg-background p-6">
                  <div className="flex gap-0.5 text-primary" aria-label="5 out of 5 stars">
                    {[1, 2, 3, 4, 5].map((star) => <Star key={star} className="h-4 w-4 fill-primary" aria-hidden="true" />)}
                  </div>
                  <blockquote className="mt-4 text-[15px] leading-relaxed">“{quote.quote}”</blockquote>
                  <figcaption className="mt-6 flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={quote.avatar} alt="" />
                      <AvatarFallback>{quote.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-semibold">{quote.name}</div>
                      <div className="text-[13px] text-subtle-foreground">{quote.role}</div>
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-24">
          <SectionHeader eyebrow="Pricing" title="Plans" />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {pricing.map((plan) => (
              <Card key={plan.name} className={plan.featured ? "relative border-primary p-8" : "relative p-8"}>
                {plan.featured && (
                  <span className="absolute right-6 top-6 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">Most popular</span>
                )}
                <h3 className="text-2xl font-semibold">{plan.name}</h3>
                <p className="mt-2 max-w-xs text-[15px] text-muted-foreground">{plan.desc}</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="font-display text-5xl font-bold tabular-nums">${plan.price}</span>
                  <span className="text-sm text-subtle-foreground">{plan.period}</span>
                </div>
                <Button asChild className="mt-6 h-11 w-full" variant={plan.featured ? "default" : "outline"}>
                  <Link to="/apply">{plan.cta}</Link>
                </Button>
                <ul className="mt-7 space-y-3 text-[15px]">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2.6} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-6 pb-24">
          <SectionHeader eyebrow="FAQ" title="Questions" />
          <div className="mt-8 divide-y divide-border border-y border-border">
            {faqs.map((faq) => (
              <details key={faq.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold marker:hidden">
                  {faq.q}
                  <Plus className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-45" />
                </summary>
                <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-24">
          <div className="rounded-2xl border border-border bg-card px-6 py-16 text-center md:px-16">
            <h2 className="mx-auto max-w-2xl text-4xl font-bold tracking-tight md:text-5xl">Ready to start?</h2>
            <p className="mx-auto mt-4 max-w-xl text-[17px] text-muted-foreground">
              Applications are reviewed within 24 hours, and coaching spots are limited.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="h-[54px] px-7">
                <Link to="/apply">Apply for coaching <ArrowRight strokeWidth={2.6} /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-[54px] px-6">
                <Link to="/contact">Ask a question</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <div className="flex items-center gap-2.5 text-[15px] font-semibold text-muted-foreground">
        <span className="h-2 w-2 rounded-full bg-primary" />
        {eyebrow}
      </div>
      <h2 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight md:text-5xl">{title}</h2>
    </div>
  );
}

const previewTabs = [
  { icon: HomeIcon, label: "Today" },
  { icon: Dumbbell, label: "Workout" },
  { icon: Utensils, label: "Nutrition" },
  { icon: LineChart, label: "Progress" },
  { icon: MessageSquare, label: "Coach" },
];

// A static illustration of the client app's Today screen for the hero.
function PhonePreview() {
  return (
    <div role="img" aria-label="The FitnessOS client app, showing a due check-in, a message from the coach and weekly progress" className="w-[300px] shrink-0 rounded-[40px] border border-input bg-secondary p-2">
      <div aria-hidden="true" className="flex h-[620px] flex-col overflow-hidden rounded-[32px] bg-background">
        <div className="flex flex-1 flex-col gap-3 px-4 pt-6">
          <div>
            <div className="font-mono text-[10px] uppercase text-subtle-foreground">Thu 17 Sep</div>
            <div className="mt-1 font-display text-[22px] font-bold tracking-tight">Good morning, Sarah</div>
          </div>
          <PreviewCard label="Weekly check-in">
            <div className="font-display text-lg font-bold leading-tight">Your check-in is due</div>
            <div className="mt-1 text-[11px] text-muted-foreground">Takes about 3 minutes.</div>
            <div className="mt-3 flex h-10 items-center justify-center gap-2 rounded-full bg-primary text-[13px] font-bold text-primary-foreground">
              <ClipboardCheck className="h-4 w-4" /> Start check-in
            </div>
          </PreviewCard>
          <PreviewCard label="From your coach">
            <p className="text-[12px] leading-normal">Great depth on Tuesday's squats. If the first set feels easy today, add 2.5 kg.</p>
          </PreviewCard>
          <PreviewCard label="Progress">
            <div className="grid grid-cols-3 gap-2">
              {[["Weight", "71.8", "kg"], ["Sleep", "7.5", "h"], ["Energy", "8", "/10"]].map(([label, value, unit]) => (
                <div key={label}>
                  <div className="text-[10px] font-semibold text-subtle-foreground">{label}</div>
                  <div><span className="font-display text-xl font-bold">{value}</span><span className="ml-0.5 text-[10px] text-muted-foreground">{unit}</span></div>
                </div>
              ))}
            </div>
          </PreviewCard>
        </div>
        <div className="grid grid-cols-5 border-t border-sidebar-border bg-sidebar px-1 pb-4 pt-2">
          {previewTabs.map(({ icon: Icon, label }, index) => (
            <div key={label} className={index === 0 ? "flex flex-col items-center gap-1 text-[9px] font-bold text-foreground" : "flex flex-col items-center gap-1 text-[9px] font-semibold text-subtle-foreground"}>
              <Icon className={index === 0 ? "h-[18px] w-[18px] text-primary" : "h-[18px] w-[18px]"} />
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PreviewCard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3.5">
      <div className="mb-2 text-[11px] font-semibold text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}
