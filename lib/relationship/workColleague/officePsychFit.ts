import type { Locale } from "@/lib/i18n/locale";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { WorkSajuSignals } from "@/lib/personCore/sajuSignals/types";
import type { CrossChartHit } from "@/lib/saju/pairChartAnalysis";
import { pick, LEGACY_FALLBACK_LOCALE } from "./workColleagueCopy";
import { resolveWorkCategory, sanitizeOfficeText } from "./officeLanguage";
import type { LeadershipRoleSplit } from "./officeLanguage";
import type { TenGodCategory } from "./tenGodComplement";

/**
 * 마스터 사양서(01 참고/marster_Prd.txt) 동료 섹션 Part2②③·Part3①·Part4② —
 * "사주 카테고리/신호 + 11축 보정"이 공통 패턴이라 한 파일에 모은다.
 * `psychMasterA/B`가 없으면(레거시 캐시·설문 미완료) 전부 null을 반환한다 —
 * officeLanguage.ts::resolveLeadershipRoleSplit과 동일한 폴백 규칙.
 */

function axisAvg(psych: PsychMasterJson, keys: Array<keyof PsychMasterJson["secondary_axes"]>): number {
  const scores = psych.secondary_axes;
  const sum = keys.reduce((s, k) => s + scores[k], 0);
  return sum / keys.length;
}

// ─── Part2② 보고 및 피드백 소통 핏 ──────────────────────────────────────────

export type ReportingStyleFit = {
  person_a: { nickname: string; style: "headline_first" | "context_first" | "flexible" };
  person_b: { nickname: string; style: "headline_first" | "context_first" | "flexible" };
  summary: string;
};

const HEADLINE_CATEGORIES = new Set<TenGodCategory>(["관성", "재성"]);
const CONTEXT_CATEGORIES = new Set<TenGodCategory>(["인성"]);

function resolveReportingStyleForPerson(
  category: TenGodCategory,
  psych: PsychMasterJson | null | undefined,
): "headline_first" | "context_first" | "flexible" {
  const axisScore = psych ? axisAvg(psych, ["thinking_style", "structure"]) : 50;
  const baseHeadline = HEADLINE_CATEGORIES.has(category);
  const baseContext = CONTEXT_CATEGORIES.has(category);

  if (axisScore >= 60) return baseContext ? "flexible" : "headline_first";
  if (axisScore <= 40) return baseHeadline ? "flexible" : "context_first";
  if (baseHeadline) return "headline_first";
  if (baseContext) return "context_first";
  return "flexible";
}

export function resolveReportingStyleFit(
  tenGodsA: Record<string, number>,
  tenGodsB: Record<string, number>,
  workSignalsA: WorkSajuSignals | undefined,
  workSignalsB: WorkSajuSignals | undefined,
  psychA: PsychMasterJson | null | undefined,
  psychB: PsychMasterJson | null | undefined,
  nicknameA: string,
  nicknameB: string,
  locale: Locale = LEGACY_FALLBACK_LOCALE,
): ReportingStyleFit | null {
  if (!psychA || !psychB) return null;

  const categoryA = resolveWorkCategory(tenGodsA, workSignalsA);
  const categoryB = resolveWorkCategory(tenGodsB, workSignalsB);
  const styleA = resolveReportingStyleForPerson(categoryA, psychA);
  const styleB = resolveReportingStyleForPerson(categoryB, psychB);

  const STYLE_LABEL: Record<Locale, Record<typeof styleA, string>> = {
    "en-US": {
      headline_first: "leads with the conclusion",
      context_first: "wants context and background first",
      flexible: "adapts either way",
    },
    "ko-KR": {
      headline_first: "결론부터 두괄식으로",
      context_first: "맥락·배경부터 짚어야 이해",
      flexible: "상황에 따라 유연하게",
    },
  };

  const summary =
    styleA === styleB
      ? pick(
          locale,
          `${nicknameA} and ${nicknameB} report the same way — ${STYLE_LABEL[locale][styleA]}.`,
          `${nicknameA}와 ${nicknameB} 둘 다 보고 스타일이 비슷해요 — ${STYLE_LABEL[locale][styleA]}.`,
        )
      : pick(
          locale,
          `${nicknameA} ${STYLE_LABEL[locale][styleA]}, while ${nicknameB} ${STYLE_LABEL[locale][styleB]} — match the format to the listener.`,
          `${nicknameA}는 ${STYLE_LABEL[locale][styleA]} 편이고, ${nicknameB}는 ${STYLE_LABEL[locale][styleB]} 편이에요 — 듣는 사람에 맞춰 포맷을 바꿔보세요.`,
        );

  return {
    person_a: { nickname: nicknameA, style: styleA },
    person_b: { nickname: nicknameB, style: styleB },
    summary: sanitizeOfficeText(summary),
  };
}

