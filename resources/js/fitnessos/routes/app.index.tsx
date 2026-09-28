import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, ClipboardCheck, Dumbbell, Utensils } from 'lucide-react';
import type { ReactNode } from 'react';
import { PageHeader } from '@fitnessos/components/app-shell';
import { NoCoachCard, useMyCoaching } from '@fitnessos/components/no-coach';
import { Card } from '@fitnessos/components/ui/card';
import { Button } from '@fitnessos/components/ui/button';
import { getJson } from '@fitnessos/lib/api';
import { currentUser } from '@fitnessos/lib/auth';
import { daysSince } from '@fitnessos/lib/dates';
import { formatDate, formatNumber, formatRelative } from '@fitnessos/lib/format';
import { t } from '@fitnessos/lib/i18n';

export const Route = createFileRoute('/app/')({ component: Today });

type Checkin = { id: number; weight_kg: string | null; sleep_hours: string | null; energy: number | null; status: string; created_at: string };
type Message = { id: number; text: string; from: 'coach' | 'client'; time: string };

const CHECKIN_EVERY_DAYS = 7;

function greeting(): string {
    const hour = new Date().getHours();
    return hour < 12 ? t('Good morning') : hour < 18 ? t('Good afternoon') : t('Good evening');
}

function Today() {
    const { data: coaching, isLoading: loadingCoach } = useMyCoaching();
    const hasCoach = Boolean(coaching?.active);
    const { data: checkins = [] } = useQuery({ queryKey: ['fitnessos', 'my-checkins'], queryFn: () => getJson<Checkin[]>('/fitnessos/checkins') });
    const { data: messages = [] } = useQuery({ queryKey: ['fitnessos', 'messages'], queryFn: () => getJson<Message[]>('/fitnessos/messages'), enabled: hasCoach });
    const latest = checkins[0];
    const previousWeight = checkins.slice(1).find((entry) => entry.weight_kg !== null);
    const coachMessage = messages.filter((message) => message.from === 'coach').at(-1);
    const daysUntilDue = latest ? CHECKIN_EVERY_DAYS - daysSince(latest.created_at) : 0;
    const due = daysUntilDue <= 0;
    const firstName = currentUser()?.split(' ')[0] ?? '';

    const weightChange = latest?.weight_kg && previousWeight?.weight_kg
        ? Number(latest.weight_kg) - Number(previousWeight.weight_kg)
        : null;

    return (
        <div>
            <PageHeader eyebrow={formatDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long' })} title={t(':greeting, :name', { greeting: greeting(), name: firstName })} />

            {!loadingCoach && !hasCoach && (
                <div className="mb-4"><NoCoachCard pendingCoachName={coaching?.pending?.coach.name} /></div>
            )}

            <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
                {hasCoach && (
                    <Card className="flex flex-col gap-4 border-primary/30 bg-hero-gradient p-5 shadow-glow">
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-semibold text-muted-foreground">{t('Weekly check-in')}</span>
                            {latest && <span className="text-[11px] text-subtle-foreground">{latest.status === 'Reviewed' ? t('Last one reviewed') : t('Awaiting review')}</span>}
                        </div>
                        <div>
                            <h2 className="font-display text-2xl font-extrabold uppercase leading-tight">
                                {!latest ? t('Send your first check-in') : due ? t('Your check-in is due') : t('Next check-in in :days days', { days: formatNumber(daysUntilDue) })}
                            </h2>
                            <p className="mt-1.5 text-sm text-muted-foreground">
                                {latest ? `${t('Last sent :when.', { when: formatRelative(latest.created_at) })} ` : ''}{t('Takes about 3 minutes. Your coach uses it to adjust your plan.')}
                            </p>
                        </div>
                        <Button asChild size="lg" variant={due ? 'default' : 'outline'} className="w-full sm:w-auto sm:self-start">
                            <Link to="/app/checkin"><ClipboardCheck />{t('Start check-in')}</Link>
                        </Button>
                    </Card>
                )}

                {hasCoach && (
                    <Card className="p-5">
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-semibold text-muted-foreground">{t('From :name', { name: coaching?.active?.coach.name ?? t('your coach') })}</span>
                            {coachMessage && <span className="text-[11px] text-subtle-foreground">{coachMessage.time}</span>}
                        </div>
                        <p className="mt-3 line-clamp-4 text-[15px] leading-relaxed text-foreground">
                            {coachMessage ? coachMessage.text : t('No messages yet. Send your coach a note about your week.')}
                        </p>
                        <Link to="/app/messages" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">
                            {coachMessage ? t('Reply') : t('Open chat')} <ChevronRight className="h-4 w-4 rtl:rotate-180" />
                        </Link>
                    </Card>
                )}

                <Card className="p-5">
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-muted-foreground">{t('Progress')}</span>
                        <Link to="/app/progress" className="text-sm font-semibold text-muted-foreground hover:text-foreground">{t('View all')}</Link>
                    </div>
                    {latest ? (
                        <dl className="mt-4 grid grid-cols-3 gap-4">
                            <Stat label={t('Weight')} value={latest.weight_kg ? formatNumber(Number(Number(latest.weight_kg).toFixed(1))) : '—'} unit={latest.weight_kg ? t('kg') : undefined}
                                note={weightChange !== null ? `${weightChange > 0 ? '+' : weightChange < 0 ? '−' : '±'}${formatNumber(Number(Math.abs(weightChange).toFixed(1)))} ${t('kg')}` : undefined} />
                            <Stat label={t('Sleep')} value={latest.sleep_hours ? formatNumber(Number(latest.sleep_hours)) : '—'} unit={latest.sleep_hours ? t('h') : undefined} />
                            <Stat label={t('Energy')} value={latest.energy ? formatNumber(latest.energy) : '—'} unit={latest.energy ? `/${formatNumber(10)}` : undefined} />
                        </dl>
                    ) : (
                        <p className="mt-3 text-sm text-muted-foreground">{t('Your weight, sleep and energy show up here after your first check-in.')}</p>
                    )}
                </Card>

                <Card className="divide-y divide-border px-5">
                    <Shortcut to="/app/workout" icon={<Dumbbell className="h-[18px] w-[18px]" />} title={t('Workout')} detail={t('Your current training plan')} />
                    <Shortcut to="/app/nutrition" icon={<Utensils className="h-[18px] w-[18px]" />} title={t('Nutrition')} detail={t('Daily targets and meals')} />
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
                {unit && <span className="ms-1 text-sm text-muted-foreground">{unit}</span>}
                {note && <span dir="ltr" className="mt-0.5 block text-xs text-muted-foreground">{note}</span>}
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
            <ChevronRight className="h-[18px] w-[18px] text-subtle-foreground rtl:rotate-180" />
        </Link>
    );
}
