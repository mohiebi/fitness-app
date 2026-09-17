import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import {
  Activity,
  ArrowRight,
  Check,
  Flame,
  Moon,
  Play,
  Sparkles,
  Star,
  Target,
  Timer,
  Trophy,
  Users,
  Utensils,
  Zap,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@fitnessos/components/ui/avatar";
import { Button } from "@fitnessos/components/ui/button";
import { Footer, PublicNav } from "@fitnessos/components/public-nav";
import { coach, faqs, pricing, process, services, testimonials, transformations } from "@fitnessos/lib/mock-data";

export const Route = createFileRoute("/")({ component: Home });

const ticker = ["move fast", "lift smart", "coach louder", "fuel wins", "track momentum", "fitnessos"];

const stats = [
  { value: "500+", label: "transformations", icon: Trophy },
  { value: "94%", label: "weekly completion", icon: Activity },
  { value: "4.9", label: "coach rating", icon: Star },
  { value: "12w", label: "average sprint", icon: Timer },
];

const serviceIcons = {
  target: Target,
  users: Users,
  utensils: Utensils,
  moon: Moon,
};

function Home() {
  return (
    <div className="min-h-screen overflow-hidden bg-background">
      <PublicNav />

      <main>
        <section className="relative overflow-hidden bg-hero-gradient pt-10">
          <div className="noise-overlay" />
          <div className="absolute inset-x-0 top-28 h-40 rotate-[-7deg] speed-lines opacity-40 animate-track-sweep" />
          <div className="pointer-events-none absolute -right-24 top-36 h-96 w-96 rounded-full border border-primary/20" />
          <div className="pointer-events-none absolute -right-8 top-52 h-72 w-72 rounded-full border border-aqua/30" />

          <div className="mx-auto grid max-w-7xl gap-10 px-6 pb-20 pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pb-28 lg:pt-20">
            <div className="relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="sport-pill inline-flex items-center gap-2 px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-foreground"
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-primary" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
                </span>
                Live coach sprint · 2,417 athletes moving
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
                className="mt-7 max-w-4xl font-display text-6xl font-extrabold uppercase leading-[0.92] md:text-8xl lg:text-9xl"
              >
                Coach with <span className="text-gradient">game-day</span> energy.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.16 }}
                className="mt-7 max-w-2xl text-lg font-medium leading-8 text-muted-foreground md:text-xl"
              >
                FitnessOS turns training plans, nutrition, check-ins, payments and client momentum into one fast, rounded, sport-first coaching cockpit.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.26 }}
                className="mt-9 flex flex-wrap items-center gap-3"
              >
                <Button asChild size="lg" className="h-14 px-7 text-sm uppercase tracking-wider">
                  <Link to="/apply">
                    Start coaching sprint <ArrowRight className="ml-1 h-4 w-4" strokeWidth={3} />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-14 px-7 text-sm uppercase tracking-wider">
                  <Link to="/dashboard">
                    <Play className="h-4 w-4" strokeWidth={3} /> Tour platform
                  </Link>
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.38 }}
                className="mt-10 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4"
              >
                {stats.map((item) => (
                  <div key={item.label} className="sport-card p-4 transition-transform duration-300 hover:-translate-y-1 hover:scale-[1.03]">
                    <item.icon className="h-4 w-4 text-primary" strokeWidth={2.7} />
                    <div className="mt-3 font-display text-3xl font-extrabold tabular-nums">{item.value}</div>
                    <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{item.label}</div>
                  </div>
                ))}
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.75, ease: [0.2, 0.8, 0.2, 1] }}
              className="relative min-h-[560px] lg:min-h-[660px]"
            >
              <div className="absolute inset-6 rounded-full border border-primary/25 bg-primary/5" />
              <div className="absolute inset-16 rounded-full border border-aqua/30" />
              <div className="absolute inset-28 rounded-full border border-accent/30" />
              <div className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-energy-gradient p-1 shadow-glow">
                <div className="grid h-full w-full place-items-center rounded-full bg-background/86 text-center backdrop-blur-xl">
                  <div>
                    <DumbbellMark />
                    <div className="mt-4 font-display text-5xl font-extrabold tabular-nums text-primary">78%</div>
                    <div className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">weekly goal</div>
                  </div>
                </div>
              </div>

              <HeroBubble className="left-0 top-20" icon={Flame} label="Calories" value="1,840" tone="primary" />
              <HeroBubble className="right-2 top-6" icon={Sparkles} label="AI plan" value="Ready" tone="aqua" />
              <HeroBubble className="bottom-24 left-8" icon={Trophy} label="Streak" value="47 days" tone="sun" />
              <HeroBubble className="bottom-8 right-0" icon={Zap} label="Workout" value="55 min" tone="blaze" />

              <div className="absolute left-1/2 top-10 h-8 w-8 -translate-x-1/2 rounded-full bg-primary shadow-glow" />
              <div className="absolute bottom-36 right-24 h-5 w-5 rounded-full bg-aqua shadow-glow" />
              <div className="absolute bottom-48 left-24 h-6 w-6 rounded-full bg-blaze shadow-brutal-blaze" />
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

        <section className="mx-auto max-w-7xl px-6 py-24">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative mx-auto max-w-md lg:mx-0"
            >
              <div className="absolute -inset-5 rounded-full bg-energy-gradient opacity-70 blur-2xl" />
              <img src={coach.avatar} className="relative aspect-square w-full rounded-full border border-border object-cover shadow-glow" alt={`${coach.name} coaching portrait`} />
              <div className="sport-pill absolute -bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-2 px-5 py-3 text-xs font-extrabold uppercase tracking-wider">
                <span className="h-2.5 w-2.5 rounded-full bg-primary" /> Head coach
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Kicker>Meet your coach</Kicker>
              <h2 className="mt-4 max-w-3xl font-display text-4xl font-extrabold uppercase leading-tight md:text-6xl">
                Less rigid dashboard. More athletic momentum.
              </h2>
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

        <section className="relative overflow-hidden bg-card/35 py-24">
          <div className="absolute inset-x-0 top-10 h-32 speed-lines opacity-30" />
          <div className="mx-auto max-w-7xl px-6">
            <SectionHeader kicker="Protocol" title="Four rounded rounds. One fast rhythm." />
            <div className="mt-12 grid gap-5 md:grid-cols-4">
              {process.map((step, index) => (
                <motion.div
                  key={step.n}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="sport-card relative overflow-hidden p-6"
                >
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

        <section className="mx-auto max-w-7xl px-6 py-24">
          <SectionHeader kicker="Arsenal" title="Tools that feel alive, not corporate." />
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {services.map((service, index) => {
              const Icon = serviceIcons[service.icon as keyof typeof serviceIcons] ?? Target;
              return (
                <motion.div
                  key={service.title}
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: index * 0.06 }}
                  whileHover={{ y: -8, scale: 1.025 }}
                  className="sport-card group p-6"
                >
                  <div className="grid h-14 w-14 place-items-center rounded-full bg-primary/12 text-primary transition-all group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-7 w-7" strokeWidth={2.7} />
                  </div>
                  <h3 className="mt-6 font-display text-xl font-extrabold uppercase">{service.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{service.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-24">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeader kicker="Results" title="Real athletes. Real lift-off." />
            <Button asChild variant="ghost" className="hidden font-extrabold uppercase tracking-wider md:inline-flex">
              <Link to="/transformations">View all <ArrowRight className="ml-1 h-4 w-4" strokeWidth={3} /></Link>
            </Button>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {transformations.slice(0, 3).map((result, index) => (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                whileHover={{ y: -8, scale: 1.015 }}
                className="sport-card group overflow-hidden"
              >
                <div className="relative grid grid-cols-2 gap-2 p-3">
                  <img src={result.before} alt={`${result.name} before transformation`} className="aspect-[3/4] rounded-[1.5rem] object-cover opacity-75 transition-all group-hover:opacity-100" loading="lazy" />
                  <img src={result.after} alt={`${result.name} after transformation`} className="aspect-[3/4] rounded-[1.5rem] object-cover" loading="lazy" />
                  <span className="sport-pill absolute left-5 top-5 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider">before</span>
                  <span className="absolute right-5 top-5 rounded-full bg-brand-gradient px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-primary-foreground shadow-glow">after</span>
                </div>
                <div className="p-6 pt-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-display text-xl font-extrabold uppercase">{result.name}</div>
                    <span className="rounded-full bg-primary/12 px-3 py-1 text-xs font-extrabold text-primary">{result.lost}</span>
                  </div>
                  <div className="mt-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{result.weeks} weeks · {result.goal}</div>
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">“{result.quote}”</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="bg-card/35 py-24">
          <div className="mx-auto max-w-7xl px-6">
            <SectionHeader kicker="Athletes speak" title="Clients feel the energy." />
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {testimonials.map((quote, index) => (
                <motion.div
                  key={quote.name}
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: index * 0.08 }}
                  className="sport-card p-6"
                >
                  <div className="flex gap-1 text-primary">
                    {[1, 2, 3, 4, 5].map((star) => <Star key={star} className="h-4 w-4 fill-primary" />)}
                  </div>
                  <p className="mt-5 text-sm leading-7">“{quote.quote}”</p>
                  <div className="mt-6 flex items-center gap-3">
                    <Avatar className="h-11 w-11 border border-border">
                      <AvatarImage src={quote.avatar} />
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-display text-sm font-extrabold uppercase">{quote.name}</div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{quote.role}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-24">
          <SectionHeader kicker="Pricing" title="Pick your training lane." />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {pricing.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                whileHover={{ y: -8 }}
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
                  <Link to="/apply">{plan.cta} <ArrowRight className="ml-1 h-4 w-4" strokeWidth={3} /></Link>
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

        <section className="mx-auto max-w-4xl px-6 py-24">
          <SectionHeader kicker="FAQ" title="Quick answers." center />
          <div className="mt-10 space-y-3">
            {faqs.map((faq) => (
              <details key={faq.q} className="sport-card group p-5 open:border-primary/50">
                <summary className="cursor-pointer list-none font-display text-lg font-extrabold uppercase marker:hidden">
                  <span className="inline-flex w-full items-center justify-between gap-4">
                    {faq.q}
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/12 text-primary transition group-open:rotate-45">+</span>
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
                  Ready to make coaching feel like a win streak?
                </h2>
                <p className="relative mx-auto mt-5 max-w-2xl text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Applications reviewed within 24 hours · Limited coaching lanes open
                </p>
                <div className="relative mt-8 flex flex-wrap justify-center gap-3">
                  <Button asChild size="lg" className="h-14 px-8 uppercase tracking-wider">
                    <Link to="/apply">Apply now <ArrowRight className="ml-1 h-4 w-4" strokeWidth={3} /></Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="h-14 px-8 uppercase tracking-wider">
                    <Link to="/contact">Talk to us</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function HeroBubble({ className, icon: Icon, label, value, tone }: { className: string; icon: typeof Flame; label: string; value: string; tone: "primary" | "aqua" | "sun" | "blaze" }) {
  const toneClass = {
    primary: "text-primary bg-primary/12",
    aqua: "text-aqua bg-aqua/12",
    sun: "text-sun bg-sun/12",
    blaze: "text-blaze bg-blaze/12",
  }[tone];

  return (
    <div className={`sport-card absolute min-w-44 p-4 ${className}`}>
      <div className="flex items-center gap-3">
        <div className={`grid h-11 w-11 place-items-center rounded-full ${toneClass}`}>
          <Icon className="h-5 w-5" strokeWidth={2.8} />
        </div>
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="font-display text-xl font-extrabold uppercase">{value}</div>
        </div>
      </div>
    </div>
  );
}

function DumbbellMark() {
  return (
    <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-gradient text-primary-foreground shadow-glow">
      <Zap className="h-7 w-7" strokeWidth={3} />
    </div>
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
      <h2 className="mt-5 max-w-3xl font-display text-4xl font-extrabold uppercase leading-tight md:text-6xl">{title}</h2>
    </div>
  );
}