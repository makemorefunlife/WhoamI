"use client";

import { useMemo } from "react";
import type { FamilyParentReportBody } from "@/lib/relationship/familyParent/buildFamilyParentReport";
import { hydrateFamilyParentSnapshotPanel } from "@/lib/relationship/familyParent/buildFamilySnapshotPanel";
import { buildFamilyPsychMatchBundle } from "@/lib/relationship/psychDomainLens/buildFamilyPsychMatch";
import { resolveReportPsychDisplay } from "@/lib/relationship/psychDomainLens/resolvePsychDisplay";
import RelationshipPsychMatchSection from "@/components/relationship/RelationshipPsychMatchSection";
import TriScoreSnapshotPanel from "@/components/relationship/TriScoreSnapshotPanel";
import PairPrescriptionSection from "@/components/relationship/shared/PairPrescriptionSection";
import {
  RelationshipReportLayout,
  RelationshipReportCard,
  RelationshipReportBody,
  RelationshipReportParagraph,
  RelationshipReportLabel,
  RelationshipReportInset,
  getTabTheme,
} from "@/components/relationship/reportLayout";
import { useMessages } from "@/lib/i18n/LocaleProvider";

const DE_VARIANT: Record<string, "warning" | "success" | "default"> = {
  red: "warning",
  yellow: "warning",
  orange: "warning",
  green: "success",
  blue: "default",
};

