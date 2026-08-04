/**
 * Five-Element, Interaction & Layer Translation Matrix for Domain Lenses
 *
 * Translates Five-Element interactions, Stem Combinations/Clashes,
 * Branch Pairs (합/충/형/파/해), Wonjin, and Johu temperature into
 * domain-specific behavioral meaning across Partner, Family, Friend, and Cowork.
 */

import type { DomainPairLensId } from "@/lib/personCore/pairContextEngine/types";

export type ElementCode = "목" | "화" | "토" | "금" | "수";

export type DomainElementFlowExpression = {
  domain: DomainPairLensId;
  support_flow_ko: string;
  support_flow_en: string;
  friction_flow_ko: string;
  friction_flow_en: string;
  daily_scene_ko: string;
};

export const FIVE_ELEMENT_DOMAIN_MATRIX: Record<ElementCode, DomainElementFlowExpression> = {
  목: {
    domain: "partner",
    support_flow_ko: "새로운 시작과 성장의 에너지 공급 — 가계의 새로운 도전과 활력 주입",
    support_flow_en: "Energy of initiation and growth — injecting vitality and new milestones into the household",
    friction_flow_ko: "뿌리내리지 못한 조급함이나 시작만 하고 마무리가 약한 생활 패턴",
    friction_flow_en: "Impatience or initiating chores/plans without following through to completion",
    daily_scene_ko: "주말마다 새로운 취미나 인테리어 아이디어를 제안하며 집안에 생기를 불어넣음",
  },
  화: {
    domain: "partner",
    support_flow_ko: "따뜻한 온기와 솔직한 감정 분출 — 집안 분위기를 밝고 활기차게 유지",
    support_flow_en: "Warmth and expressive emotion — keeping the home atmosphere vibrant and bright",
    friction_flow_ko: "순간적인 감정 폭발과 과열 — 사소한 말다툼이 크게 번질 수 있는 뇌관",
    friction_flow_en: "Emotional flares and overheating — small spats can rapidly escalate",
    daily_scene_ko: "퇴근 후 하루 동안 있었던 일을 쉼 없이 털어놓으며 감정적 교감을 원함",
  },
  토: {
    domain: "partner",
    support_flow_ko: "단단한 신뢰의 토대와 완충 작용 — 가정의 중심을 잡고 갈등을 흡수함",
    support_flow_en: "Firm ballast of trust and buffering — anchoring the domestic center and absorbing shock",
    friction_flow_ko: "변화 거부와 속마음을 털어놓지 않는 침묵 — 답답한 냉전의 지속",
    friction_flow_en: "Resistance to change and silent brooding — prolonged, stubborn cold wars",
    daily_scene_ko: "어떤 풍파가 와도 묵묵히 자리를 지키며 가계의 안전판 역할을 수행함",
  },
  금: {
    domain: "partner",
    support_flow_ko: "명확한 원칙과 깔끔한 정리 정돈 — 가계 재정과 역할 분담의 명확성",
    support_flow_en: "Clear principles and sharp organization — precision in finances and household responsibilities",
    friction_flow_ko: "칼날 같은 지적과 단호함 — 상대의 서투름을 참지 못해 생기는 긴장",
    friction_flow_en: "Sharp critical feedback — tension arising from zero tolerance for partner's untidiness",
    daily_scene_ko: "집안 물건의 위치와 가계부 숫자가 정확히 맞아떨어져야 마음이 편안해짐",
  },
  수: {
    domain: "partner",
    support_flow_ko: "유연한 적응력과 깊은 지혜 — 상대의 감정을 막힘없이 수용하는 바다",
    support_flow_en: "Flexible adaptability and deep wisdom — sea-like capacity to absorb partner's emotional states",
    friction_flow_ko: "생각의 과잉과 속마음 잠수 — 현실적 행동보다 고민만 길어지는 현상",
    friction_flow_en: "Overthinking and withdrawing into the deep — getting paralyzed in anxiety rather than acting",
    daily_scene_ko: "말하지 않아도 상대의 피로를 먼저 감지하고 조용히 쉴 수 있는 분위기를 조성함",
  },
};

