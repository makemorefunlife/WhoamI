/**
 * Save / Share surface — signature line from opening only (no grade/score).
 * The signature line is an intentional callback (a keepsake "name tag" for
 * the headline, labeled "Relationship Signature" in the UI) — not a claim of
 * new insight. insightLines is deliberately empty: Opening's paradox is
 * already fully shown in Hero, so restating it here would just be a third
 * verbatim copy with no new content.
 */
import type { OpeningSceneVM, SaveShareVM } from "../romanticExperienceTypes";

export type ProjectSaveShareInput = {
  opening: OpeningSceneVM;
  myName: string;
  partnerName: string;
};

export function projectSaveShare(input: ProjectSaveShareInput): SaveShareVM {
  const signature = input.opening.signature?.trim();
  if (!signature) {
    return { available: false, signatureLine: null, insightLines: [] };
  }

  const signatureLine = `${input.myName} · ${input.partnerName} — ${signature}`;

  return {
    available: true,
    signatureLine,
    insightLines: [],
  };
}
