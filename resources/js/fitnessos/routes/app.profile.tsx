import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { PageHeader } from '@fitnessos/components/app-shell';
import { Card } from '@fitnessos/components/ui/card';
import { Button } from '@fitnessos/components/ui/button';
import { Checkbox } from '@fitnessos/components/ui/checkbox';
import { Input } from '@fitnessos/components/ui/input';
import { Label } from '@fitnessos/components/ui/label';
import { Textarea } from '@fitnessos/components/ui/textarea';
import { Avatar, AvatarFallback } from '@fitnessos/components/ui/avatar';
import { getJson, putJson } from '@fitnessos/lib/api';
import { currentEmail, currentUser } from '@fitnessos/lib/auth';
import { locale, t } from '@fitnessos/lib/i18n';
import {
    experienceLevels,
    goals,
    initials,
    type TraineeProfileData,
} from '@fitnessos/lib/marketplace';
import { cn } from '@fitnessos/lib/utils';

export const Route = createFileRoute('/app/profile')({ component: Profile });

type Form = {
    birth_year: string;
    height_cm: string;
    weight_kg: string;
    goal: string;
    experience: string;
    limitations: string;
    health_consent: boolean;
};

const toForm = (profile: TraineeProfileData): Form => ({
    birth_year: birthYearForInput(profile.birth_year),
    height_cm: profile.height_cm?.toString() ?? '',
    weight_kg: profile.weight_kg?.toString() ?? '',
    goal: profile.goal ?? '',
    experience: profile.experience ?? '',
    limitations: profile.limitations ?? '',
    health_consent: profile.health_consent,
});

const numberOrNull = (value: string) =>
    value.trim() === '' ? null : Number(value);

// Persian users enter a Jalali (solar hijri) birth year; the API stores the
// Gregorian year. The 621-year offset is accurate to within one year, which
// is all an age estimate needs.
const JALALI_OFFSET = 621;
const usesJalali = () => locale() === 'fa';
const birthYearForInput = (year: number | null) =>
    year === null ? '' : String(usesJalali() ? year - JALALI_OFFSET : year);
const birthYearForApi = (value: string) => {
    const year = numberOrNull(value);
    return year === null ? null : usesJalali() ? year + JALALI_OFFSET : year;
};

