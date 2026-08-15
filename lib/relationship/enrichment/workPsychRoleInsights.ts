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

/**
 * 항목 10 (Chapter 3 보강 — 사용자 요청상 "회의실" 맥락, 리포트 구조상
 * 보고·소통 핏 카드에 안착) — 신중결정 격차는 리스크 한도 숫자화, 계획구조화
 * 격차는 보고 리듬 고정 일정화로 각각 분리해 조언한다. 둘 다 psych 전용.
 */
export function buildRiskAndRhythmLine(params: {
  psychA: PsychMasterJson | null | undefined;
  psychB: PsychMasterJson | null | undefined;
  locale?: Locale;
}): string | null {
  const { psychA, psychB } = params;
  if (!psychA || !psychB) return null;
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;

  const decisionGap = Math.abs(psychA.secondary_axes.decision_style - psychB.secondary_axes.decision_style);
  const structureGap = Math.abs(psychA.secondary_axes.structure - psychB.secondary_axes.structure);
  if (decisionGap < 15 && structureGap < 15) return null;

  const parts: string[] = [];
  if (decisionGap >= 15) {
    parts.push(
      pick(
        locale,
        "Since you weigh risk differently, put a rough number on how much risk each of you can live with before a decision — that alone stops a lot of back-and-forth.",
        "리스크를 받아들이는 정도가 서로 달라요 — 각자 감당할 수 있는 리스크 한도를 대략적인 숫자로 미리 정해두면 논쟁이 제자리를 도는 걸 막을 수 있어요.",
      ),
    );
  }
  if (structureGap >= 15) {
    parts.push(
      pick(
        locale,
        "Your reporting rhythms differ too, so make check-ins a fixed, recurring slot instead of leaving them ad hoc.",
        "보고·피드백 리듬도 서로 다른 편이니, 그때그때 챙기기보다 정기적인 체크인을 고정 일정으로 만들어두세요.",
      ),
    );
  }
  return parts.join(" ");
}

/**
 * 항목 7 — 불만이 쌓였을 때(갈등직면성 conflict_style 격차로 신호 분리,
 * 자기통제 self_control 격차로 대처법 톤 분리). 두 축 다 psych 전용.
 */
export function buildComplaintSignalLine(params: {
  psychA: PsychMasterJson | null | undefined;
  psychB: PsychMasterJson | null | undefined;
  nameA: string;
  nameB: string;
  locale?: Locale;
}): string | null {
  const { psychA, psychB, nameA, nameB } = params;
  if (!psychA || !psychB) return null;
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;

  const csA = psychA.secondary_axes.conflict_style;
  const csB = psychB.secondary_axes.conflict_style;
  const csGap = Math.abs(csA - csB);
  if (csGap < 15) return null;

  const directIsA = csA > csB;
  const directName = directIsA ? nameA : nameB;
  const quietName = directIsA ? nameB : nameA;

  const base = pick(
    locale,
    `When something's bothering them, ${directName} tends to get terser and cut straight to the point, while ${quietName} tends to go quiet and hold it in rather than name it.`,
    `불만이 쌓이면 ${directName}은(는) 평소보다 말이 짧아지고 핵심만 툭 던지는 쪽으로 티가 나고, ${quietName}은(는) 말수를 줄이며 조용히 입을 닫는 쪽으로 신호가 와요.`,
  );

  const scA = psychA.secondary_axes.self_control;
  const scB = psychB.secondary_axes.self_control;
  const scGap = Math.abs(scA - scB);
  const tail =
    scGap >= 15
      ? pick(
          locale,
          ` With ${directName}, a polite, direct check-in works best. With ${quietName}, skip the formal sit-down — a casual coffee break gets more out of them.`,
          ` ${directName}에게는 돌려 말하지 말고 정중하게 직접 물어보는 게 가장 잘 통하고, ${quietName}에게는 무겁게 면담 자리를 잡기보다 가벼운 커피 타임으로 슬쩍 풀어보는 게 더 효과적이에요.`,
        )
      : pick(
          locale,
          ` Either way, checking in early beats waiting for it to surface on its own.`,
          ` 어느 쪽이든, 스스로 터지길 기다리기보다 먼저 가볍게 물어봐 주는 게 나아요.`,
        );

  return `${base}${tail}`;
}

/**
 * Candidate 1 — Decision Partnership (결정 주도권 및 검증 분담)
 * Decision style + Practicality + Thinking style 결합.
 */
export function buildDecisionPartnershipLine(params: {
  psychA: PsychMasterJson | null | undefined;
  psychB: PsychMasterJson | null | undefined;
  nameA: string;
  nameB: string;
  locale?: Locale;
}): string | null {
  const { psychA, psychB, nameA, nameB } = params;
  if (!psychA || !psychB) return null;
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;

  const decA = psychA.secondary_axes.decision_style;
  const decB = psychB.secondary_axes.decision_style;
  const pracA = psychA.secondary_axes.practicality;
  const pracB = psychB.secondary_axes.practicality;

  const decGap = Math.abs(decA - decB);
  if (decGap < 12) return null;

  const pusher = decA >= decB ? nameA : nameB;
  const validator = decA < decB ? nameA : nameB;

  return pick(
    locale,
    `When making key decisions, ${pusher} sets the initial direction and momentum, while ${validator} reviews risks and validates data before final sign-off. Aligning this split prevents bottlenecking.`,
    `주요 결정을 내릴 때 ${pusher}은(는) 큰 방향과 속도를 제안하고, ${validator}은(는) 리스크와 근거 데이터를 사전 검증하여 최종 확정하는 구조가 가장 수월하게 작동합니다.`,
  );
}

