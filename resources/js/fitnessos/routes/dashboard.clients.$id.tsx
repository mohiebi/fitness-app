import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, ClipboardCheck, User } from 'lucide-react';
import { Card } from '@fitnessos/components/ui/card';
import { Badge } from '@fitnessos/components/ui/badge';
import { Button } from '@fitnessos/components/ui/button';
import { Avatar, AvatarFallback } from '@fitnessos/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@fitnessos/components/ui/tabs';
import { getJson } from '@fitnessos/lib/api';

export const Route = createFileRoute('/dashboard/clients/$id')({ component: ClientDetail });

type Client = { id: string; name: string; email: string; joined_at: string | null };
type Checkin = { id: number; weight_kg: string | null; sleep_hours: string | null; energy: number | null; reflection: string | null; status: string; created_at: string };
type Message = { id: number; from: 'coach' | 'client'; text: string; time: string };

function ClientDetail() {
    const { id } = Route.useParams();
    const { data: client, isLoading, error } = useQuery({
        queryKey: ['fitnessos', 'client', id],
        queryFn: () => getJson<Client>(`/fitnessos/clients/${id}`),
    });
    const { data: checkins = [] } = useQuery({
        queryKey: ['fitnessos', 'checkins', id],
        queryFn: () => getJson<Checkin[]>(`/fitnessos/checkins/${id}`),
        enabled: Boolean(client),
    });
    const { data: messages = [] } = useQuery({
        queryKey: ['fitnessos', 'messages', id],
        queryFn: () => getJson<Message[]>(`/fitnessos/messages/${id}`),
        enabled: Boolean(client),
    });

    if (isLoading) return <p className="p-12 text-sm text-muted-foreground">Loading client…</p>;
    if (error || !client) return <p role="alert" className="p-12 text-sm text-destructive">{error instanceof Error ? error.message : 'Client not found.'}</p>;

    return (
        <div>
            <div className="mb-6 flex flex-wrap items-center gap-4">
                <Avatar className="h-16 w-16"><AvatarFallback>{client.name[0]}</AvatarFallback></Avatar>
                <div className="min-w-0">
                    <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{client.name}</h1>
                    <p className="mt-1 text-sm text-muted-foreground">{client.email}</p>
                </div>
                <Button asChild variant="outline" className="ml-auto rounded-full"><Link to="/dashboard/messages"><MessageSquare className="mr-2 h-4 w-4" />Messages</Link></Button>
            </div>

            <Tabs defaultValue="overview">
                <TabsList className="mb-6"><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="checkins">Check-ins</TabsTrigger><TabsTrigger value="messages">Messages</TabsTrigger></TabsList>
                <TabsContent value="overview" className="grid gap-4 md:grid-cols-3">
                    <Summary icon={User} label="Joined" value={client.joined_at ?? '—'} />
                    <Summary icon={ClipboardCheck} label="Check-ins" value={String(checkins.length)} />
                    <Summary icon={MessageSquare} label="Messages" value={String(messages.length)} />
                </TabsContent>
                <TabsContent value="checkins">
                    <Card className="space-y-3 border-border/60 bg-card p-6 shadow-card-premium">
                        {checkins.map((entry) => <div key={entry.id} className="rounded-xl border border-border/60 p-4">
                            <div className="flex justify-between gap-3"><span className="font-medium">{new Date(entry.created_at).toLocaleDateString()}</span><Badge variant="secondary">{entry.status}</Badge></div>
                            <p className="mt-2 text-sm text-muted-foreground">Weight {entry.weight_kg ?? '—'} kg · Sleep {entry.sleep_hours ?? '—'} h · Energy {entry.energy ?? '—'}/10</p>
                            {entry.reflection && <p className="mt-2 whitespace-pre-wrap text-sm">{entry.reflection}</p>}
                        </div>)}
                        {checkins.length === 0 && <p className="text-sm text-muted-foreground">No check-ins yet.</p>}
                    </Card>
                </TabsContent>
                <TabsContent value="messages">
                    <Card className="space-y-3 border-border/60 bg-card p-6 shadow-card-premium">
                        {messages.map((message) => <div key={message.id} className={`flex ${message.from === 'coach' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-md rounded-xl px-4 py-2 text-sm ${message.from === 'coach' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>{message.text}<div className="mt-1 text-xs opacity-70">{message.time}</div></div></div>)}
                        {messages.length === 0 && <p className="text-sm text-muted-foreground">No messages yet.</p>}
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function Summary({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
    return <Card className="border-border/60 bg-card p-5 shadow-card-premium"><Icon className="h-5 w-5 text-primary" /><div className="mt-3 text-xs uppercase text-muted-foreground">{label}</div><div className="mt-1 text-2xl font-semibold">{value}</div></Card>;
}