// ─── Part2③ 점심시간 & 탕비실 경계선 ────────────────────────────────────────

export type BreakBoundaryFit = {
  person_a: { nickname: string; style: "social" | "solo_reset" | "balanced" };
  person_b: { nickname: string; style: "social" | "solo_reset" | "balanced" };
  summary: string;
};

function resolveBreakStyleForPerson(psych: PsychMasterJson): "social" | "solo_reset" | "balanced" {
  const score = axisAvg(psych, ["energy_style", "empathy"]);
  if (score >= 60) return "social";
  if (score <= 40) return "solo_reset";
  return "balanced";
}

function hasDayBranchHarmony(hits: CrossChartHit[]): boolean {
  return hits.some((h) => h.type.includes("합"));
}

function hasDayBranchTension(hits: CrossChartHit[]): boolean {
  return hits.some((h) => ["충", "형", "파", "해"].includes(h.type));
}

export function resolveBreakBoundaryFit(
  dayBranchCrossHits: CrossChartHit[],
  psychA: PsychMasterJson | null | undefined,
  psychB: PsychMasterJson | null | undefined,
  nicknameA: string,
  nicknameB: string,
  locale: Locale = LEGACY_FALLBACK_LOCALE,
): BreakBoundaryFit | null {
  if (!psychA || !psychB) return null;

  const styleA = resolveBreakStyleForPerson(psychA);
  const styleB = resolveBreakStyleForPerson(psychB);
  const harmony = hasDayBranchHarmony(dayBranchCrossHits);
  const tension = hasDayBranchTension(dayBranchCrossHits);

  const STYLE_LABEL: Record<Locale, Record<typeof styleA, string>> = {
    "en-US": {
      social: "recharges with small talk over coffee/lunch",
      solo_reset: "needs quiet alone time to reset",
      balanced: "flexes between the two",
    },
    "ko-KR": {
      social: "커피·점심 스몰토크로 충전하는 편",
      solo_reset: "혼자만의 조용한 시간이 필요한 편",
      balanced: "그때그때 유연하게",
    },
  };

  const pairNote = harmony
    ? pick(
        locale,
        "Your day-branch signals line up well, so shared break time tends to feel comfortable rather than draining.",
        "일지 신호가 잘 맞는 편이라, 같이 쉬는 시간이 부담보다는 편안함에 가까워요.",
      )
    : tension
      ? pick(
          locale,
          "Your day-branch signals pull in different directions — don't force shared breaks; let each person recharge their own way.",
          "일지 신호가 서로 다른 방향이라, 쉬는 시간까지 억지로 맞추지 말고 각자 방식대로 충전하게 두는 게 좋아요.",
        )
      : pick(
          locale,
          "There's no strong pull either way — just check in on what the other prefers.",
          "특별히 강한 신호는 없으니, 서로 선호를 가볍게 물어보고 맞추면 충분해요.",
        );

  return {
    person_a: { nickname: nicknameA, style: styleA },
    person_b: { nickname: nicknameB, style: styleB },
    summary: sanitizeOfficeText(
      `${pick(locale, `${nicknameA} ${STYLE_LABEL[locale][styleA]}, ${nicknameB} ${STYLE_LABEL[locale][styleB]}.`, `${nicknameA}는 ${STYLE_LABEL[locale][styleA]}이고, ${nicknameB}는 ${STYLE_LABEL[locale][styleB]}이에요.`)} ${pairNote}`,
    ),
  };
}

