import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, LayoutTemplate, Plus, User } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { PageHeader } from '@fitnessos/components/app-shell';
import { Badge } from '@fitnessos/components/ui/badge';
import { Button } from '@fitnessos/components/ui/button';
import { Card } from '@fitnessos/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@fitnessos/components/ui/dialog';
import { Input } from '@fitnessos/components/ui/input';
import { Label } from '@fitnessos/components/ui/label';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@fitnessos/components/ui/tabs';
import { getJson, postJson } from '@fitnessos/lib/api';
import { formatNumber, formatRelative } from '@fitnessos/lib/format';
import { t } from '@fitnessos/lib/i18n';
import {
    planStatusLabels,
    type PlanDetail,
    type PlanSummary,
} from '@fitnessos/lib/training';
import { cn } from '@fitnessos/lib/utils';

export const Route = createFileRoute('/dashboard/workouts/')({
    component: Plans,
    validateSearch: (
        search: Record<string, unknown>,
    ): { trainee?: string; from?: string } => ({
        trainee: searchId(search.trainee),
        from: searchId(search.from),
    }),
});

type Client = { id: string; name: string };

function searchId(value: unknown): string | undefined {
    return typeof value === 'string' || typeof value === 'number'
        ? String(value)
        : undefined;
}

function Plans() {
    const { trainee, from } = Route.useSearch();
    const [open, setOpen] = useState(Boolean(trainee || from));
    const { data: plans = [], isLoading } = useQuery({
        queryKey: ['fitnessos', 'plans'],
        queryFn: () => getJson<PlanSummary[]>('/fitnessos/plans'),
    });
    const traineePlans = plans.filter((plan) => !plan.template);
    const templates = plans.filter((plan) => plan.template);

    return (
        <div>
            <PageHeader
                title={t('Workout plans')}
                description={t(
                    'Build plans for your trainees, or save templates you can reuse.',
                )}
                actions={
                    <Button onClick={() => setOpen(true)}>
                        <Plus />
                        {t('New plan')}
                    </Button>
                }
            />

            <Tabs defaultValue="trainees">
                <TabsList className="mb-6">
                    <TabsTrigger value="trainees">
                        {t('Trainee plans (:count)', {
                            count: formatNumber(traineePlans.length),
                        })}
                    </TabsTrigger>
                    <TabsTrigger value="templates">
                        {t('Templates (:count)', {
                            count: formatNumber(templates.length),
                        })}
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="trainees">
                    <PlanGrid
                        plans={traineePlans}
                        loading={isLoading}
                        empty={t(
                            'No plans yet. Create one for a trainee, or start from a template.',
                        )}
                    />
                </TabsContent>
                <TabsContent value="templates">
                    <PlanGrid
                        plans={templates}
                        loading={isLoading}
                        empty={t(
                            'Templates are plans without a trainee. Build one once and copy it to anyone.',
                        )}
                    />
                </TabsContent>
            </Tabs>

            <NewPlanDialog
                open={open}
                onOpenChange={setOpen}
                templates={templates}
                initialTrainee={trainee}
                initialFrom={from}
            />
        </div>
    );
}

