import { createFileRoute } from '@tanstack/react-router';
import { PageHeader } from '@fitnessos/components/app-shell';
import { Card } from '@fitnessos/components/ui/card';
import { Button } from '@fitnessos/components/ui/button';
import { Input } from '@fitnessos/components/ui/input';
import { Label } from '@fitnessos/components/ui/label';
import { Textarea } from '@fitnessos/components/ui/textarea';
import { Slider } from '@fitnessos/components/ui/slider';
import { Camera } from 'lucide-react';
import { useState } from 'react';
import { postJson } from '@fitnessos/lib/api';
import { sep, t } from '@fitnessos/lib/i18n';
import { formatNumber } from '@fitnessos/lib/format';
import { NoCoachCard, useMyCoaching } from '@fitnessos/components/no-coach';

export const Route = createFileRoute('/app/checkin')({ component: Checkin });

function Checkin() {
    const { data: coaching, isLoading: loadingCoach } = useMyCoaching();
    const [form, setForm] = useState(() => {
        const empty = {
            weight_kg: '',
            waist_cm: '',
            sleep_hours: '',
            steps: '',
            energy: 5,
            hunger: 5,
            reflection: '',
            adjustments: '',
        };
        try {
            return {
                ...empty,
                ...JSON.parse(
                    localStorage.getItem('fitnessos-checkin-draft') ?? '{}',
                ),
            } as typeof empty;
        } catch {
            return empty;
        }
    });
    const [busy, setBusy] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const submit = async () => {
        setBusy(true);
        setResult(null);
        try {
            await postJson('/fitnessos/checkins', {
                ...form,
                weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
                waist_cm: form.waist_cm ? Number(form.waist_cm) : null,
                sleep_hours: form.sleep_hours ? Number(form.sleep_hours) : null,
                steps: form.steps ? Number(form.steps) : null,
            });
            setResult(t('Check-in submitted to your coach.'));
            setForm({
                weight_kg: '',
                waist_cm: '',
                sleep_hours: '',
                steps: '',
                energy: 5,
                hunger: 5,
                reflection: '',
                adjustments: '',
            });
            localStorage.removeItem('fitnessos-checkin-draft');
        } catch (cause) {
            setResult(
                cause instanceof Error
                    ? cause.message
                    : t('The request failed.'),
            );
        } finally {
            setBusy(false);
        }
    };
    if (!loadingCoach && !coaching?.active) {
        return (
            <div>
                <PageHeader title={t('Weekly check-in')} />
                <NoCoachCard pendingCoachName={coaching?.pending?.coach.name} />
            </div>
        );
    }

    return (
        <div>
            <PageHeader
                title={t('Weekly check-in')}
                description={t(
                    'Takes about 5 minutes. Your coach reviews it and replies in chat.',
                )}
            />

            <div className="grid gap-6 lg:grid-cols-2">
                <Card className="border-border/60 bg-card shadow-card-premium p-6">
                    <h3 className="mb-4 font-semibold">{t('Metrics')}</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <Label className="mb-2 block">
                                {t('Weight (kg)')}
                            </Label>
                            <Input
                                type="number"
                                step="0.1"
                                value={form.weight_kg}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        weight_kg: e.target.value,
                                    })
                                }
                            />
                        </div>
                        <div>
                            <Label className="mb-2 block">
                                {t('Waist (cm)')}
                            </Label>
                            <Input
                                type="number"
                                step="0.1"
                                value={form.waist_cm}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        waist_cm: e.target.value,
                                    })
                                }
                            />
                        </div>
                        <div>
                            <Label className="mb-2 block">
                                {t('Average sleep (h)')}
                            </Label>
                            <Input
                                type="number"
                                step="0.1"
                                value={form.sleep_hours}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        sleep_hours: e.target.value,
                                    })
                                }
                            />
                        </div>
                        <div>
                            <Label className="mb-2 block">
                                {t('Average daily steps')}
                            </Label>
                            <Input
                                type="number"
                                value={form.steps}
                                onChange={(e) =>
                                    setForm({ ...form, steps: e.target.value })
                                }
                            />
                        </div>
                    </div>
                    <div className="mt-6">
                        <Label className="mb-2 block">
                            {t('Energy')}
                            {sep()}
                            {formatNumber(form.energy)}/{formatNumber(10)}
                        </Label>
                        <Slider
                            value={[form.energy]}
                            onValueChange={(v) =>
                                setForm({ ...form, energy: v[0] })
                            }
                            min={1}
                            max={10}
                            step={1}
                        />
                    </div>
                    <div className="mt-6">
                        <Label className="mb-2 block">
                            {t('Hunger')}
                            {sep()}
                            {formatNumber(form.hunger)}/{formatNumber(10)}
                        </Label>
                        <Slider
                            value={[form.hunger]}
                            onValueChange={(v) =>
                                setForm({ ...form, hunger: v[0] })
                            }
                            min={1}
                            max={10}
                            step={1}
                        />
                    </div>
                </Card>

                <Card className="border-border/60 bg-card shadow-card-premium p-6">
                    <h3 className="mb-4 font-semibold">{t('Photos')}</h3>
                    <p className="text-muted-foreground mb-4 text-sm">
                        {t('Photo uploads are not available yet.')}
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="border-border/60 text-muted-foreground grid aspect-[3/4] place-items-center rounded-xl border-2 border-dashed"
                            >
                                <div className="text-center">
                                    <Camera className="mx-auto h-6 w-6" />
                                    <div className="mt-2 text-xs">
                                        {t('Upload')}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card className="border-border/60 bg-card shadow-card-premium p-6 lg:col-span-2">
                    <h3 className="mb-4 font-semibold">{t('Reflection')}</h3>
                    <Label className="mb-2 block">
                        {t('How did this week go?')}
                    </Label>
                    <Textarea
                        rows={4}
                        placeholder={t(
                            'Wins, struggles, anything on your mind…',
                        )}
                        value={form.reflection}
                        onChange={(e) =>
                            setForm({ ...form, reflection: e.target.value })
                        }
                    />
                    <Label className="mt-4 mb-2 block">
                        {t('Anything your coach should adjust?')}
                    </Label>
                    <Textarea
                        rows={3}
                        placeholder={t(
                            'Optional — energy, workouts, meals, life…',
                        )}
                        value={form.adjustments}
                        onChange={(e) =>
                            setForm({ ...form, adjustments: e.target.value })
                        }
                    />
                    {result && (
                        <p role="status" className="text-primary mt-4 text-sm">
                            {result}
                        </p>
                    )}
                    <div className="mt-4 flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                localStorage.setItem(
                                    'fitnessos-checkin-draft',
                                    JSON.stringify(form),
                                );
                                setResult(t('Draft saved on this device.'));
                            }}
                        >
                            {t('Save draft')}
                        </Button>
                        <Button
                            disabled={busy}
                            className="ms-auto"
                            onClick={submit}
                        >
                            {busy ? t('Submitting…') : t('Submit check-in')}
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
}
