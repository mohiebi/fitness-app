import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, ExternalLink } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { PageHeader } from "@fitnessos/components/app-shell";
import { CoachAvatar } from "@fitnessos/components/coach-card";
import { Card } from "@fitnessos/components/ui/card";
import { Button } from "@fitnessos/components/ui/button";
import { Input } from "@fitnessos/components/ui/input";
import { Label } from "@fitnessos/components/ui/label";
import { Switch } from "@fitnessos/components/ui/switch";
import { Textarea } from "@fitnessos/components/ui/textarea";
import { getJson, postForm, putJson } from "@fitnessos/lib/api";
import { t } from "@fitnessos/lib/i18n";
import { formatNumber } from "@fitnessos/lib/format";
import { specialties, type CoachOwnProfile } from "@fitnessos/lib/marketplace";
import { cn } from "@fitnessos/lib/utils";

export const Route = createFileRoute("/dashboard/profile")({ component: ProfileEditor });

type Form = {
  slug: string; headline: string; bio: string; specialties: string[]; certifications: string;
  years_experience: string; city: string; languages: string; online: boolean; in_person: boolean;
  price_from: string; accepting_clients: boolean; max_clients: string; is_published: boolean;
};

function toForm(profile: CoachOwnProfile): Form {
  return {
    slug: profile.slug,
    headline: profile.headline ?? "",
    bio: profile.bio ?? "",
    specialties: profile.specialties,
    certifications: profile.certifications.join("\n"),
    years_experience: profile.years_experience?.toString() ?? "",
    city: profile.city ?? "",
    languages: profile.languages.join("، "),
    online: profile.online,
    in_person: profile.in_person,
    price_from: profile.price_from?.toString() ?? "",
    accepting_clients: profile.accepting_clients,
    max_clients: profile.max_clients?.toString() ?? "",
    is_published: profile.is_published,
  };
}

const lines = (value: string) => value.split("\n").map((line) => line.trim()).filter(Boolean);
const list = (value: string) => value.split(/[,،]/).map((item) => item.trim()).filter(Boolean);
const numberOrNull = (value: string) => (value.trim() === "" ? null : Number(value));

