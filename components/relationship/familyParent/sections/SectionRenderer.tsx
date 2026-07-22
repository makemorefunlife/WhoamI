"use client";

/**
 * Family Premium — FamilyReportViewModel 전용 렌더러. work·friend·marriage의
 * SectionRenderer.tsx와 동일한 패턴 — en-US/ko-KR 둘 다 production에서
 * 쓰인다(ko-KR 전용 게이트 금지). 카드 내부 라벨은
 * `useMessages().relationshipDrilldown.family`에서 가져온다.
 *
 * family는 비대칭 부모-자녀 관계라 viewer 토글이 없다 — 항상 고정된
 * parent/child 순서로 렌더링한다(기존 FamilyParentReportView.tsx와 동일).
 */
import type { ReactNode } from "react";
import {
  RelationshipReportLayout,
  RelationshipReportCard,
  RelationshipReportBody,
  RelationshipReportParagraph,
  RelationshipReportLabel,
  RelationshipReportInset,
  PsychMatchRadarChart,
  getTabTheme,
} from "@/components/relationship/reportLayout";
import TriScoreSnapshotPanel from "@/components/relationship/TriScoreSnapshotPanel";
import PairPrescriptionSection from "@/components/relationship/shared/PairPrescriptionSection";
import type {
  ChildDnaSection,
  CompareTableSection,
  DeEscalationSection,
  DestinySection,
  FamilyReportSection,
  FamilyReportViewModel,
  FamilyRoleSection,
  FilialRewardSection,
  GrowthTunnelSection,
  HouseholdRolesSection,
  PrescriptionSection,
  PsychRadarSection,
} from "@/lib/relationship/familyParent/viewModel/familyReportSectionTypes";
import { useMessages } from "@/lib/i18n/LocaleProvider";

const ACCENT = getTabTheme("family").accent;

const DE_VARIANT: Record<string, "warning" | "success" | "default"> = {
  red: "warning",
  yellow: "warning",
  orange: "warning",
  green: "success",
  blue: "default",
};

// ---- Part 구분선 --------------------------------------------------------------

function PartHeading({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <h2 className="text-base font-bold tracking-tight text-white/90 sm:text-lg">{title}</h2>
      <div className="h-px flex-1" style={{ backgroundColor: `${ACCENT}33` }} />
    </div>
  );
}

// ---- Part 2: 스코어링 + 비교표 + 11축 매칭 -----------------------------------

