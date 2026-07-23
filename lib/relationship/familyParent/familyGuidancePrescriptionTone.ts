/**
 * Part5 처방 — Part2 C `guidance_fit` 톤 보조 (사주 guidance mode/fit 불변).
 *
 * fit은 사주 확인·검증이 아님. 처방 bucket/item 수/핵심 do·dont는 바꾸지 않고
 * 대상 item의 evidence.summary에 보조 문장 최대 1개만 붙인다.
 *
 * 입력 pack/item은 mutate하지 않는다. 동일 aux가 이미 있으면 재append하지 않는다.
 */
import type { GuidanceFit } from "@/lib/personCore/sajuSignals/guidanceProfile";
import type { Locale } from "@/lib/i18n/locale";
import { pick, LEGACY_FALLBACK_LOCALE } from "./familyParentCopy";
import { sanitizeFamilyParentText } from "./familyParentLanguage";
import type {
  FamilyPrescriptionItem,
  FamilyPrescriptionPack,
} from "./familyPrescriptionTypes";

/** 회귀 테스트 가드 — 카피 생성기는 이 목록을 읽지 않는다. */
export const FAMILY_GUIDANCE_TONE_FORBIDDEN_PHRASES = [
  "사주 확인",
  "사주와 일치",
  "판단 검증",
  "판단을 검증",
  "정답입니다",
  "잘못된 부모",
  "궁합이 맞지",
  "궁합 불일치",
  "궁합이 좋다",
  "잘 맞아요",
  "잘 맞는다",
  "위험 유형",
  "위험 등급",
  "관계가 위험",
  "말을 듣지",
  "confirms the saju",
  "matches the saju",
  "wrong parent",
  "incompatible",
  "compatibility",
] as const;

export function buildGuidanceFitToneAux(
  fit: GuidanceFit,
  locale?: Locale,
): string {
  const loc = locale ?? LEGACY_FALLBACK_LOCALE;
  if (fit === "aligned") {
    return sanitizeFamilyParentText(
      pick(
        loc,
        "As a delivery tip: keep the same short, consistent approach rather than re-explaining every time.",
        "전달 팁: 매번 길게 다시 설명하기보다, 짧고 일관된 방식을 유지하는 편이 더 잘 전달될 수 있어요.",
      ),
    );
  }
  if (fit === "partial") {
    return sanitizeFamilyParentText(
      pick(
        loc,
        "As a delivery tip: keep the same guidance, but adjust order — explain briefly, then leave room to choose.",
        "전달 팁: 지침의 내용은 유지하되, 전달 순서를 조정해 보세요. 짧게 설명한 뒤 결정할 시간을 주면 더 잘 받아들일 수 있어요.",
      ),
    );
  }
  return sanitizeFamilyParentText(
    pick(
      loc,
      "As a delivery tip: keep the same guidance, but change the channel first — less pressure and fewer repeats.",
      "전달 팁: 지침의 내용보다 전달 채널을 먼저 바꿔 보세요. 압박·반복 설득·즉시 순응 요구를 줄이는 편이 도움이 될 수 있어요.",
    ),
  );
}

/**
 * guidance 전달과 가장 가까운 1개 item만 고른다 (첫 번째 매치, 결정론).
 * nagging → baseline → 그 외(umbilical-only / empty)는 -1.
 */
export function selectGuidanceToneTargetIndex(
  items: FamilyPrescriptionItem[],
): number {
  const nagging = items.findIndex((i) => i.topic === "nagging_karma_avoidance");
  if (nagging >= 0) return nagging;
  const baseline = items.findIndex((i) => i.topic === "family_baseline");
  if (baseline >= 0) return baseline;
  return -1;
}

/** summary가 비어 있거나 없으면 aux만; 이미 aux가 있으면 그대로; 아니면 한 칸 띄워 append. */
export function mergeGuidanceToneSummary(
  base: string | null | undefined,
  aux: string,
): string {
  const trimmedAux = aux.trim();
  if (!trimmedAux) {
    return typeof base === "string" ? base.trim() : "";
  }
  const raw =
    base == null || typeof base !== "string" ? "" : base.trim();
  if (!raw) return trimmedAux;
  if (raw.includes(trimmedAux)) return raw;
  return `${raw} ${trimmedAux}`;
}

/**
 * fit이 없거나 대상이 없으면 입력 pack을 그대로 반환(참조 유지, 무변).
 * 적용 시 pack/items/대상 evidence만 새 객체로 반환 — 입력 mutate 없음.
 */
export function applyGuidanceFitToneToPrescriptions(
  pack: FamilyPrescriptionPack,
  fit: GuidanceFit | null | undefined,
  locale?: Locale,
): FamilyPrescriptionPack {
  if (fit !== "aligned" && fit !== "partial" && fit !== "mismatch") {
    return pack;
  }
  const items = pack.items ?? [];
  const idx = selectGuidanceToneTargetIndex(items);
  if (idx < 0) return pack;

  const loc = locale ?? LEGACY_FALLBACK_LOCALE;
  const aux = buildGuidanceFitToneAux(fit, loc);
  const target = items[idx]!;
  const nextSummary = mergeGuidanceToneSummary(target.evidence?.summary, aux);
  if (nextSummary === (target.evidence?.summary ?? "")) {
    return pack;
  }

  const nextItems = items.map((item, i) => {
    if (i !== idx) return item;
    return {
      ...item,
      evidence: {
        ...item.evidence,
        summary: nextSummary,
      },
    };
  });

  return {
    ...pack,
    items: nextItems,
  };
}
