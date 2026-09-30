import { locale } from '@fitnessos/lib/i18n';

/** The FitnessOS name as a logotype, in Persian letters on a Persian page. */
export function Wordmark() {
    return locale() === 'fa' ? (
        <>
            فیتنس‌<span className="text-volt">اواس</span>
        </>
    ) : (
        <>
            Fitness<span className="text-volt">OS</span>
        </>
    );
}
