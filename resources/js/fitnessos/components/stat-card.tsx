import { Card } from "@fitnessos/components/ui/card";
import { ArrowDown, ArrowUp, Minus, type LucideIcon } from "lucide-react";
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
    <Card className="group relative overflow-hidden border-border/60 bg-card p-5 shadow-card-premium transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-glow">
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/10 blur-2xl transition group-hover:bg-primary/20" />
      <div className="flex items-start justify-between">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        {Icon && (
          <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20 transition group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      <div className="mt-3 text-2xl font-extrabold md:text-3xl">{value}</div>
      {delta && (
        <div className={cn("mt-1 flex items-center gap-1 text-xs", trendColor)}>
          <TrendIcon className="h-3 w-3" />
          <span>{delta}</span>
          {hint && <span className="ml-1 text-muted-foreground">{hint}</span>}
        </div>
      )}
    </Card>
  );
}

export function ChartCard({ title, description, children, actions }: { title: string; description?: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <Card className="relative overflow-hidden border-border/60 bg-card p-6 shadow-card-premium">
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-energy-gradient opacity-70" />
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold">{title}</h3>
          {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
        </div>
        {actions}
      </div>
      {children}
    </Card>
  );
}
