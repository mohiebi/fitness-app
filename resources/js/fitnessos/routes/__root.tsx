import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    Outlet,
    Link,
    createRootRouteWithContext,
    useRouter,
    HeadContent,
} from '@tanstack/react-router';
import { DirectionProvider } from '@radix-ui/react-direction';
import { reportError } from '@fitnessos/lib/error-report';
import { isRtl, locale, t } from '@fitnessos/lib/i18n';

function NotFoundComponent() {
    return (
        <div className="bg-background flex min-h-screen items-center justify-center px-4">
            <div className="max-w-md text-center">
                <h1 className="font-display text-primary text-7xl font-bold">
                    404
                </h1>
                <h2 className="mt-4 text-xl font-semibold">
                    {t('Page not found')}
                </h2>
                <p className="text-muted-foreground mt-2 text-sm">
                    {t(
                        "The page you're looking for doesn't exist or has been moved.",
                    )}
                </p>
                <div className="mt-6">
                    <Link
                        to="/"
                        className="bg-primary text-primary-foreground inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-medium transition-colors hover:opacity-90"
                    >
                        {t('Go home')}
                    </Link>
                </div>
            </div>
        </div>
    );
}

function ErrorComponent({
    error,
    reset,
}: {
    error: unknown;
    reset: () => void;
}) {
    console.error(error);
    useEffect(() => {
        reportError(error instanceof Error ? error.message : String(error), {
            stack: error instanceof Error ? error.stack : undefined,
        });
    }, [error]);
    const router = useRouter();
    return (
        <div className="bg-background flex min-h-screen items-center justify-center px-4">
            <div className="max-w-md text-center">
                <h1 className="text-xl font-semibold tracking-tight">
                    {t("This page didn't load")}
                </h1>
                <p className="text-muted-foreground mt-2 text-sm">
                    {t(
                        'Something went wrong. Try refreshing or head back home.',
                    )}
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                    <button
                        onClick={() => {
                            void router.invalidate();
                            reset();
                        }}
                        className="bg-primary text-primary-foreground inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-medium transition-colors hover:opacity-90"
                    >
                        {t('Try again')}
                    </button>
                    <a
                        href="/"
                        className="border-border bg-background hover:bg-secondary inline-flex items-center justify-center rounded-full border px-5 py-2 text-sm font-medium transition-colors"
                    >
                        {t('Go home')}
                    </a>
                </div>
            </div>
        </div>
    );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
    {
        head: () => ({
            meta: [
                { charSet: 'utf-8' },
                {
                    name: 'viewport',
                    content: 'width=device-width, initial-scale=1',
                },
                { title: t('FitnessOS — Find your coach, follow your plan') },
                {
                    name: 'description',
                    content: t(
                        'FitnessOS connects trainees with verified coaches, personal plans and direct coach chat.',
                    ),
                },
                { name: 'author', content: 'FitnessOS' },
                {
                    property: 'og:title',
                    content: t('FitnessOS — Find your coach, follow your plan'),
                },
                {
                    property: 'og:description',
                    content: t(
                        'FitnessOS connects trainees with verified coaches, personal plans and direct coach chat.',
                    ),
                },
                { property: 'og:type', content: 'website' },
                { name: 'twitter:card', content: 'summary_large_image' },
            ],
            // Persian pages use the bundled Vazirmatn font; skip Google Fonts there.
            links: [
                ...(locale() === 'fa'
                    ? []
                    : [
                          {
                              rel: 'preconnect',
                              href: 'https://fonts.googleapis.com',
                          },
                          {
                              rel: 'preconnect',
                              href: 'https://fonts.gstatic.com',
                              crossOrigin: 'anonymous' as const,
                          },
                          {
                              rel: 'stylesheet',
                              href: 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@500;600;700;800&family=Manrope:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap',
                          },
                      ]),
                {
                    rel: 'icon',
                    href: '/fitnessos-favicon.ico',
                    type: 'image/x-icon',
                },
            ],
        }),
        component: RootComponent,
        notFoundComponent: NotFoundComponent,
        errorComponent: ErrorComponent,
    },
);

function RootComponent() {
    const { queryClient } = Route.useRouteContext();
    return (
        <QueryClientProvider client={queryClient}>
            {/* Radix sliders, tabs and menus follow the page direction. */}
            <DirectionProvider dir={isRtl() ? 'rtl' : 'ltr'}>
                {createPortal(<HeadContent />, document.head)}
                <Outlet />
            </DirectionProvider>
        </QueryClientProvider>
    );
}
