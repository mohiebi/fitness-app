import { createFileRoute } from '@tanstack/react-router';
import { PageHeader } from '@fitnessos/components/app-shell';
import { Card } from '@fitnessos/components/ui/card';
import { Button } from '@fitnessos/components/ui/button';
import { Avatar, AvatarFallback } from '@fitnessos/components/ui/avatar';
import { currentEmail, currentUser } from '@fitnessos/lib/auth';

export const Route = createFileRoute('/app/profile')({ component: Profile });

function Profile() {
    const name = currentUser() ?? 'Client';
    const email = currentEmail();

    return (
        <div>
            <PageHeader title="Profile" description="Your account details and security settings." />
            <Card className="max-w-xl border-border/60 bg-card p-6 shadow-card-premium">
                <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16"><AvatarFallback>{name[0]?.toUpperCase()}</AvatarFallback></Avatar>
                    <div><h2 className="text-xl font-semibold">{name}</h2><p className="text-sm text-muted-foreground">{email}</p></div>
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                    <Button asChild className="rounded-full bg-brand-gradient text-primary-foreground"><a href="/settings/profile">Edit profile</a></Button>
                    <Button asChild variant="outline" className="rounded-full"><a href="/settings/security">Security</a></Button>
                </div>
            </Card>
        </div>
    );
}
