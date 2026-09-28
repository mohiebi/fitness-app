import { createFileRoute } from '@tanstack/react-router';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useDeferredValue, useState } from 'react';
import { PublicNav, Footer } from '@fitnessos/components/public-nav';
import { CoachCard } from '@fitnessos/components/coach-card';
import { Input } from '@fitnessos/components/ui/input';
import { Switch } from '@fitnessos/components/ui/switch';
import { Label } from '@fitnessos/components/ui/label';
import { getJson } from '@fitnessos/lib/api';
import { t } from '@fitnessos/lib/i18n';
import { formatNumber } from '@fitnessos/lib/format';
import { specialties, type CoachSummary } from '@fitnessos/lib/marketplace';
import { cn } from '@fitnessos/lib/utils';

export const Route = createFileRoute('/coaches/')({
    head: () => ({
        meta: [
            { title: t('Find a coach — FitnessOS') },
            {
                name: 'description',
                content: t(
                    'Browse verified coaches by specialty and city, then request coaching in one step.',
                ),
            },
        ],
    }),
    component: Coaches,
});

type Directory = { data: CoachSummary[]; meta: { total: number } };

function Coaches() {
    const [q, setQ] = useState('');
    const [city, setCity] = useState('');
    const [specialty, setSpecialty] = useState<string | null>(null);
    const [online, setOnline] = useState(false);
    const filters = useDeferredValue({ q, city, specialty, online });

    const params = new URLSearchParams();
    if (filters.q.trim()) params.set('q', filters.q.trim());
    if (filters.city.trim()) params.set('city', filters.city.trim());
    if (filters.specialty) params.set('specialty', filters.specialty);
    if (filters.online) params.set('online', '1');

    const { data, isLoading, error } = useQuery({
        queryKey: ['fitnessos', 'coaches', params.toString()],
        queryFn: () => getJson<Directory>(`/fitnessos/coaches?${params}`),
        placeholderData: keepPreviousData,
    });
    const coaches = data?.data ?? [];

    return (
        <div className="bg-background min-h-screen">
            <PublicNav />
            <section className="mx-auto max-w-7xl px-4 pt-14 pb-24 md:px-6">
                <div className="max-w-2xl">
                    <div className="text-volt text-xs font-extrabold tracking-widest uppercase">
                        {t('Coaches')}
                    </div>
                    <h1 className="font-display mt-3 text-4xl font-extrabold md:text-5xl">
                        {t('Find the coach that fits you')}
                    </h1>
                    <p className="text-muted-foreground mt-4 text-lg">
                        {t(
                            'Every coach has a public profile. Pick one, send a request, and start once they accept. You can switch coaches any time.',
                        )}
                    </p>
                </div>

                <div className="mt-10 grid gap-3 md:grid-cols-[1fr_220px_auto]">
                    <div className="relative">
                        <Search className="text-subtle-foreground pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                        <Input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder={t('Search by name or keyword')}
                            aria-label={t('Search coaches')}
                            className="h-11 ps-9"
                        />
                    </div>
                    <Input
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder={t('City')}
                        aria-label={t('City')}
                        className="h-11"
                    />
                    <div className="border-input flex h-11 items-center gap-2 rounded-md border px-3">
                        <Switch
                            id="online-only"
                            checked={online}
                            onCheckedChange={setOnline}
                        />
                        <Label
                            htmlFor="online-only"
                            className="cursor-pointer text-sm"
                        >
                            {t('Online only')}
                        </Label>
                    </div>
                </div>

                <div
                    className="mt-4 flex flex-wrap items-center gap-2"
                    role="group"
                    aria-label={t('Specialty')}
                >
                    <SlidersHorizontal className="text-subtle-foreground h-4 w-4" />
                    {Object.entries(specialties).map(([key, label]) => (
                        <button
                            key={key}
                            type="button"
                            aria-pressed={specialty === key}
                            onClick={() =>
                                setSpecialty(specialty === key ? null : key)
                            }
                            className={cn(
                                'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                                specialty === key
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'border-border text-muted-foreground hover:text-foreground',
                            )}
                        >
                            {t(label)}
                        </button>
                    ))}
                </div>

                <p
                    className="text-muted-foreground mt-8 text-sm"
                    aria-live="polite"
                >
                    {isLoading
                        ? t('Loading coaches…')
                        : t(':count coaches found', {
                              count: formatNumber(data?.meta.total ?? 0),
                          })}
                </p>
                {error && (
                    <p role="alert" className="text-destructive mt-2 text-sm">
                        {error instanceof Error
                            ? error.message
                            : t('The request failed.')}
                    </p>
                )}

                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {coaches.map((coach) => (
                        <CoachCard key={coach.slug} coach={coach} />
                    ))}
                </div>

                {!isLoading && coaches.length === 0 && (
                    <div className="border-border text-muted-foreground mt-4 rounded-2xl border border-dashed p-10 text-center">
                        {t(
                            'No coaches match these filters yet. Try removing a filter.',
                        )}
                    </div>
                )}
            </section>
            <Footer />
        </div>
    );
}
