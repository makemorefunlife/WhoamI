import OpenAI from "openai";
import { logServerError } from "@/lib/security/safeLog";
import {
  getDeepEssenceStructuredSystemPrompt,
  buildDeepEssenceStructuredPartAUserPrompt,
  buildDeepEssenceStructuredPartBUserPrompt,
  getPart04ExpertSynthesisSystemPrompt,
  buildPart04ExpertSynthesisUserPrompt,
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
  selectFitPlan,
  filterKnownEvidenceRefs,
  type Part01PromptEvidence,
} from "@/lib/report/formatPart01EvidenceForPrompt";
import type { Part01IdentityEvidencePacket } from "@/lib/v1/slim/part01IdentityEvidence";
import {
  buildPersonalPart04StoryPlan,
  type PartASemanticContext,
} from "@/lib/report/buildPersonalPart04StoryPlan";

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
  part01Evidence?: Part01IdentityEvidencePacket | Part01PromptEvidence | null;
};

export type DeepEssenceStructuredLlmResult = {
  structured: DeepEssenceStructuredReport | null;
  source: "llm" | "fallback";
};

function clampAxisScores(
  potentials: Record<string, unknown> | undefined,
  currents: PrimaryAxesScores,
): PrimaryAxesScores {
  const result = { ...currents };
  if (!potentials || typeof potentials !== "object") return result;

  for (const axis of PRIMARY_AXIS_KEYS) {
    const rawVal = potentials[axis];
    const currentVal = currents[axis] ?? 50;
    if (typeof rawVal === "number" && !isNaN(rawVal)) {
      const rounded = Math.round(rawVal);
      result[axis] = Math.max(currentVal, Math.min(100, rounded));
    } else {
      result[axis] = currentVal;
    }
  }
  return result;
}

async function callLlmJson(
  openai: OpenAI,
  systemPrompt: string,
  userPrompt: string,
  label: string,
): Promise<string> {
  const modelName = process.env.DEEP_ESSENCE_LLM_MODEL?.trim() || "gpt-4o-mini";
  const startTime = Date.now();

  const completion = await openai.chat.completions.create({
    model: modelName,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.5,
  });

  const durationMs = Date.now() - startTime;
  logServerEvent("runDeepEssenceStructuredLlm", "llm_call_timing", {
    label,
    duration_ms: durationMs,
    finish_reason: completion.choices[0]?.finish_reason,
    usage_completion_count: completion.usage?.completion_tokens,
  });

  return completion.choices[0]?.message?.content?.trim() || "";
}

