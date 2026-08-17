/**
 * Checklist Dedup Batch 1 — deterministic, dependency-free safety net.
 *
 * Catches the CLEAR surface-level duplicate pattern observed in live QA:
 * the LLM bolting a bounded time phrase ("이번 주", "this week") onto an
 * action already given by playbook.rows[].better/heated/reset or
 * future.remember/leap, without actually changing the action. This is NOT
 * a semantic/embedding-based dedup — softer, differently-worded duplicates
 * of the same underlying action will still slip through. That's expected;
 * see the Checklist Dedup Targeted Design Audit for why a cheap heuristic
 * was chosen over an embedding call (avoids a new LLM/embedding round-trip
 * and any new dependency, at the cost of only catching the mechanical
 * bolt-on case, not deeper paraphrase).
 *
 * No existing similarity/tokenization/embedding utility exists anywhere in
 * this repo (confirmed by search before writing this file) — character
 * n-gram Jaccard was chosen specifically because it needs no Korean
 * morpheme analyzer: short Hangul compound words still share bigrams even
 * without word-boundary awareness.
 */

const KO_BOUNDED_TIME_PATTERN =
  /(이번\s*주말|이번\s*주|오늘|한\s*번(?!\s*(사람|상황))|\d+\s*분)/g;
const EN_BOUNDED_TIME_PATTERN =
  /\b(this week(end)?|today|once|\d+\s*minutes?)\b/gi;

// Trailing Korean imperative/politeness endings — stripped so "읽어보세요"
// and "읽는 시간을 정해보세요" collapse toward the same normalized action
// instead of differing only by how the sentence closes.
const KO_IMPERATIVE_ENDING_PATTERN = /(해\s*보세요|해보세요|하세요|보세요|해요|하기)\.?\s*$/;

// Small, deliberately narrow shared-domain stopword list — only the nouns
// that showed up across nearly every field in live QA (playbook, future,
// AND checklist all reused these), so raw overlap on them alone is not
// evidence of the same action. Kept intentionally short per spec.
const KO_STOPWORDS = ["친구", "감정", "시간", "관계", "환경"];
const EN_STOPWORDS = ["friend", "friends", "feeling", "feelings", "time", "relationship", "relationships", "environment"];

function isKoreanLocale(locale: string): boolean {
  return locale.toLowerCase().startsWith("ko");
}

/**
 * Strips bounded time/quantity markers, imperative sentence endings, and a
 * small shared-domain stopword list, then collapses whitespace/punctuation.
 * The goal is that two sentences describing the SAME action normalize to
 * near-identical strings even if one has a time phrase bolted on and the
 * other doesn't — while two sentences that merely share topic nouns (친구,
 * 감정) but differ in actual action stay distinguishable.
 */
