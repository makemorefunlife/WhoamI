"use client";

import { motion, useReducedMotion } from "framer-motion";
import { scatterPositions } from "@/lib/relationship/map/scatterPositions";
import type { RoleDetailPerson } from "@/lib/relationship/map/roleDetailPerson";
import { MAP_Z } from "@/lib/relationship/map/mapZIndex";

const OVERFLOW_KEY = "__overflow__";
/** Quiet, hand-drawn marker — deliberately not an emoji (spec: no AI-looking sparkle stickers). */
export const PERSON_LABEL_MARKER = "◊";

/**
 * People revealed under a selected role, scattered around the selected
 * planet like a small constellation instead of listed in a menu — first
 * moment names become visible (spec section 22-23). Positions are
 * deterministic per person key (see scatterPositions) so they don't jump
 * around on re-render. Styled as soft starlight labels: translucent cream,
 * thin border, a quiet ◊ marker, gentle CSS-only glow — no decorative
 * sparkle/emoji, the light comes from styling, not iconography.
 */
export default function ScatteredPeopleField({
  people,
  overflowCount,
  center,
  onSelectPerson,
}: {
  people: RoleDetailPerson[];
  /** How many more exist beyond what's rendered here (favorites-first, capped — see selectDisplayedPeople). */
  overflowCount: number;
  center: { xPct: number; yPct: number };
  onSelectPerson: (person: RoleDetailPerson) => void;
}) {
  const reduceMotion = useReducedMotion();
  const keys = people.map((p) => p.key);
  if (overflowCount > 0) keys.push(OVERFLOW_KEY);

  const points = scatterPositions(keys, {
    minRadiusPct: 14,
    maxRadiusPct: people.length <= 5 ? 26 : people.length <= 15 ? 34 : 40,
    minDistancePct: 9,
  });
  const pointByKey = new Map(points.map((p) => [p.key, p]));

  const dense = people.length > 16;
  const textClass = dense ? "text-[10px]" : people.length > 8 ? "text-[11px]" : "text-xs";

  function place(point: { leftPct: number; topPct: number } | undefined) {
    if (!point) return { left: `${center.xPct}%`, top: `${center.yPct}%` };
    // point is in 0-100 space around a virtual (50,50) origin — recenter on the selected planet.
    const left = center.xPct + (point.leftPct - 50);
    const top = center.yPct + (point.topPct - 50);
    return {
      left: `${Math.min(94, Math.max(6, left))}%`,
      top: `${Math.min(94, Math.max(6, top))}%`,
    };
  }

  const initial = reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.5 };
  const animate = reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 };

  return (
    <>
      {people.map((person, i) => (
        <motion.button
          key={person.key}
          type="button"
          onClick={() => onSelectPerson(person)}
          initial={initial}
          animate={animate}
          transition={{ delay: reduceMotion ? 0 : Math.min(i, 20) * 0.02, duration: 0.2 }}
          className={`absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full border border-secondary/35 bg-surface/75 px-2.5 py-1 font-medium text-primary shadow-[0_0_10px_rgba(122,168,116,0.25)] backdrop-blur-[2px] transition hover:border-secondary/60 hover:bg-surface active:scale-95 ${textClass}`}
          style={{ ...place(pointByKey.get(person.key)), zIndex: MAP_Z.scatteredPerson }}
        >
          <span className="text-secondary" aria-hidden="true">
            {PERSON_LABEL_MARKER}
          </span>
          {person.name}
        </motion.button>
      ))}

      {overflowCount > 0 ? (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: reduceMotion ? 0 : Math.min(people.length, 20) * 0.02 }}
          className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-outline-variant/50 bg-surface/60 px-2.5 py-1 font-medium text-on-surface-variant ${textClass}`}
          style={{ ...place(pointByKey.get(OVERFLOW_KEY)), zIndex: MAP_Z.scatteredPerson }}
        >
          +{overflowCount}
        </motion.span>
      ) : null}
    </>
  );
}
