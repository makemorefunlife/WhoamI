import type { MarriageRuleContext } from "./buildMarriageRuleContext";
import type { HomeDeEscalationPair, ColdWarProtocol } from "./homeDeEscalationPrescriptions";
import { resolveColdWarProtocol } from "./homeDeEscalationPrescriptions";
import type {
  ThreeYearHomeRiskForecast,
  SleepFitSection,
  ConflictCommunicationSection,
} from "./marriageKillerSections";
import {
  buildBedroomMatrixSection,
  resolveRejectionScript,
  type BedroomMatrixSection,
} from "./bedroomProfile";
import type { ParentingStyle } from "./marriageTenGodAnalysis";
import { profileTenGods } from "./marriageTenGodAnalysis";
import {
  buildOriginStorySection,
  type OriginStorySection,
} from "./marriageOriginStory";
import { resolveSpendingStyleNote } from "./marriageCfoConsumption";
import {
  buildPrivateBoundary,
  buildPersonFamilyBoundaryNote,
  buildHomeUpsetResponseGuide,
  buildAttachmentNarrative,
  sanitizeHomeLifeText,
  type HomeUpsetGuide,
} from "./homeLifeLanguage";
import { LEGACY_FALLBACK_LOCALE, pick } from "./marriageCopy";
import type { Locale } from "@/lib/i18n/locale";

export type HomeDnaSection = {
  person_a: MarriageRuleContext["householdDnaA"];
  person_b: MarriageRuleContext["householdDnaB"];
};

export type HouseholdSnapshotSection = {
  romantic_fit_pct: number;
  life_synergy_pct: number;
  home_risk_pct: number;
  one_line_household: string;
};

export type BedroomSection = {
  matrix: BedroomMatrixSection;
  attachment_style: string;
  sleep_fit: SleepFitSection;
  rejection_script_a: string;
  rejection_script_b: string;
  /** psych(설문) 필요 — buildMarriageReport.ts에서 나중에 patch(section_money_chores와 동일 패턴) */
  rejection_axis_note?: string | null;
};

export type HomeWeatherForecastSection = ThreeYearHomeRiskForecast;

export type MoneyChoresSection = {
  cfo_nickname: string;
  cfo_reason: string;
  chores_guideline: string;
  spending_style_note: string;
  /** psych(설문) 필요 — buildMarriageReport.ts에서 나중에 patch(section_compare_table과 동일 패턴) */
  cfo_axis_note?: string | null;
  /** Phase 5-2 — psych 복합 시만. UI 미소비 */
  cfo_confidence?: "high" | "low";
  cfo_align?: "confirms" | "caution";
  cfo_dual?: boolean;
};

export type FamilyBoundarySection = {
  inlaw_stress_summary: string;
  person_a_boundary_note: string;
  person_b_boundary_note: string;
};

export type ParentingSection = {
  combined_attitude: string;
  person_a_style: string;
  person_b_style: string;
  harmony_tip: string;
  /** psych(설문) 필요 — buildMarriageReport.ts에서 나중에 patch(section_money_chores와 동일 패턴) */
  person_a_role_note?: string | null;
  person_b_role_note?: string | null;
  /** Phase 5-2 — raw style (표시 문자열과 별도, CO·compare용) */
  style_key_a?: ParentingStyle;
  style_key_b?: ParentingStyle;
  parenting_a_confidence?: "high" | "low";
  parenting_b_confidence?: "high" | "low";
  parenting_a_align?: "confirms" | "caution";
  parenting_b_align?: "confirms" | "caution";
};

export type PrivacyRespectSection = {
  person_a_private_line: string;
  person_b_private_line: string;
};

export type HomeUpsetSection = {
  person_a: HomeUpsetGuide;
  person_b: HomeUpsetGuide;
};

export type HomeWarningSection = {
  conflict_communication: ConflictCommunicationSection;
  conflict_trigger: string;
  de_escalation: HomeDeEscalationPair;
  cold_war_protocol: ColdWarProtocol;
};

