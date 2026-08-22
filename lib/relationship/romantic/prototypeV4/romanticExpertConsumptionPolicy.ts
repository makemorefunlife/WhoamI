/**
 * Phase 4B — deterministic policy for whether/where a Phase 4A Expert
 * Intelligence finding becomes user-visible.
 *
 * Pure post-processing only: takes RomanticExpertFinding[] that
 * romanticExpertIntelligence.ts has already validated (renderEligible,
 * novelty, classification, psychCrossCheck grounding all re-derived
 * server-side there) and decides consumption tier + chapter placement.
 * Never calls the LLM. Never mutates the deterministic report/story plan.
 */
import { isTextuallyDuplicate } from "./romanticExpertIntelligence";
import type { RomanticExpertFinding } from "./romanticExpertIntelligenceTypes";
import type {
  CanonicalChapterId,
  CanonicalSection,
  CanonicalSectionBlock,
} from "./composeCanonicalSectionNarratives";
import type { CanonicalRelationshipStoryPlan } from "./canonicalStoryPlanTypes";
import { pick, type NarrativeLocale } from "./narrativeLocale";

/** Spec §1 A-D priority tiers. Only A ever renders in Phase 4B — see
 * selectUserVisibleExpertBlocks's design note. B/C are still computed and
 * counted (for the audit trail / Phase 5 planning) but never spliced into
 * a chapter this phase. */
export type ExpertConsumptionTier = "A_primary" | "B_secondary" | "C_internal" | "D_never";

/** "above safe threshold" (spec §1.A) — a disclosed, explicit judgment call:
 * "low" confidence EXPERT_DERIVED findings never reach user-visible tier A. */
const SAFE_TIER_A_CONFIDENCE: ReadonlyArray<RomanticExpertFinding["confidence"]> = ["high", "medium"];

export function classifyConsumptionTier(f: RomanticExpertFinding): ExpertConsumptionTier {
  // §1.D — never user-visible, checked first regardless of anything else.
  if (f.classification === "SPECULATIVE" || !f.renderEligible || f.novelty === "duplicate") {
    return "D_never";
  }
  // §1.A — highest priority.
  if (
    f.classification === "EXPERT_DERIVED" &&
    f.novelty === "genuinely_additive" &&
    SAFE_TIER_A_CONFIDENCE.includes(f.confidence)
  ) {
    return "A_primary";
  }
  // §1.B — secondary (enrich, don't append — see design note in selectUserVisibleExpertBlocks).
  if (f.classification === "SUPPORTED_SYNTHESIS" && f.novelty === "deepens_existing") {
    return "B_secondary";
  }
  // §1.C — internal support only, never a new user-visible block.
  if (f.novelty === "reinforces_existing") {
    return "C_internal";
  }
  // Any combination not explicitly named in §1.A-C (e.g. EXPERT_DERIVED with
  // novelty=deepens_existing, or SUPPORTED_SYNTHESIS with novelty=genuinely_additive)
  // is a strict-literal read of the spec: not explicitly permitted, so never shown.
  return "D_never";
}

/** Spec §2 — dedup corpus: Cross-Signal V1 insights + every already-composed
 * chapter block body (bilateralChanges, attraction narrative, conflict loop,
 * misreads, hidden hearts, repair guidance all live in `sections` already,
 * since composeCanonicalSectionNarratives renders every one of them into a
 * CanonicalSectionBlock). */
export function buildExistingReportTextCorpus(
  plan: CanonicalRelationshipStoryPlan,
  sections: CanonicalSection[],
): string[] {
  const csiTexts = (plan.crossSignalInsightsV1 ?? []).map((i) => i.derivedMeaning);
  const blockTexts = sections.flatMap((s) => s.blocks.map((b) => b.body)).filter(Boolean);
  return [...csiTexts, ...blockTexts];
}

function confidenceRank(c: RomanticExpertFinding["confidence"]): number {
  return c === "high" ? 2 : c === "medium" ? 1 : 0;
}

/** Spec §5/§6 — translate a validated finding into readable relationship
 * copy. Never renders sajuEvidence/evidenceRefs (raw diagnostic strings) —
 * `claim` is already natural-language by construction (see
 * romanticExpertIntelligencePrompt.ts), so "translation" here means: apply
 * the psychCrossCheck-aware layering the spec requires, not run a second
 * LLM rewrite pass. */
export function translateFindingToUserCopy(
  f: RomanticExpertFinding,
  locale: NarrativeLocale,
): { title: string; body: string } {
  const L = (ko: string, en: string) => pick(locale, ko, en);
  const title = L("페어 인사이트", "Pair Insight");
  const status = f.psychCrossCheck?.status;

  if (status === "CONTRADICTED_BY_CURRENT" && f.psychCrossCheck?.note) {
    return {
      title,
      body: [
        f.claim,
        L(
          `다만 지금의 성향 데이터는 다른 결을 보여요: ${f.psychCrossCheck.note}`,
          `That said, your current behavior data shows something different: ${f.psychCrossCheck.note}`,
        ),
        L("이 차이 자체가 의미 있는 신호일 수 있어요.", "That tension itself may be a meaningful signal."),
      ].join("\n\n"),
    };
  }
  if (status === "MIXED") {
    return {
      title,
      body: [
        f.claim,
        L(`아직 확실하지 않은 부분: ${f.claimBoundary.notSupported}`, `What isn't confirmed yet: ${f.claimBoundary.notSupported}`),
      ].join("\n\n"),
    };
  }
  // CONFIRMED_BY_CURRENT (may be stated directly) and NOT_MEASURED (chart-only
  // interpretation, no invented behavioral confirmation) both just use the
  // claim as-is — it's already scoped correctly by construction.
  return { title, body: f.claim };
}

