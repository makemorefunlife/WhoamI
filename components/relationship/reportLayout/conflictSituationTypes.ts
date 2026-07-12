import type { DialogueTableRow } from "@/lib/prompts/relationshipPremium/romanticSajuDeep/outputSchema";

/** `section_3_conversation_patterns.conflict_situation` */
export type ConflictSituation = {
  title?: string;
  dialogue_table?: DialogueTableRow[];
};

export function normalizeDialogueRows(
  rows: DialogueTableRow[] | undefined,
): DialogueTableRow[] {
  return (rows ?? []).filter((row) => {
    const label = String(row.label ?? row.speaker ?? "").trim();
    if (!label) return Boolean(row.bad_line?.trim() || row.good_line?.trim());
    if (label === "결과" || label.startsWith("결과")) return false;
    return true;
  });
}

export function speakerLabel(row: DialogueTableRow): string {
  const label = String(row.label ?? row.speaker ?? "").trim();
  return label || "—";
}