// ─── Part3① 지원 기여형 vs 성과 수확형 ──────────────────────────────────────

export type ContributionStyle = "support_care" | "outcome_gain" | "balanced";

export type ContributionStyleFit = {
  person_a: { nickname: string; style: ContributionStyle; label: string };
  person_b: { nickname: string; style: ContributionStyle; label: string };
};

function resolveContributionStyleForPerson(
  workSignals: WorkSajuSignals | undefined,
  psych: PsychMasterJson,
): ContributionStyle {
  const seal = workSignals?.drive_stubborn.seal_count ?? 0;
  const outcome = (workSignals?.drive_stubborn.officer_count ?? 0) + (workSignals?.drive_stubborn.wealth_count ?? 0);
  const sajuDiff = seal - outcome;

  const empathy = psych.secondary_axes.empathy;
  const practicality = psych.secondary_axes.practicality;
  const psychDiff = empathy - practicality;

  const combined = sajuDiff * 10 + psychDiff;
  if (combined >= 15) return "support_care";
  if (combined <= -15) return "outcome_gain";
  return "balanced";
}

export function resolveContributionStyle(
  workSignalsA: WorkSajuSignals | undefined,
  workSignalsB: WorkSajuSignals | undefined,
  psychA: PsychMasterJson | null | undefined,
  psychB: PsychMasterJson | null | undefined,
  nicknameA: string,
  nicknameB: string,
  locale: Locale = LEGACY_FALLBACK_LOCALE,
): ContributionStyleFit | null {
  if (!psychA || !psychB) return null;
  const styleA = resolveContributionStyleForPerson(workSignalsA, psychA);
  const styleB = resolveContributionStyleForPerson(workSignalsB, psychB);
  return {
    person_a: { nickname: nicknameA, style: styleA, label: CONTRIBUTION_STYLE_LABEL[locale][styleA] },
    person_b: { nickname: nicknameB, style: styleB, label: CONTRIBUTION_STYLE_LABEL[locale][styleB] },
  };
}

export const CONTRIBUTION_STYLE_LABEL: Record<Locale, Record<ContributionStyle, string>> = {
  "en-US": {
    support_care: "Support & Care — spots where teammates are stuck and helps them along",
    outcome_gain: "Outcome & Gain — drives results and real, tangible wins",
    balanced: "Balanced — shifts between support and results as needed",
  },
  "ko-KR": {
    support_care: "조직 활력 도모형 — 팀원들이 막히는 지점을 먼저 살피고 지원해요",
    outcome_gain: "성과 및 실리 수확형 — 실질적인 결실을 끌어내는 데 강해요",
    balanced: "균형형 — 상황에 따라 지원과 성과 사이를 오가요",
  },
};

// ─── Part4② 피드백 쿠션 멘트 ────────────────────────────────────────────────

export type FeedbackCushionScript = {
  /** A에게 피드백할 때(=B가 A에게) 쓰면 좋은 쿠션 멘트 */
  to_a: string;
  /** B에게 피드백할 때(=A가 B에게) 쓰면 좋은 쿠션 멘트 */
  to_b: string;
};