export type ExpertConsumptionMeta = {
  schemaVersion: "romantic_expert_consumption_v1";
  totalFindings: number;
  tierACount: number;
  tierBCount: number;
  tierCCount: number;
  rejectedNeverCount: number;
  rejectedDuplicateAgainstReportCount: number;
  rejectedChapterCapCount: number;
  selectedCount: number;
  selectedByChapter: Record<string, number>;
};

export type ExpertConsumptionSelection = {
  blocksByChapter: Partial<Record<CanonicalChapterId, CanonicalSectionBlock[]>>;
  meta: ExpertConsumptionMeta;
};

const EXPERT_ELIGIBLE_CHAPTERS: ReadonlySet<CanonicalChapterId> = new Set([
  "c2_attraction",
  "c3_dynamics",
  "c4_conflict",
  "c5_misunderstanding",
  "c6_hidden_hearts",
  "c7_repair",
  "c8_strength_vulnerability",
]);

/**
 * Spec §3/§4/§7 — one insight, one home, max 1 per chapter, Chapter 08 never
 * a default overflow.
 *
 * Design note (§8): Tier B (SUPPORTED_SYNTHESIS/deepens_existing) is computed
 * and counted here for the audit trail, but intentionally never spliced into
 * blocksByChapter in this phase — see plan item C. Only Tier A renders.
 *
 * Chapter 08 anti-overflow (§3) falls out of the combination of two rules
 * that already apply to everyone: Tier B never renders anywhere (so it can
 * never use c8 as overflow), and Tier A must still pass the same dedup check
 * against c8's existing bilateralChanges/shared-strength/shared-vulnerability
 * text as any other chapter — there is no separate c8-specific carve-out
 * needed beyond that.
 */
export function selectUserVisibleExpertBlocks(
  findings: RomanticExpertFinding[],
  plan: CanonicalRelationshipStoryPlan,
  existingSections: CanonicalSection[],
  locale: NarrativeLocale,
): ExpertConsumptionSelection {
  const runningCorpus = buildExistingReportTextCorpus(plan, existingSections);

  let tierACount = 0;
  let tierBCount = 0;
  let tierCCount = 0;
  let rejectedNever = 0;
  let rejectedDup = 0;

  const candidatesByChapter = new Map<CanonicalChapterId, RomanticExpertFinding[]>();

  for (const f of findings) {
    const tier = classifyConsumptionTier(f);
    if (tier === "D_never") {
      rejectedNever++;
      continue;
    }
    if (tier === "C_internal") {
      tierCCount++;
      continue;
    }
    if (tier === "B_secondary") {
      tierBCount++;
      continue; // internal-only in Phase 4B — see design note above
    }
    // tier === "A_primary"
    if (!EXPERT_ELIGIBLE_CHAPTERS.has(f.suggestedChapter as CanonicalChapterId)) {
      // Defensive: validateExpertFindings already constrains suggestedChapter
      // to this same set, so this should be unreachable in practice.
      rejectedNever++;
      continue;
    }
    tierACount++;
    if (isTextuallyDuplicate(f.claim, runningCorpus)) {
      rejectedDup++;
      continue;
    }
    const chapterId = f.suggestedChapter as CanonicalChapterId;
    const list = candidatesByChapter.get(chapterId) ?? [];
    list.push(f);
    candidatesByChapter.set(chapterId, list);
    runningCorpus.push(f.claim); // a near-duplicate can't land in a second chapter either
  }

  const blocksByChapter: Partial<Record<CanonicalChapterId, CanonicalSectionBlock[]>> = {};
  const selectedByChapter: Record<string, number> = {};
  let selectedCount = 0;
  let rejectedCap = 0;

  for (const [chapterId, candidates] of candidatesByChapter) {
    const winner = candidates.slice().sort((x, y) => confidenceRank(y.confidence) - confidenceRank(x.confidence))[0];
    rejectedCap += candidates.length - 1;
    const copy = translateFindingToUserCopy(winner, locale);
    blocksByChapter[chapterId] = [
      {
        blockId: `expert.${winner.id}`,
        title: copy.title,
        body: copy.body,
        evidenceIds: winner.evidenceRefs,
        structuredData: {
          expertFindingId: winner.id,
          classification: winner.classification,
          confidence: winner.confidence,
          psychCrossCheck: winner.psychCrossCheck,
        },
      },
    ];
    selectedByChapter[chapterId] = 1;
    selectedCount += 1;
  }

  return {
    blocksByChapter,
    meta: {
      schemaVersion: "romantic_expert_consumption_v1",
      totalFindings: findings.length,
      tierACount,
      tierBCount,
      tierCCount,
      rejectedNeverCount: rejectedNever,
      rejectedDuplicateAgainstReportCount: rejectedDup,
      rejectedChapterCapCount: rejectedCap,
      selectedCount,
      selectedByChapter,
    },
  };
}
