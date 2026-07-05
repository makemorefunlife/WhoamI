import type { TenGodCounts } from "./familyParentTenGodAnalysis";
import type { FamilyParentRole } from "./types";

export type ChildDeEscalationCard = {
  hashtag: string;
  color: "red" | "yellow" | "orange" | "blue" | "green";
  archetype_label: string;
  psych_state: string;
  avoid_actions: string;
  solution_script: string;
};

type PrescriptionDef = {
  hashtag: string;
  color: ChildDeEscalationCard["color"];
  archetype_label: string;
  category: "self" | "food" | "seal" | "officer" | "wealth";
  psych_state: (child: string, parent: string) => string;
  avoid_actions: (child: string, parent: string) => string;
  solution_script: (child: string, parent: string, role: string) => string;
};

const CHILD_DE_ESCALATION: PrescriptionDef[] = [
  {
    hashtag: "#우쭈쭈_자존심이생명",
    color: "red",
    archetype_label: "자존심·존재감 민감형",
    category: "self",
    psych_state: (child) =>
      `${child}는 "날 무시한다"는 느낌이 들면 이성적인 대화가 불가능해져요. 잘잘못을 따지는 순간 방어벽을 높입니다.`,
    avoid_actions: (child, parent) =>
      `【${parent} → ${child}】 "너 때문에…"라며 책임 전가, 형제와 비교, ${child}의 노력을 가볍게 치부하기.`,
    solution_script: (child, parent, role) =>
      `【${parent}(${role}) → ${child}】 "${child}, 네가 얼마나 소중한지 내가 다 알아. 아까 내 말이 상처였다면 정말 미안해. 네 자존심은 지켜줄게." — 존재 가치를 먼저 인정한 뒤, 규칙 이야기는 내일로 미루세요.`,
  },
  {
    hashtag: "#바람쐬고_기분전환",
    color: "yellow",
    archetype_label: "즉각 표출·기분전환형",
    category: "food",
    psych_state: (child) =>
      `${child}는 화가 올라오면 바로 표출하는 타입이에요. 뒤끝은 길지 않지만, 무거운 분위기가 길어질수록 더 지쳐요.`,
    avoid_actions: (child, parent) =>
      `【${parent} → ${child}】 며칠간 냉전, 정색하고 긴 설교, ${child}가 기분 풀려 하면 "아직 화났어?"라며 몰아붙이기.`,
    solution_script: (child, parent, role) =>
      `【${parent}(${role}) → ${child}】 "우리 둘 다 꿀꿀한데 잠깐 산책 갈까?", "좋아하는 간식 먹으면서 풀자." — 진지한 사과보다 분위기 전환이 먼저예요.`,
  },
  {
    hashtag: "#혼자만의_동굴시간",
    color: "orange",
    archetype_label: "침묵·동굴 회복형",
    category: "seal",
    psych_state: (child) =>
      `${child}는 갈등 직후 뇌 과부하 상태가 돼요. 즉시 대화를 요구하면 폭발하거나 완전히 문을 닫아버립니다.`,
    avoid_actions: (child, parent) =>
      `【${parent} → ${child}】 "말 안 하면 어떻게 알아? 지금 당장 대화해!"라며 쫓아가기, 방문 두드리기.`,
    solution_script: (child, parent, role) =>
      `【${parent}(${role}) → ${child}】 (문자·메모) "${child}, 화난 마음 이해해. 생각 정리될 때까지 기다릴게. 준비되면 말해 줘." — 최소 2~3시간은 쫓지 마세요.`,
  },
  {
    hashtag: "#대놓고이야기해야풀린다",
    color: "blue",
    archetype_label: "규칙·명확한 대화형",
    category: "officer",
    psych_state: (child) =>
      `${child}는 "그냥 미안해"만으로는 풀리지 않아요. 무엇이 문제였는지, 앞으로 어떻게 할지 구체적으로 들어야 마음이 열립니다.`,
    avoid_actions: (child, parent) =>
      `【${parent} → ${child}】 울며 매달리기, 조건부 사과, ${child}가 원하는 구체 해법 없이 감정만 반복하기.`,
    solution_script: (child, parent, role) =>
      `【${parent}(${role}) → ${child}】 "${child}, A는 내가 잘못했어. 앞으로는 이렇게 바꿀게: (구체 행동). 이게 괜찮을까?" — 사실 인정 → 대안 → 확인 질문 순서로.`,
  },
  {
    hashtag: "#실속형사과가최고",
    color: "green",
    archetype_label: "현실 보상·실속형",
    category: "wealth",
    psych_state: (child) =>
      `${child}는 말로만 하는 사과에는 실망해요. 약속·시간·작은 보상 같은 '실질적 회복'이 있어야 마음이 열립니다.`,
    avoid_actions: (child, parent) =>
      `【${parent} → ${child}】 말로만 "미안해" 반복, ${child}가 입은 손해(약속 깨짐·시간 낭비)를 가볍게 넘기기.`,
    solution_script: (child, parent, role) =>
      `【${parent}(${role}) → ${child}】 "이번 주말 네가 하고 싶은 거 먼저 하자. 내가 미뤘던 (구체 약속) 오늘 같이 할게." — 말보다 행동·보상이 먼저입니다.`,
  },
];

const ARCHETYPE_TO_CATEGORY: Record<
  string,
  PrescriptionDef["category"]
> = {
  wood: "self",
  fire: "food",
  earth: "seal",
  metal: "officer",
  water: "wealth",
};

function categoryScores(counts: TenGodCounts): Record<PrescriptionDef["category"], number> {
  return {
    self: (counts["비견"] ?? 0) * 2 + (counts["겁재"] ?? 0),
    food: (counts["상관"] ?? 0) * 2 + (counts["식신"] ?? 0),
    seal: (counts["정인"] ?? 0) * 2 + (counts["편인"] ?? 0),
    officer: (counts["정관"] ?? 0) * 2 + (counts["편관"] ?? 0),
    wealth: (counts["정재"] ?? 0) + (counts["편재"] ?? 0) * 2,
  };
}

function pickPrescription(
  counts: TenGodCounts,
  dominantArchetype: string,
): PrescriptionDef {
  const scores = categoryScores(counts);
  const preferred = ARCHETYPE_TO_CATEGORY[dominantArchetype] ?? "seal";
  const ranked = (
    Object.entries(scores) as [PrescriptionDef["category"], number][]
  ).sort((a, b) => b[1] - a[1]);

  const top = ranked[0]?.[0];
  const category =
    (scores[preferred] ?? 0) >= (ranked[0]?.[1] ?? 0) - 1
      ? preferred
      : top ?? preferred;

  return (
    CHILD_DE_ESCALATION.find((p) => p.category === category) ??
    CHILD_DE_ESCALATION[2]!
  );
}

export function buildChildDeEscalationCard(params: {
  childNickname: string;
  parentNickname: string;
  parentRole: FamilyParentRole;
  childCounts: TenGodCounts;
  dominantArchetype: string;
}): ChildDeEscalationCard {
  const roleKo = params.parentRole === "mother" ? "엄마" : "아빠";
  const def = pickPrescription(params.childCounts, params.dominantArchetype);

  return {
    hashtag: def.hashtag,
    color: def.color,
    archetype_label: def.archetype_label,
    psych_state: def.psych_state(params.childNickname, params.parentNickname),
    avoid_actions: def.avoid_actions(params.childNickname, params.parentNickname),
    solution_script: def.solution_script(
      params.childNickname,
      params.parentNickname,
      roleKo,
    ),
  };
}
