import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Send } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@fitnessos/components/ui/badge';
import { Button } from '@fitnessos/components/ui/button';
import { Card } from '@fitnessos/components/ui/card';
import { Switch } from '@fitnessos/components/ui/switch';
import { deleteJson, getJson, postJson, putJson } from '@fitnessos/lib/api';
import { formatNumber } from '@fitnessos/lib/format';
import { t } from '@fitnessos/lib/i18n';
import {
    digestHours,
    telegramGroups,
    type TelegramStatus,
} from '@fitnessos/lib/telegram';

const queryKey = ['fitnessos', 'telegram'];

/**
 * The coach's Telegram connection. While the coach is pressing Start in
 * Telegram the status is polled, so the page flips to "connected" by itself.
 */
export function useTelegram() {
    const queryClient = useQueryClient();
    const [waiting, setWaiting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const query = useQuery({
        queryKey,
        queryFn: async () => {
            const status = await getJson<TelegramStatus>('/fitnessos/telegram');
            if (status.linked) setWaiting(false);

            return status;
        },
        refetchInterval: waiting ? 3000 : false,
    });

    const replace = (status: TelegramStatus) =>
        queryClient.setQueryData(queryKey, status);

    const connect = async () => {
        // Open the tab now so the browser doesn't block it as a pop-up.
        const tab = window.open('', '_blank');
        setError(null);
        try {
            const link = (await postJson('/fitnessos/telegram/link')) as {
                url: string;
            };
            if (tab) tab.location.href = link.url;
            setWaiting(true);
        } catch (cause) {
            tab?.close();
            setError(
                cause instanceof Error
                    ? cause.message
                    : t('The request failed.'),
            );
        }
    };

    const disconnect = async () => {
        replace((await deleteJson('/fitnessos/telegram')) as TelegramStatus);
        setWaiting(false);
    };

    const save = async (changes: Record<string, boolean | number>) =>
        replace(
            (await putJson('/fitnessos/telegram', changes)) as TelegramStatus,
        );

    return { ...query, waiting, error, connect, disconnect, save };
}

/** Full card for Settings → Integrations. */
export function TelegramCard() {
    const { data, isLoading, waiting, error, connect, disconnect, save } =
        useTelegram();

    if (isLoading || !data) {
        return <p className="text-muted-foreground text-sm">{t('Loading…')}</p>;
    }

    return (
        <div className="border-border/60 flex flex-col gap-4 border-b pb-5">
            <div className="flex items-center gap-4">
                <div className="bg-primary/10 text-primary grid h-10 w-10 place-items-center rounded-xl">
                    <Send className="h-4 w-4" />
                </div>
                <div className="flex-1">
                    <div className="font-medium">{t('Telegram')}</div>
                    <div className="text-muted-foreground text-xs">
                        {t(
                            'Run your coaching from your phone: requests, messages, check-ins and AI drafts.',
                        )}
                    </div>
                </div>
                {data.linked ? (
                    <div className="flex items-center gap-2">
                        <Badge className="bg-primary/15 text-primary">
                            {data.username
                                ? t('Connected as @:username', {
                                      username: data.username,
                                  })
                                : t('Connected')}
                        </Badge>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void disconnect()}
                        >
                            {t('Disconnect')}
                        </Button>
                    </div>
                ) : (
                    <Button
                        size="sm"
                        disabled={!data.available}
                        onClick={() => void connect()}
                    >
                        {t('Connect Telegram')}
                    </Button>
                )}
            </div>

            {!data.available && (
                <p className="text-muted-foreground text-sm">
                    {t('The Telegram bot is not available yet.')}
                </p>
            )}
            {waiting && !data.linked && (
                <p className="text-muted-foreground text-sm">
                    {t('Press Start in Telegram to finish connecting…')}
                </p>
            )}
            {error && <p className="text-destructive text-sm">{error}</p>}

            {data.linked && (
                <div className="flex flex-col">
                    {telegramGroups.map((group) => (
                        <div
                            key={group.key}
                            className="border-border/60 flex items-center justify-between gap-4 border-t py-3 first:border-t-0"
                        >
                            <div>
                                <div className="text-sm font-medium">
                                    {t(group.label)}
                                </div>
                                <div className="text-muted-foreground text-xs">
                                    {t(group.hint)}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {group.key === 'digest' &&
                                    data.preferences.digest && (
                                        <select
                                            aria-label={t('Morning summary')}
                                            className="border-input bg-background h-8 rounded-md border px-2 text-sm"
                                            value={data.preferences.digest_hour}
                                            onChange={(event) =>
                                                void save({
                                                    digest_hour: Number(
                                                        event.target.value,
                                                    ),
                                                })
                                            }
                                        >
                                            {digestHours.map((hour) => (
                                                <option key={hour} value={hour}>
                                                    {`${formatNumber(hour)}:${formatNumber(0)}${formatNumber(0)}`}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                <Switch
                                    aria-label={t(group.label)}
                                    checked={data.preferences[group.key]}
                                    onCheckedChange={(checked) =>
                                        void save({
                                            [group.key]: checked,
                                        })
                                    }
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

/** A nudge on the dashboard until the coach connects Telegram. */
export function TelegramPrompt() {
    const { data, waiting, connect } = useTelegram();

    if (!data?.available || data.linked) return null;

    return (
        <Card className="border-primary/40 bg-hero-gradient mb-6 flex flex-wrap items-center gap-4 p-5">
            <Send className="text-volt h-6 w-6" />
            <div className="min-w-0 flex-1">
                <div className="font-semibold">
                    {t('Coach from your phone with Telegram')}
                </div>
                <p className="text-muted-foreground text-sm">
                    {waiting
                        ? t('Press Start in Telegram to finish connecting…')
                        : t(
                              'Get requests, messages and check-ins in Telegram and answer them there, with AI drafts you approve.',
                          )}
                </p>
            </div>
            <Button onClick={() => void connect()}>
                {t('Connect Telegram')}
            </Button>
        </Card>
    );
}