function resolveCushionLine(
  nickname: string,
  strength: { label: string; note: string },
  recognitionScore: number,
  locale: Locale,
): string {
  const strong = strength.label.includes("신강");
  const highRecognition = recognitionScore >= 60;

  if (strong && highRecognition) {
    return pick(
      locale,
      `Open by naming what ${nickname} already does well, then bring up the improvement — they need their expertise acknowledged first.`,
      `${nickname}가 이미 잘하고 있는 부분을 먼저 짚어준 뒤 개선점을 꺼내세요 — 전문성 인정이 먼저 필요한 타입이에요.`,
    );
  }
  if (strong) {
    return pick(
      locale,
      `Get straight to the point with ${nickname} — a clear, direct ask lands better than a long preamble.`,
      `${nickname}에게는 바로 핵심부터 말하세요 — 긴 서론보다 명확하고 직접적인 요청이 잘 통해요.`,
    );
  }
  if (highRecognition) {
    return pick(
      locale,
      `Reassure ${nickname} first — a warm, supportive tone before the ask helps them hear it without feeling criticized.`,
      `${nickname}에게는 먼저 다독여 주세요 — 따뜻한 톤으로 시작하면 지적처럼 안 느끼고 받아들여요.`,
    );
  }
  return pick(
    locale,
    `Keep it simple and low-pressure with ${nickname} — a calm, matter-of-fact suggestion works well.`,
    `${nickname}에게는 부담 없이 담백하게 말해도 괜찮아요 — 차분한 제안이면 충분해요.`,
  );
}

export function resolveFeedbackCushionScript(
  nicknameA: string,
  nicknameB: string,
  strengthA: { label: string; note: string },
  strengthB: { label: string; note: string },
  psychA: PsychMasterJson | null | undefined,
  psychB: PsychMasterJson | null | undefined,
  locale: Locale = LEGACY_FALLBACK_LOCALE,
): FeedbackCushionScript | null {
  if (!psychA || !psychB) return null;
  return {
    to_a: sanitizeOfficeText(
      resolveCushionLine(nicknameA, strengthA, psychA.secondary_axes.recognition, locale),
    ),
    to_b: sanitizeOfficeText(
      resolveCushionLine(nicknameB, strengthB, psychB.secondary_axes.recognition, locale),
    ),
  };
}

// ─── Part3② 주도권 복합 (Phase 5-2) ─────────────────────────────────────────

const LEADERSHIP_MARGIN = 12;
/** saju officer+self 격차가 이 이상이면 psych로 pick flip 금지 */
const SAJU_EXT_LOCK = 2;

function sajuExternalScore(s: WorkSajuSignals): number {
  return s.drive_stubborn.officer_count + s.drive_stubborn.self_count;
}

function sajuInternalScore(s: WorkSajuSignals): number {
  return s.drive_stubborn.seal_count + s.drive_stubborn.wealth_count;
}

function psychExternalScore(psych: PsychMasterJson): number {
  const { practicality, structure, self_control } = psych.secondary_axes;
  // 대외 발표: 실리↑, 검수형 구조·통제는 상대적으로 낮을수록 가산
  return practicality - (structure + self_control) / 2;
}

function psychInternalScore(psych: PsychMasterJson): number {
  const { structure, self_control, empathy } = psych.secondary_axes;
  return (structure + self_control + empathy) / 3;
}

function reportingExtBonus(
  style: ReportingStyleFit["person_a"]["style"] | undefined,
): number {
  if (style === "headline_first") return 8;
  if (style === "context_first") return -6;
  return 0;
}

function reportingIntBonus(
  style: ReportingStyleFit["person_a"]["style"] | undefined,
): number {
  if (style === "context_first") return 8;
  if (style === "headline_first") return -4;
  return 0;
}

function contributionExtBonus(style: ContributionStyle | null | undefined): number {
  if (style === "outcome_gain") return 8;
  if (style === "support_care") return -6;
  return 0;
}

function contributionIntBonus(style: ContributionStyle | null | undefined): number {
  if (style === "support_care") return 8;
  if (style === "outcome_gain") return -4;
  return 0;
}

