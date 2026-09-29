import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ClipboardCheck, Moon, Ruler, Weight, Zap } from 'lucide-react';
import { PageHeader } from '@fitnessos/components/app-shell';
import { AiDraftButton, AiDraftNotice } from '@fitnessos/components/ai-draft';
import { Card } from '@fitnessos/components/ui/card';
import { Badge } from '@fitnessos/components/ui/badge';
import { Button } from '@fitnessos/components/ui/button';
import { Textarea } from '@fitnessos/components/ui/textarea';
import { approveDraft, discardDraft } from '@fitnessos/lib/ai';
import { getJson, patchJson } from '@fitnessos/lib/api';
import { formatDate, formatNumber } from '@fitnessos/lib/format';
import { t } from '@fitnessos/lib/i18n';

export const Route = createFileRoute('/dashboard/checkins')({
    component: Checkins,
    validateSearch: (
        search: Record<string, unknown>,
    ): { checkin?: number } => ({
        checkin: Number(search.checkin) || undefined,
    }),
});

type Checkin = {
    id: number;
    client_id: number;
    client_name: string;
    weight_kg: string | null;
    waist_cm: string | null;
    sleep_hours: string | null;
    steps: number | null;
    energy: number | null;
    hunger: number | null;
    reflection: string | null;
    adjustments: string | null;
    status: string;
    created_at: string;
};

