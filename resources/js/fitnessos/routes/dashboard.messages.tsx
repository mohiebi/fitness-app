import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Send, Search } from 'lucide-react';
import { Card } from '@fitnessos/components/ui/card';
import { Button } from '@fitnessos/components/ui/button';
import { Input } from '@fitnessos/components/ui/input';
import { Avatar, AvatarFallback } from '@fitnessos/components/ui/avatar';
import { getJson, postJson } from '@fitnessos/lib/api';
import { formatRelative, messageTime } from '@fitnessos/lib/format';
import { t } from '@fitnessos/lib/i18n';
import { initials } from '@fitnessos/lib/marketplace';

export const Route = createFileRoute('/dashboard/messages')({
    component: Messages,
    validateSearch: (search: Record<string, unknown>): { client?: string } => ({
        client: search.client ? String(search.client) : undefined,
    }),
});

type Conversation = { id: string; name: string; last: string; last_at: string | null; unread: number };
type Message = { id: number; from: 'client' | 'coach'; text: string; sent_at: string };

function Messages() {
    const { client } = Route.useSearch();
    const [active, setActive] = useState<string | null>(client ?? null);
    const [search, setSearch] = useState('');
    const [draft, setDraft] = useState('');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const queryClient = useQueryClient();
    const { data: conversations = [], isLoading } = useQuery({
        queryKey: ['fitnessos', 'conversations'],
        queryFn: () => getJson<Conversation[]>('/fitnessos/conversations'),
    });
    const selected = active ?? conversations[0]?.id;
    const chat = conversations.find((conversation) => conversation.id === selected);
    const { data: messages = [] } = useQuery({
        queryKey: ['fitnessos', 'messages', selected],
        queryFn: () => getJson<Message[]>(`/fitnessos/messages/${selected}`),
        enabled: Boolean(chat),
    });
    const send = async () => {
        if (!selected || !draft.trim()) return;
        setSending(true);
        setError(null);
        try {
            await postJson('/fitnessos/messages', { client_id: Number(selected), body: draft.trim() });
            setDraft('');
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['fitnessos', 'messages', selected] }),
                queryClient.invalidateQueries({ queryKey: ['fitnessos', 'conversations'] }),
            ]);
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : t('The request failed.'));
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="grid h-[calc(100vh-8rem)] grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
            <Card className="flex flex-col border-border/60 bg-card p-3 shadow-card-premium">
                <h2 className="mb-3 px-1 font-semibold">{t('Messages')}</h2>
                <div className="relative mb-2">
                    <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder={t('Search trainees…')} value={search} onChange={(event) => setSearch(event.target.value)} className="ps-9" />
                </div>
                <div className="flex-1 overflow-y-auto">
                    {conversations.filter((conversation) => conversation.name.toLowerCase().includes(search.toLowerCase())).map((conversation) => (
                        <button key={conversation.id} onClick={() => setActive(conversation.id)} className={`flex w-full items-center gap-3 rounded-xl p-3 text-start transition ${selected === conversation.id ? 'bg-secondary' : 'hover:bg-secondary'}`}>
                            <Avatar className="h-10 w-10"><AvatarFallback>{initials(conversation.name)}</AvatarFallback></Avatar>
                            <div className="min-w-0 flex-1">
                                <div className="flex justify-between gap-2"><span className="truncate text-sm font-medium">{conversation.name}</span>{conversation.last_at && <span className="shrink-0 text-[10px] text-muted-foreground">{formatRelative(conversation.last_at)}</span>}</div>
                                <div className="truncate text-xs text-muted-foreground">{conversation.last}</div>
                            </div>
                        </button>
                    ))}
                    {!isLoading && conversations.length === 0 && <p className="p-4 text-sm text-muted-foreground">{t('Accept a request or add a trainee to start a conversation.')}</p>}
                </div>
            </Card>

            <Card className="flex flex-col border-border/60 bg-card shadow-card-premium">
                {chat ? (
                    <>
                        <div className="flex items-center gap-3 border-b border-border/60 p-4">
                            <Avatar><AvatarFallback>{initials(chat.name)}</AvatarFallback></Avatar>
                            <div className="font-semibold">{chat.name}</div>
                        </div>
                        <div className="flex-1 space-y-3 overflow-y-auto p-6">
                            {messages.map((message) => (
                                <div key={message.id} className={`flex ${message.from === 'coach' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-md whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${message.from === 'coach' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                                        {message.text}<div className="mt-1 text-[10px] opacity-70">{messageTime(message.sent_at)}</div>
                                    </div>
                                </div>
                            ))}
                            {messages.length === 0 && <p className="text-sm text-muted-foreground">{t('No messages yet.')}</p>}
                        </div>
                        <div className="border-t border-border/60 p-4">
                            {error && <p role="alert" className="mb-2 text-sm text-destructive">{error}</p>}
                            <div className="flex gap-2">
                                <Input placeholder={t('Type a message…')} aria-label={t('Type a message…')} value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void send(); }} />
                                <Button size="icon" aria-label={t('Send')} disabled={sending || !draft.trim()} onClick={send}><Send className="h-4 w-4 rtl:-scale-x-100" /></Button>
                            </div>
                        </div>
                    </>
                ) : <div className="grid flex-1 place-items-center text-sm text-muted-foreground">{t('Select a trainee to view messages.')}</div>}
            </Card>
        </div>
    );
}
