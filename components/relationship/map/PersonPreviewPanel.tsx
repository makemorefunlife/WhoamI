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
 * the full paid analysis: it only states the free role + description, with
 * a button into the existing analysis chooser for anything deeper. The
 * underlying computation is Day-Master-based, but that's internal — the
 * user-facing copy never names the technical method (final UX pass
 * section 12).
 */
export default function PersonPreviewPanel({
  personName,
  role,
  visual,
  onBack,
  onExplore,
  onExploreFree,
  reciprocalRole,
  reciprocalVisual,
}: {
  personName: string;
  role: RelationshipRoleDefinition;
  visual: PlanetVisual;
  onBack: () => void;
  onExplore: () => void;
  /**
   * Relationship Discovery Flow — Only passed for the person the map was
   * opened to focus on (see RelationshipMapSection's
   * `focusRelationshipReportId`). Leads to the existing free (birth-data-
   * only) relationship analysis route. Ordinary map browsing (any other
   * click) never passes this.
   */
  onExploreFree?: () => void;
  /**
   * Relationship Discovery Flow — the reverse-direction role ("what am I,
   * to them"), only passed together with onExploreFree for the focused
   * person. When present, both directions are shown together on this one
   * screen instead of holding the second one back behind a click -- see
   * the "don't hide information to force a click" principle in the
   * Discovery Flow spec. When absent (ordinary map browsing, or the
   * reciprocal role couldn't be computed), the panel falls back to the
   * original single-direction layout below, unchanged.
   */
  reciprocalRole?: RelationshipRoleDefinition;
  reciprocalVisual?: PlanetVisual;
}) {
  const { locale, messages } = useLocale();
  const dualDirection = Boolean(onExploreFree && reciprocalRole && reciprocalVisual);

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

      {dualDirection ? (
        <>
          <p className="text-sm font-semibold text-primary">
            {messages.relationshipMap.discoveryBothRolesTitle}
          </p>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="relative flex h-14 w-14 shrink-0 items-center justify-center">
                <RolePlanetShape roleId={role.roleId} visual={visual} />
                <RolePlanetIcon icon={role.icon} className="absolute h-[38%] w-[38%] text-primary/75" />
              </span>
              <div>
                <h3 className="stitch-headline text-lg text-primary">{personName}</h3>
                <p className="text-xs font-semibold text-secondary">
                  {messages.relationshipMap.discoveryOtherRoleSentence(
                    personName,
                    roleLabel(role, locale),
                  )}
                </p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-on-surface-variant">
              {roleDescription(role, locale)}
            </p>
          </div>

          <div className="space-y-3 border-t border-outline-variant/30 pt-4">
            <div className="flex items-center gap-3">
              <span className="relative flex h-14 w-14 shrink-0 items-center justify-center">
                <RolePlanetShape roleId={reciprocalRole!.roleId} visual={reciprocalVisual!} />
                <RolePlanetIcon
                  icon={reciprocalRole!.icon}
                  className="absolute h-[38%] w-[38%] text-primary/75"
                />
              </span>
              <p className="text-xs font-semibold text-secondary">
                {messages.relationshipMap.discoveryViewerRoleSentence(
                  personName,
                  roleLabel(reciprocalRole!, locale),
                )}
              </p>
            </div>
            <p className="text-sm leading-relaxed text-on-surface-variant">
              {roleDescription(reciprocalRole!, locale)}
            </p>
          </div>

          <button type="button" onClick={onExploreFree} className={hubTouchBtn(true)}>
            {messages.relationshipMap.discoveryFreeAnalysisCta}
          </button>

          <button type="button" onClick={onExplore} className={hubTouchBtn(false)}>
            {messages.relationshipMap.exploreRelationshipCta}
          </button>
        </>
      ) : (
        <>
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

          <button type="button" onClick={onExplore} className={hubTouchBtn(true)}>
            {messages.relationshipMap.exploreRelationshipCta}
          </button>

          {onExploreFree ? (
            <div className="space-y-2 border-t border-outline-variant/30 pt-4">
              <p className="text-sm leading-relaxed text-on-surface-variant">
                {messages.relationshipMap.discoveryFreeAnalysisPrompt(personName)}
              </p>
              <button
                type="button"
                onClick={onExploreFree}
                className={hubTouchBtn(false)}
              >
                {messages.relationshipMap.discoveryFreeAnalysisCta}
              </button>
            </div>
          ) : null}
        </>
      )}
    </motion.div>
  );
}
