import { Drawer as Vaul } from "vaul";
import type { ReactNode } from "react";

export function BottomSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Vaul.Root open={open} onOpenChange={onOpenChange} repositionInputs={false}>
      <Vaul.Portal>
        <Vaul.Overlay className="fixed inset-0 z-50 bg-espresso/40" />
        <Vaul.Content className="fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col rounded-t-3xl border border-border bg-card outline-none">
          <div className="flex justify-center pt-3 pb-1">
            <div className="h-1.5 w-12 rounded-full bg-border" />
          </div>
          <div className="px-5 pb-3">
            <Vaul.Title className="font-display text-2xl font-semibold text-foreground">
              {title}
            </Vaul.Title>
            {description ? (
              <Vaul.Description className="mt-1 text-sm text-muted-foreground">
                {description}
              </Vaul.Description>
            ) : (
              <Vaul.Description className="sr-only">{title}</Vaul.Description>
            )}
          </div>
          <div className="flex-1 overflow-y-auto px-5 pb-4">{children}</div>
          {footer ? (
            <div className="safe-bottom sticky bottom-0 border-t border-border bg-card px-5 pt-3">
              {footer}
            </div>
          ) : null}
        </Vaul.Content>
      </Vaul.Portal>
    </Vaul.Root>
  );
}

export function Stepper({
  value,
  onChange,
  max,
  label,
  hint,
}: {
  value: number;
  onChange: (v: number) => void;
  max?: number;
  label: string;
  hint?: string;
}) {
  const clamp = (n: number) => Math.max(0, max !== undefined ? Math.min(n, max) : n);
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">{label}</p>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          aria-label={`Minus ${label}`}
          onClick={() => onChange(clamp(value - 1))}
          className="h-12 w-12 rounded-full border border-border bg-secondary text-xl font-semibold text-foreground active:scale-95"
        >
          −
        </button>
        <span className="w-10 text-center text-xl font-semibold tabular-nums">{value}</span>
        <button
          type="button"
          aria-label={`Pluss ${label}`}
          onClick={() => onChange(clamp(value + 1))}
          className="h-12 w-12 rounded-full border border-border bg-golden text-xl font-semibold text-golden-foreground active:scale-95"
        >
          +
        </button>
      </div>
    </div>
  );
}

export function ChoiceRow({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={`min-h-11 rounded-full border px-4 text-sm font-medium transition-colors ${
            value === o.id
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-secondary text-foreground"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}