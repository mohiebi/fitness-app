import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import type { ReactNode } from 'react';
import { PageHeader } from '@fitnessos/components/app-shell';
import { ActionTile } from '@fitnessos/components/stat-card';
import { Card } from '@fitnessos/components/ui/card';
import { Button } from '@fitnessos/components/ui/button';
import { getJson } from '@fitnessos/lib/api';
import { currentUser } from '@fitnessos/lib/auth';
import { daysSince, greeting, parseServerDate, shortAge, timeAgo, todayLabel } from '@fitnessos/lib/dates';
import { cn } from '@fitnessos/lib/utils';

export const Route = createFileRoute('/dashboard/')({ component: DashboardIndex });

type Client = { id: string; name: string; email: string };
type Lead = { id: string; name: string; email: string; stage: string; source: string; created_at: string };
type Checkin = {
    id: number; client_id: number; client_name: string; weight_kg: string | null;
    sleep_hours: string | null; energy: number | null; adjustments: string | null;
    status: string; created_at: string;
};
type Conversation = { id: string; name: string; last: string; time: string };

const QUIET_AFTER_DAYS = 7;

const pipeline = [
    { stage: 'New', color: 'bg-primary' },
    { stage: 'Qualified', color: 'bg-chart-2' },
    { stage: 'Call booked', color: 'bg-chart-3' },
    { stage: 'Nurturing', color: 'bg-input' },
];

function checkinFlag(entry: Checkin): { label: string; alert: boolean } | null {
    if (entry.sleep_hours !== null && Number(entry.sleep_hours) < 6) return { label: 'Low sleep', alert: true };
    if (entry.energy !== null && entry.energy <= 4) return { label: 'Low energy', alert: true };
    if (entry.adjustments) return { label: 'Wants changes', alert: false };
    return null;
}

// Checkins arrive newest first, so the first older entry with a weight is the previous weigh-in.
function weightChange(entry: Checkin, checkins: Checkin[]): number | null {
    if (entry.weight_kg === null) return null;
    const sent = parseServerDate(entry.created_at).getTime();
    const previous = checkins.find((other) => other.client_id === entry.client_id
        && other.weight_kg !== null
        && parseServerDate(other.created_at).getTime() < sent);
    return previous ? Number(entry.weight_kg) - Number(previous.weight_kg) : null;
}

function formatChange(kg: number) {
    const sign = kg > 0 ? '+' : kg < 0 ? '−' : '±';
    return `${sign}${Math.abs(kg).toFixed(1)}`;
}

