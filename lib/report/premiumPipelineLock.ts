import {
  runPremiumReportPipeline,
  type PremiumPipelineCallbacks,
  type PremiumPipelineResult,
} from "@/lib/report/runPremiumReportPipeline";
import type { PremiumPipelineMeta } from "@/lib/report/fetchPremiumPipelineMetaClient";

const inFlightByReportId = new Map<string, Promise<PremiumPipelineResult>>();

/** 동일 reportId에 대한 동시 파이프라인 호출을 1회로 합침 */
export function runPremiumReportPipelineOnce(
  reportId: string,
  report: Record<string, unknown>,
  interpretations: Record<string, string>,
  patterns: Record<string, string> | null,
  callbacks?: PremiumPipelineCallbacks,
  options?: { regenerate?: boolean; initialMeta?: PremiumPipelineMeta | null },
): Promise<PremiumPipelineResult> {
  const id = reportId.trim();
  if (!id) {
    return runPremiumReportPipeline(
      reportId,
      report,
      interpretations,
      patterns,
      callbacks,
      options,
    );
  }

  const existing = inFlightByReportId.get(id);
  if (existing) return existing;

  const run = runPremiumReportPipeline(
    id,
    report,
    interpretations,
    patterns,
    callbacks,
    options,
  ).finally(() => {
    if (inFlightByReportId.get(id) === run) {
      inFlightByReportId.delete(id);
    }
  });

  inFlightByReportId.set(id, run);
  return run;
}

export function clearPremiumPipelineLock(reportId: string) {
  inFlightByReportId.delete(reportId.trim());
}
