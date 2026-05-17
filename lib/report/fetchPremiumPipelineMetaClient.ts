export type PremiumPipelineMeta = {
  basic_result: string | null;
  premium_result: string | null;
  detailed_survey_result: string | null;
  astrology_result: string | null;
  astrology_location_key: string | null;
  integrated_from_db: boolean;
  detailed_survey_from_db: boolean;
  astrology_from_db: boolean;
};

export type FetchPremiumPipelineMetaResult =
  | { status: "ok"; meta: PremiumPipelineMeta }
  | { status: "not_premium" }
  | { status: "error" };

/**
 * premium 파이프라인용 — GET /api/my/report?quick=1 (LLM 없음)
 */
export async function fetchPremiumPipelineMetaClient(
  reportId: string,
  options?: { regenerate?: boolean },
): Promise<FetchPremiumPipelineMetaResult> {
  const id = reportId.trim();
  if (!id) return { status: "error" };

  const qs = new URLSearchParams({ reportId: id, quick: "1" });
  if (options?.regenerate) {
    qs.set("regenerateIntegrated", "1");
  }

  try {
    const res = await fetch(`/api/my/report?${qs.toString()}`);
    if (!res.ok) return { status: "error" };
    const body = (await res.json()) as PremiumPipelineMeta & {
      has_premium?: boolean;
    };
    if (!body.has_premium) return { status: "not_premium" };
    return {
      status: "ok",
      meta: {
        basic_result: body.basic_result?.trim() || null,
        premium_result: body.premium_result?.trim() || null,
        detailed_survey_result: body.detailed_survey_result?.trim() || null,
        astrology_result: body.astrology_result?.trim() || null,
        astrology_location_key: body.astrology_location_key?.trim() || null,
        integrated_from_db: Boolean(body.integrated_from_db),
        detailed_survey_from_db: Boolean(body.detailed_survey_from_db),
        astrology_from_db: Boolean(body.astrology_from_db),
      },
    };
  } catch {
    return { status: "error" };
  }
}

/** @deprecated 호환 — ok일 때만 meta, 아니면 null */
export async function fetchPremiumPipelineMetaOrNull(
  reportId: string,
  options?: { regenerate?: boolean },
): Promise<PremiumPipelineMeta | null> {
  const result = await fetchPremiumPipelineMetaClient(reportId, options);
  return result.status === "ok" ? result.meta : null;
}
