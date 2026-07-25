/**
 * Coerce messy LLM JSON into Deep Essence Part A/B shape before strict
 * validation. Length mismatches (2 strengths, 6 checklist items, wrong bar
 * tones) are the #1 reason Inner Compass silently falls back to prose.
 */
import { PRIMARY_AXIS_KEYS } from "@/lib/v2/survey/types";
import type { PrimaryAxesScores } from "@/lib/v2/survey/types";

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

function asString(v: unknown, fallback = ""): string {
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return fallback;
}

function asScore(v: unknown, fallback = 50): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function takeStrings(v: unknown, min: number, max: number, pad: string): string[] {
  const raw = Array.isArray(v) ? v : [];
  const out = raw
    .map((item) => asString(item))
    .filter((s) => s.length > 0)
    .slice(0, max);
  while (out.length < min) {
    out.push(pad);
  }
  return out;
}

function takePairs(
  v: unknown,
  min: number,
  max: number,
  mapItem: (item: Record<string, unknown>, i: number) => Record<string, unknown>,
  pad: () => Record<string, unknown>,
): Record<string, unknown>[] {
  const raw = Array.isArray(v) ? v : [];
  const out: Record<string, unknown>[] = [];
  for (let i = 0; i < raw.length && out.length < max; i++) {
    const row = asRecord(raw[i]);
    if (!row) continue;
    out.push(mapItem(row, i));
  }
  while (out.length < min) out.push(pad());
  return out;
}

const TONES = new Set(["highlight", "accent", "ink"]);

function coerceTone(v: unknown, fallback: "highlight" | "accent" | "ink") {
  return typeof v === "string" && TONES.has(v) ? v : fallback;
}

export type CoerceDeepEssenceDiagnostics = {
  part: "A" | "B" | "merged";
  ok: boolean;
  notes: string[];
};

/** Normalize Part A object in place (returns new object). */
export function coerceDeepEssencePartA(
  raw: unknown,
  floor: PrimaryAxesScores,
): { value: Record<string, unknown>; notes: string[] } {
  const notes: string[] = [];
  const obj = asRecord(raw) ?? {};
  const summaryIn = asRecord(obj.summary) ?? {};
  const summary = {
    core_mode: asString(summaryIn.core_mode, "Core mode"),
    energy_balance: asString(summaryIn.energy_balance, "50 / 50"),
    growth_edge: asString(summaryIn.growth_edge, "Growth"),
  };
  if (!asString(summaryIn.core_mode)) notes.push("summary.core_mode_padded");

  const radarIn = asRecord(obj.radar_potential) ?? {};
  const radar_potential = {} as Record<string, number>;
  for (const key of PRIMARY_AXIS_KEYS) {
    radar_potential[key] = Math.max(
      floor[key] ?? 0,
      asScore(radarIn[key], floor[key] ?? 50),
    );
  }

  const strengths = takePairs(
    obj.strengths,
    3,
    3,
    (row, i) => ({
      title: asString(row.title, `Strength ${i + 1}`),
      body: asString(row.body, "This strength shows up in everyday choices."),
    }),
    () => ({
      title: "Strength",
      body: "This strength shows up in everyday choices.",
    }),
  );
  if (!Array.isArray(obj.strengths) || obj.strengths.length !== 3) {
    notes.push(`strengths_len_${Array.isArray(obj.strengths) ? obj.strengths.length : 0}`);
  }

  const watchouts = takePairs(
    obj.watchouts,
    3,
    3,
    (row, i) => ({
      title: asString(row.title, `Watch-out ${i + 1}`),
      body: asString(row.body, "This pattern can drain energy when it runs hot."),
    }),
    () => ({
      title: "Watch-out",
      body: "This pattern can drain energy when it runs hot.",
    }),
  );

  const energyIn = asRecord(obj.energy) ?? {};
  const defaultBars = [
    { label: "Energy spent on people", value: 55, tone: "highlight" },
    { label: "Energy returning to you", value: 45, tone: "accent" },
    { label: "Solo recovery time", value: 60, tone: "ink" },
  ] as const;
  const barsRaw = Array.isArray(energyIn.bars) ? energyIn.bars : [];
  const bars = defaultBars.map((fallback, i) => {
    const row = asRecord(barsRaw[i]) ?? {};
    return {
      label: asString(row.label, fallback.label),
      value: asScore(row.value, fallback.value),
      tone: coerceTone(row.tone, fallback.tone),
    };
  });
  if (barsRaw.length !== 3) notes.push(`energy.bars_len_${barsRaw.length}`);

  const energy = {
    headline: asString(energyIn.headline, "Your energy follows a clear pattern."),
    balance_pct: asScore(energyIn.balance_pct, bars[0]?.value ?? 50),
    bars,
    summary: asString(
      energyIn.summary,
      "Your energy rises with meaningful connection and needs quiet recovery.",
    ),
    fuels: takeStrings(energyIn.fuels, 3, 5, "Quiet time that restores you"),
    drains: takeStrings(energyIn.drains, 3, 5, "Sudden social pressure"),
    optimal: takeStrings(energyIn.optimal, 2, 4, "A steady daily rhythm"),
  };

  return {
    value: { summary, radar_potential, strengths, watchouts, energy },
    notes,
  };
}

export function coerceDeepEssencePartB(raw: unknown): {
  value: Record<string, unknown>;
  notes: string[];
} {
  const notes: string[] = [];
  const obj = asRecord(raw) ?? {};
  const relIn = asRecord(obj.relationships) ?? {};
  const relationships = {
    pattern: asString(
      relIn.pattern,
      "You get closer carefully, then protect your pace.",
    ),
    fit: takeStrings(relIn.fit, 3, 3, "Someone who respects your pace"),
    friction: takeStrings(relIn.friction, 3, 3, "Rushing emotional closeness"),
    compare: takePairs(
      relIn.compare,
      3,
      3,
      (row) => ({
        wound: asString(row.wound, "When things feel uncertain"),
        steady: asString(row.steady, "Name the need in one sentence"),
      }),
      () => ({
        wound: "When things feel uncertain",
        steady: "Name the need in one sentence",
      }),
    ),
  };

  const pbIn = asRecord(obj.playbook) ?? {};
  const playbook = {
    rule: asString(pbIn.rule, "Pause one beat, then speak."),
    rows: takePairs(
      pbIn.rows,
      3,
      3,
      (row) => ({
        situation: asString(row.situation, "When tension rises"),
        old: asString(row.old, "Push through or shut down"),
        better: asString(row.better, "Take ten minutes, then return"),
      }),
      () => ({
        situation: "When tension rises",
        old: "Push through or shut down",
        better: "Take ten minutes, then return",
      }),
    ),
    heated: asString(pbIn.heated, "If voices rise, call a short pause."),
    reset: asString(pbIn.reset, "Drink water, then restart with one clear ask."),
  };

  const futIn = asRecord(obj.future) ?? {};
  const future = {
    remember: takeStrings(futIn.remember, 3, 3, "Protect your recovery time"),
    leap: asString(futIn.leap, "Practice one small clear boundary this week."),
  };

  const checklist = takeStrings(
    obj.checklist,
    8,
    12,
    "One small action that protects your energy",
  );
  if (!Array.isArray(obj.checklist) || (obj.checklist as unknown[]).length < 8) {
    notes.push(
      `checklist_len_${Array.isArray(obj.checklist) ? (obj.checklist as unknown[]).length : 0}`,
    );
  }

  return {
    value: {
      relationships,
      playbook,
      future,
      closing: asString(
        obj.closing,
        "You already have a workable compass — keep using it gently.",
      ),
      checklist,
    },
    notes,
  };
}
