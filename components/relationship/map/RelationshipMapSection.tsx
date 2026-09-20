"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import RelationshipSunCenter from "./RelationshipSunCenter";
import RolePlanetButton from "./RolePlanetButton";
import RoleDetailPanel from "./RoleDetailPanel";
import ScatteredPeopleField from "./ScatteredPeopleField";
import PersonPreviewPanel from "./PersonPreviewPanel";
import type { RoleDetailPerson } from "@/lib/relationship/map/roleDetailPerson";
import { PLANET_VISUALS } from "@/lib/relationship/map/planetVisuals";
import {
  RELATIONSHIP_ROLES,
  getRelationshipRoleById,
  type RelationshipRoleId,
} from "@/lib/relationship/map/relationshipRoleSsot";
import { roleLabel } from "@/lib/relationship/map/roleLocale";
import { MAP_Z } from "@/lib/relationship/map/mapZIndex";
import { useLocale } from "@/lib/i18n/LocaleProvider";

type RoleSummary = { roleId: RelationshipRoleId; tenGod: string; count: number };

function orbitPosition(angleDeg: number, radiusFraction: number) {
  const rad = (angleDeg * Math.PI) / 180;
  const spread = 38; // % — keeps every planet's own box inside the square container
  return {
    xPct: 50 + radiusFraction * spread * Math.sin(rad),
    yPct: 50 - radiusFraction * spread * Math.cos(rad),
  };
}

/**
 * "My Relationship Map" — sits at the top of the Relationship Lab, above the
 * existing friend list. Default view never shows names (spec section 2, 7);
 * a role is only revealed as people once the map owner clicks its planet.
 *
 * Map-share (anonymous export) infra stays implemented but is not surfaced
 * here — the primary surface prioritizes exploration, not sharing (final UX
 * pass section 4). See MapShareButton.tsx, still fully wired and tested.
 */
