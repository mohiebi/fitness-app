import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard, Users, UserPlus, Dumbbell, Utensils, ClipboardCheck, TrendingUp,
  MessageSquare, Calendar, CreditCard, Sparkles, Palette, BarChart3, Settings, Search,
  Bell, ChevronsLeft, Menu, Dumbbell as Logo, Home, Apple, LineChart, User, LogOut,
} from "lucide-react";
import { Button } from "@fitnessos/components/ui/button";
import { Input } from "@fitnessos/components/ui/input";
import { Avatar, AvatarFallback } from "@fitnessos/components/ui/avatar";
import { cn } from "@fitnessos/lib/utils";
import { currentUser } from "@fitnessos/lib/auth";

const coachNav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/leads", label: "Leads", icon: UserPlus },
  { to: "/dashboard/clients", label: "Clients", icon: Users },
  { to: "/dashboard/workouts", label: "Workout Plans", icon: Dumbbell },
  { to: "/dashboard/nutrition", label: "Nutrition", icon: Utensils },
  { to: "/dashboard/checkins", label: "Check-ins", icon: ClipboardCheck },
  { to: "/dashboard/progress", label: "Progress", icon: TrendingUp },
  { to: "/dashboard/messages", label: "Messages", icon: MessageSquare },
  { to: "/dashboard/calendar", label: "Calendar", icon: Calendar },
  { to: "/dashboard/payments", label: "Payments", icon: CreditCard },
  { to: "/dashboard/content", label: "Content Studio", icon: Palette },
  { to: "/dashboard/ai", label: "AI Assistant", icon: Sparkles },
  { to: "/dashboard/reports", label: "Reports", icon: BarChart3 },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
];

const clientNav = [
  { to: "/app", label: "Today", icon: Home, exact: true },
  { to: "/app/workout", label: "Workout", icon: Dumbbell },
  { to: "/app/nutrition", label: "Nutrition", icon: Apple },
  { to: "/app/progress", label: "Progress", icon: LineChart },
  { to: "/app/checkin", label: "Check-in", icon: ClipboardCheck },
  { to: "/app/messages", label: "Messages", icon: MessageSquare },
  { to: "/app/resources", label: "Resources", icon: Palette },
  { to: "/app/profile", label: "Profile", icon: User },
];

const previewPaths = new Set([
  '/dashboard/workouts', '/dashboard/nutrition', '/dashboard/progress',
  '/dashboard/calendar', '/dashboard/payments', '/dashboard/content',
  '/dashboard/ai', '/dashboard/reports', '/dashboard/settings',
  '/app/workout', '/app/nutrition', '/app/resources',
]);

export function AppShell({ variant }: { variant: "coach" | "client" }) {
  const userName = currentUser() ?? (variant === "coach" ? "Coach" : "Client");
  const nav = variant === "coach" ? coachNav : clientNav;
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-sidebar-border bg-sidebar/95 shadow-glow backdrop-blur-xl transition-all duration-300 lg:m-3 lg:rounded-[2rem] lg:border",
          collapsed ? "w-16" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0",
        )}
      >
        <div className="flex h-20 items-center gap-2 border-b border-sidebar-border px-4">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-gradient shadow-glow">
            <Logo className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="truncate font-display text-sm font-extrabold uppercase">FitnessOS</div>
              <div className="truncate text-[10px] uppercase tracking-wider text-muted-foreground">
                {variant === "coach" ? "Coach" : "Client"}
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          {nav.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "group my-1 flex items-center gap-3 rounded-full px-3 py-2.5 text-sm font-semibold transition-all duration-300",
                  active
                    ? "bg-brand-gradient text-primary-foreground shadow-glow"
                    : "text-sidebar-foreground/70 hover:translate-x-1 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
                {!collapsed && active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <div className="sport-pill flex items-center gap-3 p-2">
            <Avatar className="h-9 w-9 border border-primary/30">
              <AvatarFallback>{userName.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase()}</AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{userName}</div>
                <div className="truncate text-xs text-muted-foreground">{variant === "coach" ? "Coach" : "Client"}</div>
              </div>
            )}
            {!collapsed && (
              <button onClick={() => setCollapsed(true)} className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary">
                <ChevronsLeft className="h-4 w-4" />
              </button>
            )}
          </div>
          {collapsed && (
            <button
              onClick={() => setCollapsed(false)}
              className="mt-2 flex w-full items-center justify-center rounded-full p-2 text-muted-foreground hover:bg-sidebar-accent"
            >
              <ChevronsLeft className="h-4 w-4 rotate-180" />
            </button>
          )}
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-background/60 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <div className={cn("flex flex-1 flex-col transition-all", collapsed ? "lg:pl-24" : "lg:pl-72")}>
        <header className="sticky top-0 z-20 mx-3 mt-3 flex h-16 items-center gap-3 rounded-full border border-border/60 bg-background/70 px-4 shadow-card-premium backdrop-blur-xl md:px-6">
          <button className="grid h-10 w-10 place-items-center rounded-full bg-secondary lg:hidden" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="relative hidden max-w-md flex-1 md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search clients, plans, exercises…" className="h-10 rounded-full border-border/60 bg-card/70 pl-9" />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
            </Button>
            <Button size="sm" variant="outline" className="rounded-full" onClick={() => {
              document.querySelector<HTMLFormElement>('#fitnessos-logout')?.requestSubmit();
            }}>
              <LogOut className="mr-2 h-4 w-4" /> Log out
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8">
          {previewPaths.has(pathname) && (
            <div role="note" className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-foreground">
              Preview screen: the data and controls on this page are sample content.
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-normal md:text-4xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
