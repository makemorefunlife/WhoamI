/**
 * Evidence-Grounded Narrative Editor — orchestrator + validation.
 *
 * Reuses romanticExpertIntelligence.ts's shared LLM-call plumbing
 * (callExpertLlmJson/expertLlmModel) and parseLlmJson.ts's generic retry
 * helper — no parallel LLM architecture. Non-blocking by construction, same
 * discipline as buildRomanticExpertIntelligenceSafe: any failure resolves to
 * zero edits, never throws, the deterministic report is always valid without
 * this layer succeeding.
 */
import type OpenAI from "openai";
import { fetchLlmJsonWithParseRetry } from "../../parseLlmJson";
import { callExpertLlmJson, expertLlmModel } from "./romanticExpertIntelligence";
import { buildNarrativeEditorPrompt } from "./romanticExpertIntelligencePrompt";
import type { CanonicalSection } from "./composeCanonicalSectionNarratives";
import type { RomanticCrossSignalChapterId } from "./canonicalStoryPlanTypes";
import type {
  NarrativeEditablePacket,
  RomanticNarrativeEdit,
  RomanticNarrativeEditRaw,
  RomanticNarrativeEditorResult,
} from "./romanticNarrativeEditorTypes";

/**
 * One curated block per locked chapter (spec §6/§9) — the smallest set that
 * covers every chapter this pass is scoped to, without touching c1/c9-c12.
 * Each chapter lists candidate blockIds in priority order because the exact
 * id is data-dependent (e.g. bilateralChanges may only have a "b_to_a"
 * entry for some pairs) — the first one present in that chapter is used.
 */
const TARGET_BLOCKS: Array<{ chapterOwner: RomanticCrossSignalChapterId; blockIds: string[] }> = [
  { chapterOwner: "c2_attraction", blockIds: ["attr.unique"] },
  { chapterOwner: "c3_dynamics", blockIds: ["face.stress"] },
  { chapterOwner: "c4_conflict", blockIds: ["loop.trigger"] },
  { chapterOwner: "c5_misunderstanding", blockIds: ["misread.a_observes_b", "misread.b_observes_a"] },
  { chapterOwner: "c6_hidden_hearts", blockIds: ["hidden.a"] },
  { chapterOwner: "c7_repair", blockIds: ["repair.helpsA"] },
  { chapterOwner: "c8_strength_vulnerability", blockIds: ["gift.a_to_b", "gift.b_to_a"] },
];

/**
 * Pulls the curated packets out of an already-composed report's sections.
 * Purely a selection step — never mutates, never invents text. A chapter
 * missing every candidate blockId (e.g. no bilateral gift computed for
 * either direction) simply contributes no packet; the editor already
 * treats "nothing offered" as normal.
 */
export function extractNarrativeEditablePackets(sections: CanonicalSection[]): NarrativeEditablePacket[] {
  const byChapter = new Map(sections.map((s) => [s.chapterId, s]));
  const packets: NarrativeEditablePacket[] = [];

  for (const target of TARGET_BLOCKS) {
    const section = byChapter.get(target.chapterOwner);
    if (!section) continue;
    for (const blockId of target.blockIds) {
      const block = section.blocks.find((b) => b.blockId === blockId);
      if (block && block.body.trim()) {
        packets.push({
          chapterOwner: target.chapterOwner,
          blockId: block.blockId,
          currentText: block.body,
          evidenceIds: block.evidenceIds,
        });
        break;
      }
    }
  }

  return packets;
}

const VALID_CHAPTERS = new Set<RomanticCrossSignalChapterId>([
  "c2_attraction",
  "c3_dynamics",
  "c4_conflict",
  "c5_misunderstanding",
  "c6_hidden_hearts",
  "c7_repair",
  "c8_strength_vulnerability",
]);

// ── Hard-boundary forbidden-content scan (spec §3) ────────────────────────
// Applied to editedText AND recognitionLine. Never trust the model's own
// restraint — this is a deterministic backstop, same discipline as every
// other validation layer in this codebase.
const FORBIDDEN_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\d+\s*(분|시간|번)(?!째)/, label: "exact duration/frequency" },
  { pattern: /\d+\s*시(?!간)/, label: "exact clock time" },
  { pattern: /안아|포옹|스킨십|손을\s*잡/, label: "physical affection" },
  { pattern: /질투/, label: "jealousy" },
  { pattern: /문자|카톡|톡\s*을|메시지를\s*(보내|확인|안\s*읽)/, label: "texting behavior" },
  { pattern: /없었다면|없었더라면|아니었다면|않았다면|않았더라면/, label: "counterfactual" },
  { pattern: /버림받|유기(?:불안|감)/, label: "abandonment feeling" },
];

