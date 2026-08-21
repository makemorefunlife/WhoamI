/**
 * Deep Essence structured report — tone polish that cannot break Inner Compass.
 *
 * Blind polishKoStringTree/polishEnStringTree walks every string, including
 * short chips (core_mode), titles, and enum-like values. That can empty a
 * field or warp a label so isDeepEssenceStructuredReport fails, and the UI
 * silently falls back to the plain-prose dump.
 *
 * This helper only polishes known long-form prose paths, never empties a
 * string, and always re-validates. If anything fails, the pre-polish tree wins.
 */
import type { Locale } from "@/lib/i18n/locale";
import { normalizeLocale } from "@/lib/i18n/locale";
import { polishKoTone } from "@/lib/i18n/koToneGuards";
import { polishEnTone } from "@/lib/i18n/enToneGuards";
import {
  isDeepEssenceStructuredReport,
  type DeepEssenceStructuredReport,
} from "@/lib/report/deepEssenceStructuredSchema";
import { similarityScore } from "@/lib/report/deepEssenceChecklistDedup";

function polishProse(text: string, locale: Locale): string {
  const raw = text.trim();
  if (!raw) return text;
  const next =
    locale === "ko-KR" ? polishKoTone(raw).text : polishEnTone(raw).text;
  const out = next.trim();
  // Never allow tone scrubbing to blank a required schema string.
  return out.length > 0 ? out : text;
}

function mapStrList(list: string[], locale: Locale): string[] {
  return list.map((s) => polishProse(s, locale));
}

const REMEMBER_PREFIX_PATTERN =
  /^(0[123]\s*(Keep|Loosen|Recover|\(Keep\)|\(Loosen\)|\(Recover\))?|무엇을\s*(굳이\s*)?바꾸지\s*않아도\s*되는가\??|무엇을\s*계속\s*증명하거나\s*수행하지\s*않아도\s*되는가\??|내가\s*다시\s*내\s*쪽으로\s*가져와도\s*되는\s*것은\s*무엇인가\??|\(무엇을[^\)]*\))[:\?\)]*\s*/i;

function cleanRememberText(text: string, locale: Locale): string {
  const polished = polishProse(text, locale);
  return polished.replace(REMEMBER_PREFIX_PATTERN, "").trim();
}

// Narrative Quality Final Stabilization — a phrase-ban / trailing-only
// regex net was tried and re-verified twice (Batch C, then a same-session
// fix pass) and got WORSE, not better, each round: the model kept escaping
// the exact banned phrases with new paraphrases of the same banned
// function, and roughly 3 of 4 live-QA violations were in the MIDDLE of the
// closing text, not the trailing sentence — invisible to a trailing-only
// regex no matter which words are listed. Root cause found in the prompt
// schema itself: closing's own schema field said "6-10 sentences" while the
// prose rule wanted a 2-sentence Recognition+Integration shape — every
// violation showed up in one of those extra, schema-invited sentences 3-10,
// never in sentence 1 or 2. The prompt fix is a hard "EXACTLY 2 sentences"
// cap; this is the matching structural defensive net: truncate to at most
// 2 sentences FIRST (removing the sentence slot violations were living in),
// THEN scan only the surviving 1-2 sentences for a banned function, instead
// of trying to out-word-list an evasive model.
const MAX_CLOSING_SENTENCES = 2;

// Non-anchored (no trailing $ requirement) — applied per-sentence against
// short, already-truncated sentences, so it doesn't need end-of-string
// anchoring to stay safe from eating unrelated prior content.
const CHEER_FUNCTION_PATTERN =
  /응원(?:합니다|해요|할게요|하겠습니다)|바라요|바랍니다|하면\s*좋겠어요|해나가면\s*좋겠어요/;
const PREDICTION_FUNCTION_PATTERN =
  /될\s*거예요|될\s*것입니다|하게\s*될\s*거예요|펼쳐질\s*거예요|이어질\s*것입니다|여정이\s*될/;
const EVALUATION_FUNCTION_PATTERN =
  /참\s*의미\s*있어요|소중한\s*발견이에요|멋진\s*변화예요|잘\s*알게\s*되었어요|중요한\s*깨달음이에요/;
const ADVICE_FUNCTION_PATTERN =
  /기억하세요|기억해요|잊지\s*마세요|해보세요|노력하세요|귀\s*기울이세요|선택하세요/;

