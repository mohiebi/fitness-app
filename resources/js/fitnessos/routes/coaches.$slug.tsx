import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    ArrowRight,
    Award,
    Check,
    Languages,
    MapPin,
    Users,
    Wifi,
} from 'lucide-react';
import { useState } from 'react';
import { PublicNav, Footer } from '@fitnessos/components/public-nav';
import { CoachAvatar, VerifiedBadge } from '@fitnessos/components/coach-card';
import {
    RatingBadge,
    Stars,
    type RatingSummary,
} from '@fitnessos/components/stars';
import { Badge } from '@fitnessos/components/ui/badge';
import { Button } from '@fitnessos/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@fitnessos/components/ui/dialog';
import { Label } from '@fitnessos/components/ui/label';
import { Textarea } from '@fitnessos/components/ui/textarea';
import { getJson, postJson } from '@fitnessos/lib/api';
import { currentRole } from '@fitnessos/lib/auth';
import { sep, t } from '@fitnessos/lib/i18n';
import { formatDate, formatNumber, formatToman } from '@fitnessos/lib/format';
import {
    specialtyLabel,
    type CoachSummary,
    type MyCoaching,
} from '@fitnessos/lib/marketplace';

export const Route = createFileRoute('/coaches/$slug')({
    validateSearch: (
        search: Record<string, unknown>,
    ): { request?: boolean } => ({
        request:
            search.request === 1 ||
            search.request === '1' ||
            search.request === true
                ? true
                : undefined,
    }),
    head: () => ({ meta: [{ title: t('Coach profile — FitnessOS') }] }),
    component: CoachProfilePage,
});

