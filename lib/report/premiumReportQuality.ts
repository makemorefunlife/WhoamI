import { parseReportStructure } from "@/lib/report/parseReportStructure";
import { MIN_INTEGRATED_CHARS, MIN_PART_COUNT_WARNING } from "@/lib/report/premiumPipelineConfig";

export type PremiumReportQualityMetrics = {
  char_length: number;
  part_count: number;
  has_appendix: boolean;
  parse_structured: boolean;
  parse_fallback: boolean;
  too_short: boolean;
  low_part_warning: boolean;
};

export function measurePremiumReportQuality(
  content: string,
): PremiumReportQualityMetrics {
  const trimmed = content.trim();
  const char_length = trimmed.length;
  const sections = trimmed ? parseReportStructure(trimmed) : null;
  const part_count =
    sections?.filter((s) => s.kind === "part").length ?? 0;
  const has_appendix = Boolean(sections?.some((s) => s.kind === "appendix"));
  const parse_structured = Boolean(sections && sections.length > 0 && part_count > 0);
  const parse_fallback = char_length > 0 && !parse_structured;
  const too_short = char_length > 0 && char_length < MIN_INTEGRATED_CHARS;
  const low_part_warning =
    parse_structured && part_count > 0 && part_count < MIN_PART_COUNT_WARNING;

  return {
    char_length,
    part_count,
    has_appendix,
    parse_structured,
    parse_fallback,
    too_short,
    low_part_warning,
  };
}

function qualityLogEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_DEBUG_FIRST_ENTRY === "1" ||
    process.env.NEXT_PUBLIC_PREMIUM_QUALITY_LOG === "1"
  );
}

/** 품질·파싱·길이 — dev / NEXT_PUBLIC_PREMIUM_QUALITY_LOG=1 */
export function logPremiumReportQuality(
  reportId: string,
  metrics: PremiumReportQualityMetrics,
  extra?: Record<string, string | number | boolean>,
): void {
  if (!qualityLogEnabled()) return;
  console.info(`[premium-quality] reportId=${reportId}`, {
    ...metrics,
    ...extra,
  });
}

const pipelineDurations: number[] = [];
const apiFailures: { step: string; at: number }[] = [];

export function recordPremiumPipelineDuration(ms: number): void {
  pipelineDurations.push(ms);
  if (pipelineDurations.length > 50) pipelineDurations.shift();
  if (!qualityLogEnabled()) return;
  const avg =
    pipelineDurations.reduce((a, b) => a + b, 0) / pipelineDurations.length;
  console.info(`[premium-quality] pipeline_duration_ms=${Math.round(ms)} avg_ms=${Math.round(avg)} samples=${pipelineDurations.length}`);
}

export function recordPremiumApiFailure(step: string): void {
  apiFailures.push({ step, at: Date.now() });
  if (apiFailures.length > 100) apiFailures.shift();
  if (!qualityLogEnabled()) return;
  const recent = apiFailures.filter((f) => Date.now() - f.at < 3600_000);
  const rate =
    recent.length > 0
      ? `${recent.length} failures in last hour`
      : "0";
  console.warn(`[premium-quality] api_failure step=${step} ${rate}`);
}
