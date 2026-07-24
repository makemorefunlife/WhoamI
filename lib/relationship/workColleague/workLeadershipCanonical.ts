/**
 * Phase 6-2a — Work leadership_split canonical vertical slice.
 *
 * Pipeline (report boundary):
 *   resolveLeadershipRoleSplit (base)
 *   → refineLeadershipRoleSplit (composite)
 *   → buildWorkLeadershipCanonical(refined)  // wrap only — no re-resolve
 *   → .value → office.section_roles.leadership_split
 *   → canonical_projections.leadership_split (client typed authority)
 *   → context_output / ViewModel role_matrix (read-only; no re-resolve)
 *
 * Does not change Phase 5 thresholds, lock/flip, or copy.
 * Semantic scope: external present/report vs internal QA only —
 * NOT initiative, decision authority, execution, planning, or hierarchy fit.
 */
import type { CanonicalJudgment } from "@/lib/relationship/contextEngine/canonicalJudgment";
import type { LeadershipRoleSplit } from "./officeLanguage";

export const WORK_LEADERSHIP_CANONICAL_SOURCE =
  "refineLeadershipRoleSplit" as const;

export const WORK_LEADERSHIP_PERSISTENCE_PATH =
  "office.section_roles.leadership_split" as const;

export const WORK_LEADERSHIP_CLIENT_PATH =
  "canonical_projections.leadership_split" as const;

/** Soft refine when composite attached confidence/align; otherwise none (legacy base). */
export const WORK_LEADERSHIP_PSYCH_MODE_WITH_PSYCH = "soft" as const;
export const WORK_LEADERSHIP_PSYCH_MODE_LEGACY = "none" as const;

export type WorkLeadershipCanonical =
  CanonicalJudgment<LeadershipRoleSplit>;

/** Locale-independent client projection (summary prose excluded). */
export type WorkLeadershipClientValue = {
  external_lead: LeadershipRoleSplit["external_lead"];
  internal_qa_lead: LeadershipRoleSplit["internal_qa_lead"];
  confidence?: LeadershipRoleSplit["confidence"];
  align?: LeadershipRoleSplit["align"];
};

/**
 * Wrap an already-finalized `refineLeadershipRoleSplit` result.
 * Does not call resolvers/composites, read signals/psych, or alter the judgment.
 */
export function buildWorkLeadershipCanonical(
  refined: LeadershipRoleSplit | null,
  options?: {
    /** Pre-composite base from resolveLeadershipRoleSplit, when available */
    base?: LeadershipRoleSplit | null;
  },
): WorkLeadershipCanonical | null {
  if (!refined) return null;

  // Phase 5 refine omits confidence/align when psych is absent (legacy).
  const psychApplied =
    refined.confidence != null || refined.align != null;

  return {
    value: refined,
    source: WORK_LEADERSHIP_CANONICAL_SOURCE,
    psychMode: psychApplied
      ? WORK_LEADERSHIP_PSYCH_MODE_WITH_PSYCH
      : WORK_LEADERSHIP_PSYCH_MODE_LEGACY,
    confidence: refined.confidence,
    align: refined.align,
    base: options?.base ?? undefined,
    persistencePath: WORK_LEADERSHIP_PERSISTENCE_PATH,
  };
}

/** Semantic judgment fields — locale copy (summary) excluded. */
export type WorkLeadershipJudgmentFields = {
  external_lead: LeadershipRoleSplit["external_lead"];
  internal_qa_lead: LeadershipRoleSplit["internal_qa_lead"];
  confidence?: LeadershipRoleSplit["confidence"];
  align?: LeadershipRoleSplit["align"];
};

export function leadershipJudgmentFields(
  split: LeadershipRoleSplit | null | undefined,
): WorkLeadershipJudgmentFields | null {
  if (!split) return null;
  return {
    external_lead: split.external_lead,
    internal_qa_lead: split.internal_qa_lead,
    ...(split.confidence ? { confidence: split.confidence } : {}),
    ...(split.align ? { align: split.align } : {}),
  };
}

function cloneClient(v: WorkLeadershipClientValue): WorkLeadershipClientValue {
  return {
    external_lead: v.external_lead,
    internal_qa_lead: v.internal_qa_lead,
    ...(v.align ? { align: v.align } : {}),
    ...(v.confidence ? { confidence: v.confidence } : {}),
  };
}

