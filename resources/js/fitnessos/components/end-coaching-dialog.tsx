import { useState } from "react";
import { Button } from "@fitnessos/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@fitnessos/components/ui/dialog";
import { Label } from "@fitnessos/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@fitnessos/components/ui/radio-group";
import { postJson } from "@fitnessos/lib/api";
import { t } from "@fitnessos/lib/i18n";
import { endReasons } from "@fitnessos/lib/marketplace";

/** Confirms ending an active coaching, asking why. Used by both coach and trainee. */
export function EndCoachingDialog({ open, onOpenChange, coachingId, title, description, onEnded }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coachingId: number;
  title: string;
  description: string;
  onEnded: () => void | Promise<void>;
}) {
  const [reason, setReason] = useState(endReasons[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await postJson(`/fitnessos/coachings/${coachingId}/end`, { reason });
      onOpenChange(false);
      await onEnded();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("The request failed."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <fieldset className="grid gap-3">
          <legend className="mb-2 text-sm font-semibold">{t("Reason")}</legend>
          <RadioGroup value={reason} onValueChange={setReason}>
            {endReasons.map((option) => (
              <div key={option} className="flex items-center gap-2">
                <RadioGroupItem value={option} id={`reason-${option}`} />
                <Label htmlFor={`reason-${option}`} className="cursor-pointer font-normal">{t(option)}</Label>
              </div>
            ))}
          </RadioGroup>
        </fieldset>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("Keep coaching")}</Button>
          <Button variant="destructive" disabled={busy} onClick={() => void confirm()}>{busy ? t("Ending…") : t("End coaching")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
