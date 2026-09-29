import { postJson } from './api';
import type { Exercise } from './training';

export type AiDraftKind = 'reply' | 'checkin_feedback' | 'plan';
export type AiDraftStatus = 'pending' | 'approved' | 'discarded' | 'failed';

export type AiPlanDraft = {
    title: string;
    notes: string | null;
    days: {
        title: string;
        exercises: {
            exercise_id: number;
            exercise: Exercise;
            sets: number;
            reps: string;
            rest_seconds: number;
            target_weight_kg: number | null;
            notes: string | null;
        }[];
    }[];
};

export type AiDraft = {
    id: number;
    kind: AiDraftKind;
    status: AiDraftStatus;
    trainee: { id: number; name: string };
    source_id: number | null;
    instruction: string | null;
    content: string | null;
    plan: AiPlanDraft | null;
    error: string | null;
    result_id: number | null;
    created_at: string | null;
    approved_at: string | null;
};

export type AssistantStatus = {
    enabled: boolean;
    remaining_today: number;
    daily_limit: number;
};

export const draftKindLabels: Record<AiDraftKind, string> = {
    reply: 'Chat reply',
    checkin_feedback: 'Check-in feedback',
    plan: 'Training plan',
};

export function requestDraft(payload: {
    kind: AiDraftKind;
    trainee_id: number;
    checkin_id?: number;
    instruction?: string | null;
}): Promise<AiDraft> {
    return postJson('/fitnessos/ai/drafts', payload) as Promise<AiDraft>;
}

export function approveDraft(
    id: number,
    payload: { content?: string; title?: string } = {},
): Promise<{ message: string; draft: AiDraft }> {
    return postJson(`/fitnessos/ai/drafts/${id}/approve`, payload) as Promise<{
        message: string;
        draft: AiDraft;
    }>;
}

export function discardDraft(id: number): Promise<{ message: string }> {
    return postJson(`/fitnessos/ai/drafts/${id}/discard`) as Promise<{
        message: string;
    }>;
}
