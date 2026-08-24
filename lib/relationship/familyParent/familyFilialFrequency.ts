/**
 * Part3 Track B 전용 — 효도 주파수(부모 사주 기반 맞춤형 효도 유형).
 * 스펙이 Track B에서만 이 항목을 요구함(Track A엔 대응 항목이 없음) —
 * childIsViewer=false면 항상 null. 새 십성 분류는 만들지 않는다 —
 * resolveCorrectionStyleBucket(이미 존재하는 5카테고리 우세 판정)을
 * 3-way(현금·선물형/함께하는 시간형/정서적 인정형)로 재해석만 한다:
 *   재성(wealth) 우세 → 현금·선물형(스펙 JSON 예시 parent_love_language:
 *   "money_and_gift"와 일치), 식상(food)·비겁(self) 우세 → 함께하는 시간형,
 *   인성(seal)·관성(officer) 우세 → 정서적 인정형.
 */
import type { TenGodCounts } from "@/lib/relationship/marriage/marriageTenGodAnalysis";
import { resolveCorrectionStyleBucket } from "./familySajuCompareTable";
import { LEGACY_FALLBACK_LOCALE } from "./familyParentCopy";
import { sanitizeFamilyParentText, josaEunNeun } from "./familyParentLanguage";
import type { Locale } from "@/lib/i18n/locale";

export type FilialFrequencyType = "cash_gift" | "quality_time" | "emotional_recognition";

export function resolveFilialFrequencyType(counts: TenGodCounts): FilialFrequencyType {
  const { bucket } = resolveCorrectionStyleBucket(counts);
  if (bucket === "wealth") return "cash_gift";
  if (bucket === "food" || bucket === "self") return "quality_time";
  return "emotional_recognition"; // seal | officer
}

const FREQUENCY_LABEL: Record<Locale, Record<FilialFrequencyType, string>> = {
  "en-US": {
    cash_gift: "Cash & Gift type",
    quality_time: "Quality-Time type",
    emotional_recognition: "Emotional-Recognition type",
  },
  "ko-KR": {
    cash_gift: "현금·선물형",
    quality_time: "함께하는 시간형",
    emotional_recognition: "정서적 인정형",
  },
};

const FREQUENCY_NOTE: Record<Locale, Record<FilialFrequencyType, (parent: string) => string>> = {
  "en-US": {
    cash_gift: (p) =>
      `${p} feels most cared for through practical, tangible gestures — a thoughtful gift or cash handed over in person means more than words.`,
    quality_time: (p) =>
      `${p} feels most cared for when you simply spend time together — a shared meal or an afternoon out matters more than any gift.`,
    emotional_recognition: (p) =>
      `${p} feels most cared for through recognition and thanks — a sincere "thank you" or a call that says you appreciate them lands deeper than any gift.`,
  },
  "ko-KR": {
    cash_gift: (p) =>
      `${josaEunNeun(p)} 실질적이고 손에 잡히는 표현에서 사랑받는다고 느껴요 — 정성 담긴 선물이나 직접 건네는 용돈이 말보다 더 크게 다가와요.`,
    quality_time: (p) =>
      `${josaEunNeun(p)} 함께 보내는 시간 자체에서 사랑받는다고 느껴요 — 같이 밥 한 끼, 나들이 한 번이 어떤 선물보다 크게 다가와요.`,
    emotional_recognition: (p) =>
      `${josaEunNeun(p)} 인정과 감사의 말에서 사랑받는다고 느껴요 — 진심 담긴 "고마워요" 한마디, 안부 전화 한 통이 어떤 선물보다 깊게 다가와요.`,
  },
};

export type FamilyFilialFrequencySection = {
  frequency_type: FilialFrequencyType;
  frequency_label: string;
  frequency_note: string;
};

/** Track A(childIsViewer=false)면 스펙 범위 밖이라 항상 null. */
export function buildFamilyFilialFrequencySection(params: {
  countsParent: TenGodCounts;
  parentNickname: string;
  childIsViewer: boolean;
  locale?: Locale;
}): FamilyFilialFrequencySection | null {
  if (!params.childIsViewer) return null;
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;
  const frequency_type = resolveFilialFrequencyType(params.countsParent);
  return {
    frequency_type,
    frequency_label: FREQUENCY_LABEL[locale][frequency_type],
    frequency_note: sanitizeFamilyParentText(
      FREQUENCY_NOTE[locale][frequency_type](params.parentNickname),
    ),
  };
}
