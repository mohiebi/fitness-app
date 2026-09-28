import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, X } from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '@fitnessos/components/app-shell';
import { Card } from '@fitnessos/components/ui/card';
import { Button } from '@fitnessos/components/ui/button';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@fitnessos/components/ui/tabs';
import { getJson, postJson } from '@fitnessos/lib/api';
import { t } from '@fitnessos/lib/i18n';
import {
    formatDate,
    formatNumber,
    formatRelative,
} from '@fitnessos/lib/format';
import { initials, type CoachRequest } from '@fitnessos/lib/marketplace';
import { IntakeSummary } from '@fitnessos/components/intake-summary';

export const Route = createFileRoute('/dashboard/requests')({
    component: Requests,
});

function useCoachings(status: 'requested' | 'ended') {
    return useQuery({
        queryKey: ['fitnessos', 'coachings', status],
        queryFn: () =>
            getJson<CoachRequest[]>(`/fitnessos/coachings?status=${status}`),
    });
}

function Requests() {
    const queryClient = useQueryClient();
    const pending = useCoachings('requested');
    const ended = useCoachings('ended');
    const [busy, setBusy] = useState<number | null>(null);
    const [notice, setNotice] = useState<{
        text: string;
        error: boolean;
    } | null>(null);

    const act = async (request: CoachRequest, action: 'accept' | 'decline') => {
        setBusy(request.id);
        setNotice(null);
        try {
            const result = (await postJson(
                `/fitnessos/coachings/${request.id}/${action}`,
            )) as { message: string };
            setNotice({ text: result.message, error: false });
            await Promise.all([
                queryClient.invalidateQueries({
                    queryKey: ['fitnessos', 'coachings'],
                }),
                queryClient.invalidateQueries({
                    queryKey: ['fitnessos', 'clients'],
                }),
            ]);
        } catch (cause) {
            setNotice({
                text:
                    cause instanceof Error
                        ? cause.message
                        : t('The request failed.'),
                error: true,
            });
        } finally {
            setBusy(null);
        }
    };

    const requests = pending.data ?? [];

    return (
        <div>
            <PageHeader
                title={t('Requests')}
                description={t(
                    'Trainees who asked to work with you. Accepting starts the coaching and opens chat and check-ins.',
                )}
                actions={
                    <Button asChild variant="outline">
                        <Link to="/dashboard/profile">
                            {t('Edit public profile')}
                        </Link>
                    </Button>
                }
            />

            {notice && (
                <p
                    role={notice.error ? 'alert' : 'status'}
                    className={
                        notice.error
                            ? 'text-destructive mb-4 text-sm'
                            : 'text-volt mb-4 text-sm'
                    }
                >
                    {notice.text}
                </p>
            )}

            <Tabs defaultValue="pending">
                <TabsList className="mb-6">
                    <TabsTrigger value="pending">
                        {t('Pending (:count)', {
                            count: formatNumber(requests.length),
                        })}
                    </TabsTrigger>
                    <TabsTrigger value="past">{t('Past trainees')}</TabsTrigger>
                </TabsList>

                <TabsContent
                    value="pending"
                    className="grid gap-4 lg:grid-cols-2"
                >
                    {pending.isLoading && (
                        <p className="text-muted-foreground text-sm">
                            {t('Loading…')}
                        </p>
                    )}
                    {requests.map((request) => (
                        <Card
                            key={request.id}
                            className="flex flex-col gap-4 p-5"
                        >
                            <div className="flex items-start gap-3">
                                <div className="bg-secondary grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-bold">
                                    {initials(request.trainee.name)}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="font-semibold">
                                        {request.trainee.name}
                                    </div>
                                    <div className="text-muted-foreground text-xs">
                                        {request.requested_at &&
                                            t('Requested :when', {
                                                when: formatRelative(
                                                    request.requested_at,
                                                ),
                                            })}
                                    </div>
                                </div>
                            </div>
                            {request.request_message && (
                                <blockquote className="bg-secondary rounded-lg p-3 text-sm whitespace-pre-line">
                                    {request.request_message}
                                </blockquote>
                            )}
                            <IntakeSummary profile={request.trainee.profile} />
                            <div className="mt-auto flex gap-2">
                                <Button
                                    className="flex-1"
                                    disabled={busy === request.id}
                                    onClick={() => void act(request, 'accept')}
                                >
                                    <Check />
                                    {t('Accept')}
                                </Button>
                                <Button
                                    variant="outline"
                                    disabled={busy === request.id}
                                    onClick={() => void act(request, 'decline')}
                                >
                                    <X />
                                    {t('Decline')}
                                </Button>
                            </div>
                        </Card>
                    ))}
                    {!pending.isLoading && requests.length === 0 && (
                        <Card className="text-muted-foreground p-8 text-center text-sm lg:col-span-2">
                            {t(
                                'No pending requests. Share your public profile link so trainees can find you.',
                            )}
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="past">
                    <Card className="divide-border divide-y px-5">
                        {(ended.data ?? []).map((coaching) => (
                            <div
                                key={coaching.id}
                                className="flex flex-wrap items-center gap-3 py-4"
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="font-semibold">
                                        {coaching.trainee.name}
                                    </div>
                                    <div className="text-muted-foreground text-xs">
                                        {coaching.started_at &&
                                            formatDate(
                                                coaching.started_at,
                                            )}{' '}
                                        –{' '}
                                        {coaching.ended_at &&
                                            formatDate(coaching.ended_at)}
                                    </div>
                                </div>
                                <span className="text-muted-foreground text-sm">
                                    {coaching.end_reason === 'switched'
                                        ? t('Switched to another coach')
                                        : coaching.end_reason
                                          ? t(coaching.end_reason)
                                          : t('No reason given')}
                                </span>
                            </div>
                        ))}
                        {!ended.isLoading &&
                            (ended.data ?? []).length === 0 && (
                                <p className="text-muted-foreground py-6 text-sm">
                                    {t('No past trainees yet.')}
                                </p>
                            )}
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
