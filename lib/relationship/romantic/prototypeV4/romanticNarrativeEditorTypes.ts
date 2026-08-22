/**
 * Evidence-Grounded Narrative Editor — types.
 *
 * Architecture decision (see final response §A/§B for the full audit):
 * this reuses romanticExpertIntelligence.ts's shared LLM-call plumbing
 * (callExpertLlmJson/expertLlmModel/expertLlmMaxTokens) and takes over
 * "Mode A's slot" in the 2-call-per-report budget — Mode B (Saju Discovery)
 * is completely untouched. The OLD Mode A (SUPPORTED_SYNTHESIS evidence
 * synthesis, romanticExpertIntelligence.ts's buildRomanticExpertIntelligence)
 * is left in place, unmodified, for any existing caller — this module is
 * purely additive, not a rewrite of that function.
 */
import type { RomanticCrossSignalChapterId } from "./canonicalStoryPlanTypes";

/** Raw shape the LLM is asked to return (before validation tightens it). */
export type RomanticNarrativeEditRaw = {
  chapterOwner?: string;
  targetBlockId?: string;
  editedText?: string;
  evidenceRefs?: string[];
  supportedMeaning?: string;
  claimBoundary?: { supported?: string; notSupported?: string };
  recognitionLine?: string | null;
};

/** Validated, classification-enforced edit — the only shape any consumer
 * should ever read. Never applied by the caller without passing through
 * validateNarrativeEdits first. */
export type RomanticNarrativeEdit = {
  chapterOwner: RomanticCrossSignalChapterId;
  targetBlockId: string;
  editedText: string;
  evidenceRefs: string[];
  supportedMeaning: string;
  claimBoundary: { supported: string; notSupported: string };
  /** null is a valid, common outcome — not every edit needs one, and a
   * recognitionLine that fails validation is nulled out rather than
   * rejecting the whole edit (the rewritten prose can still be safe even
   * when the recognition attempt wasn't). */
  recognitionLine: string | null;
  /** Populated when recognitionLine was dropped or editedText was rejected
   * outright — audit trail, never shown to end users. */
  rejectionReason?: string;
  /** True only when the whole edit was dropped (editedText itself failed
   * validation) — the caller must not apply this edit at all. */
  rejected: boolean;
};

export type RomanticNarrativeEditorMeta = {
  model: string;
  callCount: number;
  totalProposed: number;
  totalApplied: number;
  totalRejected: number;
  recognitionLinesKept: number;
  recognitionLinesDropped: number;
  failed: boolean;
  failureReason?: string;
};

export type RomanticNarrativeEditorResult = {
  edits: RomanticNarrativeEdit[];
  meta: RomanticNarrativeEditorMeta;
};

/** One chapter-owned packet of already-composed deterministic text, offered
 * to the editor as a candidate for rewriting. The editor may return zero
 * edits for a packet it has nothing safe to add to — that's the expected,
 * common case, not an error. */
export type NarrativeEditablePacket = {
  chapterOwner: RomanticCrossSignalChapterId;
  blockId: string;
  currentText: string;
  /** Real evidenceIds already attached to this block — the editor's
   * evidenceRefs must be a subset of the UNION of all packets' evidenceIds
   * (it may cite evidence from elsewhere in the same chapter's other
   * blocks/Cross-Signal too, but never invent an id). */
  evidenceIds: string[];
};
