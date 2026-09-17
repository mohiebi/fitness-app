import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PublicNav, Footer } from "@fitnessos/components/public-nav";
import { Card } from "@fitnessos/components/ui/card";
import { Button } from "@fitnessos/components/ui/button";
import { Input } from "@fitnessos/components/ui/input";
import { Label } from "@fitnessos/components/ui/label";
import { Textarea } from "@fitnessos/components/ui/textarea";
import { Progress } from "@fitnessos/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@fitnessos/components/ui/radio-group";
import { Check, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { postJson } from "@fitnessos/lib/api";

export const Route = createFileRoute("/apply")({
  head: () => ({ meta: [
    { title: "Apply — FitnessOS" },
    { name: "description", content: "Apply for premium 1:1 coaching. Applications reviewed within 24 hours." },
  ]}),
  component: Apply,
});

const steps = ["About you", "Your goals", "Your history", "Investment", "Review"];

function Apply() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", email: "", age: "", country: "", goal: "fat loss",
    timeline: "", success: "", experience: "intermediate", height_cm: "",
    weight_kg: "", limitations: "", package: "pro",
  });
  const setField = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await postJson('/fitnessos/apply', {
        ...form,
        age: form.age ? Number(form.age) : null,
        height_cm: form.height_cm ? Number(form.height_cm) : null,
        weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
      });
      setSubmitted(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to submit application.');
    } finally {
      setBusy(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <PublicNav />
        <section className="mx-auto max-w-2xl px-6 py-24 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/15 text-primary"><Check className="h-8 w-8" /></div>
          <h1 className="mt-6 text-4xl font-semibold">Application received</h1>
          <p className="mt-3 text-muted-foreground">We'll review and reply within 24 hours. Check your email.</p>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <section className="mx-auto max-w-3xl px-6 py-16">
        <div className="text-xs uppercase tracking-widest text-primary flex items-center gap-2">
          <Sparkles className="h-3 w-3" /> Coaching application
        </div>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">Let's build your plan.</h1>
        <p className="mt-3 text-muted-foreground">Takes 5 minutes. We review every application personally.</p>

        <div className="mt-10">
          <div className="mb-2 flex justify-between text-xs text-muted-foreground">
            <span>Step {step + 1} of {steps.length}</span>
            <span>{steps[step]}</span>
          </div>
          <Progress value={((step + 1) / steps.length) * 100} className="h-1.5" />
        </div>

        <Card className="mt-8 border-border/60 bg-card p-8 shadow-card-premium">
          {step === 0 && (
            <div className="space-y-5">
              <Field label="Full name"><Input placeholder="Sarah Chen" value={form.name} onChange={e => setField('name', e.target.value)} /></Field>
              <Field label="Email"><Input type="email" placeholder="you@email.com" value={form.email} onChange={e => setField('email', e.target.value)} /></Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Age"><Input type="number" placeholder="28" value={form.age} onChange={e => setField('age', e.target.value)} /></Field>
                <Field label="Country"><Input placeholder="United States" value={form.country} onChange={e => setField('country', e.target.value)} /></Field>
              </div>
            </div>
          )}
          {step === 1 && (
            <div className="space-y-5">
              <Field label="Primary goal">
                <RadioGroup value={form.goal} onValueChange={v => setField('goal', v)} className="grid grid-cols-2 gap-3">
                  {["Fat loss", "Muscle gain", "Recomp", "Strength", "Endurance", "Health"].map(g => (
                    <label key={g} className="flex cursor-pointer items-center gap-2 rounded-xl border border-border/60 bg-card p-3 hover:border-primary/40">
                      <RadioGroupItem value={g.toLowerCase()} />
                      <span className="text-sm">{g}</span>
                    </label>
                  ))}
                </RadioGroup>
              </Field>
              <Field label="Target timeline"><Input placeholder="e.g. 12 weeks before a wedding" value={form.timeline} onChange={e => setField('timeline', e.target.value)} /></Field>
              <Field label="What would success look like?"><Textarea rows={4} placeholder="Describe what winning looks like for you." value={form.success} onChange={e => setField('success', e.target.value)} /></Field>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-5">
              <Field label="Training experience">
                <RadioGroup value={form.experience} onValueChange={v => setField('experience', v)} className="grid grid-cols-3 gap-3">
                  {["Beginner", "Intermediate", "Advanced"].map(g => (
                    <label key={g} className="flex cursor-pointer items-center gap-2 rounded-xl border border-border/60 bg-card p-3 hover:border-primary/40">
                      <RadioGroupItem value={g.toLowerCase()} />
                      <span className="text-sm">{g}</span>
                    </label>
                  ))}
                </RadioGroup>
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Height (cm)"><Input type="number" placeholder="175" value={form.height_cm} onChange={e => setField('height_cm', e.target.value)} /></Field>
                <Field label="Weight (kg)"><Input type="number" placeholder="82" value={form.weight_kg} onChange={e => setField('weight_kg', e.target.value)} /></Field>
              </div>
              <Field label="Injuries or limitations"><Textarea rows={3} placeholder="Any injuries or restrictions we should know about?" value={form.limitations} onChange={e => setField('limitations', e.target.value)} /></Field>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-5">
              <Field label="Which package interests you?">
                <RadioGroup value={form.package} onValueChange={v => setField('package', v)} className="space-y-3">
                  {[
                    { v: "starter", n: "Starter", p: "$99/mo", d: "8-week starter program" },
                    { v: "pro", n: "Pro", p: "$199/mo", d: "12-week 1:1 coaching" },
                    { v: "elite", n: "Elite", p: "$399/mo", d: "24-week premium coaching" },
                  ].map(p => (
                    <label key={p.v} className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/60 bg-card p-4 hover:border-primary/40">
                      <RadioGroupItem value={p.v} />
                      <div className="flex-1"><div className="font-medium">{p.n}</div><div className="text-xs text-muted-foreground">{p.d}</div></div>
                      <div className="font-semibold">{p.p}</div>
                    </label>
                  ))}
                </RadioGroup>
              </Field>
            </div>
          )}
          {step === 4 && (
            <div className="space-y-4 text-sm">
              <div className="rounded-xl bg-primary/10 p-4 text-primary">Application ready to submit — we'll reply within 24h.</div>
              <p className="text-muted-foreground">Please confirm your details are correct on the previous steps. By submitting you agree to our terms.</p>
            </div>
          )}

          {error && <p role="alert" className="mt-6 text-sm text-destructive">{error}</p>}
          <div className="mt-8 flex items-center justify-between">
            <Button variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
            {step < steps.length - 1 ? (
              <Button className="rounded-full bg-brand-gradient text-primary-foreground" onClick={() => {
                if (step === 0 && (!form.name.trim() || !form.email.trim())) {
                  setError('Please enter your name and email.');
                  return;
                }
                setError(null);
                setStep(step + 1);
              }}>Next <ArrowRight className="ml-2 h-4 w-4" /></Button>
            ) : (
              <Button className="rounded-full bg-brand-gradient text-primary-foreground" disabled={busy} onClick={submit}>{busy ? 'Submitting…' : 'Submit application'}</Button>
            )}
          </div>
        </Card>
      </section>
      <Footer />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label className="mb-2 block">{label}</Label>{children}</div>;
}
