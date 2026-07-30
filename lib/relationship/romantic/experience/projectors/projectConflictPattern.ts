/**
 * M7 Conflict Translation projector.
 * Dialogue rows + expression_speed binding. bad→said, good→better.
 * meant/heard left null in B2 (no invention).
 * cross_chart_tension (충/형/파/해) adds structural Saju evidence and can
 * only raise confidence one step — it never supplies row text.
 */
import type { RomanticSajuDeepReport } from "@/lib/prompts/relationshipPremium/romanticSajuDeep/outputSchema";
import { bindDialogueTableToExpressionSpeed } from "@/lib/relationship/romantic/romanticDialogueTableBinding";
import { readRomanticExpressionSpeedCanonicalProjection } from "@/lib/relationship/romantic/romanticExpressionSpeedCanonical";
import { readRomanticCrossChartTensionCanonicalProjection } from "@/lib/relationship/romantic/romanticCrossChartTensionCanonical";
import type {
  ConfidenceLevel,
  ConflictDialogueRowVM,
  ConflictTranslationVM,
  EvidenceRef,
} from "../romanticExperienceTypes";
import { emptyConflictTranslation } from "./_empty";

export type ProjectConflictPatternInput = {
  report: RomanticSajuDeepReport["report"];
  nameA: string;
  nameB: string;
  myName: string;
  partnerName: string;
  viewerIsReportA: boolean;
};

function trimOrNull(value: string | undefined | null): string | null {
  const t = typeof value === "string" ? value.trim() : "";
  return t ? t : null;
}

/**
 * Availability: ≥1 dialogue row with said or better text after binding.
 */
export function projectConflictPattern(
  input: ProjectConflictPatternInput,
): ConflictTranslationVM {
  const base = emptyConflictTranslation();
  const s3 = (input.report.section_3_conversation_patterns ?? {}) as Record<
    string,
    unknown
  >;
  const conflict = s3.conflict_situation as
    | {
        title?: string;
        dialogue_table?: Array<Record<string, unknown>>;
      }
    | undefined;

  const rawRows = Array.isArray(conflict?.dialogue_table)
    ? conflict!.dialogue_table!
    : [];
  const expression = readRomanticExpressionSpeedCanonicalProjection(
    input.report,
  );
  const tension = readRomanticCrossChartTensionCanonicalProjection(
    input.report,
  );
  const bound = bindDialogueTableToExpressionSpeed(
    rawRows,
    expression?.direction ?? null,
    { nameA: input.nameA, nameB: input.nameB },
  );

  const rows: ConflictDialogueRowVM[] = [];
  for (const row of bound) {
    const speaker = String(row.speaker ?? "")
      .trim()
      .toUpperCase();
    let speakerLabel = trimOrNull(
      typeof row.label === "string" ? row.label : null,
    );
    if (!speakerLabel) {
      if (speaker === "A") speakerLabel = input.nameA;
      else if (speaker === "B") speakerLabel = input.nameB;
      else speakerLabel = "—";
    }
    if (speaker === "A") {
      speakerLabel = input.viewerIsReportA ? input.myName : input.partnerName;
    } else if (speaker === "B") {
      speakerLabel = input.viewerIsReportA ? input.partnerName : input.myName;
    }

    const said = trimOrNull(
      typeof row.bad_line === "string" ? row.bad_line : null,
    );
    const better = trimOrNull(
      typeof row.good_line === "string" ? row.good_line : null,
    );
    if (!said && !better) continue;
    rows.push({
      speakerLabel,
      said,
      meant: null,
      heard: null,
      better,
    });
  }

  if (rows.length === 0) return base;

  const situationTitle = trimOrNull(conflict?.title);
  const evidence: EvidenceRef[] = [
    {
      path: "section_3_conversation_patterns.conflict_situation.dialogue_table",
      summary: "conflict dialogue rows",
    },
  ];
  if (expression?.direction) {
    evidence.push({
      path: "canonical_projections.expression_speed",
      summary: "expression speed direction",
    });
  }
  if (tension && tension.band !== "none") {
    evidence.push({
      path: "canonical_projections.cross_chart_tension",
      summary: "cross-chart structural tension (충/형/파/해)",
    });
  }

  let confidence: ConfidenceLevel = "medium";
  if (expression?.direction && expression.direction !== "balanced") {
    confidence =
      expression.confidence === "high"
        ? "high"
        : expression.confidence === "low"
          ? "low"
          : "medium";
  } else if (!expression) {
    confidence = "low";
  }
  // Structural cross-chart tension corroborates (never invents) the read —
  // it can only raise confidence one step, never lower it or set it alone.
  if (tension?.band === "high") {
    if (confidence === "low") confidence = "medium";
    else if (confidence === "medium") confidence = "high";
  }

  return {
    ...base,
    title: "Conflict Translation",
    available: true,
    confidence,
    evidence,
    situationTitle,
    rows,
  };
}
