async function requestJson(path: string, method: string, data?: Record<string, unknown>) {
    const token = document.querySelector<HTMLMetaElement>(
        'meta[name="csrf-token"]',
    )?.content;

    const response = await fetch(path, {
        method,
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': token ?? '',
        },
        ...(data ? { body: JSON.stringify(data) } : {}),
    });

    if (response.redirected && new URL(response.url).pathname === '/login') {
        window.location.assign(response.url);
        throw new Error('Your session has expired. Redirecting to login.');
    }

    if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
            message?: string;
            errors?: Record<string, string[]>;
        } | null;
        const firstError = payload?.errors
            ? Object.values(payload.errors).flat()[0]
            : null;
        throw new Error(firstError ?? payload?.message ?? 'The request failed.');
    }

    if (!response.headers.get('content-type')?.includes('application/json')) {
        throw new Error('The server returned an unexpected response.');
    }

    return response.json();
}

export function getJson<T>(path: string): Promise<T> {
    return requestJson(path, 'GET') as Promise<T>;
}

export function postJson(path: string, data: Record<string, unknown>) {
    return requestJson(path, 'POST', data);
}

export function patchJson(path: string, data: Record<string, unknown>) {
    return requestJson(path, 'PATCH', data);
}
