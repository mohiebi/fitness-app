import { createFileRoute, Link } from '@tanstack/react-router';
import { PageHeader } from '@fitnessos/components/app-shell';
import { Card } from '@fitnessos/components/ui/card';
import { Button } from '@fitnessos/components/ui/button';
import { Input } from '@fitnessos/components/ui/input';
import { Label } from '@fitnessos/components/ui/label';
import { Switch } from '@fitnessos/components/ui/switch';
import { Badge } from '@fitnessos/components/ui/badge';
import {
    Avatar,
    AvatarImage,
    AvatarFallback,
} from '@fitnessos/components/ui/avatar';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@fitnessos/components/ui/tabs';
import { coach } from '@fitnessos/lib/mock-data';
import { sep, t } from '@fitnessos/lib/i18n';
import { Palette, CreditCard, Users } from 'lucide-react';
import { TelegramCard } from '@fitnessos/components/telegram-connect';

export const Route = createFileRoute('/dashboard/settings')({
    component: Settings,
});

// The tab value stays the same in every language; the label is translated.
const tabs = [
    ['business', 'Business'],
    ['branding', 'Branding'],
    ['ai', 'AI'],
    ['integrations', 'Integrations'],
    ['notifications', 'Notifications'],
    ['subscription', 'Subscription'],
    ['team', 'Team'],
] as const;

