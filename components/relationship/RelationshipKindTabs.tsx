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
      ? "border-[#ffd6a5]/50 bg-[#ffd6a5]/15 text-[#ffd6a5]"
      : "border-white/12 bg-transparent text-white/55 hover:border-white/25",
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
