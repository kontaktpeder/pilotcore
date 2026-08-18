import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, CalendarRange, ClipboardList, Snowflake } from "lucide-react";
import { AppShell, Stat } from "@/components/pilot/shell";
import {
  DayStatusSheet,
  DeviationSheet,
  ThawSheet,
  WeeklySheet,
} from "@/components/pilot/actions";
import { formatDeadline, perVariant, summarize, urgentLots, usePilot } from "@/lib/pilot/store";
import { variantName } from "@/lib/pilot/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pilot Core – Sted | Gold of Sicily" },
      {
        name: "description",
        content:
          "Rask registrering av uttak fra fryser, dagens status, ukentlig oppsummering og avvik for piloten hos Oslo Bar og Bowling.",
      },
      { property: "og:title", content: "Pilot Core – Sted | Gold of Sicily" },
      {
        property: "og:description",
        content: "Loggføring, automatiske beregninger og varsler for pilotdriften.",
      },
    ],
  }),
  component: StedView,
});

function StedView() {
  const { state, hydrated } = usePilot();
  const [sheet, setSheet] = useState<null | "thaw" | "day" | "week" | "dev">(null);
  const sum = summarize(state);
  const variants = perVariant(state);
  const urgent = urgentLots(state, state.settings.shelfLifeHours);

  return (
    <AppShell>
      <button
        type="button"
        onClick={() => setSheet("dev")}
        className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-destructive px-4 text-base font-semibold text-destructive-foreground"
      >
        <AlertTriangle className="h-5 w-5" /> Rapporter avvik
      </button>

      <div className="mt-4 space-y-3">
        <ActionCard
          icon={<Snowflake className="h-6 w-6" />}
          title="Jeg tar ut varer fra fryseren"
          sub="~10 sekunder · batch og frist settes automatisk"
          onClick={() => setSheet("thaw")}
        />
        <ActionCard
          icon={<ClipboardList className="h-6 w-6" />}
          title="Dagens status"
          sub="Under ett minutt · ved stengetid"
          onClick={() => setSheet("day")}
        />
        <ActionCard
          icon={<CalendarRange className="h-6 w-6" />}
          title="Ukentlig oppsummering"
          sub="~2 minutter · erstatter separat ukesrapport"
          onClick={() => setSheet("week")}
        />
      </div>

      <h2 className="mt-6 mb-2 text-base font-semibold">Slik ligger uken an</h2>
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Omsetning" value={`${sum.revenue.toLocaleString("nb-NO")} kr`} />
        <Stat label="Solgt" value={`${sum.sold} stk`} sub={`av ${state.settings.weeklyVolume}/uke`} />
        <Stat label="Fryselager" value={`${sum.freezer} stk`} tone="olive" />
        <Stat label="Tint nå" value={`${sum.thawedRemaining} stk`} />
        <Stat label="Svinn" value={`${sum.wastePct.toFixed(1)} %`} tone="tomato" />
        <Stat label="Salgsgrad" value={`${sum.sellThroughPct.toFixed(0)} %`} />
      </div>

      <h2 className="mt-6 mb-2 text-base font-semibold">Må brukes snart</h2>
      <div className="surface-card divide-y divide-border">
        {hydrated && urgent.length > 0 ? (
          urgent.map((l) => (
            <div key={l.id} className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="font-medium">{variantName(l.variant)}</p>
                <p className="text-xs text-muted-foreground">
                  {l.qty - l.sold - l.discarded} stk · batch {l.batchCode}
                </p>
              </div>
              <span className="text-sm font-semibold text-tomato">
                {formatDeadline(l.deadlineAt)}
              </span>
            </div>
          ))
        ) : (
          <p className="p-4 text-sm text-muted-foreground">Ingenting nær frist akkurat nå.</p>
        )}
      </div>

      <h2 className="mt-6 mb-2 text-base font-semibold">Beholdning per variant</h2>
      <div className="surface-card divide-y divide-border">
        {variants.map((v) => (
          <div key={v.id} className="flex items-center justify-between p-4">
            <p className="font-medium">{v.name}</p>
            <p className="text-sm text-muted-foreground">
              {v.freezer} fryst · {v.thawed} tint · {v.sold} solgt
            </p>
          </div>
        ))}
      </div>

      <ThawSheet open={sheet === "thaw"} onOpenChange={(o) => setSheet(o ? "thaw" : null)} />
      <DayStatusSheet open={sheet === "day"} onOpenChange={(o) => setSheet(o ? "day" : null)} />
      <WeeklySheet open={sheet === "week"} onOpenChange={(o) => setSheet(o ? "week" : null)} />
      <DeviationSheet open={sheet === "dev"} onOpenChange={(o) => setSheet(o ? "dev" : null)} />
    </AppShell>
  );
}

function ActionCard({
  icon,
  title,
  sub,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="surface-card flex min-h-20 w-full items-center gap-4 p-4 text-left active:scale-[0.99]"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blush text-foreground">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="font-display block text-lg leading-tight font-semibold">{title}</span>
        <span className="block text-xs text-muted-foreground">{sub}</span>
      </span>
    </button>
  );
}
