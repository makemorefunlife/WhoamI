/**
 * 006 로드맵(`docs/dev/decisions/006_master-migration-roadmap.md`) Step1 —
 * family가 필요로 하는 공용 primitive 2개.
 *
 * 순수 함수만 포함한다. 기존 marriage(`marriageTenGodAnalysis.ts`)·family
 * (`extractFamilySignals.ts`) 파일은 전혀 수정하지 않았다. DB/schema 필드도
 * 추가하지 않았다 — `SajuMasterJson.domain_signals`에는 아직 안 얹었다(캐싱
 * 이득이 실제로 있다고 판단되면 별도 스텝에서 결정).
 *
 * 1) resolveParentingStyleLean — marriage의 resolveParentingStyle과 완전히
 *    동일한 공식을 재노출한다(복붙이 아니라 원본 함수를 그대로 호출).
 *    family는 아직 이 신호를 쓰고 있지 않으므로 지금 당장은 아무 결과도
 *    안 바뀐다 — Step3(family 비교표)에서 처음 소비될 예정.
 *
 * 2) resolveOriginFamilyTension — marriage(`analyzeFamilyBoundary`)와
 *    family(`extractFamilySignals`)가 "원가족과의 정서적 긴장"이라는 같은
 *    개념을 서로 다른 형충 탐지 경로로 각자 계산하던 걸 하나로 합쳤다.
 *
 *    **가중치·컷오프는 marriage의 기존 값을 그대로 보존했다 — 새 숫자를
 *    지어내지 않았다.** (base 20 / hasHyoshin +25 / sealExcess +20 /
 *    yearPalaceTension +30, needsStrongBoundary 컷오프 55). 유일하게 바뀐
 *    부분은 "년주 형충 탐지" 수단이다 — marriage 전용 intraHits
 *    (`CrossChartHit[]`, 원래 pair 교차분석용 타입을 자기 자신과 비교하는
 *    데 전용한 것)를 family가 이미 쓰는 공용 유틸(`collectBranchPalaceRelations`)
 *    로 교체했다. 필터 조건(충/형 타입, 상대궁 월주/일주)은 marriage의
 *    원래 조건을 그대로 재현했으므로, 이론상 marriage의 기존 판정 결과와
 *    동일해야 한다 — 이 동등성은 아래 테스트 파일에서 실제 카운트로 검증.
 *
 *    home_punishment(형살)는 marriage가 지금까지 전혀 안 쓰던 신호다.
 *    family의 기존 공식(`punishmentHits.length*25 + yearTension.length*10`)
 *    을 그대로 재현해 참고용 필드로만 노출해뒀고, tensionIndex/
 *    needsStrongBoundary 계산에는 아직 안 넣었다 — 넣으려면 새 컷오프를
 *    지어내야 하는데 근거 없는 발명이라 이번 스텝 범위 밖이다. 필요하면
 *    실측 근거를 갖고 Step7(marriage 이관)에서 별도로 결정한다.
 */

import type { ChartContext } from "@/lib/saju/chartContext";
import {
  profileTenGods,
  resolveParentingStyle as resolveMarriageParentingStyle,
  type TenGodCounts,
} from "@/lib/relationship/marriage/marriageTenGodAnalysis";
import { collectBranchPalaceRelations, clampScore } from "./intraPalaceRelations";
import type { SajuRelationHitBrief } from "./types";

// ---- 1) parenting_style_lean --------------------------------------------

export type ParentingStyleLean = "empathy" | "structure";

/** marriage의 resolveParentingStyle을 그대로 재노출 — 새 계산 아님, re-export. */
export function resolveParentingStyleLean(counts: TenGodCounts): ParentingStyleLean {
  return resolveMarriageParentingStyle(counts).style;
}

// ---- 2) origin_family_tension --------------------------------------------

export type OriginFamilyTensionProfile = {
  /** marriage의 기존 inlawStressIndex와 동일한 가중치로 계산된 값(0-100). */
  tensionIndex: number;
  /** marriage의 기존 needsStrongBoundary와 동일한 판정(threshold=55 그대로). */
  needsStrongBoundary: boolean;
  hyoshinRisk: boolean;
  sealExcess: boolean;
  /** family의 seal_isolated 개념 — marriage는 지금까지 이 상태를 구분 안 했음(신규 노출, threshold 미반영). */
  sealIsolated: boolean;
  yearPalaceTension: boolean;
  yearTensionHits: SajuRelationHitBrief[];
  /** family가 이미 계산해 둔 원점수 — marriage의 기존 threshold에는 아직 안 들어감(참고용). */
  karmaTensionIndex: number;
  /** marriage가 지금까지 전혀 안 쓰던 신호 — 참고용으로만 노출, 아직 tensionIndex/threshold 미반영. */
  homePunishment: {
    hits: SajuRelationHitBrief[];
    count: number;
    familyConflictIndex: number;
  };
};

/** marriage가 원래 쓰던 필터(충·형, 상대궁 월주/일주)를 그대로 재현 — 공용 유틸 기반. */
function hasMarriageStyleYearTension(hits: SajuRelationHitBrief[]): boolean {
  return hits.some(
    (h) =>
      (h.type === "충" || h.type === "형") &&
      (h.counterpart_palace === "월주" || h.counterpart_palace === "일주"),
  );
}

export function resolveOriginFamilyTension(
  counts: TenGodCounts,
  chart: ChartContext,
): OriginFamilyTensionProfile {
  const p = profileTenGods(counts);
  const yearRel = collectBranchPalaceRelations(chart, "년주");
  const monthRel = collectBranchPalaceRelations(chart, "월주");
  const dayRel = collectBranchPalaceRelations(chart, "일주");

  const yearPalaceTension = hasMarriageStyleYearTension(yearRel.tension);

  // marriage의 기존 가중치를 그대로 보존 — 새 숫자 없음.
  let tensionIndex = 20;
  if (p.hasHyoshin) tensionIndex += 25;
  if (p.sealExcess) tensionIndex += 20;
  if (yearPalaceTension) tensionIndex += 30;
  tensionIndex = Math.min(100, tensionIndex);

  const needsStrongBoundary =
    tensionIndex >= 55 || yearPalaceTension || (p.hasHyoshin && p.sealExcess);

  // family 스타일 형살(punishment) — family의 기존 공식 그대로 재현, 참고용.
  const punishmentHits = [
    ...yearRel.tension.filter((h) => h.type === "형"),
    ...monthRel.tension.filter((h) => h.type === "형"),
    ...dayRel.tension.filter((h) => h.type === "형"),
  ];
  const familyConflictIndex = clampScore(
    punishmentHits.length * 25 + yearRel.tension.length * 10,
  );

  return {
    tensionIndex,
    needsStrongBoundary,
    hyoshinRisk: p.hasHyoshin,
    sealExcess: p.sealExcess,
    sealIsolated: p.seal === 0,
    yearPalaceTension,
    yearTensionHits: yearRel.tension,
    karmaTensionIndex: clampScore(
      yearRel.tension.length * 28 +
        yearRel.tension.filter((h) => h.counterpart_palace === "일주").length * 20,
    ),
    homePunishment: {
      hits: punishmentHits,
      count: punishmentHits.length,
      familyConflictIndex,
    },
  };
}
