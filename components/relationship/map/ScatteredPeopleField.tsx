"use client";

import { motion } from "framer-motion";
import { scatterPositions } from "@/lib/relationship/map/scatterPositions";
import type { RoleDetailPerson } from "@/lib/relationship/map/roleDetailPerson";

/**
 * People revealed under a selected role, scattered across the map like a
 * small star field instead of listed in a menu — first moment names become
 * visible (spec section 22-23). Positions are deterministic per person key
 * (see scatterPositions) so they don't jump around on re-render.
 */
export default function ScatteredPeopleField({
  people,
  onSelectPerson,
}: {
  people: RoleDetailPerson[];
  onSelectPerson: (person: RoleDetailPerson) => void;
}) {
  const points = scatterPositions(people.map((p) => p.key));
  const pointByKey = new Map(points.map((p) => [p.key, p]));

  const dense = people.length > 16;
  const chipClass = dense
    ? "px-2 py-1 text-[10px]"
    : people.length > 8
      ? "px-2.5 py-1.5 text-[11px]"
      : "px-3 py-1.5 text-xs";

  return (
    <>
      {people.map((person, i) => {
        const point = pointByKey.get(person.key);
        if (!point) return null;
        return (
          <motion.button
            key={person.key}
            type="button"
            onClick={() => onSelectPerson(person)}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: Math.min(i, 20) * 0.015, duration: 0.25 }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-outline-variant/45 bg-surface/90 font-medium text-primary shadow-sm backdrop-blur-[1px] transition hover:border-secondary/50 hover:bg-surface active:scale-95 ${chipClass}`}
            style={{ left: `${point.leftPct}%`, top: `${point.topPct}%` }}
          >
            {person.name}
          </motion.button>
        );
      })}
    </>
  );
}
