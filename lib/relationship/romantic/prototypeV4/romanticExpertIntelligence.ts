/**
 * Phase 4A — Expert Intelligence orchestrator.
 *
 * Additive and non-blocking by construction: buildRomanticExpertIntelligence
 * never throws — any failure (network, timeout, invalid JSON, empty result)
 * resolves to an empty findings array with meta.failed=true. The deterministic
 * report this attaches to must remain fully valid without it.
 *
 * Reuses existing infra rather than building a second LLM pipeline:
 *   - openai.chat.completions.create pattern from romanticSajuDeep/index.ts
 *     (same response_format: json_object contract)
 *   - fetchLlmJsonWithParseRetry from lib/relationship/parseLlmJson.ts
 *     (generic, already shared across domains)
 */
import type OpenAI from "openai";
import { fetchLlmJsonWithParseRetry } from "../../parseLlmJson";
import type { CanonicalRelationshipStoryPlan } from "./canonicalStoryPlanTypes";
import type { IndividualSajuChart } from "../../../personCore/individualSaju/types";
import type { RomanticPsychMatchAxisResult } from "../../../prompts/relationshipPremium/romanticSajuDeep/outputSchema";
import { buildEvidenceSynthesisPrompt, buildSajuDiscoveryPrompt } from "./romanticExpertIntelligencePrompt";
import type {
  RomanticExpertFinding,
  RomanticExpertFindingRaw,
  RomanticExpertIntelligenceResult,
  RomanticExpertMode,
  RomanticExpertClassification,
  RomanticExpertNovelty,
  RomanticExpertPsychCrossCheck,
} from "./romanticExpertIntelligenceTypes";

/** Env-overridable, defaults to the same model romanticSajuDeep already uses
 * in production — do not introduce a pricier model without a configured
 * override (spec §10). */
function expertLlmModel(): string {
  return process.env.RELATIONSHIP_ROMANTIC_EXPERT_MODEL ?? process.env.RELATIONSHIP_ROMANTIC_MODEL ?? "gpt-4o-mini";
}

function expertLlmMaxTokens(): number {
  const raw = process.env.RELATIONSHIP_ROMANTIC_EXPERT_MAX_TOKENS?.trim();
  if (raw) {
    const n = Number.parseInt(raw, 10);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return 3000;
}

async function callExpertLlmJson(
  openai: OpenAI,
  system: string,
  user: string,
  abortSignal?: AbortSignal,
): Promise<string> {
  if (abortSignal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }
  const completion = await openai.chat.completions.create(
    {
      model: expertLlmModel(),
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.4,
      max_tokens: expertLlmMaxTokens(),
      response_format: { type: "json_object" },
    },
    { signal: abortSignal },
  );
  return completion.choices[0]?.message.content?.trim() ?? "";
}

// ── Dedup safety net ─────────────────────────────────────────────────────
// The prompt already asks the model to self-classify novelty against a
// supplied "already discovered" list. This is a deterministic backstop that
// does not trust that self-report: any claim whose text overlaps heavily
// with an existing derivedMeaning/claim is force-downgraded regardless of
// what the model said.

function bigrams(text: string): Set<string> {
  const clean = text.replace(/\s+/g, "");
  const out = new Set<string>();
  for (let i = 0; i < clean.length - 1; i++) out.add(clean.slice(i, i + 2));
  return out;
}

function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const A = bigrams(a);
  const B = bigrams(b);
  if (A.size === 0 || B.size === 0) return 0;
  let intersection = 0;
  for (const g of A) if (B.has(g)) intersection++;
  return intersection / Math.min(A.size, B.size);
}

const DUPLICATE_SIMILARITY_THRESHOLD = 0.6;

function isTextuallyDuplicate(claim: string, existingTexts: string[]): boolean {
  return existingTexts.some((t) => similarity(claim, t) >= DUPLICATE_SIMILARITY_THRESHOLD);
}

// ── Validation / classification enforcement ──────────────────────────────

const VALID_MODES: RomanticExpertMode[] = ["evidence_synthesis", "saju_discovery"];
const VALID_CLASSIFICATIONS: RomanticExpertClassification[] = ["SUPPORTED_SYNTHESIS", "EXPERT_DERIVED", "SPECULATIVE"];
const VALID_NOVELTY: RomanticExpertNovelty[] = ["reinforces_existing", "deepens_existing", "genuinely_additive", "duplicate"];
const VALID_CONFIDENCE = ["high", "medium", "low"] as const;
const VALID_CHAPTERS = new Set([
  "c2_attraction",
  "c3_dynamics",
  "c4_conflict",
  "c5_misunderstanding",
  "c6_hidden_hearts",
  "c7_repair",
  "c8_strength_vulnerability",
]);

