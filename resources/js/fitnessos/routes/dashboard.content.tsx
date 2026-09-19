import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@fitnessos/components/app-shell";
import { Card } from "@fitnessos/components/ui/card";
import { Button } from "@fitnessos/components/ui/button";
import { Badge } from "@fitnessos/components/ui/badge";
import { Instagram, Youtube, Twitter, Sparkles, Calendar, Image as ImageIcon } from "lucide-react";

export const Route = createFileRoute("/dashboard/content")({ component: ContentStudio });

const posts = [
  { platform: "Instagram", type: "Reel", title: "3 mistakes killing your fat loss", status: "Scheduled", date: "Nov 12, 9:00", img: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400" },
  { platform: "Instagram", type: "Carousel", title: "The truth about protein timing", status: "Draft", date: "—", img: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400" },
  { platform: "YouTube", type: "Long-form", title: "How I lost 14kg with clients", status: "Published", date: "Nov 8", img: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400" },
  { platform: "Twitter", type: "Thread", title: "10 lessons from 500 clients", status: "Scheduled", date: "Nov 10, 12:00", img: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400" },
];

const icons: Record<string, any> = { Instagram, YouTube: Youtube, Twitter };

function ContentStudio() {
  return (
    <div>
      <PageHeader title="Content studio" description="Plan, generate and schedule your content across platforms."
        actions={<><Button variant="outline"><Sparkles className="mr-2 h-4 w-4" />Generate with AI</Button><Button>New post</Button></>} />

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        {[
          { l: "Scheduled", v: "12" }, { l: "Drafts", v: "5" }, { l: "Published (30d)", v: "24" }, { l: "Reach (30d)", v: "182k" },
        ].map(s => (
          <Card key={s.l} className="border-border/60 bg-card p-5 shadow-card-premium">
            <div className="text-sm font-medium text-muted-foreground">{s.l}</div>
            <div className="mt-2 text-2xl font-semibold">{s.v}</div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {posts.map(p => {
          const Icon = icons[p.platform];
          return (
            <Card key={p.title} className="overflow-hidden border-border/60 bg-card shadow-card-premium transition">
              <div className="aspect-square overflow-hidden"><img src={p.img} className="h-full w-full object-cover" alt={p.title} /></div>
              <div className="p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5" /><span>{p.platform} · {p.type}</span></div>
                <h4 className="mt-2 line-clamp-2 text-sm font-medium">{p.title}</h4>
                <div className="mt-3 flex items-center justify-between">
                  <Badge className={p.status === "Published" ? "bg-primary/15 text-primary" : p.status === "Scheduled" ? "bg-chart-2/15 text-chart-2" : "bg-muted text-muted-foreground"}>{p.status}</Badge>
                  <span className="text-xs text-muted-foreground">{p.date}</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6 border-primary/30 bg-card p-8">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">AI content generator</h3>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Generate a full week of on-brand posts in seconds. Pulls from your client wins, blog articles and program library.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {["Reels script","Instagram carousel","Twitter thread","Email newsletter","Client win post"].map(t => (
            <Badge key={t} variant="outline" className="cursor-pointer border-primary/30 bg-primary/10">{t}</Badge>
          ))}
        </div>
      </Card>
    </div>
  );
}