/**
 * Only flags content the edit NEWLY introduces. When the deterministic
 * source (originalText) already legitimately states the same forbidden-
 * pattern content — e.g. a real Saju-derived jealousy trait already present
 * in the packet before any LLM touched it — the editor is allowed to
 * carry/rephrase it; this is not fabrication. Confirmed necessary via the
 * live 5-pair validation run: without this, faithfully-reworded text that
 * merely preserved an already-evidenced trait was being rejected as if the
 * editor had invented it.
 */
function findForbiddenContent(text: string, originalText?: string): string | null {
  for (const { pattern, label } of FORBIDDEN_PATTERNS) {
    if (pattern.test(text) && !(originalText && pattern.test(originalText))) return label;
  }
  return null;
}

const MAX_LENGTH_RATIO = 1.3;

export function validateNarrativeEdits(
  raw: RomanticNarrativeEditRaw[],
  context: {
    packets: NarrativeEditablePacket[];
    names: { a: string; b: string };
  },
): RomanticNarrativeEdit[] {
  const packetByBlockId = new Map(context.packets.map((p) => [p.blockId, p]));
  const knownEvidenceIds = new Set(context.packets.flatMap((p) => p.evidenceIds));

  const out: RomanticNarrativeEdit[] = [];

  for (const item of raw) {
    if (
      !item.chapterOwner ||
      !item.targetBlockId ||
      !item.editedText ||
      typeof item.editedText !== "string" ||
      !item.supportedMeaning ||
      !item.claimBoundary?.supported ||
      !item.claimBoundary?.notSupported
    ) {
      continue; // hard-reject: missing required fields entirely, no partial acceptance
    }

    const packet = packetByBlockId.get(item.targetBlockId);
    let rejected = false;
    let rejectionReason: string | undefined;

    if (!packet) {
      rejected = true;
      rejectionReason = `targetBlockId "${item.targetBlockId}" does not match any offered packet`;
    } else if (!VALID_CHAPTERS.has(item.chapterOwner as RomanticCrossSignalChapterId) || item.chapterOwner !== packet.chapterOwner) {
      // Chapter-ownership lock (spec §6): the model cannot move an insight
      // to a different chapter than the packet it was actually editing.
      rejected = true;
      rejectionReason = `chapterOwner "${item.chapterOwner}" does not match the packet's real chapter "${packet?.chapterOwner}"`;
    }

    const evidenceRefs = Array.isArray(item.evidenceRefs) ? item.evidenceRefs.filter((s) => typeof s === "string" && s.trim()) : [];
    if (!rejected && evidenceRefs.length === 0) {
      rejected = true;
      rejectionReason = "no evidenceRefs cited";
    }
    if (!rejected) {
      const unresolved = evidenceRefs.filter((id) => !knownEvidenceIds.has(id));
      if (unresolved.length > 0) {
        rejected = true;
        rejectionReason = `evidenceRefs do not resolve to any real evidence id: ${unresolved.join(", ")}`;
      }
    }

    if (!rejected && packet) {
      const ratio = item.editedText.length / Math.max(1, packet.currentText.length);
      if (ratio > MAX_LENGTH_RATIO) {
        rejected = true;
        rejectionReason = `editedText is ${(ratio * 100).toFixed(0)}% of original length — exceeds the no-expansion ceiling`;
      }
    }

    if (!rejected) {
      const forbidden = findForbiddenContent(item.editedText, packet?.currentText);
      if (forbidden) {
        rejected = true;
        rejectionReason = `editedText contains forbidden content: ${forbidden}`;
      }
    }

    // Recognition Line: validated independently of the rest of the edit —
    // failing this only nulls the line out, it never rejects an otherwise-safe
    // rewrite (spec §5: "reject recognition, preserve safe narrative").
    let recognitionLine: string | null = null;
    if (!rejected && typeof item.recognitionLine === "string" && item.recognitionLine.trim()) {
      const line = item.recognitionLine.trim();
      const forbiddenInLine = findForbiddenContent(line, packet?.currentText);
      const mentionsBothNames = line.includes(context.names.a) && line.includes(context.names.b);
      if (forbiddenInLine) {
        rejectionReason = rejectionReason ?? `recognitionLine contains forbidden content: ${forbiddenInLine}`;
      } else if (!mentionsBothNames) {
        // Deterministic proxy for the NAME-SWAP TEST: a recognition line
        // that never names both people can't be showing THEIR interaction —
        // it's description, not recognition. Dropped, not fabricated-generic.
        rejectionReason = rejectionReason ?? "recognitionLine does not name both people — fails the name-swap-test proxy, dropped";
      } else {
        recognitionLine = line;
      }
    }

    out.push({
      chapterOwner: (packet?.chapterOwner ?? (item.chapterOwner as RomanticCrossSignalChapterId)),
      targetBlockId: item.targetBlockId,
      editedText: item.editedText,
      evidenceRefs,
      supportedMeaning: item.supportedMeaning,
      claimBoundary: { supported: item.claimBoundary.supported!, notSupported: item.claimBoundary.notSupported! },
      recognitionLine,
      rejectionReason,
      rejected,
    });
  }

  return out;
}

