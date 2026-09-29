import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, Sparkles } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { PageHeader } from '@fitnessos/components/app-shell';
import { useAssistantStatus } from '@fitnessos/components/ai-draft';
import { Badge } from '@fitnessos/components/ui/badge';
import { Button } from '@fitnessos/components/ui/button';
import { Card } from '@fitnessos/components/ui/card';
import { Input } from '@fitnessos/components/ui/input';
import { Label } from '@fitnessos/components/ui/label';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@fitnessos/components/ui/tabs';
import { Textarea } from '@fitnessos/components/ui/textarea';
import {
    approveDraft,
    discardDraft,
    draftKindLabels,
    requestDraft,
    type AiDraft,
    type AiDraftKind,
    type AiDraftStatus,
} from '@fitnessos/lib/ai';
import { getJson } from '@fitnessos/lib/api';
import {
    formatNumber,
    formatRelative,
    localizeDigits,
} from '@fitnessos/lib/format';
import { sep, t } from '@fitnessos/lib/i18n';
import { exerciseName } from '@fitnessos/lib/training';
import { cn } from '@fitnessos/lib/utils';

export const Route = createFileRoute('/dashboard/ai')({ component: Assistant });

type Client = { id: string; name: string };

function useDrafts(status: AiDraftStatus) {
    return useQuery({
        queryKey: ['fitnessos', 'ai', 'drafts', status],
        queryFn: () =>
            getJson<AiDraft[]>(`/fitnessos/ai/drafts?status=${status}`),
    });
}

function Assistant() {
    const { data: status, isLoading } = useAssistantStatus();
    const pending = useDrafts('pending');
    const approved = useDrafts('approved');

    return (
        <div className="flex flex-col gap-5">
            <PageHeader
                title={t('AI assistant')}
                description={t(
                    'Drafts replies, check-in feedback and plans for your trainees. You review every draft; nothing is sent until you approve it.',
                )}
            />

            <Card className="flex items-start gap-3 p-4 text-sm">
                <ShieldCheck className="text-volt mt-0.5 h-5 w-5 shrink-0" />
                <p className="text-muted-foreground">
                    {t(
                        'Trainees never talk to the assistant. It only sees what you already see about your current trainees (first name, intake, plan, check-ins, workouts and chat), and it can make mistakes, so read each draft before sending.',
                    )}
                </p>
            </Card>

            {!isLoading && status && !status.enabled && (
                <Card className="text-muted-foreground p-6 text-sm">
                    {t(
                        'The AI assistant is not set up on this server yet. The rest of your dashboard works as usual.',
                    )}
                </Card>
            )}

            {status?.enabled && (
                <>
                    <NewDraft remaining={status.remaining_today} />
                    <Tabs defaultValue="pending">
                        <TabsList className="mb-4">
                            <TabsTrigger value="pending">
                                {t('To review (:count)', {
                                    count: formatNumber(
                                        pending.data?.length ?? 0,
                                    ),
                                })}
                            </TabsTrigger>
                            <TabsTrigger value="approved">
                                {t('Sent drafts')}
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent
                            value="pending"
                            className="flex flex-col gap-4"
                        >
                            {(pending.data ?? []).map((draft) => (
                                <DraftReview key={draft.id} draft={draft} />
                            ))}
                            {!pending.isLoading &&
                                (pending.data ?? []).length === 0 && (
                                    <Card className="text-muted-foreground p-8 text-center text-sm">
                                        {t('No drafts waiting for review.')}
                                    </Card>
                                )}
                        </TabsContent>
                        <TabsContent
                            value="approved"
                            className="flex flex-col gap-3"
                        >
                            {(approved.data ?? []).map((draft) => (
                                <Card
                                    key={draft.id}
                                    className="flex flex-col gap-2 p-4 text-sm"
                                >
                                    <div className="text-muted-foreground flex flex-wrap gap-x-2 text-xs">
                                        <span className="text-foreground font-semibold">
                                            {draft.trainee.name}
                                        </span>
                                        <span>
                                            {t(draftKindLabels[draft.kind])}
                                        </span>
                                        {draft.approved_at && (
                                            <span>
                                                {formatRelative(
                                                    draft.approved_at,
                                                )}
                                            </span>
                                        )}
                                    </div>
                                    {draft.kind === 'plan' ? (
                                        <span>{draft.plan?.title}</span>
                                    ) : (
                                        <p className="line-clamp-3 whitespace-pre-line">
                                            {draft.content}
                                        </p>
                                    )}
                                </Card>
                            ))}
                            {!approved.isLoading &&
                                (approved.data ?? []).length === 0 && (
                                    <p className="text-muted-foreground text-sm">
                                        {t('Approved drafts show up here.')}
                                    </p>
                                )}
                        </TabsContent>
                    </Tabs>
                </>
            )}
        </div>
    );
}

