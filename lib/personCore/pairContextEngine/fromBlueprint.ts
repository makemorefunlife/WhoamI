/**
 * Build domain Pair CE lens from charts — shared by Friend/Family/Work contexts.
 * Does not recalculate Pair facts inside domains.
 */
import type { ChartContext } from "@/lib/saju/chartContext";
import { buildPairSajuFacts } from "../pairSaju";
import { applyDomainPairLens } from "./lenses";
import { runPairContextEngine } from "./runPairContextEngine";
import type { DomainPairLensId, DomainPairLensOutput } from "./types";

export function buildDomainPairLensFromCharts(
  domain: DomainPairLensId,
  chartA: ChartContext,
  chartB: ChartContext,
  opts?: {
    birthTimeUnknownA?: boolean;
    birthTimeUnknownB?: boolean;
    reportIdA?: string;
    reportIdB?: string;
  },
): DomainPairLensOutput {
  const facts = buildPairSajuFacts({
    chartA,
    chartB,
    birthTimeUnknownA: opts?.birthTimeUnknownA,
    birthTimeUnknownB: opts?.birthTimeUnknownB,
    reportIdA: opts?.reportIdA,
    reportIdB: opts?.reportIdB,
  });
  return applyDomainPairLens(domain, runPairContextEngine({ facts }));
}
