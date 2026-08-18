import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createSeedState, dateKey, weekKey } from "./seed";
import type {
  Batch,
  DayStatus,
  Deviation,
  PilotState,
  Settings,
  ThawLot,
  Variant,
  WeeklyObservation,
} from "./types";
import { VARIANTS } from "./types";

const STORAGE_KEY = "pilot-core-v1";

function load(): PilotState {
  if (typeof window === "undefined") return createSeedState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as PilotState;
  } catch {
    /* ignore */
  }
  return createSeedState();
}

const id = () => Math.random().toString(36).slice(2, 10);

interface Ctx {
  state: PilotState;
  hydrated: boolean;
  freezerStock: (v: Variant) => number;
  thawedStock: (v: Variant) => number;
  nextBatch: (v: Variant) => Batch | undefined;
  openLots: ThawLot[];
  thaw: (input: { variant: Variant; qty: number; batchId?: string }) => ThawLot | null;
  saveDayStatus: (input: {
    lines: DayStatus["lines"];
    priceOverride?: number | null;
    discountNote?: string;
    workflow: DayStatus["workflow"];
    comment?: string;
  }) => void;
  saveWeekly: (input: Omit<WeeklyObservation, "id" | "createdAt" | "weekKey">) => void;
  saveDeviation: (input: Omit<Deviation, "id" | "createdAt" | "notified">) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  reset: () => void;
}

const PilotContext = createContext<Ctx | null>(null);

export function PilotProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PilotState>(() => createSeedState());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(load());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const freezerStock = useCallback(
    (v: Variant) =>
      state.batches.filter((b) => b.variant === v).reduce((s, b) => s + (b.qty - b.used), 0),
    [state.batches],
  );

  const thawedStock = useCallback(
    (v: Variant) =>
      state.thawLots
        .filter((l) => l.variant === v)
        .reduce((s, l) => s + (l.qty - l.sold - l.discarded), 0),
    [state.thawLots],
  );

  // FIFO: eldste batch med gjenværende beholdning
  const nextBatch = useCallback(
    (v: Variant) =>
      state.batches
        .filter((b) => b.variant === v && b.qty - b.used > 0)
        .sort((a, b) => a.deliveredAt.localeCompare(b.deliveredAt))[0],
    [state.batches],
  );

  const openLots = useMemo(
    () =>
      state.thawLots
        .filter((l) => l.qty - l.sold - l.discarded > 0)
        .sort((a, b) => a.deadlineAt.localeCompare(b.deadlineAt)),
    [state.thawLots],
  );

  const thaw: Ctx["thaw"] = useCallback(
    ({ variant, qty, batchId }) => {
      let created: ThawLot | null = null;
      setState((prev) => {
        const batch =
          prev.batches.find((b) => b.id === batchId) ??
          prev.batches
            .filter((b) => b.variant === variant && b.qty - b.used > 0)
            .sort((a, b) => a.deliveredAt.localeCompare(b.deliveredAt))[0];
        if (!batch) return prev;
        const take = Math.min(qty, batch.qty - batch.used);
        if (take <= 0) return prev;
        const now = new Date();
        const lot: ThawLot = {
          id: id(),
          batchId: batch.id,
          batchCode: batch.code,
          variant,
          qty: take,
          thawedAt: now.toISOString(),
          deadlineAt: new Date(
            now.getTime() + prev.settings.shelfLifeHours * 3600 * 1000,
          ).toISOString(),
          sold: 0,
          discarded: 0,
        };
        created = lot;
        return {
          ...prev,
          batches: prev.batches.map((b) => (b.id === batch.id ? { ...b, used: b.used + take } : b)),
          thawLots: [...prev.thawLots, lot],
        };
      });
      return created;
    },
    [],
  );

  const saveDayStatus: Ctx["saveDayStatus"] = useCallback((input) => {
    setState((prev) => {
      const price = input.priceOverride ?? prev.settings.unitPrice;
      const lots = [...prev.thawLots].sort((a, b) => a.thawedAt.localeCompare(b.thawedAt));
      // FIFO-trekk mot solgt og kassert
      for (const line of input.lines) {
        let sold = line.sold;
        let discarded = line.discarded;
        for (const lot of lots) {
          if (lot.variant !== line.variant) continue;
          let avail = lot.qty - lot.sold - lot.discarded;
          if (avail <= 0) continue;
          const s = Math.min(sold, avail);
          lot.sold += s;
          sold -= s;
          avail -= s;
          const d = Math.min(discarded, avail);
          lot.discarded += d;
          discarded -= d;
          if (sold === 0 && discarded === 0) break;
        }
      }
      const revenue = input.lines.reduce((s, l) => s + l.sold * price, 0);
      const status: DayStatus = {
        id: id(),
        date: dateKey(new Date()),
        createdAt: new Date().toISOString(),
        lines: input.lines,
        priceOverride: input.priceOverride ?? null,
        discountNote: input.discountNote,
        workflow: input.workflow,
        comment: input.comment,
        revenue,
      };
      return { ...prev, thawLots: lots, dayStatuses: [...prev.dayStatuses, status] };
    });
  }, []);

  const saveWeekly: Ctx["saveWeekly"] = useCallback((input) => {
    setState((prev) => ({
      ...prev,
      weekly: [
        ...prev.weekly,
        { ...input, id: id(), createdAt: new Date().toISOString(), weekKey: weekKey(new Date()) },
      ],
    }));
  }, []);

  const saveDeviation: Ctx["saveDeviation"] = useCallback((input) => {
    setState((prev) => ({
      ...prev,
      deviations: [
        { ...input, id: id(), createdAt: new Date().toISOString(), notified: true },
        ...prev.deviations,
      ],
    }));
  }, []);

  const updateSettings: Ctx["updateSettings"] = useCallback((patch) => {
    setState((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }));
  }, []);

  const reset = useCallback(() => setState(createSeedState()), []);

  const value: Ctx = {
    state,
    hydrated,
    freezerStock,
    thawedStock,
    nextBatch,
    openLots,
    thaw,
    saveDayStatus,
    saveWeekly,
    saveDeviation,
    updateSettings,
    reset,
  };

  return <PilotContext.Provider value={value}>{children}</PilotContext.Provider>;
}

