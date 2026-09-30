import { createFileRoute } from '@tanstack/react-router';
import { PageHeader } from '@fitnessos/components/app-shell';
import { Card } from '@fitnessos/components/ui/card';
import { Badge } from '@fitnessos/components/ui/badge';
import { resources } from '@fitnessos/lib/mock-data';
import { formatNumber } from '@fitnessos/lib/format';

import { t } from '@fitnessos/lib/i18n';
export const Route = createFileRoute('/app/resources')({
    component: Resources,
});

function Resources() {
    return (
        <div>
            <PageHeader
                title={t('Resources')}
                description={t('Guides, videos and tools from your coach.')}
            />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {resources.map((r) => (
                    <Card
                        key={r.id}
                        className="group hover:shadow-glow overflow-hidden transition hover:-translate-y-1"
                    >
                        <div className="aspect-[16/10] overflow-hidden p-2 pb-0">
                            <img
                                src={r.img}
                                className="h-full w-full rounded-md object-cover"
                                alt={t(r.title)}
                            />
                        </div>
                        <div className="p-5">
                            <div className="text-muted-foreground flex gap-2 text-xs">
                                <Badge variant="secondary">{t(r.cat)}</Badge>
                                <span>
                                    {t(':minutes min', {
                                        minutes: formatNumber(parseInt(r.read)),
                                    })}
                                </span>
                            </div>
                            <h3 className="mt-3 font-semibold">{t(r.title)}</h3>
                            <p className="text-muted-foreground mt-2 text-sm">
                                {t(r.excerpt)}
                            </p>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
