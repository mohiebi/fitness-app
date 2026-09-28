import { locale } from './i18n';
import { parseServerDate } from './dates';

// fa-IR with the Persian calendar gives Jalali dates and Persian digits.
function intlLocale(): string {
    return locale() === 'fa' ? 'fa-IR-u-ca-persian' : 'en-GB';
}

function toDate(value: string | Date): Date {
    return typeof value === 'string' ? parseServerDate(value) : value;
}

export function formatDate(value: string | Date, options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }): string {
    return new Intl.DateTimeFormat(intlLocale(), options).format(toDate(value));
}

export function formatNumber(value: number): string {
    return new Intl.NumberFormat(locale() === 'fa' ? 'fa-IR' : 'en-GB').format(value);
}

export function formatToman(value: number): string {
    return locale() === 'fa' ? `${formatNumber(value)} تومان` : `${formatNumber(value)} toman`;
}

export function formatRelative(value: string | Date): string {
    const seconds = Math.round((toDate(value).getTime() - Date.now()) / 1000);
    const rtf = new Intl.RelativeTimeFormat(locale() === 'fa' ? 'fa-IR' : 'en-GB', { numeric: 'auto' });
    const units: [Intl.RelativeTimeFormatUnit, number][] = [
        ['year', 31_536_000],
        ['month', 2_592_000],
        ['week', 604_800],
        ['day', 86_400],
        ['hour', 3_600],
        ['minute', 60],
    ];

    for (const [unit, size] of units) {
        if (Math.abs(seconds) >= size) {
            return rtf.format(Math.round(seconds / size), unit);
        }
    }

    return rtf.format(0, 'minute');
}
