"use client";

import type { CSSProperties } from "react";
import RolePlanetIcon from "./RolePlanetIcon";
import RolePlanetShape from "./RolePlanetShape";
import { planetDiameterPx, type PlanetVisual } from "@/lib/relationship/map/planetVisuals";
import type { RelationshipRoleDefinition } from "@/lib/relationship/map/relationshipRoleSsot";

export default function RolePlanetButton({
  role,
  visual,
  count,
  label,
  countLabel,
  ariaLabel,
  selected,
  loading = false,
  onSelect,
  style,
}: {
  role: RelationshipRoleDefinition;
  visual: PlanetVisual;
  count: number;
  label: string;
  countLabel: string;
  ariaLabel: string;
  selected: boolean;
  /** Summary hasn't loaded yet — show a shimmer instead of a real (momentarily-wrong) "0". */
  loading?: boolean;
  onSelect: () => void;
  style?: CSSProperties;
}) {
  const size = planetDiameterPx(count);
  const faint = !loading && count === 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={loading ? label : ariaLabel}
      aria-pressed={selected}
      aria-busy={loading}
      className="absolute flex min-w-[52px] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 rounded-2xl p-1.5 transition hover:scale-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 active:scale-95"
      style={style}
    >
      <span
        className={`relative flex items-center justify-center rounded-full transition-transform duration-300 ${
          selected ? "scale-125" : ""
        }`}
        style={{ width: size, height: size }}
      >
        {selected ? (
          <span
            aria-hidden="true"
            className="absolute inset-[-45%] rounded-full"
            style={{
              background: `radial-gradient(circle, ${visual.fill}66 0%, ${visual.fill}22 55%, transparent 78%)`,
            }}
          />
        ) : null}
        <span
          className={`relative flex h-full w-full items-center justify-center rounded-full transition ${
            selected ? "ring-2 ring-primary ring-offset-2 ring-offset-surface" : ""
          }`}
        >
          <RolePlanetShape roleId={role.roleId} visual={visual} faint={faint} />
          <RolePlanetIcon
            icon={role.icon}
            className={`absolute h-[38%] w-[38%] ${faint ? "text-on-surface-variant/50" : "text-primary/75"}`}
          />
        </span>
      </span>
      <span
        className={`max-w-[5.5rem] truncate text-center text-[11px] font-semibold ${
          faint ? "text-on-surface-variant/55" : "text-primary"
        }`}
      >
        {label}
      </span>
      {loading ? (
        <span
          aria-hidden="true"
          className="h-[10px] w-6 animate-pulse rounded-full bg-outline-variant/40"
        />
      ) : (
        <span className={`text-[10px] leading-none ${faint ? "text-on-surface-variant/45" : "text-on-surface-variant"}`}>
          {countLabel}
        </span>
      )}
    </button>
  );
}
