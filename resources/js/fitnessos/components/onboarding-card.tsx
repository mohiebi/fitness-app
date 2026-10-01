import { Link } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import { Button } from '@fitnessos/components/ui/button';
import { Card } from '@fitnessos/components/ui/card';
import { Progress } from '@fitnessos/components/ui/progress';
import { getJson, postJson } from '@fitnessos/lib/api';
import { formatNumber } from '@fitnessos/lib/format';
import { t } from '@fitnessos/lib/i18n';
import { nextStep, type Onboarding, stepInfo } from '@fitnessos/lib/onboarding';

const queryKey = ['fitnessos', 'onboarding'];

/** Where the coach is in the first-run guide. */
export function useOnboarding() {
    const queryClient = useQueryClient();
    const query = useQuery({
        queryKey,
        queryFn: () => getJson<Onboarding>('/fitnessos/onboarding'),
    });

    const replace = (onboarding: Onboarding) =>
        queryClient.setQueryData(queryKey, onboarding);

    return {
        ...query,
        refresh: () => queryClient.invalidateQueries({ queryKey }),
        publish: async () =>
            replace(
                (await postJson('/fitnessos/onboarding/publish')) as Onboarding,
            ),
        dismiss: async () =>
            replace(
                (await postJson('/fitnessos/onboarding/dismiss')) as Onboarding,
            ),
        restore: async () =>
            replace(
                (await postJson('/fitnessos/onboarding/restore')) as Onboarding,
            ),
    };
}

/**
 * A short reminder on the dashboard until the essentials are done (or the
 * coach hides it): how far along they are and the next thing to do.
 */
export function OnboardingCard() {
    const { data, dismiss } = useOnboarding();

    if (!data || data.complete || data.dismissed) return null;

    const next = nextStep(data);

    return (
        <Card className="border-primary/40 bg-hero-gradient mb-6 flex flex-wrap items-center gap-4 p-5">
            <Sparkles className="text-volt h-6 w-6" />
            <div className="min-w-0 flex-1">
                <div className="font-semibold">
                    {t('Finish setting up your coach account')}
                </div>
                <p className="text-muted-foreground text-sm">
                    {next
                        ? t('Next: :step', {
                              step: t(stepInfo[next.key].title),
                          })
                        : t('Almost there.')}
                </p>
                <div className="mt-3 flex items-center gap-3">
                    <Progress
                        value={(data.done / data.total) * 100}
                        className="h-1.5 max-w-xs flex-1"
                    />
                    <span className="text-muted-foreground text-xs tabular-nums">
                        {t(':done of :total steps', {
                            done: formatNumber(data.done),
                            total: formatNumber(data.total),
                        })}
                    </span>
                </div>
            </div>
            <div className="flex gap-2">
                <Button variant="ghost" onClick={() => void dismiss()}>
                    {t('Hide')}
                </Button>
                <Button asChild>
                    <Link to="/dashboard/welcome">{t('Continue')}</Link>
                </Button>
            </div>
        </Card>
    );
}
