/**
 * Part2 "기질 & 탤런트 분석" — 공부 타입 & 성공 그릇(Track A) / 부모님 기질
 * 이해 + 물려받은 자산(Track B). 새 십성 분류를 만들지 않는다 —
 * `resolveCorrectionStyleBucket`(`familySajuCompareTable.ts`, 이미 5카테고리
 * 우세 판정을 함)의 결과를 그대로 재해석만 한다:
 *   식상(food) 우세 → 창의형, 인성(seal) 우세 → 이해형, 그 외 → 암기·성실형
 *   재성(wealth) 우세 → 실속 재무형, 관성(officer) 우세 → 명예·커리어형, 그 외 → 잠재 성장형
 * 스펙 JSON 예시(`is_siksang_developed`→`creative_output`,
 * `is_jaeseong_rooted`→`practical_gain`)와 일치하는 매핑.
 */
import type { TenGodCounts } from "@/lib/relationship/marriage/marriageTenGodAnalysis";
import { resolveCorrectionStyleBucket } from "./familySajuCompareTable";
import { LEGACY_FALLBACK_LOCALE, pick } from "./familyParentCopy";
import { sanitizeFamilyParentText } from "./familyParentLanguage";
import type { Locale } from "@/lib/i18n/locale";

export type StudyType = "creative" | "understanding" | "diligent";
export type WealthVesselType = "practical_finance" | "career_honor" | "developing";

export function resolveStudyType(counts: TenGodCounts): StudyType {
  const { bucket } = resolveCorrectionStyleBucket(counts);
  if (bucket === "food") return "creative";
  if (bucket === "seal") return "understanding";
  return "diligent";
}

export function resolveWealthVessel(counts: TenGodCounts): WealthVesselType {
  const { bucket } = resolveCorrectionStyleBucket(counts);
  if (bucket === "wealth") return "practical_finance";
  if (bucket === "officer") return "career_honor";
  return "developing";
}

const STUDY_TYPE_LABEL: Record<Locale, Record<StudyType, string>> = {
  "en-US": {
    creative: "Creative type",
    understanding: "Understanding type",
    diligent: "Diligent-memory type",
  },
  "ko-KR": {
    creative: "창의형",
    understanding: "이해형",
    diligent: "암기·성실형",
  },
};

const WEALTH_VESSEL_LABEL: Record<Locale, Record<WealthVesselType, string>> = {
  "en-US": {
    practical_finance: "Practical-finance type",
    career_honor: "Career & honor type",
    developing: "Still-developing type",
  },
  "ko-KR": {
    practical_finance: "실속 재무형",
    career_honor: "명예·커리어형",
    developing: "잠재 성장형",
  },
};

const CHILD_STUDY_NOTE: Record<Locale, Record<StudyType, (n: string) => string>> = {
  "en-US": {
    creative: (n) =>
      `${n} shows real skill when finding a new approach instead of the given answer — a creative learner.`,
    understanding: (n) =>
      `${n} remembers things far longer once the underlying "why" clicks — an understanding-first learner.`,
    diligent: (n) =>
      `${n} builds strength through steady repetition — the kind of skill that only gets stronger over time.`,
  },
  "ko-KR": {
    creative: (n) => `${n}는 정해진 답보다 스스로 새로운 방법을 찾을 때 진짜 실력이 나오는 창의형이에요.`,
    understanding: (n) => `${n}는 원리와 맥락을 차근차근 이해하고 나면 오래 기억하는 이해형이에요.`,
    diligent: (n) => `${n}는 꾸준히 반복하고 익히는 성실형이라 시간이 쌓일수록 강해져요.`,
  },
};

const CHILD_WEALTH_NOTE: Record<Locale, Record<WealthVesselType, (n: string) => string>> = {
  "en-US": {
    practical_finance: (n) => `${n} has a practical, resource-savvy vessel for growing real assets.`,
    career_honor: (n) => `${n}'s vessel for success leans toward recognition and career standing.`,
    developing: (n) => `${n}'s vessel for success is still finding its shape — varied experience will grow it.`,
  },
  "ko-KR": {
    practical_finance: (n) => `${n}는 실속을 챙기고 현실적으로 자산을 불리는 재무형 그릇을 갖고 있어요.`,
    career_honor: (n) => `${n}는 명예와 커리어로 인정받는 방향에서 성공 그릇이 커요.`,
    developing: (n) => `${n}는 아직 뚜렷한 방향이 자리 잡는 중인 잠재 성장형이에요 — 다양한 경험이 그릇을 키워줄 거예요.`,
  },
};

