import type { PilotState } from "./types";

const DAY = 24 * 60 * 60 * 1000;

function iso(offsetMs: number) {
  return new Date(Date.now() - offsetMs).toISOString();
}

export function dateKey(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
}

export function weekKey(d: Date | string) {
  const date = new Date(typeof d === "string" ? d : d.getTime());
  const t = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((t.getTime() - yearStart.getTime()) / DAY + 1) / 7);
  return `${t.getUTCFullYear()}-U${String(week).padStart(2, "0")}`;
}

export const DEFAULT_SETTINGS = {
  shelfLifeHours: 48,
  unitPrice: 89,
  weeklyVolume: 100,
  pilotWeeks: 4,
  siteName: "Oslo Bar og Bowling",
};

export function createSeedState(): PilotState {
  const shelf = DEFAULT_SETTINGS.shelfLifeHours * 60 * 60 * 1000;
  const batches = [
    {
      id: "b1",
      code: "GOS-2401-N",
      variant: "nduja" as const,
      deliveredAt: iso(6 * DAY),
      qty: 50,
      used: 26,
    },
    {
      id: "b2",
      code: "GOS-2401-T",
      variant: "truffel" as const,
      deliveredAt: iso(6 * DAY),
      qty: 50,
      used: 22,
    },
  ];

  const thawLots = [
    {
      id: "t1",
      batchId: "b1",
      batchCode: "GOS-2401-N",
      variant: "nduja" as const,
      qty: 14,
      thawedAt: iso(3 * DAY),
      deadlineAt: new Date(Date.now() - 3 * DAY + shelf).toISOString(),
      sold: 12,
      discarded: 2,
    },
    {
      id: "t2",
      batchId: "b2",
      batchCode: "GOS-2401-T",
      variant: "truffel" as const,
      qty: 12,
      thawedAt: iso(3 * DAY),
      deadlineAt: new Date(Date.now() - 3 * DAY + shelf).toISOString(),
      sold: 11,
      discarded: 1,
    },
    {
      id: "t3",
      batchId: "b1",
      batchCode: "GOS-2401-N",
      variant: "nduja" as const,
      qty: 12,
      thawedAt: iso(20 * 60 * 60 * 1000),
      deadlineAt: new Date(Date.now() - 20 * 60 * 60 * 1000 + shelf).toISOString(),
      sold: 9,
      discarded: 0,
    },
    {
      id: "t4",
      batchId: "b2",
      batchCode: "GOS-2401-T",
      variant: "truffel" as const,
      qty: 10,
      thawedAt: iso(20 * 60 * 60 * 1000),
      deadlineAt: new Date(Date.now() - 20 * 60 * 60 * 1000 + shelf).toISOString(),
      sold: 8,
      discarded: 0,
    },
  ];

  const dayStatuses = [
    {
      id: "d1",
      date: dateKey(new Date(Date.now() - 3 * DAY)),
      createdAt: iso(3 * DAY - 8 * 60 * 60 * 1000),
      lines: [
        { variant: "nduja" as const, sold: 12, discarded: 2, thawedNotSold: 0 },
        { variant: "truffel" as const, sold: 11, discarded: 1, thawedNotSold: 0 },
      ],
      priceOverride: null,
      workflow: "greit" as const,
      comment: "Første travle kveld, airfryer ble flaskehals i rushet.",
      revenue: 23 * 89,
    },
    {
      id: "d2",
      date: dateKey(new Date(Date.now() - DAY)),
      createdAt: iso(20 * 60 * 60 * 1000 - 6 * 60 * 60 * 1000),
      lines: [
        { variant: "nduja" as const, sold: 9, discarded: 0, thawedNotSold: 3 },
        { variant: "truffel" as const, sold: 8, discarded: 0, thawedNotSold: 2 },
      ],
      priceOverride: null,
      workflow: "enkelt" as const,
      comment: "Gjestene liker at det går raskt.",
      revenue: 17 * 89,
    },
  ];

  return {
    settings: { ...DEFAULT_SETTINGS },
    batches,
    thawLots,
    dayStatuses,
    weekly: [],
    deviations: [
      {
        id: "dev1",
        createdAt: iso(2 * DAY),
        type: "emballasje",
        batchCode: "GOS-2401-T",
        affectedQty: 2,
        remainingQty: 48,
        description: "To pakninger hadde løs forsegling ved levering.",
        photo: null,
        notified: true,
      },
    ],
  };
}