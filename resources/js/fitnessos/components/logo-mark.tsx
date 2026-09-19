import { Zap } from "lucide-react";
import { cn } from "@fitnessos/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <div className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-[9px] bg-primary text-primary-foreground", className)}>
      <Zap className="h-[18px] w-[18px]" strokeWidth={2.4} />
    </div>
  );
}
