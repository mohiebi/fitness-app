import { createFileRoute, Link } from "@tanstack/react-router";
import { MotionConfig, motion } from "framer-motion";
import type { ReactNode } from "react";
import {
  ArrowRight,
  Check,
  ClipboardCheck,
  Dumbbell,
  Flame,
  Home as HomeIcon,
  LineChart,
  MessageSquare,
  Moon,
  Play,
  Plus,
  Star,
  Target,
  Timer,
  Users,
  Utensils,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@fitnessos/components/ui/avatar";
import { Button } from "@fitnessos/components/ui/button";
import { Footer, PublicNav } from "@fitnessos/components/public-nav";
import { coach, faqs, pricing, process, services, testimonials, transformations } from "@fitnessos/lib/mock-data";

export const Route = createFileRoute("/")({ component: Home });

const ticker = ["move fast", "lift smart", "check in weekly", "fuel wins", "track momentum", "fitnessos"];

// What the coaching actually promises — no invented numbers.
const promises = [
  { value: "24h", label: "application reply", icon: Timer },
  { value: "1:1", label: "coach, not a bot", icon: MessageSquare },
  { value: "Weekly", label: "check-in + feedback", icon: ClipboardCheck },
  { value: "Custom", label: "training & nutrition", icon: Dumbbell },
];

const serviceIcons = {
  target: Target,
  users: Users,
  utensils: Utensils,
  moon: Moon,
};

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
};