export async function buildRomanticNarrativeEditor(params: {
  openai: OpenAI;
  packets: NarrativeEditablePacket[];
  names: { a: string; b: string };
  locale: "ko-KR" | "en-US";
  abortSignal?: AbortSignal;
}): Promise<RomanticNarrativeEditorResult> {
  const { openai, packets, names, locale, abortSignal } = params;
  const model = expertLlmModel();

  if (packets.length === 0) {
    return {
      edits: [],
      meta: { model, callCount: 0, totalProposed: 0, totalApplied: 0, totalRejected: 0, recognitionLinesKept: 0, recognitionLinesDropped: 0, failed: false },
    };
  }

  try {
    const { system, user } = buildNarrativeEditorPrompt({ packets, names, locale });
    const raw = await fetchLlmJsonWithParseRetry<{ edits?: RomanticNarrativeEditRaw[] }>(
      () => callExpertLlmJson(openai, system, user, abortSignal),
      { label: "romantic-narrative-editor" },
    );
    const edits = validateNarrativeEdits(Array.isArray(raw.edits) ? raw.edits : [], { packets, names });
    const applied = edits.filter((e) => !e.rejected);
    return {
      edits,
      meta: {
        model,
        callCount: 1,
        totalProposed: edits.length,
        totalApplied: applied.length,
        totalRejected: edits.length - applied.length,
        recognitionLinesKept: applied.filter((e) => e.recognitionLine).length,
        recognitionLinesDropped: edits.filter((e) => !e.recognitionLine).length - (edits.length - applied.length),
        failed: false,
      },
    };
  } catch (err) {
    return {
      edits: [],
      meta: {
        model,
        callCount: 1,
        totalProposed: 0,
        totalApplied: 0,
        totalRejected: 0,
        recognitionLinesKept: 0,
        recognitionLinesDropped: 0,
        failed: true,
        failureReason: err instanceof Error ? err.message : String(err),
      },
    };
  }
}

/** Never-throwing entry point — the only one production code should call. */
export async function buildRomanticNarrativeEditorSafe(
  params: Parameters<typeof buildRomanticNarrativeEditor>[0],
): Promise<RomanticNarrativeEditorResult> {
  try {
    return await buildRomanticNarrativeEditor(params);
  } catch (err) {
    return {
      edits: [],
      meta: {
        model: expertLlmModel(),
        callCount: 0,
        totalProposed: 0,
        totalApplied: 0,
        totalRejected: 0,
        recognitionLinesKept: 0,
        recognitionLinesDropped: 0,
        failed: true,
        failureReason: `unexpected_error: ${err instanceof Error ? err.message : String(err)}`,
      },
    };
  }
}

/**
 * Applies validated (non-rejected) edits by directly replacing the target
 * block's body — these edits are already block-targeted (not fuzzy-matched
 * like Tier B), so no target-detection step is needed. Immutable, same
 * pattern as romanticExpertConsumptionPolicy.ts's applyTierBEnrichment.
 */
export function applyNarrativeEdits<
  TSection extends { chapterId: string; blocks: Array<{ blockId: string; body: string }> },
>(sections: TSection[], edits: RomanticNarrativeEdit[]): TSection[] {
  const applied = edits.filter((e) => !e.rejected);
  if (applied.length === 0) return sections;
  const byBlockId = new Map(applied.map((e) => [e.targetBlockId, e]));

  return sections.map((section) => ({
    ...section,
    blocks: section.blocks.map((block) => {
      const edit = byBlockId.get(block.blockId);
      if (!edit) return block;
      return { ...block, body: edit.editedText };
    }),
  }));
}
