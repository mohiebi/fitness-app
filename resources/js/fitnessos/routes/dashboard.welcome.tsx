import { createFileRoute, Link } from '@tanstack/react-router';
import { Check, Circle, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { PageHeader } from '@fitnessos/components/app-shell';
import { useOnboarding } from '@fitnessos/components/onboarding-card';
import { useTelegram } from '@fitnessos/components/telegram-connect';
import { Button } from '@fitnessos/components/ui/button';
import { Card } from '@fitnessos/components/ui/card';
import { Progress } from '@fitnessos/components/ui/progress';
import { currentUser } from '@fitnessos/lib/auth';
import { formatNumber } from '@fitnessos/lib/format';
import { t } from '@fitnessos/lib/i18n';
import {
    type OnboardingKey,
    type OnboardingStep,
    stepInfo,
} from '@fitnessos/lib/onboarding';
import { cn } from '@fitnessos/lib/utils';

export const Route = createFileRoute('/dashboard/welcome')({
    component: Welcome,
});

function Welcome() {
    const onboarding = useOnboarding();
    const telegram = useTelegram();
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const { data } = onboarding;

    // Finishing the Telegram link happens in another app; pick it up here.
    const linked = telegram.data?.linked ?? false;
    useEffect(() => {
        void onboarding.refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [linked]);

    if (!data) {
        return <p className="text-muted-foreground text-sm">{t('Loading…')}</p>;
    }

    const firstName = (currentUser() ?? '').split(' ')[0] ?? '';

    const publish = async () => {
        setError(null);
        try {
            await onboarding.publish();
        } catch (cause) {
            setError(
                cause instanceof Error
                    ? cause.message
                    : t('The request failed.'),
            );
        }
    };

    const copy = async () => {
        if (!data.public_url) return;
        await navigator.clipboard.writeText(data.public_url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const action = (step: OnboardingStep) => {
        const done = step.done;

        switch (step.key as OnboardingKey) {
            case 'profile':
            case 'photo':
                return (
                    <Button asChild variant={done ? 'outline' : 'default'}>
                        <Link to="/dashboard/profile">
                            {done ? t('Edit') : t('Open profile')}
                        </Link>
                    </Button>
                );
            case 'publish':
                return done ? null : (
                    <Button
                        disabled={step.blocked}
                        onClick={() => void publish()}
                    >
                        {t('Publish now')}
                    </Button>
                );
            case 'telegram':
                return done ? null : (
                    <Button onClick={() => void telegram.connect()}>
                        {t('Connect Telegram')}
                    </Button>
                );
            case 'plan':
                return (
                    <Button asChild variant={done ? 'outline' : 'default'}>
                        <Link to="/dashboard/workouts">
                            {done ? t('Open plans') : t('Build a plan')}
                        </Link>
                    </Button>
                );
            case 'trainee':
                return (
                    <Button asChild variant={done ? 'outline' : 'default'}>
                        <Link to="/dashboard/clients" search={{ add: true }}>
                            {t('Add trainee')}
                        </Link>
                    </Button>
                );
        }
    };

    return (
        <div className="mx-auto max-w-3xl">
            <PageHeader
                title={t('Welcome, :name', { name: firstName })}
                description={t(
                    'A few quick steps and trainees can find you. You can do them in any order and come back any time.',
                )}
            />

            <Card className="mb-6 p-5">
                <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="font-semibold">
                        {data.complete
                            ? t('You are all set. 🎉')
                            : t('Your progress')}
                    </span>
                    <span className="text-muted-foreground tabular-nums">
                        {t(':done of :total steps', {
                            done: formatNumber(data.done),
                            total: formatNumber(data.total),
                        })}
                    </span>
                </div>
                <Progress
                    value={(data.done / data.total) * 100}
                    className="mt-3 h-2"
                />
            </Card>

            <div className="flex flex-col gap-3">
                {data.steps.map((step) => {
                    const info = stepInfo[step.key];
                    const Icon = info.icon;

                    return (
                        <Card
                            key={step.key}
                            className={cn(
                                'flex flex-wrap items-center gap-4 p-5',
                                step.done && 'opacity-80',
                            )}
                        >
                            <div
                                className={cn(
                                    'grid h-9 w-9 shrink-0 place-items-center rounded-full',
                                    step.done
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-muted-foreground',
                                )}
                            >
                                {step.done ? (
                                    <Check className="h-4 w-4" />
                                ) : (
                                    <Circle className="h-4 w-4" />
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 font-semibold">
                                    <Icon className="text-muted-foreground h-4 w-4" />
                                    {t(info.title)}
                                    {step.optional && (
                                        <span className="text-muted-foreground text-xs font-normal">
                                            {t('Optional')}
                                        </span>
                                    )}
                                </div>
                                <p className="text-muted-foreground text-sm">
                                    {step.key === 'publish' && step.blocked
                                        ? t(
                                              'Finish your profile first: add a headline, a bio and a specialty.',
                                          )
                                        : t(info.description)}
                                </p>
                                {step.key === 'telegram' &&
                                    !step.done &&
                                    telegram.waiting && (
                                        <p className="text-muted-foreground mt-1 text-sm">
                                            {t(
                                                'Press Start in Telegram to finish connecting…',
                                            )}
                                        </p>
                                    )}
                                {step.key === 'publish' && data.public_url && (
                                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                                        <code
                                            dir="ltr"
                                            className="bg-muted rounded px-2 py-1 text-xs"
                                        >
                                            {data.public_url}
                                        </code>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => void copy()}
                                        >
                                            <Copy className="me-1 h-3 w-3" />
                                            {copied
                                                ? t('Copied')
                                                : t('Copy link')}
                                        </Button>
                                    </div>
                                )}
                                {step.key === 'publish' && error && (
                                    <p
                                        role="alert"
                                        className="text-destructive mt-1 text-sm"
                                    >
                                        {error}
                                    </p>
                                )}
                            </div>
                            {action(step)}
                        </Card>
                    );
                })}
            </div>

            <div className="mt-6 flex flex-wrap justify-between gap-3">
                <Button
                    variant="ghost"
                    onClick={() => void onboarding.dismiss()}
                    disabled={data.dismissed}
                >
                    {data.dismissed ? t('Checklist hidden') : t('Skip for now')}
                </Button>
                <Button asChild variant={data.complete ? 'default' : 'outline'}>
                    <Link to="/dashboard">{t('Go to my dashboard')}</Link>
                </Button>
            </div>
        </div>
    );
}
