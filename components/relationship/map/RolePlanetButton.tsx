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
  onSelect: () => void;
  style?: CSSProperties;
}) {
  const size = planetDiameterPx(count);
  const faint = count === 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={ariaLabel}
      aria-pressed={selected}
      className="absolute flex min-w-[52px] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 rounded-2xl p-1.5 transition hover:scale-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 active:scale-95"
      style={style}
    >
      <span
        className={`relative flex items-center justify-center rounded-full transition ${
          selected ? "ring-2 ring-primary ring-offset-2 ring-offset-surface" : ""
        }`}
        style={{ width: size, height: size }}
      >
        <RolePlanetShape roleId={role.roleId} visual={visual} faint={faint} />
        <RolePlanetIcon
          icon={role.icon}
          className={`absolute h-[38%] w-[38%] ${faint ? "text-on-surface-variant/50" : "text-primary/75"}`}
        />
      </span>
      <span
        className={`max-w-[5.5rem] truncate text-center text-[11px] font-semibold ${
          faint ? "text-on-surface-variant/55" : "text-primary"
        }`}
      >
        {label}
      </span>
      <span className={`text-[10px] leading-none ${faint ? "text-on-surface-variant/45" : "text-on-surface-variant"}`}>
        {countLabel}
      </span>
    </button>
  );
}
