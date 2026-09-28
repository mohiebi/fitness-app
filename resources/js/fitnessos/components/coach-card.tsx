import { Link } from '@tanstack/react-router';
import { BadgeCheck, MapPin, Wifi } from 'lucide-react';
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from '@fitnessos/components/ui/avatar';
import { Badge } from '@fitnessos/components/ui/badge';
import { t } from '@fitnessos/lib/i18n';
import { formatNumber, formatToman } from '@fitnessos/lib/format';
import {
    initials,
    specialtyLabel,
    type CoachSummary,
} from '@fitnessos/lib/marketplace';
import { cn } from '@fitnessos/lib/utils';

export function CoachAvatar({
    coach,
    className,
}: {
    coach: Pick<CoachSummary, 'name' | 'avatar_url'>;
    className?: string;
}) {
    return (
        <Avatar className={cn('h-16 w-16', className)}>
            {coach.avatar_url && (
                <AvatarImage
                    src={coach.avatar_url}
                    alt={coach.name}
                    className="object-cover"
                />
            )}
            <AvatarFallback className="bg-secondary font-bold">
                {initials(coach.name)}
            </AvatarFallback>
        </Avatar>
    );
}

export function VerifiedBadge() {
    return (
        <span
            className="text-aqua inline-flex items-center gap-1 text-xs font-bold"
            title={t('Certifications checked by FitnessOS')}
        >
            <BadgeCheck className="h-4 w-4" />
            {t('Verified')}
        </span>
    );
}

export function CoachMeta({ coach }: { coach: CoachSummary }) {
    return (
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            {coach.city && (
                <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {coach.city}
                </span>
            )}
            {coach.online && (
                <span className="inline-flex items-center gap-1">
                    <Wifi className="h-3.5 w-3.5" />
                    {t('Online coaching')}
                </span>
            )}
            {coach.years_experience !== null && (
                <span>
                    {t(':years years experience', {
                        years: formatNumber(coach.years_experience),
                    })}
                </span>
            )}
        </div>
    );
}

export function CoachCard({ coach }: { coach: CoachSummary }) {
    return (
        <Link
            to="/coaches/$slug"
            params={{ slug: coach.slug }}
            className="sport-card group flex h-full flex-col gap-4 p-5 transition-transform hover:-translate-y-1"
        >
            <div className="flex items-start gap-4">
                <CoachAvatar coach={coach} />
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-lg font-bold group-hover:underline">
                            {coach.name}
                        </h2>
                        {coach.verified && <VerifiedBadge />}
                    </div>
                    {coach.headline && (
                        <p className="text-muted-foreground mt-0.5 line-clamp-2 text-sm">
                            {coach.headline}
                        </p>
                    )}
                </div>
            </div>

            <CoachMeta coach={coach} />

            {coach.specialties.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {coach.specialties.slice(0, 4).map((key) => (
                        <Badge
                            key={key}
                            variant="secondary"
                            className="font-medium"
                        >
                            {specialtyLabel(key)}
                        </Badge>
                    ))}
                </div>
            )}

            <div className="border-border mt-auto flex items-center justify-between gap-3 border-t pt-4 text-sm">
                <span className="text-muted-foreground">
                    {coach.price_from !== null
                        ? t('From :price / month', {
                              price: formatToman(coach.price_from),
                          })
                        : t('Price on request')}
                </span>
                <span
                    className={cn(
                        'text-xs font-bold',
                        coach.accepting_clients
                            ? 'text-volt'
                            : 'text-subtle-foreground',
                    )}
                >
                    {coach.accepting_clients
                        ? t('Accepting trainees')
                        : t('Waitlist full')}
                </span>
            </div>
        </Link>
    );
}
