import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@fitnessos/components/ui/button";
import { LogoMark } from "@fitnessos/components/logo-mark";
import { isAuthenticated } from "@fitnessos/lib/auth";

const links = [
  { to: "/coaching", label: "Coaching" },
  { to: "/transformations", label: "Results" },
  { to: "/about", label: "About" },
  { to: "/resources", label: "Resources" },
  { to: "/contact", label: "Contact" },
];

export function PublicNav() {
  const [open, setOpen] = useState(false);
  const portalLabel = isAuthenticated() ? "Open app" : "Log in";
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center gap-10 px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <LogoMark />
          <span className="font-display text-[19px] font-bold tracking-tight">FitnessOS</span>
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-[15px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto hidden items-center gap-5 md:flex">
          <a href="/portal" className="text-[15px] font-semibold text-foreground hover:underline">{portalLabel}</a>
          <Button asChild>
            <Link to="/apply">Apply</Link>
          </Button>
        </div>
        <button
          type="button"
          className="ml-auto grid h-11 w-11 place-items-center rounded-md hover:bg-secondary md:hidden"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <nav aria-label="Main" className="border-t border-border px-6 pb-6 pt-2 md:hidden">
          {links.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="block border-b border-border py-3.5 text-base font-semibold text-muted-foreground hover:text-foreground">
              {l.label}
            </Link>
          ))}
          <a href="/portal" className="block py-3.5 text-base font-semibold">{portalLabel}</a>
          <Button asChild size="lg" className="mt-2 w-full">
            <Link to="/apply" onClick={() => setOpen(false)}>Apply for coaching</Link>
          </Button>
        </nav>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 py-14 md:grid-cols-5">
        <div className="col-span-2">
          <div className="flex items-center gap-2.5">
            <LogoMark />
            <span className="font-display text-[19px] font-bold tracking-tight">FitnessOS</span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Training, nutrition and weekly check-ins with your coach, in one app.
          </p>
        </div>
        <FooterCol title="Coaching" links={[["Programs", "/coaching"], ["Results", "/transformations"], ["Resources", "/resources"], ["Apply", "/apply"]]} />
        <FooterCol title="Company" links={[["About", "/about"], ["Contact", "/contact"]]} />
        <FooterCol title="Sign in" links={[["Coach dashboard", "/dashboard"], ["Client app", "/app"]]} />
      </div>
      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-6 text-[13px] text-subtle-foreground">© 2026 FitnessOS</div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
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