export type HouseholdPartnershipReport = {
  section_dna: HomeDnaSection;
  section_snapshot: HouseholdSnapshotSection;
  section_origin_story: OriginStorySection;
  section_weather_forecast: HomeWeatherForecastSection;
  section_bedroom: BedroomSection;
  section_money_chores: MoneyChoresSection;
  section_family_boundary: FamilyBoundarySection;
  section_parenting: ParentingSection;
  section_privacy: PrivacyRespectSection;
  section_upset: HomeUpsetSection;
  section_warning: HomeWarningSection;
  /**
   * 사주 중심 "한눈에 비교" 표(6행) — work·friend와 동일 패턴. 이 함수
   * 안에서는 안 채워지고 `buildMarriageReport.ts`에서 별도로 채워 넣는다
   * (friend의 section_compare_table과 동일 방식).
   */
  section_compare_table?: import("./marriageSajuCompareTable").MarriageCompareRow[];
};

/**
 * 사양서 시그니처 규칙: 천간합/일지합 존재 ➔ "운명적 정서 끌림형 패밀리",
 * 관성/재성 중심 ➔ "체계적 패밀리 경영형". 기존 점수 기반 5개 케이스보다
 * 먼저 확인하되, 어느 쪽도 안 걸리면 null을 반환해 기존 로직으로 그대로
 * 폴백한다(레거시 세이프티 — 새 분기 미스매치 시 byte-identical 유지).
 */
export function resolveHouseholdArchetype(ctx: MarriageRuleContext): string | null {
  const { hasHeavenlyStemCombine, hasDayBranchCombine } =
    ctx.marriagePairAnalysis.scoringSignals;
  const locale = ctx.locale;
  const titleA = ctx.householdDnaA.lifestyle_title.split(" ")[0] ?? "Warm";
  const titleB = ctx.householdDnaB.lifestyle_title.split(" ")[0] ?? "Steady";

  if (hasHeavenlyStemCombine || hasDayBranchCombine) {
    return pick(
      locale,
      `${titleA} & ${titleB} — a fated-pull family, drawn together by a chemistry neither of you can quite explain`,
      `${titleA} & ${titleB} — 운명적 정서 끌림형 패밀리, 설명하기 힘든 케미로 서로를 끌어당긴 하우스`,
    );
  }

  const wealthOfficerA = profileTenGods(ctx.tenGod.countsA).wealthOfficer;
  const wealthOfficerB = profileTenGods(ctx.tenGod.countsB).wealthOfficer;
  if (wealthOfficerA + wealthOfficerB >= 4) {
    return pick(
      locale,
      `${titleA} & ${titleB} — a systematic-management family, running the household on clear roles and responsibility`,
      `${titleA} & ${titleB} — 체계적 패밀리 경영형, 뚜렷한 역할과 책임감으로 살림을 꾸려가는 하우스`,
    );
  }

  return null;
}

function resolveHouseholdOneLiner(ctx: MarriageRuleContext): string {
  const archetype = resolveHouseholdArchetype(ctx);
  if (archetype) return archetype;

  const { activation, benefit, risk } = ctx.masterScores;
  const titleA = ctx.householdDnaA.lifestyle_title.split(" ")[0] ?? "Warm";
  const titleB = ctx.householdDnaB.lifestyle_title.split(" ")[0] ?? "Steady";
  const locale = ctx.locale;

  if (benefit >= 70 && risk < 40) {
    return pick(
      locale,
      `${titleA} & ${titleB} — a spark-flying romantic house built on financial security`,
      `${titleA} & ${titleB} — 재정적 든든함 위에 세워진, 불꽃 튀는 로맨틱 하우스`,
    );
  }
  if (activation >= 65 && risk >= 55) {
    return pick(
      locale,
      `${titleA} & ${titleB} — passion overflows, but this house lasts once you set the household rules`,
      `${titleA} & ${titleB} — 열정은 넘치지만, 집 안 규칙만 정하면 오래 가는 하우스`,
    );
  }
  if (risk >= 60) {
    return pick(
      locale,
      `${titleA} & ${titleB} — split the roles and it's peace, mix them and it's war — boundaries are everything`,
      `${titleA} & ${titleB} — 역할만 나누면 평화, 섞으면 전쟁 — 경계가 생명`,
    );
  }
  if (activation >= 75) {
    return pick(
      locale,
      `${titleA} & ${titleB} — the bedroom runs hot, the living room needs some negotiating`,
      `${titleA} & ${titleB} — 침실은 뜨겁고, 거실은 협상이 필요한 하우스`,
    );
  }
  return pick(
    locale,
    `${titleA} & ${titleB} — you fill the house with different strengths, but without honest conversation only misunderstanding builds up`,
    `${titleA} & ${titleB} — 서로 다른 강점으로 집을 채우되, 솔직한 대화 없으면 오해만 쌓이는 하우스`,
  );
}

