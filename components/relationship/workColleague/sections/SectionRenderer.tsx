"use client";

/**
 * Work Colleague Premium — WorkReportViewModel 전용 렌더러 (Phase 2, 프리뷰 전용).
 *
 * 현재 어디에서도 production 라우트(app/relationship/[id]/...)에 연결되지 않는다 —
 * app/dev/work-report-viewmodel/page.tsx의 시각 검증용으로만 쓰인다.
 * buildWorkColleagueReport.ts / WorkColleagueReportView.tsx는 건드리지 않았고,
 * 여기서 재사용하는 reportLayout·TriScoreSnapshotPanel·PairPrescriptionSection·
 * PsychMatchRadarChart도 원본 그대로다(수정 없음).
 *
 * SECTION_TITLES 계열 한국어 문자열은 이번 phase(ko-KR 전용) 기준 하드코딩이며,
 * en-US 렌더러가 붙는 단계에서 relationshipDrilldown.work i18n 메시지로 이관해야 한다.
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
  ComparisonSection,
  PrescriptionSection,
  PsychRadarSection,
  RelationshipLoopSection,
  RoleMatrixSection,
  WarningSection,
  WorkReportSection,
  WorkReportViewModel,
} from "@/lib/relationship/workColleague/viewModel/workReportSectionTypes";

const ACCENT = getTabTheme("work").accent;

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

function ComparisonCard({ section }: { section: ComparisonSection }) {
  return (
    <RelationshipReportCard title={section.title} accentColor={ACCENT}>
      <div className="grid gap-4 sm:grid-cols-2">
        <DnaCard label="👤" profile={section.dna.me} accent={ACCENT} />
        <DnaCard label="👤" profile={section.dna.partner} accent={ACCENT} />
      </div>
      <RelationshipReportBody className="mt-4">
        <div>
          <RelationshipReportLabel>업무 운영 리듬 (나)</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1.5">{section.workStyle.me}</RelationshipReportParagraph>
        </div>
        <div>
          <RelationshipReportLabel>업무 운영 리듬 (상대)</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1.5">{section.workStyle.partner}</RelationshipReportParagraph>
        </div>
        <div>
          <RelationshipReportLabel>보고·소통 궁합</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1.5">{section.communicationFit}</RelationshipReportParagraph>
        </div>
        {section.boundary ? (
          <>
            <div>
              <RelationshipReportLabel>존중해야 할 경계 (나)</RelationshipReportLabel>
              <RelationshipReportParagraph className="mt-1.5">{section.boundary.me}</RelationshipReportParagraph>
            </div>
            <div>
              <RelationshipReportLabel>존중해야 할 경계 (상대)</RelationshipReportLabel>
              <RelationshipReportParagraph className="mt-1.5">{section.boundary.partner}</RelationshipReportParagraph>
            </div>
          </>
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
  return (
    <RelationshipReportCard title={section.title} accentColor={ACCENT}>
      {section.positiveLoop.length > 0 ? (
        <div className="space-y-1">
          <RelationshipReportLabel className="text-emerald-200/90">강점이 연결되는 흐름</RelationshipReportLabel>
          {section.positiveLoop.map((item, i) => (
            <LoopRow key={`pos-${item.title}-${i}`} title={item.title} body={item.body} isFirst={i === 0} />
          ))}
        </div>
      ) : null}
      {section.frictionLoop.length > 0 ? (
        <div className={section.positiveLoop.length > 0 ? "mt-6 space-y-1" : "space-y-1"}>
          <RelationshipReportLabel className="text-red-200/80">오해가 쌓이는 흐름</RelationshipReportLabel>
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
  return (
    <RelationshipReportCard title={section.title} accentColor={ACCENT} variant="warning">
      <RelationshipReportBody>
        <div>
          <RelationshipReportLabel>갈등 트리거</RelationshipReportLabel>
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
    </RelationshipReportCard>
  );
}

// ---- Part 5: 실전 운영 가이드 ------------------------------------------------

function PrescriptionCard({ section }: { section: PrescriptionSection }) {
  const pack: PairPrescriptionPack = {
    schema_version: "work_prescription_v1",
    intro_line: section.introLine,
    items: section.items,
  };
  return (
    <>
      {section.weeklyCheckIn ? (
        <RelationshipReportCard title="주간 10분 체크인" accentColor={ACCENT} variant="success">
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
    case "psych_radar":
      return <PsychRadarCard section={section} names={names} />;
    case "comparison":
      return <ComparisonCard section={section} />;
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

/** ViewModel 전체를 RelationshipReportLayout에 조립 — 프리뷰 전용 진입점. */
export function WorkReportViewModelView({
  vm,
  kindLabel = "동료·비즈니스 파트너",
}: {
  vm: WorkReportViewModel;
  kindLabel?: string;
}) {
  const snapshot = vm.sections.find(
    (s): s is Extract<WorkReportSection, { type: "snapshot" }> => s.type === "snapshot",
  );
  const otherSections = vm.sections.filter(
    (s): s is NonSnapshotSection => s.type !== "snapshot",
  );

  return (
    <RelationshipReportLayout
      kind="work"
      kindLabel={kindLabel}
      headline={{
        title: vm.opening.headline,
        subtitle: vm.opening.subtitle,
        names: vm.opening.names,
        badge: vm.opening.grade ? `등급 ${vm.opening.grade}` : undefined,
      }}
      scores={
        snapshot
          ? [
              { emoji: "🔥", label: "업무적 핏", value: snapshot.scores.fitPct, tone: "warm" },
              { emoji: "🧩", label: "협업 시너지", value: snapshot.scores.synergyPct, tone: "cool" },
              { emoji: "⚡", label: "오피스 리스크", value: snapshot.scores.riskPct, tone: "alert" },
            ]
          : []
      }
      scoreFooter={snapshot ? <TriScoreSnapshotPanel panel={snapshot.panel} kind="work" /> : undefined}
    >
      {otherSections.map((section) => (
        <WorkReportSectionCard key={section.id} section={section} names={vm.opening.names} />
      ))}
    </RelationshipReportLayout>
  );
}
