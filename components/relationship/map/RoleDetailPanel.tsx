"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import RolePlanetIcon from "./RolePlanetIcon";
import RolePlanetShape from "./RolePlanetShape";
import { PERSON_LABEL_MARKER } from "./ScatteredPeopleField";
import { hubPanelClass } from "@/components/relationship/hub/relationHubStyles";
import type { PlanetVisual } from "@/lib/relationship/map/planetVisuals";
import type { RelationshipRoleDefinition } from "@/lib/relationship/map/relationshipRoleSsot";
import type { RoleDetailPerson } from "@/lib/relationship/map/roleDetailPerson";
import { roleDescription, roleLabel } from "@/lib/relationship/map/roleLocale";
import { useLocale } from "@/lib/i18n/LocaleProvider";

const PAGE_SIZE = 20;

/**
 * Role info card + complete member directory — spec sections 16-18. The
 * map above shows an emotional, capped scatter; this panel is the
 * practical, complete, paginated lookup for the same role. Reuses the same
 * onSelectPerson callback the scatter view uses, so clicking a directory
 * row opens the identical Person Preview → analysis chooser path.
 */
export default function RoleDetailPanel({
  viewerReportId,
  role,
  visual,
  count,
  onBack,
  onSelectPerson,
}: {
  viewerReportId: string;
  role: RelationshipRoleDefinition;
  visual: PlanetVisual;
  count: number;
  onBack: () => void;
  onSelectPerson: (person: RoleDetailPerson) => void;
}) {
  const { locale, messages } = useLocale();
  const [people, setPeople] = useState<RoleDetailPerson[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [nextOffset, setNextOffset] = useState<number | null>(0);
  const [loading, setLoading] = useState(false);
  const epochRef = useRef(0);

  useEffect(() => {
    const epoch = ++epochRef.current;
    void (async () => {
      setPeople([]);
      setTotal(null);
      setNextOffset(0);
      if (count === 0) return;
      await loadPage(0, epoch);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role.roleId, viewerReportId]);

  async function loadPage(offset: number, epoch: number) {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/relationship/map?reportId=${encodeURIComponent(viewerReportId)}&roleId=${encodeURIComponent(role.roleId)}&directoryOffset=${offset}&directoryLimit=${PAGE_SIZE}`,
      );
      const data = await res.json().catch(() => null);
      if (epoch !== epochRef.current) return; // superseded by a newer role selection
      if (!res.ok || !data?.roleDirectory) return;
      setTotal(data.roleDirectory.total ?? null);
      setPeople((prev) =>
        offset === 0 ? data.roleDirectory.people : [...prev, ...data.roleDirectory.people],
      );
      setNextOffset(data.roleDirectory.nextOffset ?? null);
    } finally {
      if (epoch === epochRef.current) setLoading(false);
    }
  }

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

      {count > 0 ? (
        <div className="space-y-2 border-t border-outline-variant/20 pt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
            {messages.relationshipMap.roleDirectoryLabel(roleLabel(role, locale))}
          </p>
          <div className="flex flex-wrap gap-2">
            {people.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => onSelectPerson(p)}
                className="inline-flex items-center gap-1 rounded-full border border-outline-variant/40 bg-surface-container-low/60 px-3.5 py-2 text-sm font-medium text-primary transition hover:border-secondary/40 hover:bg-surface-container-low active:scale-95"
              >
                <span className="text-secondary" aria-hidden="true">
                  {PERSON_LABEL_MARKER}
                </span>
                {p.name}
              </button>
            ))}
          </div>
          {nextOffset != null ? (
            <button
              type="button"
              onClick={() => void loadPage(nextOffset, epochRef.current)}
              disabled={loading}
              className="text-sm font-medium text-secondary underline-offset-2 hover:underline disabled:opacity-50"
            >
              {loading ? "…" : messages.relationshipMap.showMoreCta((total ?? people.length) - people.length)}
            </button>
          ) : null}
        </div>
      ) : null}
    </motion.div>
  );
}
