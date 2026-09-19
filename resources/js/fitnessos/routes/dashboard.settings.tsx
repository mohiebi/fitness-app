import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@fitnessos/components/app-shell";
import { Card } from "@fitnessos/components/ui/card";
import { Button } from "@fitnessos/components/ui/button";
import { Input } from "@fitnessos/components/ui/input";
import { Label } from "@fitnessos/components/ui/label";
import { Switch } from "@fitnessos/components/ui/switch";
import { Badge } from "@fitnessos/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@fitnessos/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@fitnessos/components/ui/tabs";
import { coach } from "@fitnessos/lib/mock-data";
import { Send, Palette, CreditCard, Users } from "lucide-react";

export const Route = createFileRoute("/dashboard/settings")({ component: Settings });

function Settings() {
  return (
    <div>
      <PageHeader title="Settings" description="Manage your business, branding and team." />

      <Tabs defaultValue="business">
        <TabsList className="mb-6 flex-wrap">
          {["business","branding","ai","integrations","notifications","subscription","team"].map(t => (
            <TabsTrigger key={t} value={t} className="capitalize">{t}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="business">
          <Card className="border-border/60 bg-card p-6 shadow-card-premium">
            <h3 className="mb-4 font-semibold">Business information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Business name" v="Rivera Coaching" />
              <Field label="Website" v="riveracoaching.com" />
              <Field label="Support email" v="hello@riveracoaching.com" />
              <Field label="Timezone" v="America/Los_Angeles" />
            </div>
            <Button className="mt-6">Save changes</Button>
          </Card>
        </TabsContent>

        <TabsContent value="branding">
          <Card className="border-border/60 bg-card p-6 shadow-card-premium">
            <div className="flex items-center gap-2 mb-4"><Palette className="h-4 w-4 text-primary" /><h3 className="font-semibold">Branding</h3></div>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16"><AvatarImage src={coach.avatar} /><AvatarFallback>R</AvatarFallback></Avatar>
              <div><Button variant="outline" size="sm">Upload logo</Button><div className="mt-1 text-xs text-muted-foreground">PNG or SVG, up to 2MB</div></div>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Field label="Primary color" v="#10B981" />
              <Field label="Accent color" v="#3B82F6" />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="ai">
          <Card className="border-border/60 bg-card p-6 shadow-card-premium">
            <h3 className="mb-4 font-semibold">AI preferences</h3>
            {[
              ["Tone matching","AI writes replies in your voice"],
              ["Auto-summarize check-ins","Add AI summary to every check-in"],
              ["Program suggestions","AI can propose plan adjustments after check-ins"],
              ["Content drafts","Weekly Instagram post drafts based on client wins"],
            ].map(([t, d]) => (
              <div key={t} className="flex items-center justify-between border-t border-border/60 py-3 first:border-t-0">
                <div><div className="text-sm font-medium">{t}</div><div className="text-xs text-muted-foreground">{d}</div></div>
                <Switch defaultChecked />
              </div>
            ))}
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <Card className="border-border/60 bg-card p-6 shadow-card-premium">
            <h3 className="mb-4 font-semibold">Integrations</h3>
            {[
              { name: "Telegram", desc: "Get client notifications in Telegram", icon: Send, connected: true },
              { name: "Stripe", desc: "Process subscription payments", icon: CreditCard, connected: true },
              { name: "MyFitnessPal", desc: "Sync client nutrition logs", icon: Users, connected: false },
            ].map(i => (
              <div key={i.name} className="flex items-center gap-4 border-t border-border/60 py-4 first:border-t-0">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><i.icon className="h-4 w-4" /></div>
                <div className="flex-1"><div className="font-medium">{i.name}</div><div className="text-xs text-muted-foreground">{i.desc}</div></div>
                {i.connected ? <Badge className="bg-primary/15 text-primary">Connected</Badge> : <Button variant="outline" size="sm">Connect</Button>}
              </div>
            ))}
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="border-border/60 bg-card p-6 shadow-card-premium">
            <h3 className="mb-4 font-semibold">Notifications</h3>
            {["New check-in","Missed workout","New lead","Payment received","Package expiring"].map(n => (
              <div key={n} className="flex items-center justify-between border-t border-border/60 py-3 first:border-t-0">
                <span className="text-sm">{n}</span>
                <div className="flex gap-3"><Switch defaultChecked /><span className="text-xs text-muted-foreground">Email · Push</span></div>
              </div>
            ))}
          </Card>
        </TabsContent>

        <TabsContent value="subscription">
          <Card className="border-primary/30 bg-card p-8">
            <Badge className="bg-primary/15 text-primary">Pro plan</Badge>
            <h3 className="mt-3 text-2xl font-semibold">$199/mo</h3>
            <p className="mt-2 text-sm text-muted-foreground">75 clients, AI Assistant, Content Studio and priority support.</p>
            <div className="mt-6 flex gap-2"><Button variant="outline">Manage plan</Button><Button>Upgrade to Elite</Button></div>
          </Card>
        </TabsContent>

        <TabsContent value="team">
          <Card className="border-border/60 bg-card p-6 shadow-card-premium">
            <div className="mb-4 flex items-center justify-between"><h3 className="font-semibold">Team members</h3><Button size="sm">Invite</Button></div>
            {[
              { name: coach.name, role: "Owner", img: coach.avatar },
              { name: "Emma Riley", role: "Coach", img: "https://i.pravatar.cc/80?img=45" },
              { name: "Jonas Weber", role: "Admin", img: "https://i.pravatar.cc/80?img=52" },
            ].map(m => (
              <div key={m.name} className="flex items-center gap-3 border-t border-border/60 py-3 first:border-t-0">
                <Avatar><AvatarImage src={m.img} /><AvatarFallback>{m.name[0]}</AvatarFallback></Avatar>
                <div className="flex-1"><div className="text-sm font-medium">{m.name}</div><div className="text-xs text-muted-foreground">{m.role}</div></div>
                <Badge variant="secondary">Active</Badge>
              </div>
            ))}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({ label, v }: { label: string; v: string }) {
  return <div><Label className="mb-2 block">{label}</Label><Input defaultValue={v} /></div>;
}