export type InteractionDomainTranslation = {
  interaction_type: "stem_combine" | "stem_clash" | "branch_six_combine" | "branch_clash" | "wonjin_guimun";
  partner_meaning_ko: string;
  family_meaning_ko: string;
  friend_meaning_ko: string;
  work_meaning_ko: string;
};

export const INTERACTION_DOMAIN_MATRIX: Record<string, InteractionDomainTranslation> = {
  stem_combine: {
    interaction_type: "stem_combine",
    partner_meaning_ko: "가치관과 지향점이 자연스럽게 맞물려 부부로서의 한 팀 의식이 빠르고 강하게 형성됨",
    family_meaning_ko: "부모와 자녀의 시선이 같은 방향을 바라보며 자연스러운 공감대와 정서적 일체감 형성",
    friend_meaning_ko: "첫 만남부터 말이 잘 통하고 오랜 친구처럼 느껴지는 자연스러운 케미스트리",
    work_meaning_ko: "업무 비전과 목표 설정에서 잡음 없이 뜻이 모아지며 빠른 합의 도출 가능",
  },
  stem_clash: {
    interaction_type: "stem_clash",
    partner_meaning_ko: "일상 대화 방식이나 즉각적 의견 표출에서 스타일 차이로 인한 잦은 의견 대립",
    family_meaning_ko: "훈육과 대화 시 부모의 표현 방식에 자녀가 즉각적으로 반발하거나 튕겨 나감",
    friend_meaning_ko: "토론이나 의견 차이에서 직설적으로 부딪히며 때때로 말싸움으로 번질 수 있음",
    work_meaning_ko: "접근 방식의 극명한 차이로 인해 초기 아이디어 단계에서 날카로운 긴장감 유발",
  },
  branch_six_combine: {
    interaction_type: "branch_six_combine",
    partner_meaning_ko: "생활 공간과 침실, 일상의 신체적/공간적 리듬이 찰떡처럼 맞아떨어지는 강력한 결속력",
    family_meaning_ko: "한집에서 생활할 때 신체적 친밀감과 일상적 생활 습관의 편안한 밀착",
    friend_meaning_ko: "함께 여행을 가거나 붙어 있어도 피로감이 없고 자연스러운 생활 밀착형 우정",
    work_meaning_ko: "실무 실행 단계에서 손발이 척척 맞아떨어지며 업무 핑퐁이 매끄러움",
  },
  branch_clash: {
    interaction_type: "branch_clash",
    partner_meaning_ko: "수면 패턴, 온도, 가사 스타일 등 현실 생활 습관의 정면충돌로 조율 필요",
    family_meaning_ko: "자녀의 생활 리듬이나 방 정리, 시간 관리 습관을 두고 매일 반복되는 실랑이",
    friend_meaning_ko: "여행 스타일이나 노는 패턴의 극명한 차이로 인해 긴 일정을 함께할 때 피로 누적",
    work_meaning_ko: "실무 처리 템포와 우선순위가 정반대여서 중간 산출물 싱크 시 마찰 발생",
  },
  wonjin_guimun: {
    interaction_type: "wonjin_guimun",
    partner_meaning_ko: "서로 깊이 사랑하면서도 이유 없이 서운하거나 꼬여서 말하게 되는 애증의 뇌관",
    family_meaning_ko: "가장 사랑하지만 가장 깊은 상처를 주고받기 쉬운 예민한 감정의 굴절",
    friend_meaning_ko: "친한 만큼 사소한 오해가 생기면 속으로 섭섭함을 오래 품게 되는 미묘한 심리",
    work_meaning_ko: "업무 피드백을 감정적으로 받아들이거나 숨은 의도를 의심하게 되는 심리적 피로",
  },
};