export function validateExpertFindings(
  raw: RomanticExpertFindingRaw[],
  context: {
    mode: RomanticExpertMode;
    existingTexts: string[]; // Cross-Signal derivedMeaning + already-accepted findings' claims
    axisKeys: Set<string>; // real keys present in axisResults, for psychCrossCheck grounding
  },
): RomanticExpertFinding[] {
  const out: RomanticExpertFinding[] = [];

  for (const item of raw) {
    // Hard-reject: missing required scalar fields entirely.
    if (
      !item.id ||
      !item.claim ||
      typeof item.claim !== "string" ||
      !item.claimBoundary?.supported ||
      !item.claimBoundary?.notSupported ||
      !item.reasoning
    ) {
      continue;
    }
    if (!VALID_MODES.includes(item.mode as RomanticExpertMode)) continue;
    if (!VALID_CLASSIFICATIONS.includes(item.classification as RomanticExpertClassification)) continue;
    if (!VALID_NOVELTY.includes(item.novelty as RomanticExpertNovelty)) continue;
    if (!VALID_CONFIDENCE.includes(item.confidence as (typeof VALID_CONFIDENCE)[number])) continue;

    let classification = item.classification as RomanticExpertClassification;
    let novelty = item.novelty as RomanticExpertNovelty;
    let rejectionReason: string | undefined;

    // Mode/classification pairing — a mode can only ever produce its own
    // classification family. Cross-contamination is downgraded, not dropped,
    // so the audit trail (rejectionReason) is visible.
    if (context.mode === "evidence_synthesis" && classification === "EXPERT_DERIVED") {
      classification = "SPECULATIVE";
      rejectionReason = "mode=evidence_synthesis cannot produce EXPERT_DERIVED — downgraded to SPECULATIVE";
    }
    if (context.mode === "saju_discovery" && classification === "SUPPORTED_SYNTHESIS") {
      classification = "SPECULATIVE";
      rejectionReason = "mode=saju_discovery cannot produce SUPPORTED_SYNTHESIS — downgraded to SPECULATIVE";
    }

    const sajuEvidence = Array.isArray(item.sajuEvidence) ? item.sajuEvidence.filter((s) => typeof s === "string" && s.trim()) : [];
    const evidenceRefs = Array.isArray(item.evidenceRefs) ? item.evidenceRefs.filter((s) => typeof s === "string" && s.trim()) : [];
    const deterministicEvidence = Array.isArray(item.deterministicEvidence)
      ? item.deterministicEvidence.filter((s) => typeof s === "string" && s.trim())
      : [];

    // EXPERT_DERIVED without cited chart evidence is unsupported by definition.
    if (classification === "EXPERT_DERIVED" && sajuEvidence.length === 0) {
      classification = "SPECULATIVE";
      rejectionReason = rejectionReason ?? "EXPERT_DERIVED with no sajuEvidence citations — downgraded to SPECULATIVE";
    }
    // SUPPORTED_SYNTHESIS citing nothing at all is unsupported by definition.
    if (classification === "SUPPORTED_SYNTHESIS" && evidenceRefs.length === 0 && deterministicEvidence.length === 0) {
      classification = "SPECULATIVE";
      rejectionReason = rejectionReason ?? "SUPPORTED_SYNTHESIS with no evidenceRefs/deterministicEvidence — downgraded to SPECULATIVE";
    }

    // Deterministic dedup backstop — never trust the model's own novelty
    // label as the sole gate.
    if (novelty !== "duplicate" && isTextuallyDuplicate(item.claim, context.existingTexts)) {
      novelty = "duplicate";
      rejectionReason = rejectionReason ?? "textual similarity to existing finding exceeded threshold — forced novelty=duplicate";
    }

    // renderEligible is ALWAYS re-derived here — the model's own renderEligible
    // value (if any) is discarded, per spec §4/§16.E ("validation strategy").
    const renderEligible = classification !== "SPECULATIVE" && novelty !== "duplicate";

    // psychCrossCheck: only trust CONFIRMED/CONTRADICTED when grounded in a
    // real axis key actually present in this report's axisResults.
    let psychCrossCheck: RomanticExpertPsychCrossCheck | undefined;
    if (item.psychCrossCheck?.status) {
      const status = item.psychCrossCheck.status as RomanticExpertPsychCrossCheck["status"];
      const axisKey = item.psychCrossCheck.axisKey ?? null;
      const grounded = axisKey ? context.axisKeys.has(axisKey) : false;
      const needsGrounding = status === "CONFIRMED_BY_CURRENT" || status === "CONTRADICTED_BY_CURRENT";
      psychCrossCheck = {
        status: needsGrounding && !grounded ? "NOT_MEASURED" : status,
        axisKey: grounded ? axisKey : null,
        note: item.psychCrossCheck.note ?? "",
      };
    }

    const subjects = Array.isArray(item.subjects)
      ? (item.subjects.filter((s) => s === "a" || s === "b" || s === "pair") as Array<"a" | "b" | "pair">)
      : [];

    out.push({
      id: item.id,
      mode: item.mode as RomanticExpertMode,
      classification,
      insightType: item.insightType ?? "unspecified",
      subjects,
      claim: item.claim,
      evidenceRefs,
      sajuEvidence,
      deterministicEvidence,
      reasoning: item.reasoning,
      confidence: item.confidence as "high" | "medium" | "low",
      novelty,
      claimBoundary: { supported: item.claimBoundary.supported!, notSupported: item.claimBoundary.notSupported! },
      suggestedChapter: VALID_CHAPTERS.has(item.suggestedChapter ?? "") ? item.suggestedChapter! : "c8_strength_vulnerability",
      renderEligible,
      psychCrossCheck,
      rejectionReason,
    });
  }

  return out;
}