function buildChoresGuideline(ctx: MarriageRuleContext): string {
  const { benefit, risk } = ctx.masterScores;
  const locale = ctx.locale;
  if (benefit >= 65 && risk < 50) {
    return sanitizeHomeLifeText(
      pick(
        locale,
        "Peace requires clearly splitting roles — a system like 'you handle dishes and laundry, I handle groceries and bills' keeps hurt feelings from building up.",
        "역할을 명확히 쪼개야 평화 — '너는 설거지·빨래, 나는 장보기·청구서'처럼 시스템이 있어야 서운함이 안 쌓입니다.",
      ),
    );
  }
  if (risk >= 55) {
    return sanitizeHomeLifeText(
      pick(
        locale,
        "Winging it by what's visible guarantees a fight. A weekly 15-minute chore meeting isn't optional — it's essential.",
        "눈에 보이는 대로 하면 100% 싸웁니다. 주간 가사 회의 15분은 선택이 아니라 필수예요.",
      ),
    );
  }
  return sanitizeHomeLifeText(
    pick(
      locale,
      "A 'this week's assignment' checklist is more realistic than a perfect division chart. Write down the invisible labor (tidying, bookings, childcare scheduling) first.",
      "완벽한 분담표보다 '이번 주 담당' 체크리스트가 현실적입니다. 안 보이는 노동(정리·예약·육아 스케줄)을 먼저 적으세요.",
    ),
  );
}

function buildInlawStressSummary(ctx: MarriageRuleContext): string {
  const bA = ctx.tenGod.boundaryA;
  const bB = ctx.tenGod.boundaryB;
  const locale = ctx.locale;
  const maxStress = Math.max(bA.inlawStressIndex, bB.inlawStressIndex);
  const hardBoundary =
    maxStress >= 70 ||
    bA.needsStrongBoundary ||
    bB.needsStrongBoundary ||
    (bA.hyoshinRisk && bB.hyoshinRisk);

  if (hardBoundary) {
    return sanitizeHomeLifeText(
      pick(
        locale,
        `In-law stress index ${maxStress}% — honestly, protecting the peace of this home means boldly drawing an emotional and physical line with the family of origin. ` +
          `Without "our nuclear family comes first" on holidays, visits, money, and childcare interference, the two of you will split first.`,
        `시댁·처가 스트레스 지수 ${maxStress}% — 솔직히 말하면, 이 집의 평화를 지키려면 원가족과 정서적·물리적 선을 과감히 긋는 게 맞습니다. ` +
          `명절·방문·돈·육아 개입에 '우리 핵가족 우선'이 아니면 둘 사이가 먼저 갈라집니다.`,
      ),
    );
  }
  if (maxStress >= 45) {
    return sanitizeHomeLifeText(
      pick(
        locale,
        `In-law stress index ${maxStress}% — unless you pin down distance and visit rules ahead of time, small things escalate into couple fights.`,
        `시댁·처가 스트레스 지수 ${maxStress}% — 거리와 방문 룰을 미리 박아 두지 않으면, 사소한 일이 커플 싸움으로 번집니다.`,
      ),
    );
  }
  return sanitizeHomeLifeText(
    pick(
      locale,
      `In-law stress index ${maxStress}% — relatively independent, but keep the boundary so family issues don't follow you into the bedroom when you're tired.`,
      `시댁·처가 스트레스 지수 ${maxStress}% — 비교적 독립적이지만, 피곤할 때 가족 이슈가 침실까지 따라오지 않게 경계는 유지하세요.`,
    ),
  );
}

function parentingBadge(style: ParentingStyle, locale: Locale): string {
  if (style === "empathy") return pick(locale, "🎨 Empathy Type", "🎨 공감형");
  return pick(locale, "📐 Structure Type", "📐 규칙형");
}

function parentingStyleDescription(label: string): string {
  const dash = label.indexOf(" — ");
  if (dash >= 0) return label.slice(dash + 3).trim();
  return label.replace(/^🎨\s*|^📐\s*/, "").trim();
}

