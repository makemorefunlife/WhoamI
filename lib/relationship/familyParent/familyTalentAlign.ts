/**
 * Phase 5-1 — study/wealth 사주 판정은 불변. 자녀 psych 11축으로 confirm/caution만.
 * mid-range·psych 누락 시 null (추정 금지).
 */
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";

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
 * 공부 타입(사주) 확인 — thinking_style + structure.
 * resolveStudyType 결과는 건드리지 않는다.
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
 * 성공 그릇(사주) 확인 — practicality + self_control.
 * resolveWealthVessel 결과는 건드리지 않는다.
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
