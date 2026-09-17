import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Users, ClipboardCheck, UserPlus, MessageSquare, ArrowRight } from 'lucide-react';
import { PageHeader } from '@fitnessos/components/app-shell';
import { StatCard } from '@fitnessos/components/stat-card';
import { Card } from '@fitnessos/components/ui/card';
import { Button } from '@fitnessos/components/ui/button';
import { getJson } from '@fitnessos/lib/api';
import { currentUser } from '@fitnessos/lib/auth';

export const Route = createFileRoute('/dashboard/')({ component: DashboardIndex });

type Client = { id: string; name: string; email: string };
type Lead = { id: string; stage: string };
type Checkin = { id: number; client_name: string; status: string; created_at: string };
type Conversation = { id: string; name: string; last: string; time: string };

function DashboardIndex() {
    const { data: clients = [] } = useQuery({ queryKey: ['fitnessos', 'clients'], queryFn: () => getJson<Client[]>('/fitnessos/clients') });
    const { data: leads = [] } = useQuery({ queryKey: ['fitnessos', 'leads'], queryFn: () => getJson<Lead[]>('/fitnessos/leads') });
    const { data: checkins = [] } = useQuery({ queryKey: ['fitnessos', 'checkins'], queryFn: () => getJson<Checkin[]>('/fitnessos/checkins') });
    const { data: conversations = [] } = useQuery({ queryKey: ['fitnessos', 'conversations'], queryFn: () => getJson<Conversation[]>('/fitnessos/conversations') });

    return (
        <div>
            <PageHeader title={`Welcome back, ${currentUser() ?? 'Coach'}`} description="Your coaching activity at a glance." actions={<Button asChild className="rounded-full bg-brand-gradient text-primary-foreground"><Link to="/dashboard/clients">Manage clients</Link></Button>} />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Clients" value={clients.length} icon={Users} />
                <StatCard label="New leads" value={leads.filter((lead) => lead.stage === 'New').length} icon={UserPlus} />
                <StatCard label="Pending check-ins" value={checkins.filter((checkin) => checkin.status === 'Pending').length} icon={ClipboardCheck} />
                <StatCard label="Conversations" value={conversations.length} icon={MessageSquare} />
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <Card className="border-border/60 bg-card p-6 shadow-card-premium">
                    <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">Clients</h2><Button asChild variant="ghost" size="sm"><Link to="/dashboard/clients">View all <ArrowRight className="ml-1 h-4 w-4" /></Link></Button></div>
                    <div className="space-y-2">{clients.slice(0, 5).map((client) => <Link key={client.id} to="/dashboard/clients/$id" params={{ id: client.id }} className="block rounded-xl border border-border/60 p-3 transition hover:bg-accent/10"><div className="font-medium">{client.name}</div><div className="text-xs text-muted-foreground">{client.email}</div></Link>)}</div>
                    {clients.length === 0 && <p className="text-sm text-muted-foreground">No clients yet. Add one from the Clients page.</p>}
                </Card>
                <Card className="border-border/60 bg-card p-6 shadow-card-premium">
                    <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">Recent check-ins</h2><Button asChild variant="ghost" size="sm"><Link to="/dashboard/checkins">Review <ArrowRight className="ml-1 h-4 w-4" /></Link></Button></div>
                    <div className="space-y-2">{checkins.slice(0, 5).map((checkin) => <div key={checkin.id} className="flex items-center justify-between rounded-xl border border-border/60 p-3"><div><div className="font-medium">{checkin.client_name}</div><div className="text-xs text-muted-foreground">{new Date(checkin.created_at).toLocaleDateString()}</div></div><span className="text-xs text-primary">{checkin.status}</span></div>)}</div>
                    {checkins.length === 0 && <p className="text-sm text-muted-foreground">No check-ins yet.</p>}
                </Card>
            </div>
        </div>
    );
}
