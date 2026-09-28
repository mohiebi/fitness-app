import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MotionConfig, motion } from "framer-motion";
import type { ReactNode } from "react";
import {
  ArrowRight,
  BadgeCheck,
  ClipboardCheck,
  Contact,
  Dumbbell,
  Home as HomeIcon,
  LineChart,
  MessageSquare,
  Repeat,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
  Utensils,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@fitnessos/components/ui/accordion";
import { Button } from "@fitnessos/components/ui/button";
import { CoachCard } from "@fitnessos/components/coach-card";
import { Footer, PublicNav } from "@fitnessos/components/public-nav";
import { getJson } from "@fitnessos/lib/api";
import { formatDate, formatNumber } from "@fitnessos/lib/format";
import { t } from "@fitnessos/lib/i18n";
import type { CoachSummary } from "@fitnessos/lib/marketplace";

export const Route = createFileRoute("/")({ component: Home });

const promises = [
  { label: "Verified coaches", icon: BadgeCheck },
  { label: "Switch coach any time", icon: Repeat },
  { label: "Direct chat with your coach", icon: MessageSquare },
  { label: "Weekly check-ins", icon: ClipboardCheck },
];

const traineeSteps = [
  { title: "Find your coach", desc: "Browse public profiles by specialty, city and price. Every profile shows certifications and experience.", icon: Search },
  { title: "Send a request", desc: "Tell the coach your goal. Your intake profile goes with it, so they can plan safely from day one.", icon: Send },
  { title: "Train and check in", desc: "Follow your plan, send a weekly check-in and chat with your coach. Your history stays yours.", icon: Dumbbell },
];

const coachFeatures = [
  { title: "A public profile that sells", desc: "Your page in the coach directory with specialties, certifications and price. Share the link anywhere.", icon: Contact },
  { title: "Your trainees in one dashboard", desc: "Requests, check-in queue, chat and progress. See who is going quiet before they drop off.", icon: Users },
  { title: "AI assistant, you stay in charge", desc: "Draft plans and replies faster. Nothing reaches a trainee until you approve it, and trainees never talk to the AI.", icon: Sparkles },
];

const faqs = [
  { q: "Can I change my coach?", a: "Yes. Request a new coach any time. When they accept, your current coaching ends automatically. You can also stop coaching without picking someone new." },
  { q: "What happens to my data if I switch?", a: "Your intake profile and check-in history belong to you and stay in your account. Your previous coach loses access when the coaching ends." },
  { q: "Will I be talking to an AI?", a: "No. Coaches can use an AI assistant to draft plans and replies, but every message and plan is reviewed and approved by your coach before you see it." },
  { q: "How do I pay my coach?", a: "For now you agree on payment directly with your coach. In-app payments are coming soon." },
  { q: "How are coaches verified?", a: "Coaches upload their certifications and our team checks them. Verified coaches show a badge on their profile." },
];

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
};

