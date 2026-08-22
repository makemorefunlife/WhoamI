/**
 * Phase 5B Part 13 — a practical (not perfect-NLP) repetition regression
 * check for the composed Romantic V4 report. Detects:
 *   - identical sentences appearing in 2+ different chapters
 *   - near-duplicate sentences (bigram similarity) appearing in 2+ different
 *     chapters
 *   - known "signature" canonical phrases appearing 3+ times report-wide
 *
 * Deliberately does NOT flag legitimate layered reuse (diagnosis -> meaning
 * -> action) as repetition on its own — it only flags near-identical
 * SENTENCES, not shared topics or evidence references. A sentence has to
 * actually restate itself, not just be about the same thing, to be flagged.
 */
import { similarity } from "./romanticExpertIntelligence";
import type { CanonicalSection } from "./composeCanonicalSectionNarratives";

const NEAR_DUPLICATE_THRESHOLD = 0.75;
const MIN_SENTENCE_LENGTH = 12;

/** Known recurring generic-ending phrases (spec Part 7's audit list) — counted
 * report-wide, not per-chapter, since these are exactly the sentences that
 * tend to reappear as filler across multiple chapters. */
const SIGNATURE_PHRASE_BANK = [
  "서로의 차이를 존중하세요",
  "서로의 속도를 이해하세요",
  "상호 보완적인 관계입니다",
  "관계가 더 단단해질 수 있습니다",
  "서로에게 안정감을 줍니다",
  "세심한 인정과 배려가 필요합니다",
];

function splitIntoSentences(text: string): string[] {
  return text
    .split(/\n+/)
    .flatMap((line) => line.split(/(?<=[.!?다요]\s)|(?<=[.!?])(?=\s|$)/))
    .map((s) => s.trim())
    .filter((s) => s.length >= MIN_SENTENCE_LENGTH);
}

export type RepetitionFinding = {
  chapterA: string;
  chapterB: string;
  blockIdA: string;
  blockIdB: string;
  sentenceA: string;
  sentenceB: string;
  similarity: number;
  kind: "identical" | "near_duplicate";
};

export type SignaturePhraseHit = {
  phrase: string;
  count: number;
  chapters: string[];
};

export type RepetitionAuditResult = {
  totalSentences: number;
  crossChapterFindings: RepetitionFinding[];
  signaturePhraseHits: SignaturePhraseHit[];
  totalCharCount: number;
};

export function auditNarrativeRepetition(sections: CanonicalSection[]): RepetitionAuditResult {
  type Sentence = { chapterId: string; blockId: string; text: string };
  const sentences: Sentence[] = [];
  let totalCharCount = 0;

  for (const section of sections) {
    for (const block of section.blocks) {
      totalCharCount += block.body?.length ?? 0;
      for (const text of splitIntoSentences(block.body ?? "")) {
        sentences.push({ chapterId: section.chapterId, blockId: block.blockId, text });
      }
    }
  }

  const crossChapterFindings: RepetitionFinding[] = [];
  for (let i = 0; i < sentences.length; i++) {
    for (let j = i + 1; j < sentences.length; j++) {
      const a = sentences[i];
      const b = sentences[j];
      if (a.chapterId === b.chapterId) continue; // only cross-chapter restatement counts as repetition
      if (a.text === b.text) {
        crossChapterFindings.push({
          chapterA: a.chapterId, chapterB: b.chapterId, blockIdA: a.blockId, blockIdB: b.blockId,
          sentenceA: a.text, sentenceB: b.text, similarity: 1, kind: "identical",
        });
        continue;
      }
      const sim = similarity(a.text, b.text);
      if (sim >= NEAR_DUPLICATE_THRESHOLD) {
        crossChapterFindings.push({
          chapterA: a.chapterId, chapterB: b.chapterId, blockIdA: a.blockId, blockIdB: b.blockId,
          sentenceA: a.text, sentenceB: b.text, similarity: sim, kind: "near_duplicate",
        });
      }
    }
  }

  const signaturePhraseHits: SignaturePhraseHit[] = SIGNATURE_PHRASE_BANK.map((phrase) => {
    const hits = sentences.filter((s) => similarity(s.text, phrase) >= NEAR_DUPLICATE_THRESHOLD || s.text.includes(phrase));
    const chapters = Array.from(new Set(hits.map((h) => h.chapterId)));
    return { phrase, count: hits.length, chapters };
  }).filter((h) => h.count >= 3);

  return {
    totalSentences: sentences.length,
    crossChapterFindings,
    signaturePhraseHits,
    totalCharCount,
  };
}
