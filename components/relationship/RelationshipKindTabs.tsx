"use client";

import {
  RELATIONSHIP_KIND_BADGE_BASE_CLASS,
  RELATIONSHIP_KIND_BADGE_STYLES,
  relationshipKindBadgeLabel,
  relationshipKindForBadge,
} from "@/lib/relationship/relationshipKindBadge";
import {
  RELATIONSHIP_KINDS,
  type RelationshipKind,
} from "@/lib/relationship/relationshipKind";

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
    <div className="mb-4 flex flex-wrap gap-1.5">
      {RELATIONSHIP_KINDS.map((kind) => {
        const active = value === kind;
        const resolved = relationshipKindForBadge(kind);
        const color =
          resolved !== "unspecified"
            ? RELATIONSHIP_KIND_BADGE_STYLES[resolved]
            : "bg-gray-100 text-gray-600";
        return (
          <button
            key={kind}
            type="button"
            disabled={disabled}
            onClick={() => onChange(kind)}
            className={[
              RELATIONSHIP_KIND_BADGE_BASE_CLASS,
              color,
              "transition active:scale-[0.98] disabled:opacity-45",
              active
                ? "ring-2 ring-current/25 ring-offset-1 ring-offset-[#faf7f0]"
                : "opacity-75 hover:opacity-100",
            ].join(" ")}
          >
            {relationshipKindBadgeLabel(resolved)}
          </button>
        );
      })}
    </div>
  );
}
