import { redirect } from '@tanstack/react-router';

export function currentUser() {
    const name = document.querySelector<HTMLMetaElement>(
        'meta[name="fitnessos-user-name"]',
    )?.content;

    return name || null;
}

export function currentEmail() {
    return (
        document.querySelector<HTMLMetaElement>(
            'meta[name="fitnessos-user-email"]',
        )?.content ?? null
    );
}

export function isAuthenticated() {
    return (
        document.querySelector<HTMLMetaElement>(
            'meta[name="fitnessos-authenticated"]',
        )?.content === '1'
    );
}

export function currentRole(): 'coach' | 'client' | 'admin' | null {
    if (!isAuthenticated()) {
        return null;
    }

    const role = document.querySelector<HTMLMetaElement>(
        'meta[name="fitnessos-role"]',
    )?.content;

    return role === 'client' || role === 'admin' ? role : 'coach';
}

export function requireRole(role: 'coach' | 'client') {
    if (!isAuthenticated()) {
        throw redirect({ href: '/login', reloadDocument: true });
    }

    const current = currentRole();

    if (current !== role && !(role === 'coach' && current === 'admin')) {
        throw redirect({ href: '/portal', reloadDocument: true });
    }
}