function DashboardIndex() {
    const { data: clients = [] } = useQuery({ queryKey: ['fitnessos', 'clients'], queryFn: () => getJson<Client[]>('/fitnessos/clients') });
    const { data: leads = [] } = useQuery({ queryKey: ['fitnessos', 'leads'], queryFn: () => getJson<Lead[]>('/fitnessos/leads') });
    const { data: checkins = [] } = useQuery({ queryKey: ['fitnessos', 'checkins'], queryFn: () => getJson<Checkin[]>('/fitnessos/checkins') });
    const { data: conversations = [] } = useQuery({ queryKey: ['fitnessos', 'conversations'], queryFn: () => getJson<Conversation[]>('/fitnessos/conversations') });

    const pending = checkins.filter((entry) => entry.status === 'Pending').reverse();
    const newLeads = leads.filter((lead) => lead.stage === 'New').reverse();

    const lastCheckin = new Map<string, string>();
    for (const entry of checkins) {
        if (!lastCheckin.has(String(entry.client_id))) lastCheckin.set(String(entry.client_id), entry.created_at);
    }
    const quiet = clients
        .flatMap((client) => {
            const last = lastCheckin.get(client.id);
            return last && daysSince(last) >= QUIET_AFTER_DAYS ? [{ client, days: daysSince(last) }] : [];
        })
        .sort((a, b) => b.days - a.days);
    const awaitingFirst = clients.filter((client) => !lastCheckin.has(client.id));
    const recentConversations = conversations.filter((conversation) => conversation.time !== '').slice(0, 3);
    const stageCounts = pipeline.map((step) => ({ ...step, count: leads.filter((lead) => lead.stage === step.stage).length }));
    const openLeads = stageCounts.reduce((total, step) => total + step.count, 0);

    const waiting = [
        pending.length ? `${pending.length} ${pending.length === 1 ? 'check-in' : 'check-ins'}` : null,
        newLeads.length ? `${newLeads.length} new ${newLeads.length === 1 ? 'lead' : 'leads'}` : null,
    ].filter(Boolean);
    const summary = waiting.length
        ? `${waiting.join(' and ')} ${pending.length + newLeads.length === 1 ? 'is' : 'are'} waiting for you.`
        : 'Nothing is waiting on you right now.';
    const firstName = currentUser()?.split(' ')[0] ?? 'Coach';

    return (
        <div>
            <PageHeader
                eyebrow={todayLabel()}
                title={`${greeting()}, ${firstName}`}
                description={summary}
                actions={<>
                    <Button asChild variant="outline"><Link to="/dashboard/workouts">Build a plan</Link></Button>
                    <Button asChild><Link to="/dashboard/clients" search={{ add: true }}><Plus strokeWidth={2.6} />Add client</Link></Button>
                </>}
            />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <ActionTile label="Check-ins to review" value={pending.length} meta={pending[0] && `oldest ${shortAge(pending[0].created_at)}`} action="Review queue" to="/dashboard/checkins" />
                <ActionTile label="New leads" value={newLeads.length} meta={newLeads[0] && `oldest ${shortAge(newLeads[0].created_at)}`} action="Open leads" to="/dashboard/leads" />
                <ActionTile label="Going quiet" value={quiet.length} meta={`${QUIET_AFTER_DAYS}+ days`} action="Send a nudge" to="/dashboard/messages" tone="alert" />
                <ActionTile label="Clients" value={clients.length} action="Manage clients" to="/dashboard/clients" />
            </div>

            <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] xl:items-start">
                <div className="flex min-w-0 flex-col gap-5">
                    <Card className="px-6 pb-2 pt-5">
                        <SectionTitle title="Check-in queue" meta={pending.length ? 'oldest first' : undefined} link={<Link to="/dashboard/checkins">All check-ins</Link>} />
                        {pending.length === 0 ? (
                            <Empty>No check-ins waiting. New ones show up here as clients send them.</Empty>
                        ) : (
                            <div className="mt-2 overflow-x-auto">
                                <table className="w-full min-w-[640px] text-sm">
                                    <thead>
                                        <tr className="border-b border-border text-left text-xs text-subtle-foreground">
                                            <th className="py-2.5 font-semibold">Client</th>
                                            <th className="py-2.5 font-semibold">Sent</th>
                                            <th className="py-2.5 font-semibold">Weight</th>
                                            <th className="py-2.5 font-semibold">Sleep</th>
                                            <th className="py-2.5 font-semibold">Energy</th>
                                            <th className="py-2.5 font-semibold">Flag</th>
                                            <th className="py-2.5"><span className="sr-only">Action</span></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pending.slice(0, 6).map((entry) => {
                                            const change = weightChange(entry, checkins);
                                            const flag = checkinFlag(entry);
                                            return (
                                                <tr key={entry.id} className="border-b border-border last:border-0">
                                                    <td className="py-3 pr-3">
                                                        <div className="flex items-center gap-3"><Initials name={entry.client_name} /><span className="font-semibold">{entry.client_name}</span></div>
                                                    </td>
                                                    <td className="py-3 pr-3 font-mono text-[13px] text-muted-foreground">{timeAgo(entry.created_at)}</td>
                                                    <td className="py-3 pr-3 font-mono text-[13px]">
                                                        {entry.weight_kg ? `${Number(entry.weight_kg).toFixed(1)} kg` : '—'}
                                                        {change !== null && <span className="ml-2 text-muted-foreground">{formatChange(change)}</span>}
                                                    </td>
                                                    <td className="py-3 pr-3 font-mono text-[13px]">{entry.sleep_hours ? `${Number(entry.sleep_hours)} h` : '—'}</td>
                                                    <td className="py-3 pr-3 font-mono text-[13px]">{entry.energy ? `${entry.energy}/10` : '—'}</td>
                                                    <td className="py-3 pr-3">
                                                        {flag
                                                            ? <span className={cn('inline-flex h-6 items-center whitespace-nowrap rounded-full px-2.5 text-xs font-semibold', flag.alert ? 'bg-destructive/15 text-destructive' : 'bg-secondary text-muted-foreground')}>{flag.label}</span>
                                                            : <span className="text-subtle-foreground">—</span>}
                                                    </td>
                                                    <td className="py-3 text-right">
                                                        <Button asChild variant="outline" size="sm"><Link to="/dashboard/checkins" search={{ checkin: entry.id }}>Review</Link></Button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>

                    <Card className="px-6 pb-2 pt-5">
                        <SectionTitle title="Going quiet" meta={`No check-in for ${QUIET_AFTER_DAYS}+ days`} />
                        <div className="mt-2 divide-y divide-border border-t border-border">
                            {quiet.map(({ client, days }) => (
                                <PersonRow key={client.id} name={client.name} detail={client.email}>
                                    <span className="font-mono text-[13px] text-destructive">{days} days</span>
                                    <Button asChild variant="outline" size="sm"><Link to="/dashboard/messages" search={{ client: client.id }}>Send nudge</Link></Button>
                                </PersonRow>
                            ))}
                            {awaitingFirst.slice(0, 4).map((client) => (
                                <PersonRow key={client.id} name={client.name} detail="Waiting for their first check-in">
                                    <Button asChild variant="outline" size="sm"><Link to="/dashboard/messages" search={{ client: client.id }}>Message</Link></Button>
                                </PersonRow>
                            ))}
                            {quiet.length === 0 && awaitingFirst.length === 0 && (
                                <Empty>{clients.length ? 'Everyone has checked in within the last week.' : 'Add a client to start tracking check-ins.'}</Empty>
                            )}
                        </div>
                    </Card>
                </div>

                <div className="flex min-w-0 flex-col gap-5">
                    <Card className="px-[22px] pb-2 pt-5">
                        <SectionTitle title="Conversations" link={<Link to="/dashboard/messages">Inbox</Link>} />
                        <div className="mt-2 divide-y divide-border border-t border-border">
                            {recentConversations.map((conversation) => (
                                <Link key={conversation.id} to="/dashboard/messages" search={{ client: conversation.id }} className="group flex gap-3 py-3.5">
                                    <Initials name={conversation.name} />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="flex-1 truncate text-sm font-semibold group-hover:underline">{conversation.name}</span>
                                            <span className="shrink-0 font-mono text-[11px] text-subtle-foreground">{conversation.time}</span>
                                        </div>
                                        <p className="mt-1 line-clamp-2 text-[13px] leading-normal text-muted-foreground">{conversation.last}</p>
                                    </div>
                                </Link>
                            ))}
                            {recentConversations.length === 0 && <Empty>No messages yet.</Empty>}
                        </div>
                    </Card>

                    <Card className="px-[22px] pb-2 pt-5">
                        <SectionTitle title="Leads" link={<Link to="/dashboard/leads">Pipeline</Link>} />
                        {openLeads > 0 && (
                            <>
                                <div className="mt-4 flex h-2 gap-[3px]" aria-hidden="true">
                                    {stageCounts.filter((step) => step.count > 0).map((step) => (
                                        <span key={step.stage} className={cn('rounded-full', step.color)} style={{ flexGrow: step.count }} />
                                    ))}
                                </div>
                                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[13px] text-muted-foreground">
                                    {stageCounts.map((step) => (
                                        <div key={step.stage} className="flex items-center gap-2">
                                            <span className={cn('h-2 w-2 rounded-sm', step.color)} />
                                            <dt className="flex-1">{step.stage}</dt>
                                            <dd className="font-mono text-foreground">{step.count}</dd>
                                        </div>
                                    ))}
                                </dl>
                            </>
                        )}
                        <div className="mt-4 divide-y divide-border border-t border-border">
                            {newLeads.slice(0, 3).map((lead) => (
                                <div key={lead.id} className="flex items-center gap-3 py-3">
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-sm font-semibold">{lead.name}</div>
                                        <div className="text-xs text-subtle-foreground">{lead.source} · {timeAgo(lead.created_at)}</div>
                                    </div>
                                    <a href={`mailto:${lead.email}`} className="text-sm font-bold text-primary hover:underline">Email</a>
                                </div>
                            ))}
                            {newLeads.length === 0 && <Empty>No new leads. Applications from your site land here.</Empty>}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function SectionTitle({ title, meta, link }: { title: string; meta?: string; link?: ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <div className="flex items-baseline gap-3">
                <h2 className="text-lg font-semibold">{title}</h2>
                {meta && <span className="text-[13px] text-subtle-foreground">{meta}</span>}
            </div>
            {link && <span className="text-sm font-semibold text-muted-foreground hover:text-foreground">{link}</span>}
        </div>
    );
}

function PersonRow({ name, detail, children }: { name: string; detail: string; children: ReactNode }) {
    return (
        <div className="flex items-center gap-3 py-3.5">
            <Initials name={name} />
            <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{name}</div>
                <div className="truncate text-[13px] text-muted-foreground">{detail}</div>
            </div>
            {children}
        </div>
    );
}

function Initials({ name }: { name: string }) {
    return (
        <div className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full bg-secondary text-xs font-bold">
            {name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}
        </div>
    );
}

function Empty({ children }: { children: ReactNode }) {
    return <p className="py-5 text-sm text-muted-foreground">{children}</p>;
}
