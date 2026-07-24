"use client";

/**
 * Work Colleague Premium — WorkReportViewModel 전용 렌더러.
 *
 * WorkColleagueReportView.tsx에서 en-US/ko-KR 둘 다에 대해 production 렌더링에
 * 쓰인다(구조 체크 통과 시). buildWorkColleagueReport.ts는 건드리지 않았고,
 * 여기서 재사용하는 reportLayout·TriScoreSnapshotPanel·PairPrescriptionSection·
 * PsychMatchRadarChart도 원본 그대로다(수정 없음).
 *
 * 카드 내부 라벨은 전부 `useMessages().relationshipDrilldown.work`(i18n 메시지
 * 카탈로그)에서 가져온다 — 하드코딩 금지, 새 라벨이 필요하면 en-US.ts/ko-KR.ts에
 * 같이 추가할 것.
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
import {
  DnaCard,
  UpsetGuideCard,
  IdealRoleCard,
  RoleCard,
  DeEscalationBlock,
} from "@/components/relationship/workColleague/officeCards";
import type { PairPrescriptionPack } from "@/lib/relationship/shared/pairPrescriptionUiTypes";
import type {
  CompareTableSection,
  ComparisonSection,
  PrescriptionSection,
  PsychRadarSection,
  RelationshipLoopSection,
  RoleMatrixSection,
  WarningSection,
  WorkReportSection,
  WorkReportViewModel,
} from "@/lib/relationship/workColleague/viewModel/workReportSectionTypes";
import { useMessages } from "@/lib/i18n/LocaleProvider";

const ACCENT = getTabTheme("work").accent;

// ---- Part 1a: 한눈에 비교 표 (사주 6종) ------------------------------------

function CompareTableCard({ section, names }: { section: CompareTableSection; names: [string, string] }) {
  const t = useMessages().relationshipDrilldown.work;
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
            {section.rows.map((row, i) => (
              <tr key={row.id} className={i % 2 === 0 ? "bg-white/[0.015]" : undefined}>
                <td className="border-t border-white/8 px-4 py-3 align-top font-medium text-white/70">
                  {row.label}
                </td>
                <td className="border-t border-white/8 px-4 py-3 align-top font-semibold" style={{ color: ACCENT }}>
                  {row.me.shortLabel}
                </td>
                <td className="border-t border-white/8 px-4 py-3 align-top font-semibold text-white/85">
                  {row.partner.shortLabel}
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

// ---- Part 1b: 11축 궁합 레이더 --------------------------------------------

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

// ---- Part 2: 두 사람의 업무 스타일 -----------------------------------------

function ComparisonCard({ section, names }: { section: ComparisonSection; names: [string, string] }) {
  const t = useMessages().relationshipDrilldown.work;
  return (
    <RelationshipReportCard title={section.title} accentColor={ACCENT}>
      <div className="grid gap-4 sm:grid-cols-2">
        <DnaCard label="👤" profile={section.dna.me} accent={ACCENT} />
        <DnaCard label="👤" profile={section.dna.partner} accent={ACCENT} />
      </div>
      <RelationshipReportBody className="mt-4">
        <div>
          <RelationshipReportLabel>{t.workStyleLabel(names[0])}</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1.5">{section.workStyle.me}</RelationshipReportParagraph>
        </div>
        <div>
          <RelationshipReportLabel>{t.workStyleLabel(names[1])}</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1.5">{section.workStyle.partner}</RelationshipReportParagraph>
        </div>
        <div>
          <RelationshipReportLabel>{t.communicationFitLabel}</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1.5">{section.communicationFit}</RelationshipReportParagraph>
        </div>
        {section.boundary ? (
          <>
            <div>
              <RelationshipReportLabel>{t.boundaryLabel(names[0])}</RelationshipReportLabel>
              <RelationshipReportParagraph className="mt-1.5">{section.boundary.me}</RelationshipReportParagraph>
            </div>
            <div>
              <RelationshipReportLabel>{t.boundaryLabel(names[1])}</RelationshipReportLabel>
              <RelationshipReportParagraph className="mt-1.5">{section.boundary.partner}</RelationshipReportParagraph>
            </div>
          </>
        ) : null}
        {section.reportingStyleFit ? (
          <div>
            <RelationshipReportLabel>{t.reportingStyleFitLabel}</RelationshipReportLabel>
            <RelationshipReportParagraph className="mt-1.5">{section.reportingStyleFit.summary}</RelationshipReportParagraph>
          </div>
        ) : null}
        {section.breakBoundaryFit ? (
          <div>
            <RelationshipReportLabel>{t.breakBoundaryFitLabel}</RelationshipReportLabel>
            <RelationshipReportParagraph className="mt-1.5">{section.breakBoundaryFit.summary}</RelationshipReportParagraph>
          </div>
        ) : null}
      </RelationshipReportBody>
    </RelationshipReportCard>
  );
}

// ---- Part 3: 역할 및 기여 방식 ---------------------------------------------

function RoleMatrixCard({ section }: { section: RoleMatrixSection }) {
  return (
    <RelationshipReportCard title={section.title} accentColor={ACCENT}>
      <div className="grid gap-4 sm:grid-cols-2">
        <RoleCard card={section.roles.me} accent={ACCENT} />
        <RoleCard card={section.roles.partner} accent={ACCENT} />
      </div>
      {section.synergyOneLiner ? (
        <RelationshipReportParagraph className="mt-4 italic">💬 {section.synergyOneLiner}</RelationshipReportParagraph>
      ) : null}
      {section.idealFit ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <IdealRoleCard label="👤" fit={section.idealFit.me} accent={ACCENT} />
          <IdealRoleCard label="👤" fit={section.idealFit.partner} accent={ACCENT} />
        </div>
      ) : null}
      {section.togetherCombo ? (
        <RelationshipReportParagraph className="mt-4 italic">💬 {section.togetherCombo}</RelationshipReportParagraph>
      ) : null}
      {section.leadershipSplit ? (
        <div className="mt-4">
          {section.leadershipCanonicalLabel ? (
            <RelationshipReportLabel className="mb-1.5">
              {section.leadershipCanonicalLabel}
            </RelationshipReportLabel>
          ) : null}
          <RelationshipReportParagraph className="italic">
            🎤 {section.leadershipSplit.summary}
          </RelationshipReportParagraph>
        </div>
      ) : null}
    </RelationshipReportCard>
  );
}

// ---- Part 3: 함께 일할 때 반복되는 흐름 -------------------------------------

function LoopRow({ title, body, isFirst }: { title: string; body: string; isFirst: boolean }) {
  return (
    <div>
      {isFirst ? null : <p className="py-1 text-center text-white/30">↓</p>}
      <RelationshipReportInset>
        <p className="text-sm font-semibold text-white/90">{title}</p>
        <RelationshipReportParagraph className="mt-1.5">{body}</RelationshipReportParagraph>
      </RelationshipReportInset>
    </div>
  );
}

function RelationshipLoopCard({ section }: { section: RelationshipLoopSection }) {
  const t = useMessages().relationshipDrilldown.work;
  return (
    <RelationshipReportCard title={section.title} accentColor={ACCENT}>
      {section.positiveLoop.length > 0 ? (
        <div className="space-y-1">
          <RelationshipReportLabel className="text-emerald-200/90">{t.loopStrengthLabel}</RelationshipReportLabel>
          {section.positiveLoop.map((item, i) => (
            <LoopRow key={`pos-${item.title}-${i}`} title={item.title} body={item.body} isFirst={i === 0} />
          ))}
        </div>
      ) : null}
      {section.frictionLoop.length > 0 ? (
        <div className={section.positiveLoop.length > 0 ? "mt-6 space-y-1" : "space-y-1"}>
          <RelationshipReportLabel className="text-red-200/80">{t.loopFrictionLabel}</RelationshipReportLabel>
          {section.frictionLoop.map((item, i) => (
            <LoopRow key={`fric-${item.title}-${i}`} title={item.title} body={item.body} isFirst={i === 0} />
          ))}
        </div>
      ) : null}
    </RelationshipReportCard>
  );
}

// ---- Part 4: 협업 안전장치 --------------------------------------------------

function WarningCard({ section }: { section: WarningSection }) {
  const t = useMessages().relationshipDrilldown.work;
  return (
    <RelationshipReportCard title={section.title} accentColor={ACCENT} variant="warning">
      <RelationshipReportBody>
        <div>
          <RelationshipReportLabel>{t.conflictTriggerLabel}</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1.5">{section.conflictTrigger}</RelationshipReportParagraph>
        </div>
        <DeEscalationBlock deCard={section.deEscalation} />
      </RelationshipReportBody>
      {section.upset ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <UpsetGuideCard guide={section.upset.me} />
          <UpsetGuideCard guide={section.upset.partner} />
        </div>
      ) : null}
      {section.feedbackCushion ? (
        <div className="mt-4">
          <RelationshipReportLabel>{t.feedbackCushionLabel}</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1.5">{section.feedbackCushion.to_a}</RelationshipReportParagraph>
          <RelationshipReportParagraph className="mt-1.5">{section.feedbackCushion.to_b}</RelationshipReportParagraph>
        </div>
      ) : null}
    </RelationshipReportCard>
  );
}

// ---- Part 5: 실전 운영 가이드 ------------------------------------------------

function PrescriptionCard({ section }: { section: PrescriptionSection }) {
  const t = useMessages().relationshipDrilldown.work;
  const pack: PairPrescriptionPack = {
    schema_version: "work_prescription_v1",
    intro_line: section.introLine,
    items: section.items,
  };
  return (
    <>
      {section.weeklyCheckIn ? (
        <RelationshipReportCard title={t.weeklyCheckInTitle} accentColor={ACCENT} variant="success">
          <RelationshipReportParagraph>{section.weeklyCheckIn.evidence.summary}</RelationshipReportParagraph>
          <ul className="mt-3 list-inside list-disc space-y-1">
            {section.weeklyCheckIn.do_list.map((item) => (
              <li key={item}>
                <RelationshipReportParagraph>{item}</RelationshipReportParagraph>
              </li>
            ))}
          </ul>
        </RelationshipReportCard>
      ) : null}
      <PairPrescriptionSection pack={pack} accentColor={ACCENT} domain="work" />
    </>
  );
}

// ---- Part 구분선 --------------------------------------------------------------

/**
 * `WorkReportSection.partNumber`(1~5)는 원래 존재했지만 렌더러가 소비한 적이
 * 없어서 화면에는 "Part로 나뉘어 있다"는 표시가 전혀 없었다(카드만 쭉 나열).
 * 이 컴포넌트가 partNumber가 바뀔 때마다 눈에 보이는 구분선/타이틀을 넣는다.
 */