/**
 * Candidate 2 — Ownership & Delegation (R&R 및 업무 위임 3개 영역)
 */
export function buildOwnershipDelegationLine(params: {
  psychA: PsychMasterJson | null | undefined;
  psychB: PsychMasterJson | null | undefined;
  nameA: string;
  nameB: string;
  locale?: Locale;
}): { keepWithMe: string; delegateToPartner: string; sharedCheckpoint: string } | null {
  const { psychA, psychB, nameA, nameB } = params;
  if (!psychA || !psychB) return null;
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;

  const strA = psychA.secondary_axes.structure;
  const strB = psychB.secondary_axes.structure;
  const empA = psychA.secondary_axes.empathy;
  const empB = psychB.secondary_axes.empathy;

  const execLeader = strA >= strB ? nameA : nameB;
  const commLeader = empA >= empB ? nameA : nameB;

  return {
    keepWithMe: pick(
      locale,
      `Tasks requiring high structure and process control are best led directly by ${execLeader}.`,
      `체계적인 일관성과 프로세스 관리가 중요한 업무는 ${execLeader}이(가) 직접 주도하는 것이 효과적입니다.`,
    ),
    delegateToPartner: pick(
      locale,
      `Tasks involving stakeholder coordination and team atmosphere management run smoother when delegated to ${commLeader}.`,
      `이해관계자 조율과 팀 분위기 케어가 필요한 업무는 ${commLeader}에게 위임할 때 실행력이 살아납니다.`,
    ),
    sharedCheckpoint: pick(
      locale,
      "Final delivery specs and risk thresholds should be reviewed together at shared checkpoints.",
      "최종 산출물의 퀄리티 스펙과 리스크 한도는 공동 게이트에서 함께 점검하는 것이 좋습니다.",
    ),
  };
}

/**
 * Candidate 3 — Crunch / Deadline Mode (마감·압박 상황에서의 pair 변화)
 */
export function buildCrunchDeadlineModeLine(params: {
  psychA: PsychMasterJson | null | undefined;
  psychB: PsychMasterJson | null | undefined;
  nameA: string;
  nameB: string;
  locale?: Locale;
}): string | null {
  const { psychA, psychB, nameA, nameB } = params;
  if (!psychA || !psychB) return null;
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;

  const resA = psychA.secondary_axes.resilience;
  const resB = psychB.secondary_axes.resilience;
  const scA = psychA.secondary_axes.self_control;
  const scB = psychB.secondary_axes.self_control;

  if (Math.abs(resA - resB) < 12 && Math.abs(scA - scB) < 12) return null;

  const steadyName = resA >= resB ? nameA : nameB;
  const sensitiveName = resA < resB ? nameA : nameB;

  return pick(
    locale,
    `Under heavy crunch pressure, ${sensitiveName} needs quick buffer time and clear priority cuts to avoid overload, while ${steadyName} holds the operational baseline steady.`,
    `마감 임박 압박이 높아지면 ${sensitiveName}은(는) 과부하 방지를 위한 우선순위 정리와 버퍼 시간이 필요하며, ${steadyName}이(가) 기준점을 지켜줄 때 균형이 유지됩니다.`,
  );
}

/**
 * Candidate 4 — Recognition, Credit & Visibility (성과 노출 및 공로 배분)
 * Allowed claim: Acknowledgement preference, deck authorship lines.
 * Forbidden claim: No toxic claims of "stealing credit" or inferring public speaking ability.
 */
export function buildRecognitionCreditVisibilityLine(params: {
  psychA: PsychMasterJson | null | undefined;
  psychB: PsychMasterJson | null | undefined;
  nameA: string;
  nameB: string;
  locale?: Locale;
}): string | null {
  const { psychA, psychB, nameA, nameB } = params;
  if (!psychA || !psychB) return null;
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;

  const recA = psychA.secondary_axes.recognition;
  const recB = psychB.secondary_axes.recognition;
  const recGap = Math.abs(recA - recB);
  if (recGap < 15) return null;

  const highCreditName = recA >= recB ? nameA : nameB;

  return pick(
    locale,
    `${highCreditName} values explicit acknowledgment of contribution — clarifying deck authorship lines upfront ensures smooth credit attribution.`,
    `${highCreditName}님은 성과에 대한 명확한 인정과 공로 표시를 중시합니다. 작성자 명의와 기여도를 사전에 명시해두면 협업 피로가 크게 줄어듭니다.`,
  );
}

/**
 * Candidate 5 — Office Distance & Boundary (소셜 배터리 및 집중 시간 경계)
 * Evaluates energy_style (social battery) and self_control (focus privacy) independently (no direct averaging).
 */
export function buildOfficeDistanceBoundaryLine(params: {
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
  const scA = psychA.secondary_axes.self_control;
  const scB = psychB.secondary_axes.self_control;

  const enGap = Math.abs(enA - enB);
  const scGap = Math.abs(scA - scB);

  if (enGap < 15 && scGap < 15) return null;

  const privateName = scA >= scB || enA <= enB ? nameA : nameB;
  const socialName = privateName === nameA ? nameB : nameA;

  return pick(
    locale,
    `${privateName} prefers clear focus time boundaries and low-friction async messages, while ${socialName} recharges through casual check-ins. Keeping break times flexible suits both best.`,
    `${privateName}은(는) 몰입을 위한 집중 시간과 비동기 메시지 리듬을 선호하고, ${socialName}은(는) 수시 소통을 편하게 여깁니다. 쉬는 시간과 커뮤니케이션 채널에 유연한 경계를 두는 것이 좋습니다.`,
  );
}