export function usePilot() {
  const ctx = useContext(PilotContext);
  if (!ctx) throw new Error("usePilot må brukes inne i PilotProvider");
  return ctx;
}

/* ---------- Avledede beregninger ---------- */

export function summarize(state: PilotState, days?: number) {
  const cutoff = days ? Date.now() - days * 86400000 : 0;
  const statuses = state.dayStatuses.filter((d) => new Date(d.createdAt).getTime() >= cutoff);
  const sold = statuses.reduce((s, d) => s + d.lines.reduce((a, l) => a + l.sold, 0), 0);
  const discarded = statuses.reduce((s, d) => s + d.lines.reduce((a, l) => a + l.discarded, 0), 0);
  const revenue = statuses.reduce((s, d) => s + d.revenue, 0);
  const thawed = state.thawLots
    .filter((l) => new Date(l.thawedAt).getTime() >= cutoff)
    .reduce((s, l) => s + l.qty, 0);
  const delivered = state.batches.reduce((s, b) => s + b.qty, 0);
  const freezer = state.batches.reduce((s, b) => s + (b.qty - b.used), 0);
  const thawedRemaining = state.thawLots.reduce((s, l) => s + (l.qty - l.sold - l.discarded), 0);
  return {
    sold,
    discarded,
    revenue,
    thawed,
    delivered,
    freezer,
    thawedRemaining,
    wastePct: sold + discarded > 0 ? (discarded / (sold + discarded)) * 100 : 0,
    sellThroughPct: thawed > 0 ? (sold / thawed) * 100 : 0,
  };
}

export function perVariant(state: PilotState) {
  return VARIANTS.map((v) => {
    const sold = state.dayStatuses.reduce(
      (s, d) => s + (d.lines.find((l) => l.variant === v.id)?.sold ?? 0),
      0,
    );
    const discarded = state.dayStatuses.reduce(
      (s, d) => s + (d.lines.find((l) => l.variant === v.id)?.discarded ?? 0),
      0,
    );
    const freezer = state.batches
      .filter((b) => b.variant === v.id)
      .reduce((s, b) => s + (b.qty - b.used), 0);
    const thawed = state.thawLots
      .filter((l) => l.variant === v.id)
      .reduce((s, l) => s + (l.qty - l.sold - l.discarded), 0);
    return { ...v, sold, discarded, freezer, thawed };
  });
}

export function urgentLots(state: PilotState, withinHours = 12) {
  const limit = Date.now() + withinHours * 3600 * 1000;
  return state.thawLots
    .filter((l) => l.qty - l.sold - l.discarded > 0 && new Date(l.deadlineAt).getTime() <= limit)
    .sort((a, b) => a.deadlineAt.localeCompare(b.deadlineAt));
}

export function formatDeadline(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  const hours = Math.round(diff / 3600000);
  if (hours < 0) return `Over frist for ${Math.abs(hours)} t siden`;
  if (hours < 1) return "Under 1 time igjen";
  return `${hours} t igjen`;
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleString("nb-NO", {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export { dateKey, weekKey };