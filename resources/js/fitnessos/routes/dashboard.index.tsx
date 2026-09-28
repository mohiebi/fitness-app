import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Contact, Plus } from 'lucide-react';
import type { ReactNode } from 'react';
import { PageHeader } from '@fitnessos/components/app-shell';
import { ActionTile } from '@fitnessos/components/stat-card';
import { Card } from '@fitnessos/components/ui/card';
import { Button } from '@fitnessos/components/ui/button';
import { getJson } from '@fitnessos/lib/api';
import { currentUser } from '@fitnessos/lib/auth';
import { daysSince, parseServerDate } from '@fitnessos/lib/dates';
import { formatDate, formatNumber, formatRelative } from '@fitnessos/lib/format';
import { t } from '@fitnessos/lib/i18n';
import { labelFrom, goals, type CoachOwnProfile, type CoachRequest } from '@fitnessos/lib/marketplace';
import { cn } from '@fitnessos/lib/utils';

export const Route = createFileRoute('/dashboard/')({ component: DashboardIndex });

type Client = { id: string; name: string; email: string };
type Checkin = {
    id: number; client_id: number; client_name: string; weight_kg: string | null;
    sleep_hours: string | null; energy: number | null; adjustments: string | null;
    status: string; created_at: string;
};
type Conversation = { id: string; name: string; last: string; time: string };

const QUIET_AFTER_DAYS = 7;

function checkinFlag(entry: Checkin): { label: string; alert: boolean } | null {
    if (entry.sleep_hours !== null && Number(entry.sleep_hours) < 6) return { label: t('Low sleep'), alert: true };
    if (entry.energy !== null && entry.energy <= 4) return { label: t('Low energy'), alert: true };
    if (entry.adjustments) return { label: t('Wants changes'), alert: false };
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
    return `${sign}${formatNumber(Number(Math.abs(kg).toFixed(1)))}`;
}

function greeting(): string {
    const hour = new Date().getHours();
    return hour < 12 ? t('Good morning') : hour < 18 ? t('Good afternoon') : t('Good evening');
}

