import { Link } from '@tanstack/react-router';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@fitnessos/components/ui/button';
import { LogoMark } from '@fitnessos/components/logo-mark';
import { isAuthenticated } from '@fitnessos/lib/auth';
import { t } from '@fitnessos/lib/i18n';
import { formatDate } from '@fitnessos/lib/format';

import { Wordmark } from '@fitnessos/components/wordmark';
const links = [
    { to: '/', label: t('Home') },
    { to: '/coaches', label: t('Coaches') },
    { to: '/about', label: t('About') },
    { to: '/contact', label: t('Contact') },
];

export function PublicNav() {
    const [open, setOpen] = useState(false);
    const portalLabel = isAuthenticated() ? t('Open app') : t('Log in');
    return (
        <header className="sticky top-0 z-40 w-full px-4 pt-4">
            <div className="sport-pill shadow-card-premium mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-5">
                <Link to="/" className="group flex items-center gap-2.5">
                    <LogoMark className="h-10 w-10 transition-transform group-hover:scale-110 group-hover:rotate-12" />
                    <span
                        dir="ltr"
                        className="font-display text-lg font-extrabold uppercase"
                    >
                        <Wordmark />
                    </span>
                </Link>
                <nav
                    aria-label={t('Main')}
                    className="hidden items-center gap-1 md:flex"
                >
                    {links.map((l) => (
                        <Link
                            key={l.to}
                            to={l.to}
                            className="text-muted-foreground hover:bg-primary/10 hover:text-volt rounded-full px-3 py-2 text-xs font-bold tracking-wider uppercase transition-all"
                            activeProps={{
                                className:
                                    'rounded-full bg-primary/15 px-3 py-2 text-xs font-bold uppercase tracking-wider text-foreground',
                            }}
                            activeOptions={{ exact: true }}
                        >
                            {l.label}
                        </Link>
                    ))}
                </nav>
                <div className="hidden items-center gap-2 md:flex">
                    <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="text-xs tracking-wider uppercase"
                    >
                        <a href="/portal">{portalLabel}</a>
                    </Button>
                    <Button
                        asChild
                        size="sm"
                        className="tracking-wider uppercase"
                    >
                        <Link to="/coaches">{t('Find a coach')}</Link>
                    </Button>
                </div>
                <button
                    type="button"
                    className="bg-secondary grid h-11 w-11 place-items-center rounded-full md:hidden"
                    onClick={() => setOpen(!open)}
                    aria-label={open ? t('Close menu') : t('Open menu')}
                    aria-expanded={open}
                >
                    {open ? (
                        <X className="h-5 w-5" />
                    ) : (
                        <Menu className="h-5 w-5" />
                    )}
                </button>
            </div>
            {open && (
                <nav
                    aria-label={t('Main')}
                    className="border-border bg-background/95 shadow-card-premium mx-auto mt-3 max-w-7xl rounded-[2rem] border backdrop-blur-xl md:hidden"
                >
                    <div className="flex flex-col gap-2 px-6 py-5">
                        {links.map((l) => (
                            <Link
                                key={l.to}
                                to={l.to}
                                onClick={() => setOpen(false)}
                                className="text-muted-foreground hover:bg-primary/10 hover:text-volt rounded-full px-3 py-2.5 text-sm font-bold tracking-wider uppercase"
                            >
                                {l.label}
                            </Link>
                        ))}
                        <a
                            href="/portal"
                            className="text-muted-foreground hover:bg-primary/10 hover:text-volt rounded-full px-3 py-2.5 text-sm font-bold tracking-wider uppercase"
                        >
                            {portalLabel}
                        </a>
                        <Button
                            asChild
                            size="lg"
                            className="mt-1 tracking-wider uppercase"
                        >
                            <Link to="/coaches" onClick={() => setOpen(false)}>
                                {t('Find a coach')}
                            </Link>
                        </Button>
                    </div>
                </nav>
            )}
        </header>
    );
}

export function Footer() {
    return (
        <footer className="bg-background relative overflow-hidden px-4 pb-4">
            <div className="border-border bg-card/60 mx-auto max-w-7xl overflow-hidden rounded-[2rem] border">
                <div className="border-border pointer-events-none overflow-hidden border-b py-6 select-none">
                    <div className="animate-marquee font-display text-foreground/5 flex text-6xl font-extrabold whitespace-nowrap uppercase md:text-8xl">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <span key={i} className="mx-8">
                                {t(
                                    'Find your coach · FitnessOS · Train with a plan ·',
                                )}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-8 px-6 py-16 md:grid-cols-5">
                    <div className="col-span-2">
                        <div className="flex items-center gap-2.5">
                            <LogoMark className="h-10 w-10" />
                            <span
                                dir="ltr"
                                className="font-display text-lg font-extrabold uppercase"
                            >
                                <Wordmark />
                            </span>
                        </div>
                        <p className="text-muted-foreground mt-4 max-w-sm text-sm leading-relaxed">
                            {t(
                                'Find a verified coach, follow your plan and check in with them every week.',
                            )}
                        </p>
                    </div>
                    <FooterCol
                        title={t('Trainees')}
                        links={[
                            [t('Find a coach'), '/coaches'],
                            [t('Resources'), '/resources'],
                        ]}
                    />
                    <FooterCol
                        title={t('Company')}
                        links={[
                            [t('About'), '/about'],
                            [t('Contact'), '/contact'],
                        ]}
                    />
                    <FooterCol
                        title={t('Sign in')}
                        links={[
                            [t('Coach dashboard'), '/dashboard'],
                            [t('Trainee app'), '/app'],
                        ]}
                    />
                </div>
                <div className="border-border/60 border-t">
                    <div className="text-muted-foreground flex flex-col items-center justify-between gap-2 px-6 py-6 text-[10px] font-bold tracking-widest uppercase sm:flex-row">
                        <span>
                            {t('© :year FitnessOS · All rights reserved', {
                                year: formatDate(new Date(), {
                                    year: 'numeric',
                                }),
                            })}
                        </span>
                        <span>
                            {t('Built for coaches and the people they train')}
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}

function FooterCol({
    title,
    links,
}: {
    title: string;
    links: [string, string][];
}) {
    return (
        <div>
            <h4 className="text-volt text-[10px] font-bold tracking-widest uppercase">
                {title}
            </h4>
            <ul className="text-muted-foreground mt-3 space-y-2.5 text-sm">
                {links.map(([label, to]) => (
                    <li key={to}>
                        <Link to={to} className="hover:text-foreground">
                            {label}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}
