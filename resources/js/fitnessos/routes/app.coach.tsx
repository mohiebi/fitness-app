import { createFileRoute, Link } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Repeat, UserMinus } from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '@fitnessos/components/app-shell';
import {
    CoachAvatar,
    CoachMeta,
    VerifiedBadge,
} from '@fitnessos/components/coach-card';
import { EndCoachingDialog } from '@fitnessos/components/end-coaching-dialog';
import { NoCoachCard, useMyCoaching } from '@fitnessos/components/no-coach';
import { Button } from '@fitnessos/components/ui/button';
import { Card } from '@fitnessos/components/ui/card';
import { postJson } from '@fitnessos/lib/api';
import { t } from '@fitnessos/lib/i18n';
import { formatDate } from '@fitnessos/lib/format';
import type {
    CoachingStatus,
    TraineeCoaching,
} from '@fitnessos/lib/marketplace';

export const Route = createFileRoute('/app/coach')({ component: MyCoach });

const statusLabels: Record<CoachingStatus, string> = {
    requested: 'Pending',
    active: 'Active',
    declined: 'Declined',
    withdrawn: 'Withdrawn',
    ended: 'Ended',
};

function MyCoach() {
    const queryClient = useQueryClient();
    const { data, isLoading } = useMyCoaching();
    const [ending, setEnding] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refresh = () =>
        queryClient.invalidateQueries({ queryKey: ['fitnessos'] });

    const withdraw = async (coaching: TraineeCoaching) => {
        setError(null);
        try {
            await postJson(`/fitnessos/coachings/${coaching.id}/withdraw`);
            await refresh();
        } catch (cause) {
            setError(
                cause instanceof Error
                    ? cause.message
                    : t('The request failed.'),
            );
        }
    };

    if (isLoading || !data)
        return <p className="text-muted-foreground text-sm">{t('Loading…')}</p>;

    const { active, pending, history } = data;

    return (
        <div className="flex flex-col gap-5">
            <PageHeader
                title={t('My coach')}
                description={t(
                    'Your coaching relationship. You can switch or stop any time; your history stays with you.',
                )}
            />
            {error && (
                <p role="alert" className="text-destructive text-sm">
                    {error}
                </p>
            )}

            {active ? (
                <Card className="flex flex-col gap-5 p-6">
                    <div className="flex flex-wrap items-center gap-4">
                        <CoachAvatar
                            coach={active.coach}
                            className="h-20 w-20"
                        />
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-2xl font-bold">
                                    {active.coach.name}
                                </h2>
                                {active.coach.verified && <VerifiedBadge />}
                            </div>
                            {active.coach.headline && (
                                <p className="text-muted-foreground">
                                    {active.coach.headline}
                                </p>
                            )}
                            {active.started_at && (
                                <p className="text-subtle-foreground mt-1 text-xs">
                                    {t('Coaching since :date', {
                                        date: formatDate(active.started_at),
                                    })}
                                </p>
                            )}
                        </div>
                    </div>
                    <CoachMeta coach={active.coach} />
                    <div className="flex flex-wrap gap-2">
                        <Button asChild>
                            <Link to="/app/messages">
                                <MessageSquare />
                                {t('Message coach')}
                            </Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link to="/coaches">
                                <Repeat />
                                {t('Switch coach')}
                            </Link>
                        </Button>
                        <Button
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => setEnding(true)}
                        >
                            <UserMinus />
                            {t('Stop coaching')}
                        </Button>
                    </div>
                    <p className="text-muted-foreground text-xs">
                        {t(
                            'To switch, request a new coach. Your current coaching ends automatically when they accept.',
                        )}
                    </p>
                </Card>
            ) : (
                !pending && <NoCoachCard />
            )}

            {pending && (
                <Card className="flex flex-wrap items-center gap-4 p-5">
                    <CoachAvatar coach={pending.coach} className="h-12 w-12" />
                    <div className="min-w-0 flex-1">
                        <div className="text-volt text-xs font-bold">
                            {t('Request pending')}
                        </div>
                        <div className="font-semibold">
                            {pending.coach.name}
                        </div>
                        {pending.requested_at && (
                            <div className="text-muted-foreground text-xs">
                                {t('Sent :date', {
                                    date: formatDate(pending.requested_at),
                                })}
                            </div>
                        )}
                    </div>
                    <Button asChild variant="outline">
                        <Link
                            to="/coaches/$slug"
                            params={{ slug: pending.coach.slug }}
                        >
                            {t('View profile')}
                        </Link>
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => void withdraw(pending)}
                    >
                        {t('Withdraw request')}
                    </Button>
                </Card>
            )}

            {history.length > 0 && (
                <Card className="px-5">
                    <h2 className="pt-5 font-semibold">{t('History')}</h2>
                    <div className="divide-border divide-y">
                        {history.map((coaching) => (
                            <div
                                key={coaching.id}
                                className="flex flex-wrap items-center gap-3 py-3.5 text-sm"
                            >
                                <span className="min-w-0 flex-1 font-medium">
                                    {coaching.coach.name}
                                </span>
                                <span className="text-muted-foreground">
                                    {t(statusLabels[coaching.status])}
                                </span>
                                {coaching.ended_at && (
                                    <span className="text-subtle-foreground text-xs">
                                        {formatDate(coaching.ended_at)}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {active && (
                <EndCoachingDialog
                    open={ending}
                    onOpenChange={setEnding}
                    coachingId={active.id}
                    title={t('Stop coaching with :name?', {
                        name: active.coach.name,
                    })}
                    description={t(
                        'Chat and check-ins with this coach close. Your check-in history stays in your account, and you can request a new coach any time.',
                    )}
                    onEnded={refresh}
                />
            )}
        </div>
    );
}
