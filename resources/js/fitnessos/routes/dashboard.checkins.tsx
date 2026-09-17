import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ClipboardCheck, Moon, Ruler, Weight, Zap } from 'lucide-react';
import { PageHeader } from '@fitnessos/components/app-shell';
import { Card } from '@fitnessos/components/ui/card';
import { Badge } from '@fitnessos/components/ui/badge';
import { Button } from '@fitnessos/components/ui/button';
import { Textarea } from '@fitnessos/components/ui/textarea';
import { getJson, patchJson } from '@fitnessos/lib/api';

export const Route = createFileRoute('/dashboard/checkins')({ component: Checkins });

type Checkin = {
    id: number; client_id: number; client_name: string; weight_kg: string | null;
    waist_cm: string | null; sleep_hours: string | null; steps: number | null;
    energy: number | null; hunger: number | null; reflection: string | null;
    adjustments: string | null; status: string; created_at: string;
};

function Checkins() {
    const [active, setActive] = useState<number | null>(null);
    const [feedback, setFeedback] = useState('');
    const [saving, setSaving] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const queryClient = useQueryClient();
    const { data: checkins = [], isLoading, error } = useQuery({
        queryKey: ['fitnessos', 'checkins'],
        queryFn: () => getJson<Checkin[]>('/fitnessos/checkins'),
    });
    const selected = checkins.find((entry) => entry.id === active) ?? checkins[0];
    const sendFeedback = async () => {
        if (!selected || !feedback.trim()) return;
        setSaving(true);
        setResult(null);
        try {
            await patchJson(`/fitnessos/checkins/${selected.id}`, { feedback: feedback.trim() });
            setFeedback('');
            setResult('Feedback sent to the client.');
            await queryClient.invalidateQueries({ queryKey: ['fitnessos', 'checkins'] });
        } catch (cause) {
            setResult(cause instanceof Error ? cause.message : 'Unable to send feedback.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            <PageHeader title="Weekly check-ins" description="Review client updates and reply with feedback." />
            {isLoading && <p className="text-sm text-muted-foreground">Loading check-ins…</p>}
            {error && <p role="alert" className="text-sm text-destructive">{error instanceof Error ? error.message : 'Unable to load check-ins.'}</p>}
            <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
                <Card className="h-fit border-border/60 bg-card p-3 shadow-card-premium">
                    {checkins.map((entry) => (
                        <button key={entry.id} onClick={() => { setActive(entry.id); setResult(null); }} className={`mb-1 flex w-full items-center gap-3 rounded-xl p-3 text-left ${selected?.id === entry.id ? 'bg-primary/15' : 'hover:bg-accent/10'}`}>
                            <ClipboardCheck className="h-4 w-4 text-primary" />
                            <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{entry.client_name}</span><span className="text-xs text-muted-foreground">{new Date(entry.created_at).toLocaleDateString()}</span></span>
                            {entry.status === 'Pending' && <span className="h-2 w-2 rounded-full bg-primary" />}
                        </button>
                    ))}
                    {!isLoading && checkins.length === 0 && <p className="p-4 text-sm text-muted-foreground">No check-ins yet.</p>}
                </Card>

                {selected ? (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3"><h2 className="text-xl font-semibold">{selected.client_name}</h2><Badge variant="secondary">{selected.status}</Badge></div>
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            <Metric icon={Weight} label="Weight" value={selected.weight_kg ? `${selected.weight_kg} kg` : '—'} />
                            <Metric icon={Ruler} label="Waist" value={selected.waist_cm ? `${selected.waist_cm} cm` : '—'} />
                            <Metric icon={Moon} label="Sleep" value={selected.sleep_hours ? `${selected.sleep_hours} h` : '—'} />
                            <Metric icon={Zap} label="Energy" value={selected.energy ? `${selected.energy}/10` : '—'} />
                        </div>
                        <Card className="border-border/60 bg-card p-6 shadow-card-premium">
                            <h3 className="font-semibold">Reflection</h3>
                            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{selected.reflection || 'No reflection provided.'}</p>
                            {selected.adjustments && <><h3 className="mt-5 font-semibold">Requested adjustments</h3><p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{selected.adjustments}</p></>}
                        </Card>
                        <Card className="border-border/60 bg-card p-6 shadow-card-premium">
                            <h3 className="mb-3 font-semibold">Coach feedback</h3>
                            <Textarea rows={5} placeholder="Write feedback for this check-in…" value={feedback} onChange={(event) => setFeedback(event.target.value)} />
                            {result && <p role="status" className="mt-3 text-sm text-primary">{result}</p>}
                            <Button disabled={saving || !feedback.trim()} onClick={sendFeedback} className="mt-4 rounded-full bg-brand-gradient text-primary-foreground">{saving ? 'Sending…' : 'Send feedback'}</Button>
                        </Card>
                    </div>
                ) : <div className="grid min-h-64 place-items-center text-sm text-muted-foreground">Select a check-in to review.</div>}
            </div>
        </div>
    );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Weight; label: string; value: string }) {
    return <Card className="border-border/60 bg-card p-5 shadow-card-premium"><Icon className="h-5 w-5 text-primary" /><div className="mt-3 text-xs uppercase text-muted-foreground">{label}</div><div className="mt-1 text-xl font-semibold">{value}</div></Card>;
}
