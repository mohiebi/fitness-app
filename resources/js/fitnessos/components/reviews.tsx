import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
    RatingBadge,
    StarPicker,
    Stars,
    type RatingSummary,
} from '@fitnessos/components/stars';
import { Button } from '@fitnessos/components/ui/button';
import { Card } from '@fitnessos/components/ui/card';
import { Textarea } from '@fitnessos/components/ui/textarea';
import { getJson, postJson } from '@fitnessos/lib/api';
import { formatDate } from '@fitnessos/lib/format';
import { t } from '@fitnessos/lib/i18n';

type ReviewableCoaching = {
    coaching_id: number;
    coach_name: string;
    status: 'active' | 'ended';
    can_review: boolean;
    eligible_on: string | null;
    review: {
        rating: number;
        comment: string | null;
        coach_reply: string | null;
        hidden: boolean;
    } | null;
};

/** Trainee: review the coaches they trained with. */
export function MyReviews() {
    const { data = [] } = useQuery({
        queryKey: ['fitnessos', 'my-reviews'],
        queryFn: () => getJson<ReviewableCoaching[]>('/fitnessos/my-reviews'),
    });

    if (data.length === 0) return null;

    return (
        <Card className="flex flex-col gap-4 p-5">
            <div>
                <h2 className="font-semibold">{t('Reviews')}</h2>
                <p className="text-muted-foreground text-sm">
                    {t(
                        'Help other trainees choose. Your review shows your first name only.',
                    )}
                </p>
            </div>
            {data.map((item) => (
                <ReviewForm key={item.coaching_id} item={item} />
            ))}
        </Card>
    );
}

function ReviewForm({ item }: { item: ReviewableCoaching }) {
    const queryClient = useQueryClient();
    const [rating, setRating] = useState(item.review?.rating ?? 0);
    const [comment, setComment] = useState(item.review?.comment ?? '');
    const [busy, setBusy] = useState(false);
    const [notice, setNotice] = useState<{
        text: string;
        error: boolean;
    } | null>(null);

    if (!item.can_review && !item.review) {
        return (
            <div className="border-border rounded-lg border p-3 text-sm">
                <span className="font-medium">{item.coach_name}</span>
                <span className="text-muted-foreground">
                    {' — '}
                    {item.eligible_on
                        ? t('You can review from :date.', {
                              date: formatDate(item.eligible_on),
                          })
                        : t('Not available for review.')}
                </span>
            </div>
        );
    }

    const save = async () => {
        setBusy(true);
        setNotice(null);
        try {
            const result = (await postJson(
                `/fitnessos/coachings/${item.coaching_id}/review`,
                {
                    rating,
                    comment: comment.trim() || null,
                },
            )) as { message: string };
            setNotice({ text: result.message, error: false });
            await queryClient.invalidateQueries({
                queryKey: ['fitnessos', 'my-reviews'],
            });
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

    return (
        <div className="border-border flex flex-col gap-3 rounded-lg border p-4">
            <div className="font-medium">{item.coach_name}</div>
            <StarPicker value={rating} onChange={setRating} />
            <Textarea
                rows={3}
                maxLength={2000}
                value={comment}
                aria-label={t('Your review')}
                placeholder={t('What was it like to train with this coach?')}
                onChange={(event) => setComment(event.target.value)}
            />
            {item.review?.hidden && (
                <p className="text-muted-foreground text-xs">
                    {t('This review was hidden by FitnessOS.')}
                </p>
            )}
            {item.review?.coach_reply && (
                <div className="bg-secondary rounded-lg p-3 text-sm">
                    <div className="text-muted-foreground mb-1 text-xs font-semibold">
                        {t("Coach's reply")}
                    </div>
                    {item.review.coach_reply}
                </div>
            )}
            {notice && (
                <p
                    role={notice.error ? 'alert' : 'status'}
                    className={
                        notice.error
                            ? 'text-destructive text-sm'
                            : 'text-volt text-sm'
                    }
                >
                    {notice.text}
                </p>
            )}
            <Button
                className="self-start"
                disabled={busy || rating === 0}
                onClick={() => void save()}
            >
                {item.review ? t('Update review') : t('Publish review')}
            </Button>
        </div>
    );
}

type CoachReviewItem = {
    id: number;
    rating: number;
    comment: string | null;
    reviewer: string;
    coach_reply: string | null;
    created_at: string | null;
    hidden: boolean;
};

/** Coach: read reviews about themselves and reply. */
export function CoachReviewsManager() {
    const { data } = useQuery({
        queryKey: ['fitnessos', 'coach-reviews'],
        queryFn: () =>
            getJson<{ summary: RatingSummary; reviews: CoachReviewItem[] }>(
                '/fitnessos/coach-reviews',
            ),
    });

    return (
        <Card className="flex flex-col gap-4 p-5 md:p-6">
            <div className="flex flex-wrap items-baseline gap-3">
                <h2 className="text-lg font-semibold">{t('Reviews')}</h2>
                <RatingBadge rating={data?.summary} className="text-sm" />
            </div>
            {data && data.reviews.length === 0 && (
                <p className="text-muted-foreground text-sm">
                    {t(
                        'No reviews yet. Trainees can review you after two weeks of coaching.',
                    )}
                </p>
            )}
            {data?.reviews.map((review) => (
                <ReplyForm key={review.id} review={review} />
            ))}
        </Card>
    );
}

function ReplyForm({ review }: { review: CoachReviewItem }) {
    const queryClient = useQueryClient();
    const [reply, setReply] = useState(review.coach_reply ?? '');
    const [busy, setBusy] = useState(false);
    const [saved, setSaved] = useState(false);

    const save = async () => {
        setBusy(true);
        setSaved(false);
        try {
            await postJson(`/fitnessos/coach-reviews/${review.id}/reply`, {
                reply: reply.trim() || null,
            });
            setSaved(true);
            await queryClient.invalidateQueries({
                queryKey: ['fitnessos', 'coach-reviews'],
            });
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="border-border flex flex-col gap-2 rounded-lg border p-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <Stars value={review.rating} />
                <span className="font-semibold">{review.reviewer}</span>
                {review.created_at && (
                    <span className="text-muted-foreground text-xs">
                        {formatDate(review.created_at)}
                    </span>
                )}
                {review.hidden && (
                    <span className="text-destructive text-xs">
                        {t('Hidden by FitnessOS')}
                    </span>
                )}
            </div>
            {review.comment && (
                <p className="text-sm whitespace-pre-line">{review.comment}</p>
            )}
            <Textarea
                rows={2}
                maxLength={1000}
                value={reply}
                aria-label={t('Your reply')}
                placeholder={t('Reply publicly (optional)')}
                onChange={(event) => setReply(event.target.value)}
            />
            <div className="flex items-center gap-3">
                <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => void save()}
                >
                    {t('Save reply')}
                </Button>
                {saved && (
                    <span className="text-volt text-xs">
                        {t('Reply saved.')}
                    </span>
                )}
            </div>
        </div>
    );
}
