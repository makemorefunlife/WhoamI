"use client";

import { useMemo } from "react";
import type { FriendReportBody } from "@/lib/relationship/friend/buildFriendReport";
import { hydrateFriendSnapshotPanel } from "@/lib/relationship/friend/buildFriendSnapshotPanel";
import { buildFriendPsychMatchBundle } from "@/lib/relationship/psychDomainLens/buildFriendPsychMatch";
import { resolveReportPsychDisplay } from "@/lib/relationship/psychDomainLens/resolvePsychDisplay";
import RelationshipPsychMatchSection from "@/components/relationship/RelationshipPsychMatchSection";
import TriScoreSnapshotPanel from "@/components/relationship/TriScoreSnapshotPanel";
import PairPrescriptionSection from "@/components/relationship/shared/PairPrescriptionSection";
import { pickViewerFirstPair } from "@/lib/relationship/viewerFirstDisplay";
import {
  applyRomanticDisplayNames,
  buildRomanticNameReplacements,
  rewriteViewerFirstNamePairLine,
} from "@/lib/relationship/viewerFirstDisplay";
import {
  RelationshipReportLayout,
  RelationshipReportCard,
  RelationshipReportBody,
  RelationshipReportParagraph,
  RelationshipReportInset,
  RelationshipReportLabel,
  getTabTheme,
} from "@/components/relationship/reportLayout";
import { useMessages } from "@/lib/i18n/LocaleProvider";

const DE_ESCALATION_VARIANT: Record<string, "warning" | "success" | "default"> = {
  red: "warning",
  yellow: "warning",
  orange: "warning",
  green: "success",
  blue: "default",
};

function PersonDnaBlock({
  title,
  person,
  accent,
}: {
  title: string;
  person: FriendReportBody["friend"]["section_social_dna_a"];
  accent: string;
}) {
  const t = useMessages().relationshipDrilldown.friendship;
  return (
    <RelationshipReportInset>
      <p className="text-sm font-bold text-white/92">{title}</p>
      <p className="mt-2 text-base font-semibold" style={{ color: accent }}>
        {person.social_title}
      </p>
      <div className="mt-4 space-y-3">
        <div>
          <RelationshipReportLabel>{t.positionLabel}</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1.5">
            {person.friend_position}
          </RelationshipReportParagraph>
        </div>
        <div>
          <RelationshipReportLabel>{t.banterLabel}</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1.5">
            {person.tikitaka_label} — {person.tikitaka_description}
          </RelationshipReportParagraph>
        </div>
        <div>
          <RelationshipReportLabel>{t.batteryLabel}</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1.5">
            {person.battery_description}
          </RelationshipReportParagraph>
        </div>
        <div>
          <RelationshipReportLabel>{t.privateSideLabel}</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1.5">
            {person.private_self}
          </RelationshipReportParagraph>
        </div>
      </div>
    </RelationshipReportInset>
  );
}

