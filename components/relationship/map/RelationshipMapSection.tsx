"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import RelationshipSunCenter from "./RelationshipSunCenter";
import RolePlanetButton from "./RolePlanetButton";
import RoleDetailPanel from "./RoleDetailPanel";
import ScatteredPeopleField from "./ScatteredPeopleField";
import PersonPreviewPanel from "./PersonPreviewPanel";
import MapShareButton from "./MapShareButton";
import type { RoleDetailPerson } from "@/lib/relationship/map/roleDetailPerson";
import { PLANET_VISUALS } from "@/lib/relationship/map/planetVisuals";
import {
  RELATIONSHIP_ROLES,
  getRelationshipRoleById,
  type RelationshipRoleId,
} from "@/lib/relationship/map/relationshipRoleSsot";
import { roleLabel } from "@/lib/relationship/map/roleLocale";
import { useLocale } from "@/lib/i18n/LocaleProvider";

type RoleSummary = { roleId: RelationshipRoleId; tenGod: string; count: number };

function orbitPosition(angleDeg: number, radiusFraction: number) {
  const rad = (angleDeg * Math.PI) / 180;
  const spread = 38; // % — keeps every planet's own box inside the square container
  return {
    left: `${50 + radiusFraction * spread * Math.sin(rad)}%`,
    top: `${50 - radiusFraction * spread * Math.cos(rad)}%`,
  };
}

/**
 * "My Relationship Map" — sits at the top of the Relationship Lab, above the
 * existing friend list. Default view never shows names (spec section 2, 7);
 * a role is only revealed as people once the map owner clicks its planet.
 */
export default function RelationshipMapSection({
  viewerReportId,
  onInvite,
  onExploreRelationship,
}: {
  viewerReportId: string;
  onInvite: () => void;
  onExploreRelationship: (relationshipReportId: string, partnerName: string) => void;
}) {
  const { locale, messages } = useLocale();
  const [roles, setRoles] = useState<RoleSummary[] | null>(null);
  const [totalPeople, setTotalPeople] = useState(0);
  const [selectedRoleId, setSelectedRoleId] = useState<RelationshipRoleId | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<RoleDetailPerson | null>(null);
  const [rolePeople, setRolePeople] = useState<RoleDetailPerson[] | null>(null);
  const roleEpochRef = useRef(0);

  useEffect(() => {
    const epoch = ++roleEpochRef.current;
    void (async () => {
      setRolePeople(null);
      if (!selectedRoleId || !viewerReportId) return;
      try {
        const res = await fetch(
          `/api/relationship/map?reportId=${encodeURIComponent(viewerReportId)}&roleId=${encodeURIComponent(selectedRoleId)}`,
        );
        const data = await res.json().catch(() => null);
        if (epoch !== roleEpochRef.current) return; // a newer role selection superseded this one
        if (!res.ok || !data?.rolePeople) return;
        setRolePeople(data.rolePeople.people ?? []);
      } catch {
        if (epoch === roleEpochRef.current) setRolePeople([]);
      }
    })();
  }, [selectedRoleId, viewerReportId]);

  useEffect(() => {
    if (!viewerReportId) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(
          `/api/relationship/map?reportId=${encodeURIComponent(viewerReportId)}`,
        );
        const data = await res.json().catch(() => null);
        if (cancelled || !res.ok || !data) return;
        setRoles(data.roles ?? []);
        setTotalPeople(data.totalPeople ?? 0);
      } catch {
        // Best-effort — the map is a visualization layer; the friend list below still works.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [viewerReportId]);

  const countByRole = new Map<RelationshipRoleId, number>(
    (roles ?? RELATIONSHIP_ROLES.map((r) => ({ roleId: r.roleId, tenGod: r.tenGod, count: 0 }))).map(
      (r) => [r.roleId, r.count],
    ),
  );

  const selectedRole = selectedRoleId ? getRelationshipRoleById(selectedRoleId) : undefined;
  const isEmpty = roles != null && totalPeople === 0;

  function selectRole(roleId: RelationshipRoleId) {
    setSelectedPerson(null);
    setSelectedRoleId((prev) => (prev === roleId ? null : roleId));
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="stitch-headline text-xl text-primary">{messages.relationshipMap.title}</h2>
        <p className="mt-1 text-sm text-on-surface-variant">{messages.relationshipMap.subtitle}</p>
      </div>

      {!isEmpty && roles ? <MapShareButton summary={{ totalPeople, roles }} /> : null}

      <div className="relative mx-auto aspect-square w-full max-w-[26rem]">
        <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
          <circle cx="50%" cy="50%" r="30%" fill="none" stroke="#d8cba0" strokeWidth={1} strokeDasharray="2 6" opacity={0.5} />
          <circle cx="50%" cy="50%" r="42%" fill="none" stroke="#d8cba0" strokeWidth={1} strokeDasharray="2 7" opacity={0.35} />
          {[
            [12, 10], [88, 18], [8, 62], [92, 70], [50, 4], [20, 90], [78, 92],
          ].map(([x, y], i) => (
            <circle key={i} cx={`${x}%`} cy={`${y}%`} r={1.2} fill="#e2b96a" opacity={0.6} />
          ))}
        </svg>

        <RelationshipSunCenter label={messages.relationshipMap.meLabel} />

        {RELATIONSHIP_ROLES.map((role) => {
          const visual = PLANET_VISUALS[role.roleId];
          const count = countByRole.get(role.roleId) ?? 0;
          const label = roleLabel(role, locale);
          const countLabel = messages.relationshipMap.personCount(count);
          const isOtherRoleSelected = selectedRoleId != null && selectedRoleId !== role.roleId;
          return (
            <RolePlanetButton
              key={role.roleId}
              role={role}
              visual={visual}
              count={count}
              label={label}
              countLabel={countLabel}
              ariaLabel={messages.relationshipMap.ariaRolePlanet(label, countLabel)}
              selected={selectedRoleId === role.roleId}
              onSelect={() => selectRole(role.roleId)}
              style={{
                ...orbitPosition(visual.angleDeg, visual.radiusFraction),
                opacity: isOtherRoleSelected ? 0.25 : 1,
              }}
            />
          );
        })}

        {selectedRoleId && rolePeople && !selectedPerson ? (
          <ScatteredPeopleField people={rolePeople} onSelectPerson={setSelectedPerson} />
        ) : null}
      </div>

      {isEmpty ? (
        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low/50 p-5 text-center">
          <p className="text-sm text-on-surface-variant">{messages.relationshipMap.emptyTitle}</p>
          <button
            type="button"
            onClick={onInvite}
            className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-on-primary transition active:scale-[0.98]"
          >
            {messages.relationshipMap.emptyCta}
          </button>
        </div>
      ) : null}

      <AnimatePresence mode="wait">
        {selectedRole && !selectedPerson ? (
          <RoleDetailPanel
            key={`role-${selectedRole.roleId}`}
            role={selectedRole}
            visual={PLANET_VISUALS[selectedRole.roleId]}
            count={countByRole.get(selectedRole.roleId) ?? 0}
            onBack={() => setSelectedRoleId(null)}
          />
        ) : null}

        {selectedRole && selectedPerson ? (
          <PersonPreviewPanel
            key={`person-${selectedPerson.key}`}
            personName={selectedPerson.name}
            role={selectedRole}
            visual={PLANET_VISUALS[selectedRole.roleId]}
            onBack={() => setSelectedPerson(null)}
            onExplore={() =>
              onExploreRelationship(selectedPerson.relationshipReportId, selectedPerson.name)
            }
          />
        ) : null}
      </AnimatePresence>
    </section>
  );
}
