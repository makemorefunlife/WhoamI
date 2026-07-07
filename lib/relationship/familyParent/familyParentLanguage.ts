import type { FamilyParentRole } from "./types";

const SAJU_JARGON_RE =
  /일간|일지|월간|월지|년주|월주|연주|시주|지지|천간|십신|십성|오행|상생|상극|육합|삼합|방합|원진|귀문|공망|형벌|순환형|신강|신약|용신|기신|정재|편재|정관|편관|식신|상관|정인|편인|비견|겁재|효신|조후|역마|목\(木\)|화\(火\)|토\(土\)|금\(金\)|수\(水\)/g;

export function sanitizeFamilyParentText(text: string): string {
  return text.replace(SAJU_JARGON_RE, "").replace(/\s{2,}/g, " ").trim();
}

/** 엄마-자녀 전용 서술 렌즈 */
export function buildMotherParentLens(params: {
  childNickname: string;
  parentNickname: string;
}): {
  title: string;
  emotional_climate: string;
  care_pattern: string;
  child_feels: string;
  repair_tip: string;
} {
  const { childNickname, parentNickname } = params;
  return {
    title: "🌸 엄마 ↔ 자녀 — 정서·돌봄 렌즈",
    emotional_climate: sanitizeFamilyParentText(
      `${parentNickname}(엄마)와 ${childNickname}(자녀) 사이의 정서 온도·돌봄 리듬을 읽는 구간입니다. (스켈레톤 — TODO: 印·食상·월궁)`,
    ),
    care_pattern: sanitizeFamilyParentText(
      "엄마의 사랑은 '걱정·챙김·기억'으로 드러나기 쉽습니다. TODO: 과잉 돌봄 vs 정서적 안식처 분기",
    ),
    child_feels: sanitizeFamilyParentText(
      `${childNickname}는 엄마의 말보다 '분위기'에 더 크게 반응할 수 있습니다. TODO`,
    ),
    repair_tip: sanitizeFamilyParentText(
      "갈등 후 — 엄마가 먼저 '네가 힘들었겠다' 감정을 인정하면 문이 열립니다. TODO",
    ),
  };
}

/** 아빠-자녀 전용 서술 렌즈 */
export function buildFatherParentLens(params: {
  childNickname: string;
  parentNickname: string;
}): {
  title: string;
  emotional_climate: string;
  authority_pattern: string;
  child_feels: string;
  repair_tip: string;
} {
  const { childNickname, parentNickname } = params;
  return {
    title: "🛡️ 아빠 ↔ 자녀 — 권위·신뢰 렌즈",
    emotional_climate: sanitizeFamilyParentText(
      `${parentNickname}(아빠)와 ${childNickname}(자녀) 사이의 신뢰·규칙·존경의 온도를 읽는 구간입니다. (스켈레톤 — TODO: 財·관성·년궁)`,
    ),
    authority_pattern: sanitizeFamilyParentText(
      "아빠의 사랑은 '기준·책임·방향'으로 드러나기 쉽습니다. TODO: 통제 vs 든든한 후원 분기",
    ),
    child_feels: sanitizeFamilyParentText(
      `${childNickname}는 아빠의 칭찬·인정 한 마디에 오래 기억할 수 있습니다. TODO`,
    ),
    repair_tip: sanitizeFamilyParentText(
      "갈등 후 — 아빠가 '내가 너무 딱딱했을 수 있다'는 사실 인정 + 구체 행동 약속이 효과적입니다. TODO",
    ),
  };
}

export function buildChildInnerWorld(params: {
  childNickname: string;
  parentRole: FamilyParentRole;
  parentNickname: string;
}): string {
  const roleKo = params.parentRole === "mother" ? "엄마" : "아빠";
  return sanitizeFamilyParentText(
    `${params.childNickname}의 내면 — ${roleKo}(${params.parentNickname})에게서 받고 싶은 것과, ` +
      `스스로 지키려는 자율의 경계가 어디에 있는지 읽는 구간입니다. (스켈레톤)`,
  );
}
