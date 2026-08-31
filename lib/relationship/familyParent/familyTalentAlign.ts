/**
 * Phase 5-1 — 자녀 psych 11축 절대 밴드 메타 (confirm-only context).
 *
 * 해석 우선순위 (SSOT):
 *   1) 사주 `study_type` / `wealth_vessel` — 본문 판단·핵심 카피
 *   2) 이 모듈의 align — 보조 관찰만 (사주 대체·뒤집기·일치 판정 금지)
 *
 * `confirms` / `caution`은 사주 pick과의 일치가 아니다.
 * - confirms: 해당 psych 축 평균이 높음 (≥60)
 * - caution: 해당 psych 축 평균이 낮음 (≤40)
 * - null: mid-range 또는 psych 누락 → 키/보조문구 omit
 *
 * mid-range·psych 누락 시 null (추정 금지).
 */
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { Locale } from "@/lib/i18n/locale";
import { pick, LEGACY_FALLBACK_LOCALE } from "./familyParentCopy";
import { sanitizeFamilyParentText } from "./familyParentLanguage";
import type { FamilyTalentSection } from "./familyTalentProfile";

export type FamilyTalentAlign = "confirms" | "caution";

const ALIGN_HIGH = 60;
const ALIGN_LOW = 40;

function axisAvg(
  psych: PsychMasterJson,
  a: keyof PsychMasterJson["secondary_axes"],
  b: keyof PsychMasterJson["secondary_axes"],
): number {
  const s = psych.secondary_axes;
  return (s[a] + s[b]) / 2;
}

/**
 * 공부·구조 psych 절대 밴드.
 * resolveStudyType(사주) 결과는 읽지도·바꾸지도 않는다.
 */
export function resolveStudyAlign(
  psychChild: PsychMasterJson | null | undefined,
): FamilyTalentAlign | null {
  if (!psychChild?.secondary_axes) return null;
  const avg = axisAvg(psychChild, "thinking_style", "structure");
  if (avg >= ALIGN_HIGH) return "confirms";
  if (avg <= ALIGN_LOW) return "caution";
  return null;
}

/**
 * 실무·통제 psych 절대 밴드.
 * resolveWealthVessel(사주) 결과는 읽지도·바꾸지도 않는다.
 */
export function resolveWealthAlign(
  psychChild: PsychMasterJson | null | undefined,
): FamilyTalentAlign | null {
  if (!psychChild?.secondary_axes) return null;
  const avg = axisAvg(psychChild, "practicality", "self_control");
  if (avg >= ALIGN_HIGH) return "confirms";
  if (avg <= ALIGN_LOW) return "caution";
  return null;
}

/**
 * 회귀 테스트 전용 금지어 가드 — 카피 생성 로직은 이 목록을 읽지 않는다.
 * (`buildFamilyTalentPsychAuxNote`는 고정 허용 문구만 출력)
 */
export const FAMILY_TALENT_PSYCH_FORBIDDEN_PHRASES = [
  "사주 판단을 확인",
  "사주 확인",
  "사주와 심리",
  "사주와 11축",
  "사주와 일치",
  "심리가 사주",
  "일치합니다",
  "확인합니다",
  "판단을 검증",
  "충돌",
  "불일치",
  "confirms the saju",
  "confirms saju",
  "matches the saju",
  "aligns with the saju",
  "saju and psych agree",
  "psych confirms",
  "conflict with saju",
] as const;

/** 사주 본문 뒤에만 붙이는 보조 관찰 문장. align null이면 null. */
export function buildFamilyTalentPsychAuxNote(
  kind: "study" | "wealth",
  align: FamilyTalentAlign | null,
  locale?: Locale,
): string | null {
  if (!align) return null;
  const loc = locale ?? LEGACY_FALLBACK_LOCALE;

  if (kind === "study") {
    if (align === "confirms") {
      return sanitizeFamilyParentText(
        pick(
          loc,
          "As a separate observation, study and structure tendencies also show up strongly in the current profile.",
          "별도의 관찰로, 현재 성향에서도 공부·구조 축이 강하게 나타납니다.",
        ),
      );
    }
    return sanitizeFamilyParentText(
      pick(
        loc,
        "As a separate observation, study and structure tendencies appear milder in the current profile.",
        "별도의 관찰로, 현재 공부·구조 성향은 비교적 부드럽게 나타납니다.",
      ),
    );
  }

  if (align === "confirms") {
    return sanitizeFamilyParentText(
      pick(
        loc,
        "Practical focus and self-control tendencies can also be noted as secondary context.",
        "실용성과 자기통제 성향도 별도의 보조 맥락으로 함께 참고할 수 있습니다.",
      ),
    );
  }
  return sanitizeFamilyParentText(
    pick(
      loc,
      "Practical focus and self-control appear milder as secondary context only.",
      "실용성·자기통제 성향은 보조 맥락으로만 가볍게 참고할 수 있습니다.",
    ),
  );
}

/**
 * Track A(자녀 주체)일 때만 사주 노트 뒤에 psych 보조 문장을 붙인다.
 * Track B(부모 주체)에는 자녀 psych를 섞지 않는다.
 * study_type / wealth_vessel enum·라벨은 불변.
 */
export function applyFamilyTalentPsychAuxNotes(
  section: FamilyTalentSection,
  params: {
    psychChild?: PsychMasterJson | null;
    childIsViewer: boolean;
    locale?: Locale;
  },
): FamilyTalentSection {
  if (params.childIsViewer) return section;

  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;
  const studyAlign = resolveStudyAlign(params.psychChild);
  const wealthAlign = resolveWealthAlign(params.psychChild);
  const studyAux = buildFamilyTalentPsychAuxNote("study", studyAlign, locale);
  const wealthAux = buildFamilyTalentPsychAuxNote("wealth", wealthAlign, locale);

  if (!studyAux && !wealthAux) return section;

  return {
    ...section,
    study_type_note: studyAux
      ? `${section.study_type_note} ${studyAux}`
      : section.study_type_note,
    wealth_vessel_note: wealthAux
      ? `${section.wealth_vessel_note} ${wealthAux}`
      : section.wealth_vessel_note,
  };
}
