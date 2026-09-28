import { createFileRoute } from '@tanstack/react-router';
import { PageHeader } from '@fitnessos/components/app-shell';
import { Card } from '@fitnessos/components/ui/card';
import { Badge } from '@fitnessos/components/ui/badge';
import { Button } from '@fitnessos/components/ui/button';
import { Video, Phone } from 'lucide-react';

export const Route = createFileRoute('/dashboard/calendar')({
    component: CalendarPage,
});

const events = [
    { day: 8, title: 'Discovery — Jordan M.', time: '9:00', type: 'call' },
    { day: 8, title: 'Check-in — Sarah C.', time: '14:00', type: 'video' },
    { day: 10, title: 'Group workshop', time: '10:00', type: 'video' },
    { day: 12, title: '1:1 — Marcus J.', time: '16:00', type: 'video' },
    {
        day: 15,
        title: 'Program review — Emma W.',
        time: '11:00',
        type: 'video',
    },
];

function CalendarPage() {
    const today = 8;
    const days = Array.from({ length: 35 }, (_, i) => i - 1);
    return (
        <div>
            <PageHeader
                title="Calendar"
                description="November 2026"
                actions={<Button>New event</Button>}
            />

            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                <Card className="border-border/60 bg-card shadow-card-premium p-6">
                    <div className="text-muted-foreground mb-3 grid grid-cols-7 text-center text-sm font-medium">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(
                            (d) => (
                                <div key={d}>{d}</div>
                            ),
                        )}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {days.map((d) => {
                            const dayEvents = events.filter((e) => e.day === d);
                            return (
                                <div
                                    key={d}
                                    className={`min-h-[92px] rounded-lg border p-2 text-xs ${d === today ? 'border-primary bg-primary/5' : 'border-border/60'} ${d < 1 || d > 30 ? 'opacity-40' : ''}`}
                                >
                                    <div
                                        className={
                                            d === today
                                                ? 'text-primary font-semibold'
                                                : 'text-muted-foreground'
                                        }
                                    >
                                        {d > 0 && d <= 30 ? d : ''}
                                    </div>
                                    <div className="mt-1 space-y-1">
                                        {dayEvents.map((e) => (
                                            <div
                                                key={e.title}
                                                className="bg-primary/15 text-primary truncate rounded px-1.5 py-0.5 text-[10px]"
                                            >
                                                {e.time} {e.title}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>

                <Card className="border-border/60 bg-card shadow-card-premium h-fit p-6">
                    <h3 className="font-semibold">Upcoming</h3>
                    <div className="mt-4 space-y-3">
                        {events.map((e) => (
                            <div
                                key={e.title}
                                className="border-border/60 flex items-center gap-3 rounded-xl border p-3"
                            >
                                <div className="bg-primary/10 text-primary grid h-10 w-10 place-items-center rounded-lg">
                                    {e.type === 'video' ? (
                                        <Video className="h-4 w-4" />
                                    ) : (
                                        <Phone className="h-4 w-4" />
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="truncate text-sm font-medium">
                                        {e.title}
                                    </div>
                                    <div className="text-muted-foreground text-xs">
                                        Nov {e.day} · {e.time}
                                    </div>
                                </div>
                                <Badge variant="secondary">{e.type}</Badge>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}
