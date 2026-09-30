import { createFileRoute } from '@tanstack/react-router';
import { PublicNav, Footer } from '@fitnessos/components/public-nav';
import { Card } from '@fitnessos/components/ui/card';
import { Badge } from '@fitnessos/components/ui/badge';
import { resources, tools } from '@fitnessos/lib/mock-data';
import { Flame, Dumbbell, PieChart, Activity, ArrowRight } from 'lucide-react';
import { formatNumber } from '@fitnessos/lib/format';
import { sep, t } from '@fitnessos/lib/i18n';

export const Route = createFileRoute('/resources')({
    head: () => ({
        meta: [
            { title: t('Resources — FitnessOS') },
            {
                name: 'description',
                content: t(
                    'Free fitness guides, calculators and coaching tools.',
                ),
            },
        ],
    }),
    component: Resources,
});

const icons: Record<string, any> = {
    flame: Flame,
    dumbbell: Dumbbell,
    'pie-chart': PieChart,
    activity: Activity,
};

function Resources() {
    return (
        <div className="bg-background min-h-screen">
            <PublicNav />
            <section className="bg-hero-gradient relative overflow-hidden">
                <div className="mx-auto max-w-4xl px-6 py-24 text-center">
                    <div className="text-primary text-xs font-extrabold tracking-widest uppercase">
                        {t('Resources')}
                    </div>
                    <h1 className="mt-3 text-5xl font-semibold tracking-tight md:text-6xl">
                        {t('Free guides &')}{' '}
                        <span className="text-gradient">{t('tools.')}</span>
                    </h1>
                    <p className="text-muted-foreground mx-auto mt-6 max-w-xl text-lg">
                        {t(
                            'Everything we teach our clients — free for you to read, apply and share.',
                        )}
                    </p>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-6 py-16">
                <h2 className="text-2xl font-semibold">{t('Fitness tools')}</h2>
                <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {tools.map((tool) => {
                        const Icon = icons[tool.icon];
                        return (
                            <Card
                                key={tool.title}
                                className="group border-border/60 bg-card shadow-card-premium hover:border-primary/40 hover:shadow-glow cursor-pointer p-6 transition-all hover:-translate-y-1"
                            >
                                <div className="bg-primary/10 text-primary grid h-10 w-10 place-items-center rounded-xl">
                                    <Icon className="h-5 w-5" />
                                </div>
                                <h3 className="mt-4 font-semibold">
                                    {t(tool.title)}
                                </h3>
                                <p className="text-muted-foreground mt-2 text-sm">
                                    {t(tool.desc)}
                                </p>
                                <div className="text-primary mt-4 flex items-center gap-1 text-sm opacity-0 transition group-hover:opacity-100">
                                    {t('Open')}{' '}
                                    <ArrowRight className="h-3 w-3 rtl:rotate-180" />
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-6 py-16">
                <h2 className="text-2xl font-semibold">
                    {t('Latest articles')}
                </h2>
                <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {resources.map((r) => (
                        <Card
                            key={r.id}
                            className="group border-border/60 bg-card shadow-card-premium hover:shadow-glow overflow-hidden transition-all hover:-translate-y-1"
                        >
                            <div className="aspect-[16/10] overflow-hidden">
                                <img
                                    src={r.img}
                                    className="h-full w-full object-cover"
                                    alt={t(r.title)}
                                />
                            </div>
                            <div className="p-5">
                                <div className="text-muted-foreground flex items-center gap-2 text-xs">
                                    <Badge variant="secondary">
                                        {t(r.cat)}
                                    </Badge>
                                    <span>{sep().trim()}</span>
                                    <span>
                                        {t(':minutes min', {
                                            minutes: formatNumber(
                                                parseInt(r.read),
                                            ),
                                        })}
                                    </span>
                                </div>
                                <h3 className="mt-3 leading-snug font-semibold">
                                    {t(r.title)}
                                </h3>
                                <p className="text-muted-foreground mt-2 text-sm">
                                    {t(r.excerpt)}
                                </p>
                            </div>
                        </Card>
                    ))}
                </div>
            </section>
            <Footer />
        </div>
    );
}