function Checkins() {
    const { checkin } = Route.useSearch();
    const [active, setActive] = useState<number | null>(checkin ?? null);
    const [feedback, setFeedback] = useState('');
    // Set while the feedback box holds an AI draft; sending approves it.
    const [aiDraftId, setAiDraftId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const queryClient = useQueryClient();
    const {
        data: checkins = [],
        isLoading,
        error,
    } = useQuery({
        queryKey: ['fitnessos', 'checkins'],
        queryFn: () => getJson<Checkin[]>('/fitnessos/checkins'),
    });
    const selected =
        checkins.find((entry) => entry.id === active) ?? checkins[0];

    const select = (id: number) => {
        setActive(id);
        setResult(null);
        setFeedback('');
        setAiDraftId(null);
    };

    const sendFeedback = async () => {
        if (!selected || !feedback.trim()) return;
        setSaving(true);
        setResult(null);
        try {
            if (aiDraftId !== null) {
                await approveDraft(aiDraftId, { content: feedback.trim() });
                setAiDraftId(null);
                void queryClient.invalidateQueries({
                    queryKey: ['fitnessos', 'ai'],
                });
            } else {
                await patchJson(`/fitnessos/checkins/${selected.id}`, {
                    feedback: feedback.trim(),
                });
            }
            setFeedback('');
            setResult(t('Feedback sent to your trainee.'));
            await queryClient.invalidateQueries({
                queryKey: ['fitnessos', 'checkins'],
            });
        } catch (cause) {
            setResult(
                cause instanceof Error
                    ? cause.message
                    : t('The request failed.'),
            );
        } finally {
            setSaving(false);
        }
    };

    const discardAiDraft = () => {
        if (aiDraftId === null) return;
        void discardDraft(aiDraftId).then(() =>
            queryClient.invalidateQueries({ queryKey: ['fitnessos', 'ai'] }),
        );
        setAiDraftId(null);
        setFeedback('');
    };

    return (
        <div>
            <PageHeader
                title={t('Weekly check-ins')}
                description={t(
                    "Review your trainees' updates and reply with feedback.",
                )}
            />
            {isLoading && (
                <p className="text-muted-foreground text-sm">{t('Loading…')}</p>
            )}
            {error && (
                <p role="alert" className="text-destructive text-sm">
                    {error instanceof Error
                        ? error.message
                        : t('The request failed.')}
                </p>
            )}
            <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
                <Card className="border-border/60 bg-card shadow-card-premium h-fit p-3">
                    {checkins.map((entry) => (
                        <button
                            key={entry.id}
                            onClick={() => select(entry.id)}
                            className={`mb-1 flex w-full items-center gap-3 rounded-xl p-3 text-start ${selected?.id === entry.id ? 'bg-primary/15' : 'hover:bg-secondary'}`}
                        >
                            <ClipboardCheck className="text-primary h-4 w-4" />
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-medium">
                                    {entry.client_name}
                                </span>
                                <span className="text-muted-foreground text-xs">
                                    {formatDate(entry.created_at)}
                                </span>
                            </span>
                            {entry.status === 'Pending' && (
                                <span className="bg-primary h-2 w-2 rounded-full" />
                            )}
                        </button>
                    ))}
                    {!isLoading && checkins.length === 0 && (
                        <p className="text-muted-foreground p-4 text-sm">
                            {t('No check-ins yet.')}
                        </p>
                    )}
                </Card>

                {selected ? (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-semibold">
                                {selected.client_name}
                            </h2>
                            <Badge variant="secondary">
                                {selected.status === 'Reviewed'
                                    ? t('Reviewed')
                                    : t('Pending')}
                            </Badge>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            <Metric
                                icon={Weight}
                                label={t('Weight')}
                                value={
                                    selected.weight_kg
                                        ? t(':value kg', {
                                              value: formatNumber(
                                                  Number(selected.weight_kg),
                                              ),
                                          })
                                        : '—'
                                }
                            />
                            <Metric
                                icon={Ruler}
                                label={t('Waist')}
                                value={
                                    selected.waist_cm
                                        ? t(':value cm', {
                                              value: formatNumber(
                                                  Number(selected.waist_cm),
                                              ),
                                          })
                                        : '—'
                                }
                            />
                            <Metric
                                icon={Moon}
                                label={t('Sleep')}
                                value={
                                    selected.sleep_hours
                                        ? t(':value h', {
                                              value: formatNumber(
                                                  Number(selected.sleep_hours),
                                              ),
                                          })
                                        : '—'
                                }
                            />
                            <Metric
                                icon={Zap}
                                label={t('Energy')}
                                value={
                                    selected.energy
                                        ? `${formatNumber(selected.energy)}/${formatNumber(10)}`
                                        : '—'
                                }
                            />
                        </div>
                        <Card className="border-border/60 bg-card shadow-card-premium p-6">
                            <h3 className="font-semibold">{t('Reflection')}</h3>
                            <p className="text-muted-foreground mt-2 text-sm whitespace-pre-wrap">
                                {selected.reflection ||
                                    t('No reflection provided.')}
                            </p>
                            {selected.adjustments && (
                                <>
                                    <h3 className="mt-5 font-semibold">
                                        {t('Requested adjustments')}
                                    </h3>
                                    <p className="text-muted-foreground mt-2 text-sm whitespace-pre-wrap">
                                        {selected.adjustments}
                                    </p>
                                </>
                            )}
                        </Card>
                        <Card className="border-border/60 bg-card shadow-card-premium flex flex-col gap-3 p-6">
                            <h3 className="font-semibold">
                                {t('Coach feedback')}
                            </h3>
                            {aiDraftId !== null && (
                                <AiDraftNotice onDiscard={discardAiDraft} />
                            )}
                            <Textarea
                                rows={aiDraftId !== null ? 8 : 5}
                                placeholder={t(
                                    'Write feedback for this check-in…',
                                )}
                                value={feedback}
                                onChange={(event) =>
                                    setFeedback(event.target.value)
                                }
                            />
                            {result && (
                                <p
                                    role="status"
                                    className="text-primary text-sm"
                                >
                                    {result}
                                </p>
                            )}
                            <div className="flex flex-wrap items-start gap-2">
                                <Button
                                    disabled={saving || !feedback.trim()}
                                    onClick={sendFeedback}
                                >
                                    {saving
                                        ? t('Sending…')
                                        : t('Send feedback')}
                                </Button>
                                {aiDraftId === null &&
                                    selected.status === 'Pending' && (
                                        <AiDraftButton
                                            kind="checkin_feedback"
                                            traineeId={selected.client_id}
                                            checkinId={selected.id}
                                            onDraft={(draft) => {
                                                setFeedback(
                                                    draft.content ?? '',
                                                );
                                                setAiDraftId(draft.id);
                                            }}
                                        />
                                    )}
                            </div>
                        </Card>
                    </div>
                ) : (
                    <div className="text-muted-foreground grid min-h-64 place-items-center text-sm">
                        {t('Select a check-in to review.')}
                    </div>
                )}
            </div>
        </div>
    );
}

function Metric({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof Weight;
    label: string;
    value: string;
}) {
    return (
        <Card className="border-border/60 bg-card shadow-card-premium p-5">
            <Icon className="text-primary h-5 w-5" />
            <div className="text-muted-foreground mt-3 text-sm font-medium">
                {label}
            </div>
            <div className="mt-1 text-xl font-semibold">{value}</div>
        </Card>
    );
}