function Home() {
  const { data: featured } = useQuery({
    queryKey: ["fitnessos", "coaches", "featured"],
    queryFn: () => getJson<{ data: CoachSummary[]; meta: { total: number } }>("/fitnessos/coaches"),
  });
  const coaches = featured?.data.slice(0, 3) ?? [];

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen overflow-hidden bg-background">
        <PublicNav />

        <main>
          <section className="relative overflow-hidden bg-hero-gradient pt-10">
            <div className="noise-overlay" />
            <div className="absolute inset-x-0 top-28 h-40 rotate-[-7deg] speed-lines opacity-40 animate-track-sweep" />

            <div className="mx-auto grid max-w-7xl gap-10 px-6 pb-16 pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pb-24 lg:pt-20">
              <div className="relative z-10">
                <motion.h1
                  initial={{ opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
                  className="max-w-3xl text-mega text-4xl leading-[1.15] sm:text-5xl md:text-6xl"
                >
                  {t("Find the right coach.")} <span className="text-gradient">{t("Follow a plan made for you.")}</span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 0.16 }}
                  className="mt-7 max-w-2xl text-lg font-medium leading-8 text-muted-foreground md:text-xl"
                >
                  {t("FitnessOS connects you with verified personal coaches. Pick one from their public profile, get a personal plan, check in every week and chat with them directly.")}
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 0.26 }}
                  className="mt-9 flex flex-wrap items-center gap-3"
                >
                  <Button asChild size="lg" className="h-14 px-7 text-base">
                    <Link to="/coaches">{t("Find a coach")} <ArrowRight strokeWidth={3} className="rtl:rotate-180" /></Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="h-14 px-7 text-base">
                    <a href="/register?role=coach">{t("I'm a coach")}</a>
                  </Button>
                </motion.div>

                <motion.ul
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.38 }}
                  className="mt-10 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4"
                >
                  {promises.map((item) => (
                    <li key={item.label} className="sport-card p-4">
                      <item.icon className="h-5 w-5 text-primary" strokeWidth={2.5} />
                      <div className="mt-3 text-sm font-bold leading-snug">{t(item.label)}</div>
                    </li>
                  ))}
                </motion.ul>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.75, ease: [0.2, 0.8, 0.2, 1] }}
                className="relative flex justify-center lg:justify-end"
              >
                <PhonePreview />
              </motion.div>
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-6 py-24">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <SectionHeader kicker={t("Coaches")} title={t("Coaches on FitnessOS")} />
              <Button asChild variant="outline"><Link to="/coaches">{t("See all coaches")} <ArrowRight className="rtl:rotate-180" /></Link></Button>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {coaches.map((coach) => <CoachCard key={coach.slug} coach={coach} />)}
            </div>
            {featured && coaches.length === 0 && (
              <div className="mt-10 rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
                {t("The first coaches are setting up their profiles. Are you a coach?")}{" "}
                <a href="/register?role=coach" className="font-bold text-primary hover:underline">{t("Create your profile")}</a>
              </div>
            )}
          </section>

          <section className="bg-card/35 py-24">
            <div className="mx-auto max-w-7xl px-6">
              <SectionHeader kicker={t("For trainees")} title={t("How it works")} />
              <ol className="mt-12 grid gap-5 md:grid-cols-3">
                {traineeSteps.map((step, index) => (
                  <motion.li key={step.title} {...reveal} transition={{ duration: 0.5, delay: index * 0.08 }} className="sport-card relative overflow-hidden p-6">
                    <div className="grid h-12 w-12 place-items-center rounded-full bg-brand-gradient font-display text-lg font-extrabold text-primary-foreground shadow-glow">
                      {formatNumber(index + 1)}
                    </div>
                    <h3 className="mt-5 font-display text-2xl font-extrabold">{t(step.title)}</h3>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{t(step.desc)}</p>
                  </motion.li>
                ))}
              </ol>
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-6 py-24">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
              <div>
                <SectionHeader kicker={t("For coaches")} title={t("Grow your coaching business")} />
                <p className="mt-5 max-w-xl text-lg text-muted-foreground">
                  {t("Get discovered by trainees looking for a coach like you, and run your whole coaching practice from one dashboard.")}
                </p>
                <Button asChild size="lg" className="mt-8 h-14 px-7 text-base">
                  <a href="/register?role=coach">{t("Create your coach profile")} <ArrowRight strokeWidth={3} className="rtl:rotate-180" /></a>
                </Button>
              </div>
              <div className="grid gap-4">
                {coachFeatures.map((feature, index) => (
                  <motion.div key={feature.title} {...reveal} transition={{ duration: 0.5, delay: index * 0.08 }} className="sport-card flex gap-4 p-6">
                    <feature.icon className="h-6 w-6 shrink-0 text-volt" />
                    <div>
                      <h3 className="text-lg font-bold">{t(feature.title)}</h3>
                      <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{t(feature.desc)}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-4xl px-6 pb-24">
            <SectionHeader kicker={t("Questions")} title={t("Frequently asked")} center />
            <Accordion type="single" collapsible className="mt-10">
              {faqs.map((item) => (
                <AccordionItem key={item.q} value={item.q}>
                  <AccordionTrigger className="text-start text-base font-bold">{t(item.q)}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{t(item.a)}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          <section className="px-4 pb-24">
            <div className="sport-card relative mx-auto max-w-6xl overflow-hidden bg-hero-gradient px-6 py-16 text-center">
              <div className="absolute inset-0 speed-lines opacity-20" />
              <ShieldCheck className="relative mx-auto h-10 w-10 text-volt" />
              <h2 className="relative mx-auto mt-5 max-w-3xl font-display text-4xl font-extrabold leading-tight md:text-5xl">
                {t("Your next coach is one request away.")}
              </h2>
              <div className="relative mt-8 flex flex-wrap justify-center gap-3">
                <Button asChild size="lg" className="h-14 px-7 text-base"><Link to="/coaches">{t("Find a coach")}</Link></Button>
                <Button asChild size="lg" variant="outline" className="h-14 px-7 text-base"><Link to="/contact">{t("Ask a question")}</Link></Button>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </MotionConfig>
  );
}

function SectionHeader({ kicker, title, center }: { kicker: string; title: string; center?: boolean }) {
  return (
    <div className={center ? "text-center" : ""}>
      <div className="sport-pill inline-flex items-center gap-2 px-4 py-2 text-[11px] font-extrabold uppercase tracking-wider text-primary">
        <span className="h-2 w-2 rounded-full bg-primary" />{kicker}
      </div>
      <h2 className={`mt-5 max-w-3xl font-display text-4xl font-extrabold leading-tight md:text-5xl ${center ? "mx-auto" : ""}`}>{title}</h2>
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

// A static illustration of the trainee app's Today screen for the hero.
function PhonePreview() {
  return (
    <div role="img" aria-label={t("The FitnessOS trainee app, showing a due check-in, a message from the coach and weekly progress")} className="relative w-[300px] shrink-0 rounded-[44px] border border-primary/30 bg-secondary p-2 shadow-glow">
      <div aria-hidden="true" className="flex h-[600px] flex-col overflow-hidden rounded-[36px] bg-background">
        <div className="flex flex-1 flex-col gap-3 px-4 pt-6">
          <div>
            <div className="text-[11px] text-volt">{formatDate(new Date(), { weekday: "long", day: "numeric", month: "long" })}</div>
            <div className="mt-1 font-display text-[22px] font-extrabold">{t("Good morning")}</div>
          </div>
          <div className="rounded-[1.4rem] border border-primary/30 bg-hero-gradient p-3.5 shadow-glow">
            <div className="mb-2 text-[11px] font-bold text-muted-foreground">{t("Weekly check-in")}</div>
            <div className="font-display text-lg font-extrabold leading-tight">{t("Your check-in is due")}</div>
            <div className="mt-3 flex h-10 items-center justify-center gap-2 rounded-full bg-brand-gradient text-[13px] font-extrabold text-primary-foreground">
              <ClipboardCheck className="h-4 w-4" strokeWidth={3} /> {t("Start check-in")}
            </div>
          </div>
          <PreviewCard label={t("From your coach")}>
            <p className="text-[12px] leading-normal">{t("Great depth on Tuesday's squats. If the first set feels easy today, add 2.5 kg.")}</p>
          </PreviewCard>
          <PreviewCard label={t("Progress")}>
            <div className="grid grid-cols-3 gap-2">
              {[[t("Weight"), formatNumber(71.8)], [t("Sleep"), formatNumber(7.5)], [t("Energy"), formatNumber(8)]].map(([label, value]) => (
                <div key={label}>
                  <div className="text-[10px] font-bold text-muted-foreground">{label}</div>
                  <div className="font-display text-xl font-extrabold">{value}</div>
                </div>
              ))}
            </div>
          </PreviewCard>
        </div>
        <div className="grid grid-cols-5 border-t border-sidebar-border bg-sidebar px-1 pb-4 pt-2">
          {previewTabs.map(({ icon: Icon, label }, index) => (
            <div key={label} className={index === 0 ? "flex flex-col items-center gap-1 text-[9px] font-extrabold text-foreground" : "flex flex-col items-center gap-1 text-[9px] font-bold text-subtle-foreground"}>
              <Icon className={index === 0 ? "h-[18px] w-[18px] text-primary" : "h-[18px] w-[18px]"} />
              {t(label)}
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
      <div className="mb-2 text-[11px] font-bold text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}