export default function FamilyParentReportView({
  report,
}: {
  report: FamilyParentReportBody;
}) {
  const t = useMessages().relationshipDrilldown.family;
  const theme = getTabTheme("family");
  const fam = report.family;
  const roles = fam?.section_roles;
  const snap = fam?.section_snapshot ?? {
    bond_pct: report.meta?.bond_pct ?? 0,
    synergy_pct: report.meta?.synergy_pct ?? report.meta?.bond_pct ?? 0,
    risk_pct: report.meta?.risk_pct ?? 0,
    one_line_family: report.one_line_family ?? report.headline,
  };
  const dna = fam?.section_child_dna;
  const card = fam?.section_de_escalation;

  const childName = roles?.child_nickname ?? t.childFallback;
  const parentName = roles?.parent_nickname ?? t.parentFallback;
  const labelA = report.meta?.nickname_a ?? childName;
  const labelB = report.meta?.nickname_b ?? parentName;

  const psychDisplay = useMemo(
    () => resolveReportPsychDisplay(report.meta, buildFamilyPsychMatchBundle),
    [report.meta],
  );

  const snapshotPanel = useMemo(() => {
    const pc = report.meta?.person_core;
    if (!report.snapshot_panel) return null;
    return hydrateFamilyParentSnapshotPanel(report.snapshot_panel, {
      psychA: pc?.psych_a,
      psychB: pc?.psych_b,
      nicknameA: labelA,
      nicknameB: labelB,
    });
  }, [report.snapshot_panel, report.meta, labelA, labelB]);

  return (
    <RelationshipReportLayout
      kind="family"
      kindLabel="Premium · Child DNA Playbook"
      headline={{
        title: report.headline || snap.one_line_family,
        subtitle: snap.one_line_family,
        names: roles ? [childName, parentName] : undefined,
        meta: roles
          ? `👶 ${childName} · ${roles.parent_role_label} ${parentName}`
          : undefined,
        badge: report.meta?.grade ? t.gradeBadge(report.meta.grade) : undefined,
      }}
      scores={[
        {
          emoji: "🔥",
          label: t.scoreLabelBond,
          value: snap.bond_pct,
          tone: "warm",
        },
        {
          emoji: "🧩",
          label: t.scoreLabelSynergy,
          value: snap.synergy_pct,
          tone: "cool",
        },
        {
          emoji: "⚡",
          label: t.scoreLabelFriction,
          value: snap.risk_pct,
          tone: "alert",
        },
      ]}
      scoreFooter={
        snapshotPanel ? (
          <TriScoreSnapshotPanel panel={snapshotPanel} kind="family" />
        ) : undefined
      }
    >
      {psychDisplay ? (
        <RelationshipPsychMatchSection
          psychMatch={psychDisplay.psych_match}
          psychLens={psychDisplay.psych_lens}
          personALabel={labelA}
          personBLabel={labelB}
          viewerIsReportA
          accentColor={theme.accent}
        />
      ) : null}

      {dna ? (
        <RelationshipReportCard
          title={t.dnaCardTitle}
          accentColor={theme.accent}
        >
          <RelationshipReportBody>
            <p className="text-lg font-semibold text-white/92">
              {dna.genius_title}
            </p>
            <div className="mt-4 space-y-4">
              <div>
                <RelationshipReportLabel>{t.dnaCommunicationLabel}</RelationshipReportLabel>
                <RelationshipReportParagraph className="mt-1.5">
                  {dna.communication_style}
                </RelationshipReportParagraph>
              </div>
              <div>
                <RelationshipReportLabel>{t.dnaHiddenSensitivityLabel}</RelationshipReportLabel>
                <RelationshipReportParagraph className="mt-1.5">
                  {dna.hidden_sensitivity}
                </RelationshipReportParagraph>
              </div>
              <div>
                <RelationshipReportLabel>{t.dnaEnergyLabel}</RelationshipReportLabel>
                <RelationshipReportParagraph className="mt-1.5">
                  {dna.attention_focus_style}
                </RelationshipReportParagraph>
              </div>
              <div>
                <RelationshipReportLabel>{t.dnaHiddenGeniusLabel}</RelationshipReportLabel>
                <RelationshipReportParagraph className="mt-1.5">
                  {dna.hidden_genius}
                </RelationshipReportParagraph>
              </div>
            </div>
          </RelationshipReportBody>
        </RelationshipReportCard>
      ) : null}

      {fam?.section_destiny ? (
        <RelationshipReportCard
          title={t.destinyCardTitle}
          accentColor={theme.accent}
        >
          <RelationshipReportBody>
            <div>
              <RelationshipReportLabel>{t.harmonyLabel}</RelationshipReportLabel>
              <RelationshipReportParagraph className="mt-1.5">
                {fam.section_destiny.harmony_one_liner}
              </RelationshipReportParagraph>
            </div>
            <div>
              <RelationshipReportLabel>{t.favoritismRiskLabel}</RelationshipReportLabel>
              <RelationshipReportParagraph className="mt-1.5">
                {fam.section_destiny.favoritism_warning}
              </RelationshipReportParagraph>
            </div>
            {fam.parent_lens_summary ? (
              <RelationshipReportParagraph className="italic text-emerald-200/75">
                {fam.parent_lens_summary}
              </RelationshipReportParagraph>
            ) : null}
          </RelationshipReportBody>
        </RelationshipReportCard>
      ) : null}

      {fam?.section_growth_tunnel ? (
        <RelationshipReportCard
          title={t.growthTunnelCardTitle}
          accentColor={theme.accent}
          variant="warning"
        >
          <RelationshipReportBody>
            <RelationshipReportParagraph>
              {fam.section_growth_tunnel.current_challenge}
            </RelationshipReportParagraph>
            {fam.section_growth_tunnel.focus_areas.length > 0 ? (
              <p className="text-sm text-white/50">
                {t.focusAreasPrefix}
                {fam.section_growth_tunnel.focus_areas.join(" · ")}
              </p>
            ) : null}
          </RelationshipReportBody>
        </RelationshipReportCard>
      ) : null}

      {fam?.section_filial_reward ? (
        <RelationshipReportCard
          title={t.filialRewardCardTitle}
          accentColor={theme.accent}
        >
          <RelationshipReportParagraph>
            {fam.section_filial_reward.future_reward}
          </RelationshipReportParagraph>
        </RelationshipReportCard>
      ) : null}

      {card ? (
        <RelationshipReportCard
          title={t.deEscalationCardTitle}
          accentColor={theme.accent}
          variant={DE_VARIANT[card.color] ?? "default"}
        >
          <RelationshipReportBody>
            <p className="text-lg font-bold text-white/95">{card.hashtag}</p>
            <p className="text-sm text-white/50">{card.archetype_label}</p>
            <div className="mt-4 space-y-3">
              <div>
                <RelationshipReportLabel>{t.whenAngryLabel}</RelationshipReportLabel>
                <RelationshipReportParagraph className="mt-1.5">
                  {card.psych_state}
                </RelationshipReportParagraph>
              </div>
              <div>
                <RelationshipReportLabel className="text-red-300/80">
                  {t.avoidLabel}
                </RelationshipReportLabel>
                <RelationshipReportParagraph className="mt-1.5">
                  {card.avoid_actions}
                </RelationshipReportParagraph>
              </div>
              <RelationshipReportInset className="border-emerald-400/20 bg-emerald-950/10">
                <RelationshipReportParagraph className="italic text-emerald-100/85">
                  💬 {card.solution_script}
                </RelationshipReportParagraph>
              </RelationshipReportInset>
            </div>
          </RelationshipReportBody>
        </RelationshipReportCard>
      ) : null}

      <PairPrescriptionSection
        pack={report.meta?.prescription_family}
        accentColor={theme.accent}
        domain="family"
      />
    </RelationshipReportLayout>
  );
}
