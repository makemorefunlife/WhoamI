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
import { MessageCircle, Mic, AlertTriangle } from "lucide-react";
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
import { WorkChapterNav, WorkChapterSection } from "@/components/relationship/workColleague/chapters/WorkChapterShell";
import TriScoreSnapshotPanel from "@/components/relationship/TriScoreSnapshotPanel";
import { OverviewSection } from "@/components/relationship/shared/overview/OverviewSection";
import type { OverviewCardData } from "@/lib/relationship/shared/overview/overviewTypes";
import { PsychAxisComparisonSection } from "@/components/relationship/shared/psychAxis/PsychAxisComparisonSection";
import { VersusStrip, Evidence, Reveal } from "@/components/relationship/shared/editorial/EditorialPrimitives";
import { pick } from "@/lib/relationship/friend/friendCopy";
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
  DeepReadSection,
  PrescriptionSection,
  PsychRadarSection,
  RelationshipLoopSection,
  RoleMatrixSection,
  WarningSection,
  WorkReportSection,
  WorkReportViewModel,
} from "@/lib/relationship/workColleague/viewModel/workReportSectionTypes";
import DeepReadCard from "@/components/relationship/shared/DeepReadCard";
import { useMessages, useLocale } from "@/lib/i18n/LocaleProvider";

const ACCENT = getTabTheme("work").accent;

// ---- Part 1a: 한눈에 비교 표 (사주 6종) ------------------------------------

function CompareTableCard({ section, names }: { section: CompareTableSection; names: [string, string] }) {
  const t = useMessages().relationshipDrilldown.work;
  return (
    <div className="mt-8">
      <ul className="space-y-12">
        {section.rows.map((row, i) => (
          <li key={row.id}>
            <Reveal delay={i * 50}>
              <VersusStrip label={row.label} aName={names[0]} bName={names[1]} a={row.me.shortLabel} b={row.partner.shortLabel} />
              <p className="mt-3 font-rel-sans text-[14px] leading-[1.8] text-rel-ink-soft">
                {row.meaning}
              </p>
              <div className="mt-10 h-px w-full bg-rel-line" />
            </Reveal>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---- Part 1b: 11축 궁합 레이더 --------------------------------------------

function PsychRadarCard({ section, names }: { section: PsychRadarSection; names: [string, string] }) {
  const { locale } = useLocale();
  return (
    <div className="mt-6">
      <PsychAxisComparisonSection
        axisResults={section.axisResults}
        highlights={section.highlights}
        chartNote={section.chartNote}
        names={names}
        locale={locale}
      />
    </div>
  );
}

// ---- Part 2: 두 사람의 업무 스타일 -----------------------------------------

function ComparisonCard({ section, names }: { section: ComparisonSection; names: [string, string] }) {
  const t = useMessages().relationshipDrilldown.work;
  return (
    <RelationshipReportCard title={section.title} accentColor={ACCENT}>
      <div className="grid gap-4 sm:grid-cols-2">
        <DnaCard profile={section.dna.me} accent={ACCENT} />
        <DnaCard profile={section.dna.partner} accent={ACCENT} />
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
        <RelationshipReportParagraph className="mt-4 flex items-start gap-2 italic">
          <MessageCircle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: ACCENT }} strokeWidth={1.75} aria-hidden />
          {section.synergyOneLiner}
        </RelationshipReportParagraph>
      ) : null}
      {section.idealFit ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <IdealRoleCard fit={section.idealFit.me} accent={ACCENT} />
          <IdealRoleCard fit={section.idealFit.partner} accent={ACCENT} />
        </div>
      ) : null}
      {section.togetherCombo ? (
        <RelationshipReportParagraph className="mt-4 flex items-start gap-2 italic">
          <MessageCircle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: ACCENT }} strokeWidth={1.75} aria-hidden />
          {section.togetherCombo}
        </RelationshipReportParagraph>
      ) : null}
      {section.leadershipSplit ? (
        <div className="mt-4">
          {section.leadershipCanonicalLabel ? (
            <RelationshipReportLabel className="mb-1.5">
              {section.leadershipCanonicalLabel}
            </RelationshipReportLabel>
          ) : null}
          <RelationshipReportParagraph className="flex items-start gap-2 italic">
            <Mic className="mt-0.5 h-4 w-4 shrink-0" style={{ color: ACCENT }} strokeWidth={1.75} aria-hidden />
            {section.leadershipSplit.summary}
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

// ---- Part 3b: 심층 리드 (business_saju_deep 오버레이) ------------------------

function DeepReadSectionCard({ section }: { section: DeepReadSection }) {
  const t = useMessages().relationshipDrilldown.work;
  return (
    <DeepReadCard
      vm={section.vm}
      accentColor={ACCENT}
      labels={{
        cardTitle: section.title,
        voiceMe: t.deepReadVoiceMeLabel,
        voicePartner: t.deepReadVoicePartnerLabel,
        pattern: t.deepReadPatternLabel,
        adviceMe: t.deepReadAdviceMeLabel,
        advicePartner: t.deepReadAdvicePartnerLabel,
        together: t.deepReadTogetherLabel,
      }}
    />
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
        {section.pairComplaintNote ? (
          <RelationshipReportInset className="border-amber-400/20 bg-amber-950/10">
            <RelationshipReportParagraph className="flex items-start gap-2 text-amber-100/85">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" strokeWidth={1.75} aria-hidden />
              {section.pairComplaintNote}
            </RelationshipReportParagraph>
          </RelationshipReportInset>
        ) : null}
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
          <RelationshipReportParagraph className="mt-1.5 flex items-start gap-2">
            <MessageCircle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: ACCENT }} strokeWidth={1.75} aria-hidden />
            {section.feedbackCushion.to_a}
          </RelationshipReportParagraph>
          <RelationshipReportParagraph className="mt-1.5 flex items-start gap-2">
            <MessageCircle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: ACCENT }} strokeWidth={1.75} aria-hidden />
            {section.feedbackCushion.to_b}
          </RelationshipReportParagraph>
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