function PartHeading({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <h2 className="text-base font-bold tracking-tight text-white/90 sm:text-lg">{title}</h2>
      <div className="h-px flex-1" style={{ backgroundColor: `${ACCENT}33` }} />
    </div>
  );
}

// ---- Dispatcher -------------------------------------------------------------

type NonSnapshotSection = Exclude<WorkReportSection, { type: "snapshot" }>;

export function WorkReportSectionCard({
  section,
  names,
}: {
  section: NonSnapshotSection;
  names: [string, string];
}): ReactNode {
  switch (section.type) {
    case "compare_table":
      return <CompareTableCard section={section} names={names} />;
    case "psych_radar":
      return <PsychRadarCard section={section} names={names} />;
    case "comparison":
      return <ComparisonCard section={section} names={names} />;
    case "role_matrix":
      return <RoleMatrixCard section={section} />;
    case "relationship_loop":
      return <RelationshipLoopCard section={section} />;
    case "warning":
      return <WarningCard section={section} />;
    case "prescription":
      return <PrescriptionCard section={section} />;
    default: {
      // 컴파일 타임 exhaustiveness guard — 새 section.type이 추가되면 여기서 타입 에러가 난다.
      const exhaustiveCheck: never = section;
      return exhaustiveCheck;
    }
  }
}

