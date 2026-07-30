/**
 * Save / Share surface — signature from opening; optional insightLines from
 * existing reflection / repair text only (no new insights generated).
 */
import type {
  OpeningSceneVM,
  ReflectionVM,
  RepairGuideVM,
  SaveShareVM,
} from "../romanticExperienceTypes";

export type ProjectSaveShareInput = {
  opening: OpeningSceneVM;
  reflection: ReflectionVM;
  repairGuide: RepairGuideVM;
  myName: string;
  partnerName: string;
};

function pushUnique(target: string[], value: string | null | undefined, ban: Set<string>) {
  const t = typeof value === "string" ? value.trim() : "";
  if (!t || ban.has(t) || target.includes(t)) return;
  target.push(t);
}

export function projectSaveShare(input: ProjectSaveShareInput): SaveShareVM {
  const signature = input.opening.signature?.trim();
  if (!signature) {
    return { available: false, signatureLine: null, insightLines: [] };
  }

  const signatureLine = `${input.myName} · ${input.partnerName} — ${signature}`;
  const ban = new Set<string>(
    [signature, input.opening.paradox?.trim()].filter(Boolean) as string[],
  );

  const insightLines: string[] = [];
  pushUnique(insightLines, input.reflection.realization, ban);
  pushUnique(insightLines, input.reflection.prompt, ban);
  const repairSpeakable = input.repairGuide.stages
    .map((s) => s.speakable?.trim())
    .find(Boolean);
  pushUnique(insightLines, repairSpeakable, ban);

  return {
    available: true,
    signatureLine,
    insightLines: insightLines.slice(0, 2),
  };
}
