import { Link } from "@tanstack/react-router";
import { Menu, Zap } from "lucide-react";
import { useState } from "react";
import { Button } from "@fitnessos/components/ui/button";

const links = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/coaching", label: "Coaching" },
  { to: "/transformations", label: "Results" },
  { to: "/resources", label: "Resources" },
  { to: "/contact", label: "Contact" },
];

export function PublicNav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 w-full px-4 pt-4">
      <div className="sport-pill mx-auto flex h-16 max-w-7xl items-center justify-between px-4 shadow-card-premium md:px-5">
        <Link to="/" className="group flex items-center gap-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-brand-gradient shadow-glow transition-transform group-hover:scale-110 group-hover:rotate-12">
            <Zap className="h-4 w-4 text-primary-foreground" strokeWidth={3} />
          </div>
          <span className="font-display text-lg font-extrabold uppercase">
            Fitness<span className="text-volt">OS</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-full px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground transition-all hover:bg-primary/10 hover:text-volt"
              activeProps={{ className: "rounded-full bg-primary/15 px-3 py-2 text-xs font-bold uppercase tracking-wider text-foreground" }}
              activeOptions={{ exact: true }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Button asChild variant="ghost" size="sm" className="text-xs uppercase tracking-wider">
            <a href="/portal">Dashboard</a>
          </Button>
          <Button asChild size="sm" className="bg-brand-gradient uppercase tracking-wider shadow-glow">
            <Link to="/apply">Apply →</Link>
          </Button>
        </div>
        <button className="grid h-10 w-10 place-items-center rounded-full bg-secondary md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          <Menu className="h-5 w-5" />
        </button>
      </div>
      {open && (
        <div className="mx-auto mt-3 max-w-7xl rounded-[2rem] border border-border bg-background/95 shadow-card-premium backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-3 px-6 py-5">
            {links.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="rounded-full px-3 py-2 text-sm font-bold uppercase tracking-wider text-muted-foreground hover:bg-primary/10 hover:text-volt">
                {l.label}
              </Link>
            ))}
            <a href="/portal" className="rounded-full px-3 py-2 text-sm font-bold uppercase tracking-wider text-muted-foreground hover:bg-primary/10 hover:text-volt">Dashboard</a>
            <Link to="/apply" onClick={() => setOpen(false)} className="rounded-full bg-brand-gradient px-4 py-3 text-center text-sm font-extrabold uppercase tracking-wider text-primary-foreground shadow-glow">
              Apply now
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-background px-4 pb-4">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-border bg-card/60">
      <div className="pointer-events-none select-none overflow-hidden border-b border-border py-6">
        <div className="flex whitespace-nowrap animate-marquee font-display text-6xl font-extrabold uppercase text-foreground/5 md:text-8xl">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="mx-8">Move Faster · FitnessOS · Win Daily ·</span>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-8 px-6 py-16 md:grid-cols-5">
        <div className="col-span-2">
          <div className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-brand-gradient shadow-glow">
              <Zap className="h-4 w-4 text-primary-foreground" strokeWidth={3} />
            </div>
            <span className="font-display text-lg font-extrabold uppercase">Fitness<span className="text-volt">OS</span></span>
          </div>
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            The high-energy coaching platform built for momentum, movement and daily wins.
          </p>
        </div>
        <FooterCol title="Product" links={[["Coaching", "/coaching"], ["Results", "/transformations"], ["Resources", "/resources"], ["Apply", "/apply"]]} />
        <FooterCol title="Company" links={[["About", "/about"], ["Contact", "/contact"]]} />
        <FooterCol title="Platform" links={[["Coach Dashboard", "/dashboard"], ["Client App", "/app"]]} />
      </div>
      <div className="border-t border-border/60">
        <div className="flex flex-col items-center justify-between gap-2 px-6 py-6 text-[10px] uppercase tracking-widest text-muted-foreground sm:flex-row">
          <span>© 2026 FitnessOS · All rights reserved</span>
          <span>Built for coaches who move people</span>
        </div>
      </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h4 className="text-[10px] font-bold uppercase tracking-widest text-volt">{title}</h4>
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        {links.map(([label, to]) => (
          <li key={to}>
            <Link to={to} className="hover:text-foreground">{label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