export function formatParentingStyleLine(
  style: ParentingStyle,
  label: string,
  locale: Locale,
): string {
  return sanitizeHomeLifeText(
    `${parentingBadge(style, locale)} — ${parentingStyleDescription(label)}`,
  );
}

export function buildParentingCombinedFromStyles(
  nameA: string,
  nameB: string,
  styleA: ParentingStyle,
  styleB: ParentingStyle,
  locale: Locale,
): string {
  if (styleA === styleB) {
    if (styleA === "empathy") {
      return sanitizeHomeLifeText(
        pick(
          locale,
          `${nameA} & ${nameB} — you're both close to 🎨 empathy type. You read the child's emotions well, but once rules blur, you both wear yourselves out repeating "it's fine." Pin boundaries and routines down in writing.`,
          `${nameA} & ${nameB} — 둘 다 🎨 공감형에 가깝습니다. 아이의 감정을 잘 읽지만, 규칙이 흐려지면 둘 다 '괜찮아'만 반복하다 지칩니다. 경계와 루틴을 문서로 박아 두세요.`,
        ),
      );
    }
    return sanitizeHomeLifeText(
      pick(
        locale,
        `${nameA} & ${nameB} — you're both close to 📐 structure type. Standards and schedules are solid, but missing the child's emotional signals stiffens the air at home. Add one line — "how are you feeling today?" — to the routine.`,
        `${nameA} & ${nameB} — 둘 다 📐 규칙형에 가깝습니다. 기준과 일정은 단단하지만, 아이의 감정 신호를 놓치면 집안 공기가 딱딱해집니다. '오늘 기분은?' 한 마디를 루틴에 넣으세요.`,
      ),
    );
  }
  return sanitizeHomeLifeText(
    pick(
      locale,
      `${nameA} → ${parentingBadge(styleA, locale)} · ${nameB} → ${parentingBadge(styleB, locale)} — ` +
        `you love the child at the same temperature but in different ways. Clashing your parenting styles in front of the child only shakes the child.`,
      `${nameA} → ${parentingBadge(styleA, locale)} · ${nameB} → ${parentingBadge(styleB, locale)} — ` +
        `아이를 사랑하는 온도는 같지만 방식이 다릅니다. 아이 앞에서 양육 방식을 충돌시키면 아이만 흔들립니다.`,
    ),
  );
}

export function buildParentingHarmonyTipFromStyles(
  nameA: string,
  nameB: string,
  styleA: ParentingStyle,
  styleB: ParentingStyle,
  locale: Locale,
): string {
  if (styleA !== styleB) {
    const empathyName = styleA === "empathy" ? nameA : nameB;
    const structureName = styleA === "structure" ? nameA : nameB;
    return sanitizeHomeLifeText(
      pick(
        locale,
        `💬 ${empathyName} (🎨 empathy type) and ${structureName} (📐 structure type) run at a different temperature in how they love the child. ` +
          `Never point out or put down each other's parenting style in front of the child. ` +
          `Fully agree on discipline guidelines somewhere private, just the two of you without the child, and ` +
          `then show the child only one firm, consistent voice — that's what keeps the child's emotions steady.`,
        `💬 ${empathyName}(🎨 공감형)과 ${structureName}(📐 규칙형)은 아이를 사랑하는 방식의 온도가 다릅니다. ` +
          `아이 앞에서는 절대 서로의 양육 방식을 지적하거나 깎아내리지 마세요. ` +
          `아이가 없는 독립된 부부만의 공간에서 훈육 가이드라인을 완벽히 합의한 뒤, ` +
          `아이 앞에서는 오직 단호하고 일관된 하나의 목소리만 들려주어야 아이의 정서가 흔들리지 않습니다.`,
      ),
    );
  }
  if (styleA === "empathy") {
    return sanitizeHomeLifeText(
      pick(
        locale,
        `💬 ${nameA} & ${nameB} — two empathy types both wear out trying to match the child's every emotion. Agree to "add just one rule this week," and take turns being the firm one.`,
        `💬 ${nameA} & ${nameB} — 공감형끼리는 아이 감정에 맞추다 부모 둘 다 지칩니다. '이번 주는 규칙 한 줄만 추가'하기로 합의하고, 번갈아 단호한 역할을 맡으세요.`,
      ),
    );
  }
  return sanitizeHomeLifeText(
    pick(
      locale,
      `💬 ${nameA} & ${nameB} — two structure types align on standards, but the emotional side can dry up. Set a weekly "child mood check-in" and make one night about asking the heart before the rules.`,
      `💬 ${nameA} & ${nameB} — 규칙형끼리는 기준이 맞지만 감정 쪽이 메마를 수 있습니다. 주 1회 '아이 기분 체크인' 시간을 정해, 룰보다 마음을 먼저 묻는 밤을 만드세요.`,
    ),
  );
}

