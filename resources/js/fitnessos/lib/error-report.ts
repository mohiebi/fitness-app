/**
 * Tells the server about errors that happen in the browser, so they show up
 * in the logs. At most a handful per page load, and only the facts needed to
 * find the cause (no page content, no form data).
 */
let sent = 0;
const MAX_PER_PAGE = 5;

export function reportError(
    message: string,
    details: { source?: string; stack?: string } = {},
): void {
    if (sent >= MAX_PER_PAGE) return;
    sent += 1;

    const token = document.querySelector<HTMLMetaElement>(
        'meta[name="csrf-token"]',
    )?.content;

    void fetch('/client-errors', {
        method: 'POST',
        keepalive: true,
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': token ?? '',
        },
        body: JSON.stringify({
            message: message.slice(0, 500),
            source: details.source?.slice(0, 300),
            page: location.pathname,
            stack: details.stack?.slice(0, 2000),
        }),
    }).catch(() => {
        // Reporting must never cause an error of its own.
    });
}

export function listenForErrors(): void {
    window.addEventListener('error', (event) => {
        reportError(event.message || 'Script error', {
            source: `${event.filename}:${event.lineno}:${event.colno}`,
            stack: event.error instanceof Error ? event.error.stack : undefined,
        });
    });

    window.addEventListener('unhandledrejection', (event) => {
        const reason: unknown = event.reason;
        reportError(reason instanceof Error ? reason.message : String(reason), {
            stack: reason instanceof Error ? reason.stack : undefined,
        });
    });
}
