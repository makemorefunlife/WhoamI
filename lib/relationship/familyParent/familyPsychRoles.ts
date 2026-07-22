/**
 * Part3 "무의식 & 시너지 역학" — 6대 심리 역할(해결사/중재자/희생자/독립자/
 * 감정쓰레기통/강아지) 진단. 이 리포에 이 6분류 시스템 자체가 없었음(confirmed
 * via 전체 grep) — 스펙 JSON 예시(family_role_parent: "mediator",
 * family_role_child: "puppy_moodmaker")가 전제하는 신규 기능. 부모 렌즈(Track A)
 * 전용 — "가족 내 아이의 심리적 역할은?"에 대한 답이라 자녀 쪽 11축만 쓴다.
 * 사주 희용신은 스펙이 부차 소스로만 언급하고 이 도메인엔 배선 경로가 없어서
 * (친구 도메인과 동일한 사정) 이번 배치에서 보류 — 11축 5개 축으로만 판정.
 */
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { SecondaryAxesScores } from "@/lib/v2/survey/types";
import { LEGACY_FALLBACK_LOCALE } from "./familyParentCopy";
import { sanitizeFamilyParentText } from "./familyParentLanguage";
import type { Locale } from "@/lib/i18n/locale";

export type FamilyPsychRole =
  | "fixer"
  | "mediator"
  | "martyr"
  | "independent"
  | "emotional_dump"
  | "puppy";

/**
 * 스펙이 정확한 축→역할 매핑 공식을 안 줘서 직접 설계 — 역할명 자체는 스펙
 * 문구를 그대로 쓰고, 가중치는 각 역할의 심리적 의미에 맞춰 판단했다.
 * 점수는 전부 0~100 스케일로 평균 내서 6개 역할 간 비교가 공정하도록 함.
 */
export function resolveFamilyPsychRole(axes: SecondaryAxesScores): FamilyPsychRole {
  const scores: Record<FamilyPsychRole, number> = {
    fixer: (axes.conflict_style + axes.resilience) / 2,
    mediator: (axes.empathy + axes.conflict_style * 0.5) / 1.5,
    martyr: (axes.recognition + (100 - axes.resilience)) / 2,
    independent: (100 - axes.energy_style + (100 - axes.conflict_style)) / 2,
    emotional_dump:
      (axes.empathy + (100 - axes.recognition) + (100 - axes.resilience)) / 3,
    puppy: (axes.energy_style + axes.recognition) / 2,
  };

  return (Object.entries(scores) as [FamilyPsychRole, number][]).reduce(
    (best, curr) => (curr[1] > best[1] ? curr : best),
  )[0];
}

const ROLE_LABEL: Record<Locale, Record<FamilyPsychRole, string>> = {
  "en-US": {
    fixer: "🧩 The Fixer",
    mediator: "🕊️ The Mediator",
    martyr: "🌧️ The Quiet Giver",
    independent: "🧭 The Independent One",
    emotional_dump: "🎈 The Emotional Sponge",
    puppy: "🐶 The Mood-Lifter",
  },
  "ko-KR": {
    fixer: "🧩 문제 해결사",
    mediator: "🕊️ 중재자",
    martyr: "🌧️ 조용히 참는 아이",
    independent: "🧭 독립자",
    emotional_dump: "🎈 감정을 받아주는 아이",
    puppy: "🐶 분위기 메이커 강아지",
  },
};

const ROLE_DESCRIPTION: Record<Locale, Record<FamilyPsychRole, (nickname: string) => string>> = {
  "en-US": {
    fixer: (n) =>
      `${n} tends to step in and fix things the moment something goes wrong at home. It's a real strength, but ${n} doesn't always need to carry the solution alone — let them see you handle a problem sometimes too.`,
    mediator: (n) =>
      `${n} naturally reads the room and smooths things over between family members. Thank ${n} directly for keeping the peace — otherwise the effort goes unnoticed.`,
    martyr: (n) =>
      `${n} tends to put their own feelings last to take care of the family first. Check in on ${n}'s own feelings first, before asking what's needed — recognition matters more than it looks.`,
    independent: (n) =>
      `${n} handles things alone rather than leaning on the family. That's a strength, but make sure ${n} knows it's okay to ask for help too — don't let independence turn into distance.`,
    emotional_dump: (n) =>
      `${n} quietly absorbs everyone else's emotions without much credit in return. Ask ${n} directly "how are you doing?" — not just when something's wrong at home.`,
    puppy: (n) =>
      `${n} lights up the mood at home and seeks approval through cheerfulness. Praise ${n} for who they are, not just for keeping things fun — so the brightness doesn't become a performance.`,
  },
  "ko-KR": {
    fixer: (n) =>
      `${n}은(는) 집에서 문제가 생기면 먼저 나서서 해결하려는 편이에요. 큰 강점이지만, 항상 혼자 짊어질 필요는 없다는 걸 알려주세요 — 가끔은 부모가 해결하는 모습도 보여주세요.`,
    mediator: (n) =>
      `${n}은(는) 가족 사이에서 분위기를 살피고 갈등을 조율하는 역할을 자연스럽게 맡아요. 그 노력을 직접 고맙다고 말해주세요 — 안 그러면 티 안 나게 지나가기 쉬워요.`,
    martyr: (n) =>
      `${n}은(는) 자기 마음은 뒤로 하고 가족을 먼저 챙기려 애쓰는 편이에요. 무언가 부탁하기 전에 "너는 요즘 어때?"부터 먼저 물어봐 주세요 — 겉보기보다 인정받고 싶은 마음이 커요.`,
    independent: (n) =>
      `${n}은(는) 가족에게 기대기보다 혼자 해결하려는 편이에요. 좋은 힘이지만, 도움을 청해도 괜찮다는 걸 느끼게 해주세요 — 독립이 거리감이 되지 않도록요.`,
    emotional_dump: (n) =>
      `${n}은(는) 다른 가족의 감정을 조용히 받아주다 정작 자기 마음은 못 챙기기 쉬워요. 집안일이 있을 때만이 아니라, 그냥 "요즘 마음은 어때?"라고 물어봐 주세요.`,
    puppy: (n) =>
      `${n}은(는) 집안 분위기를 밝게 띄우며 인정받고 싶어하는 편이에요. 분위기를 띄울 때만이 아니라 존재 자체를 칭찬해 주세요 — 밝음이 노력이 되지 않도록요.`,
  },
};