export function leadershipClientValueFromFinalized(
  refined: LeadershipRoleSplit | null | undefined,
): WorkLeadershipClientValue | null {
  const fields = leadershipJudgmentFields(refined);
  if (!fields) return null;
  return cloneClient(fields);
}

export function buildWorkLeadershipClientProjection(
  value: WorkLeadershipClientValue | null | undefined,
): WorkLeadershipClientValue | null {
  if (!value) return null;
  return cloneClient(value);
}

type ReportWithProjections = {
  canonical_projections?: {
    leadership_split?: unknown;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export function injectWorkLeadershipClientProjection<
  T extends ReportWithProjections,
>(report: T, projection: WorkLeadershipClientValue | null | undefined): T {
  const { canonical_projections: prior, ...rest } = report;
  const priorRest =
    prior && typeof prior === "object"
      ? Object.fromEntries(
          Object.entries(prior).filter(([k]) => k !== "leadership_split"),
        )
      : {};
  if (!projection) {
    if (Object.keys(priorRest).length === 0) return rest as T;
    return { ...(rest as T), canonical_projections: priorRest };
  }
  return {
    ...(rest as T),
    canonical_projections: {
      ...priorRest,
      leadership_split: cloneClient(projection),
    },
  };
}

function parseLeadSide(raw: unknown): "a" | "b" | "balanced" | null {
  if (raw === "a" || raw === "b" || raw === "balanced") return raw;
  return null;
}

/** Malformed → null (never invent from summary prose). */
export function readWorkLeadershipCanonicalProjection(
  report:
    | { canonical_projections?: { leadership_split?: unknown } }
    | null
    | undefined,
): WorkLeadershipClientValue | null {
  const raw = report?.canonical_projections?.leadership_split;
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const external_lead = parseLeadSide(o.external_lead);
  const internal_qa_lead = parseLeadSide(o.internal_qa_lead);
  if (!external_lead || !internal_qa_lead) return null;
  const align =
    o.align === "confirms" || o.align === "caution" ? o.align : undefined;
  const confidence =
    o.confidence === "high" || o.confidence === "low"
      ? o.confidence
      : undefined;
  if (o.align !== undefined && !align) return null;
  if (o.confidence !== undefined && !confidence) return null;
  return {
    external_lead,
    internal_qa_lead,
    ...(align ? { align } : {}),
    ...(confidence ? { confidence } : {}),
  };
}

/** Swap a/b sides for viewer-first display (balanced unchanged). */
export function leadershipClientValueForViewer(
  value: WorkLeadershipClientValue,
  viewerIsReportA: boolean,
): WorkLeadershipClientValue {
  if (viewerIsReportA) return cloneClient(value);
  const flip = (side: "a" | "b" | "balanced"): "a" | "b" | "balanced" => {
    if (side === "a") return "b";
    if (side === "b") return "a";
    return "balanced";
  };
  return {
    external_lead: flip(value.external_lead),
    internal_qa_lead: flip(value.internal_qa_lead),
    ...(value.align ? { align: value.align } : {}),
    ...(value.confidence ? { confidence: value.confidence } : {}),
  };
}

export function formatWorkLeadershipCanonicalLabel(
  value: WorkLeadershipClientValue,
  params: { nameA: string; nameB: string; locale?: string | null },
): string {
  const en =
    params.locale === "en" ||
    params.locale === "en-US" ||
    Boolean(params.locale?.startsWith("en"));
  const who = (side: "a" | "b" | "balanced") => {
    if (side === "balanced") return en ? "shared" : "공동";
    return side === "a" ? params.nameA : params.nameB;
  };
  let base = en
    ? `External: ${who(value.external_lead)} · QA: ${who(value.internal_qa_lead)}`
    : `대외: ${who(value.external_lead)} · 검수: ${who(value.internal_qa_lead)}`;
  if (value.align === "confirms") {
    base = en ? `${base} · confirmed` : `${base} · 보강 일치`;
  } else if (value.align === "caution") {
    base = en ? `${base} · caution` : `${base} · 보강 주의`;
  }
  return base;
}
