import type { WorkColleagueContext } from "./buildWorkColleagueContext";
import {
  buildOfficeDnaProfile,
  buildIdealRoleFit,
  buildOfficeMeetingSummary,
  buildPairIdealRoleCombo,
  buildUpsetResponseGuide,
  pickDeEscalationCard,
  resolveWorkColleagueStylePhrase,
  sanitizeOfficeText,
  type DeEscalationCard,
  type OfficeDnaProfile,
  type OfficeIdealRoleFit,
  type OfficeUpsetGuide,
} from "./officeLanguage";
import { CATEGORY_OFFICE_LABEL } from "./tenGodComplement";
import { pick } from "./workColleagueCopy";
import type { Locale } from "@/lib/i18n/locale";
import { buildWorkSajuCompareTable, type WorkCompareRow } from "./sajuCompareTable";

export type OfficeDnaSection = {
  person_a: OfficeDnaProfile & { nickname: string };
  person_b: OfficeDnaProfile & { nickname: string };
};

export type OfficeSnapshotSection = {
  fit_pct: number;
  synergy_pct: number;
  risk_pct: number;
  one_line_definition: string;
};

export type OfficeMixFitSection = {
  person_a_work_style: string;
  person_b_work_style: string;
  communication_fit: string;
};

export type OfficeRespectSection = {
  person_a_boundary: string;
  person_b_boundary: string;
};

export type OfficePersonRoleCard = {
  nickname: string;
  weapons: string[];
  /** 이 사람이 파트너에게 넘기면 좋은 업무 */
  handoff_tasks: Array<{
    task_label: string;
    handoff_to: string;
    reason: string;
  }>;
};

export type OfficeRoleSection = {
  person_a: OfficePersonRoleCard;
  person_b: OfficePersonRoleCard;
  synergy_one_liner: string;
};

export type OfficeWarningSection = {
  conflict_trigger: string;
  de_escalation: DeEscalationCard;
};

export type OfficeUpsetSection = {
  person_a: OfficeUpsetGuide;
  person_b: OfficeUpsetGuide;
};

export type OfficeIdealRolesSection = {
  person_a: OfficeIdealRoleFit;
  person_b: OfficeIdealRoleFit;
  together_combo: string;
};

export type OfficePartnershipReport = {
  section_dna: OfficeDnaSection;
  section_snapshot: OfficeSnapshotSection;
  section_mix_fit: OfficeMixFitSection;
  section_respect: OfficeRespectSection;
  section_roles: OfficeRoleSection;
  section_upset: OfficeUpsetSection;
  section_ideal_roles: OfficeIdealRolesSection;
  section_warning: OfficeWarningSection;
  /**
   * "한눈에 비교" 표 — 팀 회의에서 확정한 6개 사주 기반 비교축 (sajuCompareTable.ts).
   * optional인 이유: 오늘 이전에 생성·캐시된 리포트(DB `result_premium_by_kind`)에는
   * 이 필드가 없다 — 값이 없을 때 가짜 데이터를 채우지 않고 섹션을 생략한다는
   * 기존 원칙(레거시 payload 방어)을 그대로 따른다.
   */
  section_compare_table?: WorkCompareRow[];
};

const CATEGORY_WEAPONS: Record<Locale, Record<string, string[]>> = {
  "en-US": {
    재성: ["Budget & revenue control", "Sales & business development", "Wrapping up operational results"],
    관성: ["Project oversight", "Schedule & quality management", "External coordination"],
    식상: ["Planning & brainstorming", "Content & presentations", "Improvement proposals"],
    인성: ["Research & analysis", "Documentation & training", "Back-office support"],
    비겁: ["Field execution", "Team building", "Coordinating with coworkers"],
  },
  "ko-KR": {
    재성: ["예산·수익 콘트롤", "영업·사업 개발", "실무 성과 정리"],
    관성: ["프로젝트 총괄", "일정·품질 관리", "대외 조율"],
    식상: ["기획·브레인스토밍", "콘텐츠·발표", "개선 제안"],
    인성: ["리서치·분석", "문서·교육", "백오피스 지원"],
    비겁: ["현장 실행", "팀 빌딩", "동료 조율"],
  },
};

