import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@fitnessos/components/app-shell";
import { Card } from "@fitnessos/components/ui/card";
import { Button } from "@fitnessos/components/ui/button";
import { Input } from "@fitnessos/components/ui/input";
import { Label } from "@fitnessos/components/ui/label";
import { Textarea } from "@fitnessos/components/ui/textarea";
import { Slider } from "@fitnessos/components/ui/slider";
import { Camera } from "lucide-react";
import { useState } from "react";
import { postJson } from "@fitnessos/lib/api";

export const Route = createFileRoute("/app/checkin")({ component: Checkin });

function Checkin() {
  const [form, setForm] = useState(() => {
    const empty = { weight_kg: '', waist_cm: '', sleep_hours: '', steps: '', energy: 5, hunger: 5, reflection: '', adjustments: '' };
    try {
      return { ...empty, ...JSON.parse(localStorage.getItem('fitnessos-checkin-draft') ?? '{}') } as typeof empty;
    } catch {
      return empty;
    }
  });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const submit = async () => {
    setBusy(true);
    setResult(null);
    try {
      await postJson('/fitnessos/checkins', {
        ...form,
        weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
        waist_cm: form.waist_cm ? Number(form.waist_cm) : null,
        sleep_hours: form.sleep_hours ? Number(form.sleep_hours) : null,
        steps: form.steps ? Number(form.steps) : null,
      });
      setResult('Check-in submitted to your coach.');
      setForm({ weight_kg: '', waist_cm: '', sleep_hours: '', steps: '', energy: 5, hunger: 5, reflection: '', adjustments: '' });
      localStorage.removeItem('fitnessos-checkin-draft');
    } catch (cause) {
      setResult(cause instanceof Error ? cause.message : 'Unable to submit check-in.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div>
      <PageHeader title="Weekly check-in" description="Takes 5 minutes. Coach will reply within 24h." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/60 bg-card p-6 shadow-card-premium">
          <h3 className="mb-4 font-semibold">Metrics</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div><Label className="mb-2 block">Weight (kg)</Label><Input type="number" step="0.1" value={form.weight_kg} onChange={e => setForm({ ...form, weight_kg: e.target.value })} /></div>
            <div><Label className="mb-2 block">Waist (cm)</Label><Input type="number" step="0.1" value={form.waist_cm} onChange={e => setForm({ ...form, waist_cm: e.target.value })} /></div>
            <div><Label className="mb-2 block">Sleep avg (h)</Label><Input type="number" step="0.1" value={form.sleep_hours} onChange={e => setForm({ ...form, sleep_hours: e.target.value })} /></div>
            <div><Label className="mb-2 block">Steps avg</Label><Input type="number" value={form.steps} onChange={e => setForm({ ...form, steps: e.target.value })} /></div>
          </div>
          <div className="mt-6"><Label className="mb-2 block">Energy · {form.energy}/10</Label><Slider value={[form.energy]} onValueChange={v => setForm({ ...form, energy: v[0] })} min={1} max={10} step={1} /></div>
          <div className="mt-6"><Label className="mb-2 block">Hunger · {form.hunger}/10</Label><Slider value={[form.hunger]} onValueChange={v => setForm({ ...form, hunger: v[0] })} min={1} max={10} step={1} /></div>
        </Card>

        <Card className="border-border/60 bg-card p-6 shadow-card-premium">
          <h3 className="mb-4 font-semibold">Photos</h3>
          <p className="mb-4 text-sm text-muted-foreground">Photo uploads are not available yet.</p>
          <div className="grid grid-cols-3 gap-3">
            {[1,2,3].map(i => (
              <div key={i} className="grid aspect-[3/4] place-items-center rounded-xl border-2 border-dashed border-border/60 text-muted-foreground">
                <div className="text-center"><Camera className="mx-auto h-6 w-6" /><div className="mt-2 text-xs">Upload</div></div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="border-border/60 bg-card p-6 shadow-card-premium lg:col-span-2">
          <h3 className="mb-4 font-semibold">Reflection</h3>
          <Label className="mb-2 block">How did this week go?</Label>
          <Textarea rows={4} placeholder="Wins, struggles, anything on your mind…" value={form.reflection} onChange={e => setForm({ ...form, reflection: e.target.value })} />
          <Label className="mb-2 mt-4 block">Anything I should adjust?</Label>
          <Textarea rows={3} placeholder="Optional — energy, workouts, meals, life…" value={form.adjustments} onChange={e => setForm({ ...form, adjustments: e.target.value })} />
          {result && <p role="status" className="mt-4 text-sm text-primary">{result}</p>}
          <div className="mt-4 flex gap-2">
            <Button variant="outline" onClick={() => { localStorage.setItem('fitnessos-checkin-draft', JSON.stringify(form)); setResult('Draft saved on this device.'); }}>Save draft</Button>
            <Button disabled={busy} className="ml-auto" onClick={submit}>{busy ? 'Submitting…' : 'Submit check-in'}</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