export function buildPartAExcerpt(
  partA: Record<string, unknown>,
  promptEvidence: Part01PromptEvidence | null,
): string {
  if (!partA || typeof partA !== "object") return "";
  try {
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
 * 심화 리포트 — Part 01~05 구조화 생성 (3단계 LLM 호출 디커플링 병렬 구조).
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
  const wallClockStart = Date.now();

  try {
    const promptEvidence = formatPart01EvidenceForPrompt(input.part01Evidence);

    // ── STEP 1: Part A Generation (everything EXCEPT adaptation_story) ──────
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
            storyPlan: promptEvidence.storyPlan,
          }
        : null,
    });

    const partAStart = Date.now();
    const partARaw = await fetchLlmJsonWithParseRetry<Record<string, unknown>>(
      () => callLlmJson(openai, systemPrompt, userA, "part-a"),
      { label: "deep-essence-structured-a" },
    );
    const partALatency = Date.now() - partAStart;

    const coercedA = coerceDeepEssencePartA(partARaw, input.currentAxisScores, normalizeLocale(input.locale));
    if (coercedA.notes.length) {
      logServerEvent("runDeepEssenceStructuredLlm", "part_a_coerced", {
        notes: coercedA.notes.slice(0, 8),
      });
    }
    if (!isDeepEssencePartA(coercedA.value)) {
      logServerError("runDeepEssenceStructuredLlm:", undefined, "part_a_invalid");
      return { structured: null, source: "fallback" };
    }
    const partA = coercedA.value;

    // Filter evidence refs for Part A
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

      const energy = partA.energy as Record<string, unknown>;
      const filteredEnergyRefs = filterKnownEvidenceRefs(
        energy.evidence_refs,
        promptEvidence.energyKnownKeys,
      );
      if (filteredEnergyRefs) energy.evidence_refs = filteredEnergyRefs;
      else delete energy.evidence_refs;

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

    // ── STEP 2: Build Part A Semantic Context & Final Story Plan ─────────────
    const partAObj = partA as Record<string, unknown>;
    const layeredObj = partAObj.layered_identity as Record<string, unknown> | undefined;
    const axisInterpObj = partAObj.axis_interpretations as Record<string, unknown> | undefined;

    let primaryGapProse: PartASemanticContext["primaryGapProse"] | undefined;
    if (axisInterpObj?.gap_deep_dive && typeof axisInterpObj.gap_deep_dive === "object") {
      const gapBucket = axisInterpObj.gap_deep_dive as Record<string, Record<string, string>>;
      const primaryGapKey = promptEvidence?.axisInterpretation.gaps[0]?.axis;
      if (primaryGapKey && gapBucket[primaryGapKey]) {
        const g = gapBucket[primaryGapKey];
        primaryGapProse = {
          naturalTendency: g.natural_tendency,
          currentPattern: g.current_pattern,
          gainedStrength: g.gives_you,
          hiddenCost: g.may_cost,
        };
      }
    }

    const partAContext: PartASemanticContext = {
      layeredIdentitySynthesis: (layeredObj?.synthesis as Record<string, string> | undefined)?.narrative,
      primaryGapProse,
    };

    const packet = input.part01Evidence && typeof input.part01Evidence === "object" && "axisComparisons" in input.part01Evidence
      ? (input.part01Evidence as Part01IdentityEvidencePacket)
      : null;

    const finalStoryPlan = buildPersonalPart04StoryPlan(packet, promptEvidence, partAContext);

    // ── STEP 3 & STEP 4: Parallel Part 04 Synthesis + Part B Execution ──────
    let part04Result: { narrative: string; evidence_refs: string[] } | null = null;
    let part04Latency = 0;
    let partBLatency = 0;

    const part04Promise = (async () => {
      if (!promptEvidence?.adaptationStoryEligible || !finalStoryPlan) {
        return null;
      }
      try {
        const p04Start = Date.now();
        const p04SysPrompt = getPart04ExpertSynthesisSystemPrompt(normalizeLocale(input.locale));
        const p04UserPrompt = buildPart04ExpertSynthesisUserPrompt({
          storyPlan: finalStoryPlan,
          partAContext,
          locale: normalizeLocale(input.locale),
        });

        const p04Raw = await fetchLlmJsonWithParseRetry<Record<string, unknown>>(
          () => callLlmJson(openai, p04SysPrompt, p04UserPrompt, "part-04-synthesis"),
          { label: "deep-essence-structured-part04" },
        );
        part04Latency = Date.now() - p04Start;

        const storyObj = p04Raw.adaptation_story as Record<string, unknown> | undefined;
        if (!storyObj || typeof storyObj.narrative !== "string") {
          return null;
        }

        const rawRefs = Array.isArray(storyObj.evidence_refs) ? storyObj.evidence_refs : [];
        const filtered = filterKnownEvidenceRefs(rawRefs, promptEvidence.adaptationStoryKnownKeys);
        if (!filtered) return null;

        const filteredSet = new Set(filtered);
        const families = new Set(
          filtered.map((ref) => promptEvidence.adaptationStoryKeyFamilies.get(ref)).filter(Boolean),
        );
        const hasAnchor = families.has("FAMILY_GAP") || families.has("FAMILY_CURRENT_PSYCH");
        const passesFamilyGate = families.size >= 2 && hasAnchor;

        const hasPrimaryRef = finalStoryPlan.requiredEvidence.primaryRefs.some((r) => filteredSet.has(r));
        const hasContrastRef =
          finalStoryPlan.requiredEvidence.contrastRefs.length === 0 ||
          finalStoryPlan.requiredEvidence.contrastRefs.some((r) => filteredSet.has(r));

        const passesRoleGate = hasPrimaryRef && hasContrastRef;

        if (passesFamilyGate && passesRoleGate) {
          return {
            narrative: storyObj.narrative,
            evidence_refs: filtered,
          };
        }
        return null;
      } catch (e) {
        logServerError("Part 04 Expert Synthesis execution failed:", e);
        return null;
      }
    })();

    const partBPromise = (async () => {
      const pBStart = Date.now();
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
      partBLatency = Date.now() - pBStart;
      return partBRaw;
    })();

    const [p04Res, partBRaw] = await Promise.all([part04Promise, partBPromise]);
    part04Result = p04Res;

    const coercedB = coerceDeepEssencePartB(partBRaw);
    if (coercedB.notes.length) {
      logServerEvent("runDeepEssenceStructuredLlm", "part_b_coerced", {
        notes: coercedB.notes.slice(0, 8),
      });
    }
    if (!isDeepEssencePartB(coercedB.value)) {
      logServerError("runDeepEssenceStructuredLlm:", undefined, "part_b_invalid");
      return { structured: null, source: "fallback" };
    }
    const partB = coercedB.value;

    {
      const playbookForDedup = partB.playbook as {
        rows: { better: string }[];
        heated: string;
        reset: string;
      };
      const futureForDedup = partB.future as { remember: string[]; leap: string };
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

    if (promptEvidence) {
      const relationships = partB.relationships as Record<string, unknown>;
      const filteredRelationshipRefs = filterKnownEvidenceRefs(
        relationships.evidence_refs,
        promptEvidence.relationshipKnownKeys,
      );
      if (filteredRelationshipRefs) relationships.evidence_refs = filteredRelationshipRefs;
      else delete relationships.evidence_refs;

      const playbook = partB.playbook as Record<string, unknown>;
      const filteredPlaybookRefs = filterKnownEvidenceRefs(
        playbook.evidence_refs,
        promptEvidence.practiceKnownKeys,
      );
      if (filteredPlaybookRefs) playbook.evidence_refs = filteredPlaybookRefs;
      else delete playbook.evidence_refs;

      const future = partB.future as Record<string, unknown>;
      const filteredFutureRefs = filterKnownEvidenceRefs(
        future.evidence_refs,
        promptEvidence.futureKnownKeys,
      );
      if (filteredFutureRefs) future.evidence_refs = filteredFutureRefs;
      else delete future.evidence_refs;
    }

    // ── STEP 5: Merge Part A + validated Part 04 + Part B ─────────────────────
    const merged = {
      ...partA,
      ...(part04Result ? { adaptation_story: part04Result } : {}),
      ...partB,
    };

    if (!isDeepEssenceStructuredReport(merged)) {
      logServerError("runDeepEssenceStructuredLlm:", undefined, "merged_invalid");
      return { structured: null, source: "fallback" };
    }

    const wallClockMs = Date.now() - wallClockStart;
    logServerEvent("runDeepEssenceStructuredLlm", "llm_latency_benchmark", {
      partA_ms: partALatency,
      part04_ms: part04Latency,
      partB_ms: partBLatency,
      wallClock_ms: wallClockMs,
      part04Eligible: !!finalStoryPlan,
      part04Success: !!part04Result,
    });

    const withClampedRadar: DeepEssenceStructuredReport = {
      ...merged,
      radar_potential: clampAxisScores(
        merged.radar_potential as unknown as Record<string, unknown>,
        input.currentAxisScores,
      ),
    };

    const fitPlan = input.part01Evidence ? selectFitPlan(input.part01Evidence) : null;
    const structured = polishDeepEssenceStructuredReport(
      withClampedRadar,
      input.locale,
      fitPlan,
    );

    return { structured, source: "llm" };
  } catch (e) {
    console.error("runDeepEssenceStructuredLlm Error:", e);
    const code =
      e && typeof e === "object" && "name" in e && e.name === "LlmJsonParseRetryError"
        ? "json_parse_exhausted"
        : "structured_throw";
    logServerError("runDeepEssenceStructuredLlm:", e, code);
    return { structured: null, source: "fallback" };
  }
}

export type { PrimaryAxisKey };
