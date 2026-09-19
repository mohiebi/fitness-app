import { Zap } from "lucide-react";
import { cn } from "@fitnessos/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <div className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-gradient text-primary-foreground shadow-glow", className)}>
      <Zap className="h-[17px] w-[17px]" strokeWidth={3} />
    </div>
  );
}