const BANNED_CLOSING_SENTENCE_PATTERNS = [
  CHEER_FUNCTION_PATTERN,
  PREDICTION_FUNCTION_PATTERN,
  EVALUATION_FUNCTION_PATTERN,
  ADVICE_FUNCTION_PATTERN,
];

/** Splits on sentence-ending punctuation, keeping the punctuation attached to each sentence. */
function splitIntoSentences(text: string): string[] {
  const matches = text.match(/[^.!?]+[.!?]+/g);
  if (matches) return matches.map((s) => s.trim()).filter((s) => s.length > 0);
  const trimmed = text.trim();
  return trimmed.length > 0 ? [trimmed] : [];
}

function cleanClosingText(text: string, locale: Locale): string {
  const polished = polishProse(text, locale);
  if (locale !== "ko-KR") return polished;
  // Strip trailing self-help wishing sentences like "...만들어가지 바라요." / "...바랍니다."
  // before sentence-splitting, since this pattern crosses the preceding
  // clause rather than being its own clean sentence.
  const prewashed = polished
    .replace(/\s*(?:[가-힣]+기|이러한\s*점들을\s*기억하며|앞으로의\s*관계를|과정에서|앞으로의\s*여정에서도)[^.\!\?]*\b(?:바라요|바랍니다|응원합니다)[\.\!]*/g, "")
    .trim();
  const sentences = splitIntoSentences(prewashed).slice(0, MAX_CLOSING_SENTENCES);
  const kept = sentences.filter(
    (s) => !BANNED_CLOSING_SENTENCE_PATTERNS.some((p) => p.test(s)),
  );
  const cleaned = kept.join(" ").trim();
  return cleaned.length > 0 ? cleaned : polished;
}

// Narrative Quality Final Stabilization — adaptation_story's ZERO-advice
// contract is prompt-primary; this is the last-line defensive net, matching
// cleanClosingText's own "prompt first, polish only for clear violations"
// philosophy. Only strips a sentence whose ENDING matches one of these
// explicit advice shapes — never a broad rewrite. [^.!?\n]* anchors each
// match to its own sentence (bounded by the prior sentence-end or paragraph
// break), so this can't eat a prior, legitimate sentence, and can't cross
// adaptation_story's \n\n paragraph joins. No \b — JS regex word-boundary is
// defined over [A-Za-z0-9_], so it never fires between two Hangul
// characters; using it would silently make this pattern match nothing.
const ADVICE_ENDING_PATTERN =
  /[^.!?\n]*(?:해야\s*해요|할\s*필요가\s*있어요|하는\s*것이\s*중요해요|연습해\s*보세요|활용해\s*보세요|시도해\s*보세요|기억하세요)[.!]*/g;

function cleanAdaptationStoryText(text: string, locale: Locale): string {
  const polished = polishProse(text, locale);
  if (locale !== "ko-KR") return polished;
  const stripped = polished.replace(ADVICE_ENDING_PATTERN, "");
  // Paragraph-safe cleanup: normalize whitespace within each paragraph and
  // drop any paragraph that became empty (its one sentence was the removed
  // advice line), without disturbing the surviving \n\n paragraph joins.
  const cleaned = stripped
    .split(/\n\n+/)
    .map((p) => p.replace(/[ \t]+/g, " ").trim())
    .filter((p) => p.length > 0)
    .join("\n\n");
  return cleaned.length > 0 ? cleaned : polished;
}

/**
 * Apply locale tone law to prose fields only. Always returns a schema-valid
 * report (the input must already be valid).
 */
import type { FitCategoryKey, DeterministicFitPlan } from "@/lib/report/formatPart01EvidenceForPrompt";