function buildParentingCombined(ctx: MarriageRuleContext): string {
  return buildParentingCombinedFromStyles(
    ctx.nicknameA,
    ctx.nicknameB,
    ctx.tenGod.parentingA.style,
    ctx.tenGod.parentingB.style,
    ctx.locale,
  );
}

function buildParentingHarmonyTip(ctx: MarriageRuleContext): string {
  return buildParentingHarmonyTipFromStyles(
    ctx.nicknameA,
    ctx.nicknameB,
    ctx.tenGod.parentingA.style,
    ctx.tenGod.parentingB.style,
    ctx.locale,
  );
}

function buildConflictTrigger(ctx: MarriageRuleContext): string {
  const { risk } = ctx.masterScores;
  const sig = ctx.marriagePairAnalysis.scoringSignals;
  const day = ctx.marriagePairAnalysis.dayBranch;
  const locale = ctx.locale;

  if (sig.hasDayHourHomeTension && sig.hasWonjinOrGuimun) {
    return sanitizeHomeLifeText(
      pick(
        locale,
        `Emotions explode on days when childcare, chores, and money overlap. The closer you are, the more hurt feelings tangle, ` +
          `and one small tone of voice brings a cold war. Home risk ${risk}% — recovery can take more than a day.`,
        `육아·가사·돈이 겹치는 날 감정이 폭발합니다. 가까울수록 서운함이 꼬이고, ` +
          `작은 말투 하나로 냉전이 옵니다. 홈 리스크 ${risk}% — 회복하려면 하루 이상 걸릴 수 있어요.`,
      ),
    );
  }
  if (day.hasDayBranchChungHyung) {
    return sanitizeHomeLifeText(
      pick(
        locale,
        `When fatigue peaks, your personal rhythm differences collide head-on. Right after getting home from work and right before sleep are prime blow-up times. ` +
          `Don't start a heavy conversation then.`,
        `피로가 극에 달하면 사적인 리듬 차이가 정면 충돌합니다. 퇴근 직후·잠들기 전이 폭발 시간대예요. ` +
          `이때 무거운 대화를 시작하지 마세요.`,
      ),
    );
  }
  if (sig.hasGongmangOverlap) {
    return sanitizeHomeLifeText(
      pick(
        locale,
        `Emotional neglect comes from repeating just "it's fine." The other person swallows it alone until one day it all bursts out at once. ` +
          `Check in daily, even briefly, with "how are you feeling right now?"`,
        `'괜찮아'만 반복하는 정서적 방임이 옵니다. 상대는 혼자 삼키다가 어느 날 한꺼번에 터집니다. ` +
          `짧게라도 '지금 기분 어때?'를 매일 확인하세요.`,
      ),
    );
  }
  if (sig.hasWealthOfficerPowerStruggle) {
    return sanitizeHomeLifeText(
      pick(
        locale,
        "A money-and-power-struggle can easily escalate into a household war. Only one CFO should hold the bank account and big spending — if both of you hold it at once, you're guaranteed to fight.",
        "돈·주도권 싸움이 집안 전쟁으로 번지기 쉽습니다. 통장·큰 지출은 CFO 한 명만 — 둘이 동시에 쥐면 100% 싸웁니다.",
      ),
    );
  }
  return sanitizeHomeLifeText(
    pick(
      locale,
      "Bringing up roles, money, and childcare all at once sends friction soaring. Just one topic today. The rest, tomorrow.",
      "역할·돈·육아를 한 번에 꺼내면 마찰이 치솟습니다. 오늘은 하나만. 나머지는 내일.",
    ),
  );
}

