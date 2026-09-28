import { createFileRoute } from '@tanstack/react-router';
import { AppShell } from '@fitnessos/components/app-shell';
import { requireRole } from '@fitnessos/lib/auth';
import { t } from '@fitnessos/lib/i18n';

export const Route = createFileRoute('/app')({
    beforeLoad: () => requireRole('client'),
    head: () => ({ meta: [{ title: t('Trainee app — FitnessOS') }] }),
    component: () => <AppShell variant="client" />,
});
