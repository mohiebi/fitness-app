import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { PublicNav, Footer } from "@fitnessos/components/public-nav";
import { Card } from "@fitnessos/components/ui/card";
import { Button } from "@fitnessos/components/ui/button";
import { t } from "@fitnessos/lib/i18n";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [
    { title: t("About — FitnessOS") },
    { name: "description", content: t("Why we built FitnessOS: a home for coaches and the people they train.") },
  ]}),
  component: About,
});

const values = [
  { title: "Coaches first", desc: "Coaches own their profile, their prices and their trainees. We give them the tools, not a script." },
  { title: "Trainees stay free to choose", desc: "Switching or stopping is one tap. Your intake and check-in history always stay in your account." },
  { title: "AI behind the coach, never in front", desc: "AI helps coaches draft plans and replies faster. Every word is approved by the coach, and trainees never chat with a bot." },
];

function About() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <section className="mx-auto max-w-4xl px-6 py-24">
        <div className="text-xs font-extrabold uppercase tracking-widest text-primary">{t("About")}</div>
        <h1 className="mt-3 text-5xl font-semibold leading-tight tracking-tight md:text-6xl">
          {t("Good coaching should be")} <span className="text-gradient">{t("easy to find.")}</span>
        </h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          {t("Most people who want a coach find one through a friend or a social media page, then juggle chat apps, PDFs and spreadsheets. FitnessOS puts it in one place: public coach profiles to choose from, personal plans, weekly check-ins and direct chat.")}
        </p>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {values.map((value) => (
            <Card key={value.title} className="border-border/60 bg-card p-6 shadow-card-premium">
              <h2 className="font-semibold">{t(value.title)}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{t(value.desc)}</p>
            </Card>
          ))}
        </div>

        <div className="mt-20 rounded-2xl border border-border/60 bg-card p-10 text-center">
          <h2 className="text-2xl font-semibold">{t("Ready to start?")}</h2>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild><Link to="/coaches">{t("Find a coach")} <ArrowRight className="rtl:rotate-180" /></Link></Button>
            <Button asChild variant="outline"><a href="/register?role=coach">{t("Join as a coach")}</a></Button>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