export function buildHouseholdPartnershipReport(
  ctx: MarriageRuleContext,
): HouseholdPartnershipReport {
  const deEscalation = ctx.deEscalation;

  const matrix = buildBedroomMatrixSection({
    nicknameA: ctx.nicknameA,
    nicknameB: ctx.nicknameB,
    sajuJsonA: ctx.sajuJsonA,
    sajuJsonB: ctx.sajuJsonB,
    countsA: ctx.tenGod.countsA,
    countsB: ctx.tenGod.countsB,
    chartA: ctx.marriagePairAnalysis.chartA,
    chartB: ctx.marriagePairAnalysis.chartB,
    dayBranch: ctx.marriagePairAnalysis.dayBranch,
    locale: ctx.locale,
  });

  return {
    section_dna: {
      person_a: ctx.householdDnaA,
      person_b: ctx.householdDnaB,
    },
    section_origin_story: buildOriginStorySection(ctx),
    section_snapshot: {
      romantic_fit_pct: ctx.masterScores.activation,
      life_synergy_pct: ctx.masterScores.benefit,
      home_risk_pct: ctx.masterScores.risk,
      one_line_household: resolveHouseholdOneLiner(ctx),
    },
    section_weather_forecast: ctx.threeYearForecast,
    section_bedroom: {
      matrix,
      attachment_style: buildAttachmentNarrative(ctx),
      sleep_fit: ctx.sleepFit,
      rejection_script_a: resolveRejectionScript(ctx.tenGod.countsA, ctx.locale),
      rejection_script_b: resolveRejectionScript(ctx.tenGod.countsB, ctx.locale),
      rejection_axis_note: null,
    },
    section_money_chores: {
      cfo_nickname: ctx.tenGod.cfo.nickname,
      cfo_reason: sanitizeHomeLifeText(ctx.tenGod.cfo.reason),
      chores_guideline: buildChoresGuideline(ctx),
      spending_style_note: resolveSpendingStyleNote(
        ctx.tenGod.countsA,
        ctx.tenGod.countsB,
        ctx.nicknameA,
        ctx.nicknameB,
        ctx.locale,
      ),
      cfo_axis_note: null,
    },
    section_family_boundary: {
      inlaw_stress_summary: buildInlawStressSummary(ctx),
      person_a_boundary_note: buildPersonFamilyBoundaryNote(
        ctx.nicknameA,
        ctx.tenGod.boundaryA,
        ctx.tenGod.countsA,
        ctx.marriagePairAnalysis.chartA,
        ctx.locale,
      ),
      person_b_boundary_note: buildPersonFamilyBoundaryNote(
        ctx.nicknameB,
        ctx.tenGod.boundaryB,
        ctx.tenGod.countsB,
        ctx.marriagePairAnalysis.chartB,
        ctx.locale,
      ),
    },
    section_parenting: {
      combined_attitude: buildParentingCombined(ctx),
      person_a_style: formatParentingStyleLine(
        ctx.tenGod.parentingA.style,
        ctx.tenGod.parentingA.label,
        ctx.locale,
      ),
      person_b_style: formatParentingStyleLine(
        ctx.tenGod.parentingB.style,
        ctx.tenGod.parentingB.label,
        ctx.locale,
      ),
      harmony_tip: buildParentingHarmonyTip(ctx),
      person_a_role_note: null,
      person_b_role_note: null,
    },
    section_privacy: {
      person_a_private_line: buildPrivateBoundary(
        ctx.nicknameA,
        ctx.marriagePairAnalysis.chartA,
        ctx.tenGod.countsA,
        ctx.locale,
      ),
      person_b_private_line: buildPrivateBoundary(
        ctx.nicknameB,
        ctx.marriagePairAnalysis.chartB,
        ctx.tenGod.countsB,
        ctx.locale,
      ),
    },
    section_upset: {
      person_a: buildHomeUpsetResponseGuide(
        ctx.nicknameA,
        ctx.sajuJsonA,
        ctx.tenGod.countsA,
        ctx.locale,
      ),
      person_b: buildHomeUpsetResponseGuide(
        ctx.nicknameB,
        ctx.sajuJsonB,
        ctx.tenGod.countsB,
        ctx.locale,
      ),
    },
    section_warning: {
      conflict_communication: ctx.conflictCommunication,
      conflict_trigger: buildConflictTrigger(ctx),
      de_escalation: deEscalation,
      cold_war_protocol: resolveColdWarProtocol({
        nicknameA: ctx.nicknameA,
        nicknameB: ctx.nicknameB,
        countsA: ctx.tenGod.countsA,
        countsB: ctx.tenGod.countsB,
        locale: ctx.locale,
      }),
    },
  };
}