/**
 * `dnaA`/`dnaB`는 호출부(buildOfficePartnershipReport)가 이미 계산해 둔
 * OfficeDnaProfile을 받는다 — 예전에는 이 함수 안에서 `buildOfficeDnaProfile`을
 * A/B 각각 한 번씩 더 호출해 캐릭터 타입 전체를 다시 계산하고 타이틀 한 글자만
 * 뽑아 썼다(겹친 분석). 이 함수와 `buildMyBoundary` 둘 다 같은 값을 재계산하고
 * 있었어서, 사람당 DNA 프로필이 리포트 1건당 3번씩 계산되던 걸 1번으로 줄였다.
 */
function resolveOneLineDefinition(
  ctx: WorkColleagueContext,
  dnaA: OfficeDnaProfile,
  dnaB: OfficeDnaProfile,
): string {
  const { activation, benefit, risk } = ctx.masterScores;
  const titleA = dnaA.character_title.split(" · ")[0] ?? pick(ctx.locale, "an executor", "실행형");
  const titleB = dnaB.character_title.split(" · ")[0] ?? pick(ctx.locale, "a supporter", "지원형");

  if (benefit >= 70 && risk < 40) {
    return pick(
      ctx.locale,
      `${titleA} and ${titleB} — a golden combo where the gears mesh perfectly`,
      `${titleA}와 ${titleB} — 톱니바퀴가 맞물리는 황금 조합`,
    );
  }
  if (activation >= 65 && risk >= 55) {
    return pick(
      ctx.locale,
      `${titleA} and ${titleB} — a nail-biting but results-driven partnership`,
      `${titleA}와 ${titleB} — 아슬아슬하지만 결과는 나오는 긴장의 파트너십`,
    );
  }
  if (risk >= 60) {
    return pick(
      ctx.locale,
      `${titleA} and ${titleB} — split the roles and it's a hit, mix them and it blows up`,
      `${titleA}와 ${titleB} — 역할만 나누면 대박, 섞으면 폭발`,
    );
  }
  return pick(
    ctx.locale,
    `${titleA} and ${titleB} — a complementary combo that fills the team with different weapons`,
    `${titleA}와 ${titleB} — 서로 다른 무기로 팀을 채우는 보완 조합`,
  );
}

function buildCommunicationFitWitty(ctx: WorkColleagueContext): string {
  const fit = ctx.masterScores.activation;
  const meetingNote = buildOfficeMeetingSummary(
    ctx.workPairAnalysis.stemCommunication,
    ctx.locale,
  );

  if (fit >= 75) {
    return sanitizeOfficeText(
      pick(ctx.locale, `Directions align well in the meeting room. ${meetingNote}`, `회의실에서 방향이 잘 맞는 편이에요. ${meetingNote}`),
    );
  }
  if (fit >= 55) {
    return sanitizeOfficeText(
      pick(ctx.locale, `Get the agenda sorted and you'll click pretty well. ${meetingNote}`, `안건만 정리하면 꽤 잘 맞아요. ${meetingNote}`),
    );
  }
  return sanitizeOfficeText(
    pick(ctx.locale, `Your meeting styles are quite different. ${meetingNote}`, `회의 스타일이 꽤 달라요. ${meetingNote}`),
  );
}

function buildMyWeapons(ctx: WorkColleagueContext, who: "a" | "b"): string[] {
  const strong =
    who === "a"
      ? ctx.tenGodComplement.personA.strong
      : ctx.tenGodComplement.personB.strong;
  const weapons: string[] = [];
  for (const cat of strong.slice(0, 2)) {
    weapons.push(...(CATEGORY_WEAPONS[ctx.locale][cat] ?? []).slice(0, 2));
  }
  if (!weapons.length) {
    weapons.push(...pick(ctx.locale, ["Collaboration & execution", "Team coordination"], ["협업·실행", "팀 조율"]));
  }
  return [...new Set(weapons)].slice(0, 4);
}

function buildPersonRoleCard(
  ctx: WorkColleagueContext,
  who: "a" | "b",
): OfficePersonRoleCard {
  const nickname = who === "a" ? ctx.nicknameA : ctx.nicknameB;
  const weapons = buildMyWeapons(ctx, who);
  const handoff_tasks = ctx.tenGodComplement.items
    .filter((item) => item.receiverNickname === nickname)
    .map((item) => ({
      task_label: item.roles[0] ?? item.delegateText,
      handoff_to: item.giverNickname,
      reason: sanitizeOfficeText(
        pick(
          ctx.locale,
          `${item.giverNickname} has strength in ${CATEGORY_OFFICE_LABEL[ctx.locale][item.category]}. Leave the ${item.roles[0] ?? item.delegateText} side to ${item.giverNickname}.`,
          `${item.giverNickname}에게 ${CATEGORY_OFFICE_LABEL[ctx.locale][item.category]} 역량이 있어요. ${item.roles[0] ?? item.delegateText} 쪽은 ${item.giverNickname}에게 맡기세요.`,
        ),
      ),
    }));

  return { nickname, weapons, handoff_tasks };
}

