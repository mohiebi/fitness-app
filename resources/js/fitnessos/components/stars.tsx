import { Star } from 'lucide-react';
import { formatNumber } from '@fitnessos/lib/format';
import { t } from '@fitnessos/lib/i18n';
import { cn } from '@fitnessos/lib/utils';

export type RatingSummary = { average: number | null; count: number };

/** Read-only stars, e.g. ★★★★☆ */
export function Stars({
    value,
    className,
}: {
    value: number;
    className?: string;
}) {
    return (
        <span
            className={cn('inline-flex items-center gap-0.5', className)}
            aria-label={t(':value out of 5 stars', {
                value: formatNumber(value),
            })}
        >
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={cn(
                        'h-4 w-4',
                        star <= Math.round(value)
                            ? 'fill-sun text-sun'
                            : 'text-input',
                    )}
                />
            ))}
        </span>
    );
}

/** "★ 4.5 (12 reviews)", or nothing when there are no reviews yet. */
export function RatingBadge({
    rating,
    className,
}: {
    rating: RatingSummary | undefined;
    className?: string;
}) {
    if (!rating || rating.count === 0 || rating.average === null) return null;

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 text-xs font-semibold',
                className,
            )}
        >
            <Star className="fill-sun text-sun h-3.5 w-3.5" />
            {formatNumber(rating.average)}
            <span className="text-muted-foreground font-normal">
                ({t(':count reviews', { count: formatNumber(rating.count) })})
            </span>
        </span>
    );
}

/** Clickable 1-5 star picker. */
export function StarPicker({
    value,
    onChange,
}: {
    value: number;
    onChange: (value: number) => void;
}) {
    return (
        <div className="flex gap-1" role="radiogroup" aria-label={t('Rating')}>
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    role="radio"
                    aria-checked={value === star}
                    aria-label={t(':value out of 5 stars', {
                        value: formatNumber(star),
                    })}
                    onClick={() => onChange(star)}
                    className="rounded p-0.5"
                >
                    <Star
                        className={cn(
                            'h-7 w-7 transition-colors',
                            star <= value
                                ? 'fill-sun text-sun'
                                : 'text-input hover:text-sun',
                        )}
                    />
                </button>
            ))}
        </div>
    );
}
