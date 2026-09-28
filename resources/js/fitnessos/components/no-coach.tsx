import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { HeartHandshake } from "lucide-react";
import { Button } from "@fitnessos/components/ui/button";
import { Card } from "@fitnessos/components/ui/card";
import { getJson } from "@fitnessos/lib/api";
import { t } from "@fitnessos/lib/i18n";
import type { MyCoaching } from "@fitnessos/lib/marketplace";

export function useMyCoaching() {
  return useQuery({
    queryKey: ["fitnessos", "my-coaching"],
    queryFn: () => getJson<MyCoaching>("/fitnessos/my-coaching"),
  });
}

/** Shown to trainees in place of coach-only features until a coach accepts them. */
export function NoCoachCard({ pendingCoachName }: { pendingCoachName?: string }) {
  return (
    <Card className="flex flex-col items-start gap-4 border-primary/30 bg-hero-gradient p-6">
      <HeartHandshake className="h-8 w-8 text-volt" />
      <div>
        <h2 className="font-display text-2xl font-extrabold">
          {pendingCoachName ? t("Waiting for :name to accept", { name: pendingCoachName }) : t("Find your coach to get started")}
        </h2>
        <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
          {pendingCoachName
            ? t("Chat, check-ins and your plan unlock as soon as the coach accepts your request.")
            : t("Chat, check-ins and your plan unlock once a coach accepts you. Browse coaches and send a request.")}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {pendingCoachName
          ? <Button asChild variant="outline"><Link to="/app/coach">{t("View request")}</Link></Button>
          : <Button asChild><Link to="/coaches">{t("Browse coaches")}</Link></Button>}
        <Button asChild variant="ghost"><Link to="/app/profile">{t("Complete my intake profile")}</Link></Button>
      </div>
    </Card>
  );
}
