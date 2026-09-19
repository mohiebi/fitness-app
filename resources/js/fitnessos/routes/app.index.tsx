import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, ClipboardCheck, Dumbbell, Utensils } from 'lucide-react';
import type { ReactNode } from 'react';
import { PageHeader } from '@fitnessos/components/app-shell';
import { Card } from '@fitnessos/components/ui/card';
import { Button } from '@fitnessos/components/ui/button';
import { getJson } from '@fitnessos/lib/api';
import { currentUser } from '@fitnessos/lib/auth';
import { daysSince, greeting, timeAgo, todayLabel } from '@fitnessos/lib/dates';

export const Route = createFileRoute('/app/')({ component: Today });

type Checkin = { id: number; weight_kg: string | null; sleep_hours: string | null; energy: number | null; status: string; created_at: string };
type Message = { id: number; text: string; from: 'coach' | 'client'; time: string };

const CHECKIN_EVERY_DAYS = 7;

function Today() {
    const { data: checkins = [] } = useQuery({ queryKey: ['fitnessos', 'my-checkins'], queryFn: () => getJson<Checkin[]>('/fitnessos/checkins') });
    const { data: messages = [] } = useQuery({ queryKey: ['fitnessos', 'messages'], queryFn: () => getJson<Message[]>('/fitnessos/messages') });
    const latest = checkins[0];
    const previousWeight = checkins.slice(1).find((entry) => entry.weight_kg !== null);
    const coachMessage = messages.filter((message) => message.from === 'coach').at(-1);
    const daysUntilDue = latest ? CHECKIN_EVERY_DAYS - daysSince(latest.created_at) : 0;
    const due = daysUntilDue <= 0;
    const firstName = currentUser()?.split(' ')[0] ?? 'there';

    const weightChange = latest?.weight_kg && previousWeight?.weight_kg
        ? Number(latest.weight_kg) - Number(previousWeight.weight_kg)
        : null;

    return (
        <div>
            <PageHeader eyebrow={todayLabel()} title={`${greeting()}, ${firstName}`} />

            <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
                <Card className="flex flex-col gap-4 p-5">
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-muted-foreground">Weekly check-in</span>
                        {latest && <span className="font-mono text-[11px] uppercase text-subtle-foreground">{latest.status === 'Reviewed' ? 'Last one reviewed' : 'Awaiting review'}</span>}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold leading-tight">
                            {!latest ? 'Send your first check-in' : due ? 'Your check-in is due' : `Next check-in in ${daysUntilDue} ${daysUntilDue === 1 ? 'day' : 'days'}`}
                        </h2>
                        <p className="mt-1.5 text-sm text-muted-foreground">
                            {latest ? `Last sent ${timeAgo(latest.created_at)}. ` : ''}Takes about 3 minutes. Your coach uses it to adjust your plan.
                        </p>
                    </div>
                    <Button asChild size="lg" variant={due ? 'default' : 'outline'} className="w-full sm:w-auto sm:self-start">
                        <Link to="/app/checkin"><ClipboardCheck />Start check-in</Link>
                    </Button>
                </Card>

                <Card className="p-5">
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-muted-foreground">From your coach</span>
                        {coachMessage && <span className="font-mono text-[11px] text-subtle-foreground">{coachMessage.time}</span>}
                    </div>
                    <p className="mt-3 line-clamp-4 text-[15px] leading-relaxed text-foreground">
                        {coachMessage ? coachMessage.text : 'No messages yet. Send your coach a note about your week.'}
                    </p>
                    <Link to="/app/messages" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">
                        {coachMessage ? 'Reply' : 'Open chat'} <ChevronRight className="h-4 w-4" />
                    </Link>
                </Card>

                <Card className="p-5">
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-muted-foreground">Progress</span>
                        <Link to="/app/progress" className="text-sm font-semibold text-muted-foreground hover:text-foreground">View all</Link>
                    </div>
                    {latest ? (
                        <dl className="mt-4 grid grid-cols-3 gap-4">
                            <Stat label="Weight" value={latest.weight_kg ? `${Number(latest.weight_kg).toFixed(1)}` : '—'} unit={latest.weight_kg ? 'kg' : undefined}
                                note={weightChange !== null ? `${weightChange > 0 ? '+' : weightChange < 0 ? '−' : '±'}${Math.abs(weightChange).toFixed(1)} kg` : undefined} />
                            <Stat label="Sleep" value={latest.sleep_hours ? `${Number(latest.sleep_hours)}` : '—'} unit={latest.sleep_hours ? 'h' : undefined} />
                            <Stat label="Energy" value={latest.energy ? `${latest.energy}` : '—'} unit={latest.energy ? '/10' : undefined} />
                        </dl>
                    ) : (
                        <p className="mt-3 text-sm text-muted-foreground">Your weight, sleep and energy show up here after your first check-in.</p>
                    )}
                </Card>

                <Card className="divide-y divide-border px-5">
                    <Shortcut to="/app/workout" icon={<Dumbbell className="h-[18px] w-[18px]" />} title="Workout" detail="Your current training plan" />
                    <Shortcut to="/app/nutrition" icon={<Utensils className="h-[18px] w-[18px]" />} title="Nutrition" detail="Daily targets and meals" />
                </Card>
            </div>
        </div>
    );
}

function Stat({ label, value, unit, note }: { label: string; value: string; unit?: string; note?: string }) {
    return (
        <div>
            <dt className="text-xs font-semibold text-subtle-foreground">{label}</dt>
            <dd className="mt-1">
                <span className="font-display text-3xl font-bold tabular-nums">{value}</span>
                {unit && <span className="ml-1 text-sm text-muted-foreground">{unit}</span>}
                {note && <span className="mt-0.5 block font-mono text-xs text-muted-foreground">{note}</span>}
            </dd>
        </div>
    );
}

function Shortcut({ to, icon, title, detail }: { to: string; icon: ReactNode; title: string; detail: string }) {
    return (
        <Link to={to} className="group flex items-center gap-3 py-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary">{icon}</span>
            <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-bold group-hover:underline">{title}</span>
                <span className="block text-[13px] text-muted-foreground">{detail}</span>
            </span>
            <ChevronRight className="h-[18px] w-[18px] text-subtle-foreground" />
        </Link>
    );
}