const PARENT_STUDY_NOTE: Record<Locale, Record<StudyType, (n: string) => string>> = {
  "en-US": {
    creative: (n) =>
      `${n} tends to find their own way instead of following a set method — that creative streak may have shaped you more than you realize.`,
    understanding: (n) => `${n} tends to move only after understanding the reasoning behind things — a careful, thoughtful temperament.`,
    diligent: (n) => `${n} built their skills through steady, patient repetition over the years.`,
  },
  "ko-KR": {
    creative: (n) => `${n}는 정해진 틀보다 스스로 방법을 찾아내는 창의적인 분이에요 — 그 성향이 지금의 나에게도 이어졌을 수 있어요.`,
    understanding: (n) => `${n}는 원리와 맥락을 이해하고 나서야 움직이는 신중한 분이에요.`,
    diligent: (n) => `${n}는 꾸준함과 반복으로 실력을 쌓아 온 성실한 분이에요.`,
  },
};

const PARENT_WEALTH_NOTE: Record<Locale, Record<WealthVesselType, (n: string) => string>> = {
  "en-US": {
    practical_finance: (n) => `${n} has always managed things practically and kept assets grounded in reality.`,
    career_honor: (n) => `${n} has built their career around recognition and standing that mattered to them.`,
    developing: (n) => `${n} has tried many paths over the years while finding their own direction.`,
  },
  "ko-KR": {
    practical_finance: (n) => `${n}는 실속을 챙기고 현실적으로 자산을 관리해 온 분이에요.`,
    career_honor: (n) => `${n}는 명예와 인정을 중요하게 여기며 커리어를 쌓아 온 분이에요.`,
    developing: (n) => `${n}는 다양한 시도를 거치며 자기 방향을 찾아 온 분이에요.`,
  },
};

const INHERITED_NOTE: Record<Locale, { same: (child: string, parent: string) => string; different: (child: string, parent: string) => string }> = {
  "en-US": {
    same: (child, parent) =>
      `${child} carries the same kind of seed ${parent} does — that familiar feeling isn't a coincidence.`,
    different: (child, parent) =>
      `${child} has a different grain than ${parent} — different enough that you balance each other out.`,
  },
  "ko-KR": {
    same: (child, parent) =>
      `${child}는 ${parent}와 같은 성향의 씨앗을 물려받은 셈이에요 — 낯설지 않게 느껴지는 이유가 있었네요.`,
    different: (child, parent) =>
      `${child}는 ${parent}와는 다른 결을 갖고 있어요 — 서로 달라서 오히려 균형이 맞는 조합이에요.`,
  },
};

export type FamilyTalentSection = {
  headline: string;
  study_type: StudyType;
  study_type_label: string;
  study_type_note: string;
  wealth_vessel: WealthVesselType;
  wealth_vessel_label: string;
  wealth_vessel_note: string;
  inherited_note: string | null;
};

export function buildFamilyTalentSection(params: {
  countsChild: TenGodCounts;
  countsParent: TenGodCounts;
  childNickname: string;
  parentNickname: string;
  childIsViewer: boolean;
  locale?: Locale;
}): FamilyTalentSection {
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;
  const { childIsViewer } = params;

  const subjectCounts = childIsViewer ? params.countsParent : params.countsChild;
  const subjectNickname = childIsViewer ? params.parentNickname : params.childNickname;

  const study_type = resolveStudyType(subjectCounts);
  const wealth_vessel = resolveWealthVessel(subjectCounts);

  const studyNoteMap = childIsViewer ? PARENT_STUDY_NOTE : CHILD_STUDY_NOTE;
  const wealthNoteMap = childIsViewer ? PARENT_WEALTH_NOTE : CHILD_WEALTH_NOTE;

  const headline = sanitizeFamilyParentText(
    childIsViewer
      ? pick(locale, "Understanding Your Parent", "부모님의 기질 이해")
      : pick(locale, "Study Type & Vessel for Success", "공부 타입 & 성공 그릇"),
  );

  let inherited_note: string | null = null;
  if (childIsViewer) {
    const childBucket = resolveCorrectionStyleBucket(params.countsChild).bucket;
    const parentBucket = resolveCorrectionStyleBucket(params.countsParent).bucket;
    inherited_note = sanitizeFamilyParentText(
      childBucket === parentBucket
        ? INHERITED_NOTE[locale].same(params.childNickname, params.parentNickname)
        : INHERITED_NOTE[locale].different(params.childNickname, params.parentNickname),
    );
  }

  return {
    headline,
    study_type,
    study_type_label: STUDY_TYPE_LABEL[locale][study_type],
    study_type_note: sanitizeFamilyParentText(studyNoteMap[locale][study_type](subjectNickname)),
    wealth_vessel,
    wealth_vessel_label: WEALTH_VESSEL_LABEL[locale][wealth_vessel],
    wealth_vessel_note: sanitizeFamilyParentText(wealthNoteMap[locale][wealth_vessel](subjectNickname)),
    inherited_note,
  };
}