function CoachProfilePage() {
    const { slug } = Route.useParams();
    const search = Route.useSearch();
    const role = currentRole();
    const {
        data: coach,
        isLoading,
        error,
    } = useQuery({
        queryKey: ['fitnessos', 'coach', slug],
        queryFn: () => getJson<CoachSummary>(`/fitnessos/coaches/${slug}`),
    });
    const { data: mine } = useQuery({
        queryKey: ['fitnessos', 'my-coaching'],
        queryFn: () => getJson<MyCoaching>('/fitnessos/my-coaching'),
        enabled: role === 'client',
    });
    const [open, setOpen] = useState(
        Boolean(search.request) && role === 'client',
    );

    if (isLoading) {
        return (
            <Shell>
                <p className="text-muted-foreground">{t('Loading…')}</p>
            </Shell>
        );
    }

    if (error || !coach) {
        return (
            <Shell>
                <h1 className="font-display text-3xl font-extrabold">
                    {t('Coach not found')}
                </h1>
                <p className="text-muted-foreground mt-2">
                    {t('This profile is not public or no longer exists.')}
                </p>
                <Button asChild className="mt-6">
                    <Link to="/coaches">{t('Browse coaches')}</Link>
                </Button>
            </Shell>
        );
    }

    const isCurrentCoach = mine?.active?.coach.slug === coach.slug;
    const hasPendingHere = mine?.pending?.coach.slug === coach.slug;

    return (
        <Shell>
            <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
                <div>
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                        <CoachAvatar
                            coach={coach}
                            className="h-28 w-28 text-2xl"
                        />
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="font-display text-4xl font-extrabold">
                                    {coach.name}
                                </h1>
                                {coach.verified && <VerifiedBadge />}
                                <RatingBadge
                                    rating={coach.rating}
                                    className="text-sm"
                                />
                            </div>
                            {coach.headline && (
                                <p className="text-muted-foreground mt-2 text-lg">
                                    {coach.headline}
                                </p>
                            )}
                        </div>
                    </div>

                    {coach.specialties.length > 0 && (
                        <div className="mt-6 flex flex-wrap gap-2">
                            {coach.specialties.map((key) => (
                                <Badge
                                    key={key}
                                    variant="secondary"
                                    className="px-3 py-1 text-sm"
                                >
                                    {specialtyLabel(key)}
                                </Badge>
                            ))}
                        </div>
                    )}

                    {coach.bio && (
                        <section className="mt-10">
                            <h2 className="text-xl font-bold">
                                {t('About me')}
                            </h2>
                            <p className="text-muted-foreground mt-3 leading-relaxed whitespace-pre-line">
                                {coach.bio}
                            </p>
                        </section>
                    )}

                    {coach.certifications.length > 0 && (
                        <section className="mt-10">
                            <h2 className="text-xl font-bold">
                                {t('Certifications')}
                            </h2>
                            <ul className="mt-3 space-y-2">
                                {coach.certifications.map((item) => (
                                    <li
                                        key={item}
                                        className="text-muted-foreground flex items-start gap-2"
                                    >
                                        <Award className="text-volt mt-0.5 h-4 w-4 shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    <Reviews slug={coach.slug} />
                </div>

                <aside className="sport-card h-fit p-6 lg:sticky lg:top-28">
                    <div className="text-muted-foreground text-sm">
                        {t('Monthly coaching')}
                    </div>
                    <div className="font-display mt-1 text-2xl font-extrabold">
                        {coach.price_from !== null
                            ? t('From :price', {
                                  price: formatToman(coach.price_from),
                              })
                            : t('Price on request')}
                    </div>

                    <ul className="text-muted-foreground mt-5 space-y-2.5 text-sm">
                        {coach.city && (
                            <li className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                {coach.city}
                                {coach.in_person && `${sep()}${t('In person')}`}
                            </li>
                        )}
                        {coach.online && (
                            <li className="flex items-center gap-2">
                                <Wifi className="h-4 w-4" />
                                {t('Online coaching')}
                            </li>
                        )}
                        {coach.years_experience !== null && (
                            <li className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                {t(':years years experience', {
                                    years: formatNumber(coach.years_experience),
                                })}
                            </li>
                        )}
                        {coach.languages.length > 0 && (
                            <li className="flex items-center gap-2">
                                <Languages className="h-4 w-4" />
                                {coach.languages.join('، ')}
                            </li>
                        )}
                    </ul>

                    <div className="mt-6">
                        {isCurrentCoach ? (
                            <Button asChild className="w-full" size="lg">
                                <Link to="/app/messages">
                                    {t('Message your coach')}
                                </Link>
                            </Button>
                        ) : hasPendingHere ? (
                            <p className="bg-secondary flex items-center gap-2 rounded-lg p-3 text-sm">
                                <Check className="text-volt h-4 w-4" />
                                {t(
                                    'Request sent. The coach will review it soon.',
                                )}
                            </p>
                        ) : !coach.accepting_clients ? (
                            <p className="bg-secondary text-muted-foreground rounded-lg p-3 text-sm">
                                {t(
                                    'This coach is not accepting new trainees right now.',
                                )}
                            </p>
                        ) : role === 'client' ? (
                            <Button
                                className="w-full"
                                size="lg"
                                onClick={() => setOpen(true)}
                            >
                                {t('Request coaching')}
                                <ArrowRight className="rtl:rotate-180" />
                            </Button>
                        ) : role === null ? (
                            <Button asChild className="w-full" size="lg">
                                <a
                                    href={`/register?role=client&coach=${encodeURIComponent(coach.slug)}`}
                                >
                                    {t('Sign up to request coaching')}
                                    <ArrowRight className="rtl:rotate-180" />
                                </a>
                            </Button>
                        ) : (
                            <p className="bg-secondary text-muted-foreground rounded-lg p-3 text-sm">
                                {t(
                                    'You are signed in as a coach. Trainee accounts can request coaching.',
                                )}
                            </p>
                        )}
                        {mine?.active &&
                            !isCurrentCoach &&
                            coach.accepting_clients && (
                                <p className="text-muted-foreground mt-3 text-xs">
                                    {t(
                                        'If this coach accepts, your coaching with :name ends automatically.',
                                        { name: mine.active.coach.name },
                                    )}
                                </p>
                            )}
                    </div>
                </aside>
            </div>

            <RequestDialog
                coach={coach}
                open={open}
                onOpenChange={setOpen}
                hasPendingElsewhere={Boolean(mine?.pending && !hasPendingHere)}
            />
        </Shell>
    );
}

function RequestDialog({
    coach,
    open,
    onOpenChange,
    hasPendingElsewhere,
}: {
    coach: CoachSummary;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    hasPendingElsewhere: boolean;
}) {
    const queryClient = useQueryClient();
    const [message, setMessage] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const submit = async () => {
        setBusy(true);
        setError(null);
        try {
            await postJson('/fitnessos/coachings', {
                coach: coach.slug,
                message: message.trim() || null,
            });
            await queryClient.invalidateQueries({
                queryKey: ['fitnessos', 'my-coaching'],
            });
            onOpenChange(false);
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
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {t('Request coaching from :name', { name: coach.name })}
                    </DialogTitle>
                    <DialogDescription>
                        {t(
                            'Tell the coach about your goal. They see your intake profile too, so keep it up to date.',
                        )}
                    </DialogDescription>
                </DialogHeader>
                {hasPendingElsewhere && (
                    <p
                        role="alert"
                        className="bg-secondary rounded-lg p-3 text-sm"
                    >
                        {t(
                            'You already have a pending request. Withdraw it from My coach before sending another.',
                        )}
                    </p>
                )}
                <div className="grid gap-2">
                    <Label htmlFor="request-message">
                        {t('Message (optional)')}
                    </Label>
                    <Textarea
                        id="request-message"
                        rows={4}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        maxLength={2000}
                    />
                    <Link
                        to="/app/profile"
                        className="text-primary text-sm font-semibold hover:underline"
                    >
                        {t('Review my intake profile')}
                    </Link>
                </div>
                {error && (
                    <p role="alert" className="text-destructive text-sm">
                        {error}
                    </p>
                )}
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        {t('Cancel')}
                    </Button>
                    <Button
                        onClick={() => void submit()}
                        disabled={busy || hasPendingElsewhere}
                    >
                        {busy ? t('Sending…') : t('Send request')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function Shell({ children }: { children: React.ReactNode }) {
    return (
        <div className="bg-background min-h-screen">
            <PublicNav />
            <section className="mx-auto max-w-6xl px-4 pt-14 pb-24 md:px-6">
                {children}
            </section>
            <Footer />
        </div>
    );
}

type PublicReview = {
    id: number;
    rating: number;
    comment: string | null;
    reviewer: string;
    coach_reply: string | null;
    created_at: string | null;
};

function Reviews({ slug }: { slug: string }) {
    const { data } = useQuery({
        queryKey: ['fitnessos', 'coach', slug, 'reviews'],
        queryFn: () =>
            getJson<{ summary: RatingSummary; reviews: PublicReview[] }>(
                `/fitnessos/coaches/${slug}/reviews`,
            ),
    });

    if (!data || data.reviews.length === 0) return null;

    return (
        <section className="mt-10">
            <div className="flex flex-wrap items-baseline gap-3">
                <h2 className="text-xl font-bold">{t('Reviews')}</h2>
                <RatingBadge rating={data.summary} className="text-sm" />
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
                {t(
                    'Only trainees who trained with this coach for at least two weeks can leave a review.',
                )}
            </p>
            <ul className="mt-4 flex flex-col gap-3">
                {data.reviews.map((review) => (
                    <li
                        key={review.id}
                        className="border-border rounded-xl border p-4"
                    >
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <Stars value={review.rating} />
                            <span className="font-semibold">
                                {review.reviewer}
                            </span>
                            {review.created_at && (
                                <span className="text-muted-foreground text-xs">
                                    {formatDate(review.created_at)}
                                </span>
                            )}
                        </div>
                        {review.comment && (
                            <p className="mt-2 text-sm whitespace-pre-line">
                                {review.comment}
                            </p>
                        )}
                        {review.coach_reply && (
                            <div className="bg-secondary mt-3 rounded-lg p-3 text-sm">
                                <div className="text-muted-foreground mb-1 text-xs font-semibold">
                                    {t("Coach's reply")}
                                </div>
                                <p className="whitespace-pre-line">
                                    {review.coach_reply}
                                </p>
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        </section>
    );
}