function CompareTableCard({
  section,
  names,
}: {
  section: CompareTableSection;
  names: [string, string];
}) {
  const t = useMessages().relationshipDrilldown.family;
  return (
    <RelationshipReportCard title={section.title} accentColor={ACCENT}>
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[520px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.04]">
              <th className="px-4 py-3 font-semibold text-white/55">&nbsp;</th>
              <th className="px-4 py-3 font-semibold text-white/80">{t.compareTableColParent} · {names[1]}</th>
              <th className="px-4 py-3 font-semibold text-white/80">{t.compareTableColChild} · {names[0]}</th>
              <th className="px-4 py-3 font-semibold text-white/55">{t.compareTableColMeaning}</th>
            </tr>
          </thead>
          <tbody>
            {section.rows.map((row, i) => (
              <tr key={row.id} className={i % 2 === 0 ? "bg-white/[0.015]" : undefined}>
                <td className="border-t border-white/8 px-4 py-3 align-top font-medium text-white/70">
                  {row.label}
                </td>
                <td className="border-t border-white/8 px-4 py-3 align-top font-semibold" style={{ color: ACCENT }}>
                  {row.personParent.shortLabel}
                </td>
                <td className="border-t border-white/8 px-4 py-3 align-top font-semibold text-white/85">
                  {row.personChild.shortLabel}
                </td>
                <td className="border-t border-white/8 px-4 py-3 align-top text-white/72">
                  {row.meaning}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </RelationshipReportCard>
  );
}

function HouseholdRolesCard({ section }: { section: HouseholdRolesSection }) {
  const t = useMessages().relationshipDrilldown.family;
  return (
    <RelationshipReportCard title={section.title} accentColor={ACCENT}>
      <RelationshipReportBody>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <RelationshipReportLabel>
              {t.householdRolesSelfLabel(section.selfName)}
            </RelationshipReportLabel>
            <p className="mt-2 text-base font-semibold text-white/92">{section.selfRoleLabel}</p>
            <RelationshipReportParagraph className="mt-2 text-white/75">
              {section.selfRoleDetail}
            </RelationshipReportParagraph>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <RelationshipReportLabel>
              {t.householdRolesPartnerLabel(section.partnerName)}
            </RelationshipReportLabel>
            <p className="mt-2 text-base font-semibold text-white/92">{section.partnerRoleLabel}</p>
            <RelationshipReportParagraph className="mt-2 text-white/75">
              {section.partnerRoleDetail}
            </RelationshipReportParagraph>
          </div>
        </div>
        <div>
          <RelationshipReportLabel>{t.householdRolesComplementLabel}</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1.5">
            {section.complement}
          </RelationshipReportParagraph>
        </div>
        <div>
          <RelationshipReportLabel>{t.householdRolesTensionLabel}</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1.5">
            {section.tension}
          </RelationshipReportParagraph>
        </div>
      </RelationshipReportBody>
    </RelationshipReportCard>
  );
}

function PsychRadarCard({ section, names }: { section: PsychRadarSection; names: [string, string] }) {
  return (
    <RelationshipReportCard title={section.title} accentColor={ACCENT}>
      <RelationshipReportParagraph className="mb-3" muted>
        {section.chartNote}
      </RelationshipReportParagraph>
      <div className="rounded-2xl border border-white/10 bg-[#f8f6f3] p-3 sm:p-4">
        <PsychMatchRadarChart axisResults={section.axisResults} personALabel={names[0]} personBLabel={names[1]} />
      </div>
      {section.highlights.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {section.highlights.map((item) => (
            <li key={item.axis_key} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <p className="text-sm font-semibold leading-snug text-white/92">{item.hook}</p>
              <RelationshipReportParagraph className="mt-2 text-white/78">{item.narrative}</RelationshipReportParagraph>
            </li>
          ))}
        </ul>
      ) : null}
    </RelationshipReportCard>
  );
}

// ---- Part 3: 자녀 DNA + 성장 터널 --------------------------------------------

function ChildDnaCard({ section }: { section: ChildDnaSection }) {
  const t = useMessages().relationshipDrilldown.family;
  return (
    <RelationshipReportCard title={section.title} accentColor={ACCENT}>
      <RelationshipReportBody>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-200/70">
            {t.dnaLayerLabel}
          </p>
          <p className="mt-1 text-sm text-white/55">{t.dnaLayerHint}</p>
        </div>
        <p className="text-lg font-semibold text-white/92">{section.geniusTitle}</p>
        <div className="mt-4 space-y-4">
          <div>
            <RelationshipReportLabel>{t.dnaCommunicationLabel}</RelationshipReportLabel>
            <RelationshipReportParagraph className="mt-1.5">{section.communicationStyle}</RelationshipReportParagraph>
          </div>
          <div>
            <RelationshipReportLabel>{t.dnaHiddenSensitivityLabel}</RelationshipReportLabel>
            <RelationshipReportParagraph className="mt-1.5">{section.hiddenSensitivity}</RelationshipReportParagraph>
          </div>
          <div>
            <RelationshipReportLabel>{t.dnaEnergyLabel}</RelationshipReportLabel>
            <RelationshipReportParagraph className="mt-1.5">{section.attentionFocusStyle}</RelationshipReportParagraph>
          </div>
          <div>
            <RelationshipReportLabel>{t.dnaHiddenGeniusLabel}</RelationshipReportLabel>
            <RelationshipReportParagraph className="mt-1.5">{section.hiddenGenius}</RelationshipReportParagraph>
          </div>
        </div>
      </RelationshipReportBody>
    </RelationshipReportCard>
  );
}

function GrowthTunnelCard({ section }: { section: GrowthTunnelSection }) {
  const t = useMessages().relationshipDrilldown.family;
  return (
    <RelationshipReportCard title={section.title} accentColor={ACCENT} variant="warning">
      <RelationshipReportBody>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-amber-200/70">
            {t.growthLayerLabel}
          </p>
          <p className="mt-1 text-sm text-white/55">{t.growthLayerHint}</p>
        </div>
        <RelationshipReportParagraph>{section.currentChallenge}</RelationshipReportParagraph>
        {section.focusAreas.length > 0 ? (
          <p className="text-sm text-white/50">
            {t.focusAreasPrefix}
            {section.focusAreas.join(" · ")}
          </p>
        ) : null}
      </RelationshipReportBody>
    </RelationshipReportCard>
  );
}

function FamilyRoleCard({ section }: { section: FamilyRoleSection }) {
  const t = useMessages().relationshipDrilldown.family;
  return (
    <RelationshipReportCard title={section.title} accentColor={ACCENT}>
      <RelationshipReportBody>
        <p className="text-lg font-semibold text-white/92">{section.roleLabel}</p>
        <RelationshipReportInset>
          <RelationshipReportLabel>{t.familyRoleDescriptionLabel}</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1.5">
            {section.roleDescription}
          </RelationshipReportParagraph>
        </RelationshipReportInset>
      </RelationshipReportBody>
    </RelationshipReportCard>
  );
}

// ---- Part 4: 운명적 케미 + 부모 렌즈 + 미래 보답 ------------------------------

function DestinyCard({ section }: { section: DestinySection }) {
  const t = useMessages().relationshipDrilldown.family;
  return (
    <RelationshipReportCard title={section.title} accentColor={ACCENT}>
      <RelationshipReportBody>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-200/70">
            {t.destinyLayerLabel}
          </p>
          <p className="mt-1 text-sm text-white/55">{t.destinyLayerHint}</p>
        </div>
        <div>
          <RelationshipReportLabel>{t.harmonyLabel}</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1.5">{section.harmonyOneLiner}</RelationshipReportParagraph>
        </div>
        <div>
          <RelationshipReportLabel>{t.favoritismRiskLabel}</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1.5">{section.favoritismWarning}</RelationshipReportParagraph>
        </div>
        {section.parentLensSummary ? (
          <RelationshipReportParagraph className="italic text-emerald-200/75">
            {section.parentLensSummary}
          </RelationshipReportParagraph>
        ) : null}
      </RelationshipReportBody>
    </RelationshipReportCard>
  );
}

function FilialRewardCard({ section }: { section: FilialRewardSection }) {
  const t = useMessages().relationshipDrilldown.family;
  return (
    <RelationshipReportCard title={section.title} accentColor={ACCENT}>
      <RelationshipReportBody>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-amber-200/70">
            {t.filialLayerLabel}
          </p>
          <p className="mt-1 text-sm text-white/55">{t.filialLayerHint}</p>
        </div>
        <RelationshipReportParagraph>{section.futureReward}</RelationshipReportParagraph>
      </RelationshipReportBody>
    </RelationshipReportCard>
  );
}

// ---- Part 5: 갈등 완화 + 실전 처방 -------------------------------------------

function DeEscalationCard({ section }: { section: DeEscalationSection }) {
  const t = useMessages().relationshipDrilldown.family;
  const card = section.card;
  return (
    <RelationshipReportCard
      title={section.title}
      accentColor={ACCENT}
      variant={DE_VARIANT[card.color] ?? "default"}
    >
      <RelationshipReportBody>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-rose-200/70">
            {t.deEscalationLayerLabel}
          </p>
          <p className="mt-1 text-sm text-white/55">{t.deEscalationLayerHint}</p>
        </div>
        <p className="text-lg font-bold text-white/95">{card.hashtag}</p>
        <p className="text-sm text-white/50">{card.archetype_label}</p>
        <div className="mt-4 space-y-3">
          <div>
            <RelationshipReportLabel>{t.whenAngryLabel}</RelationshipReportLabel>
            <RelationshipReportParagraph className="mt-1.5">{card.psych_state}</RelationshipReportParagraph>
          </div>
          <div>
            <RelationshipReportLabel className="text-red-300/80">{t.avoidLabel}</RelationshipReportLabel>
            <RelationshipReportParagraph className="mt-1.5">{card.avoid_actions}</RelationshipReportParagraph>
          </div>
          <RelationshipReportInset className="border-emerald-400/20 bg-emerald-950/10">
            <RelationshipReportParagraph className="italic text-emerald-100/85">
              💬 {card.solution_script}
            </RelationshipReportParagraph>
          </RelationshipReportInset>
        </div>
      </RelationshipReportBody>
    </RelationshipReportCard>
  );
}

function PrescriptionCard({ section }: { section: PrescriptionSection }) {
  const t = useMessages().relationshipDrilldown.family;
  const pack = {
    schema_version: "family_prescription_v1",
    intro_line: section.introLine,
    items: section.items,
  };
  return (
    <div className="space-y-3">
      <div className="px-1">
        <p className="text-xs font-medium uppercase tracking-wide text-violet-200/70">
          {t.prescriptionLayerLabel}
        </p>
        <p className="mt-1 text-sm text-white/55">{t.prescriptionLayerHint}</p>
      </div>
      <PairPrescriptionSection
        pack={pack}
        accentColor={ACCENT}
        domain="family"
        titleOverride={section.title}
      />
    </div>
  );
}

// ---- Dispatcher -------------------------------------------------------------

type NonSnapshotSection = Exclude<FamilyReportSection, { type: "snapshot" }>;

export function FamilyReportSectionCard({
  section,
  names,
}: {
  section: NonSnapshotSection;
  names: [string, string];
}): ReactNode {
  switch (section.type) {
    case "compare_table":
      return <CompareTableCard section={section} names={names} />;
    case "household_roles":
      return <HouseholdRolesCard section={section} />;
    case "psych_radar":
      return <PsychRadarCard section={section} names={names} />;
    case "child_dna":
      return <ChildDnaCard section={section} />;
    case "growth_tunnel":
      return <GrowthTunnelCard section={section} />;
    case "family_role":
      return <FamilyRoleCard section={section} />;
    case "destiny":
      return <DestinyCard section={section} />;
    case "filial_reward":
      return <FilialRewardCard section={section} />;
    case "de_escalation":
      return <DeEscalationCard section={section} />;
    case "prescription":
      return <PrescriptionCard section={section} />;
    default: {
      const exhaustiveCheck: never = section;
      return exhaustiveCheck;
    }
  }
}

/** ViewModel 전체를 RelationshipReportLayout에 조립 — production 진입점. */
export function FamilyReportViewModelView({
  vm,
  kindLabel,
}: {
  vm: FamilyReportViewModel;
  kindLabel?: string;
}) {
  const t = useMessages().relationshipDrilldown.family;
  const partTitles: Record<2 | 3 | 4 | 5, string> = {
    2: t.part2Title,
    3: t.part3Title,
    4: t.part4Title,
    5: t.part5Title,
  };
  const snapshot = vm.sections.find(
    (s): s is Extract<FamilyReportSection, { type: "snapshot" }> => s.type === "snapshot",
  );
  const otherSections = vm.sections.filter(
    (s): s is NonSnapshotSection => s.type !== "snapshot",
  );

  return (
    <RelationshipReportLayout
      kind="family"
      kindLabel={kindLabel ?? t.defaultKindLabel}
      headline={{
        title: vm.opening.headline,
        subtitle: vm.opening.subtitle,
        names: vm.opening.names,
        badge: vm.opening.grade ? t.gradeBadge(vm.opening.grade) : undefined,
      }}
      scores={
        snapshot
          ? [
              { emoji: "🔥", label: t.scoreLabelBond, value: snapshot.scores.bondPct, tone: "warm" },
              { emoji: "🧩", label: t.scoreLabelSynergy, value: snapshot.scores.synergyPct, tone: "cool" },
              { emoji: "⚡", label: t.scoreLabelFriction, value: snapshot.scores.riskPct, tone: "alert" },
            ]
          : []
      }
      scoreFooter={snapshot ? <TriScoreSnapshotPanel panel={snapshot.panel} kind="family" /> : undefined}
    >
      {(() => {
        let lastPartNumber: number | null = null;
        return otherSections.map((section) => {
          const showHeading = section.partNumber !== lastPartNumber;
          lastPartNumber = section.partNumber;
          return (
            <div key={section.id} className="space-y-5 sm:space-y-6">
              {showHeading ? <PartHeading title={partTitles[section.partNumber]} /> : null}
              <FamilyReportSectionCard section={section} names={vm.opening.names} />
            </div>
          );
        });
      })()}
    </RelationshipReportLayout>
  );
}
