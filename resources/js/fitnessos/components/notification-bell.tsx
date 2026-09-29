import { useRouter } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { useState } from 'react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@fitnessos/components/ui/popover';
import { getJson, postJson } from '@fitnessos/lib/api';
import { formatNumber, formatRelative } from '@fitnessos/lib/format';
import { t } from '@fitnessos/lib/i18n';
import { cn } from '@fitnessos/lib/utils';

type NotificationItem = {
    id: string;
    kind: string | null;
    title: string;
    body: string;
    url: string | null;
    read: boolean;
    created_at: string | null;
};

type Notifications = { unread_count: number; items: NotificationItem[] };

export function NotificationBell({ className }: { className?: string }) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const { data } = useQuery({
        queryKey: ['fitnessos', 'notifications'],
        queryFn: () => getJson<Notifications>('/fitnessos/notifications'),
        refetchInterval: 60_000,
    });
    const unread = data?.unread_count ?? 0;

    const markRead = async (id?: string) => {
        await postJson('/fitnessos/notifications/read', id ? { id } : {});
        await queryClient.invalidateQueries({
            queryKey: ['fitnessos', 'notifications'],
        });
    };

    const openItem = (item: NotificationItem) => {
        setOpen(false);
        if (!item.read) void markRead(item.id);
        // Server URLs may carry a query string, e.g. /dashboard/messages?client=12.
        if (item.url) router.history.push(item.url);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    aria-label={
                        unread > 0
                            ? t('Notifications, :count unread', {
                                  count: formatNumber(unread),
                              })
                            : t('Notifications')
                    }
                    className={cn(
                        'hover:bg-secondary relative grid h-10 w-10 shrink-0 place-items-center rounded-md',
                        className,
                    )}
                >
                    <Bell className="h-5 w-5" />
                    {unread > 0 && (
                        <span className="bg-primary text-primary-foreground absolute end-1 top-1 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-bold">
                            {formatNumber(Math.min(unread, 99))}
                        </span>
                    )}
                </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
                <div className="border-border flex items-center justify-between border-b px-4 py-3">
                    <span className="font-semibold">{t('Notifications')}</span>
                    {unread > 0 && (
                        <button
                            type="button"
                            className="text-primary text-xs font-semibold"
                            onClick={() => void markRead()}
                        >
                            {t('Mark all as read')}
                        </button>
                    )}
                </div>
                <ul className="max-h-96 overflow-y-auto">
                    {(data?.items ?? []).map((item) => (
                        <li key={item.id}>
                            <button
                                type="button"
                                onClick={() => openItem(item)}
                                className={cn(
                                    'hover:bg-secondary flex w-full gap-3 px-4 py-3 text-start',
                                    !item.read && 'bg-primary/5',
                                )}
                            >
                                <span
                                    className={cn(
                                        'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                                        item.read
                                            ? 'bg-transparent'
                                            : 'bg-primary',
                                    )}
                                />
                                <span className="min-w-0 flex-1">
                                    <span className="block text-sm font-semibold">
                                        {item.title}
                                    </span>
                                    <span className="text-muted-foreground block text-xs">
                                        {item.body}
                                    </span>
                                    {item.created_at && (
                                        <span className="text-subtle-foreground mt-1 block text-[11px]">
                                            {formatRelative(item.created_at)}
                                        </span>
                                    )}
                                </span>
                            </button>
                        </li>
                    ))}
                    {data && data.items.length === 0 && (
                        <li className="text-muted-foreground px-4 py-8 text-center text-sm">
                            {t('No notifications yet.')}
                        </li>
                    )}
                </ul>
            </PopoverContent>
        </Popover>
    );
}
