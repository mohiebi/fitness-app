import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ClipboardCheck, MessageCircle, LineChart, ArrowRight } from 'lucide-react';
import { PageHeader } from '@fitnessos/components/app-shell';
import { Card } from '@fitnessos/components/ui/card';
import { Button } from '@fitnessos/components/ui/button';
import { getJson } from '@fitnessos/lib/api';
import { currentUser } from '@fitnessos/lib/auth';

export const Route = createFileRoute('/app/')({ component: Today });

type Checkin = { id: number; weight_kg: string | null; status: string; created_at: string };
type Message = { id: number; text: string; from: 'coach' | 'client'; time: string };

function Today() {
    const { data: checkins = [] } = useQuery({ queryKey: ['fitnessos', 'my-checkins'], queryFn: () => getJson<Checkin[]>('/fitnessos/checkins') });
    const { data: messages = [] } = useQuery({ queryKey: ['fitnessos', 'messages'], queryFn: () => getJson<Message[]>('/fitnessos/messages') });
    const latest = checkins[0];
    const lastMessage = messages.at(-1);

    return (
        <div>
            <PageHeader title={`Welcome, ${currentUser() ?? 'athlete'}`} description="Your coaching hub." />
            <div className="grid gap-6 lg:grid-cols-2">
                <Card className="border-primary/30 bg-hero-gradient p-6 shadow-glow">
                    <ClipboardCheck className="h-7 w-7 text-primary" />
                    <h2 className="mt-4 font-display text-2xl font-extrabold uppercase">Weekly check-in</h2>
                    <p className="mt-2 text-sm text-muted-foreground">{latest ? `Last submitted ${new Date(latest.created_at).toLocaleDateString()} · ${latest.status}` : 'You have not submitted a check-in yet.'}</p>
                    <Button asChild className="mt-6 rounded-full bg-brand-gradient text-primary-foreground"><Link to="/app/checkin">Submit check-in <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
                </Card>
                <Card className="border-border/60 bg-card p-6 shadow-card-premium">
                    <MessageCircle className="h-7 w-7 text-primary" />
                    <h2 className="mt-4 font-display text-2xl font-extrabold uppercase">Messages</h2>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{lastMessage ? `${lastMessage.from === 'coach' ? 'Coach' : 'You'}: ${lastMessage.text}` : 'No messages yet. Send your coach a note.'}</p>
                    <Button asChild variant="outline" className="mt-6 rounded-full"><Link to="/app/messages">Open chat <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
                </Card>
                <Card className="border-border/60 bg-card p-6 shadow-card-premium">
                    <LineChart className="h-7 w-7 text-primary" />
                    <h2 className="mt-4 font-display text-2xl font-extrabold uppercase">Progress</h2>
                    <p className="mt-2 text-sm text-muted-foreground">{latest?.weight_kg ? `Latest logged weight: ${latest.weight_kg} kg` : 'Submit a check-in to start tracking your progress.'}</p>
                    <Button asChild variant="outline" className="mt-6 rounded-full"><Link to="/app/progress">View progress <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
                </Card>
            </div>
        </div>
    );
}
