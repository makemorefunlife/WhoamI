/**
 * Phase 6-2d7 — Bind dialogue_table faster/slower slots to expression_speed.direction.
 *
 * Server direction assigns speaker identity + display label.
 * LLM may only supply wording inside those slots.
 * Balanced / missing direction → leave rows unchanged (safe fallback).
 * Does not recompute expression_speed. Does not parse line prose for authority.
 */
import type { ExpressionSpeedDirection } from "@/lib/relationship/romanticRules/relationshipDynamics";

export type DialogueTableRowLike = {
  speaker?: string;
  label?: string;
  bad_line?: string;
  good_line?: string;
  line?: string;
  emoji?: string;
  [key: string]: unknown;
};

function normalizeSpeaker(row: DialogueTableRowLike): "A" | "B" | null {
  const raw = String(row.speaker ?? "")
    .trim()
    .toUpperCase();
  if (raw === "A" || raw === "B") return raw;
  return null;
}

function cloneRow(row: DialogueTableRowLike): DialogueTableRowLike {
  return { ...row };
}

function withSlotIdentity(
  row: DialogueTableRowLike,
  speaker: "A" | "B",
  label: string,
): DialogueTableRowLike {
  return {
    ...cloneRow(row),
    speaker,
    label,
  };
}

/**
 * Reorder + force speaker/label from server direction.
 * Returns a new array; never mutates input.
 */
export function bindDialogueTableToExpressionSpeed(
  rows: ReadonlyArray<DialogueTableRowLike> | null | undefined,
  direction: ExpressionSpeedDirection | null | undefined,
  names: { nameA: string; nameB: string },
): DialogueTableRowLike[] {
  const list = Array.isArray(rows) ? rows.map(cloneRow) : [];
  if (list.length === 0) return list;

  if (!direction || direction === "balanced") {
    return list;
  }

  const bySpeaker = new Map<"A" | "B", DialogueTableRowLike>();
  for (const row of list) {
    const sp = normalizeSpeaker(row);
    if (sp && !bySpeaker.has(sp)) {
      bySpeaker.set(sp, row);
    }
  }

  let rowA = bySpeaker.get("A");
  let rowB = bySpeaker.get("B");

  if (!rowA || !rowB) {
    // Speakers missing/malformed — take first two content rows as A then B
    // material, then assign identities from direction (wording may be wrong,
    // but typed speaker authority is server-owned).
    const usable = list.filter((r) => {
      const label = String(r.label ?? r.speaker ?? "").trim();
      if (label === "결과" || label.startsWith("결과")) return false;
      return Boolean(
        String(r.bad_line ?? "").trim() ||
          String(r.good_line ?? "").trim() ||
          String(r.line ?? "").trim() ||
          String(r.label ?? "").trim() ||
          String(r.speaker ?? "").trim(),
      );
    });
    if (usable.length < 2) {
      return list;
    }
    rowA = usable[0];
    rowB = usable[1];
  }

  const fasterIsA = direction === "A";
  const faster = fasterIsA
    ? withSlotIdentity(rowA, "A", names.nameA)
    : withSlotIdentity(rowB, "B", names.nameB);
  const slower = fasterIsA
    ? withSlotIdentity(rowB, "B", names.nameB)
    : withSlotIdentity(rowA, "A", names.nameA);

  return [faster, slower];
}
