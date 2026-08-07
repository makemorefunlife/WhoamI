import type { Locale } from "@/lib/i18n/locale";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import { pick, LEGACY_FALLBACK_LOCALE } from "@/lib/relationship/workColleague/workColleagueCopy";

/**
 * current_enriched 전용(Work) — 11축 psych 신호만 사용하는 4개 항목.
 * 사주(Pair CE)는 이 파일에서 절대 읽지 않는다(사용자 지정 "엄격한 분리 원칙").
 * 새 카드를 만들지 않고 기존 office.section_* 문자열 필드에 덧붙인다.
 */

/**
 * 항목 2 — 스트레스·마감·위기에서 어떤 사람이 되는가
 * (회복탄력성 resilience vs 자기통제 self_control만 사용).
 * 자기통제가 높은 쪽 = 입 닫고 혼자 파고드는 모드.
 * 회복탄력성이 낮은 쪽 = 예민해져서 날카로워지는 모드.
 */
export function buildCrisisModeLine(params: {
  psychA: PsychMasterJson | null | undefined;
  psychB: PsychMasterJson | null | undefined;
  nameA: string;
  nameB: string;
  locale?: Locale;
}): string | null {
  const { psychA, psychB, nameA, nameB } = params;
  if (!psychA || !psychB) return null;
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;

  const scA = psychA.secondary_axes.self_control;
  const scB = psychB.secondary_axes.self_control;
  const reA = psychA.secondary_axes.resilience;
  const reB = psychB.secondary_axes.resilience;
  const scGap = Math.abs(scA - scB);
  const reGap = Math.abs(reA - reB);
  if (scGap < 15 && reGap < 15) return null;

  const quietName = scA >= scB ? nameA : nameB;
  const sharpName = reA <= reB ? nameA : nameB;

  if (quietName === sharpName) {
    return pick(
      locale,
      `Right before a deadline, ${quietName} tends to go quiet and disappear into the work rather than talk it out — worth giving them room instead of pulling them into a group huddle.`,
      `마감 직전엔 ${quietName}이(가) 말수를 줄이고 혼자 일에 파고드는 편이에요 — 이럴 때는 억지로 다 같이 모이자고 하기보다 혼자 정리할 시간을 주는 게 나아요.`,
    );
  }

  return pick(
    locale,
    `When a real crisis hits right before a deadline, ${quietName} tends to go quiet and bury themselves in the work, while ${sharpName} gets edgier and starts calling out other people's mistakes more sharply than usual. Reading these as stress responses instead of attitude problems is what keeps the team from taking it personally.`,
    `마감 직전 진짜 위기가 터지면, ${quietName}은(는) 말을 줄이고 일에만 파고드는 반면, ${sharpName}은(는) 평소보다 예민해져서 주변 실수를 날카롭게 짚고 넘어가는 모드로 바뀌어요. 이걸 태도 문제가 아니라 각자의 스트레스 반응으로 읽어주는 게 팀 전체를 덜 다치게 해요.`,
  );
}

/**
 * 항목 3 — 같이 일하면 성장하는 부분
 * (사고방식 thinking_style ↔ 관계공감 empathy 대각 비교만 사용 — 두 축의
 * 우세자가 서로 다른 사람일 때만 성립. 격차가 약하거나 한 사람이 두 축을
 * 다 쥐면 억지 서사를 만들지 않고 null).
 */
export function buildMutualGrowthLine(params: {
  psychA: PsychMasterJson | null | undefined;
  psychB: PsychMasterJson | null | undefined;
  nameA: string;
  nameB: string;
  locale?: Locale;
}): string | null {
  const { psychA, psychB, nameA, nameB } = params;
  if (!psychA || !psychB) return null;
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;

  const thinkA = psychA.secondary_axes.thinking_style;
  const thinkB = psychB.secondary_axes.thinking_style;
  const empA = psychA.secondary_axes.empathy;
  const empB = psychB.secondary_axes.empathy;
  const thinkGap = Math.abs(thinkA - thinkB);
  const empGap = Math.abs(empA - empB);
  if (thinkGap < 12 || empGap < 12) return null;

  const analyticalIsA = thinkA > thinkB;
  const empathicIsA = empA > empB;
  if (analyticalIsA === empathicIsA) return null;

  const analyticalName = analyticalIsA ? nameA : nameB;
  const empathicName = analyticalIsA ? nameB : nameA;

  return pick(
    locale,
    `${empathicName} picks up ${analyticalName}'s habit of backing things up with data and clear logic, while ${analyticalName} picks up ${empathicName}'s knack for reading the room and keeping teammates steady. Work together long enough and each of you ends up covering the gap the other started with.`,
    `${empathicName}은(는) ${analyticalName} 옆에서 데이터와 근거로 논리를 다지는 습관을 배우고, ${analyticalName}은(는) ${empathicName} 옆에서 동료들 감정을 살피고 다독이는 감각을 배워요. 같이 오래 일할수록 서로 원래 약했던 지점을 상대가 자연스럽게 메워줘요.`,
  );
}

