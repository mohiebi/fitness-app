import { createFileRoute } from '@tanstack/react-router';
import { PageHeader } from '@fitnessos/components/app-shell';
import { Card } from '@fitnessos/components/ui/card';
import { Button } from '@fitnessos/components/ui/button';
import { Badge } from '@fitnessos/components/ui/badge';
import { Instagram, Youtube, Twitter, Sparkles } from 'lucide-react';
import { localizeNumbers } from '@fitnessos/lib/format';
import { sep, t } from '@fitnessos/lib/i18n';

export const Route = createFileRoute('/dashboard/content')({
    component: ContentStudio,
});

const posts = [
    {
        platform: 'Instagram',
        type: 'Reel',
        title: '3 mistakes killing your fat loss',
        status: 'Scheduled',
        date: 'Nov 12, 9:00',
        img: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400',
    },
    {
        platform: 'Instagram',
        type: 'Carousel',
        title: 'The truth about protein timing',
        status: 'Draft',
        date: '—',
        img: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400',
    },
    {
        platform: 'YouTube',
        type: 'Long-form',
        title: 'How I lost 14kg with clients',
        status: 'Published',
        date: 'Nov 8',
        img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400',
    },
    {
        platform: 'Twitter',
        type: 'Thread',
        title: '10 lessons from 500 clients',
        status: 'Scheduled',
        date: 'Nov 10, 12:00',
        img: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400',
    },
];

const icons: Record<string, any> = { Instagram, YouTube: Youtube, Twitter };

function ContentStudio() {
    return (
        <div>
            <PageHeader
                title={t('Content studio')}
                description={t(
                    'Plan, generate and schedule your content across platforms.',
                )}
                actions={
                    <>
                        <Button variant="outline">
                            <Sparkles className="me-2 h-4 w-4" />
                            {t('Generate with AI')}
                        </Button>
                        <Button>{t('New post')}</Button>
                    </>
                }
            />

            <div className="mb-6 grid gap-4 md:grid-cols-4">
                {[
                    { l: t('Scheduled'), v: localizeNumbers('12') },
                    { l: t('Drafts'), v: localizeNumbers('5') },
                    { l: t('Published (30d)'), v: localizeNumbers('24') },
                    {
                        l: t('Reach (30d)'),
                        v: t(':count thousand', {
                            count: localizeNumbers('182'),
                        }),
                    },
                ].map((s) => (
                    <Card
                        key={s.l}
                        className="border-border/60 bg-card shadow-card-premium p-5"
                    >
                        <div className="text-muted-foreground text-sm font-medium">
                            {s.l}
                        </div>
                        <div className="mt-2 text-2xl font-semibold">{s.v}</div>
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {posts.map((p) => {
                    const Icon = icons[p.platform];
                    return (
                        <Card
                            key={p.title}
                            className="border-border/60 bg-card shadow-card-premium overflow-hidden transition"
                        >
                            <div className="aspect-square overflow-hidden">
                                <img
                                    src={p.img}
                                    className="h-full w-full object-cover"
                                    alt={t(p.title)}
                                />
                            </div>
                            <div className="p-4">
                                <div className="text-muted-foreground flex items-center gap-2 text-xs">
                                    <Icon className="h-3.5 w-3.5" />
                                    <span>
                                        {t(p.platform)}
                                        {sep()}
                                        {t(p.type)}
                                    </span>
                                </div>
                                <h4 className="mt-2 line-clamp-2 text-sm font-medium">
                                    {t(p.title)}
                                </h4>
                                <div className="mt-3 flex items-center justify-between">
                                    <Badge
                                        className={
                                            p.status === 'Published'
                                                ? 'bg-primary/15 text-primary'
                                                : p.status === 'Scheduled'
                                                  ? 'bg-chart-2/15 text-chart-2'
                                                  : 'bg-muted text-muted-foreground'
                                        }
                                    >
                                        {t(p.status)}
                                    </Badge>
                                    <span className="text-muted-foreground text-xs">
                                        {localizeNumbers(t(p.date))}
                                    </span>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>

            <Card className="border-primary/30 bg-hero-gradient shadow-glow mt-6 p-8">
                <div className="flex items-center gap-3">
                    <Sparkles className="text-primary h-5 w-5" />
                    <h3 className="font-semibold">
                        {t('AI content generator')}
                    </h3>
                </div>
                <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
                    {t(
                        'Generate a full week of on-brand posts in seconds. Pulls from your client wins, blog articles and program library.',
                    )}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                    {[
                        'Reels script',
                        'Instagram carousel',
                        'Twitter thread',
                        'Email newsletter',
                        'Client win post',
                    ].map((idea) => (
                        <Badge
                            key={idea}
                            variant="outline"
                            className="border-primary/30 bg-primary/10 cursor-pointer"
                        >
                            {t(idea)}
                        </Badge>
                    ))}
                </div>
            </Card>
        </div>
    );
}
