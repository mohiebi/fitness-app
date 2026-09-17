import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@fitnessos/components/app-shell";
import { Card } from "@fitnessos/components/ui/card";
import { Badge } from "@fitnessos/components/ui/badge";
import { Button } from "@fitnessos/components/ui/button";
import { Input } from "@fitnessos/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@fitnessos/components/ui/avatar";
import { Progress } from "@fitnessos/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@fitnessos/components/ui/table";
import { Search, Plus } from "lucide-react";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@fitnessos/components/ui/dialog";
import { Label } from "@fitnessos/components/ui/label";
import { getJson, postJson } from "@fitnessos/lib/api";

export const Route = createFileRoute("/dashboard/clients/")({ component: ClientsList });

type Client = { id: string; name: string; email: string; avatar: string | null; goal: string; status: string; package: string; progress: number; lastCheckin: string; notes: string };

function ClientsList() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
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
      setMessage(cause instanceof Error ? cause.message : 'Unable to add client.');
    } finally {
      setSaving(false);
    }
  };
  return (
    <div>
      <PageHeader
        title="Clients"
        description={`${clients.length} clients in your account.`}
        actions={<Button className="rounded-full bg-brand-gradient text-primary-foreground" onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" />Add client</Button>}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add a client</DialogTitle></DialogHeader>
          <form className="space-y-4" onSubmit={addClient}>
            <div><Label htmlFor="client-name">Name</Label><Input id="client-name" required value={name} onChange={e => setName(e.target.value)} /></div>
            <div><Label htmlFor="client-email">Email</Label><Input id="client-email" required type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
            <p className="text-xs text-muted-foreground">The client will receive an account setup email when mail delivery is configured.</p>
            {message && <p role="status" className="text-sm">{message}</p>}
            <Button type="submit" disabled={saving} className="w-full">{saving ? 'Adding…' : 'Add client'}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Card className="border-border/60 bg-card p-4 shadow-card-premium">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search clients…" value={q} onChange={e => setQ(e.target.value)} className="pl-9" />
          </div>
        </div>

        {isLoading && <p className="p-4 text-sm text-muted-foreground">Loading clients…</p>}
        {error && <p role="alert" className="p-4 text-sm text-destructive">{error instanceof Error ? error.message : 'Unable to load clients.'}</p>}

        <div className="mt-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Goal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Package</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Last check-in</TableHead>
                <TableHead>Notes</TableHead>
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
                  <TableCell><Badge variant="secondary">{c.goal}</Badge></TableCell>
                  <TableCell>
                    <Badge className={c.status === "Active" ? "bg-primary/15 text-primary" : c.status === "At risk" ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground"}>
                      {c.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{c.package}</TableCell>
                  <TableCell>
                    <div className="w-32">
                      <div className="mb-1 flex justify-between text-xs"><span className="text-muted-foreground">{c.progress}%</span></div>
                      <Progress value={c.progress} className="h-1.5" />
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.lastCheckin}</TableCell>
                  <TableCell className="max-w-[240px] truncate text-sm text-muted-foreground">{c.notes}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filtered.length === 0 && <div className="p-12 text-center text-muted-foreground">No clients found.</div>}
        </div>
      </Card>
    </div>
  );
}
