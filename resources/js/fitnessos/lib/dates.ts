export const DAY_MS = 86_400_000;

// Query-builder rows come back as "Y-m-d H:i:s" in the app timezone (UTC).
export function parseServerDate(value: string): Date {
    return /[zZ]|[+-]\d\d:?\d\d$/.test(value)
        ? new Date(value)
        : new Date(`${value.replace(' ', 'T')}Z`);
}

export function daysSince(value: string | Date): number {
    const date = typeof value === 'string' ? parseServerDate(value) : value;
    return Math.floor((Date.now() - date.getTime()) / DAY_MS);
}

export function shortAge(value: string): string {
    const minutes = Math.max(0, Math.floor((Date.now() - parseServerDate(value).getTime()) / 60_000));
    if (minutes < 60) return `${minutes}m`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
    return `${Math.floor(minutes / 1440)}d`;
}

export function timeAgo(value: string): string {
    const age = shortAge(value);
    return age === '0m' ? 'just now' : `${age} ago`;
}

export function todayLabel(): string {
    return new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function greeting(): string {
    const hour = new Date().getHours();
    return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
}
