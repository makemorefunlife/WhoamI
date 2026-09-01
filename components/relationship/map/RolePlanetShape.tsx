import { buildWobbleBlobPath, type PlanetVisual } from "@/lib/relationship/map/planetVisuals";
import type { RelationshipRoleId } from "@/lib/relationship/map/relationshipRoleSsot";

/**
 * The planet's soft crayon-filled, lightly hand-sketched body. Each role
 * gets a distinct silhouette (ring, moon, spots, stripes, twin-blob,
 * jagged...) so the map never reads as ten identical colored circles — see
 * relationship-map spec section 5.
 */
export default function RolePlanetShape({
  roleId,
  visual,
  faint = false,
}: {
  roleId: RelationshipRoleId;
  visual: PlanetVisual;
  faint?: boolean;
}) {
  const { silhouette, stroke } = visual;
  const fill = faint ? visual.fillSoft : visual.fill;
  const opacity = faint ? 0.55 : 1;

  const bodyPath =
    silhouette === "sketchy"
      ? buildWobbleBlobPath(roleId, { points: 9, jitter: 0.15 })
      : silhouette === "jagged"
        ? buildWobbleBlobPath(roleId, { points: 10, jitter: 0.4, spiky: true })
        : buildWobbleBlobPath(roleId);

  return (
    <svg viewBox="-1.6 -1.6 3.2 3.2" className="h-full w-full" style={{ opacity }} aria-hidden="true">
      {silhouette === "ring" ? (
        <ellipse
          cx="0"
          cy="0"
          rx="1.42"
          ry="0.48"
          fill="none"
          stroke={stroke}
          strokeWidth={0.05}
          opacity={0.55}
          transform="rotate(-16)"
        />
      ) : null}

      {silhouette === "atmosphere" ? (
        <path d={bodyPath} fill={fill} opacity={0.32} transform="scale(1.24)" />
      ) : null}

      {silhouette === "double" ? (
        <path
          d={bodyPath}
          fill={fill}
          stroke={stroke}
          strokeWidth={0.055}
          vectorEffect="non-scaling-stroke"
          opacity={0.7}
          transform="translate(0.6, 0.18) scale(0.68)"
        />
      ) : null}

      <path
        d={bodyPath}
        fill={fill}
        stroke={stroke}
        strokeWidth={0.06}
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        transform={silhouette === "oval-moons" ? "scale(1.16, 0.86)" : undefined}
      />

      {silhouette === "spots" ? (
        <>
          <circle cx="-0.4" cy="-0.25" r="0.16" fill={stroke} opacity={0.28} />
          <circle cx="0.35" cy="0.18" r="0.11" fill={stroke} opacity={0.26} />
          <circle cx="-0.08" cy="0.5" r="0.09" fill={stroke} opacity={0.22} />
        </>
      ) : null}

      {silhouette === "stripes" ? (
        <>
          <path d="M -1 -0.32 Q 0 -0.14 1 -0.32" fill="none" stroke={stroke} strokeWidth={0.05} opacity={0.4} />
          <path d="M -1 0.18 Q 0 0.36 1 0.18" fill="none" stroke={stroke} strokeWidth={0.05} opacity={0.4} />
        </>
      ) : null}

      {silhouette === "moon" ? (
        <circle cx="1.18" cy="0.72" r="0.22" fill={fill} stroke={stroke} strokeWidth={0.05} vectorEffect="non-scaling-stroke" />
      ) : null}

      {silhouette === "oval-moons" ? (
        <>
          <circle cx="1.08" cy="-0.6" r="0.16" fill={fill} stroke={stroke} strokeWidth={0.045} vectorEffect="non-scaling-stroke" />
          <circle cx="-1.08" cy="0.56" r="0.11" fill={fill} stroke={stroke} strokeWidth={0.04} vectorEffect="non-scaling-stroke" />
        </>
      ) : null}
    </svg>
  );
}
