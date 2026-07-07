"use client";

import {
  RELATIONSHIP_KINDS,
  RELATIONSHIP_KIND_LABELS,
  type RelationshipKind,
} from "@/lib/relationship/relationshipKind";

const tabBtn = (active: boolean) =>
  [
    "flex-1 rounded-lg border px-2 py-2 text-xs font-medium transition",
    active
      ? "border-secondary/50 bg-secondary/15 text-primary"
      : "border-outline-variant/40 bg-surface-container-low/60 text-on-surface-variant hover:border-secondary/35 hover:bg-secondary/8",
  ].join(" ");

export default function RelationshipKindTabs({
  value,
  onChange,
  disabled,
}: {
  value: RelationshipKind;
  onChange: (kind: RelationshipKind) => void;
  disabled?: boolean;
}) {
  return (
    <div className="mb-4 flex gap-1.5">
      {RELATIONSHIP_KINDS.map((kind) => (
        <button
          key={kind}
          type="button"
          disabled={disabled}
          className={tabBtn(value === kind)}
          onClick={() => onChange(kind)}
        >
          {RELATIONSHIP_KIND_LABELS[kind]}
        </button>
      ))}
    </div>
  );
}