function breakExtBonus(
  style: BreakBoundaryFit["person_a"]["style"] | undefined,
): number {
  if (style === "social") return 4;
  if (style === "solo_reset") return -4;
  return 0;
}

function breakIntBonus(
  style: BreakBoundaryFit["person_a"]["style"] | undefined,
): number {
  if (style === "solo_reset") return 4;
  if (style === "social") return -2;
  return 0;
}

function winnerFromDiff(diff: number, margin: number): "a" | "b" | "balanced" {
  if (diff >= margin) return "a";
  if (diff <= -margin) return "b";
  return "balanced";
}

function buildLeadershipSummary(
  external: "a" | "b" | "balanced",
  internal: "a" | "b" | "balanced",
  nicknameA: string,
  nicknameB: string,
  locale: Locale,
  soft: boolean,
): string {
  if (external === "balanced" || internal === "balanced" || external === internal) {
    const base = pick(
      locale,
      `${nicknameA} and ${nicknameB} are evenly matched on presenting vs. reviewing — decide case by case rather than fixing roles.`,
      `${nicknameA}와 ${nicknameB}는 대외 발표·실무 검수 성향이 비슷해요. 역할을 고정하기보다 상황에 따라 나누는 게 좋아요.`,
    );
    if (!soft) return sanitizeOfficeText(base);
    return sanitizeOfficeText(
      `${base} ${pick(
        locale,
        "Survey axes don't lock this in — treat the split as a soft default.",
        "설문 축만으로는 역할이 단정되지 않아요 — 참고용 기본값으로 두세요.",
      )}`,
    );
  }

  const externalName = external === "a" ? nicknameA : nicknameB;
  const internalName = internal === "a" ? nicknameA : nicknameB;
  const base = pick(
    locale,
    `${externalName} fits presenting and reporting externally, while ${internalName} is stronger at internal review and quality control — split it officially instead of both trying to do everything.`,
    `${externalName}는 대외 발표·리포팅 쪽이 잘 맞고, ${internalName}는 실무 검수·품질 관리 쪽이 강해요. 둘 다 다 하려 하지 말고 역할을 공식적으로 나눠보세요.`,
  );
  if (!soft) return sanitizeOfficeText(base);
  return sanitizeOfficeText(
    `${base} ${pick(
      locale,
      "Survey axes are mixed here — keep the split flexible.",
      "설문 축은 엇갈려 있어요 — 역할을 너무 굳히지 말고 유연하게 가져가세요.",
    )}`,
  );
}

export type RefineLeadershipRoleSplitParams = {
  /** officeLanguage.resolveLeadershipRoleSplit 결과 — 재호출하지 않고 조합만 */
  base: LeadershipRoleSplit | null;
  workSignalsA: WorkSajuSignals | undefined;
  workSignalsB: WorkSajuSignals | undefined;
  psychA: PsychMasterJson | null | undefined;
  psychB: PsychMasterJson | null | undefined;
  reporting?: ReportingStyleFit | null;
  contribution?: ContributionStyleFit | null;
  breakBoundary?: BreakBoundaryFit | null;
  nicknameA: string;
  nicknameB: string;
  locale?: Locale;
};

/**
 * Phase 5-2 — drive_stubborn legacy pick + psych/reporting/contribution/break 조합.
 * psych 누락 시 base 그대로(legacy). 불확실·역할 충돌 시 base pick 유지 + low/caution.
 * reporting·contribution·break resolver는 호출하지 않는다(이미 계산된 값만).
 */
