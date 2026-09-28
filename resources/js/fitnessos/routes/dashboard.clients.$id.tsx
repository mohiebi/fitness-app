import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, ClipboardCheck, User, UserMinus } from 'lucide-react';
import { useState } from 'react';
import { Card } from '@fitnessos/components/ui/card';
import { Badge } from '@fitnessos/components/ui/badge';
import { Button } from '@fitnessos/components/ui/button';
import { Avatar, AvatarFallback } from '@fitnessos/components/ui/avatar';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@fitnessos/components/ui/tabs';
import { EndCoachingDialog } from '@fitnessos/components/end-coaching-dialog';
import { IntakeSummary } from '@fitnessos/components/intake-summary';
import { getJson } from '@fitnessos/lib/api';
import { t } from '@fitnessos/lib/i18n';
import { formatDate, formatNumber, messageTime } from '@fitnessos/lib/format';
import {
    initials,
    type CoachingSummary,
    type TraineeProfileData,
} from '@fitnessos/lib/marketplace';

export const Route = createFileRoute('/dashboard/clients/$id')({
    component: ClientDetail,
});

type Client = {
    id: string;
    name: string;
    email: string;
    joined_at: string | null;
    profile: TraineeProfileData | null;
    coaching: CoachingSummary | null;
};
type Checkin = {
    id: number;
    weight_kg: string | null;
    sleep_hours: string | null;
    energy: number | null;
    reflection: string | null;
    status: string;
    created_at: string;
};
type Message = {
    id: number;
    from: 'coach' | 'client';
    text: string;
    sent_at: string;
};

function ClientDetail() {
    const { id } = Route.useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [ending, setEnding] = useState(false);
    const {
        data: client,
        isLoading,
        error,
    } = useQuery({
        queryKey: ['fitnessos', 'client', id],
        queryFn: () => getJson<Client>(`/fitnessos/clients/${id}`),
    });
    const { data: checkins = [] } = useQuery({
        queryKey: ['fitnessos', 'checkins', id],
        queryFn: () => getJson<Checkin[]>(`/fitnessos/checkins/${id}`),
        enabled: Boolean(client),
    });
    const { data: messages = [] } = useQuery({
        queryKey: ['fitnessos', 'messages', id],
        queryFn: () => getJson<Message[]>(`/fitnessos/messages/${id}`),
        enabled: Boolean(client),
    });

    if (isLoading)
        return (
            <p className="text-muted-foreground p-12 text-sm">
                {t('Loading…')}
            </p>
        );
    if (error || !client)
        return (
            <p role="alert" className="text-destructive p-12 text-sm">
                {t('Trainee not found. They may have ended coaching with you.')}
            </p>
        );

    return (
        <div>
            <div className="mb-6 flex flex-wrap items-center gap-4">
                <Avatar className="h-16 w-16">
                    <AvatarFallback>{initials(client.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                    <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                        {client.name}
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        {client.email}
                    </p>
                </div>
                <div className="ms-auto flex flex-wrap gap-2">
                    <Button asChild variant="outline">
                        <Link
                            to="/dashboard/messages"
                            search={{ client: client.id }}
                        >
                            <MessageSquare />
                            {t('Messages')}
                        </Link>
                    </Button>
                    {client.coaching && (
                        <Button
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => setEnding(true)}
                        >
                            <UserMinus />
                            {t('End coaching')}
                        </Button>
                    )}
                </div>
            </div>

            <Tabs defaultValue="overview">
                <TabsList className="mb-6">
                    <TabsTrigger value="overview">{t('Overview')}</TabsTrigger>
                    <TabsTrigger value="checkins">{t('Check-ins')}</TabsTrigger>
                    <TabsTrigger value="messages">{t('Messages')}</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="flex flex-col gap-4">
                    <div className="grid gap-4 md:grid-cols-3">
                        <Summary
                            icon={User}
                            label={t('Coaching since')}
                            value={
                                client.coaching?.started_at
                                    ? formatDate(client.coaching.started_at)
                                    : '—'
                            }
                        />
                        <Summary
                            icon={ClipboardCheck}
                            label={t('Check-ins')}
                            value={formatNumber(checkins.length)}
                        />
                        <Summary
                            icon={MessageSquare}
                            label={t('Messages')}
                            value={formatNumber(messages.length)}
                        />
                    </div>
                    <Card className="p-5">
                        <h2 className="mb-4 font-semibold">
                            {t('Intake profile')}
                        </h2>
                        <IntakeSummary profile={client.profile} />
                    </Card>
                </TabsContent>
                <TabsContent value="checkins">
                    <Card className="border-border/60 bg-card shadow-card-premium space-y-3 p-6">
                        {checkins.map((entry) => (
                            <div
                                key={entry.id}
                                className="border-border/60 rounded-xl border p-4"
                            >
                                <div className="flex justify-between gap-3">
                                    <span className="font-medium">
                                        {formatDate(entry.created_at)}
                                    </span>
                                    <Badge variant="secondary">
                                        {entry.status === 'Reviewed'
                                            ? t('Reviewed')
                                            : t('Pending')}
                                    </Badge>
                                </div>
                                <p className="text-muted-foreground mt-2 text-sm">
                                    {t(
                                        'Weight :weight kg · Sleep :sleep h · Energy :energy/10',
                                        {
                                            weight: entry.weight_kg ?? '—',
                                            sleep: entry.sleep_hours ?? '—',
                                            energy: entry.energy ?? '—',
                                        },
                                    )}
                                </p>
                                {entry.reflection && (
                                    <p className="mt-2 text-sm whitespace-pre-wrap">
                                        {entry.reflection}
                                    </p>
                                )}
                            </div>
                        ))}
                        {checkins.length === 0 && (
                            <p className="text-muted-foreground text-sm">
                                {t('No check-ins yet.')}
                            </p>
                        )}
                    </Card>
                </TabsContent>
                <TabsContent value="messages">
                    <Card className="border-border/60 bg-card shadow-card-premium space-y-3 p-6">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex ${message.from === 'coach' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-md rounded-xl px-4 py-2 text-sm ${message.from === 'coach' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}
                                >
                                    {message.text}
                                    <div className="mt-1 text-xs opacity-70">
                                        {messageTime(message.sent_at)}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {messages.length === 0 && (
                            <p className="text-muted-foreground text-sm">
                                {t('No messages yet.')}
                            </p>
                        )}
                    </Card>
                </TabsContent>
            </Tabs>

            {client.coaching && (
                <EndCoachingDialog
                    open={ending}
                    onOpenChange={setEnding}
                    coachingId={client.coaching.id}
                    title={t('End coaching with :name?', { name: client.name })}
                    description={t(
                        'They lose access to chat and check-ins with you. Their history stays with them, and they can find a new coach.',
                    )}
                    onEnded={async () => {
                        await queryClient.invalidateQueries({
                            queryKey: ['fitnessos'],
                        });
                        await navigate({ to: '/dashboard/clients' });
                    }}
                />
            )}
        </div>
    );
}

function Summary({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof User;
    label: string;
    value: string;
}) {
    return (
        <Card className="border-border/60 bg-card shadow-card-premium p-5">
            <Icon className="text-primary h-5 w-5" />
            <div className="text-muted-foreground mt-3 text-sm font-medium">
                {label}
            </div>
            <div className="mt-1 text-2xl font-semibold">{value}</div>
        </Card>
    );
}