export default function FriendReportView({
  report,
  myName: myNameProp,
  partnerName: partnerNameProp,
  viewerIsReportA = true,
}: {
  report: FriendReportBody;
  myName?: string;
  partnerName?: string;
  viewerIsReportA?: boolean;
}) {
  const messages = useMessages();
  const t = messages.relationshipDrilldown.friendship;
  const theme = getTabTheme("friendship");
  const f = report.friend;
  const snap = f?.section_snapshot ?? {
    connection_pct: report.meta?.connection_pct ?? 0,
    banter_pct: report.meta?.banter_pct ?? 0,
    risk_pct: report.meta?.risk_pct ?? 0,
    one_line_friendship: report.one_line_friendship ?? report.headline,
  };

  const dnaPair = f
    ? pickViewerFirstPair(
        f.section_social_dna_a,
        f.section_social_dna_b,
        viewerIsReportA,
      )
    : null;
  const myName = myNameProp ?? dnaPair?.me.nickname ?? messages.report.meFallbackLabel;
  const partnerName =
    partnerNameProp ?? dnaPair?.partner.nickname ?? messages.report.partnerFallbackLabel;

  const psychDisplay = useMemo(
    () => resolveReportPsychDisplay(report.meta, buildFriendPsychMatchBundle),
    [report.meta],
  );

  const snapshotPanel = useMemo(() => {
    const pc = report.meta?.person_core;
    if (!report.snapshot_panel) return null;
    return hydrateFriendSnapshotPanel(report.snapshot_panel, {
      psychA: pc?.psych_a,
      psychB: pc?.psych_b,
      nicknameA: report.meta?.nickname_a ?? report.snapshot_panel.personA.nickname,
      nicknameB: report.meta?.nickname_b ?? report.snapshot_panel.personB.nickname,
    });
  }, [report.snapshot_panel, report.meta]);

  const nameReplacements = useMemo(
    () =>
      buildRomanticNameReplacements({
        myName,
        partnerName,
        personAName: viewerIsReportA ? myName : partnerName,
        personBName: viewerIsReportA ? partnerName : myName,
        viewerIsReportA,
      }),
    [myName, partnerName, viewerIsReportA],
  );

  const polishStored = (raw: string | undefined | null) => {
    if (!raw?.trim()) return "";
    const pairFixed = rewriteViewerFirstNamePairLine(raw, myName, partnerName);
    return applyRomanticDisplayNames(pairFixed.trim(), nameReplacements);
  };

  const headlineTitle = polishStored(
    report.headline || snap.one_line_friendship,
  );
  const headlineSubtitle = polishStored(snap.one_line_friendship);
  return (
    <RelationshipReportLayout
      kind="friendship"
      kindLabel="Premium · Social DNA"
      headline={{
        title: headlineTitle,
        subtitle: headlineSubtitle,
        names: [myName, partnerName],
        badge: report.meta?.grade ? t.gradeBadge(report.meta.grade) : undefined,
      }}
      scores={[
        {
          emoji: "🔥",
          label: t.scoreLabelChemistry,
          value: snap.connection_pct,
          tone: "warm",
        },
        {
          emoji: "🧩",
          label: t.scoreLabelBanter,
          value: snap.banter_pct,
          tone: "cool",
        },
        {
          emoji: "⚡",
          label: t.scoreLabelRisk,
          value: snap.risk_pct,
          tone: "alert",
        },
      ]}
      scoreFooter={
        snapshotPanel ? (
          <TriScoreSnapshotPanel panel={snapshotPanel} kind="friendship" />
        ) : undefined
      }
    >
      {psychDisplay ? (
        <RelationshipPsychMatchSection
          psychMatch={psychDisplay.psych_match}
          psychLens={psychDisplay.psych_lens}
          personALabel={myName}
          personBLabel={partnerName}
          viewerIsReportA={viewerIsReportA}
          accentColor={theme.accent}
        />
      ) : null}

      <RelationshipReportCard
        title={t.dnaCardTitle}
        accentColor={theme.accent}
      >
        <RelationshipReportBody className="grid gap-4 sm:grid-cols-2">
          <PersonDnaBlock
            title={`👤 ${myName}`}
            person={dnaPair!.me}
            accent={theme.accent}
          />
          <PersonDnaBlock
            title={`👤 ${partnerName}`}
            person={dnaPair!.partner}
            accent={theme.accent}
          />
        </RelationshipReportBody>
      </RelationshipReportCard>

      <RelationshipReportCard
        title={t.soulmateCardTitle}
        accentColor={theme.accent}
      >
        <RelationshipReportParagraph>
          {polishStored(f.section_soulmate.soulmate_verdict)}
        </RelationshipReportParagraph>
      </RelationshipReportCard>

      <RelationshipReportCard
        title={t.playMoneyCardTitle}
        accentColor={theme.accent}
      >
        <RelationshipReportBody>
          <div>
            <RelationshipReportLabel>{t.treasurerLabel}</RelationshipReportLabel>
            <RelationshipReportParagraph className="mt-1.5">
              {f.section_play_money.treasurer_nickname} —{" "}
              {f.section_play_money.treasurer_reason}
            </RelationshipReportParagraph>
          </div>
          <div>
            <RelationshipReportLabel>{t.optimalHangoutLabel}</RelationshipReportLabel>
            <RelationshipReportParagraph className="mt-1.5">
              {f.section_play_money.optimal_hangout}
            </RelationshipReportParagraph>
          </div>
        </RelationshipReportBody>
      </RelationshipReportCard>

      <RelationshipReportCard
        title={t.breakupGuideCardTitle}
        accentColor={theme.accent}
        variant="warning"
      >
        <RelationshipReportBody>
          <RelationshipReportParagraph>
            {polishStored(f.section_breakup_guide.trigger_warning_a)}
          </RelationshipReportParagraph>
          <RelationshipReportParagraph>
            {polishStored(f.section_breakup_guide.trigger_warning_b)}
          </RelationshipReportParagraph>
        </RelationshipReportBody>
      </RelationshipReportCard>

      <RelationshipReportCard
        title={t.deEscalationCardTitle}
        accentColor={theme.accent}
        variant={
          DE_ESCALATION_VARIANT[f.section_de_escalation.color] ?? "default"
        }
      >
        <RelationshipReportBody>
          <p className="text-lg font-bold text-white/95">
            {f.section_de_escalation.hashtag}
          </p>
          <p className="text-sm text-white/50">
            {f.section_de_escalation.archetype_label}
          </p>
          <RelationshipReportInset className="mt-2 border-emerald-400/20 bg-emerald-950/10">
            <RelationshipReportParagraph className="italic text-emerald-100/85">
              💬 {f.section_de_escalation.cheat_script}
            </RelationshipReportParagraph>
          </RelationshipReportInset>
        </RelationshipReportBody>
      </RelationshipReportCard>

      <PairPrescriptionSection
        pack={report.meta?.prescription_friendship}
        accentColor={theme.accent}
        domain="friendship"
      />
    </RelationshipReportLayout>
  );
}
