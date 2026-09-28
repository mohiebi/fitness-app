import { t } from '@fitnessos/lib/i18n';
import { formatNumber } from '@fitnessos/lib/format';
import {
    experienceLevels,
    goals,
    labelFrom,
    type TraineeProfileData,
} from '@fitnessos/lib/marketplace';

export function IntakeSummary({
    profile,
}: {
    profile: TraineeProfileData | null;
}) {
    if (!profile) {
        return (
            <p className="text-muted-foreground text-sm">
                {t('This trainee has not filled in their intake profile yet.')}
            </p>
        );
    }

    const age = profile.birth_year
        ? new Date().getFullYear() - profile.birth_year
        : null;
    const rows: [string, string][] = [
        [t('Goal'), labelFrom(goals, profile.goal)],
        [t('Experience'), labelFrom(experienceLevels, profile.experience)],
        [t('Age'), age !== null ? formatNumber(age) : '—'],
        [
            t('Height'),
            profile.height_cm
                ? t(':value cm', { value: formatNumber(profile.height_cm) })
                : '—',
        ],
        [
            t('Weight'),
            profile.weight_kg
                ? t(':value kg', { value: formatNumber(profile.weight_kg) })
                : '—',
        ],
    ];

    return (
        <div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
                {rows.map(([label, value]) => (
                    <div key={label}>
                        <dt className="text-subtle-foreground text-xs">
                            {label}
                        </dt>
                        <dd className="font-medium">{value}</dd>
                    </div>
                ))}
            </dl>
            {profile.limitations && (
                <div className="border-destructive/40 mt-3 rounded-lg border p-3 text-sm">
                    <div className="text-destructive text-xs font-bold">
                        {t('Injuries and limitations')}
                    </div>
                    <p className="mt-1 whitespace-pre-line">
                        {profile.limitations}
                    </p>
                </div>
            )}
        </div>
    );
}