function Home() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen overflow-hidden bg-background">
        <PublicNav />

        <main>
          <section className="relative overflow-hidden bg-hero-gradient pt-10">
            <div className="noise-overlay" />
            <div className="absolute inset-x-0 top-28 h-40 rotate-[-7deg] speed-lines opacity-40 animate-track-sweep" />
            <div className="pointer-events-none absolute -right-24 top-36 h-96 w-96 rounded-full border border-primary/20" />
            <div className="pointer-events-none absolute -right-8 top-52 h-72 w-72 rounded-full border border-aqua/30" />

            <div className="mx-auto grid max-w-7xl gap-10 px-6 pb-16 pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pb-24 lg:pt-20">
              <div className="relative z-10">
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45 }}
                  className="sport-pill inline-flex items-center gap-2.5 px-4 py-2 text-xs font-extrabold uppercase tracking-wider"
                >
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-primary" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
                  </span>
                  Now taking new clients · applications reviewed in 24h
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
                  className="mt-7 max-w-3xl text-mega text-4xl uppercase leading-[0.95] sm:text-5xl md:text-6xl lg:text-[64px]"
                >
                  Train with a plan that <span className="text-gradient">changes</span> when you do.
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 0.16 }}
                  className="mt-7 max-w-2xl text-lg font-medium leading-8 text-muted-foreground md:text-xl"
                >
                  Custom training and nutrition in one app. Every week you check in, {coach.name.split(" ")[0]} reads it, and your plan is rewritten around how the week actually went.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 0.26 }}
                  className="mt-9 flex flex-wrap items-center gap-3"
                >
                  <Button asChild size="lg" className="h-14 px-7 text-sm uppercase tracking-wider">
                    <Link to="/apply">
                      Apply for coaching <ArrowRight strokeWidth={3} />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="h-14 px-7 text-sm uppercase tracking-wider">
                    <Link to="/transformations">
                      <Play strokeWidth={3} /> See client results
                    </Link>
                  </Button>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.38 }}
                  className="mt-10 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4"
                >
                  {promises.map((item) => (
                    <div key={item.label} className="sport-card p-4">
                      <item.icon className="h-4 w-4 text-primary" strokeWidth={2.7} />
                      <div className="mt-3 font-display text-2xl font-extrabold uppercase lg:text-3xl">{item.value}</div>
                      <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{item.label}</div>
                    </div>
                  ))}
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.75, ease: [0.2, 0.8, 0.2, 1] }}
                className="relative flex justify-center lg:justify-end"
              >
                <div className="pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/20" />
                <div className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-aqua/25" />
                <PhonePreview />

                <div className="sport-card absolute -left-2 top-16 hidden items-center gap-3 p-4 animate-float-soft sm:flex lg:left-2">
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-primary/12 text-primary">
                    <Flame className="h-5 w-5" strokeWidth={2.8} />
                  </div>
                  <div>
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Streak</div>
                    <div className="font-display text-xl font-extrabold uppercase">12 days</div>
                  </div>
                </div>

                <div className="sport-card absolute -bottom-2 right-0 hidden items-center gap-3 p-4 animate-float-soft sm:flex lg:right-6">
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-aqua/12 text-aqua">
                    <ClipboardCheck className="h-5 w-5" strokeWidth={2.8} />
                  </div>
                  <div>
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Check-in</div>
                    <div className="font-display text-xl font-extrabold uppercase">Due Sunday</div>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="overflow-hidden border-y border-border/70 bg-card/50 py-4 backdrop-blur-xl">
              <div className="flex whitespace-nowrap animate-marquee font-display text-2xl font-extrabold uppercase text-foreground md:text-4xl">
                {Array.from({ length: 3 }).flatMap((_, round) =>
                  ticker.map((item) => (
                    <span key={`${round}-${item}`} className="mx-6 inline-flex items-center gap-5">
                      {item} <span className="h-3 w-3 rounded-full bg-primary" />
                    </span>
                  )),
                )}
              </div>
            </div>
          </section>

          <section className="relative overflow-hidden py-24">
            <div className="absolute inset-x-0 top-10 h-32 speed-lines opacity-25" />
            <div className="mx-auto max-w-7xl px-6">
              <SectionHeader kicker="Protocol" title="How coaching works" />
              <div className="mt-12 grid gap-5 md:grid-cols-4">
                {process.map((step, index) => (
                  <motion.div key={step.n} {...reveal} transition={{ duration: 0.5, delay: index * 0.08 }} className="sport-card relative overflow-hidden p-6">
                    <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/10" />
                    <div className="grid h-12 w-12 place-items-center rounded-full bg-brand-gradient font-display text-lg font-extrabold text-primary-foreground shadow-glow">
                      {step.n}
                    </div>
                    <h3 className="mt-5 font-display text-2xl font-extrabold uppercase">{step.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{step.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          <section className="bg-card/35 py-24">
            <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
              <motion.div {...reveal} transition={{ duration: 0.6 }} className="relative mx-auto max-w-md lg:mx-0">
                <div className="absolute -inset-5 rounded-full bg-energy-gradient opacity-70 blur-2xl" />
                <img src={coach.avatar} className="relative aspect-square w-full rounded-full border border-border object-cover shadow-glow" alt={`Portrait of ${coach.name}`} />
                <div className="sport-pill absolute -bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-2 px-5 py-3 text-xs font-extrabold uppercase tracking-wider">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary" /> Head coach
                </div>
              </motion.div>

              <motion.div {...reveal} transition={{ duration: 0.6 }}>
                <Kicker>Your coach</Kicker>
                <h2 className="mt-4 max-w-3xl font-display text-4xl font-extrabold uppercase leading-tight md:text-6xl">{coach.name}</h2>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">{coach.bio}</p>
                <div className="mt-7 flex flex-wrap gap-3">
                  {["NASM CPT", "PN Level 1", "Former D1 athlete", "10+ years"].map((credential) => (
                    <span key={credential} className="sport-pill px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                      {credential}
                    </span>
                  ))}
                </div>
              </motion.div>
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-6 py-24">
            <SectionHeader kicker="Arsenal" title="What's included" />
            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {services.map((service, index) => {
                const Icon = serviceIcons[service.icon as keyof typeof serviceIcons] ?? Target;
                return (
                  <motion.div key={service.title} {...reveal} transition={{ duration: 0.45, delay: index * 0.06 }} className="sport-card group p-6">
                    <div className="grid h-14 w-14 place-items-center rounded-full bg-primary/12 text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="h-7 w-7" strokeWidth={2.7} />
                    </div>
                    <h3 className="mt-6 font-display text-xl font-extrabold uppercase">{service.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{service.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-6 pb-24">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <SectionHeader kicker="Results" title="Client results" />
              <Button asChild variant="ghost" className="hidden font-extrabold uppercase tracking-wider md:inline-flex">
                <Link to="/transformations">View all <ArrowRight strokeWidth={3} /></Link>
              </Button>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {transformations.slice(0, 3).map((result, index) => (
                <motion.div key={result.id} {...reveal} transition={{ duration: 0.5, delay: index * 0.08 }} whileHover={{ y: -8 }}>
                  <Link to="/transformations" className="sport-card group block overflow-hidden transition-shadow hover:shadow-glow">
                    <div className="relative grid grid-cols-2 gap-2 p-3">
                      <img src={result.before} alt={`${result.name} before`} className="aspect-[3/4] rounded-[1.5rem] object-cover opacity-75 transition-opacity group-hover:opacity-100" loading="lazy" />
                      <img src={result.after} alt={`${result.name} after`} className="aspect-[3/4] rounded-[1.5rem] object-cover" loading="lazy" />
                      <span className="sport-pill absolute left-5 top-5 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider">before</span>
                      <span className="absolute right-5 top-5 rounded-full bg-brand-gradient px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-primary-foreground shadow-glow">after</span>
                    </div>
                    <div className="p-6 pt-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-display text-xl font-extrabold uppercase">{result.name}</div>
                        <span className="rounded-full bg-primary/12 px-3 py-1 font-mono text-xs font-bold text-primary">{result.lost}</span>
                      </div>
                      <div className="mt-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{result.weeks} weeks · {result.goal}</div>
                      <p className="mt-4 text-sm leading-6 text-muted-foreground">“{result.quote}”</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>

          <section className="bg-card/35 py-24">
            <div className="mx-auto max-w-7xl px-6">
              <SectionHeader kicker="Athletes speak" title="What clients say" />
              <div className="mt-12 grid gap-5 md:grid-cols-3">
                {testimonials.map((quote, index) => (
                  <motion.figure key={quote.name} {...reveal} transition={{ duration: 0.45, delay: index * 0.08 }} className="sport-card p-6">
                    <div className="flex gap-1 text-primary" aria-label="5 out of 5 stars">
                      {[1, 2, 3, 4, 5].map((star) => <Star key={star} className="h-4 w-4 fill-primary" aria-hidden="true" />)}
                    </div>
                    <blockquote className="mt-5 text-sm leading-7">“{quote.quote}”</blockquote>
                    <figcaption className="mt-6 flex items-center gap-3">
                      <Avatar className="h-11 w-11 border border-border">
                        <AvatarImage src={quote.avatar} alt="" />
                        <AvatarFallback>{quote.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-display text-sm font-extrabold uppercase">{quote.name}</div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{quote.role}</div>
                      </div>
                    </figcaption>
                  </motion.figure>
                ))}
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-6 py-24">
            <SectionHeader kicker="Pricing" title="Pick your lane" />
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {pricing.map((plan, index) => (
                <motion.div
                  key={plan.name}
                  {...reveal}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  className={`sport-card relative overflow-hidden p-8 ${plan.featured ? "border-primary/70 shadow-glow" : ""}`}
                >
                  {plan.featured && (
                    <span className="absolute right-5 top-5 rounded-full bg-brand-gradient px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-primary-foreground shadow-glow">
                      Most popular
                    </span>
                  )}
                  <h3 className="font-display text-2xl font-extrabold uppercase">{plan.name}</h3>
                  <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">{plan.desc}</p>
                  <div className="mt-7 flex items-end gap-1">
                    <span className="font-display text-6xl font-extrabold tabular-nums">${plan.price}</span>
                    <span className="mb-2 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">{plan.period}</span>
                  </div>
                  <Button asChild className="mt-7 h-12 w-full uppercase tracking-wider" variant={plan.featured ? "default" : "outline"}>
                    <Link to="/apply">{plan.cta} <ArrowRight strokeWidth={3} /></Link>
                  </Button>
                  <ul className="mt-7 space-y-3 text-sm">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={3} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </section>

          <section className="mx-auto max-w-4xl px-6 pb-24">
            <SectionHeader kicker="FAQ" title="Quick answers" center />
            <div className="mt-10 space-y-3">
              {faqs.map((faq) => (
                <details key={faq.q} className="sport-card group p-5 open:border-primary/50">
                  <summary className="cursor-pointer list-none font-display text-lg font-extrabold uppercase marker:hidden">
                    <span className="inline-flex w-full items-center justify-between gap-4">
                      {faq.q}
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/12 text-primary transition-transform group-open:rotate-45">
                        <Plus className="h-4 w-4" strokeWidth={3} />
                      </span>
                    </span>
                  </summary>
                  <p className="mt-4 text-sm leading-7 text-muted-foreground">{faq.a}</p>
                </details>
              ))}
            </div>
          </section>

          <section className="relative overflow-hidden py-24">
            <div className="absolute inset-x-0 top-1/2 h-48 -translate-y-1/2 speed-lines opacity-30" />
            <div className="mx-auto max-w-7xl px-6">
              <div className="relative overflow-hidden rounded-[3rem] bg-energy-gradient p-1 shadow-glow">
                <div className="relative overflow-hidden rounded-[2.8rem] bg-background/82 px-6 py-16 text-center backdrop-blur-xl md:px-16 md:py-20">
                  <div className="absolute -left-20 -top-20 h-56 w-56 rounded-full bg-primary/20 blur-2xl" />
                  <div className="absolute -bottom-24 right-8 h-72 w-72 rounded-full bg-aqua/20 blur-2xl" />
                  <h2 className="relative mx-auto max-w-4xl font-display text-4xl font-extrabold uppercase leading-tight md:text-7xl">
                    Ready to start?
                  </h2>
                  <p className="relative mx-auto mt-5 max-w-2xl text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    Applications reviewed within 24 hours · Limited coaching spots
                  </p>
                  <div className="relative mt-8 flex flex-wrap justify-center gap-3">
                    <Button asChild size="lg" className="h-14 px-8 uppercase tracking-wider">
                      <Link to="/apply">Apply now <ArrowRight strokeWidth={3} /></Link>
                    </Button>
                    <Button asChild size="lg" variant="outline" className="h-14 px-8 uppercase tracking-wider">
                      <Link to="/contact">Ask a question</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </MotionConfig>
  );
}

function Kicker({ children }: { children: ReactNode }) {
  return (
    <div className="sport-pill inline-flex items-center gap-2 px-4 py-2 text-[11px] font-extrabold uppercase tracking-wider text-primary">
      <span className="h-2 w-2 rounded-full bg-primary" />{children}
    </div>
  );
}

function SectionHeader({ kicker, title, center }: { kicker: string; title: string; center?: boolean }) {
  return (
    <div className={center ? "text-center" : ""}>
      <div className={`sport-pill inline-flex items-center gap-2 px-4 py-2 text-[11px] font-extrabold uppercase tracking-wider text-primary ${center ? "justify-center" : ""}`}>
        <span className="h-2 w-2 rounded-full bg-primary" />{kicker}
      </div>
      <h2 className={`mt-5 max-w-3xl font-display text-4xl font-extrabold uppercase leading-tight md:text-6xl ${center ? "mx-auto" : ""}`}>{title}</h2>
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
    <div role="img" aria-label="The FitnessOS client app, showing a due check-in, a message from the coach and weekly progress" className="relative w-[300px] shrink-0 rounded-[44px] border border-primary/30 bg-secondary p-2 shadow-glow">
      <div aria-hidden="true" className="flex h-[620px] flex-col overflow-hidden rounded-[36px] bg-background">
        <div className="flex flex-1 flex-col gap-3 px-4 pt-6">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-volt">Thu 17 Sep</div>
            <div className="mt-1 font-display text-[22px] font-extrabold uppercase">Morning, Sarah</div>
          </div>
          <div className="rounded-[1.4rem] border border-primary/30 bg-hero-gradient p-3.5 shadow-glow">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Weekly check-in</div>
            <div className="font-display text-lg font-extrabold uppercase leading-tight">Your check-in is due</div>
            <div className="mt-1 text-[11px] text-muted-foreground">Takes about 3 minutes.</div>
            <div className="mt-3 flex h-10 items-center justify-center gap-2 rounded-full bg-brand-gradient text-[13px] font-extrabold uppercase tracking-wider text-primary-foreground">
              <ClipboardCheck className="h-4 w-4" strokeWidth={3} /> Start
            </div>
          </div>
          <PreviewCard label="From your coach">
            <p className="text-[12px] leading-normal">Great depth on Tuesday's squats. If the first set feels easy today, add 2.5 kg.</p>
          </PreviewCard>
          <PreviewCard label="Progress">
            <div className="grid grid-cols-3 gap-2">
              {[["Weight", "71.8", "kg"], ["Sleep", "7.5", "h"], ["Energy", "8", "/10"]].map(([label, value, unit]) => (
                <div key={label}>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
                  <div><span className="font-display text-xl font-extrabold">{value}</span><span className="ml-0.5 text-[10px] text-muted-foreground">{unit}</span></div>
                </div>
              ))}
            </div>
          </PreviewCard>
        </div>
        <div className="grid grid-cols-5 border-t border-sidebar-border bg-sidebar px-1 pb-4 pt-2">
          {previewTabs.map(({ icon: Icon, label }, index) => (
            <div key={label} className={index === 0 ? "flex flex-col items-center gap-1 text-[9px] font-extrabold uppercase text-foreground" : "flex flex-col items-center gap-1 text-[9px] font-bold uppercase text-subtle-foreground"}>
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
    <div className="rounded-[1.4rem] border border-border bg-card p-3.5">
      <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}
