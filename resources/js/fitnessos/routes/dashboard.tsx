import { createFileRoute } from '@tanstack/react-router';
import { AppShell } from '@fitnessos/components/app-shell';
import { requireRole } from '@fitnessos/lib/auth';
import { t } from '@fitnessos/lib/i18n';

export const Route = createFileRoute('/dashboard')({
    beforeLoad: () => requireRole('coach'),
    head: () => ({ meta: [{ title: t('Coach dashboard — FitnessOS') }] }),
    component: () => <AppShell variant="coach" />,
});
