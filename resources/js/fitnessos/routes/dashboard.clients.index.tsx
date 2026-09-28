import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@fitnessos/components/app-shell";
import { Card } from "@fitnessos/components/ui/card";
import { Badge } from "@fitnessos/components/ui/badge";
import { Button } from "@fitnessos/components/ui/button";
import { Input } from "@fitnessos/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@fitnessos/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@fitnessos/components/ui/table";
import { Search, Plus } from "lucide-react";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@fitnessos/components/ui/dialog";
import { Label } from "@fitnessos/components/ui/label";
import { getJson, postJson } from "@fitnessos/lib/api";
import { t } from "@fitnessos/lib/i18n";
import { formatDate, formatNumber } from "@fitnessos/lib/format";
import { labelFrom, goals } from "@fitnessos/lib/marketplace";

export const Route = createFileRoute("/dashboard/clients/")({
  component: ClientsList,
  validateSearch: (search: Record<string, unknown>): { add?: boolean } => ({
    add: search.add === true || search.add === "true" || undefined,
  }),
});

type Client = { id: string; name: string; email: string; avatar: string | null; goal: string; status: string; package: string; progress: number; lastCheckin: string; notes: string; started_at: string | null };

function ClientsList() {
  const [q, setQ] = useState("");
  const { add } = Route.useSearch();
  const [open, setOpen] = useState(Boolean(add));
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { data: clients = [], isLoading, error } = useQuery({
    queryKey: ['fitnessos', 'clients'],
    queryFn: () => getJson<Client[]>('/fitnessos/clients'),
  });
  const filtered = clients.filter(c => c.name.toLowerCase().includes(q.toLowerCase()));
  const addClient = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const result = await postJson('/fitnessos/clients', { name, email }) as { message: string };
      setMessage(result.message);
      setName('');
      setEmail('');
      await queryClient.invalidateQueries({ queryKey: ['fitnessos', 'clients'] });
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : t('The request failed.'));
    } finally {
      setSaving(false);
    }
  };
  return (
    <div>
      <PageHeader
        title={t("Trainees")}
        description={t(":count active trainees.", { count: formatNumber(clients.length) })}
        actions={<Button onClick={() => setOpen(true)}><Plus />{t("Add trainee")}</Button>}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("Add a trainee you already coach")}</DialogTitle></DialogHeader>
          <form className="space-y-4" onSubmit={addClient}>
            <div><Label htmlFor="client-name">{t("Name")}</Label><Input id="client-name" required value={name} onChange={e => setName(e.target.value)} /></div>
            <div><Label htmlFor="client-email">{t("Email")}</Label><Input id="client-email" required type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
            <p className="text-xs text-muted-foreground">{t("They receive an email to set their password. New trainees can also find you through your public profile.")}</p>
            {message && <p role="status" className="text-sm">{message}</p>}
            <Button type="submit" disabled={saving} className="w-full">{saving ? t('Adding…') : t('Add trainee')}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Card className="border-border/60 bg-card p-4 shadow-card-premium">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder={t("Search trainees…")} value={q} onChange={e => setQ(e.target.value)} className="ps-9" />
          </div>
        </div>

        {isLoading && <p className="p-4 text-sm text-muted-foreground">{t("Loading…")}</p>}
        {error && <p role="alert" className="p-4 text-sm text-destructive">{error instanceof Error ? error.message : t('The request failed.')}</p>}

        <div className="mt-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("Trainee")}</TableHead>
                <TableHead>{t("Goal")}</TableHead>
                <TableHead>{t("Coaching since")}</TableHead>
                <TableHead>{t("Last check-in")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(c => (
                <TableRow key={c.id} className="cursor-pointer">
                  <TableCell>
                    <Link to="/dashboard/clients/$id" params={{ id: c.id }} className="flex items-center gap-3">
                      <Avatar className="h-8 w-8"><AvatarImage src={c.avatar ?? undefined} /><AvatarFallback>{c.name[0]}</AvatarFallback></Avatar>
                      <span className="font-medium">{c.name}</span>
                    </Link>
                  </TableCell>
                  <TableCell><Badge variant="secondary">{c.goal === "Not set" ? "—" : labelFrom(goals, c.goal)}</Badge></TableCell>
                  <TableCell className="text-sm">{c.started_at ? formatDate(c.started_at) : "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.lastCheckin === "No check-in yet" ? t("No check-in yet") : c.lastCheckin}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filtered.length === 0 && <div className="p-12 text-center text-muted-foreground">{t("No trainees yet. Accepted requests show up here.")}</div>}
        </div>
      </Card>
    </div>
  );
}