/**
 * 항목 5 — 디테일 vs 큰 그림 (분석사고 thinking_style 격차만 사용).
 * person_a_work_style / person_b_work_style 각각에 붙일 절을 따로 반환한다.
 */
export function buildDetailVsBigPictureClauses(params: {
  psychA: PsychMasterJson | null | undefined;
  psychB: PsychMasterJson | null | undefined;
  nameA: string;
  nameB: string;
  locale?: Locale;
}): { clauseA: string; clauseB: string } | null {
  const { psychA, psychB, nameA, nameB } = params;
  if (!psychA || !psychB) return null;
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;

  const thinkA = psychA.secondary_axes.thinking_style;
  const thinkB = psychB.secondary_axes.thinking_style;
  if (Math.abs(thinkA - thinkB) < 15) return null;

  const detailIsA = thinkA > thinkB;
  const detailClause = (name: string) =>
    pick(
      locale,
      `${name} is the one who catches the typo, the ₩1 rounding error — the detail owner.`,
      `${name}은(는) 오타 하나, 숫자 1원까지 잡아내는 디테일을 전담하는 편이에요.`,
    );
  const bigPictureClause = (name: string) =>
    pick(
      locale,
      `${name} is the one who makes sure the project doesn't wander off course — the big-picture owner.`,
      `${name}은(는) 프로젝트가 방향을 잃지 않게 큰 그림을 지키는 편이에요.`,
    );

  return {
    clauseA: detailIsA ? detailClause(nameA) : bigPictureClause(nameA),
    clauseB: detailIsA ? bigPictureClause(nameB) : detailClause(nameB),
  };
}

/**
 * 항목 6 — 혼자 생각 vs 같이 논의
 * (에너지방식 energy_style + 갈등직면성 conflict_style만 사용).
 */
export function buildSoloVsDiscussLine(params: {
  psychA: PsychMasterJson | null | undefined;
  psychB: PsychMasterJson | null | undefined;
  nameA: string;
  nameB: string;
  locale?: Locale;
}): string | null {
  const { psychA, psychB, nameA, nameB } = params;
  if (!psychA || !psychB) return null;
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;

  const enA = psychA.secondary_axes.energy_style;
  const enB = psychB.secondary_axes.energy_style;
  const enGap = Math.abs(enA - enB);
  if (enGap < 15) return null;

  const soloIsA = enA < enB;
  const soloName = soloIsA ? nameA : nameB;
  const discussName = soloIsA ? nameB : nameA;

  const base = pick(
    locale,
    `When a problem comes up, ${soloName} needs a beat alone to sort it out first, while ${discussName} wants to pull everyone up to the whiteboard right away.`,
    `문제가 생기면 ${soloName}은(는) 혼자 정리할 시간이 먼저 필요하고, ${discussName}은(는) 바로 화이트보드 앞으로 모이고 싶어 해요.`,
  );

  const conflictA = psychA.secondary_axes.conflict_style;
  const conflictB = psychB.secondary_axes.conflict_style;
  const conflictGap = Math.abs(conflictA - conflictB);
  const tail =
    conflictGap >= 15
      ? pick(
          locale,
          ` Add in how directly each of you likes to name a disagreement, and timing the conversation matters as much as having it.`,
          ` 게다가 이견을 직접 짚고 넘어가는 정도도 서로 달라서, 대화 자체보다 "언제" 하느냐가 더 중요해요.`,
        )
      : pick(
          locale,
          ` Simply asking "should we talk about this now, or after you've had a minute?" avoids a lot of friction.`,
          ` "지금 바로 얘기할까, 조금 있다 정리해서 얘기할까"만 먼저 물어봐도 마찰이 많이 줄어요.`,
        );

  return `${base}${tail}`;
}
