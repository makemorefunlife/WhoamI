import OpenAI from "openai";
import { logServerError } from "@/lib/security/safeLog";
import {
  getDeepEssenceStructuredSystemPrompt,
  buildDeepEssenceStructuredPartAUserPrompt,
  buildDeepEssenceStructuredPartBUserPrompt,
} from "@/lib/prompts/deepEssenceStructured";
import { fetchLlmJsonWithParseRetry } from "@/lib/relationship/parseLlmJson";
import {
  isDeepEssencePartA,
  isDeepEssencePartB,
  isDeepEssenceStructuredReport,
} from "@/lib/report/deepEssenceStructuredSchema";
import {
  coerceDeepEssencePartA,
  coerceDeepEssencePartB,
} from "@/lib/report/coerceDeepEssenceStructured";
import { PRIMARY_AXIS_KEYS } from "@/lib/v2/survey/types";
import type { PrimaryAxisKey, PrimaryAxesScores } from "@/lib/v2/survey/types";
import { normalizeLocale, type Locale } from "@/lib/i18n/locale";
import {
  dedupeAndBackfillChecklist,
  buildChecklistComparisonTexts,
  SINGLE_ITEM_NEAR_VERBATIM_THRESHOLD,
} from "@/lib/report/deepEssenceChecklistDedup";
import { polishDeepEssenceStructuredReport } from "@/lib/report/polishDeepEssenceStructured";
import { logServerEvent } from "@/lib/security/safeLog";
import {
  formatPart01EvidenceForPrompt,
  filterKnownEvidenceRefs,
  type Part01PromptEvidence,
} from "@/lib/report/formatPart01EvidenceForPrompt";
import type { Part01IdentityEvidencePacket } from "@/lib/v1/slim/part01IdentityEvidence";

import type {
  DeepEssenceStrengthOrWatchout,
  DeepEssenceEnergyBar,
  DeepEssenceWoundSteadyRow,
  DeepEssencePlaybookRow,
  DeepEssenceStructuredReport,
} from "@/lib/report/deepEssenceStructuredSchema";
export type {
  DeepEssenceStrengthOrWatchout,
  DeepEssenceEnergyBar,
  DeepEssenceWoundSteadyRow,
  DeepEssencePlaybookRow,
  DeepEssenceStructuredReport,
};
export { isDeepEssenceStructuredReport } from "@/lib/report/deepEssenceStructuredSchema";

export type DeepEssenceStructuredLlmInput = {
  surveyAnalysis: string;
  essenceAnalysisSummary: string;
  astrologyInterpretation: string;
  currentAxisScores: PrimaryAxesScores;
  locale?: Locale | string;
  /**
   * Batch 3 — optional. Grounds Core Mode / Growth Edge in Part01 Identity
   * Evidence when available. Absent/null reproduces exact pre-Batch-3
   * behavior (Batch 3 rule: grounding failure/absence must never break
   * Deep Essence generation).
   */
  part01Evidence?: Part01IdentityEvidencePacket | null;
};

export type DeepEssenceStructuredLlmResult = {
  structured: DeepEssenceStructuredReport | null;
  source: "llm" | "fallback";
};

function clampAxisScores(
  raw: Record<string, unknown>,
  floor: PrimaryAxesScores,
): PrimaryAxesScores {
  const out = {} as PrimaryAxesScores;
  for (const key of PRIMARY_AXIS_KEYS) {
    const value = Number(raw[key]);
    const min = floor[key] ?? 0;
    out[key] = Math.max(min, Math.min(100, Math.round(value)));
  }
  return out;
}

async function callLlmJson(
  openai: OpenAI,
  system: string,
  user: string,
  label: string,
): Promise<string> {
  const t0 = Date.now();
  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_INTEGRATED_MODEL?.trim() || "gpt-4o-mini",
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.6,
    max_tokens: 4096,
    response_format: { type: "json_object" },
  });
  // Latency observability, added during the personal-analysis timeout
  // investigation — finish_reason "length" means the model hit max_tokens
  // and the JSON is truncated, which throws a parse SyntaxError and
  // triggers a full extra retry call (roughly doubling latency for that
  // leg). Kept as a permanent lightweight signal so a future truncation/
  // slow-call regression on this route shows up in logs instead of only
  // as a user-facing timeout. (Note: usage_completion_count, not
  // "completion_tokens" — safeLog's SECRET_KEY redacts any key containing
  // the substring "token", which would otherwise blank this out.)
  logServerEvent("runDeepEssenceStructuredLlm", "llm_call_timing", {
    label,
    duration_ms: Date.now() - t0,
    finish_reason: completion.choices[0]?.finish_reason,
    usage_completion_count: completion.usage?.completion_tokens,
  });
  return completion.choices[0]?.message.content?.trim() ?? "";
}

