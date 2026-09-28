import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard, Users, UserPlus, Dumbbell, Utensils, ClipboardCheck, TrendingUp,
  MessageSquare, Calendar, CreditCard, Sparkles, Image, BarChart3, SlidersHorizontal, Search,
  ChevronsLeft, Menu, Home, LineChart, User, LogOut, BookOpen, Info, Contact, HeartHandshake, type LucideIcon,
} from "lucide-react";
import { Input } from "@fitnessos/components/ui/input";
import { LogoMark } from "@fitnessos/components/logo-mark";
import { cn } from "@fitnessos/lib/utils";
import { currentUser } from "@fitnessos/lib/auth";
import { getJson } from "@fitnessos/lib/api";
import { t } from "@fitnessos/lib/i18n";

type NavItem = { to: string; label: string; icon: LucideIcon; exact?: boolean; count?: number };
type NavGroup = { label?: string; items: NavItem[] };

const previewPaths = new Set([
  '/dashboard/workouts', '/dashboard/nutrition', '/dashboard/progress',
  '/dashboard/calendar', '/dashboard/payments', '/dashboard/content',
  '/dashboard/ai', '/dashboard/reports', '/dashboard/settings',
  '/app/workout', '/app/nutrition', '/app/resources',
]);

const clientTabs: NavItem[] = [
  { to: "/app", label: t("Today"), icon: Home, exact: true },
  { to: "/app/workout", label: t("Workout"), icon: Dumbbell },
  { to: "/app/nutrition", label: t("Nutrition"), icon: Utensils },
  { to: "/app/progress", label: t("Progress"), icon: LineChart },
  { to: "/app/coach", label: t("Coach"), icon: HeartHandshake },
];

function useCoachCounts(enabled: boolean) {
  const { data: checkins = [] } = useQuery({
    queryKey: ['fitnessos', 'checkins'],
    queryFn: () => getJson<{ status: string }[]>('/fitnessos/checkins'),
    enabled,
  });
  const { data: requests = [] } = useQuery({
    queryKey: ['fitnessos', 'coachings', 'requested'],
    queryFn: () => getJson<unknown[]>('/fitnessos/coachings?status=requested'),
    enabled,
  });

  return {
    pendingCheckins: checkins.filter((checkin) => checkin.status === 'Pending').length,
    pendingRequests: requests.length,
  };
}

function navFor(variant: "coach" | "client", counts: ReturnType<typeof useCoachCounts>): { groups: NavGroup[]; footer: NavItem[] } {
  if (variant === "client") {
    return {
      groups: [{
        items: [
          ...clientTabs.slice(0, 4),
          { to: "/app/checkin", label: t("Check-in"), icon: ClipboardCheck },
          { to: "/app/messages", label: t("Messages"), icon: MessageSquare },
          { to: "/app/coach", label: t("My coach"), icon: HeartHandshake },
          { to: "/app/resources", label: t("Resources"), icon: BookOpen },
        ],
      }],
      footer: [{ to: "/app/profile", label: t("Profile"), icon: User }],
    };
  }

  return {
    groups: [
      {
        label: t("Coaching"),
        items: [
          { to: "/dashboard", label: t("Today"), icon: LayoutDashboard, exact: true },
          { to: "/dashboard/clients", label: t("Trainees"), icon: Users },
          { to: "/dashboard/checkins", label: t("Check-ins"), icon: ClipboardCheck, count: counts.pendingCheckins },
          { to: "/dashboard/progress", label: t("Progress"), icon: TrendingUp },
          { to: "/dashboard/messages", label: t("Messages"), icon: MessageSquare },
        ],
      },
      {
        label: t("Programs"),
        items: [
          { to: "/dashboard/workouts", label: t("Workout plans"), icon: Dumbbell },
          { to: "/dashboard/nutrition", label: t("Nutrition"), icon: Utensils },
          { to: "/dashboard/content", label: t("Content studio"), icon: Image },
        ],
      },
      {
        label: t("Business"),
        items: [
          { to: "/dashboard/requests", label: t("Requests"), icon: UserPlus, count: counts.pendingRequests },
          { to: "/dashboard/profile", label: t("Public profile"), icon: Contact },
          { to: "/dashboard/calendar", label: t("Calendar"), icon: Calendar },
          { to: "/dashboard/payments", label: t("Payments"), icon: CreditCard },
          { to: "/dashboard/reports", label: t("Reports"), icon: BarChart3 },
        ],
      },
    ],
    footer: [
      { to: "/dashboard/ai", label: t("AI assistant"), icon: Sparkles },
      { to: "/dashboard/settings", label: t("Settings"), icon: SlidersHorizontal },
    ],
  };
}

function isActive(pathname: string, item: NavItem) {
  return item.exact ? pathname === item.to : pathname.startsWith(item.to);
}