function ProfileEditor() {
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useQuery({
    queryKey: ["fitnessos", "coach-profile"],
    queryFn: () => getJson<CoachOwnProfile>("/fitnessos/coach-profile"),
  });
  const [form, setForm] = useState<Form | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ text: string; error: boolean } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile && !form) setForm(toForm(profile));
  }, [profile, form]);

  if (isLoading || !profile || !form) return <p className="text-sm text-muted-foreground">{t("Loading…")}</p>;

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((current) => current && { ...current, [key]: value });
  const toggleSpecialty = (key: string) => setForm((current) => current && {
    ...current,
    specialties: current.specialties.includes(key) ? current.specialties.filter((item) => item !== key) : [...current.specialties, key],
  });

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setNotice(null);
    try {
      const result = await putJson("/fitnessos/coach-profile", {
        slug: form.slug.trim(),
        headline: form.headline.trim() || null,
        bio: form.bio.trim() || null,
        specialties: form.specialties,
        certifications: lines(form.certifications),
        years_experience: numberOrNull(form.years_experience),
        city: form.city.trim() || null,
        languages: list(form.languages),
        online: form.online,
        in_person: form.in_person,
        price_from: numberOrNull(form.price_from),
        accepting_clients: form.accepting_clients,
        max_clients: numberOrNull(form.max_clients),
        is_published: form.is_published,
      }) as { message: string; profile: CoachOwnProfile };
      queryClient.setQueryData(["fitnessos", "coach-profile"], result.profile);
      setForm(toForm(result.profile));
      setNotice({ text: result.message, error: false });
    } catch (cause) {
      setNotice({ text: cause instanceof Error ? cause.message : t("The request failed."), error: true });
    } finally {
      setBusy(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    const data = new FormData();
    data.append("avatar", file);
    setNotice(null);
    try {
      await postForm("/fitnessos/coach-profile/avatar", data);
      await queryClient.invalidateQueries({ queryKey: ["fitnessos", "coach-profile"] });
    } catch (cause) {
      setNotice({ text: cause instanceof Error ? cause.message : t("The request failed."), error: true });
    }
  };

  const publicUrl = `${window.location.origin}/coaches/${profile.slug}`;

  return (
    <form onSubmit={save}>
      <PageHeader
        title={t("Public profile")}
        description={t("This is what trainees see before they request coaching with you.")}
        actions={<>
          {profile.is_published && (
            <Button asChild variant="outline"><Link to="/coaches/$slug" params={{ slug: profile.slug }} target="_blank">{t("View public page")}<ExternalLink /></Link></Button>
          )}
          <Button type="submit" disabled={busy}>{busy ? t("Saving…") : t("Save")}</Button>
        </>}
      />

      {notice && <p role={notice.error ? "alert" : "status"} className={cn("mb-4 text-sm", notice.error ? "text-destructive" : "text-volt")}>{notice.text}</p>}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
        <div className="flex flex-col gap-5">
          <Section title={t("Basics")}>
            <div className="flex items-center gap-4">
              <CoachAvatar coach={{ name: profile.name, avatar_url: profile.avatar_url }} className="h-20 w-20" />
              <div>
                <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) void uploadAvatar(file); e.target.value = ""; }} />
                <Button type="button" variant="outline" onClick={() => fileInput.current?.click()}><Camera />{t("Change photo")}</Button>
                <p className="mt-1.5 text-xs text-muted-foreground">{t("JPG or PNG, up to 2 MB.")}</p>
              </div>
            </div>
            <Field id="headline" label={t("Headline")} hint={t("One line about who you help, e.g. strength coach for busy beginners.")}>
              <Input id="headline" value={form.headline} maxLength={120} onChange={(e) => set("headline", e.target.value)} />
            </Field>
            <Field id="bio" label={t("About me")}>
              <Textarea id="bio" rows={6} value={form.bio} maxLength={5000} onChange={(e) => set("bio", e.target.value)} />
            </Field>
            <Field id="slug" label={t("Profile address")} hint={publicUrl}>
              <Input id="slug" dir="ltr" value={form.slug} onChange={(e) => set("slug", e.target.value.toLowerCase())} />
            </Field>
          </Section>

          <Section title={t("Specialties")}>
            <div className="flex flex-wrap gap-2" role="group" aria-label={t("Specialties")}>
              {Object.entries(specialties).map(([key, label]) => (
                <button key={key} type="button" aria-pressed={form.specialties.includes(key)} onClick={() => toggleSpecialty(key)}
                  className={cn("rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors",
                    form.specialties.includes(key) ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground")}>
                  {t(label)}
                </button>
              ))}
            </div>
            <Field id="certifications" label={t("Certifications")} hint={t("One per line. Verified coaches get a badge after we check them.")}>
              <Textarea id="certifications" rows={3} value={form.certifications} onChange={(e) => set("certifications", e.target.value)} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="years" label={t("Years of experience")}>
                <Input id="years" type="number" min={0} max={60} value={form.years_experience} onChange={(e) => set("years_experience", e.target.value)} />
              </Field>
              <Field id="languages" label={t("Languages")} hint={t("Separate with commas.")}>
                <Input id="languages" value={form.languages} onChange={(e) => set("languages", e.target.value)} />
              </Field>
            </div>
          </Section>

          <Section title={t("Where and how much")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="city" label={t("City")}>
                <Input id="city" value={form.city} onChange={(e) => set("city", e.target.value)} />
              </Field>
              <Field id="price" label={t("Monthly price from (toman)")}>
                <Input id="price" type="number" min={0} step={10000} value={form.price_from} onChange={(e) => set("price_from", e.target.value)} />
              </Field>
            </div>
            <Toggle id="online" label={t("Online coaching")} checked={form.online} onChange={(value) => set("online", value)} />
            <Toggle id="in-person" label={t("In-person sessions")} checked={form.in_person} onChange={(value) => set("in_person", value)} />
          </Section>
        </div>

        <div className="flex flex-col gap-5 xl:sticky xl:top-6">
          <Section title={t("Visibility")}>
            <Toggle id="published" label={t("Show my profile in the coach directory")} checked={form.is_published} onChange={(value) => set("is_published", value)} />
            <Toggle id="accepting" label={t("Accept new trainees")} checked={form.accepting_clients} onChange={(value) => set("accepting_clients", value)} />
            <Field id="max" label={t("Maximum trainees")} hint={t("Leave empty for no limit.")}>
              <Input id="max" type="number" min={1} value={form.max_clients} onChange={(e) => set("max_clients", e.target.value)} />
            </Field>
          </Section>
          <Card className="grid grid-cols-2 gap-4 p-5">
            <div><div className="text-xs text-subtle-foreground">{t("Active trainees")}</div><div className="mt-1 font-display text-3xl font-extrabold">{formatNumber(profile.active_clients)}</div></div>
            <div><div className="text-xs text-subtle-foreground">{t("Pending requests")}</div><div className="mt-1 font-display text-3xl font-extrabold">{formatNumber(profile.pending_requests)}</div></div>
          </Card>
          {!profile.verified && (
            <p className="text-xs text-muted-foreground">{t("Your profile is not verified yet. Contact support with your certificates to get the verified badge.")}</p>
          )}
        </div>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="flex flex-col gap-4 p-5 md:p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </Card>
  );
}

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground" dir="auto">{hint}</p>}
    </div>
  );
}

function Toggle({ id, label, checked, onChange }: { id: string; label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Label htmlFor={id} className="cursor-pointer font-normal">{label}</Label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
