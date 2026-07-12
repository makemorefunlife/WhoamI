import {
  fetchRelationshipReportRowsForReportId,
  mergeRelationshipRowsFromInboundInvites,
  mergeRelationshipRowsFromOutboundInvites,
  type RelationshipReportRow,
} from "@/lib/relationship/fetchReportsWhereParticipant";
import { formatResultBasicForIntegratedContext } from "@/lib/relationship/formatResultBasicForIntegratedContext";
import { createRouteSupabaseClient } from "@/lib/supabase/serverClient";
import { hasCompletePerspectives } from "@/lib/relationship/normalizeRelationshipPerspectives";

function pickBestRelationshipRow(
  rows: RelationshipReportRow[],
  viewerReportId: string,
): RelationshipReportRow | null {
  if (rows.length === 0) return null;

  if (viewerReportId) {
    const withText = rows.filter(
      (r) =>
        formatResultBasicForIntegratedContext(r.result_basic, viewerReportId) !=
        null,
    );
    if (withText.length > 0) return withText[0]!;
  }

  const complete = rows.find((r) =>
    hasCompletePerspectives(r.result_basic, r.report_id_a, r.report_id_b),
  );
  if (complete) return complete;

  return rows[0] ?? null;
}

function resolveText(
  row: RelationshipReportRow,
  viewerReportId: string,
): string | null {
  if (viewerReportId) {
    const direct = formatResultBasicForIntegratedContext(
      row.result_basic,
      viewerReportId,
    );
    if (direct) return direct;
  }
  return (
    formatResultBasicForIntegratedContext(
      row.result_basic,
      row.report_id_a,
    ) ||
    formatResultBasicForIntegratedContext(
      row.result_basic,
      row.report_id_b,
    )
  );
}

/** `/api/relationship/generate` 와 동일 — 통합 리포트용 관계 맥락 문자열 */
export async function resolveIntegratedRelationshipText(
  reportId: string,
): Promise<string | null> {
  const id = reportId.trim();
  if (!id) return null;

  const supabase = createRouteSupabaseClient();
  if (!supabase) return null;
  let rows = await fetchRelationshipReportRowsForReportId(supabase, id);
  rows = await mergeRelationshipRowsFromOutboundInvites(supabase, id, rows);
  rows = await mergeRelationshipRowsFromInboundInvites(supabase, id, rows);

  const chosen = pickBestRelationshipRow(rows, id);
  if (!chosen) return null;
  return resolveText(chosen, id);
}