function buildSynergyOneLiner(ctx: WorkColleagueContext): string {
  const n = ctx.tenGodComplement.items.length;
  if (n >= 2) {
    return sanitizeOfficeText(
      pick(
        ctx.locale,
        `You two have different business weapons. If ${ctx.nicknameA} takes ${buildMyWeapons(ctx, "a").join(" · ")} and ${ctx.nicknameB} takes ${buildMyWeapons(ctx, "b").join(" · ")}, the gears turn smoothly.`,
        `두 사람은 서로 다른 비즈니스 무기를 갖고 있어요. ${ctx.nicknameA}는 ${buildMyWeapons(ctx, "a").join("·")} 쪽, ${ctx.nicknameB}는 ${buildMyWeapons(ctx, "b").join("·")} 쪽으로 나누면 톱니바퀴가 돌아갑니다.`,
      ),
    );
  }
  return sanitizeOfficeText(
    pick(
      ctx.locale,
      `Not a perfect complement, but with work fit at ${ctx.masterScores.activation}% and synergy at ${ctx.masterScores.benefit}%, clarifying roles alone is enough to run smoothly.`,
      `완벽한 보완은 아니지만, 업무적 핏 ${ctx.masterScores.activation}% · 시너지 ${ctx.masterScores.benefit}%로 역할만 명확히 하면 충분히 잘 굴러갑니다.`,
    ),
  );
}

function buildConflictTrigger(ctx: WorkColleagueContext): string {
  const month = ctx.workPairAnalysis.monthBranch;
  const risk = ctx.masterScores.risk;

  if (month.directMonthCross?.type === "충") {
    return sanitizeOfficeText(
      pick(
        ctx.locale,
        `When project rhythm and ways of adapting to the org clash head-on — especially in meetings where schedule and priorities must be settled at once, tension can easily boil over. (Office risk ${risk}%)`,
        `프로젝트 리듬·조직 적응 방식이 정면으로 부딪힐 때 — 특히 일정·우선순위를 한 번에 정해야 하는 회의에서 긴장이 폭발하기 쉽습니다. (오피스 리스크 ${risk}%)`,
      ),
    );
  }
  if (ctx.workPairAnalysis.scoringSignals.hasWonjinOrGuimun) {
    return sanitizeOfficeText(
      pick(
        ctx.locale,
        "There's a pattern of misunderstanding building up the closer you get. Things can look fine on the surface, but once hurt feelings pile up underneath, it can suddenly turn cold or the tone can sharpen.",
        "가까워질수록 오해가 쌓이는 패턴이 있어요. 겉으로는 멀쩡한데 속으로 서운함이 쌓이면, 갑자기 냉각되거나 톤이 세져집니다.",
      ),
    );
  }
  const stemTension = ctx.workPairAnalysis.stemCommunication.stemPairs.find(
    (p) => p.type === "천간충" || p.type === "상극",
  );
  if (stemTension) {
    return sanitizeOfficeText(
      pick(
        ctx.locale,
        "When opinions collide head-on in a meeting — one side wants a fast conclusion, the other wants careful review, so it can easily escalate into a standoff.",
        "회의에서 의견이 정면 충돌할 때 — 한쪽은 빠른 결론, 다른 쪽은 신중한 검토를 원해서 '태클 대 태클'로 번지기 쉽습니다.",
      ),
    );
  }
  return sanitizeOfficeText(
    pick(
      ctx.locale,
      "Friction rises when role and responsibility boundaries get unclear, or when you both reach into the same area (planning, execution, management).",
      "역할·책임 경계가 불분명해질 때, 또는 둘 다 같은 영역(기획·실행·관리)에 손대려 할 때 마찰이 올라갑니다.",
    ),
  );
}