// Exported for direct testability (F1 wiring fix) — same convention as
// similarityScore/coerceDeepEssencePartA elsewhere in this codebase.
export function buildPartAExcerpt(
  partA: Record<string, unknown>,
  promptEvidence: Part01PromptEvidence | null,
): string {
  // Part B 프롬프트에 톤·인물상을 이어가기 위한 최소 요약(전체 JSON을 다시 보내지 않음)
  try {
    // F1 wiring fix (latency-architecture audit) — several Part B prompt
    // rules already assumed this data would be here: checklist's anchor
    // list ("the primary/widest axis gap (gap_deep_dive)", "the adaptation
    // tension named in adaptation_story"), relationships.pattern's "same
    // already-provided gap/alignment axis" thread, and closing's
    // "natural_tendency/current_pattern material". It never was — this
    // wires the ACTUAL generated values in, compactly, using the same
    // deterministic "primary = widest gap" selection
    // (promptEvidence.axisInterpretation.gaps is already sorted widest-
    // first, see selectAxisHighlights) that decided which axes Part A
    // itself was even asked to interpret. No new analysis: this only
    // extracts fields Part A already wrote.
    const axisInterpretations = partA.axis_interpretations as
      | {
          gap_deep_dive?: Record<
            string,
            { natural_tendency?: string; current_pattern?: string; may_cost?: string }
          >;
          alignment_highlight?: Record<
            string,
            { natural_tendency?: string; current_pattern?: string }
          >;
        }
      | undefined;

    const primaryGapAxisKey = promptEvidence?.axisInterpretation.gaps[0]?.axis;
    const primaryGapEntry = primaryGapAxisKey
      ? axisInterpretations?.gap_deep_dive?.[primaryGapAxisKey]
      : undefined;
    const primary_gap_axis = primaryGapEntry
      ? {
          axis: primaryGapAxisKey,
          natural_tendency: primaryGapEntry.natural_tendency,
          current_pattern: primaryGapEntry.current_pattern,
          cost: primaryGapEntry.may_cost,
        }
      : undefined;

    const alignmentAxisKey = promptEvidence?.axisInterpretation.alignment?.axis;
    const alignmentEntry = alignmentAxisKey
      ? axisInterpretations?.alignment_highlight?.[alignmentAxisKey]
      : undefined;
    const alignment_axis = alignmentEntry
      ? {
          axis: alignmentAxisKey,
          natural_tendency: alignmentEntry.natural_tendency,
          current_pattern: alignmentEntry.current_pattern,
        }
      : undefined;

    // adaptation_story's own last beat is ALREADY defined as "a closing
    // paragraph holding both the natural direction and the current way of
    // living together" (see ADAPTATION_STORY_SCHEMA_FIELD) — the shortest
    // genuine tension/recognition summary available is that last paragraph,
    // taken as-is. No new summarization, no new LLM call.
    const adaptationStory = partA.adaptation_story as { narrative?: string } | undefined;
    const adaptationParagraphs = adaptationStory?.narrative
      ?.split(/\n\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    const adaptation_recognition = adaptationParagraphs?.length
      ? adaptationParagraphs[adaptationParagraphs.length - 1]
      : undefined;

    return JSON.stringify({
      summary: partA.summary,
      strengths: (partA.strengths as { title: string }[] | undefined)?.map((s) => s.title),
      watchouts: (partA.watchouts as { title: string }[] | undefined)?.map((w) => w.title),
      energy_headline: (partA.energy as { headline?: string } | undefined)?.headline,
      // Part 05 Batch 1 — already-generated Part A output, not new evidence;
      // lets future.leap synthesize a long-term-fit signal without a new Lens.
      energy_optimal: (partA.energy as { optimal?: string[] } | undefined)?.optimal,
      ...(primary_gap_axis ? { primary_gap_axis } : {}),
      ...(alignment_axis ? { alignment_axis } : {}),
      ...(adaptation_recognition ? { adaptation_recognition } : {}),
    });
  } catch {
    return "";
  }
}

/**
 * 유료 심화 리포트 — Part 01~05 + 부록 구조화 생성 (2단계 LLM 호출).
 * 실패 시 null을 반환하며, 호출부는 기존 산문 리포트(report: string)로 폴백한다.
 * en-US · ko-KR 둘 다 지원한다 (locale 인자로 응답 언어를 지정).
 *
 * 타입/검증기는 lib/report/deepEssenceStructuredSchema.ts(서버·클라이언트 공용)에
 * 있다. 스키마를 바꿀 땐 그 파일만 고치면 된다 — 캐시 검증(slimIntegratedCache.ts)도
 * 같은 검증기를 쓰기 때문에 여기서 중복 정의하지 않는다.
 */
export async function runDeepEssenceStructuredLlm(
  input: DeepEssenceStructuredLlmInput,
): Promise<DeepEssenceStructuredLlmResult> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return { structured: null, source: "fallback" };
  }

  const openai = new OpenAI({ apiKey });
  const systemPrompt = getDeepEssenceStructuredSystemPrompt(input.locale);

  try {
    // Batch 3 — additive grounding. formatPart01EvidenceForPrompt returns
    // null on missing/failed packet, which reproduces the exact pre-Batch-3
    // prompt (buildDeepEssenceStructuredPartAUserPrompt treats
    // part01Evidence: null same as omitted).
    const promptEvidence = formatPart01EvidenceForPrompt(input.part01Evidence);

    const userA = buildDeepEssenceStructuredPartAUserPrompt({
      surveyAnalysis: input.surveyAnalysis,
      essenceAnalysisSummary: input.essenceAnalysisSummary,
      birthEnergyContext: input.astrologyInterpretation,
      currentAxisScores: input.currentAxisScores,
      locale: input.locale,
      part01Evidence: promptEvidence
        ? {
            coreModeText: promptEvidence.coreModeText,
            growthEdgeText: promptEvidence.growthEdgeText,
            layeredIdentity: {
              firstImpressionText: promptEvidence.layeredIdentity.firstImpression.text,
              knownSelfText: promptEvidence.layeredIdentity.knownSelf.text,
              closePrivateSelfText: promptEvidence.layeredIdentity.closePrivateSelf.text,
              naturalSelfAndDeepNeedsText: promptEvidence.layeredIdentity.naturalSelfAndDeepNeeds.text,
            },
            strengthsWatchoutsText: promptEvidence.strengthsWatchoutsText,
            energyText: promptEvidence.energyText,
            axisInterpretation: {
              innateEvidenceText: promptEvidence.axisInterpretation.innateEvidenceText,
              gaps: promptEvidence.axisInterpretation.gaps.map((g) => ({
                axis: g.axis,
                subjectText: g.subjectText,
                currentText: g.currentText,
              })),
              alignment: promptEvidence.axisInterpretation.alignment
                ? {
                    axis: promptEvidence.axisInterpretation.alignment.axis,
                    subjectText: promptEvidence.axisInterpretation.alignment.subjectText,
                    currentText: promptEvidence.axisInterpretation.alignment.currentText,
                  }
                : null,
            },
            adaptationStoryEligible: promptEvidence.adaptationStoryEligible,
          }
        : null,
    });
    const partARaw = await fetchLlmJsonWithParseRetry<Record<string, unknown>>(
      () => callLlmJson(openai, systemPrompt, userA, "part-a"),
      { label: "deep-essence-structured-a" },
    );
    const coercedA = coerceDeepEssencePartA(partARaw, input.currentAxisScores, normalizeLocale(input.locale));
    if (coercedA.notes.length) {
      logServerEvent("runDeepEssenceStructuredLlm", "part_a_coerced", {
        notes: coercedA.notes.slice(0, 8),
      });
    }
    if (!isDeepEssencePartA(coercedA.value)) {
      logServerError(
        "runDeepEssenceStructuredLlm:",
        undefined,
        "part_a_invalid",
      );
      return { structured: null, source: "fallback" };
    }
    const partA = coercedA.value;
    // Batch 3 — never trust LLM-invented evidence_refs: keep only keys that
    // actually appeared in the grounding text shown to it.
    if (promptEvidence) {
      const summary = partA.summary as Record<string, unknown>;
      const filteredCoreModeRefs = filterKnownEvidenceRefs(
        summary.core_mode_evidence_refs,
        promptEvidence.coreModeKnownKeys,
      );
      const filteredGrowthEdgeRefs = filterKnownEvidenceRefs(
        summary.growth_edge_evidence_refs,
        promptEvidence.growthEdgeKnownKeys,
      );
      if (filteredCoreModeRefs) summary.core_mode_evidence_refs = filteredCoreModeRefs;
      else delete summary.core_mode_evidence_refs;
      if (filteredGrowthEdgeRefs) summary.growth_edge_evidence_refs = filteredGrowthEdgeRefs;
      else delete summary.growth_edge_evidence_refs;

      // Batch 4 — same never-trust-LLM-refs rule, per layer, using only that
      // layer's own known-key set (a layer's refs can never point at another
      // layer's or Core Mode's/Growth Edge's evidence).
      const layered = (partA as Record<string, unknown>).layered_identity as
        | Record<string, Record<string, unknown>>
        | undefined;
      if (layered) {
        const LAYER_KEY_MAP = {
          first_impression: promptEvidence.layeredIdentity.firstImpression.knownKeys,
          known_self: promptEvidence.layeredIdentity.knownSelf.knownKeys,
          close_private_self: promptEvidence.layeredIdentity.closePrivateSelf.knownKeys,
          natural_self_and_deep_needs: promptEvidence.layeredIdentity.naturalSelfAndDeepNeeds.knownKeys,
        } as const;
        for (const [key, knownKeys] of Object.entries(LAYER_KEY_MAP)) {
          const layer = layered[key];
          if (!layer) continue;
          const filtered = filterKnownEvidenceRefs(layer.evidence_refs, knownKeys);
          if (filtered) layer.evidence_refs = filtered;
          else delete layer.evidence_refs;
        }

        // IA Batch 2 — same never-trust-LLM-refs rule for synthesis, but
        // validated against the UNION of all four layers' known keys (not
        // one isolated bucket) since synthesis is explicitly about
        // connecting layers. coerceDeepEssenceStructured.ts already dropped
        // synthesis entirely if fewer than 2 layers survived coercion, so
        // `layered.synthesis` being present here already implies >= 2 layers.
        const synthesis = layered.synthesis;
        if (synthesis) {
          const filtered = filterKnownEvidenceRefs(
            synthesis.evidence_refs,
            promptEvidence.layeredIdentity.synthesisKnownKeys,
          );
          if (filtered) synthesis.evidence_refs = filtered;
          else delete synthesis.evidence_refs;
        }
      }

      // IA Batch 3 — adaptation_story evidence_refs filtering, same
      // never-trust-LLM-refs rule, validated against the union pool built
      // in formatPart01EvidenceForPrompt.ts (axis interpretation + layered
      // identity + energy known keys already shown/written above in this
      // same response). Defensive eligibility re-check: even though the
      // schema field is only OFFERED to the model when
      // adaptationStoryEligible is true, a model can still add an
      // un-requested key — never trust that omission alone, strip it here
      // too if the deterministic gate said this generation wasn't eligible.
      const adaptationStory = (partA as Record<string, unknown>).adaptation_story as
        | Record<string, unknown>
        | undefined;
      if (adaptationStory && !promptEvidence.adaptationStoryEligible) {
        delete (partA as Record<string, unknown>).adaptation_story;
      } else if (adaptationStory) {
        const filtered = filterKnownEvidenceRefs(
          adaptationStory.evidence_refs,
          promptEvidence.adaptationStoryKnownKeys,
        );
        if (filtered) adaptationStory.evidence_refs = filtered;
        else delete adaptationStory.evidence_refs;
      }

      // Batch 6 — same rule, per strength/watchout item. Strengths and
      // watchouts intentionally share one known-key set (not per-layer
      // isolated like Batch 4) so a dual-natured trait's evidence can
      // legitimately ground both an item in strengths and one in watchouts.
      const filterItemRefs = (items: unknown) => {
        if (!Array.isArray(items)) return;
        for (const item of items as Record<string, unknown>[]) {
          const filtered = filterKnownEvidenceRefs(
            item.evidence_refs,
            promptEvidence.strengthsWatchoutsKnownKeys,
          );
          if (filtered) item.evidence_refs = filtered;
          else delete item.evidence_refs;
        }
      };
      filterItemRefs(partA.strengths);
      filterItemRefs(partA.watchouts);

      // Part 02 Batch 1 — same rule, for energy.evidence_refs.
      const energy = partA.energy as Record<string, unknown>;
      const filteredEnergyRefs = filterKnownEvidenceRefs(
        energy.evidence_refs,
        promptEvidence.energyKnownKeys,
      );
      if (filteredEnergyRefs) energy.evidence_refs = filteredEnergyRefs;
      else delete energy.evidence_refs;

      // Batch 8 — same rule, but only for the deterministically-selected
      // gap/alignment axes (never all 6). current_evidence_refs validates
      // only against that axis's own Current Self known keys (isolated,
      // like Batch 4's layers); innate_evidence_refs validates against the
      // one shared Innate Self pool (like Batch 6's shared set).
      const axisInterpretations = (partA as Record<string, unknown>).axis_interpretations as
        | { gap_deep_dive?: Record<string, Record<string, unknown>>; alignment_highlight?: Record<string, Record<string, unknown>> }
        | undefined;
      if (axisInterpretations) {
        const currentKnownKeysByAxis = new Map<string, Set<string>>([
          ...promptEvidence.axisInterpretation.gaps.map(
            (g) => [g.axis, g.currentKnownKeys] as const,
          ),
          ...(promptEvidence.axisInterpretation.alignment
            ? [
                [
                  promptEvidence.axisInterpretation.alignment.axis,
                  promptEvidence.axisInterpretation.alignment.currentKnownKeys,
                ] as const,
              ]
            : []),
        ]);
        const sanitizeAxisRefs = (bucket: Record<string, Record<string, unknown>> | undefined) => {
          if (!bucket) return;
          for (const [axis, interp] of Object.entries(bucket)) {
            const currentKnownKeys = currentKnownKeysByAxis.get(axis);
            const filteredCurrent = filterKnownEvidenceRefs(
              interp.current_evidence_refs,
              currentKnownKeys,
            );
            const filteredInnate = filterKnownEvidenceRefs(
              interp.innate_evidence_refs,
              promptEvidence.axisInterpretation.innateEvidenceKnownKeys,
            );
            if (filteredCurrent) interp.current_evidence_refs = filteredCurrent;
            else delete interp.current_evidence_refs;
            if (filteredInnate) interp.innate_evidence_refs = filteredInnate;
            else delete interp.innate_evidence_refs;
          }
        };
        sanitizeAxisRefs(axisInterpretations.gap_deep_dive);
        sanitizeAxisRefs(axisInterpretations.alignment_highlight);
      }
    }

    const userB = buildDeepEssenceStructuredPartBUserPrompt({
      surveyAnalysis: input.surveyAnalysis,
      essenceAnalysisSummary: input.essenceAnalysisSummary,
      birthEnergyContext: input.astrologyInterpretation,
      partAExcerpt: buildPartAExcerpt(partA, promptEvidence),
      locale: input.locale,
      part01Evidence: promptEvidence
        ? {
            relationshipText: promptEvidence.relationshipText,
            practiceText: promptEvidence.practiceText,
            futureText: promptEvidence.futureText,
          }
        : null,
    });
    const partBRaw = await fetchLlmJsonWithParseRetry<Record<string, unknown>>(
      () => callLlmJson(openai, systemPrompt, userB, "part-b"),
      { label: "deep-essence-structured-b" },
    );
    const coercedB = coerceDeepEssencePartB(partBRaw);
    if (coercedB.notes.length) {
      logServerEvent("runDeepEssenceStructuredLlm", "part_b_coerced", {
        notes: coercedB.notes.slice(0, 8),
      });
    }
    if (!isDeepEssencePartB(coercedB.value)) {
      logServerError(
        "runDeepEssenceStructuredLlm:",
        undefined,
        "part_b_invalid",
      );
      return { structured: null, source: "fallback" };
    }
    const partB = coercedB.value;

    // Checklist Dedup Batch 1 — deterministic surface-level duplicate
    // safety net. Applied after Part B is coerced/validated (playbook,
    // future, and checklist are all present here) and before evidence_refs
    // sanitization below, since neither block touches the other's data.
    {
      const playbookForDedup = partB.playbook as {
        rows: { better: string }[];
        heated: string;
        reset: string;
      };
      const futureForDedup = partB.future as { remember: string[]; leap: string };
      // Full Integration QA — also compare against Part A's Growth Edge
      // next-step field, which checklist items were observed near-copying.
      const comparisonTexts = buildChecklistComparisonTexts(
        playbookForDedup,
        futureForDedup,
        partA.summary.growth_edge_real_life_pattern,
      );
      const dedupResult = dedupeAndBackfillChecklist({
        checklist: partB.checklist,
        comparisonTexts,
        locale: normalizeLocale(input.locale),
        min: 1,
        max: 1,
        // Batch 2 — the default CHECKLIST_DUPLICATE_THRESHOLD was calibrated
        // for 8-12-item bolt-on duplicates, not a single evidence-connected
        // One Next Move item, which is expected to share vocabulary with
        // playbook/future by design. See SINGLE_ITEM_NEAR_VERBATIM_THRESHOLD.
        threshold: SINGLE_ITEM_NEAR_VERBATIM_THRESHOLD,
      });
      partB.checklist = dedupResult.checklist;
      if (dedupResult.flagged.length) {
        logServerEvent("runDeepEssenceStructuredLlm", "checklist_dedup_flagged", {
          locale: normalizeLocale(input.locale),
          count: dedupResult.flagged.length,
          backfilled: dedupResult.backfilledCount,
          pairs: dedupResult.flagged.map((f) => ({
            score: Math.round(f.score * 100) / 100,
            item: f.item.slice(0, 24),
            matched: f.matchedText.slice(0, 24),
          })),
        });
      }
    }

    // Part 03 Batch 1 — same never-trust-LLM-refs rule as Part A's sections.
    if (promptEvidence) {
      const relationships = partB.relationships as Record<string, unknown>;
      const filteredRelationshipRefs = filterKnownEvidenceRefs(
        relationships.evidence_refs,
        promptEvidence.relationshipKnownKeys,
      );
      if (filteredRelationshipRefs) relationships.evidence_refs = filteredRelationshipRefs;
      else delete relationships.evidence_refs;

      // Part 04 Batch 1 — same rule, for playbook.evidence_refs.
      const playbook = partB.playbook as Record<string, unknown>;
      const filteredPlaybookRefs = filterKnownEvidenceRefs(
        playbook.evidence_refs,
        promptEvidence.practiceKnownKeys,
      );
      if (filteredPlaybookRefs) playbook.evidence_refs = filteredPlaybookRefs;
      else delete playbook.evidence_refs;

      // Part 05 Batch 1 — same rule, for future.evidence_refs.
      const future = partB.future as Record<string, unknown>;
      const filteredFutureRefs = filterKnownEvidenceRefs(
        future.evidence_refs,
        promptEvidence.futureKnownKeys,
      );
      if (filteredFutureRefs) future.evidence_refs = filteredFutureRefs;
      else delete future.evidence_refs;
    }

    const merged = { ...partA, ...partB };
    if (!isDeepEssenceStructuredReport(merged)) {
      logServerError(
        "runDeepEssenceStructuredLlm:",
        undefined,
        "merged_invalid",
      );
      return { structured: null, source: "fallback" };
    }

    const withClampedRadar: DeepEssenceStructuredReport = {
      ...merged,
      radar_potential: clampAxisScores(
        merged.radar_potential as unknown as Record<string, unknown>,
        input.currentAxisScores,
      ),
    };
    // Prose-only tone polish — never blind tree-walk. Invalid polish → original.
    const structured = polishDeepEssenceStructuredReport(
      withClampedRadar,
      input.locale,
    );

    return { structured, source: "llm" };
  } catch (e) {
    const code =
      e && typeof e === "object" && "name" in e && e.name === "LlmJsonParseRetryError"
        ? "json_parse_exhausted"
        : "structured_throw";
    logServerError("runDeepEssenceStructuredLlm:", e, code);
    return { structured: null, source: "fallback" };
  }
}

export type { PrimaryAxisKey };