export const FIT_NEED_SEMANTIC_MOTIFS: Record<FitCategoryKey, { keywords: string[]; regexes: RegExp[] }> = {
  AUTONOMY: {
    keywords: ["자율", "독립", "스스로", "자율권", "판단 공간", "재량"],
    regexes: [/자율/, /독립/, /스스로/, /재량/, /자율권/, /판단.*공간/],
  },
  STRUCTURE: {
    keywords: ["원칙", "구조", "규칙", "수순", "절차", "체계"],
    regexes: [/원칙/, /구조/, /규칙/, /수순/, /절차/, /체계/],
  },
  PREDICTABILITY: {
    keywords: ["예측", "변수", "안정", "미리 공유", "일정", "사전"],
    regexes: [/예측/, /변수/, /안정/, /미리.*공유/, /일정/, /사전/],
  },
  STIMULATION: {
    keywords: ["새로운", "자극", "변화", "역동", "시도", "새로운 아이디어"],
    regexes: [/새로운/, /자극/, /변화/, /역동/, /시도/, /실험/],
  },
  RELATIONAL_DEPTH: {
    keywords: ["진심", "깊은", "내면", "진정성", "솔직한", "깊이"],
    regexes: [/진심/, /깊은/, /내면/, /진정성/, /솔직/, /깊이/],
  },
  EMOTIONAL_EXPLICITNESS: {
    keywords: ["감정", "명확", "투명", "의도", "직접 말", "표현"],
    regexes: [/감정/, /명확/, /투명/, /의도/, /직접.*말/, /표현/],
  },
  DECISION_CLARITY: {
    keywords: ["결정", "주도권", "책임", "범위", "우선순위", "판단"],
    regexes: [/결정/, /주도권/, /책임/, /범위/, /우선순위/, /판단/],
  },
  FEEDBACK_DIRECTNESS: {
    keywords: ["피드백", "구체적", "직설", "데이터", "객관적"],
    regexes: [/피드백/, /구체적/, /직설/, /데이터/, /객관/],
  },
  PROCESSING_TIME: {
    keywords: ["시간", "생각", "소화", "여유", "정리"],
    regexes: [/시간/, /생각/, /소화/, /여유/, /정리/],
  },
  BOUNDARY_RESPECT: {
    keywords: ["경계", "거리", "침범", "개인 공간", "영역"],
    regexes: [/경계/, /거리/, /침범/, /개인.*공간/, /영역/],
  },
  COLLABORATION: {
    keywords: ["협력", "시너지", "같이", "동등", "의견"],
    regexes: [/협력/, /시너지/, /같이/, /동등/, /경청/],
  },
  GROWTH_VARIETY: {
    keywords: ["성장", "다양", "실험", "배움", "새로운 문제", "관점"],
    regexes: [/성장/, /다양/, /실험/, /배움/, /관점/, /시각/, /시도/],
  },
};