export default function RelationshipMapSection({
  viewerReportId,
  onInvite,
  onExploreRelationship,
  refreshKey = 0,
  focusRelationshipReportId = null,
  onFreeAnalysis,
}: {
  viewerReportId: string;
  onInvite: () => void;
  onExploreRelationship: (relationshipReportId: string, partnerName: string) => void;
  /** Bump to force a refetch (e.g. after accepting a reciprocal connection request). */
  refreshKey?: number;
  /**
   * Relationship Discovery Flow V1: when set, the map auto-selects this
   * person's role planet and opens their PersonPreviewPanel on load,
   * instead of waiting for a manual planet click -- used when arriving
   * from "우리 관계 발견하기" (just-connected) or a discovery banner's
   * "확인하기". Applied once per id (re-clicking another planet afterward
   * is not overridden back to this one).
   */
  focusRelationshipReportId?: string | null;
  /**
   * Relationship Discovery Flow V1: renders the free-analysis follow-up
   * ("그런데 나는 상대에게 어떤 사람일까?") in PersonPreviewPanel, shown only
   * for the focused person -- ordinary map browsing (any other planet/
   * person) keeps its existing single "이 사람과 관계 분석하기" CTA
   * unchanged.
   */
  onFreeAnalysis?: (relationshipReportId: string, partnerName: string) => void;
}) {
  const { locale, messages } = useLocale();
  const [roles, setRoles] = useState<RoleSummary[] | null>(null);
  const [totalPeople, setTotalPeople] = useState(0);
  const [selectedRoleId, setSelectedRoleId] = useState<RelationshipRoleId | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<RoleDetailPerson | null>(null);
  // Relationship Discovery Flow — the focused person's reverse-direction
  // role ("what am I, to them"), from the map API's focusPerson.
  // reciprocalRoleId. Only ever set alongside a focus-effect selection
  // (see below), never by the ordinary role-planet-click path, so
  // PersonPreviewPanel's dual-direction discovery layout stays scoped to
  // the focus/discovery entry point only -- ordinary map browsing keeps
  // its existing single-direction UX untouched.
  const [focusReciprocalRoleId, setFocusReciprocalRoleId] = useState<RelationshipRoleId | null>(
    null,
  );
  const [rolePeople, setRolePeople] = useState<RoleDetailPerson[] | null>(null);
  const [rolePeopleTotal, setRolePeopleTotal] = useState(0);
  const roleEpochRef = useRef(0);
  const focusAppliedRef = useRef<string | null>(null);

  const mapLoading = roles === null;

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
        setRolePeopleTotal(data.rolePeople.total ?? (data.rolePeople.people ?? []).length);
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
  }, [viewerReportId, refreshKey]);

  useEffect(() => {
    const focusId = focusRelationshipReportId?.trim();
    if (!focusId || !viewerReportId) return;
    if (focusAppliedRef.current === focusId) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(
          `/api/relationship/map?reportId=${encodeURIComponent(viewerReportId)}&focusRelationshipReportId=${encodeURIComponent(focusId)}`,
        );
        const data = await res.json().catch(() => null);
        if (cancelled || !res.ok || !data?.focusPerson) return;
        const person = data.focusPerson as {
          roleId: RelationshipRoleId;
          key: string;
          name: string;
          relationshipReportId: string;
          partnerReportId: string;
          reciprocalRoleId?: RelationshipRoleId;
        };
        focusAppliedRef.current = focusId;
        setSelectedRoleId(person.roleId);
        setSelectedPerson({
          key: person.key,
          name: person.name,
          relationshipReportId: person.relationshipReportId,
          partnerReportId: person.partnerReportId,
        });
        setFocusReciprocalRoleId(person.reciprocalRoleId ?? null);
      } catch {
        // Best-effort — a failed focus lookup just leaves the map in its
        // normal browsable state instead of forcing a selection.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [viewerReportId, focusRelationshipReportId]);

  const countByRole = new Map<RelationshipRoleId, number>(
    (roles ?? RELATIONSHIP_ROLES.map((r) => ({ roleId: r.roleId, tenGod: r.tenGod, count: 0 }))).map(
      (r) => [r.roleId, r.count],
    ),
  );

  const selectedRole = selectedRoleId ? getRelationshipRoleById(selectedRoleId) : undefined;
  const selectedVisual = selectedRole ? PLANET_VISUALS[selectedRole.roleId] : undefined;
  const selectedCenter = selectedVisual
    ? orbitPosition(selectedVisual.angleDeg, selectedVisual.radiusFraction)
    : undefined;
  const isEmpty = roles != null && totalPeople === 0;

  function selectRole(roleId: RelationshipRoleId) {
    setSelectedPerson(null);
    setSelectedRoleId((prev) => (prev === roleId ? null : roleId));
  }

  return (
    <section className="space-y-4">
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
          const isSelected = selectedRoleId === role.roleId;
          const isOtherRoleSelected = selectedRoleId != null && !isSelected;
          const pos = orbitPosition(visual.angleDeg, visual.radiusFraction);
          return (
            <RolePlanetButton
              key={role.roleId}
              role={role}
              visual={visual}
              count={count}
              label={label}
              countLabel={countLabel}
              ariaLabel={messages.relationshipMap.ariaRolePlanet(label, countLabel)}
              selected={isSelected}
              loading={mapLoading}
              onSelect={() => selectRole(role.roleId)}
              style={{
                left: `${pos.xPct}%`,
                top: `${pos.yPct}%`,
                opacity: isOtherRoleSelected ? 0.22 : 1,
                zIndex: isSelected ? MAP_Z.planetSelected : MAP_Z.planetDefault,
              }}
            />
          );
        })}

        {selectedRoleId && rolePeople && !selectedPerson && selectedCenter ? (
          <ScatteredPeopleField
            people={rolePeople}
            overflowCount={Math.max(0, rolePeopleTotal - rolePeople.length)}
            center={selectedCenter}
            onSelectPerson={setSelectedPerson}
          />
        ) : null}

        <button
          type="button"
          onClick={onInvite}
          className="absolute bottom-2 right-2 flex min-h-[40px] items-center gap-1 rounded-full bg-primary pl-2.5 pr-3 text-xs font-semibold text-on-primary shadow-md transition hover:scale-105 active:scale-95"
          style={{ zIndex: MAP_Z.addPersonButton }}
        >
          <Plus className="h-4 w-4 shrink-0" />
          {messages.relationshipMap.addFriendMapCta}
        </button>
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
            viewerReportId={viewerReportId}
            role={selectedRole}
            visual={PLANET_VISUALS[selectedRole.roleId]}
            count={countByRole.get(selectedRole.roleId) ?? 0}
            onBack={() => setSelectedRoleId(null)}
            onSelectPerson={setSelectedPerson}
          />
        ) : null}

        {selectedRole && selectedPerson ? (() => {
          const isFocused = selectedPerson.relationshipReportId === focusRelationshipReportId;
          const reciprocalRole =
            isFocused && focusReciprocalRoleId
              ? getRelationshipRoleById(focusReciprocalRoleId)
              : undefined;
          return (
            <PersonPreviewPanel
              key={`person-${selectedPerson.key}`}
              personName={selectedPerson.name}
              role={selectedRole}
              visual={PLANET_VISUALS[selectedRole.roleId]}
              onBack={() => setSelectedPerson(null)}
              onExplore={() =>
                onExploreRelationship(selectedPerson.relationshipReportId, selectedPerson.name)
              }
              onExploreFree={
                onFreeAnalysis && isFocused
                  ? () => onFreeAnalysis(selectedPerson.relationshipReportId, selectedPerson.name)
                  : undefined
              }
              reciprocalRole={reciprocalRole}
              reciprocalVisual={reciprocalRole ? PLANET_VISUALS[reciprocalRole.roleId] : undefined}
            />
          );
        })() : null}
      </AnimatePresence>
    </section>
  );
}
