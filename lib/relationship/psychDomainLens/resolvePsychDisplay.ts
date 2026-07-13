import type { PersonCoreRelationMetaPayload } from "@/lib/personCore/mappers/buildPersonCoreRelationMeta";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { PsychMatchResult } from "@/lib/relationship/psychMatch";
import type { DomainPsychLens, DomainPsychMatchBundle } from "./types";

export type ReportPsychMeta = {
  psych_match?: PsychMatchResult | null;
  psych_lens?: DomainPsychLens | null;
  person_core?: PersonCoreRelationMetaPayload | null;
};

export function resolveReportPsychDisplay(
  meta: ReportPsychMeta | undefined,
  buildBundle: (
    psychA: PsychMasterJson,
    psychB: PsychMasterJson,
  ) => DomainPsychMatchBundle | null,
): DomainPsychMatchBundle | null {
  if (meta?.psych_match && meta.psych_lens) {
    return {
      psych_match: meta.psych_match,
      psych_lens: meta.psych_lens,
    };
  }
  if (meta?.psych_match) {
    const pc = meta.person_core;
    if (pc?.psych_a && pc?.psych_b) {
      const built = buildBundle(pc.psych_a, pc.psych_b);
      if (built) {
        return {
          psych_match: meta.psych_match,
          psych_lens: built.psych_lens,
        };
      }
    }
    return null;
  }
  const pc = meta?.person_core;
  if (pc?.psych_a && pc?.psych_b) {
    return buildBundle(pc.psych_a, pc.psych_b);
  }
  return null;
}

export function swapPsychAxisForViewer<
  T extends { score_a: number; score_b: number },
>(axisResults: T[], viewerIsReportA: boolean): T[] {
  if (viewerIsReportA) return axisResults;
  return axisResults.map((row) => ({
    ...row,
    score_a: row.score_b,
    score_b: row.score_a,
  }));
}
