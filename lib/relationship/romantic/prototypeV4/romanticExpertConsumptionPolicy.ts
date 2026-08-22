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

/** Phase 5A §6/§14 — multi-evidence findings are preferred as a tie-break,
 * secondary to confidence. Does not gate anything on its own (a single-evidence
 * finding can still win on confidence alone, per spec: "single-evidence findings
 * may still pass if the evidence is unusually direct"). */
function evidenceStrengthRank(f: RomanticExpertFinding): number {
  return f.discoveryQuality?.evidenceStrength === "multi" ? 1 : 0;
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

/** Phase 5B Part 3 — a Tier B finding that was matched to (or explicitly
 * failed to match) an existing block it could enrich. `targetBlockId: null`
 * means no safe target was found and the finding stays internal-only — this
 * is the expected, common case, not an error. */
export type TierBTargetMapping = {
  findingId: string;
  suggestedChapter: string;
  targetBlockId: string | null;
  claim: string;
  confidence: RomanticExpertFinding["confidence"];
};

export type ExpertConsumptionMeta = {
  schemaVersion: "romantic_expert_consumption_v1";
  totalFindings: number;
  tierACount: number;
  tierBCount: number;
  tierCCount: number;
  tierBTargetMappings: TierBTargetMapping[];
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
  const tierBTargetMappings: TierBTargetMapping[] = [];

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
      // Phase 5B Part 3 — safe target detection: only a block whose own
      // evidenceIds overlap this finding's evidenceRefs counts as a match.
      // Mode A findings are required (validateExpertFindings) to cite real
      // evidenceRefs, so this is a real provenance link, not a guess. No
      // fallback to "first block in chapter" — an unmatched finding stays
      // internal (targetBlockId: null), per spec: "If there is no clear
      // target: keep it internal. Do not force consumption."
      const chapterBlocks = existingSections.filter((s) => s.chapterId === f.suggestedChapter).flatMap((s) => s.blocks);
      const matchingBlock = chapterBlocks.find((b) => (b.evidenceIds ?? []).some((evId) => f.evidenceRefs.includes(evId)));
      tierBTargetMappings.push({
        findingId: f.id,
        suggestedChapter: f.suggestedChapter,
        targetBlockId: matchingBlock ? matchingBlock.blockId : null,
        claim: f.claim,
        confidence: f.confidence,
      });
      continue; // consumed via applyTierBEnrichment, not blocksByChapter — see design note above
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
    const winner = candidates
      .slice()
      .sort((x, y) => confidenceRank(y.confidence) - confidenceRank(x.confidence) || evidenceStrengthRank(y) - evidenceStrengthRank(x))[0];
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
      tierBTargetMappings,
      rejectedNeverCount: rejectedNever,
      rejectedDuplicateAgainstReportCount: rejectedDup,
      rejectedChapterCapCount: rejectedCap,
      selectedCount,
      selectedByChapter,
    },
  };
}

/**
 * Phase 5C Part 3 — corrects Phase 5B's append-only behavior per this
 * phase's explicit instruction: "Do NOT append Tier B as a new card...
 * original weaker prose removed/replaced." A matched Tier B finding's claim
 * now REPLACES its target block's body (the point of Tier B is that it
 * `deepens_existing` — its claim is a strengthened synthesis of what's
 * already there, not a footnote to it).
 *
 * Safety floor: replacement only happens when the claim is at least
 * REPLACE_LENGTH_FLOOR of the original body's length. A one-sentence Tier B
 * claim replacing a multi-paragraph block (attraction scenes, hidden-heart
 * detail, etc.) would make that block LESS specific, which is exactly what
 * this phase is trying to eliminate — so a claim that's too short to safely
 * stand alone falls back to appending instead, same as Phase 5B. This is a
 * disclosed judgment call, not a literal reading of "replaced" in every case.
 *
 * If two+ findings map to the same block, only the strongest (highest
 * confidence, ties broken by evidence strength) is used for replacement;
 * any others append, so a single block is never replaced twice.
 *
 * Immutable: returns a new sections array, never mutates the input.
 * Unmatched mappings (targetBlockId === null) are silently skipped — they
 * were already correctly kept internal-only by the caller.
 */
const REPLACE_LENGTH_FLOOR = 0.4;

export function applyTierBEnrichment(
  sections: CanonicalSection[],
  tierBTargetMappings: TierBTargetMapping[],
  locale: NarrativeLocale,
): CanonicalSection[] {
  const byBlockId = new Map<string, TierBTargetMapping[]>();
  for (const m of tierBTargetMappings) {
    if (!m.targetBlockId) continue;
    const list = byBlockId.get(m.targetBlockId) ?? [];
    list.push(m);
    byBlockId.set(m.targetBlockId, list);
  }
  if (byBlockId.size === 0) return sections;

  const L = (ko: string, en: string) => pick(locale, ko, en);
  return sections.map((section) => ({
    ...section,
    blocks: section.blocks.map((block) => {
      const mappings = byBlockId.get(block.blockId);
      if (!mappings || mappings.length === 0) return block;

      const [primary, ...rest] = mappings
        .slice()
        .sort((x, y) => confidenceRank(y.confidence) - confidenceRank(x.confidence));

      const canReplace = primary.claim.length >= block.body.length * REPLACE_LENGTH_FLOOR;
      const newBody = canReplace ? primary.claim : [block.body, `${L("더 깊이 보면: ", "Looking deeper: ")}${primary.claim}`].join("\n\n");
      const appended = rest.map((m) => `${L("더 깊이 보면: ", "Looking deeper: ")}${m.claim}`);

      return {
        ...block,
        body: [newBody, ...appended].join("\n\n"),
      };
    }),
  }));
}
