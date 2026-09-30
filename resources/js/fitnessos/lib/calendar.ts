import { locale } from './i18n';

export type EventKind = 'call' | 'video' | 'in_person' | 'other';

export type CalendarEvent = {
    id: number;
    title: string;
    kind: EventKind;
    starts_at: string;
    duration_minutes: number | null;
    notes: string | null;
    trainee: { id: number; name: string } | null;
};

export type ActivityType = 'session' | 'checkin' | 'started' | 'plan';

export type CalendarActivity = {
    type: ActivityType;
    /** A date (sessions) or a timestamp. */
    at: string;
    trainee: { id: number; name: string };
    label: string | null;
};

export type CalendarData = {
    events: CalendarEvent[];
    activity: CalendarActivity[];
    upcoming: CalendarEvent[];
    subscription_ends_at: string | null;
};

export const eventKinds: { value: EventKind; label: string }[] = [
    { value: 'call', label: 'Phone call' },
    { value: 'video', label: 'Video call' },
    { value: 'in_person', label: 'In person' },
    { value: 'other', label: 'Something else' },
];

// The Persian calendar (and its weeks, which start on Saturday) for Persian,
// the Gregorian calendar with Monday-first weeks otherwise. Digits stay Latin
// here because these parts are only used for arithmetic.
function calendarId(): string {
    return locale() === 'fa'
        ? 'fa-IR-u-ca-persian-nu-latn'
        : 'en-GB-u-ca-gregory';
}

function displayLocale(): string {
    return locale() === 'fa' ? 'fa-IR-u-ca-persian' : 'en-GB';
}

/** getDay() value of the first day of the week: Saturday (6) or Monday (1). */
function weekStart(): number {
    return locale() === 'fa' ? 6 : 1;
}

export function startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number): Date {
    const next = startOfDay(date);
    next.setDate(next.getDate() + days);

    return next;
}

/** A local calendar day as YYYY-MM-DD, used to group things by day. */
export function dayKey(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${date.getFullYear()}-${month}-${day}`;
}

function parts(date: Date): { month: number; day: number } {
    const found = new Intl.DateTimeFormat(calendarId(), {
        month: 'numeric',
        day: 'numeric',
    }).formatToParts(date);
    const read = (type: string) =>
        Number(found.find((part) => part.type === type)?.value ?? 1);

    return { month: read('month'), day: read('day') };
}

/** The first day of the month that contains the date, in the active calendar. */
export function monthStart(date: Date): Date {
    return addDays(date, -(parts(date).day - 1));
}

export function monthLength(start: Date): number {
    const month = parts(start).month;
    let length = 1;

    while (length < 32 && parts(addDays(start, length)).month === month) {
        length += 1;
    }

    return length;
}

/**
 * The weeks to draw for the month around a date: full weeks, starting on the
 * first day of the week, so it also covers the ends of the neighbouring months.
 */
export function monthGrid(anchor: Date) {
    const start = monthStart(anchor);
    const length = monthLength(start);
    const lead = (start.getDay() - weekStart() + 7) % 7;
    const cells = Math.ceil((lead + length) / 7) * 7;
    const first = addDays(start, -lead);

    return {
        start,
        length,
        first,
        end: addDays(first, cells),
        days: Array.from({ length: cells }, (_, i) => addDays(first, i)),
        previous: addDays(start, -1),
        next: addDays(start, length),
    };
}

export function inMonth(date: Date, start: Date, length: number): boolean {
    return date >= start && date < addDays(start, length);
}

export function monthTitle(date: Date): string {
    return new Intl.DateTimeFormat(displayLocale(), {
        month: 'long',
        year: 'numeric',
    }).format(date);
}

/** The day of the month, in the active calendar and script. */
export function dayNumber(date: Date): string {
    return new Intl.DateTimeFormat(displayLocale(), { day: 'numeric' }).format(
        date,
    );
}

/** Short weekday names, starting with the first day of the week. */
export function weekdayLabels(): string[] {
    // 2024-01-07 was a Sunday; walk forward to the first day of the week.
    const format = new Intl.DateTimeFormat(displayLocale(), {
        weekday: 'short',
    });
    const first = new Date(2024, 0, 7 + ((weekStart() + 7) % 7));

    return Array.from({ length: 7 }, (_, i) =>
        format.format(addDays(first, i)),
    );
}

export function timeLabel(iso: string): string {
    return new Intl.DateTimeFormat(displayLocale(), {
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(iso));
}
