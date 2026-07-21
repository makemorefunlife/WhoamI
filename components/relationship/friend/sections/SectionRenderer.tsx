"use client";

/**
 * Friend Premium — FriendReportViewModel 전용 렌더러. work의 SectionRenderer.tsx와
 * 동일한 패턴 — en-US/ko-KR 둘 다 production에서 쓰인다(ko-KR 전용 게이트 금지).
 * 카드 내부 라벨은 전부 `useMessages().relationshipDrilldown.friendship`에서 가져온다.
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
  BreakupGuideSection,
  CompareTableSection,
  DeEscalationSection,
  FriendReportSection,
  FriendReportViewModel,
  PlayMoneySection,
  PrescriptionSection,
  PsychRadarSection,
  SocialDnaSection,
  SoulmateSection,
} from "@/lib/relationship/friend/viewModel/friendReportSectionTypes";
import { useMessages } from "@/lib/i18n/LocaleProvider";

const ACCENT = getTabTheme("friendship").accent;

const DE_ESCALATION_VARIANT: Record<string, "warning" | "success" | "default"> = {
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

// ---- Part 1: 비교표 -----------------------------------------------------------

function CompareTableCard({
  section,
  viewerIsReportA,
  names,
}: {
  section: CompareTableSection;
  viewerIsReportA: boolean;
  names: [string, string];
}) {
  const t = useMessages().relationshipDrilldown.friendship;
  return (
    <RelationshipReportCard title={section.title} accentColor={ACCENT}>
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[520px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.04]">
              <th className="px-4 py-3 font-semibold text-white/55">&nbsp;</th>
              <th className="px-4 py-3 font-semibold text-white/80">{names[0]}</th>
              <th className="px-4 py-3 font-semibold text-white/80">{names[1]}</th>
              <th className="px-4 py-3 font-semibold text-white/55">{t.compareTableColMeaning}</th>
            </tr>
          </thead>
          <tbody>
            {section.rows.map((row, i) => {
              const me = viewerIsReportA ? row.personA : row.personB;
              const partner = viewerIsReportA ? row.personB : row.personA;
              return (
                <tr key={row.id} className={i % 2 === 0 ? "bg-white/[0.015]" : undefined}>
                  <td className="border-t border-white/8 px-4 py-3 align-top font-medium text-white/70">
                    {row.label}
                  </td>
                  <td className="border-t border-white/8 px-4 py-3 align-top font-semibold" style={{ color: ACCENT }}>
                    {me.shortLabel}
                  </td>
                  <td className="border-t border-white/8 px-4 py-3 align-top font-semibold text-white/85">
                    {partner.shortLabel}
                  </td>
                  <td className="border-t border-white/8 px-4 py-3 align-top text-white/72">
                    {row.meaning}
                    {row.psych_note ? (
                      <p className="mt-1.5 text-xs text-white/50">{row.psych_note}</p>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
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

// ---- Part 2: Social DNA --------------------------------------------------------

function SocialDnaCard({ section }: { section: SocialDnaSection }) {
  const t = useMessages().relationshipDrilldown.friendship;
  const people = [
    { label: "me" as const, person: section.dna.me },
    { label: "partner" as const, person: section.dna.partner },
  ];
  return (
    <RelationshipReportCard title={section.title} accentColor={ACCENT}>
      <RelationshipReportBody className="grid gap-4 sm:grid-cols-2">
        {people.map(({ label, person }) => (
          <RelationshipReportInset key={label}>
            <p className="text-sm font-bold text-white/92">👤 {person.nickname}</p>
            <p className="mt-2 text-base font-semibold" style={{ color: ACCENT }}>
              {person.social_title}
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <RelationshipReportLabel>{t.positionLabel}</RelationshipReportLabel>
                <RelationshipReportParagraph className="mt-1.5">{person.friend_position}</RelationshipReportParagraph>
              </div>
              {person.guardian_character ? (
                <div>
                  <RelationshipReportLabel>{t.guardianCharacterLabel}</RelationshipReportLabel>
                  <RelationshipReportParagraph className="mt-1.5">
                    <span className="font-semibold" style={{ color: ACCENT }}>
                      {person.guardian_character.label}
                    </span>{" "}
                    — {person.guardian_character.description}
                  </RelationshipReportParagraph>
                </div>
              ) : null}
              <div>
                <RelationshipReportLabel>{t.banterLabel}</RelationshipReportLabel>
                <RelationshipReportParagraph className="mt-1.5">
                  {person.tikitaka_label} — {person.tikitaka_description}
                </RelationshipReportParagraph>
              </div>
              <div>
                <RelationshipReportLabel>{t.batteryLabel}</RelationshipReportLabel>
                <RelationshipReportParagraph className="mt-1.5">{person.battery_description}</RelationshipReportParagraph>
              </div>
              <div>
                <RelationshipReportLabel>{t.privateSideLabel}</RelationshipReportLabel>
                <RelationshipReportParagraph className="mt-1.5">{person.private_self}</RelationshipReportParagraph>
              </div>
            </div>
          </RelationshipReportInset>
        ))}
      </RelationshipReportBody>
    </RelationshipReportCard>
  );
}

// ---- Part 3: 숨겨진 흐름 --------------------------------------------------------

function SoulmateCard({ section }: { section: SoulmateSection }) {
  return (
    <RelationshipReportCard title={section.title} accentColor={ACCENT}>
      <RelationshipReportParagraph>{section.verdict}</RelationshipReportParagraph>
    </RelationshipReportCard>
  );
}

function PlayMoneyCard({ section }: { section: PlayMoneySection }) {
  const t = useMessages().relationshipDrilldown.friendship;
  return (
    <RelationshipReportCard title={section.title} accentColor={ACCENT}>
      <RelationshipReportBody>
        <div>
          <RelationshipReportLabel>{t.treasurerLabel}</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1.5">
            {section.treasurerNickname} — {section.treasurerReason}
          </RelationshipReportParagraph>
        </div>
        <div>
          <RelationshipReportLabel>{t.optimalHangoutLabel}</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1.5">{section.optimalHangout}</RelationshipReportParagraph>
        </div>
      </RelationshipReportBody>
    </RelationshipReportCard>
  );
}

// ---- Part 4: 방어벽 -------------------------------------------------------------

function BreakupGuideCard({ section }: { section: BreakupGuideSection }) {
  return (
    <RelationshipReportCard title={section.title} accentColor={ACCENT} variant="warning">
      <RelationshipReportBody>
        <RelationshipReportParagraph>{section.warnings.me}</RelationshipReportParagraph>
        <RelationshipReportParagraph>{section.warnings.partner}</RelationshipReportParagraph>
      </RelationshipReportBody>
    </RelationshipReportCard>
  );
}

// ---- Part 5: 회복 처방전 ---------------------------------------------------------

function DeEscalationCard({ section }: { section: DeEscalationSection }) {
  return (
    <RelationshipReportCard
      title={section.title}
      accentColor={ACCENT}
      variant={DE_ESCALATION_VARIANT[section.color] ?? "default"}
    >
      <RelationshipReportBody>
        <p className="text-lg font-bold text-white/95">{section.hashtag}</p>
        <p className="text-sm text-white/50">{section.archetypeLabel}</p>
        <RelationshipReportInset className="mt-2 border-emerald-400/20 bg-emerald-950/10">
          <RelationshipReportParagraph className="italic text-emerald-100/85">
            💬 {section.cheatScript}
          </RelationshipReportParagraph>
        </RelationshipReportInset>
      </RelationshipReportBody>
    </RelationshipReportCard>
  );
}

function PrescriptionCard({ section }: { section: PrescriptionSection }) {
  const pack = {
    schema_version: "friend_prescription_v1",
    intro_line: section.introLine,
    items: section.items,
  };
  return <PairPrescriptionSection pack={pack} accentColor={ACCENT} domain="friendship" />;
}

// ---- Dispatcher -------------------------------------------------------------

type NonSnapshotSection = Exclude<FriendReportSection, { type: "snapshot" }>;

export function FriendReportSectionCard({
  section,
  names,
  viewerIsReportA,
}: {
  section: NonSnapshotSection;
  names: [string, string];
  viewerIsReportA: boolean;
}): ReactNode {
  switch (section.type) {
    case "compare_table":
      return <CompareTableCard section={section} viewerIsReportA={viewerIsReportA} names={names} />;
    case "psych_radar":
      return <PsychRadarCard section={section} names={names} />;
    case "social_dna":
      return <SocialDnaCard section={section} />;
    case "soulmate":
      return <SoulmateCard section={section} />;
    case "play_money":
      return <PlayMoneyCard section={section} />;
    case "breakup_guide":
      return <BreakupGuideCard section={section} />;
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
export function FriendReportViewModelView({
  vm,
  kindLabel,
  viewerIsReportA,
}: {
  vm: FriendReportViewModel;
  kindLabel?: string;
  viewerIsReportA: boolean;
}) {
  const t = useMessages().relationshipDrilldown.friendship;
  const partTitles: Record<1 | 2 | 3 | 4 | 5, string> = {
    1: t.part1Title,
    2: t.part2Title,
    3: t.part3Title,
    4: t.part4Title,
    5: t.part5Title,
  };
  const snapshot = vm.sections.find(
    (s): s is Extract<FriendReportSection, { type: "snapshot" }> => s.type === "snapshot",
  );
  const otherSections = vm.sections.filter(
    (s): s is NonSnapshotSection => s.type !== "snapshot",
  );

  return (
    <RelationshipReportLayout
      kind="friendship"
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
              { emoji: "🔥", label: t.scoreLabelChemistry, value: snapshot.scores.connectionPct, tone: "warm" },
              { emoji: "🧩", label: t.scoreLabelBanter, value: snapshot.scores.banterPct, tone: "cool" },
              { emoji: "⚡", label: t.scoreLabelRisk, value: snapshot.scores.riskPct, tone: "alert" },
            ]
          : []
      }
      scoreFooter={
        snapshot ? (
          <>
            <TriScoreSnapshotPanel panel={snapshot.panel} kind="friendship" />
            {snapshot.vibeAxisNotes ? (
              <div className="mt-3 space-y-1 text-xs text-white/70">
                {snapshot.vibeAxisNotes.connectionNote ? <p>{snapshot.vibeAxisNotes.connectionNote}</p> : null}
                {snapshot.vibeAxisNotes.banterNote ? <p>{snapshot.vibeAxisNotes.banterNote}</p> : null}
                {snapshot.vibeAxisNotes.riskNote ? <p>{snapshot.vibeAxisNotes.riskNote}</p> : null}
              </div>
            ) : null}
          </>
        ) : undefined
      }
    >
      {(() => {
        let lastPartNumber: number | null = null;
        return otherSections.map((section) => {
          const showHeading = section.partNumber !== lastPartNumber;
          lastPartNumber = section.partNumber;
          return (
            <div key={section.id} className="space-y-5 sm:space-y-6">
              {showHeading ? <PartHeading title={partTitles[section.partNumber]} /> : null}
              <FriendReportSectionCard section={section} names={vm.opening.names} viewerIsReportA={viewerIsReportA} />
            </div>
          );
        });
      })()}
    </RelationshipReportLayout>
  );
}
