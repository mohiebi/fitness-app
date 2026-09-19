import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@fitnessos/components/ui/button";
import { LogoMark } from "@fitnessos/components/logo-mark";
import { isAuthenticated } from "@fitnessos/lib/auth";

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
  const portalLabel = isAuthenticated() ? "Open app" : "Log in";
  return (
    <header className="sticky top-0 z-40 w-full px-4 pt-4">
      <div className="sport-pill mx-auto flex h-16 max-w-7xl items-center justify-between px-4 shadow-card-premium md:px-5">
        <Link to="/" className="group flex items-center gap-2.5">
          <LogoMark className="h-10 w-10 transition-transform group-hover:rotate-12 group-hover:scale-110" />
          <span className="font-display text-lg font-extrabold uppercase">
            Fitness<span className="text-volt">OS</span>
          </span>
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
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
            <a href="/portal">{portalLabel}</a>
          </Button>
          <Button asChild size="sm" className="uppercase tracking-wider">
            <Link to="/apply">Apply →</Link>
          </Button>
        </div>
        <button
          type="button"
          className="grid h-11 w-11 place-items-center rounded-full bg-secondary md:hidden"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <nav aria-label="Main" className="mx-auto mt-3 max-w-7xl rounded-[2rem] border border-border bg-background/95 shadow-card-premium backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-2 px-6 py-5">
            {links.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="rounded-full px-3 py-2.5 text-sm font-bold uppercase tracking-wider text-muted-foreground hover:bg-primary/10 hover:text-volt">
                {l.label}
              </Link>
            ))}
            <a href="/portal" className="rounded-full px-3 py-2.5 text-sm font-bold uppercase tracking-wider text-muted-foreground hover:bg-primary/10 hover:text-volt">{portalLabel}</a>
            <Button asChild size="lg" className="mt-1 uppercase tracking-wider">
              <Link to="/apply" onClick={() => setOpen(false)}>Apply now</Link>
            </Button>
          </div>
        </nav>
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
            <div className="flex items-center gap-2.5">
              <LogoMark className="h-10 w-10" />
              <span className="font-display text-lg font-extrabold uppercase">Fitness<span className="text-volt">OS</span></span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Training, nutrition and weekly check-ins with your coach, in one app.
            </p>
          </div>
          <FooterCol title="Coaching" links={[["Programs", "/coaching"], ["Results", "/transformations"], ["Resources", "/resources"], ["Apply", "/apply"]]} />
          <FooterCol title="Company" links={[["About", "/about"], ["Contact", "/contact"]]} />
          <FooterCol title="Sign in" links={[["Coach dashboard", "/dashboard"], ["Client app", "/app"]]} />
        </div>
        <div className="border-t border-border/60">
          <div className="flex flex-col items-center justify-between gap-2 px-6 py-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground sm:flex-row">
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
      <ul className="mt-3 space-y-2.5 text-sm text-muted-foreground">
        {links.map(([label, to]) => (
          <li key={to}>
            <Link to={to} className="hover:text-foreground">{label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
