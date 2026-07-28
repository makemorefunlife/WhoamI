/**
 * Closing reflection — one realization drawn from Repair Guide's interrupt
 * point (already computed, never otherwise rendered), so it never restates
 * Opening's signature/paradox or Do/Don't's checklist text.
 * No therapy prompts, no journaling overload.
 */
import type { ReflectionVM, RepairGuideVM } from "../romanticExperienceTypes";

export type ProjectReflectionInput = {
  repairGuide: RepairGuideVM;
  partnerName: string;
};

export function projectReflection(input: ProjectReflectionInput): ReflectionVM {
  const realization = input.repairGuide.interrupt?.label?.trim() || null;

  if (!realization) {
    return { available: false, realization: null, prompt: null };
  }

  const prompt = `${input.partnerName}와 다음에 마주칠 때, 오늘 읽은 이 한 장면만 기억해도 충분해요.`;

  return {
    available: true,
    realization,
    prompt,
  };
}