// ---- 8-chapter structure ------------------------------------------------------
// Regroups the same 8 WorkReportSection types (no data change) into a numbered
// 8-chapter read, one existing section type per chapter — mirrors the
// Romantic V4 / Family chapter nav+numbering pattern. `deep_read` (the
// optional business_saju_deep LLM overlay) is the only section that can be
// absent; numbers are computed from whichever chapters are actually present
// each render, so a missing deep_read can never leave a gap in the sequence.
type WorkSectionType = WorkReportSection["type"];

const CHAPTER_ORDER: Array<{
  type: Exclude<WorkSectionType, "snapshot">;
  titleKo: string;
  titleEn: string;
}> = [
  { type: "compare_table", titleKo: "한눈에 보는 오피스 파트너십", titleEn: "Your Office Partnership at a Glance" },
  { type: "psych_radar", titleKo: "우리가 일하는 방식의 차이", titleEn: "How We Work Differently" },
  { type: "comparison", titleKo: "나의 오피스 캐릭터와 강점", titleEn: "My Office Character & Strengths" },
  { type: "role_matrix", titleKo: "가장 완벽한 업무 분담법", titleEn: "The Perfect Way to Split the Work" },
  { type: "relationship_loop", titleKo: "회의실에서 부딪히는 순간", titleEn: "Where We Clash in the Meeting Room" },
  { type: "deep_read", titleKo: "차이가 만든 오피스 오해 번역기", titleEn: "Translating Our Office Misunderstandings" },
  { type: "warning", titleKo: "스트레스와 불만이 쌓였을 때", titleEn: "When Stress and Frustration Build Up" },
  { type: "prescription", titleKo: "성공적인 협업을 위한 행동 처방전", titleEn: "The Playbook for Working Well Together" },
];

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
    case "deep_read":
      return <DeepReadSectionCard section={section} />;
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
  const { locale } = useLocale();
  const t = useMessages().relationshipDrilldown.work;
  const isEn = locale === "en-US";

  const snapshot = vm.sections.find(
    (s): s is Extract<WorkReportSection, { type: "snapshot" }> => s.type === "snapshot",
  );
  const otherSections = vm.sections.filter(
    (s): s is NonSnapshotSection => s.type !== "snapshot",
  );
  const byType = new Map<WorkSectionType, NonSnapshotSection>();
  for (const section of otherSections) byType.set(section.type, section);

  const chapters = CHAPTER_ORDER.map((chapter) => ({
    ...chapter,
    section: byType.get(chapter.type),
  })).filter((chapter): chapter is typeof chapter & { section: NonSnapshotSection } => Boolean(chapter.section));

  const navItems = chapters.map((chapter, i) => ({
    id: `ch_${chapter.type}`,
    number: String(i + 1).padStart(2, "0"),
    title: isEn ? chapter.titleEn : chapter.titleKo,
  }));

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
      scores={[]}
    >
      {snapshot ? (() => {
        const fit = snapshot.panel.narrative.topics.find(t => t.topic === "intimacy")!;
        const synergy = snapshot.panel.narrative.topics.find(t => t.topic === "stability")!;
        const risk = snapshot.panel.narrative.topics.find(t => t.topic === "conflict")!;
        
        const cards: OverviewCardData[] = [
          {
            key: "fit",
            icon: "🔥",
            label: t.scoreLabelFit,
            score: snapshot.scores.fitPct,
            tone: "good",
            inverted: false,
            gradeLabel: fit.title,
            oneLiner: fit.subtitle,
            measures: pick(locale, "How smoothly your work styles and paces align", "서로의 업무 템포와 방식이 얼마나 매끄럽게 호흡을 맞추는지"),
            why: fit.interpretation,
            thresholdText: fit.axisNote,
          },
          {
            key: "synergy",
            icon: "🧩",
            label: t.scoreLabelSynergy,
            score: snapshot.scores.synergyPct,
            tone: "neutral",
            inverted: false,
            gradeLabel: synergy.title,
            oneLiner: synergy.subtitle,
            measures: pick(locale, "How well your different strengths complement each other for better output", "서로 다른 강점이 시너지를 내어 결과물의 퀄리티를 얼마나 높이는지"),
            why: synergy.interpretation,
            thresholdText: synergy.axisNote,
          },
          {
            key: "risk",
            icon: "⚡",
            label: t.scoreLabelRisk,
            score: snapshot.scores.riskPct,
            tone: "warn",
            inverted: true,
            gradeLabel: risk.title,
            oneLiner: risk.subtitle,
            measures: pick(locale, "The potential for friction or misunderstanding during collaboration", "협업 과정에서 의사소통 오해나 마찰이 발생할 가능성"),
            why: risk.interpretation,
            thresholdText: risk.axisNote,
          },
        ];

        return (
          <div className="mb-12 mt-4">
            <OverviewSection
              locale={locale}
              eyebrow={pick(locale, "01 · At a Glance", "01 · 한눈에 보기")}
              title={pick(locale, "How You Work Together", "함께 일하는 방식과 시너지")}
              lead={pick(
                locale,
                "Three signals frame the shape of this partnership.",
                "세 가지 신호로 이 파트너십의 성격을 먼저 봅니다."
              )}
              cards={cards}
            />
          </div>
        );
      })() : null}
      <WorkChapterNav items={navItems} />
      {chapters.map((chapter, i) => (
        <WorkChapterSection
          key={chapter.type}
          id={`ch_${chapter.type}`}
          number={String(i + 1).padStart(2, "0")}
          title={isEn ? chapter.titleEn : chapter.titleKo}
          accent={ACCENT}
        >
          <WorkReportSectionCard section={chapter.section} names={vm.opening.names} />
        </WorkChapterSection>
      ))}
    </RelationshipReportLayout>
  );
}
