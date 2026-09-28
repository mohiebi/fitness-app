import { createFileRoute } from '@tanstack/react-router';
import { PublicNav, Footer } from '@fitnessos/components/public-nav';
import { Card } from '@fitnessos/components/ui/card';
import { Badge } from '@fitnessos/components/ui/badge';
import { resources, tools } from '@fitnessos/lib/mock-data';
import { Flame, Dumbbell, PieChart, Activity, ArrowRight } from 'lucide-react';

export const Route = createFileRoute('/resources')({
    head: () => ({
        meta: [
            { title: 'Resources — FitnessOS' },
            {
                name: 'description',
                content: 'Free fitness guides, calculators and coaching tools.',
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
                        Resources
                    </div>
                    <h1 className="mt-3 text-5xl font-semibold tracking-tight md:text-6xl">
                        Free guides &{' '}
                        <span className="text-gradient">tools.</span>
                    </h1>
                    <p className="text-muted-foreground mx-auto mt-6 max-w-xl text-lg">
                        Everything we teach our clients — free for you to read,
                        apply and share.
                    </p>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-6 py-16">
                <h2 className="text-2xl font-semibold">Fitness tools</h2>
                <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {tools.map((t) => {
                        const Icon = icons[t.icon];
                        return (
                            <Card
                                key={t.title}
                                className="group border-border/60 bg-card shadow-card-premium hover:border-primary/40 hover:shadow-glow cursor-pointer p-6 transition-all hover:-translate-y-1"
                            >
                                <div className="bg-primary/10 text-primary grid h-10 w-10 place-items-center rounded-xl">
                                    <Icon className="h-5 w-5" />
                                </div>
                                <h3 className="mt-4 font-semibold">
                                    {t.title}
                                </h3>
                                <p className="text-muted-foreground mt-2 text-sm">
                                    {t.desc}
                                </p>
                                <div className="text-primary mt-4 flex items-center gap-1 text-sm opacity-0 transition group-hover:opacity-100">
                                    Open <ArrowRight className="h-3 w-3" />
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-6 py-16">
                <h2 className="text-2xl font-semibold">Latest articles</h2>
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
                                    alt={r.title}
                                />
                            </div>
                            <div className="p-5">
                                <div className="text-muted-foreground flex items-center gap-2 text-xs">
                                    <Badge variant="secondary">{r.cat}</Badge>
                                    <span>·</span>
                                    <span>{r.read}</span>
                                </div>
                                <h3 className="mt-3 leading-snug font-semibold">
                                    {r.title}
                                </h3>
                                <p className="text-muted-foreground mt-2 text-sm">
                                    {r.excerpt}
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
