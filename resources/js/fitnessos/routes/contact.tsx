import { createFileRoute } from "@tanstack/react-router";
import { PublicNav, Footer } from "@fitnessos/components/public-nav";
import { Card } from "@fitnessos/components/ui/card";
import { Button } from "@fitnessos/components/ui/button";
import { Input } from "@fitnessos/components/ui/input";
import { Label } from "@fitnessos/components/ui/label";
import { Textarea } from "@fitnessos/components/ui/textarea";
import { Mail, MessageCircle, MapPin } from "lucide-react";
import { useState, type FormEvent } from "react";
import { postJson } from "@fitnessos/lib/api";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [
    { title: "Contact — FitnessOS" },
    { name: "description", content: "Get in touch with the FitnessOS team." },
  ]}),
  component: Contact,
});

function Contact() {
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', message: '' });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setResult(null);
    try {
      await postJson('/fitnessos/contact', form);
      setForm({ first_name: '', last_name: '', email: '', message: '' });
      setResult('Message sent. We will reply by email.');
    } catch (cause) {
      setResult(cause instanceof Error ? cause.message : 'Unable to send message.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid gap-12 md:grid-cols-2">
          <div>
            <div className="text-sm font-semibold text-primary">Contact</div>
            <h1 className="mt-3 text-5xl font-semibold tracking-tight md:text-6xl">Say hi.</h1>
            <p className="mt-4 max-w-md text-muted-foreground">Questions about coaching or the platform? We reply within one business day.</p>

            <div className="mt-10 space-y-4">
              {[
                { i: Mail, t: "Email", v: "hello@fitnessos.app" },
                { i: MessageCircle, t: "Support", v: "support@fitnessos.app" },
                { i: MapPin, t: "HQ", v: "Los Angeles, CA" },
              ].map((c) => (
                <div key={c.t} className="flex items-center gap-4">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><c.i className="h-4 w-4" /></div>
                  <div>
                    <div className="text-xs text-muted-foreground">{c.t}</div>
                    <div className="font-medium">{c.v}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Card className="border-border/60 bg-card p-8 shadow-card-premium">
            <form className="space-y-5" onSubmit={submit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label className="mb-2 block">First name</Label><Input required placeholder="Sarah" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} /></div>
                <div><Label className="mb-2 block">Last name</Label><Input required placeholder="Chen" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} /></div>
              </div>
              <div><Label className="mb-2 block">Email</Label><Input required type="email" placeholder="you@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              <div><Label className="mb-2 block">Message</Label><Textarea required rows={5} placeholder="How can we help?" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} /></div>
              {result && <p role="status" className="text-sm text-primary">{result}</p>}
              <Button type="submit" disabled={busy} className="w-full">{busy ? 'Sending…' : 'Send message'}</Button>
            </form>
          </Card>
        </div>
      </section>
      <Footer />
    </div>
  );
}