function Profile() {
    const name = currentUser() ?? t('Trainee');
    const queryClient = useQueryClient();
    const { data: profile } = useQuery({
        queryKey: ['fitnessos', 'trainee-profile'],
        queryFn: () =>
            getJson<TraineeProfileData>('/fitnessos/trainee-profile'),
    });
    const [form, setForm] = useState<Form | null>(null);
    const [busy, setBusy] = useState(false);
    const [notice, setNotice] = useState<{
        text: string;
        error: boolean;
    } | null>(null);

    useEffect(() => {
        if (profile && !form) setForm(toForm(profile));
    }, [profile, form]);

    const set = <K extends keyof Form>(key: K, value: Form[K]) =>
        setForm((current) => current && { ...current, [key]: value });

    const save = async (event: FormEvent) => {
        event.preventDefault();
        if (!form) return;
        setBusy(true);
        setNotice(null);
        try {
            const result = (await putJson('/fitnessos/trainee-profile', {
                birth_year: birthYearForApi(form.birth_year),
                height_cm: numberOrNull(form.height_cm),
                weight_kg: numberOrNull(form.weight_kg),
                goal: form.goal || null,
                experience: form.experience || null,
                limitations: form.limitations.trim() || null,
                health_consent: form.health_consent,
            })) as { message: string; profile: TraineeProfileData };
            queryClient.setQueryData(
                ['fitnessos', 'trainee-profile'],
                result.profile,
            );
            setNotice({ text: result.message, error: false });
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
        <div className="flex max-w-3xl flex-col gap-5">
            <PageHeader
                title={t('Profile')}
                description={t(
                    'Your coach uses this to build a safe plan for you. It moves with you if you change coaches.',
                )}
            />

            <Card className="flex flex-wrap items-center gap-4 p-5">
                <Avatar className="h-14 w-14">
                    <AvatarFallback>{initials(name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold">{name}</h2>
                    <p className="text-muted-foreground text-sm">
                        {currentEmail()}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline" size="sm">
                        <a href="/settings/profile">{t('Account')}</a>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                        <a href="/settings/security">{t('Security')}</a>
                    </Button>
                </div>
            </Card>

            {!form ? (
                <p className="text-muted-foreground text-sm">{t('Loading…')}</p>
            ) : (
                <form onSubmit={save}>
                    <Card className="flex flex-col gap-5 p-5 md:p-6">
                        <h2 className="text-lg font-semibold">
                            {t('Intake profile')}
                        </h2>

                        <Choice
                            label={t('Main goal')}
                            options={goals}
                            value={form.goal}
                            onChange={(value) => set('goal', value)}
                        />
                        <Choice
                            label={t('Training experience')}
                            options={experienceLevels}
                            value={form.experience}
                            onChange={(value) => set('experience', value)}
                        />

                        <div className="grid gap-4 sm:grid-cols-3">
                            <Field id="birth-year" label={t('Birth year')}>
                                <Input
                                    id="birth-year"
                                    type="number"
                                    inputMode="numeric"
                                    placeholder={usesJalali() ? '1374' : '1995'}
                                    value={form.birth_year}
                                    onChange={(e) =>
                                        set('birth_year', e.target.value)
                                    }
                                />
                            </Field>
                            <Field id="height" label={t('Height (cm)')}>
                                <Input
                                    id="height"
                                    type="number"
                                    inputMode="numeric"
                                    min={100}
                                    max={250}
                                    value={form.height_cm}
                                    onChange={(e) =>
                                        set('height_cm', e.target.value)
                                    }
                                />
                            </Field>
                            <Field id="weight" label={t('Weight (kg)')}>
                                <Input
                                    id="weight"
                                    type="number"
                                    inputMode="decimal"
                                    step="0.1"
                                    min={20}
                                    max={500}
                                    value={form.weight_kg}
                                    onChange={(e) =>
                                        set('weight_kg', e.target.value)
                                    }
                                />
                            </Field>
                        </div>

                        <Field
                            id="limitations"
                            label={t('Injuries, pain or medical conditions')}
                        >
                            <Textarea
                                id="limitations"
                                rows={4}
                                value={form.limitations}
                                onChange={(e) =>
                                    set('limitations', e.target.value)
                                }
                                placeholder={t(
                                    'e.g. lower back pain when deadlifting, knee surgery in 2023',
                                )}
                            />
                        </Field>

                        <div className="border-border flex items-start gap-3 rounded-lg border p-4">
                            <Checkbox
                                id="consent"
                                checked={form.health_consent}
                                onCheckedChange={(value) =>
                                    set('health_consent', value === true)
                                }
                                className="mt-0.5"
                            />
                            <Label
                                htmlFor="consent"
                                className="cursor-pointer text-sm leading-relaxed font-normal"
                            >
                                {t(
                                    'I confirm this information is accurate, I will tell my coach about any health changes, and I have checked with a doctor if I have a medical condition.',
                                )}
                            </Label>
                        </div>

                        {notice && (
                            <p
                                role={notice.error ? 'alert' : 'status'}
                                className={cn(
                                    'text-sm',
                                    notice.error
                                        ? 'text-destructive'
                                        : 'text-volt',
                                )}
                            >
                                {notice.text}
                            </p>
                        )}
                        <Button
                            type="submit"
                            disabled={busy}
                            className="self-start"
                        >
                            {busy ? t('Saving…') : t('Save')}
                        </Button>
                    </Card>
                </form>
            )}
        </div>
    );
}

function Field({
    id,
    label,
    children,
}: {
    id: string;
    label: string;
    children: ReactNode;
}) {
    return (
        <div className="grid gap-1.5">
            <Label htmlFor={id}>{label}</Label>
            {children}
        </div>
    );
}

function Choice({
    label,
    options,
    value,
    onChange,
}: {
    label: string;
    options: Record<string, string>;
    value: string;
    onChange: (value: string) => void;
}) {
    return (
        <div className="grid gap-2">
            <span className="text-sm font-medium">{label}</span>
            <div
                className="flex flex-wrap gap-2"
                role="radiogroup"
                aria-label={label}
            >
                {Object.entries(options).map(([key, option]) => (
                    <button
                        key={key}
                        type="button"
                        role="radio"
                        aria-checked={value === key}
                        onClick={() => onChange(key)}
                        className={cn(
                            'rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors',
                            value === key
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border text-muted-foreground hover:text-foreground',
                        )}
                    >
                        {t(option)}
                    </button>
                ))}
            </div>
        </div>
    );
}
