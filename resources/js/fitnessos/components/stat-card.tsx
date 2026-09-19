import { Link } from "@tanstack/react-router";
import { Card } from "@fitnessos/components/ui/card";
import { ArrowDown, ArrowRight, ArrowUp, Minus, type LucideIcon } from "lucide-react";
import { cn } from "@fitnessos/lib/utils";
import type { ReactNode } from "react";

export function StatCard({
  label, value, delta, trend, icon: Icon, hint,
}: {
  label: string;
  value: string | number;
  delta?: string;
  trend?: "up" | "down" | "flat";
  icon?: LucideIcon;
  hint?: string;
}) {
  const TrendIcon = trend === "up" ? ArrowUp : trend === "down" ? ArrowDown : Minus;
  const trendColor = trend === "up" ? "text-primary" : trend === "down" ? "text-destructive" : "text-muted-foreground";
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm font-semibold text-muted-foreground">{label}</div>
        {Icon && (
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      <div className="mt-3 font-display text-3xl font-extrabold tabular-nums md:text-4xl">{value}</div>
      {delta && (
        <div className={cn("mt-1.5 flex items-center gap-1 font-mono text-xs", trendColor)}>
          <TrendIcon className="h-3 w-3" />
          <span>{delta}</span>
          {hint && <span className="ml-1 text-subtle-foreground">{hint}</span>}
        </div>
      )}
    </Card>
  );
}

export function ActionTile({
  label, value, meta, action, to, tone = "default",
}: {
  label: string;
  value: number;
  meta?: string;
  action: string;
  to: string;
  tone?: "default" | "alert";
}) {
  return (
    <Card className="flex flex-col gap-3 px-5 py-[18px]">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          {tone === "alert" && value > 0 && <span className="h-2 w-2 rounded-full bg-destructive" />}
          {label}
        </span>
        {meta && <span className="font-mono text-[11px] text-subtle-foreground">{meta}</span>}
      </div>
      <div className={cn("font-display text-[44px] font-extrabold leading-none tabular-nums", tone === "alert" && value > 0 && "text-destructive")}>{value}</div>
      <Link to={to} className="inline-flex min-h-6 items-center gap-1.5 self-start text-sm font-bold text-primary hover:underline">
        {action} <ArrowRight className="h-[15px] w-[15px]" strokeWidth={2.4} />
      </Link>
    </Card>
  );
}

export function ChartCard({ title, description, children, actions }: { title: string; description?: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <Card className="relative overflow-hidden p-6">
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-energy-gradient opacity-70" />
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions}
      </div>
      {children}
    </Card>
  );
}
