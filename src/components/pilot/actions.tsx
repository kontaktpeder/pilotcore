import { useState } from "react";
import { toast } from "sonner";
import { BottomSheet, ChoiceRow, Stepper } from "./sheet";
import { formatDeadline, usePilot } from "@/lib/pilot/store";
import { DEVIATION_TYPES, VARIANTS, variantName } from "@/lib/pilot/types";
import type { DeviationType, Variant, WorkflowRating } from "@/lib/pilot/types";

/* 1. Uttak fra fryser */
export function ThawSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { freezerStock, nextBatch, thaw, state } = usePilot();
  const [variant, setVariant] = useState<Variant>("nduja");
  const [qty, setQty] = useState(6);
  const batch = nextBatch(variant);
  const stock = freezerStock(variant);

  const submit = () => {
    const lot = thaw({ variant, qty, ...(batch ? { batchId: batch.id } : {}) });
    if (!lot) {
      toast.error("Ingen beholdning igjen på fryselager");
      return;
    }
    toast.success(
      `${qty} × ${variantName(variant)} tatt ut – frist ${new Date(lot.deadlineAt).toLocaleString("nb-NO", { weekday: "short", hour: "2-digit", minute: "2-digit" })}`,
    );
    onOpenChange(false);
    setQty(6);
  };

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Uttak fra fryseren"
      description="Registrer når varene tas ut – ikke ved stengetid."
      footer={
        <button
          type="button"
          onClick={submit}
          disabled={stock === 0}
          className="mb-1 h-14 w-full rounded-2xl bg-golden text-base font-semibold text-golden-foreground disabled:opacity-50"
        >
          Registrer uttak
        </button>
      }
    >
      <p className="mb-2 text-sm font-medium">Variant</p>
      <ChoiceRow
        options={VARIANTS.map((v) => ({ id: v.id, label: v.name }))}
        value={variant}
        onChange={(v) => setVariant(v as Variant)}
      />
      <div className="mt-4 divide-y divide-border">
        <Stepper
          label="Antall"
          hint={`${stock} stk på fryselager`}
          value={qty}
          max={stock}
          onChange={setQty}
        />
      </div>
      <div className="surface-card mt-4 p-4 text-sm">
        <p className="text-muted-foreground">Batch (FIFO, eldste først)</p>
        <p className="font-semibold">{batch ? batch.code : "Ingen batch tilgjengelig"}</p>
        <p className="mt-3 text-muted-foreground">Uttakstidspunkt</p>
        <p className="font-semibold">{new Date().toLocaleString("nb-NO")}</p>
        <p className="mt-3 text-muted-foreground">Frist for tilberedning/kassering</p>
        <p className="font-semibold text-tomato">
          {new Date(Date.now() + state.settings.shelfLifeHours * 3600000).toLocaleString("nb-NO")} (
          {state.settings.shelfLifeHours} t)
        </p>
      </div>
    </BottomSheet>
  );
}