export function AppShell({ variant }: { variant: "coach" | "client" }) {
  const userName = currentUser() ?? (variant === "coach" ? t("Coach") : t("Trainee"));
  const counts = useCoachCounts(variant === "coach");
  const { groups, footer } = navFor(variant, counts);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const initials = userName.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();

  const renderItem = (item: NavItem) => {
    const active = isActive(pathname, item);
    const Icon = item.icon;
    return (
      <Link
        key={item.to + item.label}
        to={item.to}
        onClick={() => setMobileOpen(false)}
        title={collapsed ? item.label : undefined}
        aria-label={collapsed ? item.label : undefined}
        className={cn(
          "relative flex h-9 items-center gap-3 rounded-md px-3 text-sm transition-colors",
          collapsed && "lg:justify-center lg:px-0",
          active
            ? "bg-brand-gradient font-extrabold text-primary-foreground shadow-glow"
            : "font-medium text-muted-foreground hover:translate-x-0.5 hover:bg-sidebar-accent/60 hover:text-foreground rtl:hover:-translate-x-0.5",
        )}
      >
        <Icon className={cn("h-4 w-4 shrink-0", active && "text-primary-foreground")} strokeWidth={active ? 2.6 : 2} />
        <span className={cn("flex-1 truncate", collapsed && "lg:hidden")}>{item.label}</span>
        {!!item.count && (
          <span className={cn("grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-bold", active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-input text-foreground", collapsed && "lg:absolute lg:end-1 lg:top-0.5 lg:h-2 lg:min-w-2 lg:bg-primary lg:p-0 lg:text-[0px]")}>
            {item.count}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={cn(
          "fixed inset-y-0 start-0 z-40 flex w-60 flex-col gap-5 border-e border-sidebar-border bg-sidebar px-3 pb-4 pt-5 transition-[width,transform] duration-200",
          collapsed && "lg:w-[72px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full rtl:translate-x-full",
          "lg:translate-x-0 rtl:lg:translate-x-0",
        )}
      >
        <Link to={variant === "coach" ? "/dashboard" : "/app"} className={cn("flex items-center gap-2.5 px-2", collapsed && "lg:justify-center lg:px-0")}>
          <LogoMark />
          <span dir="ltr" className={cn("font-display text-[19px] font-extrabold uppercase", collapsed && "lg:hidden")}>Fitness<span className="text-volt">OS</span></span>
        </Link>

        <div className={cn("relative", collapsed && "lg:hidden")}>
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle-foreground" />
          <Input
            aria-label={variant === "coach" ? t("Search trainees, plans and exercises") : t("Search")}
            placeholder={variant === "coach" ? t("Search trainees…") : t("Search…")}
            className="h-10 border-border bg-card ps-9"
          />
        </div>

        <nav aria-label={variant === "coach" ? t("Coach navigation") : t("Trainee navigation")} className="-mx-1 flex flex-1 flex-col gap-5 overflow-y-auto px-1">
          {groups.map((group, index) => (
            <div key={group.label ?? index} className="flex flex-col gap-0.5">
              {group.label && (
                <div className={cn("px-3 pb-1.5 text-xs font-semibold text-subtle-foreground", collapsed && "lg:sr-only")}>{group.label}</div>
              )}
              {group.items.map(renderItem)}
            </div>
          ))}
        </nav>

        <div className="flex flex-col gap-0.5">
          {footer.map(renderItem)}
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? t("Expand sidebar") : t("Collapse sidebar")}
            className={cn(
              "hidden h-9 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-foreground lg:flex",
              collapsed && "lg:justify-center lg:px-0",
            )}
          >
            <ChevronsLeft className={cn("h-4 w-4 shrink-0 transition-transform rtl:rotate-180", collapsed && "rotate-180 rtl:rotate-0")} />
            {!collapsed && <span>{t("Collapse")}</span>}
          </button>
        </div>

        <div className={cn("flex items-center gap-2.5 border-t border-sidebar-border ps-2 pt-3.5", collapsed && "lg:flex-col lg:ps-0")}>
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary text-xs font-bold">{initials}</div>
          <div className={cn("min-w-0 flex-1", collapsed && "lg:hidden")}>
            <div className="truncate text-sm font-semibold">{userName}</div>
            <div className="truncate text-xs text-subtle-foreground">{variant === "coach" ? t("Coach") : t("Trainee")}</div>
          </div>
          <button
            type="button"
            aria-label={t("Log out")}
            title={t("Log out")}
            onClick={() => document.querySelector<HTMLFormElement>('#fitnessos-logout')?.requestSubmit()}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-subtle-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
          >
            <LogOut className="h-4 w-4 rtl:rotate-180" />
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-background/70 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <div className={cn("flex min-w-0 flex-1 flex-col transition-[padding] duration-200", collapsed ? "lg:ps-[72px]" : "lg:ps-60")}>
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur lg:hidden">
          <button
            type="button"
            aria-label={t("Open menu")}
            className="grid h-10 w-10 place-items-center rounded-md hover:bg-secondary"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <LogoMark className="h-7 w-7 rounded-lg" />
          <span dir="ltr" className="font-display text-lg font-extrabold uppercase">Fitness<span className="text-volt">OS</span></span>
        </header>

        <main className={cn("flex-1 px-4 py-6 md:px-10 md:py-9", variant === "client" && "pb-24 lg:pb-9")}>
          {previewPaths.has(pathname) && (
            <div role="note" className="mb-6 flex items-start gap-3 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
              {t("Preview screen: the data and controls on this page are sample content.")}
            </div>
          )}
          <Outlet />
        </main>
      </div>

      {variant === "client" && (
        <nav aria-label={t("Trainee tabs")} className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-sidebar-border bg-sidebar px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-1.5 lg:hidden">
          {clientTabs.map((item) => {
            const active = isActive(pathname, item);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn("flex min-h-[52px] flex-col items-center justify-center gap-1 text-[11px]", active ? "font-bold text-foreground" : "font-semibold text-subtle-foreground")}
              >
                <Icon className={cn("h-[22px] w-[22px]", active && "text-primary")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}

export function PageHeader({ title, description, actions, eyebrow }: { title: string; description?: string; actions?: ReactNode; eyebrow?: string }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <div className="mb-2 font-mono text-xs uppercase tracking-wider text-volt">{eyebrow}</div>}
        <h1 className="font-display text-3xl font-extrabold uppercase md:text-[38px] md:leading-[1.05]">{title}</h1>
        {description && <p className="mt-1.5 text-[15px] text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