function buildMyBoundary(
  ctx: WorkColleagueContext,
  who: "a" | "b",
  dna: OfficeDnaProfile,
): string {
  const nickname = who === "a" ? ctx.nicknameA : ctx.nicknameB;
  const strength = who === "a" ? ctx.strengthA : ctx.strengthB;

  const lines = [
    pick(
      ctx.locale,
      `Don't publicly dump blame onto ${nickname}, or push for speed without respect.`,
      `${nickname}에게 공개적으로 책임을 떠넘기거나, 존중 없이 속도만 강요하지 마세요.`,
    ),
    dna.inner_standard,
  ];
  if (strength.label.includes("신강")) {
    lines.push(
      pick(
        ctx.locale,
        "If they feel their authority or process is being ignored, they switch straight into defense mode.",
        "결정권·프로세스를 무시당한다고 느끼면 바로 방어 모드로 전환됩니다.",
      ),
    );
  }
  return sanitizeOfficeText(lines.join(" "));
}

export function buildOfficePartnershipReport(
  ctx: WorkColleagueContext,
): OfficePartnershipReport {
  const dnaA = buildOfficeDnaProfile(ctx.sajuJsonA, ctx.tenGodsA, ctx.locale, ctx.workSignalsA);
  const dnaB = buildOfficeDnaProfile(ctx.sajuJsonB, ctx.tenGodsB, ctx.locale, ctx.workSignalsB);

  const deEscalation = pickDeEscalationCard(
    ctx.tenGodsA,
    ctx.tenGodsB,
    ctx.workPairAnalysis.chartA,
    ctx.workPairAnalysis.chartB,
    ctx.locale,
    ctx.workSignalsA,
    ctx.workSignalsB,
  );

  const workStyleA = sanitizeOfficeText(
    `${ctx.nicknameA} — ${resolveWorkColleagueStylePhrase(ctx.sajuJsonA, ctx.tenGodsA, ctx.locale, ctx.workSignalsA)}`,
  );
  const workStyleB = sanitizeOfficeText(
    `${ctx.nicknameB} — ${resolveWorkColleagueStylePhrase(ctx.sajuJsonB, ctx.tenGodsB, ctx.locale, ctx.workSignalsB)}`,
  );

  const idealA = buildIdealRoleFit(
    ctx.nicknameA,
    ctx.sajuJsonA,
    ctx.tenGodsA,
    ctx.locale,
    ctx.workSignalsA,
  );
  const idealB = buildIdealRoleFit(
    ctx.nicknameB,
    ctx.sajuJsonB,
    ctx.tenGodsB,
    ctx.locale,
    ctx.workSignalsB,
  );

  return {
    section_dna: {
      person_a: { nickname: ctx.nicknameA, ...dnaA },
      person_b: { nickname: ctx.nicknameB, ...dnaB },
    },
    section_snapshot: {
      fit_pct: ctx.masterScores.activation,
      synergy_pct: ctx.masterScores.benefit,
      risk_pct: ctx.masterScores.risk,
      one_line_definition: resolveOneLineDefinition(ctx, dnaA, dnaB),
    },
    section_mix_fit: {
      person_a_work_style: workStyleA,
      person_b_work_style: workStyleB,
      communication_fit: buildCommunicationFitWitty(ctx),
    },
    section_respect: {
      person_a_boundary: buildMyBoundary(ctx, "a", dnaA),
      person_b_boundary: buildMyBoundary(ctx, "b", dnaB),
    },
    section_roles: {
      person_a: buildPersonRoleCard(ctx, "a"),
      person_b: buildPersonRoleCard(ctx, "b"),
      synergy_one_liner: buildSynergyOneLiner(ctx),
    },
    section_upset: {
      person_a: buildUpsetResponseGuide(
        ctx.nicknameA,
        ctx.sajuJsonA,
        ctx.tenGodsA,
        ctx.locale,
        ctx.workSignalsA,
      ),
      person_b: buildUpsetResponseGuide(
        ctx.nicknameB,
        ctx.sajuJsonB,
        ctx.tenGodsB,
        ctx.locale,
        ctx.workSignalsB,
      ),
    },
    section_ideal_roles: {
      person_a: idealA,
      person_b: idealB,
      together_combo: buildPairIdealRoleCombo(
        ctx.nicknameA,
        ctx.nicknameB,
        idealA,
        idealB,
        ctx.locale,
      ),
    },
    section_warning: {
      conflict_trigger: buildConflictTrigger(ctx),
      de_escalation: deEscalation,
    },
    section_compare_table: buildWorkSajuCompareTable(ctx),
  };
}