/* 2. Dagens status */
export function DayStatusSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { state, thawedStock, saveDayStatus, freezerStock } = usePilot();
  const [lines, setLines] = useState(() =>
    VARIANTS.map((v) => ({ variant: v.id, sold: 0, discarded: 0, thawedNotSold: 0 })),
  );
  const [priceChanged, setPriceChanged] = useState(false);
  const [price, setPrice] = useState(state.settings.unitPrice);
  const [discountNote, setDiscountNote] = useState("");
  const [workflow, setWorkflow] = useState<WorkflowRating>("greit");
  const [comment, setComment] = useState("");

  const set = (variant: Variant, key: "sold" | "discarded" | "thawedNotSold", value: number) =>
    setLines((prev) => prev.map((l) => (l.variant === variant ? { ...l, [key]: value } : l)));

  const usedPrice = priceChanged ? price : state.settings.unitPrice;
  const sold = lines.reduce((s, l) => s + l.sold, 0);
  const discarded = lines.reduce((s, l) => s + l.discarded, 0);
  const revenue = sold * usedPrice;
  const wastePct = sold + discarded > 0 ? (discarded / (sold + discarded)) * 100 : 0;

  const submit = () => {
    saveDayStatus({
      lines,
      priceOverride: priceChanged ? price : null,
      discountNote: discountNote || undefined,
      workflow,
      comment: comment || undefined,
    });
    toast.success("Dagens status lagret");
    onOpenChange(false);
    setLines(VARIANTS.map((v) => ({ variant: v.id, sold: 0, discarded: 0, thawedNotSold: 0 })));
    setComment("");
  };

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Dagens status"
      description="Under ett minutt. Prisen ligger ferdig – registrer bare avvik."
      footer={
        <div className="mb-1 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Omsetning</span>
            <span className="font-semibold">{revenue.toLocaleString("nb-NO")} kr</span>
          </div>
          <button
            type="button"
            onClick={submit}
            className="h-14 w-full rounded-2xl bg-golden text-base font-semibold text-golden-foreground"
          >
            Lagre dagens status
          </button>
        </div>
      }
    >
      {VARIANTS.map((v) => (
        <div key={v.id} className="surface-card mb-3 px-4 py-2">
          <p className="font-display pt-2 text-lg font-semibold">{v.name}</p>
          <div className="divide-y divide-border">
            <Stepper
              label="Solgt"
              value={lines.find((l) => l.variant === v.id)!.sold}
              onChange={(n) => set(v.id, "sold", n)}
            />
            <Stepper
              label="Kassert"
              value={lines.find((l) => l.variant === v.id)!.discarded}
              onChange={(n) => set(v.id, "discarded", n)}
            />
            <Stepper
              label="Tint, ikke solgt"
              hint={`${thawedStock(v.id)} stk tint nå · ${freezerStock(v.id)} på fryselager`}
              value={lines.find((l) => l.variant === v.id)!.thawedNotSold}
              onChange={(n) => set(v.id, "thawedNotSold", n)}
            />
          </div>
        </div>
      ))}

      <div className="surface-card mb-3 p-4">
        <label className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium">Prisendring eller rabatt i dag?</span>
          <input
            type="checkbox"
            checked={priceChanged}
            onChange={(e) => setPriceChanged(e.target.checked)}
            className="h-6 w-6 accent-[oklch(0.58_0.19_32)]"
          />
        </label>
        {priceChanged ? (
          <div className="mt-3 space-y-3">
            <input
              type="number"
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="h-12 w-full rounded-xl border border-border bg-background px-3 text-base"
            />
            <input
              placeholder="Kort begrunnelse (valgfritt)"
              value={discountNote}
              onChange={(e) => setDiscountNote(e.target.value)}
              className="h-12 w-full rounded-xl border border-border bg-background px-3 text-base"
            />
          </div>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">
            Standardpris {state.settings.unitPrice} kr
          </p>
        )}
      </div>

      <div className="surface-card mb-3 p-4">
        <p className="mb-2 text-sm font-medium">Hvordan fungerte arbeidsflyten?</p>
        <ChoiceRow
          options={[
            { id: "enkelt", label: "Enkelt" },
            { id: "greit", label: "Greit" },
            { id: "vanskelig", label: "Vanskelig" },
          ]}
          value={workflow}
          onChange={(v) => setWorkflow(v as WorkflowRating)}
        />
        <textarea
          placeholder="Kommentar (valgfritt)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="mt-3 min-h-20 w-full rounded-xl border border-border bg-background p-3 text-base"
        />
      </div>

      <div className="surface-card mb-2 grid grid-cols-2 gap-3 p-4 text-sm">
        <div>
          <p className="text-muted-foreground">Svinnprosent</p>
          <p className="font-semibold">{wastePct.toFixed(1)} %</p>
        </div>
        <div>
          <p className="text-muted-foreground">Solgt i dag</p>
          <p className="font-semibold">{sold} stk</p>
        </div>
      </div>
    </BottomSheet>
  );
}

/* 3. Ukentlig oppsummering */
const WEEKLY_QUESTIONS: { id: string; q: string; options: string[] }[] = [
  {
    id: "drikke",
    q: "Påvirket produktet drikkesalg og matomsetning?",
    options: ["Økte begge", "Økte drikkesalg", "Økte matomsetning", "Ingen endring", "Vet ikke"],
  },
  {
    id: "pizza",
    q: "Hvordan solgte det mot pizza og eksisterende mat?",
    options: ["Bedre", "Omtrent likt", "Svakere", "Kannibaliserte pizza"],
  },
  {
    id: "ansatte",
    q: "Ansattes erfaring (lagring, tining, tilberedning, servering)",
    options: ["Enkelt hele veien", "Tining er kronglete", "Tilberedning tar tid", "Servering krevende"],
  },
  {
    id: "gjester",
    q: "Anonymiserte gjestetilbakemeldinger",
    options: ["Svært positive", "Positive", "Delte", "Negative"],
  },
  {
    id: "innvendinger",
    q: "Vanligste salgsinnvending",
    options: ["Pris", "Størrelse", "Smak", "Ukjent produkt", "Ingen"],
  },
  {
    id: "leveranser",
    q: "Hvordan fungerte leveransene?",
    options: ["Uten problemer", "Forsinket", "Feil antall", "Emballasjeproblem"],
  },
];