/** ViewModel 전체를 RelationshipReportLayout에 조립 — production 진입점. */
export function WorkReportViewModelView({
  vm,
  kindLabel,
}: {
  vm: WorkReportViewModel;
  kindLabel?: string;
}) {
  const t = useMessages().relationshipDrilldown.work;
  const snapshot = vm.sections.find(
    (s): s is Extract<WorkReportSection, { type: "snapshot" }> => s.type === "snapshot",
  );
  const otherSections = vm.sections.filter(
    (s): s is NonSnapshotSection => s.type !== "snapshot",
  );

  return (
    <RelationshipReportLayout
      kind="work"
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
              { emoji: "🔥", label: t.scoreLabelFit, value: snapshot.scores.fitPct, tone: "warm" },
              { emoji: "🧩", label: t.scoreLabelSynergy, value: snapshot.scores.synergyPct, tone: "cool" },
              { emoji: "⚡", label: t.scoreLabelRisk, value: snapshot.scores.riskPct, tone: "alert" },
            ]
          : []
      }
      scoreFooter={snapshot ? <TriScoreSnapshotPanel panel={snapshot.panel} kind="work" /> : undefined}
    >
      {(() => {
        const partTitles: Record<1 | 2 | 3 | 4 | 5, string> = {
          1: t.part1Title,
          2: t.part2Title,
          3: t.part3Title,
          4: t.part4Title,
          5: t.part5Title,
        };
        let lastPartNumber: number | null = null;
        return otherSections.map((section) => {
          const showHeading = section.partNumber !== lastPartNumber;
          lastPartNumber = section.partNumber;
          return (
            <div key={section.id} className="space-y-5 sm:space-y-6">
              {showHeading ? <PartHeading title={partTitles[section.partNumber]} /> : null}
              <WorkReportSectionCard section={section} names={vm.opening.names} />
            </div>
          );
        });
      })()}
    </RelationshipReportLayout>
  );
}
