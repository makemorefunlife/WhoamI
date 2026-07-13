"use client";

import { useMemo } from "react";
import type { FriendReportBody } from "@/lib/relationship/friend/buildFriendReport";
import { hydrateFriendSnapshotPanel } from "@/lib/relationship/friend/buildFriendSnapshotPanel";
import { buildFriendPsychMatchBundle } from "@/lib/relationship/psychDomainLens/buildFriendPsychMatch";
import { resolveReportPsychDisplay } from "@/lib/relationship/psychDomainLens/resolvePsychDisplay";
import RelationshipPsychMatchSection from "@/components/relationship/RelationshipPsychMatchSection";
import TriScoreSnapshotPanel from "@/components/relationship/TriScoreSnapshotPanel";
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
  return (
    <RelationshipReportInset>
      <p className="text-sm font-bold text-white/92">{title}</p>
      <p className="mt-2 text-base font-semibold" style={{ color: accent }}>
        {person.social_title}
      </p>
      <div className="mt-4 space-y-3">
        <div>
          <RelationshipReportLabel>🎭 포지션</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1.5">
            {person.friend_position}
          </RelationshipReportParagraph>
        </div>
        <div>
          <RelationshipReportLabel>🗣️ 티키타카</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1.5">
            {person.tikitaka_label} — {person.tikitaka_description}
          </RelationshipReportParagraph>
        </div>
        <div>
          <RelationshipReportLabel>🔋 배터리</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1.5">
            {person.battery_description}
          </RelationshipReportParagraph>
        </div>
        <div>
          <RelationshipReportLabel>🍻 편한 본모습</RelationshipReportLabel>
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
  const myName = myNameProp ?? dnaPair?.me.nickname ?? "나";
  const partnerName = partnerNameProp ?? dnaPair?.partner.nickname ?? "상대";

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
        badge: report.meta?.grade
          ? `우정 등급 ${report.meta.grade}`
          : undefined,
      }}
      scores={[
        {
          emoji: "🔥",
          label: "우정 케미",
          value: snap.connection_pct,
          tone: "warm",
        },
        {
          emoji: "🧩",
          label: "티키타카",
          value: snap.banter_pct,
          tone: "cool",
        },
        {
          emoji: "⚡",
          label: "소셜 리스크",
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
        title="🧬 Social DNA 프로필"
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
        title="🤝 우정 주파수 매칭"
        accentColor={theme.accent}
      >
        <RelationshipReportParagraph>
          {polishStored(f.section_soulmate.soulmate_verdict)}
        </RelationshipReportParagraph>
      </RelationshipReportCard>

      <RelationshipReportCard
        title="💸 노는 코드와 돈 계산"
        accentColor={theme.accent}
      >
        <RelationshipReportBody>
          <div>
            <RelationshipReportLabel>💰 총무</RelationshipReportLabel>
            <RelationshipReportParagraph className="mt-1.5">
              {f.section_play_money.treasurer_nickname} —{" "}
              {f.section_play_money.treasurer_reason}
            </RelationshipReportParagraph>
          </div>
          <div>
            <RelationshipReportLabel>🎪 최적 동선</RelationshipReportLabel>
            <RelationshipReportParagraph className="mt-1.5">
              {f.section_play_money.optimal_hangout}
            </RelationshipReportParagraph>
          </div>
        </RelationshipReportBody>
      </RelationshipReportCard>

      <RelationshipReportCard
        title="⚠️ 손절 폭탄 해체 가이드"
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
        title="⚡ 절친 싸움 해독제"
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
    </RelationshipReportLayout>
  );
}
