import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Send } from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '@fitnessos/components/app-shell';
import { Badge } from '@fitnessos/components/ui/badge';
import { Button } from '@fitnessos/components/ui/button';
import { Card } from '@fitnessos/components/ui/card';
import { getJson, postJson } from '@fitnessos/lib/api';
import {
    type Billing,
    type BillingPayment,
    daysLeft,
    paymentStatusLabels,
} from '@fitnessos/lib/billing';
import { formatDate, formatNumber, formatToman } from '@fitnessos/lib/format';
import { sep, t } from '@fitnessos/lib/i18n';
import { cn } from '@fitnessos/lib/utils';

export const Route = createFileRoute('/dashboard/billing')({
    component: BillingPage,
});

function BillingPage() {
    const queryClient = useQueryClient();
    const { data, isLoading } = useQuery({
        queryKey: ['fitnessos', 'billing'],
        queryFn: () => getJson<Billing>('/fitnessos/billing'),
    });
    const [busy, setBusy] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    if (isLoading || !data) {
        return <p className="text-muted-foreground text-sm">{t('Loading…')}</p>;
    }

    const { subscription } = data;
    const left = daysLeft(subscription.ends_at);
    const currentPlan = data.plans.find(
        (plan) => plan.key === subscription.plan,
    );

    const pay = async (plan: string) => {
        // Open the tab now so the browser doesn't block it as a pop-up.
        const tab = window.open('', '_blank');
        setBusy(plan);
        setError(null);
        try {
            const payment = (await postJson('/fitnessos/billing/payments', {
                plan,
            })) as BillingPayment & { telegram_url: string | null };
            if (payment.telegram_url && tab) {
                tab.location.href = payment.telegram_url;
            } else {
                tab?.close();
            }
            await queryClient.invalidateQueries({
                queryKey: ['fitnessos', 'billing'],
            });
        } catch (cause) {
            tab?.close();
            setError(
                cause instanceof Error
                    ? cause.message
                    : t('The request failed.'),
            );
        } finally {
            setBusy(null);
        }
    };

    const cancel = async (id: number) => {
        await postJson(`/fitnessos/billing/payments/${id}/cancel`);
        await queryClient.invalidateQueries({
            queryKey: ['fitnessos', 'billing'],
        });
    };

    return (
        <div className="flex flex-col gap-5">
            <PageHeader
                title={t('Subscription')}
                description={t(
                    'Your FitnessOS plan. Pay for 30 days at a time; there is no automatic renewal.',
                )}
            />

            <Card
                className={cn(
                    'flex flex-wrap items-center gap-6 p-6',
                    !subscription.active && 'border-destructive/50',
                )}
            >
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-display text-2xl font-extrabold">
                            {t(currentPlan?.name ?? subscription.plan)}
                        </h2>
                        <Badge
                            variant="secondary"
                            className={cn(
                                subscription.active
                                    ? 'bg-primary/15 text-primary'
                                    : 'bg-destructive/15 text-destructive',
                            )}
                        >
                            {!subscription.active
                                ? t('Ended')
                                : subscription.on_trial
                                  ? t('Free trial')
                                  : t('Active')}
                        </Badge>
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm">
                        {subscription.ends_at &&
                            (subscription.active
                                ? t(':days days left, until :date', {
                                      days: formatNumber(left),
                                      date: formatDate(subscription.ends_at),
                                  })
                                : t(
                                      "Ended on :date. You are hidden from the coach directory and can't take new trainees until you renew.",
                                      {
                                          date: formatDate(
                                              subscription.ends_at,
                                          ),
                                      },
                                  ))}
                    </p>
                </div>
                <div className="text-sm">
                    <div className="text-subtle-foreground text-xs">
                        {t('Active trainees')}
                    </div>
                    <div className="font-display text-2xl font-extrabold">
                        {formatNumber(data.active_trainees)}
                        {subscription.max_trainees !== null && (
                            <span className="text-muted-foreground text-base">
                                {' '}
                                / {formatNumber(subscription.max_trainees)}
                            </span>
                        )}
                    </div>
                </div>
            </Card>

            {data.open_payment && (
                <Card className="border-aqua/40 flex flex-col gap-3 p-5">
                    <h2 className="font-semibold">
                        {t('Payment in progress')}
                    </h2>
                    <ol className="text-muted-foreground list-decimal space-y-1 ps-5 text-sm">
                        <li>
                            {t(
                                'Open our Telegram bot. It shows the amount and the card to transfer to.',
                            )}
                        </li>
                        <li>
                            {t(
                                'Send a photo of the transfer receipt to the bot.',
                            )}
                        </li>
                        <li>
                            {t(
                                'We confirm it, usually within a few hours, and your subscription is extended.',
                            )}
                        </li>
                    </ol>
                    <div className="text-sm">
                        {t(':plan plan', {
                            plan: t(
                                data.plans.find(
                                    (plan) =>
                                        plan.key === data.open_payment?.plan,
                                )?.name ?? data.open_payment.plan,
                            ),
                        })}
                        {sep()}
                        {formatToman(data.open_payment.amount)}
                        {sep()}
                        {t('Reference: :reference', {
                            reference: data.open_payment.reference,
                        })}
                        {sep()}
                        {t(paymentStatusLabels[data.open_payment.status])}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {data.open_payment.telegram_url && (
                            <Button asChild>
                                <a
                                    href={data.open_payment.telegram_url}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <Send className="rtl:-scale-x-100" />
                                    {t('Open Telegram')}
                                </a>
                            </Button>
                        )}
                        {data.open_payment.status === 'pending' && (
                            <Button
                                variant="ghost"
                                onClick={() =>
                                    void cancel(data.open_payment!.id)
                                }
                            >
                                {t('Cancel payment')}
                            </Button>
                        )}
                    </div>
                </Card>
            )}

            <div className="grid gap-4 md:grid-cols-2">
                {data.plans.map((plan) => (
                    <Card
                        key={plan.key}
                        className={cn(
                            'flex flex-col gap-4 p-6',
                            plan.key === subscription.plan &&
                                'border-primary/50',
                        )}
                    >
                        <div>
                            <h3 className="text-lg font-bold">
                                {t(plan.name)}
                            </h3>
                            <div className="font-display mt-1 text-3xl font-extrabold">
                                {formatToman(plan.price)}
                            </div>
                            <div className="text-muted-foreground text-sm">
                                {t('per :days days', {
                                    days: formatNumber(data.period_days),
                                })}
                            </div>
                        </div>
                        <ul className="space-y-1.5 text-sm">
                            <li className="flex items-center gap-2">
                                <Check className="text-volt h-4 w-4" />
                                {plan.max_trainees === null
                                    ? t('Unlimited trainees')
                                    : t('Up to :count active trainees', {
                                          count: formatNumber(
                                              plan.max_trainees,
                                          ),
                                      })}
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="text-volt h-4 w-4" />
                                {t('Public profile in the coach directory')}
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="text-volt h-4 w-4" />
                                {t(
                                    'Plans, check-ins, chat and the AI assistant',
                                )}
                            </li>
                        </ul>
                        <Button
                            className="mt-auto"
                            variant={
                                plan.key === subscription.plan
                                    ? 'default'
                                    : 'outline'
                            }
                            disabled={!data.telegram_enabled || busy !== null}
                            onClick={() => void pay(plan.key)}
                        >
                            <Send className="rtl:-scale-x-100" />
                            {busy === plan.key
                                ? t('Opening…')
                                : plan.key === subscription.plan &&
                                    !subscription.on_trial
                                  ? t('Renew with Telegram')
                                  : t('Pay with Telegram')}
                        </Button>
                    </Card>
                ))}
            </div>
            {!data.telegram_enabled && (
                <p className="text-muted-foreground text-sm">
                    {t(
                        'Online payment is not available yet. Please contact support to renew.',
                    )}
                </p>
            )}
            {error && (
                <p role="alert" className="text-destructive text-sm">
                    {error}
                </p>
            )}

            <Card className="p-5">
                <h2 className="mb-3 font-semibold">{t('Payment history')}</h2>
                {data.payments.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                        {t('No payments yet.')}
                    </p>
                ) : (
                    <ul className="divide-border divide-y text-sm">
                        {data.payments.map((payment) => (
                            <li
                                key={payment.id}
                                className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3"
                            >
                                <span className="min-w-0 flex-1">
                                    {formatDate(
                                        payment.paid_at ??
                                            payment.created_at ??
                                            new Date(),
                                    )}
                                </span>
                                <span>
                                    {t(
                                        data.plans.find(
                                            (plan) => plan.key === payment.plan,
                                        )?.name ?? payment.plan,
                                    )}
                                </span>
                                <span>{formatToman(payment.amount)}</span>
                                <Badge
                                    variant="secondary"
                                    className={cn(
                                        payment.status === 'paid' &&
                                            'bg-primary/15 text-primary',
                                    )}
                                >
                                    {t(paymentStatusLabels[payment.status])}
                                </Badge>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>
        </div>
    );
}
