/**
 * Part1 "관계 입체 진단" — 훈육 마찰 지수(Track A) / 소통 엇박자 진단(Track B).
 * 신규 계산은 최소화: `PairFamilySignals`(이미 계산됨, `pairFamilySignals.ts`)의
 * `nagging_trigger_index`/`umbilical_band`를 그대로 재사용하고, 없으면
 * `masterScores.risk`(이미 계산됨)로 폴백한다. 11축 `decision_style`(신중결정)은
 * 가족 도메인에서 이번에 처음 사용 — 극단값(≥70/≤30)일 때만 확인문구, 중간대는
 * null(억지로 안 만듦, 다른 도메인의 axisNote 컨벤션과 동일).
 */
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { PairFamilySignals, PairIntensityBand } from "@/lib/personCore/sajuSignals/pairTypes";
import { LEGACY_FALLBACK_LOCALE, pick } from "./familyParentCopy";
import { sanitizeFamilyParentText } from "./familyParentLanguage";
import type { Locale } from "@/lib/i18n/locale";

export type FamilyRelationshipIndexSection = {
  friction_index: number;
  headline: string;
  safe_distance_note: string;
  decision_axis_note: string | null;
};

const SAFE_DISTANCE_NOTE: Record<
  Locale,
  Record<PairIntensityBand, { parentView: string; childView: string }>
> = {
  "en-US": {
    low: {
      parentView:
        "The current distance between you two is about right. Keep the same rhythm of watching without hovering.",
      childView:
        "The current distance between you and your parents feels about right — you're doing fine as you are.",
    },
    medium: {
      parentView:
        "There are moments your involvement feels like too much or too little. Step back one beat and let your child come to you first.",
      childView:
        "There are moments your parents' attention feels like too much, and other moments it feels like too little — both are normal reactions to a still-settling distance.",
    },
    high: {
      parentView:
        "Right now the pattern leans toward one extreme — either over-involved or too hands-off. Practicing a bit of physical and emotional distance would help both of you.",
      childView:
        "Right now the distance from your parents feels either too close or too far, and that gap is a real source of frustration. You have every right to have your own space respected.",
    },
  },
  "ko-KR": {
    low: {
      parentView: "지금 정도의 거리가 딱 적당해요. 지켜보되 개입하지 않는 지금의 리듬을 유지해 보세요.",
      childView: "부모님과의 지금 거리감이면 잘 지내고 있는 편이에요.",
    },
    medium: {
      parentView:
        "가끔 개입이 과하거나 부족하다고 느껴질 수 있어요. 한 걸음 물러나 자녀가 먼저 다가올 시간을 줘 보세요.",
      childView:
        "가끔 부모님 관심이 부담스럽거나, 반대로 서운하게 느껴질 때가 있을 거예요 — 아직 자리 잡는 중인 거리감이라 둘 다 자연스러운 반응이에요.",
    },
    high: {
      parentView:
        "지금은 개입이 지나치거나 너무 무심한 쪽으로 쏠려 있어요. 물리적으로도 심리적으로도 한 걸음 거리를 두는 연습이 필요해요.",
      childView:
        "지금은 부모님과의 거리가 너무 가깝거나 너무 멀어서 답답함이 큰 시기예요. 내 공간을 존중받을 권리가 있다는 걸 기억하세요.",
    },
  },
};

function buildDecisionAxisNote(
  score: number | undefined,
  childIsViewer: boolean,
  locale: Locale,
): string | null {
  if (typeof score !== "number") return null;
  if (score >= 70) {
    return sanitizeFamilyParentText(
      childIsViewer
        ? pick(
            locale,
            "Your parent tends to weigh decisions carefully before acting — their pace isn't hesitation, it's caution.",
            "부모님은 결정을 내리기 전에 신중하게 따져보는 편이에요 — 느린 게 아니라 조심스러운 거예요.",
          )
        : pick(
            locale,
            "Your child tends to think things through carefully before deciding — give them a beat instead of rushing an answer.",
            "아이는 결정을 내리기 전에 신중하게 따져보는 편이에요 — 즉답을 재촉하기보다 생각할 시간을 줘 보세요.",
          ),
    );
  }
  if (score <= 30) {
    return sanitizeFamilyParentText(
      childIsViewer
        ? pick(
            locale,
            "Your parent tends to decide quickly and act on instinct — it's not carelessness, just a faster pace.",
            "부모님은 빠르게 결정하고 바로 행동에 옮기는 편이에요 — 대충 하는 게 아니라 속도가 빠른 거예요.",
          )
        : pick(
            locale,
            "Your child tends to decide quickly on instinct rather than weighing options for long — that speed is part of who they are, not carelessness.",
            "아이는 오래 재기보다 빠르게 결정하고 바로 움직이는 편이에요 — 대충 하는 게 아니라 원래 속도가 빠른 편이에요.",
          ),
    );
  }
  return null;
}

export function buildFamilyRelationshipIndexSection(params: {
  pairFamily?: PairFamilySignals | null;
  fallbackRisk: number;
  psychChild?: PsychMasterJson | null;
  psychParent?: PsychMasterJson | null;
  childIsViewer: boolean;
  locale?: Locale;
}): FamilyRelationshipIndexSection {
  const locale = params.locale ?? LEGACY_FALLBACK_LOCALE;
  const childIsViewer = params.childIsViewer;
  const friction_index = params.pairFamily?.nagging_trigger_index ?? params.fallbackRisk;
  const band: PairIntensityBand = params.pairFamily?.umbilical_band ?? "medium";

  const headline = sanitizeFamilyParentText(
    childIsViewer
      ? pick(locale, "Communication Mismatch Diagnosis", "소통 엇박자 진단")
      : pick(locale, "Discipline Friction Index", "훈육 마찰 지수"),
  );

  const noteVariant = SAFE_DISTANCE_NOTE[locale][band];
  const safe_distance_note = sanitizeFamilyParentText(
    childIsViewer ? noteVariant.childView : noteVariant.parentView,
  );

  const axisOwner = childIsViewer ? params.psychParent : params.psychChild;
  const decision_axis_note = buildDecisionAxisNote(
    axisOwner?.secondary_axes?.decision_style,
    childIsViewer,
    locale,
  );

  return { friction_index, headline, safe_distance_note, decision_axis_note };
}