function Settings() {
    return (
        <div>
            <PageHeader
                title={t('Settings')}
                description={t('Manage your business, branding and team.')}
            />

            <Tabs defaultValue="business">
                <TabsList className="mb-6 flex-wrap">
                    {tabs.map(([value, label]) => (
                        <TabsTrigger key={value} value={value}>
                            {t(label)}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value="business">
                    <Card className="border-border/60 bg-card shadow-card-premium p-6">
                        <h3 className="mb-4 font-semibold">
                            {t('Business information')}
                        </h3>
                        <div className="grid gap-4 md:grid-cols-2">
                            <Field
                                label={t('Business name')}
                                v={t('Sara Coaching')}
                            />
                            <Field label={t('Website')} v="sara-coach.ir" />
                            <Field
                                label={t('Support email')}
                                v="hello@sara-coach.ir"
                                ltr
                            />
                            <Field label={t('Timezone')} v="Asia/Tehran" ltr />
                        </div>
                        <Button className="mt-6">{t('Save changes')}</Button>
                    </Card>
                </TabsContent>

                <TabsContent value="branding">
                    <Card className="border-border/60 bg-card shadow-card-premium p-6">
                        <div className="mb-4 flex items-center gap-2">
                            <Palette className="text-primary h-4 w-4" />
                            <h3 className="font-semibold">{t('Branding')}</h3>
                        </div>
                        <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16">
                                <AvatarImage src={coach.avatar} />
                                <AvatarFallback>{t('S')}</AvatarFallback>
                            </Avatar>
                            <div>
                                <Button variant="outline" size="sm">
                                    {t('Upload logo')}
                                </Button>
                                <div className="text-muted-foreground mt-1 text-xs">
                                    {t('PNG or SVG, up to 2MB')}
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 grid gap-4 md:grid-cols-2">
                            <Field label={t('Primary color')} v="#10B981" ltr />
                            <Field label={t('Accent color')} v="#3B82F6" ltr />
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="ai">
                    <Card className="border-border/60 bg-card shadow-card-premium p-6">
                        <h3 className="mb-4 font-semibold">
                            {t('AI preferences')}
                        </h3>
                        {[
                            [
                                'Tone matching',
                                'AI writes replies in your voice',
                            ],
                            [
                                'Auto-summarize check-ins',
                                'Add AI summary to every check-in',
                            ],
                            [
                                'Program suggestions',
                                'AI can propose plan adjustments after check-ins',
                            ],
                            [
                                'Content drafts',
                                'Weekly Instagram post drafts based on client wins',
                            ],
                        ].map(([title, description]) => (
                            <div
                                key={title}
                                className="border-border/60 flex items-center justify-between border-t py-3 first:border-t-0"
                            >
                                <div>
                                    <div className="text-sm font-medium">
                                        {t(title)}
                                    </div>
                                    <div className="text-muted-foreground text-xs">
                                        {t(description)}
                                    </div>
                                </div>
                                <Switch defaultChecked />
                            </div>
                        ))}
                    </Card>
                </TabsContent>

                <TabsContent value="integrations">
                    <Card className="border-border/60 bg-card shadow-card-premium p-6">
                        <h3 className="mb-4 font-semibold">
                            {t('Integrations')}
                        </h3>
                        <TelegramCard />
                        {[
                            {
                                name: 'Online payment gateway',
                                desc: 'Let trainees pay you inside FitnessOS',
                                icon: CreditCard,
                            },
                            {
                                name: 'Nutrition apps',
                                desc: 'Sync client nutrition logs',
                                icon: Users,
                            },
                        ].map((i) => (
                            <div
                                key={i.name}
                                className="border-border/60 flex items-center gap-4 border-t py-4 first:border-t-0"
                            >
                                <div className="bg-primary/10 text-primary grid h-10 w-10 place-items-center rounded-xl">
                                    <i.icon className="h-4 w-4" />
                                </div>
                                <div className="flex-1">
                                    <div className="font-medium">
                                        {t(i.name)}
                                    </div>
                                    <div className="text-muted-foreground text-xs">
                                        {t(i.desc)}
                                    </div>
                                </div>
                                <Badge variant="secondary">
                                    {t('Coming soon')}
                                </Badge>
                            </div>
                        ))}
                    </Card>
                </TabsContent>

                <TabsContent value="notifications">
                    <Card className="border-border/60 bg-card shadow-card-premium p-6">
                        <h3 className="mb-4 font-semibold">
                            {t('Notifications')}
                        </h3>
                        <p className="text-muted-foreground mb-2 text-sm">
                            {t(
                                'Telegram notifications are managed in the Integrations tab.',
                            )}
                        </p>
                        {[
                            'New check-in',
                            'Missed workout',
                            'New lead',
                            'Payment received',
                            'Package expiring',
                        ].map((n) => (
                            <div
                                key={n}
                                className="border-border/60 flex items-center justify-between border-t py-3 first:border-t-0"
                            >
                                <span className="text-sm">{t(n)}</span>
                                <div className="flex gap-3">
                                    <Switch defaultChecked />
                                    <span className="text-muted-foreground text-xs">
                                        {t('Email')}
                                        {sep()}
                                        {t('Push')}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </Card>
                </TabsContent>

                <TabsContent value="subscription">
                    <Card className="border-primary/30 bg-hero-gradient shadow-glow p-8">
                        <Badge className="bg-primary/15 text-primary">
                            {t('Subscription')}
                        </Badge>
                        <p className="text-muted-foreground mt-3 text-sm">
                            {t(
                                'Your plan, its limits and renewals are on the Billing page.',
                            )}
                        </p>
                        <div className="mt-6 flex gap-2">
                            <Button asChild>
                                <Link to="/dashboard/billing">
                                    {t('Open billing')}
                                </Link>
                            </Button>
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="team">
                    <Card className="border-border/60 bg-card shadow-card-premium p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="font-semibold">
                                {t('Team members')}
                            </h3>
                            <Button size="sm">{t('Invite')}</Button>
                        </div>
                        {[
                            {
                                name: t('Sara Ahmadi'),
                                role: 'Owner',
                                img: coach.avatar,
                            },
                            {
                                name: t('Elham Karimi'),
                                role: 'Coach',
                                img: 'https://i.pravatar.cc/80?img=45',
                            },
                            {
                                name: t('Reza Moradi'),
                                role: 'Admin',
                                img: 'https://i.pravatar.cc/80?img=52',
                            },
                        ].map((m) => (
                            <div
                                key={m.name}
                                className="border-border/60 flex items-center gap-3 border-t py-3 first:border-t-0"
                            >
                                <Avatar>
                                    <AvatarImage src={m.img} />
                                    <AvatarFallback>
                                        {Array.from(m.name)[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="text-sm font-medium">
                                        {m.name}
                                    </div>
                                    <div className="text-muted-foreground text-xs">
                                        {t(m.role)}
                                    </div>
                                </div>
                                <Badge variant="secondary">{t('Active')}</Badge>
                            </div>
                        ))}
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function Field({
    label,
    v,
    ltr = false,
}: {
    label: string;
    v: string;
    ltr?: boolean;
}) {
    return (
        <div>
            <Label className="mb-2 block">{label}</Label>
            <Input defaultValue={v} dir={ltr ? 'ltr' : undefined} />
        </div>
    );
}