export function normalizeForComparison(text: string, locale: string): string {
  let out = text;
  if (isKoreanLocale(locale)) {
    out = out.replace(KO_BOUNDED_TIME_PATTERN, " ");
    out = out.replace(KO_IMPERATIVE_ENDING_PATTERN, "");
    for (const stop of KO_STOPWORDS) {
      out = out.split(stop).join(" ");
    }
  } else {
    out = out.toLowerCase();
    out = out.replace(EN_BOUNDED_TIME_PATTERN, " ");
    out = out.replace(/^please\s+/i, "");
    for (const stop of EN_STOPWORDS) {
      out = out.replace(new RegExp(`\\b${stop}\\b`, "gi"), " ");
    }
  }
  // Collapse whitespace/punctuation last, after word-boundary-sensitive
  // stopword removal above (EN uses \b, which needs the punctuation intact
  // until this point).
  out = out.replace(/[.,!?~…·"'"'()\[\]]/g, " ");
  out = out.replace(/\s+/g, " ").trim();
  return out;
}

function charNgrams(text: string, n: number): Set<string> {
  const compact = text.replace(/\s+/g, "");
  const grams = new Set<string>();
  if (compact.length < n) {
    if (compact.length > 0) grams.add(compact);
    return grams;
  }
  for (let i = 0; i <= compact.length - n; i++) {
    grams.add(compact.slice(i, i + n));
  }
  return grams;
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  for (const g of a) {
    if (b.has(g)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * KO uses bigrams (Korean compound words are short — bigrams still catch
 * shared morphemes without a real tokenizer). EN uses trigrams (bigrams are
 * too noisy for English — far more 2-letter collisions between unrelated
 * words).
 */
function similarityScore(a: string, b: string, locale: string): number {
  const n = isKoreanLocale(locale) ? 2 : 3;
  return jaccardSimilarity(charNgrams(a, n), charNgrams(b, n));
}

/**
 * Calibrated against live-QA-observed pairs (see the dedup unit test
 * fixtures): whole-string character n-gram Jaccard on short sentences is
 * heavily diluted by surrounding non-overlapping words, so "clear bolt-on"
 * duplicates from real output scored as low as ~0.12-0.22, while every
 * tested genuinely-distinct pair (retrospective/notice items, same-topic-
 * different-action items) scored <= 0.054. 0.12 sits just above that
 * preserve-ceiling with margin, catching the clear/observed bolt-on and
 * near-copy cases without touching distinct content. It intentionally does
 * NOT catch every soft paraphrase-level duplicate (e.g. a same-action item
 * reworded with almost entirely different words scored ~0.076-0.08) — that
 * is out of scope for this deterministic pass; do not lower further to
 * chase those, per the false-negative-over-false-positive preference.
 */
export const CHECKLIST_DUPLICATE_THRESHOLD = 0.11;

/**
 * Narrative Quality Singleton Batch 2 — a separate, higher threshold for the
 * single-item (One Next Move, min=max=1) checklist call site.
 *
 * CHECKLIST_DUPLICATE_THRESHOLD above was calibrated for a different failure
 * mode entirely: an 8-12 item list where the LLM bolts a time phrase onto an
 * action ALREADY given elsewhere, padding count with near-copies. One Next
 * Move is a single item that is SUPPOSED to connect to the report's central
 * tension — real, evidence-connected single items observed in live QA scored
 * 0.13-0.34 against playbook/future content (see the Personal Premium
 * Narrative Quality Singleton, Batch 2), squarely inside the old "duplicate"
 * zone even though a human reader would judge them as legitimate, connected
 * (not redundant) actions. Applying the 8-12-item threshold here punished
 * exactly the well-connected items the product wants, and rewarded generic,
 * evidence-blind items that happen not to overlap with anything. This
 * threshold only catches genuinely near-verbatim duplication (the SAME
 * action restated, not merely the same underlying theme).
 */
export const SINGLE_ITEM_NEAR_VERBATIM_THRESHOLD = 0.45;

export type FlaggedChecklistItem = {
  item: string;
  matchedText: string;
  score: number;
};

/** Returns the comparison text with the highest similarity, and whether it crosses the duplicate threshold. */
function findBestMatch(
  item: string,
  comparisonTexts: string[],
  locale: string,
): { matchedText: string; score: number } | null {
  const normalizedItem = normalizeForComparison(item, locale);
  let best: { matchedText: string; score: number } | null = null;
  for (const comparison of comparisonTexts) {
    if (!comparison) continue;
    const normalizedComparison = normalizeForComparison(comparison, locale);
    const score = similarityScore(normalizedItem, normalizedComparison, locale);
    if (!best || score > best.score) {
      best = { matchedText: comparison, score };
    }
  }
  return best;
}

const KO_FALLBACK_POOL = [
  "이번 주 하루를 골라, 그날 있었던 일 중 기억에 남는 순간 하나를 한 문장으로 적어보세요.",
  "이번 주 평소와 다른 선택을 한 번 해보고, 그 결과가 어땠는지 짧게 기록해보세요.",
  "이번 주 일정 중 하나를 골라, 참여 여부를 다시 한 번 검토해보세요.",
  "이번 주 아침과 저녁, 하루 두 번 컨디션을 한 문장으로 남겨보세요.",
  "이번 주 새로운 사람 한 명과 짧은 대화를 나눠보세요.",
  "이번 주 스스로 뿌듯했던 순간 하나를 찾아 적어보세요.",
  "이번 주 예상과 다르게 흘러간 상황 하나를 떠올려 무엇이 달랐는지 적어보세요.",
  "이번 주 하루를 골라, 그날의 에너지 수준을 1-10점으로 기록해보세요.",
];

const EN_FALLBACK_POOL = [
  "Pick one day this week and write down a moment you remember clearly.",
  "Try one small decision differently this week and note what happened.",
  "Review one commitment on your calendar this week and decide if it still fits.",
  "Rate your energy level once in the morning and once in the evening this week.",
  "Have one short conversation with someone new this week.",
  "Write down one moment this week you felt proud of.",
  "Notice one situation this week that went differently than expected, and jot down why.",
  "Pick one day this week and log your energy level on a 1-10 scale.",
];

/**
 * Backfills the checklist up to `min` items using a small static,
 * locale-aware template pool — never a repeated single string (that would
 * look visibly repetitive if several items were dropped). Never invents
 * evidence-specific content; these are deliberately generic, observational
 * micro-experiments, same fallback philosophy as coerceDeepEssenceStructured's
 * existing padding strings.
 */
function backfillChecklist(kept: string[], locale: string, min: number, max: number): string[] {
  if (kept.length >= min) return kept.slice(0, max);
  const pool = isKoreanLocale(locale) ? KO_FALLBACK_POOL : EN_FALLBACK_POOL;
  const out = [...kept];
  const used = new Set(out);
  for (const candidate of pool) {
    if (out.length >= min) break;
    if (used.has(candidate)) continue;
    out.push(candidate);
    used.add(candidate);
  }
  return out.slice(0, max);
}

export type DeepEssenceChecklistDedupResult = {
  checklist: string[];
  flagged: FlaggedChecklistItem[];
  backfilledCount: number;
};

/**
 * Drops checklist items that are near-duplicates (by the conservative
 * threshold above) of playbook.rows[].better/heated/reset or
 * future.remember/leap, then backfills back up to `min` (default 8) from a
 * static fallback pool if needed. Never exceeds `max` (default 12). Pure
 * function — no I/O, no LLM/embedding call.
 */
export function dedupeAndBackfillChecklist(input: {
  checklist: string[];
  comparisonTexts: string[];
  locale: string;
  min?: number;
  max?: number;
  /**
   * Batch 2 — override the duplicate-similarity threshold. Callers using
   * min=max=1 (One Next Move) should pass SINGLE_ITEM_NEAR_VERBATIM_THRESHOLD
   * instead of the default CHECKLIST_DUPLICATE_THRESHOLD, which was
   * calibrated for a different failure mode (see that constant's doc).
   */
  threshold?: number;
}): DeepEssenceChecklistDedupResult {
  const min = input.min ?? 8;
  const max = input.max ?? 12;
  const threshold = input.threshold ?? CHECKLIST_DUPLICATE_THRESHOLD;
  const flagged: FlaggedChecklistItem[] = [];
  const kept: string[] = [];

  for (const item of input.checklist) {
    const match = findBestMatch(item, input.comparisonTexts, input.locale);
    if (match && match.score >= threshold) {
      flagged.push({ item, matchedText: match.matchedText, score: match.score });
      continue;
    }
    kept.push(item);
  }

  const backfilledCount = Math.max(0, min - kept.length);
  const checklist = backfillChecklist(kept, input.locale, min, max);

  return { checklist, flagged, backfilledCount };
}

/**
 * Flattens playbook/future/growth-edge into the flat comparison-text list
 * dedup checks against. growthEdgeRealLifePattern is Part A's Growth Edge
 * next-step field (summary.growth_edge_real_life_pattern) — Full Integration
 * QA found checklist items near-copying it directly (e.g. "Reach out to a
 * friend for a deeper conversation this week" vs. growth edge's own "Try
 * reaching out to a friend for a deeper conversation..."), which the dedup
 * pass previously never checked against since it isn't part of playbook/future.
 */
export function buildChecklistComparisonTexts(playbook: {
  rows: { better: string }[];
  heated: string;
  reset: string;
}, future: {
  remember: string[];
  leap: string;
}, growthEdgeRealLifePattern?: string): string[] {
  return [
    ...playbook.rows.map((r) => r.better),
    playbook.heated,
    playbook.reset,
    ...future.remember,
    future.leap,
    ...(growthEdgeRealLifePattern ? [growthEdgeRealLifePattern] : []),
  ];
}