function PlanGrid({
    plans,
    loading,
    empty,
}: {
    plans: PlanSummary[];
    loading: boolean;
    empty: string;
}) {
    if (loading) {
        return <p className="text-muted-foreground text-sm">{t('Loading…')}</p>;
    }

    if (plans.length === 0) {
        return (
            <Card className="text-muted-foreground p-8 text-center text-sm">
                {empty}
            </Card>
        );
    }

    return (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {plans.map((plan) => (
                <Link
                    key={plan.id}
                    to="/dashboard/workouts/$planId"
                    params={{ planId: String(plan.id) }}
                    className="sport-card group flex flex-col gap-3 p-5"
                >
                    <div className="flex items-start justify-between gap-3">
                        <h2 className="font-semibold group-hover:underline">
                            {plan.title}
                        </h2>
                        {!plan.template && (
                            <Badge
                                variant="secondary"
                                className={cn(
                                    plan.status === 'active' &&
                                        'bg-primary/15 text-primary',
                                )}
                            >
                                {t(planStatusLabels[plan.status])}
                            </Badge>
                        )}
                    </div>
                    <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-sm">
                        <span className="inline-flex items-center gap-1.5">
                            {plan.template ? (
                                <LayoutTemplate className="h-4 w-4" />
                            ) : (
                                <User className="h-4 w-4" />
                            )}
                            {plan.trainee?.name ?? t('Template')}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <CalendarDays className="h-4 w-4" />
                            {t(':count training days', {
                                count: formatNumber(plan.days_count),
                            })}
                        </span>
                    </div>
                    {plan.updated_at && (
                        <div className="text-subtle-foreground mt-auto text-xs">
                            {t('Updated :when', {
                                when: formatRelative(plan.updated_at),
                            })}
                        </div>
                    )}
                </Link>
            ))}
        </div>
    );
}

function NewPlanDialog({
    open,
    onOpenChange,
    templates,
    initialTrainee,
    initialFrom,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    templates: PlanSummary[];
    initialTrainee?: string;
    initialFrom?: string;
}) {
    const navigate = useNavigate();
    const { data: clients = [] } = useQuery({
        queryKey: ['fitnessos', 'clients'],
        queryFn: () => getJson<Client[]>('/fitnessos/clients'),
        enabled: open,
    });
    const [title, setTitle] = useState(
        () =>
            templates.find((plan) => String(plan.id) === initialFrom)?.title ??
            '',
    );
    const [traineeId, setTraineeId] = useState(initialTrainee ?? '');
    const [fromPlanId, setFromPlanId] = useState(initialFrom ?? '');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        setBusy(true);
        setError(null);
        try {
            const plan = (await postJson('/fitnessos/plans', {
                title: title.trim(),
                trainee_id: traineeId ? Number(traineeId) : null,
                from_plan_id: fromPlanId ? Number(fromPlanId) : null,
            })) as PlanDetail;
            await navigate({
                to: '/dashboard/workouts/$planId',
                params: { planId: String(plan.id) },
            });
        } catch (cause) {
            setError(
                cause instanceof Error
                    ? cause.message
                    : t('The request failed.'),
            );
            setBusy(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('New plan')}</DialogTitle>
                </DialogHeader>
                <form className="grid gap-4" onSubmit={submit}>
                    <div className="grid gap-1.5">
                        <Label htmlFor="plan-title">{t('Plan name')}</Label>
                        <Input
                            id="plan-title"
                            required
                            maxLength={120}
                            value={title}
                            placeholder={t('e.g. 8-week strength base')}
                            onChange={(event) => setTitle(event.target.value)}
                        />
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="plan-trainee">{t('For')}</Label>
                        <select
                            id="plan-trainee"
                            value={traineeId}
                            onChange={(event) =>
                                setTraineeId(event.target.value)
                            }
                            className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                        >
                            <option value="">{t('A reusable template')}</option>
                            {clients.map((client) => (
                                <option key={client.id} value={client.id}>
                                    {client.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    {templates.length > 0 && (
                        <div className="grid gap-1.5">
                            <Label htmlFor="plan-template">
                                {t('Start from')}
                            </Label>
                            <select
                                id="plan-template"
                                value={fromPlanId}
                                onChange={(event) =>
                                    setFromPlanId(event.target.value)
                                }
                                className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                            >
                                <option value="">{t('An empty plan')}</option>
                                {templates.map((template) => (
                                    <option
                                        key={template.id}
                                        value={template.id}
                                    >
                                        {template.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    {error && (
                        <p role="alert" className="text-destructive text-sm">
                            {error}
                        </p>
                    )}
                    <Button type="submit" disabled={busy || !title.trim()}>
                        {busy ? t('Creating…') : t('Create and edit')}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