/**
 * Track B(자녀 시선) — 자녀 본인에게 말하는 자기진단 톤. 부모에게 "~해
 * 주세요"라고 지시하는 대신, 자녀 자신을 위한 자기이해+자기돌봄 문구로
 * 재서술한다. 역할 판정(resolveFamilyPsychRole) 자체는 트랙 불문 동일 —
 * 절대 안 건드림.
 */
const ROLE_DESCRIPTION_SELF: Record<Locale, Record<FamilyPsychRole, (nickname: string) => string>> = {
  "en-US": {
    fixer: (n) =>
      `You tend to step in and fix things the moment something goes wrong at home. It's a real strength — but you don't always have to carry the solution alone. It's okay to let others handle a problem sometimes too.`,
    mediator: (n) =>
      `You naturally read the room and smooth things over between family members. That effort deserves real credit, even if no one says it out loud — you don't have to keep the peace all by yourself.`,
    martyr: (n) =>
      `You tend to put your own feelings last to take care of the family first. Before jumping in to help, it's worth checking in with yourself first — how are you doing, really? You deserve recognition too.`,
    independent: (n) =>
      `You handle things alone rather than leaning on the family. That's a real strength — but it's okay to ask for help too. Independence doesn't have to turn into distance.`,
    emotional_dump: (n) =>
      `You quietly absorb everyone else's emotions without much credit in return. It's okay to ask yourself "how am I doing?" — not just when something's wrong at home.`,
    puppy: (n) =>
      `You light up the mood at home and often seek approval through cheerfulness. You're worth appreciating for who you are, not just for keeping things fun — the brightness doesn't have to be a performance.`,
  },
  "ko-KR": {
    fixer: (n) =>
      `당신은 집에서 문제가 생기면 먼저 나서서 해결하려는 편이에요. 큰 강점이지만, 항상 혼자 짊어질 필요는 없어요 — 가끔은 다른 사람이 해결하게 둬도 괜찮습니다.`,
    mediator: (n) =>
      `당신은 가족 사이에서 분위기를 살피고 갈등을 조율하는 역할을 자연스럽게 맡아 왔어요. 아무도 몰라줘도 그 노력은 분명 가치 있어요 — 평화를 지키는 일을 혼자 다 떠안지 않아도 됩니다.`,
    martyr: (n) =>
      `당신은 자기 마음은 뒤로 하고 가족을 먼저 챙기려 애써 온 편이에요. 누군가를 돕기 전에 "나는 요즘 어떤지" 먼저 물어봐 주세요 — 당신도 인정받아 마땅한 사람이에요.`,
    independent: (n) =>
      `당신은 가족에게 기대기보다 혼자 해결하려는 편이에요. 좋은 힘이지만, 도움을 청해도 괜찮아요 — 독립이 거리감이 될 필요는 없습니다.`,
    emotional_dump: (n) =>
      `당신은 다른 가족의 감정을 조용히 받아주다 정작 자기 마음은 못 챙기기 쉬워요. 집안일이 있을 때만이 아니라, 스스로에게 "요즘 마음은 어때?"라고 물어봐 주세요.`,
    puppy: (n) =>
      `당신은 집안 분위기를 밝게 띄우며 인정받고 싶어하는 편이에요. 분위기를 띄울 때만이 아니라 존재 자체로 충분히 소중해요 — 밝음이 노력이 되지 않아도 괜찮습니다.`,
  },
};

export type FamilyRoleSection = {
  child_role: FamilyPsychRole;
  role_label: string;
  role_description: string;
};

/**
 * psych(설문) 없으면 null — 설문 미완료 안전 처리.
 * childIsViewer=true(Track B)면 자녀 본인向 자기진단 톤, 기본(false, Track A)은
 * 부모向 3인칭 설명 톤. 역할 판정 자체는 트랙 무관 동일.
 */
export function buildFamilyRoleSection(
  psychChild: PsychMasterJson | null | undefined,
  childNickname: string,
  locale: Locale = LEGACY_FALLBACK_LOCALE,
  childIsViewer = false,
): FamilyRoleSection | null {
  const axes = psychChild?.secondary_axes;
  if (!axes) return null;

  const role = resolveFamilyPsychRole(axes);
  const descriptionMap = childIsViewer ? ROLE_DESCRIPTION_SELF : ROLE_DESCRIPTION;
  return {
    child_role: role,
    role_label: ROLE_LABEL[locale][role],
    role_description: sanitizeFamilyParentText(
      descriptionMap[locale][role](childNickname),
    ),
  };
}