export function WeeklySheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { state, saveWeekly } = usePilot();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [ideas, setIdeas] = useState("");

  const sold = state.dayStatuses.reduce((s, d) => s + d.lines.reduce((a, l) => a + l.sold, 0), 0);
  const discarded = state.dayStatuses.reduce(
    (s, d) => s + d.lines.reduce((a, l) => a + l.discarded, 0),
    0,
  );
  const revenue = state.dayStatuses.reduce((s, d) => s + d.revenue, 0);

  const submit = () => {
    saveWeekly({ answers, comments, ideas: ideas || undefined });
    toast.success("Ukentlig oppsummering sendt til Gold of Sicily");
    onOpenChange(false);
  };

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Ukentlig oppsummering"
      description="Cirka to minutter. Dette erstatter separat ukesrapport etter punkt 10."
      footer={
        <button
          type="button"
          onClick={submit}
          className="mb-1 h-14 w-full rounded-2xl bg-golden text-base font-semibold text-golden-foreground"
        >
          Send oppsummering
        </button>
      }
    >
      <div className="surface-card mb-4 grid grid-cols-3 gap-2 p-4 text-center">
        <div>
          <p className="font-display text-xl font-semibold">{sold}</p>
          <p className="text-xs text-muted-foreground">solgt</p>
        </div>
        <div>
          <p className="font-display text-xl font-semibold">{discarded}</p>
          <p className="text-xs text-muted-foreground">kassert</p>
        </div>
        <div>
          <p className="font-display text-xl font-semibold">{revenue.toLocaleString("nb-NO")}</p>
          <p className="text-xs text-muted-foreground">kr</p>
        </div>
      </div>

      {WEEKLY_QUESTIONS.map((q) => (
        <div key={q.id} className="surface-card mb-3 p-4">
          <p className="mb-2 text-sm font-medium">{q.q}</p>
          <ChoiceRow
            options={q.options.map((o) => ({ id: o, label: o }))}
            value={answers[q.id] ?? ""}
            onChange={(v) => setAnswers((p) => ({ ...p, [q.id]: v }))}
          />
          <input
            placeholder="Kommentar (valgfritt)"
            value={comments[q.id] ?? ""}
            onChange={(e) => setComments((p) => ({ ...p, [q.id]: e.target.value }))}
            className="mt-3 h-12 w-full rounded-xl border border-border bg-background px-3 text-base"
          />
        </div>
      ))}

      <div className="surface-card mb-2 p-4">
        <p className="mb-2 text-sm font-medium">Forbedrings- og markedsføringsideer (valgfritt)</p>
        <textarea
          value={ideas}
          onChange={(e) => setIdeas(e.target.value)}
          className="min-h-24 w-full rounded-xl border border-border bg-background p-3 text-base"
        />
      </div>
    </BottomSheet>
  );
}

/* 4. Avvik */
export function DeviationSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { state, saveDeviation } = usePilot();
  const [type, setType] = useState<DeviationType>("frysekjede");
  const [batchCode, setBatchCode] = useState(state.batches[0]?.code ?? "");
  const [affected, setAffected] = useState(1);
  const [remaining, setRemaining] = useState(0);
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);

  const submit = () => {
    if (!description.trim()) {
      toast.error("Beskriv avviket kort");
      return;
    }
    saveDeviation({
      type,
      batchCode,
      affectedQty: affected,
      remainingQty: remaining,
      description,
      photo,
    });
    toast.success("Avvik sendt til Gold of Sicily nå");
    onOpenChange(false);
    setDescription("");
    setPhoto(null);
  };

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Rapporter avvik"
      description="Varsler Gold of Sicily med en gang. Ikke vent på dagens status."
      footer={
        <button
          type="button"
          onClick={submit}
          className="mb-1 h-14 w-full rounded-2xl bg-destructive text-base font-semibold text-destructive-foreground"
        >
          Send avvik nå
        </button>
      }
    >
      <p className="mb-2 text-sm font-medium">Type avvik</p>
      <ChoiceRow
        options={DEVIATION_TYPES.map((d) => ({ id: d.id, label: d.label }))}
        value={type}
        onChange={(v) => setType(v as DeviationType)}
      />
      <div className="surface-card mt-4 p-4">
        <p className="mb-2 text-sm font-medium">Batch</p>
        <ChoiceRow
          options={state.batches.map((b) => ({ id: b.code, label: b.code }))}
          value={batchCode}
          onChange={setBatchCode}
        />
        <div className="mt-2 divide-y divide-border">
          <Stepper label="Berørt antall" value={affected} onChange={setAffected} />
          <Stepper label="Gjenværende beholdning" value={remaining} onChange={setRemaining} />
        </div>
      </div>
      <textarea
        placeholder="Beskrivelse"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="mt-3 min-h-24 w-full rounded-xl border border-border bg-card p-3 text-base"
      />
      <label className="surface-card mt-3 mb-2 flex min-h-14 items-center justify-between p-4 text-sm font-medium">
        <span>{photo ? "Bilde lagt ved" : "Legg ved bilde (valgfritt)"}</span>
        <input
          type="file"
          accept="image/*"
          className="w-40 text-xs"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => setPhoto(String(reader.result));
            reader.readAsDataURL(file);
          }}
        />
      </label>
    </BottomSheet>
  );
}

export { formatDeadline };