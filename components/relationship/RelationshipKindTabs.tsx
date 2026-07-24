"use client";

import {
  RELATIONSHIP_KIND_BADGE_BASE_CLASS,
  RELATIONSHIP_KIND_BADGE_STYLES,
  relationshipKindBadgeLabel,
  relationshipKindForBadge,
  ANALYSIS_LEVEL_BADGE_STYLES,
} from "@/lib/relationship/relationshipKindBadge";
import {
  ANALYSIS_SURFACE_ORDER,
  type AnalysisSurface,
} from "@/lib/relationship/analysisSurface";
import { useMessages } from "@/lib/i18n/LocaleProvider";

export default function RelationshipKindTabs({
  value,
  onChange,
  disabled,
}: {
  value: AnalysisSurface;
  onChange: (surface: AnalysisSurface) => void;
  disabled?: boolean;
}) {
  const messages = useMessages();

  return (
    <div className="mb-4 flex flex-wrap gap-1.5">
      {ANALYSIS_SURFACE_ORDER.map((surface) => {
        const active = value === surface;
        if (surface === "basic") {
          return (
            <button
              key={surface}
              type="button"
              disabled={disabled}
              onClick={() => onChange(surface)}
              className={[
                RELATIONSHIP_KIND_BADGE_BASE_CLASS,
                ANALYSIS_LEVEL_BADGE_STYLES.basic,
                "transition active:scale-[0.98] disabled:opacity-45",
                active
                  ? "ring-2 ring-current/25 ring-offset-1 ring-offset-[#faf7f0]"
                  : "opacity-75 hover:opacity-100",
              ].join(" ")}
            >
              {messages.hub.kindPickerBasicFree}
            </button>
          );
        }
        const resolved = relationshipKindForBadge(surface);
        const color =
          resolved !== "unspecified"
            ? RELATIONSHIP_KIND_BADGE_STYLES[resolved]
            : "bg-gray-100 text-gray-600";
        return (
          <button
            key={surface}
            type="button"
            disabled={disabled}
            onClick={() => onChange(surface)}
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