export function refineLeadershipRoleSplit(
  params: RefineLeadershipRoleSplitParams,
): LeadershipRoleSplit | null {
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;
  const base = params.base;
  if (!base) return null;

  const { workSignalsA, workSignalsB, psychA, psychB } = params;
  if (!workSignalsA || !workSignalsB || !psychA || !psychB) {
    return base;
  }

  const styleBonusExtA =
    reportingExtBonus(params.reporting?.person_a.style) +
    contributionExtBonus(params.contribution?.person_a.style) +
    breakExtBonus(params.breakBoundary?.person_a.style);
  const styleBonusExtB =
    reportingExtBonus(params.reporting?.person_b.style) +
    contributionExtBonus(params.contribution?.person_b.style) +
    breakExtBonus(params.breakBoundary?.person_b.style);
  const styleBonusIntA =
    reportingIntBonus(params.reporting?.person_a.style) +
    contributionIntBonus(params.contribution?.person_a.style) +
    breakIntBonus(params.breakBoundary?.person_a.style);
  const styleBonusIntB =
    reportingIntBonus(params.reporting?.person_b.style) +
    contributionIntBonus(params.contribution?.person_b.style) +
    breakIntBonus(params.breakBoundary?.person_b.style);

  const compositeExtA =
    sajuExternalScore(workSignalsA) * 10 +
    psychExternalScore(psychA) +
    styleBonusExtA;
  const compositeExtB =
    sajuExternalScore(workSignalsB) * 10 +
    psychExternalScore(psychB) +
    styleBonusExtB;
  const compositeIntA =
    sajuInternalScore(workSignalsA) * 10 +
    psychInternalScore(psychA) +
    styleBonusIntA;
  const compositeIntB =
    sajuInternalScore(workSignalsB) * 10 +
    psychInternalScore(psychB) +
    styleBonusIntB;

  const extDiff = compositeExtA - compositeExtB;
  const intDiff = compositeIntA - compositeIntB;
  const compositeExternal = winnerFromDiff(extDiff, LEADERSHIP_MARGIN);
  const compositeInternal = winnerFromDiff(intDiff, LEADERSHIP_MARGIN);

  const sajuExtDiff =
    sajuExternalScore(workSignalsA) - sajuExternalScore(workSignalsB);
  const sajuLocked = Math.abs(sajuExtDiff) >= SAJU_EXT_LOCK;

  const rolesOverlap =
    compositeExternal !== "balanced" &&
    compositeInternal !== "balanced" &&
    compositeExternal === compositeInternal;
  const bothBalanced =
    compositeExternal === "balanced" && compositeInternal === "balanced";
  const clearSplit =
    compositeExternal !== "balanced" &&
    compositeInternal !== "balanced" &&
    compositeExternal !== compositeInternal;

  let external = base.external_lead;
  let internal = base.internal_qa_lead;
  let confidence: "high" | "low" = "low";
  let align: "confirms" | "caution" = "caution";
  let soft = true;

  if (clearSplit) {
    const flipsExternal =
      base.external_lead !== "balanced" &&
      compositeExternal !== base.external_lead;
    if (flipsExternal && sajuLocked) {
      // 강한 사주 pick 유지
      external = base.external_lead;
      internal = base.internal_qa_lead;
      confidence = "low";
      align = "caution";
      soft = true;
    } else {
      external = compositeExternal;
      internal = compositeInternal;
      const matchesBase =
        external === base.external_lead && internal === base.internal_qa_lead;
      confidence = "high";
      align = matchesBase ? "confirms" : flipsExternal ? "caution" : "confirms";
      soft = align === "caution";
    }
  } else if (bothBalanced || rolesOverlap) {
    external = base.external_lead;
    internal = base.internal_qa_lead;
    confidence = "low";
    align =
      base.external_lead === "balanced" && bothBalanced
        ? "confirms"
        : "caution";
    soft = align === "caution";
  } else {
    // 한쪽만 뚜렷 — 불확실하면 base 유지
    external = base.external_lead;
    internal = base.internal_qa_lead;
    confidence = "low";
    align = "caution";
    soft = true;
  }

  return {
    external_lead: external,
    internal_qa_lead: internal,
    summary: buildLeadershipSummary(
      external,
      internal,
      params.nicknameA,
      params.nicknameB,
      locale,
      soft,
    ),
    confidence,
    align,
  };
}

