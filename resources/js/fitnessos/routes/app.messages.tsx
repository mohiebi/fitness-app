import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@fitnessos/components/app-shell";
import { Card } from "@fitnessos/components/ui/card";
import { Button } from "@fitnessos/components/ui/button";
import { Input } from "@fitnessos/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@fitnessos/components/ui/avatar";
import { Send } from "lucide-react";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getJson, postJson } from "@fitnessos/lib/api";
import { t } from "@fitnessos/lib/i18n";
import { messageTime } from "@fitnessos/lib/format";
import { initials } from "@fitnessos/lib/marketplace";
import { NoCoachCard, useMyCoaching } from "@fitnessos/components/no-coach";

export const Route = createFileRoute("/app/messages")({ component: ClientMessages });

type Message = { id: number; from: 'client' | 'coach'; text: string; sent_at: string };

function ClientMessages() {
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { data: coaching, isLoading: loadingCoach } = useMyCoaching();
  const coach = coaching?.active?.coach;
  const { data: messages = [], isLoading } = useQuery({ queryKey: ['fitnessos', 'messages'], queryFn: () => getJson<Message[]>('/fitnessos/messages'), enabled: Boolean(coach) });
  const send = async () => {
    if (!draft.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await postJson('/fitnessos/messages', { body: draft.trim() });
      setDraft('');
      await queryClient.invalidateQueries({ queryKey: ['fitnessos', 'messages'] });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('The request failed.'));
    } finally {
      setBusy(false);
    }
  };
  if (!loadingCoach && !coach) {
    return (
      <div>
        <PageHeader title={t("Chat with your coach")} />
        <NoCoachCard pendingCoachName={coaching?.pending?.coach.name} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={t("Chat with your coach")} />
      <Card className="flex h-[calc(100vh-14rem)] flex-col overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border/60 p-4">
          <Avatar>{coach?.avatar_url && <AvatarImage src={coach.avatar_url} alt="" className="object-cover" />}<AvatarFallback>{coach ? initials(coach.name) : ""}</AvatarFallback></Avatar>
          <div><div className="font-semibold">{coach?.name ?? t("Your coach")}</div><div className="text-xs text-muted-foreground">{t("Only you and your coach can read this chat.")}</div></div>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto p-6">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.from === "client" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-md rounded-2xl px-4 py-2.5 text-sm ${m.from === "client" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                {m.text}<div className="mt-1 text-[10px] opacity-70">{messageTime(m.sent_at)}</div>
              </div>
            </div>
          ))}
          {!isLoading && messages.length === 0 && <p className="text-sm text-muted-foreground">{t("No messages yet. Say hello to your coach.")}</p>}
        </div>
        <div className="border-t border-border/60 p-4">
          {error && <p role="alert" className="mb-2 text-sm text-destructive">{error}</p>}
          <div className="flex items-end gap-2">
            <Input placeholder={t("Message your coach…")} aria-label={t("Message your coach…")} value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') void send(); }} className="flex-1 rounded-full bg-background/70" />
            <Button size="icon" aria-label={t("Send")} disabled={busy || !draft.trim()} onClick={send}><Send className="h-4 w-4 rtl:-scale-x-100" /></Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
