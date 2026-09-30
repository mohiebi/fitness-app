import { fa } from '../locales/fa';

/**
 * Minimal translation helper. The English text is the key (like Laravel's
 * __() with lang/fa.json), so untranslated strings fall back to English.
 * Placeholders use :name, e.g. t('Hi :name', { name }).
 */
export type Locale = 'fa' | 'en';

const dictionaries: Record<Locale, Record<string, string>> = { fa, en: {} };

export function locale(): Locale {
    return document.documentElement.lang.startsWith('fa') ? 'fa' : 'en';
}

export function isRtl(): boolean {
    return document.documentElement.dir === 'rtl';
}

/**
 * English text that was asked for in Persian but has no entry in fa.ts.
 * Exposed on window so a crawl of the site can list what still needs
 * translating (window.__missingTranslations).
 */
export const missingTranslations = new Set<string>();

if (typeof window !== 'undefined') {
    (
        window as unknown as { __missingTranslations: Set<string> }
    ).__missingTranslations = missingTranslations;
}

export function t(
    text: string,
    replace: Record<string, string | number> = {},
): string {
    const known = dictionaries[locale()][text];
    if (known === undefined && locale() === 'fa' && /[A-Za-z]{2}/.test(text)) {
        missingTranslations.add(text);
    }

    const translated = known ?? text;

    return Object.entries(replace).reduce(
        (result, [key, value]) => result.replaceAll(`:${key}`, String(value)),
        translated,
    );
}

/**
 * Separator between short facts. The middle dot reads as a Persian zero
 * (۰) in Persian fonts, so Persian uses its own comma instead.
 */
export function sep(): string {
    return locale() === 'fa' ? '، ' : ' · ';
}