function DashboardIndex() {
    const { data: clients = [] } = useQuery({ queryKey: ['fitnessos', 'clients'], queryFn: () => getJson<Client[]>('/fitnessos/clients') });
    const { data: requests = [] } = useQuery({ queryKey: ['fitnessos', 'coachings', 'requested'], queryFn: () => getJson<CoachRequest[]>('/fitnessos/coachings?status=requested') });
    const { data: profile } = useQuery({ queryKey: ['fitnessos', 'coach-profile'], queryFn: () => getJson<CoachOwnProfile>('/fitnessos/coach-profile') });
    const { data: checkins = [] } = useQuery({ queryKey: ['fitnessos', 'checkins'], queryFn: () => getJson<Checkin[]>('/fitnessos/checkins') });
    const { data: conversations = [] } = useQuery({ queryKey: ['fitnessos', 'conversations'], queryFn: () => getJson<Conversation[]>('/fitnessos/conversations') });

    const pending = checkins.filter((entry) => entry.status === 'Pending').reverse();
    const oldestRequests = [...requests].reverse();

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

    const waiting = pending.length + requests.length;
    const summary = waiting
        ? t(':checkins check-ins and :requests coaching requests are waiting for you.', { checkins: formatNumber(pending.length), requests: formatNumber(requests.length) })
        : t('Nothing is waiting on you right now.');
    const firstName = currentUser()?.split(' ')[0] ?? t('Coach');

    return (
        <div>
            <PageHeader
                eyebrow={formatDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long' })}
                title={t(':greeting, :name', { greeting: greeting(), name: firstName })}
                description={summary}
                actions={<>
                    <Button asChild variant="outline"><Link to="/dashboard/workouts">{t('Build a plan')}</Link></Button>
                    <Button asChild><Link to="/dashboard/clients" search={{ add: true }}><Plus strokeWidth={2.6} />{t('Add trainee')}</Link></Button>
                </>}
            />

            {profile && !profile.is_published && (
                <Card className="mb-6 flex flex-wrap items-center gap-4 border-primary/40 bg-hero-gradient p-5">
                    <Contact className="h-6 w-6 text-volt" />
                    <div className="min-w-0 flex-1">
                        <div className="font-semibold">{t('Your public profile is not live yet')}</div>
                        <p className="text-sm text-muted-foreground">{t('Add a headline and bio, then publish it so trainees can find you in the coach directory.')}</p>
                    </div>
                    <Button asChild><Link to="/dashboard/profile">{t('Set up profile')}</Link></Button>
                </Card>
            )}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <ActionTile label={t('Check-ins to review')} value={pending.length} meta={pending[0] && t('oldest :age', { age: formatRelative(pending[0].created_at) })} action={t('Review queue')} to="/dashboard/checkins" />
                <ActionTile label={t('Coaching requests')} value={requests.length} meta={oldestRequests[0]?.requested_at ? t('oldest :age', { age: formatRelative(oldestRequests[0].requested_at) }) : undefined} action={t('Review requests')} to="/dashboard/requests" />
                <ActionTile label={t('Going quiet')} value={quiet.length} meta={t(':days+ days', { days: formatNumber(QUIET_AFTER_DAYS) })} action={t('Send a nudge')} to="/dashboard/messages" tone="alert" />
                <ActionTile label={t('Trainees')} value={clients.length} action={t('Manage trainees')} to="/dashboard/clients" />
            </div>

            <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] xl:items-start">
                <div className="flex min-w-0 flex-col gap-5">
                    <Card className="px-6 pb-2 pt-5">
                        <SectionTitle title={t('Check-in queue')} meta={pending.length ? t('oldest first') : undefined} link={<Link to="/dashboard/checkins">{t('All check-ins')}</Link>} />
                        {pending.length === 0 ? (
                            <Empty>{t('No check-ins waiting. New ones show up here as trainees send them.')}</Empty>
                        ) : (
                            <div className="mt-2 overflow-x-auto">
                                <table className="w-full min-w-[640px] text-sm">
                                    <thead>
                                        <tr className="border-b border-border text-start text-xs text-subtle-foreground">
                                            <th className="py-2.5 text-start font-semibold">{t('Trainee')}</th>
                                            <th className="py-2.5 text-start font-semibold">{t('Sent')}</th>
                                            <th className="py-2.5 text-start font-semibold">{t('Weight')}</th>
                                            <th className="py-2.5 text-start font-semibold">{t('Sleep')}</th>
                                            <th className="py-2.5 text-start font-semibold">{t('Energy')}</th>
                                            <th className="py-2.5 text-start font-semibold">{t('Flag')}</th>
                                            <th className="py-2.5"><span className="sr-only">{t('Action')}</span></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pending.slice(0, 6).map((entry) => {
                                            const change = weightChange(entry, checkins);
                                            const flag = checkinFlag(entry);
                                            return (
                                                <tr key={entry.id} className="border-b border-border last:border-0">
                                                    <td className="py-3 pe-3">
                                                        <div className="flex items-center gap-3"><Initials name={entry.client_name} /><span className="font-semibold">{entry.client_name}</span></div>
                                                    </td>
                                                    <td className="py-3 pe-3 text-[13px] text-muted-foreground">{formatRelative(entry.created_at)}</td>
                                                    <td className="py-3 pe-3 text-[13px]">
                                                        {entry.weight_kg ? t(':value kg', { value: formatNumber(Number(Number(entry.weight_kg).toFixed(1))) }) : '—'}
                                                        {change !== null && <span dir="ltr" className="ms-2 inline-block text-muted-foreground">{formatChange(change)}</span>}
                                                    </td>
                                                    <td className="py-3 pe-3 text-[13px]">{entry.sleep_hours ? t(':value h', { value: formatNumber(Number(entry.sleep_hours)) }) : '—'}</td>
                                                    <td className="py-3 pe-3 text-[13px]">{entry.energy ? `${formatNumber(entry.energy)}/${formatNumber(10)}` : '—'}</td>
                                                    <td className="py-3 pe-3">
                                                        {flag
                                                            ? <span className={cn('inline-flex h-6 items-center whitespace-nowrap rounded-full px-2.5 text-xs font-semibold', flag.alert ? 'bg-destructive/15 text-destructive' : 'bg-secondary text-muted-foreground')}>{flag.label}</span>
                                                            : <span className="text-subtle-foreground">—</span>}
                                                    </td>
                                                    <td className="py-3 text-end">
                                                        <Button asChild variant="outline" size="sm"><Link to="/dashboard/checkins" search={{ checkin: entry.id }}>{t('Review')}</Link></Button>
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
                        <SectionTitle title={t('Going quiet')} meta={t('No check-in for :days+ days', { days: formatNumber(QUIET_AFTER_DAYS) })} />
                        <div className="mt-2 divide-y divide-border border-t border-border">
                            {quiet.map(({ client, days }) => (
                                <PersonRow key={client.id} name={client.name} detail={client.email}>
                                    <span className="text-[13px] text-destructive">{t(':days days', { days: formatNumber(days) })}</span>
                                    <Button asChild variant="outline" size="sm"><Link to="/dashboard/messages" search={{ client: client.id }}>{t('Send nudge')}</Link></Button>
                                </PersonRow>
                            ))}
                            {awaitingFirst.slice(0, 4).map((client) => (
                                <PersonRow key={client.id} name={client.name} detail={t('Waiting for their first check-in')}>
                                    <Button asChild variant="outline" size="sm"><Link to="/dashboard/messages" search={{ client: client.id }}>{t('Message')}</Link></Button>
                                </PersonRow>
                            ))}
                            {quiet.length === 0 && awaitingFirst.length === 0 && (
                                <Empty>{clients.length ? t('Everyone has checked in within the last week.') : t('Accept a request or add a trainee to start tracking check-ins.')}</Empty>
                            )}
                        </div>
                    </Card>
                </div>

                <div className="flex min-w-0 flex-col gap-5">
                    <Card className="px-[22px] pb-2 pt-5">
                        <SectionTitle title={t('Coaching requests')} link={<Link to="/dashboard/requests">{t('All requests')}</Link>} />
                        <div className="mt-2 divide-y divide-border border-t border-border">
                            {oldestRequests.slice(0, 3).map((request) => (
                                <PersonRow key={request.id} name={request.trainee.name} detail={labelFrom(goals, request.trainee.profile?.goal ?? null)}>
                                    <Button asChild variant="outline" size="sm"><Link to="/dashboard/requests">{t('Review')}</Link></Button>
                                </PersonRow>
                            ))}
                            {requests.length === 0 && <Empty>{t('No new requests. Trainees who find your public profile land here.')}</Empty>}
                        </div>
                    </Card>

                    <Card className="px-[22px] pb-2 pt-5">
                        <SectionTitle title={t('Conversations')} link={<Link to="/dashboard/messages">{t('Inbox')}</Link>} />
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
                            {recentConversations.length === 0 && <Empty>{t('No messages yet.')}</Empty>}
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
