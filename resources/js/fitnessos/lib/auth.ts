import { redirect } from '@tanstack/react-router';

export function currentUser() {
    const name = document.querySelector<HTMLMetaElement>(
        'meta[name="fitnessos-user-name"]',
    )?.content;

    return name || null;
}

export function currentEmail() {
    return document.querySelector<HTMLMetaElement>(
        'meta[name="fitnessos-user-email"]',
    )?.content ?? null;
}

export function requireRole(role: 'coach' | 'client') {
    const authenticated = document.querySelector<HTMLMetaElement>(
        'meta[name="fitnessos-authenticated"]',
    )?.content === '1';

    if (!authenticated) {
        throw redirect({ href: '/login', reloadDocument: true });
    }

    const currentRole = document.querySelector<HTMLMetaElement>(
        'meta[name="fitnessos-role"]',
    )?.content;

    if (currentRole !== role && !(role === 'coach' && currentRole === 'admin')) {
        throw redirect({ href: '/portal', reloadDocument: true });
    }
}