// ── Orchestrator ──────────────────────────────────────────────────────────

export async function buildRomanticExpertIntelligence(params: {
  openai: OpenAI;
  storyPlan: CanonicalRelationshipStoryPlan;
  chartA: IndividualSajuChart;
  chartB: IndividualSajuChart;
  axisResults: RomanticPsychMatchAxisResult[];
  names: { a: string; b: string };
  locale: "ko-KR" | "en-US";
  abortSignal?: AbortSignal;
}): Promise<RomanticExpertIntelligenceResult> {
  const { openai, storyPlan, chartA, chartB, axisResults, names, locale, abortSignal } = params;
  const model = expertLlmModel();
  const axisKeys = new Set(axisResults.map((r) => r.axis_key));
  const crossSignalTexts = (storyPlan.crossSignalInsightsV1 ?? []).map((i) => i.derivedMeaning);

  let modeAFindings: RomanticExpertFinding[] = [];
  let modeBFindings: RomanticExpertFinding[] = [];
  let failed = false;
  let failureReason: string | undefined;

  try {
    const { system, user } = buildEvidenceSynthesisPrompt(storyPlan, names, locale);
    const raw = await fetchLlmJsonWithParseRetry<{ findings?: RomanticExpertFindingRaw[] }>(
      () => callExpertLlmJson(openai, system, user, abortSignal),
      { label: "romantic-expert-mode-a" },
    );
    modeAFindings = validateExpertFindings(Array.isArray(raw.findings) ? raw.findings : [], {
      mode: "evidence_synthesis",
      existingTexts: crossSignalTexts,
      axisKeys,
    });
  } catch (err) {
    failed = true;
    failureReason = `mode_a_failed: ${err instanceof Error ? err.message : String(err)}`;
  }

  try {
    const { system, user } = buildSajuDiscoveryPrompt({
      chartA,
      chartB,
      existingFindingsSummary: [...crossSignalTexts, ...modeAFindings.map((f) => f.claim)],
      axisResults,
      names,
      locale,
    });
    const raw = await fetchLlmJsonWithParseRetry<{ findings?: RomanticExpertFindingRaw[] }>(
      () => callExpertLlmJson(openai, system, user, abortSignal),
      { label: "romantic-expert-mode-b" },
    );
    modeBFindings = validateExpertFindings(Array.isArray(raw.findings) ? raw.findings : [], {
      mode: "saju_discovery",
      existingTexts: [...crossSignalTexts, ...modeAFindings.map((f) => f.claim)],
      axisKeys,
    });
  } catch (err) {
    failed = true;
    failureReason = failureReason
      ? `${failureReason}; mode_b_failed: ${err instanceof Error ? err.message : String(err)}`
      : `mode_b_failed: ${err instanceof Error ? err.message : String(err)}`;
  }

  const findings = [...modeAFindings, ...modeBFindings];

  return {
    findings,
    meta: {
      model,
      callCount: 2,
      modeACount: modeAFindings.length,
      modeBCount: modeBFindings.length,
      totalFindingsReturned: findings.length,
      totalFindingsRenderEligible: findings.filter((f) => f.renderEligible).length,
      failed,
      failureReason,
    },
  };
}

/** Never-throwing entry point — the only one production code should call.
 * Swallows anything validateExpertFindings/buildRomanticExpertIntelligence
 * itself doesn't already catch (e.g. a synchronous throw building the
 * prompt), so a caller can `await` this unconditionally. */
export async function buildRomanticExpertIntelligenceSafe(
  params: Parameters<typeof buildRomanticExpertIntelligence>[0],
): Promise<RomanticExpertIntelligenceResult> {
  try {
    return await buildRomanticExpertIntelligence(params);
  } catch (err) {
    return {
      findings: [],
      meta: {
        model: expertLlmModel(),
        callCount: 0,
        modeACount: 0,
        modeBCount: 0,
        totalFindingsReturned: 0,
        totalFindingsRenderEligible: 0,
        failed: true,
        failureReason: `unexpected_error: ${err instanceof Error ? err.message : String(err)}`,
      },
    };
  }
}
