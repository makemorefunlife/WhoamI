"use client";

import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import RolePlanetIcon from "./RolePlanetIcon";
import RolePlanetShape from "./RolePlanetShape";
import { hubPanelClass, hubTouchBtn } from "@/components/relationship/hub/relationHubStyles";
import type { PlanetVisual } from "@/lib/relationship/map/planetVisuals";
import type { RelationshipRoleDefinition } from "@/lib/relationship/map/relationshipRoleSsot";
import { roleDescription, roleLabel } from "@/lib/relationship/map/roleLocale";
import { useLocale } from "@/lib/i18n/LocaleProvider";

/**
 * First look at one connected person — spec section 25-26. Explicitly not
 * the full paid analysis: it only states the free Day-Master role plus a
 * "based on Day Masters" disclaimer, with a button into the existing
 * analysis chooser for anything deeper.
 */
export default function PersonPreviewPanel({
  personName,
  role,
  visual,
  onBack,
  onExplore,
}: {
  personName: string;
  role: RelationshipRoleDefinition;
  visual: PlanetVisual;
  onBack: () => void;
  onExplore: () => void;
}) {
  const { locale, messages } = useLocale();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${hubPanelClass()} space-y-4 p-5`}
    >
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1 text-xs font-medium text-on-surface-variant hover:text-primary"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        {messages.cta.back}
      </button>

      <div className="flex items-center gap-3">
        <span className="relative flex h-14 w-14 shrink-0 items-center justify-center">
          <RolePlanetShape roleId={role.roleId} visual={visual} />
          <RolePlanetIcon icon={role.icon} className="absolute h-[38%] w-[38%] text-primary/75" />
        </span>
        <div>
          <h3 className="stitch-headline text-lg text-primary">{personName}</h3>
          <p className="text-xs font-semibold text-secondary">
            {messages.relationshipMap.forMeLabel} {roleLabel(role, locale)}
          </p>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-on-surface-variant">
        {roleDescription(role, locale)}
      </p>

      <p className="text-[11px] uppercase tracking-wide text-on-surface-variant/70">
        {messages.relationshipMap.dayMasterDisclaimer}
      </p>

      <button type="button" onClick={onExplore} className={hubTouchBtn(true)}>
        {messages.relationshipMap.exploreRelationshipCta}
      </button>
    </motion.div>
  );
}
