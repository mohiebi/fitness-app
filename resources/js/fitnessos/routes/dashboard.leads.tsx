import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@fitnessos/components/app-shell";
import { StatCard } from "@fitnessos/components/stat-card";
import { Card } from "@fitnessos/components/ui/card";
import { Badge } from "@fitnessos/components/ui/badge";
import { Button } from "@fitnessos/components/ui/button";
import { Avatar, AvatarFallback } from "@fitnessos/components/ui/avatar";
import { UserPlus, TrendingUp, Check, Plus } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { getJson, patchJson } from "@fitnessos/lib/api";

export const Route = createFileRoute("/dashboard/leads")({ component: Leads });

const stages = ["New", "Qualified", "Call booked", "Nurturing", "Won", "Lost"];
type Lead = { id: string; name: string; email: string; source: string; stage: string; date: string; created_at: string };
type ContactMessage = { id: number; first_name: string; last_name: string; email: string; message: string; created_at: string };

function Leads() {
  const queryClient = useQueryClient();
  const { data: leads = [], isLoading, error: loadError } = useQuery({
    queryKey: ['fitnessos', 'leads'],
    queryFn: () => getJson<Lead[]>('/fitnessos/leads'),
  });
  const { data: contactMessages = [] } = useQuery({
    queryKey: ['fitnessos', 'contact-messages'],
    queryFn: () => getJson<ContactMessage[]>('/fitnessos/contact-messages'),
  });
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const updateStage = async (lead: Lead, stage: string) => {
    setSaving(lead.id);
    setError(null);
    try {
      await patchJson(`/fitnessos/leads/${lead.id}`, { stage });
      await queryClient.invalidateQueries({ queryKey: ['fitnessos', 'leads'] });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to update lead.');
    } finally {
      setSaving(null);
    }
  };
  const newThisWeek = leads.filter(l => new Date(l.created_at).getTime() >= Date.now() - 7 * 86400000).length;
  return (
    <div>
      <PageHeader title="Leads" description="Track applications and convert prospects into clients."
        actions={<Button asChild className="rounded-full bg-brand-gradient text-primary-foreground"><a href="/apply"><Plus className="mr-2 h-4 w-4" />New application</a></Button>} />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="New this week" value={newThisWeek} icon={UserPlus} />
        <StatCard label="Total leads" value={leads.length} icon={TrendingUp} />
        <StatCard label="Qualified" value={leads.filter(l => l.stage === 'Qualified').length} icon={Check} />
        <StatCard label="Won" value={leads.filter(l => l.stage === 'Won').length} icon={Check} />
      </div>

      {isLoading && <p className="mt-6 text-sm text-muted-foreground">Loading leads…</p>}
      {(error || loadError) && <p role="alert" className="mt-6 text-sm text-destructive">{error || (loadError instanceof Error ? loadError.message : 'Unable to load leads.')}</p>}

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stages.map(stage => (
          <Card key={stage} className="border-border/60 bg-card p-4 shadow-card-premium">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-primary" /><h3 className="font-semibold">{stage}</h3></div>
              <Badge variant="secondary">{leads.filter(l => l.stage === stage).length}</Badge>
            </div>
            <div className="space-y-2">
              {leads.filter(l => l.stage === stage).map(l => (
                <Card key={l.id} className="border-border/60 bg-background p-3 shadow-none">
                  <div className="flex items-start gap-2">
                    <Avatar className="h-8 w-8"><AvatarFallback>{l.name[0]}</AvatarFallback></Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{l.name}</div>
                      <div className="truncate text-xs text-muted-foreground">{l.email}</div>
                      <div className="mt-2 flex items-center gap-2"><Badge variant="outline" className="text-[10px]">{l.source}</Badge></div>
                      <select aria-label={`Stage for ${l.name}`} value={l.stage} disabled={saving === l.id} onChange={e => void updateStage(l, e.target.value)} className="mt-2 w-full rounded-lg border border-border bg-background px-2 py-1 text-xs">
                        {stages.map(option => <option key={option} value={option}>{option}</option>)}
                      </select>
                    </div>
                    <span className="text-xs text-muted-foreground">{l.date}</span>
                  </div>
                </Card>
              ))}
              {leads.filter(l => l.stage === stage).length === 0 && <div className="rounded-lg border border-dashed border-border/60 p-6 text-center text-xs text-muted-foreground">Empty</div>}
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-6 border-border/60 bg-card p-6 shadow-card-premium">
        <h2 className="font-semibold">Contact messages</h2>
        <div className="mt-4 space-y-3">
          {contactMessages.map(message => <div key={message.id} className="rounded-xl border border-border/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-medium">{message.first_name} {message.last_name}</span><span className="text-xs text-muted-foreground">{new Date(message.created_at).toLocaleDateString()}</span></div>
            <a href={`mailto:${encodeURIComponent(message.email)}`} className="text-sm text-primary">{message.email}</a>
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{message.message}</p>
          </div>)}
          {contactMessages.length === 0 && <p className="text-sm text-muted-foreground">No contact messages yet.</p>}
        </div>
      </Card>
    </div>
  );
}