export function isSpokenDialogue(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;

  // Strips trailing sentence punctuation (. ! ?)
  const cleanText = trimmed.replace(/[.!?\s]+$/, "");

  // 1. Explicit Narrator Description Endings (must end with abstract noun)
  if (/(?:혼란스러움|불안감|피로감|상황|관계|태도|방식|경향|느낌|대화|부담|가식|불안|마찰|어려움|소통)$/.test(cleanText)) {
    return false;
  }

  // 2. Korean Spoken Verb/Conversational Endings (verb suffixes)
  if (/[가-힐]*(?:다|요|해|자|줘|게|지|마|어|아|봐|까|야|네|냐|시오|오|했어|할게|했니|했습니까|입니다|입니까)$/.test(cleanText)) {
    return true;
  }

  // If text ends with speech punctuation (?, !, "), treat as spoken
  if (/[?!"']$/.test(trimmed)) {
    return true;
  }

  return false;
}

export function isDuplicatePair(
  a: { wound: string; steady: string },
  b: { wound: string; steady: string },
  locale: string = "ko-KR",
): boolean {
  const w1 = a.wound.trim();
  const s1 = a.steady.trim();
  const w2 = b.wound.trim();
  const s2 = b.steady.trim();

  if (w1 === w2 || s1 === s2) {
    return true;
  }

  const woundSim = similarityScore(w1, w2, locale);
  const steadySim = similarityScore(s1, s2, locale);
  return woundSim >= 0.4 && steadySim >= 0.4;
}

export type QualityGateResult = {
  pass: boolean;
  failures: string[];
};

export function validatePart06QualityGate(
  fitPlan: DeterministicFitPlan | null | undefined,
  report: DeepEssenceStructuredReport,
): QualityGateResult {
  const failures: string[] = [];
  if (!fitPlan) return { pass: true, failures: [] };
  const primaryKey = fitPlan.primaryFit.key;
  const secondaryKey = fitPlan.secondaryFit.key;

  // 1. Environment Fit motif validation
  const optimalList = report.energy?.optimal || [];
  const item1 = optimalList[0] || "";
  const item2 = optimalList[1] || "";

  const primaryMotifs = FIT_NEED_SEMANTIC_MOTIFS[primaryKey];
  const secondaryMotifs = FIT_NEED_SEMANTIC_MOTIFS[secondaryKey];

  const item1HasPrimary = primaryMotifs ? primaryMotifs.regexes.some((r) => r.test(item1)) : true;
  const item2HasSecondary = secondaryMotifs ? secondaryMotifs.regexes.some((r) => r.test(item2)) : true;

  if (!item1HasPrimary) {
    failures.push(
      `ENVIRONMENT ITEM 1 ("${item1}") does not contain required primary fit motif for ${primaryKey}`,
    );
  }
  if (!item2HasSecondary) {
    failures.push(
      `ENVIRONMENT ITEM 2 ("${item2}") does not contain required secondary fit motif for ${secondaryKey}`,
    );
  }

  // 2. Communication anti-coaching, anti-meta commentary, and SPOKEN DIALOGUE validation
  const BANNED_COACHING_PATTERNS = [
    /어떤 배움을.*기대/,
    /성장을 응원/,
    /다양한 가능성.*이야기/,
    /유연한 접근법이 좋아/,
    /새로운 시도를 해보는 건 어때/,
    /네 생각을 존중해/,
  ];

  const BANNED_META_PATTERNS = [
    /라는 말을 들으면/,
    /라는 말을 듣는 게/,
    /라고 물어보는 것이 더/,
    /라고 제안하는 것이/,
    /외로움을 느껴요/,
    /불안해요/,
  ];

  const compareRows = report.relationships?.compare || [];
  let spokenMotifMatchCount = 0;

  let profileMotifRegex = /.*/;
  if (["PREDICTABILITY", "STRUCTURE"].includes(primaryKey) || ["PREDICTABILITY", "STRUCTURE"].includes(secondaryKey)) {
    profileMotifRegex = /원칙|기준|예측|수순|미리|일정|공유|절차|약속/;
  } else if (["AUTONOMY", "DECISION_CLARITY"].includes(primaryKey) || ["AUTONOMY", "DECISION_CLARITY"].includes(secondaryKey)) {
    profileMotifRegex = /자율|독립|주도|범위|책임|우선순위|판단|맡/;
  } else if (["GROWTH_VARIETY", "STIMULATION"].includes(primaryKey) || ["GROWTH_VARIETY", "STIMULATION"].includes(secondaryKey)) {
    profileMotifRegex = /시도|변화|다른|방식|아이디어|실험|접근|새로운/;
  }

  for (let i = 0; i < compareRows.length; i++) {
    const wound = compareRows[i]?.wound || "";
    const steady = compareRows[i]?.steady || "";

    if (!isSpokenDialogue(wound)) {
      failures.push(`COMMUNICATION ROW ${i + 1} LEFT ("${wound}") is a narrator description, not spoken dialogue`);
    }
    if (!isSpokenDialogue(steady)) {
      failures.push(`COMMUNICATION ROW ${i + 1} RIGHT ("${steady}") is a narrator description, not spoken dialogue`);
    }

    for (const pat of BANNED_COACHING_PATTERNS) {
      if (pat.test(wound) || pat.test(steady)) {
        failures.push(
          `COMMUNICATION ROW ${i + 1} contains banned AI-coaching language matching ${pat}`,
        );
      }
    }

    for (const pat of BANNED_META_PATTERNS) {
      if (pat.test(wound) || pat.test(steady)) {
        failures.push(
          `COMMUNICATION ROW ${i + 1} contains narrator meta commentary matching ${pat}`,
        );
      }
    }

    if (profileMotifRegex.test(wound + " " + steady)) {
      spokenMotifMatchCount++;
    }
  }

  // 3. At least 2/3 pairs MUST match the assigned profile motifs
  if (spokenMotifMatchCount < 2) {
    failures.push(
      `COMMUNICATION PAIRS for ${primaryKey}/${secondaryKey} must have at least 2/3 pairs matching profile motifs (actual: ${spokenMotifMatchCount}/3)`,
    );
  }

  // 4. Communication pair within-profile DEDUP validation
  for (let i = 0; i < compareRows.length; i++) {
    for (let j = i + 1; j < compareRows.length; j++) {
      if (isDuplicatePair(compareRows[i], compareRows[j])) {
        failures.push(`COMMUNICATION ROW ${j + 1} is a duplicate/near-duplicate of ROW ${i + 1}`);
      }
    }
  }

  const pass = failures.length === 0;
  return { pass, failures };
}

const BANNED_SAJU_TERMS = [
  /도화살/i,
  /현침살/i,
  /천을귀인/i,
  /합충형파해/i,
  /십신/i,
  /격국/i,
  /용신/i,
  /희신/i,
  /지장간/i,
];

const BANNED_CLOSING_TEMPLATES = [
  /할\s*수\s*있게\s*되었/,
  /하게\s*되었/,
  /도움이\s*(?:되|됩|될)/,
  /앞으로도\s*계속/,
  /존중받을\s*수\s*있는/,
  /본질적인\s*특성/,
  /더욱\s*자신감/,
  /성장할\s*수\s*있/,
  /중요한\s*의미가\s*있/,
  /차이를\s*이해/,
  /차이를\s*인식/,
];

export const FAMILY_CLOSING_MOTIFS: Record<string, RegExp> = {
  DECISION: /판단|결정|선택|내\s*기준/i,
  STRUCTURE: /체계|구조|수순|원칙|예측|변수/i,
  GROWTH: /성장|배움|경험을\s*넓|가능성을\s*탐색|새로운\s*시도/i,
  ADAPTABILITY: /적응|유연|전환|상황에\s*맞추/i,
  BOUNDARY: /경계|한계|책임|감당/i,
};

const FAMILY_CLOSING_FALLBACKS: Record<string, string> = {
  DECISION: "스스로 판단하는 내면의 기준은 이미 충분해요. 다만 타인의 무조건적인 동의까지 얻어야 좋은 결정이 되는 것은 아닙니다.",
  STRUCTURE: "복잡함을 체계적으로 정리하는 수순과 원칙은 중요한 자원이에요. 다만 모든 예외 변수가 통제되어야만 비로소 움직일 수 있는 것은 아닙니다.",
  GROWTH: "새로운 가능성을 탐색하고 배움의 경험을 넓히는 힘이 당신을 움직이게 해요. 다만 나를 넓히는 성장의 시도와 주변에 맞추느라 방향을 잃는 적응은 다른 일입니다.",
  ADAPTABILITY: "상황 변화에 유연하게 대응하고 적응하는 유연함은 강점이에요. 다만 유연하게 응대하는 것과 내 중심 기준 없이 매번 흔들리는 것은 다릅니다.",
  BOUNDARY: "자신의 한계와 감당 범위를 알아차리고 경계를 지키는 것이 필요해요. 다만 상대를 배려하는 마음과 상대가 감당해야 할 책임까지 떠안는 것은 다릅니다.",
};

export function validatePart07QualityGate(
  report: DeepEssenceStructuredReport,
  primaryFamily?: string,
): QualityGateResult {
  const failures: string[] = [];
  const future = report.future;

  if (!future) {
    failures.push("PART 07 missing future block");
    return { pass: false, failures };
  }

  const doItems = future.do_items || [];
  const dontItems = future.dont_items || [];
  const decisionRules = future.decision_rules || [];

  if (doItems.length !== 3) {
    failures.push(`PART 07 DO items count must be 3 (actual: ${doItems.length})`);
  }
  if (dontItems.length !== 3) {
    failures.push(`PART 07 DON'T items count must be 3 (actual: ${dontItems.length})`);
  }
  if (decisionRules.length < 2 || decisionRules.length > 3) {
    failures.push(`PART 07 Decision Rules count must be 2-3 (actual: ${decisionRules.length})`);
  }

  if (report.checklist && report.checklist.length > 0) {
    const practiceText = report.checklist[0] || "";
    if (practiceText.includes("기억에 남는 순간") || practiceText.includes("하루를 골라")) {
      failures.push("PART 07 contains banned generic journaling practice");
    }
    const normPractice = practiceText.replace(/[\s.,!?]/g, "");
    for (const d of doItems) {
      const normTitle = d.title.replace(/[\s.,!?]/g, "");
      if (normTitle.length >= 4 && (normPractice.includes(normTitle) || normTitle.includes(normPractice))) {
        failures.push(`PART 07 practice duplicates DO title "${d.title}"`);
      }
    }
  }

  if (report.closing) {
    const closing = report.closing.trim();
    for (const tRegex of BANNED_CLOSING_TEMPLATES) {
      if (tRegex.test(closing)) {
        failures.push(`PART 07 closing contains banned template phrase matching ${tRegex.source}`);
      }
    }
    if (primaryFamily && FAMILY_CLOSING_MOTIFS[primaryFamily]) {
      const motifRegex = FAMILY_CLOSING_MOTIFS[primaryFamily];
      if (!motifRegex.test(closing)) {
        failures.push(`PART 07 closing missing mandatory primary-family motif for ${primaryFamily}`);
      }
    }
  }

  const allPart07Text = [
    ...doItems.flatMap((d) => [d.title, d.body]),
    ...dontItems.flatMap((d) => [d.title, d.body]),
    ...decisionRules,
    ...(report.checklist || []),
    report.closing || "",
  ].join(" ");

  for (const termRegex of BANNED_SAJU_TERMS) {
    if (termRegex.test(allPart07Text)) {
      failures.push(`PART 07 contains banned technical Saju term matching ${termRegex.source}`);
    }
  }

  return {
    pass: failures.length === 0,
    failures,
  };
}

export function validateCrossProfilePart07Uniqueness(
  reports: { id: string; report: DeepEssenceStructuredReport }[],
): { pass: boolean; overlapRate: number; failures: string[] } {
  const failures: string[] = [];
  let totalPairs = 0;
  let duplicatePairs = 0;

  for (let i = 0; i < reports.length; i++) {
    for (let j = i + 1; j < reports.length; j++) {
      const repA = reports[i].report.future;
      const repB = reports[j].report.future;
      if (!repA || !repB) continue;

      const titlesA = [...(repA.do_items || []).map((d) => d.title), ...(repA.dont_items || []).map((d) => d.title)];
      const titlesB = [...(repB.do_items || []).map((d) => d.title), ...(repB.dont_items || []).map((d) => d.title)];

      for (const tA of titlesA) {
        for (const tB of titlesB) {
          totalPairs++;
          const score = similarityScore(tA, tB);
          if (score > 0.45) {
            duplicatePairs++;
            failures.push(`Cross-profile title collision between ${reports[i].id} and ${reports[j].id}: "${tA}" vs "${tB}" (score=${Math.round(score * 100) / 100})`);
          }
        }
      }
    }
  }

  const overlapRate = totalPairs > 0 ? duplicatePairs / totalPairs : 0;
  const pass = failures.length === 0;
  return { pass, overlapRate, failures };
}

/**
 * Apply locale tone law to prose fields only. Always returns a schema-valid
 * report (the input must already be valid).
 */
export function polishDeepEssenceStructuredReport(
  report: DeepEssenceStructuredReport,
  locale: Locale | string | undefined,
  fitPlan?: DeterministicFitPlan | null | undefined,
  primaryFamily?: string,
): DeepEssenceStructuredReport {
  const loc = normalizeLocale(locale);
  let optimalList = mapStrList(report.energy.optimal, loc);

  let closingText = cleanClosingText(report.closing, loc);
  if (primaryFamily && FAMILY_CLOSING_MOTIFS[primaryFamily]) {
    const motifRegex = FAMILY_CLOSING_MOTIFS[primaryFamily];
    const hasBannedTemplate = BANNED_CLOSING_TEMPLATES.some((r) => r.test(closingText));
    if ((!motifRegex.test(closingText) || hasBannedTemplate) && FAMILY_CLOSING_FALLBACKS[primaryFamily]) {
      closingText = FAMILY_CLOSING_FALLBACKS[primaryFamily];
    }
  }

  if (fitPlan) {
    const pKey = fitPlan.primaryFit.key;
    const sKey = fitPlan.secondaryFit.key;
    const pMotifs = FIT_NEED_SEMANTIC_MOTIFS[pKey];
    const sMotifs = FIT_NEED_SEMANTIC_MOTIFS[sKey];

    const hasP = pMotifs ? pMotifs.regexes.some((r) => r.test(optimalList[0] || "")) : true;
    const hasS = sMotifs ? sMotifs.regexes.some((r) => r.test(optimalList[1] || "")) : true;

    if (!hasP && optimalList.length > 0) {
      optimalList[0] = fitPlan.primaryFit.environmentFitDirection;
    }
    if (!hasS && optimalList.length > 1) {
      optimalList[1] = fitPlan.secondaryFit.environmentFitDirection;
    }
  }

  let compareRows = report.relationships.compare.map((row) => ({
    wound: polishProse(row.wound, loc),
    steady: polishProse(row.steady, loc),
  }));

  if (fitPlan) {
    const BANNED_COACHING_PATTERNS = [
      /어떤 배움을.*기대/,
      /성장을 응원/,
      /다양한 가능성.*이야기/,
      /유연한 접근법이 좋아/,
      /새로운 시도를 해보는 건 어때/,
      /네 생각을 존중해/,
    ];
    const BANNED_META_PATTERNS = [
      /라는 말을 들으면/,
      /라는 말을 듣는 게/,
      /라고 물어보는 것이 더/,
      /라고 제안하는 것이/,
      /외로움을 느껴요/,
      /불안해요/,
    ];

    const primaryFallback = {
      wound: fitPlan.primaryFit.communicationTrigger,
      steady: fitPlan.primaryFit.communicationBetter,
    };
    const secondaryFallback = {
      wound: fitPlan.secondaryFit.communicationTrigger,
      steady: fitPlan.secondaryFit.communicationBetter,
    };

    let altFallback = {
      wound: "왜 세부적인 일까지 일일이 보고하라고 해?",
      steady: "전체 목표와 가이드라인만 맞춰주면 세부 실행은 믿고 맡겨줘.",
    };
    if (["PREDICTABILITY", "STRUCTURE"].includes(fitPlan.primaryFit.key) || ["PREDICTABILITY", "STRUCTURE"].includes(fitPlan.secondaryFit.key)) {
      altFallback = {
        wound: "왜 또 미리 안 알려주고 갑자기 일정을 바꿔?",
        steady: "중요한 변경 사항은 사전에 미리 알려주고 함께 소통해줘.",
      };
    } else if (["GROWTH_VARIETY", "STIMULATION"].includes(fitPlan.primaryFit.key) || ["GROWTH_VARIETY", "STIMULATION"].includes(fitPlan.secondaryFit.key)) {
      altFallback = {
        wound: "매번 같은 일만 반복하니까 답답해.",
        steady: "새로운 프로젝트나 과제를 시도해볼 수 있는 기회를 적극적으로 만들어줘.",
      };
    }

    const safePool = [primaryFallback, secondaryFallback, altFallback];

    compareRows = compareRows.map((row, idx) => {
      const isCoaching = BANNED_COACHING_PATTERNS.some((p) => p.test(row.wound) || p.test(row.steady));
      const isMeta = BANNED_META_PATTERNS.some((p) => p.test(row.wound) || p.test(row.steady));
      const isWoundSpoken = isSpokenDialogue(row.wound);
      const isSteadySpoken = isSpokenDialogue(row.steady);

      if (isCoaching || isMeta || !isWoundSpoken || !isSteadySpoken) {
        return safePool[idx] || safePool[0];
      }
      return row;
    });

    const deduped: Array<{ wound: string; steady: string }> = [];
    for (let i = 0; i < compareRows.length; i++) {
      let candidate = compareRows[i];
      const isDup = deduped.some((prev) => isDuplicatePair(prev, candidate));
      if (isDup) {
        const unusedPoolItem = safePool.find((item) => !deduped.some((prev) => isDuplicatePair(prev, item)));
        if (unusedPoolItem) {
          candidate = unusedPoolItem;
        }
      }
      deduped.push(candidate);
    }
    compareRows = deduped;
  }

  const next: DeepEssenceStructuredReport = {
    ...report,
    // summary chips / titles stay as-is (2–4 word labels, not sentences)
    summary: { ...report.summary },
    radar_potential: { ...report.radar_potential },
    strengths: report.strengths.map((s) => ({
      title: s.title,
      body: polishProse(s.body, loc),
    })),
    watchouts: report.watchouts.map((w) => ({
      title: w.title,
      body: polishProse(w.body, loc),
    })),
    energy: {
      ...report.energy,
      headline: polishProse(report.energy.headline, loc),
      summary: polishProse(report.energy.summary, loc),
      bars: report.energy.bars.map((b) => ({
        ...b,
        // keep tone enum untouched; polish display label only
        label: polishProse(b.label, loc),
        tone: b.tone,
      })),
      fuels: mapStrList(report.energy.fuels, loc),
      drains: mapStrList(report.energy.drains, loc),
      optimal: optimalList,
    },
    relationships: {
      pattern: polishProse(report.relationships.pattern, loc),
      fit: mapStrList(report.relationships.fit, loc),
      friction: mapStrList(report.relationships.friction, loc),
      compare: compareRows,
    },
    playbook: {
      rule: polishProse(report.playbook.rule, loc),
      rows: report.playbook.rows.map((row) => ({
        situation: polishProse(row.situation, loc),
        old: polishProse(row.old, loc),
        better: polishProse(row.better, loc),
      })),
      heated: polishProse(report.playbook.heated, loc),
      reset: polishProse(report.playbook.reset, loc),
    },
    future: {
      ...report.future,
      remember: report.future.remember.map((r) => cleanRememberText(r, loc)),
      leap: polishProse(report.future.leap, loc),
      ...(report.future.do_items
        ? {
            do_items: report.future.do_items.map((item) => ({
              title: polishProse(item.title, loc),
              body: polishProse(item.body, loc),
              ...(item.evidence_refs ? { evidence_refs: item.evidence_refs } : {}),
            })),
          }
        : {}),
      ...(report.future.dont_items
        ? {
            dont_items: report.future.dont_items.map((item) => ({
              title: polishProse(item.title, loc),
              body: polishProse(item.body, loc),
              ...(item.evidence_refs ? { evidence_refs: item.evidence_refs } : {}),
            })),
          }
        : {}),
      ...(report.future.decision_rules
        ? {
            decision_rules: report.future.decision_rules.map((rule) => polishProse(rule, loc)),
          }
        : {}),
    },
    closing: closingText,
    checklist: mapStrList(report.checklist, loc),
    ...(report.layered_identity
      ? {
          layered_identity: {
            ...(report.layered_identity.first_impression
              ? {
                  first_impression: {
                    ...report.layered_identity.first_impression,
                    ...(report.layered_identity.first_impression.title
                      ? { title: polishProse(report.layered_identity.first_impression.title, loc) }
                      : {}),
                    narrative: cleanAdaptationStoryText(report.layered_identity.first_impression.narrative, loc),
                  },
                }
              : {}),
            ...(report.layered_identity.known_self
              ? {
                  known_self: {
                    ...report.layered_identity.known_self,
                    ...(report.layered_identity.known_self.title
                      ? { title: polishProse(report.layered_identity.known_self.title, loc) }
                      : {}),
                    narrative: cleanAdaptationStoryText(report.layered_identity.known_self.narrative, loc),
                  },
                }
              : {}),
            ...(report.layered_identity.close_private_self
              ? {
                  close_private_self: {
                    ...report.layered_identity.close_private_self,
                    ...(report.layered_identity.close_private_self.title
                      ? { title: polishProse(report.layered_identity.close_private_self.title, loc) }
                      : {}),
                    narrative: cleanAdaptationStoryText(report.layered_identity.close_private_self.narrative, loc),
                  },
                }
              : {}),
            ...(report.layered_identity.natural_self_and_deep_needs
              ? {
                  natural_self_and_deep_needs: {
                    ...report.layered_identity.natural_self_and_deep_needs,
                    ...(report.layered_identity.natural_self_and_deep_needs.title
                      ? { title: polishProse(report.layered_identity.natural_self_and_deep_needs.title, loc) }
                      : {}),
                    narrative: cleanAdaptationStoryText(report.layered_identity.natural_self_and_deep_needs.narrative, loc),
                  },
                }
              : {}),
            ...(report.layered_identity.synthesis
              ? {
                  synthesis: {
                    ...report.layered_identity.synthesis,
                    narrative: cleanAdaptationStoryText(report.layered_identity.synthesis.narrative, loc),
                  },
                }
              : {}),
          },
        }
      : {}),
    ...(report.adaptation_story
      ? {
          adaptation_story: {
            ...report.adaptation_story,
            narrative: cleanAdaptationStoryText(report.adaptation_story.narrative, loc),
          },
        }
      : {}),
    ...(report.axis_interpretations
      ? {
          axis_interpretations: {
            ...(report.axis_interpretations.gap_deep_dive
              ? {
                  gap_deep_dive: Object.fromEntries(
                    Object.entries(report.axis_interpretations.gap_deep_dive).map(([k, v]) => [
                      k,
                      {
                        ...v,
                        natural_tendency: cleanAdaptationStoryText(v.natural_tendency, loc),
                        current_pattern: cleanAdaptationStoryText(v.current_pattern, loc),
                        gives_you: cleanAdaptationStoryText(v.gives_you, loc),
                        may_cost: cleanAdaptationStoryText(v.may_cost, loc),
                        ...(v.may_work_better
                          ? { may_work_better: cleanAdaptationStoryText(v.may_work_better, loc) }
                          : {}),
                      },
                    ]),
                  ),
                }
              : {}),
            ...(report.axis_interpretations.alignment_highlight
              ? {
                  alignment_highlight: Object.fromEntries(
                    Object.entries(report.axis_interpretations.alignment_highlight).map(([k, v]) => [
                      k,
                      {
                        ...v,
                        natural_tendency: cleanAdaptationStoryText(v.natural_tendency, loc),
                        current_pattern: cleanAdaptationStoryText(v.current_pattern, loc),
                        why_it_feels_easy: cleanAdaptationStoryText(v.why_it_feels_easy, loc),
                      },
                    ]),
                  ),
                }
              : {}),
          },
        }
      : {}),
  };

  return isDeepEssenceStructuredReport(next) ? next : (isDeepEssenceStructuredReport(report) ? report : next);
}
