import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@fitnessos/components/ui/button';
import { getJson } from '@fitnessos/lib/api';
import {
    requestDraft,
    type AiDraft,
    type AiDraftKind,
    type AssistantStatus,
} from '@fitnessos/lib/ai';
import { t } from '@fitnessos/lib/i18n';
import { cn } from '@fitnessos/lib/utils';

export function useAssistantStatus() {
    return useQuery({
        queryKey: ['fitnessos', 'ai', 'status'],
        queryFn: () => getJson<AssistantStatus>('/fitnessos/ai/status'),
        staleTime: 60_000,
    });
}

/**
 * Asks the assistant for a draft and hands it back to the caller, which
 * shows it to the coach for editing. Hidden when the assistant is off.
 */
export function AiDraftButton({
    kind,
    traineeId,
    checkinId,
    instruction,
    onDraft,
    className,
    label,
}: {
    kind: AiDraftKind;
    traineeId: number;
    checkinId?: number;
    instruction?: string;
    onDraft: (draft: AiDraft) => void;
    className?: string;
    label?: string;
}) {
    const queryClient = useQueryClient();
    const { data: status } = useAssistantStatus();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!status?.enabled) return null;

    const run = async () => {
        setBusy(true);
        setError(null);
        try {
            const draft = await requestDraft({
                kind,
                trainee_id: traineeId,
                checkin_id: checkinId,
                instruction: instruction?.trim() || null,
            });
            await queryClient.invalidateQueries({
                queryKey: ['fitnessos', 'ai'],
            });
            onDraft(draft);
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
        <div className={cn('flex flex-col gap-1', className)}>
            <Button
                type="button"
                variant="outline"
                disabled={busy || status.remaining_today === 0}
                onClick={() => void run()}
            >
                <Sparkles className={cn(busy && 'animate-pulse')} />
                {busy ? t('Drafting…') : (label ?? t('Draft with AI'))}
            </Button>
            {error && (
                <p role="alert" className="text-destructive text-xs">
                    {error}
                </p>
            )}
        </div>
    );
}

/** Shown above a text box while it holds an AI draft the coach hasn't sent. */
export function AiDraftNotice({ onDiscard }: { onDiscard: () => void }) {
    return (
        <div className="border-aqua/40 bg-aqua/10 flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 text-xs">
            <Sparkles className="text-aqua h-4 w-4" />
            <span className="flex-1">
                {t(
                    'AI draft. Only you can see it. Edit it as needed; it is sent only when you press send.',
                )}
            </span>
            <button
                type="button"
                onClick={onDiscard}
                className="text-muted-foreground hover:text-foreground font-semibold"
            >
                {t('Discard draft')}
            </button>
        </div>
    );
}
