import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Settings2 } from "lucide-react";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const tab = pathname.startsWith("/leverandor") ? "leverandor" : "sted";

  return (
    <div className="app-shell bg-background">
      <header className="safe-top border-b border-border bg-cream px-4 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-display text-xs tracking-[0.2em] text-muted-foreground uppercase">
              Gold of Sicily
            </p>
            <h1 className="font-display text-xl leading-tight font-semibold text-foreground">
              Pilot Core
            </h1>
          </div>
          <Link
            to="/innstillinger"
            aria-label="Innstillinger"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground"
          >
            <Settings2 className="h-5 w-5" />
          </Link>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-1 rounded-full bg-secondary p-1">
          <Link
            to="/"
            className={`flex h-10 items-center justify-center rounded-full text-sm font-semibold ${
              tab === "sted" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            Sted
          </Link>
          <Link
            to="/leverandor"
            className={`flex h-10 items-center justify-center rounded-full text-sm font-semibold ${
              tab === "leverandor" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            Leverandør
          </Link>
        </div>
      </header>
      <main className="app-scroll px-4 pt-4">{children}</main>
    </div>
  );
}

export function Stat({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "olive" | "tomato";
}) {
  const toneClass =
    tone === "olive" ? "text-olive" : tone === "tomato" ? "text-tomato" : "text-foreground";
  return (
    <div className="surface-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`font-display text-2xl font-semibold ${toneClass}`}>{value}</p>
      {sub ? <p className="text-xs text-muted-foreground">{sub}</p> : null}
    </div>
  );
}