function NewDraft({ remaining }: { remaining: number }) {
    const queryClient = useQueryClient();
    const { data: clients = [] } = useQuery({
        queryKey: ['fitnessos', 'clients'],
        queryFn: () => getJson<Client[]>('/fitnessos/clients'),
    });
    const [traineeId, setTraineeId] = useState('');
    const [kind, setKind] =
        useState<Exclude<AiDraftKind, 'checkin_feedback'>>('reply');
    const [instruction, setInstruction] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        setBusy(true);
        setError(null);
        try {
            await requestDraft({
                kind,
                trainee_id: Number(traineeId),
                instruction: instruction.trim() || null,
            });
            setInstruction('');
            await queryClient.invalidateQueries({
                queryKey: ['fitnessos', 'ai'],
            });
        } catch (cause) {
            setError(
                cause instanceof Error
                    ? cause.message
                    : t('The request failed.'),
            );
        } finally {
            setBusy(false);
        }
    };

    return (
        <Card className="p-5">
            <form
                onSubmit={submit}
                className="grid gap-4 md:grid-cols-[1fr_1fr_2fr_auto] md:items-end"
            >
                <div className="grid gap-1.5">
                    <Label htmlFor="ai-trainee">{t('Trainee')}</Label>
                    <select
                        id="ai-trainee"
                        required
                        value={traineeId}
                        onChange={(event) => setTraineeId(event.target.value)}
                        className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                    >
                        <option value="" disabled>
                            {t('Choose a trainee')}
                        </option>
                        {clients.map((client) => (
                            <option key={client.id} value={client.id}>
                                {client.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="grid gap-1.5">
                    <Label htmlFor="ai-kind">{t('Draft')}</Label>
                    <select
                        id="ai-kind"
                        value={kind}
                        onChange={(event) =>
                            setKind(event.target.value as 'reply' | 'plan')
                        }
                        className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                    >
                        <option value="reply">
                            {t(draftKindLabels.reply)}
                        </option>
                        <option value="plan">{t(draftKindLabels.plan)}</option>
                    </select>
                </div>
                <div className="grid gap-1.5">
                    <Label htmlFor="ai-instruction">
                        {t('Instructions (optional)')}
                    </Label>
                    <Input
                        id="ai-instruction"
                        maxLength={1000}
                        value={instruction}
                        placeholder={
                            kind === 'plan'
                                ? t(
                                      'e.g. 3 days a week, dumbbells only, protect the right knee',
                                  )
                                : t(
                                      'e.g. Congratulate the first week and ask about sleep',
                                  )
                        }
                        onChange={(event) => setInstruction(event.target.value)}
                    />
                </div>
                <Button
                    type="submit"
                    disabled={busy || !traineeId || remaining === 0}
                >
                    <Sparkles className={cn(busy && 'animate-pulse')} />
                    {busy ? t('Drafting…') : t('Draft')}
                </Button>
            </form>
            <div className="text-muted-foreground mt-3 flex flex-wrap gap-x-4 text-xs">
                <span>
                    {t(':count drafts left today', {
                        count: formatNumber(remaining),
                    })}
                </span>
                {error && (
                    <span role="alert" className="text-destructive">
                        {error}
                    </span>
                )}
            </div>
        </Card>
    );
}

function DraftReview({ draft }: { draft: AiDraft }) {
    const queryClient = useQueryClient();
    const [content, setContent] = useState(draft.content ?? '');
    const [title, setTitle] = useState(draft.plan?.title ?? '');
    const [busy, setBusy] = useState(false);
    const [notice, setNotice] = useState<{
        text: string;
        error: boolean;
    } | null>(null);
    const [createdPlanId, setCreatedPlanId] = useState<number | null>(null);

    const refresh = () =>
        Promise.all([
            queryClient.invalidateQueries({ queryKey: ['fitnessos', 'ai'] }),
            queryClient.invalidateQueries({ queryKey: ['fitnessos', 'plans'] }),
            queryClient.invalidateQueries({
                queryKey: ['fitnessos', 'checkins'],
            }),
            queryClient.invalidateQueries({
                queryKey: ['fitnessos', 'conversations'],
            }),
        ]);

    const run = async (action: () => Promise<string>) => {
        setBusy(true);
        setNotice(null);
        try {
            setNotice({ text: await action(), error: false });
        } catch (cause) {
            setNotice({
                text:
                    cause instanceof Error
                        ? cause.message
                        : t('The request failed.'),
                error: true,
            });
        } finally {
            setBusy(false);
        }
    };

    const approve = () =>
        run(async () => {
            const result = await approveDraft(
                draft.id,
                draft.kind === 'plan'
                    ? { title: title.trim() }
                    : { content: content.trim() },
            );
            if (draft.kind === 'plan') {
                setCreatedPlanId(result.draft.result_id);
            } else {
                await refresh();
            }
            return result.message;
        });

    const discard = () =>
        run(async () => {
            const result = await discardDraft(draft.id);
            await refresh();
            return result.message;
        });

    return (
        <Card className="flex flex-col gap-4 p-5">
            <div className="flex flex-wrap items-center gap-2">
                <Sparkles className="text-aqua h-4 w-4" />
                <span className="font-semibold">{draft.trainee.name}</span>
                <Badge variant="secondary">
                    {t(draftKindLabels[draft.kind])}
                </Badge>
                {draft.created_at && (
                    <span className="text-muted-foreground text-xs">
                        {formatRelative(draft.created_at)}
                    </span>
                )}
            </div>
            {draft.instruction && (
                <p className="text-muted-foreground text-xs">
                    {t('Your instructions: :text', { text: draft.instruction })}
                </p>
            )}

            {draft.kind === 'plan' && draft.plan ? (
                <div className="flex flex-col gap-3">
                    <div className="grid gap-1.5">
                        <Label htmlFor={`plan-title-${draft.id}`}>
                            {t('Plan name')}
                        </Label>
                        <Input
                            id={`plan-title-${draft.id}`}
                            value={title}
                            maxLength={120}
                            onChange={(event) => setTitle(event.target.value)}
                        />
                    </div>
                    {draft.plan.notes && (
                        <p className="text-muted-foreground text-sm">
                            {draft.plan.notes}
                        </p>
                    )}
                    <div className="grid gap-3 md:grid-cols-2">
                        {draft.plan.days.map((day, index) => (
                            <div
                                key={index}
                                className="border-border rounded-lg border p-3"
                            >
                                <div className="mb-2 font-semibold">
                                    {day.title}
                                </div>
                                <ul className="grid gap-1 text-sm">
                                    {day.exercises.map((item, itemIndex) => (
                                        <li
                                            key={itemIndex}
                                            className="flex justify-between gap-3"
                                        >
                                            <span>
                                                {exerciseName(item.exercise)}
                                                {item.notes && (
                                                    <span className="text-muted-foreground block text-xs">
                                                        {item.notes}
                                                    </span>
                                                )}
                                            </span>
                                            <span
                                                className="text-muted-foreground shrink-0"
                                                dir="ltr"
                                            >
                                                {formatNumber(item.sets)} ×{' '}
                                                {localizeDigits(item.reps)}
                                                {item.target_weight_kg !==
                                                    null &&
                                                    `${sep()}${formatNumber(item.target_weight_kg)} ${t('kg')}`}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <Textarea
                    rows={Math.min(
                        10,
                        Math.max(4, content.split('\n').length + 1),
                    )}
                    value={content}
                    aria-label={t('Draft text')}
                    onChange={(event) => setContent(event.target.value)}
                />
            )}

            {notice && (
                <p
                    role={notice.error ? 'alert' : 'status'}
                    className={cn(
                        'text-sm',
                        notice.error ? 'text-destructive' : 'text-volt',
                    )}
                >
                    {notice.text}
                </p>
            )}

            <div className="flex flex-wrap gap-2">
                {createdPlanId !== null ? (
                    <Button asChild>
                        <Link
                            to="/dashboard/workouts/$planId"
                            params={{ planId: String(createdPlanId) }}
                            onClick={() => void refresh()}
                        >
                            {t('Open in plan editor')}
                        </Link>
                    </Button>
                ) : (
                    <>
                        <Button
                            disabled={
                                busy ||
                                (draft.kind !== 'plan' && !content.trim())
                            }
                            onClick={() => void approve()}
                        >
                            {draft.kind === 'plan'
                                ? t('Create draft plan')
                                : draft.kind === 'checkin_feedback'
                                  ? t('Send feedback')
                                  : t('Send to :name', {
                                        name: draft.trainee.name,
                                    })}
                        </Button>
                        <Button
                            variant="ghost"
                            disabled={busy}
                            onClick={() => void discard()}
                        >
                            {t('Discard')}
                        </Button>
                    </>
                )}
            </div>
        </Card>
    );
}
