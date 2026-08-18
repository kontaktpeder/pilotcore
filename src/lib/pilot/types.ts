export type Variant = "nduja" | "truffel";

export const VARIANTS: { id: Variant; name: string; short: string }[] = [
  { id: "nduja", name: "'Nduja", short: "'Nduja" },
  { id: "truffel", name: "Trøffel og sopp", short: "Trøffel" },
];

export const variantName = (v: Variant) => VARIANTS.find((x) => x.id === v)?.name ?? v;

export interface Batch {
  id: string;
  code: string;
  variant: Variant;
  deliveredAt: string;
  qty: number;
  used: number;
}

export interface ThawLot {
  id: string;
  batchId: string;
  batchCode: string;
  variant: Variant;
  qty: number;
  thawedAt: string;
  deadlineAt: string;
  sold: number;
  discarded: number;
}

export type WorkflowRating = "enkelt" | "greit" | "vanskelig";

export interface DayStatus {
  id: string;
  date: string;
  createdAt: string;
  lines: { variant: Variant; sold: number; discarded: number; thawedNotSold: number }[];
  priceOverride?: number | null;
  discountNote?: string | undefined;
  workflow: WorkflowRating;
  comment?: string | undefined;
  revenue: number;
}

export interface WeeklyObservation {
  id: string;
  weekKey: string;
  createdAt: string;
  answers: Record<string, string>;
  comments: Record<string, string>;
  ideas?: string | undefined;
}

export type DeviationType =
  | "frysekjede"
  | "emballasje"
  | "merking"
  | "allergen"
  | "produktfeil"
  | "airfryer";

export const DEVIATION_TYPES: { id: DeviationType; label: string }[] = [
  { id: "frysekjede", label: "Frysekjede" },
  { id: "emballasje", label: "Emballasje / levering" },
  { id: "merking", label: "Merking" },
  { id: "allergen", label: "Allergenmistanke" },
  { id: "produktfeil", label: "Produktfeil" },
  { id: "airfryer", label: "Airfryer" },
];

export interface Deviation {
  id: string;
  createdAt: string;
  type: DeviationType;
  batchCode: string;
  affectedQty: number;
  remainingQty: number;
  description: string;
  photo?: string | null | undefined;
  notified: boolean;
}

export interface Settings {
  shelfLifeHours: number;
  unitPrice: number;
  weeklyVolume: number;
  pilotWeeks: number;
  siteName: string;
}

export interface PilotState {
  settings: Settings;
  batches: Batch[];
  thawLots: ThawLot[];
  dayStatuses: DayStatus[];
  weekly: WeeklyObservation[];
  deviations: Deviation[];
}