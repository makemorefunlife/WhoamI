/**
 * Phase 6-2a — Work leadership_split canonical vertical slice.
 *
 * Pipeline (report boundary):
 *   resolveLeadershipRoleSplit (base)
 *   → refineLeadershipRoleSplit (composite)
 *   → buildWorkLeadershipCanonical(refined)  // wrap only — no re-resolve
 *   → .value → office.section_roles.leadership_split
 *   → context_output / ViewModel role_matrix (read-only)
 *
 * Does not change Phase 5 thresholds, lock/flip, or copy.
 */
import type { CanonicalJudgment } from "@/lib/relationship/contextEngine/canonicalJudgment";
import type { LeadershipRoleSplit } from "./officeLanguage";

export const WORK_LEADERSHIP_CANONICAL_SOURCE =
  "refineLeadershipRoleSplit" as const;

export const WORK_LEADERSHIP_PERSISTENCE_PATH =
  "office.section_roles.leadership_split" as const;

/** Soft refine when composite attached confidence/align; otherwise none (legacy base). */
export const WORK_LEADERSHIP_PSYCH_MODE_WITH_PSYCH = "soft" as const;
export const WORK_LEADERSHIP_PSYCH_MODE_LEGACY = "none" as const;

export type WorkLeadershipCanonical =
  CanonicalJudgment<LeadershipRoleSplit>;

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
