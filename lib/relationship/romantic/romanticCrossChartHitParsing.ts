/**
 * Shared parse/clone helpers for CrossChartHit / CrossChartTrioHit as they
 * cross the canonical_projections JSON boundary. Not a canonical-file
 * factory (each romantic*Canonical.ts still hand-rolls its own
 * build/inject/read recipe per the established per-signal convention) —
 * just the hit-shape validation that would otherwise be duplicated
 * verbatim across five new canonical files. Never invents fields; malformed
 * input is dropped, not guessed.
 */
import type {
  CrossChartHit,
  CrossChartHitCategory,
  CrossChartTrioContribution,
  CrossChartTrioHit,
} from "@/lib/saju/pairChartAnalysis";

const HIT_CATEGORIES = new Set<CrossChartHitCategory>([
  "branch_pair",
  "stem_combine",
  "stem_clash",
  "wonjin_guimun",
  "gongmang",
]);
const PILLAR_SLOTS = new Set(["년주", "월주", "일주", "시주"]);

function asPillarSlot(v: unknown): CrossChartHit["personA_pillarSlot"] | undefined {
  return typeof v === "string" && PILLAR_SLOTS.has(v)
    ? (v as CrossChartHit["personA_pillarSlot"])
    : undefined;
}

export function asCrossChartHit(v: unknown): CrossChartHit | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  if (typeof o.personA_pillar !== "string") return null;
  if (typeof o.personB_pillar !== "string") return null;
  if (typeof o.type !== "string") return null;
  if (typeof o.interpretation !== "string") return null;
  if (typeof o.priority !== "number") return null;
  if (typeof o.palaceWeight !== "number") return null;
  if (typeof o.weightedPriority !== "number") return null;

  const hit: CrossChartHit = {
    personA_pillar: o.personA_pillar,
    personB_pillar: o.personB_pillar,
    type: o.type,
    interpretation: o.interpretation,
    priority: o.priority,
    palaceWeight: o.palaceWeight,
    weightedPriority: o.weightedPriority,
  };
  if (typeof o.category === "string" && HIT_CATEGORIES.has(o.category as CrossChartHitCategory)) {
    hit.category = o.category as CrossChartHitCategory;
  }
  const slotA = asPillarSlot(o.personA_pillarSlot);
  if (slotA) hit.personA_pillarSlot = slotA;
  if (typeof o.personA_code === "string") hit.personA_code = o.personA_code;
  const slotB = asPillarSlot(o.personB_pillarSlot);
  if (slotB) hit.personB_pillarSlot = slotB;
  if (typeof o.personB_code === "string") hit.personB_code = o.personB_code;
  if (typeof o.detail === "string") hit.detail = o.detail;
  return hit;
}

export function asCrossChartHitArray(v: unknown): CrossChartHit[] {
  if (!Array.isArray(v)) return [];
  const out: CrossChartHit[] = [];
  for (const item of v) {
    const hit = asCrossChartHit(item);
    if (hit) out.push(hit);
  }
  return out;
}

export function cloneCrossChartHit(h: CrossChartHit): CrossChartHit {
  return { ...h };
}

export function cloneCrossChartHitArray(hits: CrossChartHit[]): CrossChartHit[] {
  return hits.map(cloneCrossChartHit);
}

export function asCrossChartTrioHit(v: unknown): CrossChartTrioHit | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  if (typeof o.resultCode !== "string") return null;
  if (o.label !== "삼합" && o.label !== "방합") return null;
  if (typeof o.name !== "string") return null;
  if (typeof o.interpretation !== "string") return null;
  if (typeof o.priority !== "number") return null;
  if (!Array.isArray(o.contributedBranches)) return null;

  const contributedBranches: CrossChartTrioContribution[] = [];
  for (const c of o.contributedBranches) {
    if (!c || typeof c !== "object") continue;
    const co = c as Record<string, unknown>;
    if (co.owner !== "A" && co.owner !== "B") continue;
    const slot = asPillarSlot(co.pillarSlot);
    if (!slot) continue;
    if (typeof co.branchCode !== "string") continue;
    contributedBranches.push({ owner: co.owner, pillarSlot: slot, branchCode: co.branchCode });
  }

  return {
    resultCode: o.resultCode,
    label: o.label,
    name: o.name,
    interpretation: o.interpretation,
    priority: o.priority,
    contributedBranches,
  };
}

export function asCrossChartTrioHitArray(v: unknown): CrossChartTrioHit[] {
  if (!Array.isArray(v)) return [];
  const out: CrossChartTrioHit[] = [];
  for (const item of v) {
    const hit = asCrossChartTrioHit(item);
    if (hit) out.push(hit);
  }
  return out;
}

export function cloneCrossChartTrioHit(h: CrossChartTrioHit): CrossChartTrioHit {
  return { ...h, contributedBranches: h.contributedBranches.map((c) => ({ ...c })) };
}

export function cloneCrossChartTrioHitArray(hits: CrossChartTrioHit[]): CrossChartTrioHit[] {
  return hits.map(cloneCrossChartTrioHit);
}
