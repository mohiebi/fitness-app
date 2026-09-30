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
