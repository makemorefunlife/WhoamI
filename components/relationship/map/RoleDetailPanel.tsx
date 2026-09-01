"use client";

import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import RolePlanetIcon from "./RolePlanetIcon";
import RolePlanetShape from "./RolePlanetShape";
import { hubPanelClass } from "@/components/relationship/hub/relationHubStyles";
import type { PlanetVisual } from "@/lib/relationship/map/planetVisuals";
import type { RelationshipRoleDefinition } from "@/lib/relationship/map/relationshipRoleSsot";
import { roleDescription, roleLabel } from "@/lib/relationship/map/roleLocale";
import { useLocale } from "@/lib/i18n/LocaleProvider";

/**
 * Role info card — spec section 22. Purely presentational: the people
 * themselves are scattered directly on the map by ScatteredPeopleField, not
 * listed here (see RelationshipMapSection, which owns the people fetch).
 */
export default function RoleDetailPanel({
  role,
  visual,
  count,
  onBack,
}: {
  role: RelationshipRoleDefinition;
  visual: PlanetVisual;
  count: number;
  onBack: () => void;
}) {
  const { locale, messages } = useLocale();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${hubPanelClass()} space-y-3 p-5`}
    >
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1 text-xs font-medium text-on-surface-variant hover:text-primary"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        {messages.cta.back}
      </button>

      <div className="flex items-start gap-3">
        <span className="relative flex h-14 w-14 shrink-0 items-center justify-center">
          <RolePlanetShape roleId={role.roleId} visual={visual} />
          <RolePlanetIcon icon={role.icon} className="absolute h-[38%] w-[38%] text-primary/75" />
        </span>
        <div>
          <h3 className="stitch-headline text-lg text-primary">{roleLabel(role, locale)}</h3>
          <p className="text-xs text-on-surface-variant">
            {messages.relationshipMap.personCount(count)}
          </p>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-on-surface-variant">
        {roleDescription(role, locale)}
      </p>
    </motion.div>
  );
}
