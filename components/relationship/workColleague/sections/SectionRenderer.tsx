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

// ---- Work V2 Phase 5 User Question Banner -----------------------------------

function UserQuestionBanner({ question }: { question: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs font-medium tracking-wide text-amber-200/90 sm:px-5">
      💡 <span className="font-semibold">{question}</span>
    </div>
  );
}

// ---- Work V2 Phase 5 Addition Cards ---------------------------------------

function CanonicalRoleMapCard({
  meta,
  names,
}: {
  meta: any;
  names: [string, string];
}) {
  const map = meta?.canonical_role_map;
  if (!map) return null;

  const getOwnerLabel = (owner: string) => {
    if (owner === "A" || owner === "PERSON_A") return names[0];
    if (owner === "B" || owner === "PERSON_B") return names[1];
    return "공동 / 자율 분담 (Shared)";
  };

  return (
    <RelationshipReportCard title="8차원 권한 및 역할 지도 (Canonical Role Map)" accentColor={ACCENT}>
      <RelationshipReportParagraph className="mb-4 text-xs text-white/70">
        사주 구조와 11축 심리 역량을 종합 검증한 권한 및 R&R 최적 분담 구조입니다.
      </RelationshipReportParagraph>
      <div className="grid gap-3 sm:grid-cols-2">
        <RelationshipReportInset>
          <RelationshipReportLabel className="text-amber-200/90">🧭 방향 설정 & 비전 리드 (Direction)</RelationshipReportLabel>
          <p className="mt-1 text-sm font-bold text-white">{getOwnerLabel(map.directionOwner)}</p>
        </RelationshipReportInset>
        <RelationshipReportInset>
          <RelationshipReportLabel className="text-emerald-200/90">⚡ 실제 구현 & 빠른 실행 (Execution)</RelationshipReportLabel>
          <p className="mt-1 text-sm font-bold text-white">{getOwnerLabel(map.executionOwner)}</p>
        </RelationshipReportInset>
        <RelationshipReportInset>
          <RelationshipReportLabel className="text-sky-200/90">🔍 리스크 감지 & 품질 검수 (QA / Risk)</RelationshipReportLabel>
          <p className="mt-1 text-sm font-bold text-white">{getOwnerLabel(map.qaRiskOwner)}</p>
        </RelationshipReportInset>
        <RelationshipReportInset>
          <RelationshipReportLabel className="text-purple-200/90">🎤 대외 발표 & 메인 스피커 (External Lead)</RelationshipReportLabel>
          <p className="mt-1 text-sm font-bold text-white">{getOwnerLabel(map.externalOwner)}</p>
        </RelationshipReportInset>
      </div>
      <div className="mt-3">
        <RelationshipReportInset className="border-amber-400/20 bg-amber-950/10">
        </RelationshipReportInset>
      </div>
    </RelationshipReportCard>
  );
}

function ThinkVsDiscussCard({ meta }: { meta: any }) {
  const tvd = meta?.think_vs_discuss;
  if (!tvd) return null;
  return (
    <RelationshipReportCard title="생각 정리 방식과 회의 준비 리듬 (Think vs Discuss)" accentColor={ACCENT}>
      <RelationshipReportInset className="mb-4 border-amber-400/20 bg-amber-950/10">
        <RelationshipReportLabel className="text-amber-300">💡 둘의 소통 패턴</RelationshipReportLabel>
        <RelationshipReportParagraph className="mt-1 font-semibold text-white">
          {tvd.pairPattern}
        </RelationshipReportParagraph>
      </RelationshipReportInset>
      <div className="grid gap-3 sm:grid-cols-2">
        <RelationshipReportInset>
          <RelationshipReportLabel className="text-sky-200/90">개인별 생각 정리 방식</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1 text-xs leading-relaxed text-white/85">
            {tvd.personAStyle}
          </RelationshipReportParagraph>
          <RelationshipReportParagraph className="mt-2 text-xs leading-relaxed text-white/85">
            {tvd.personBStyle}
          </RelationshipReportParagraph>
        </RelationshipReportInset>
        <RelationshipReportInset>
          <RelationshipReportLabel className="text-emerald-200/90">📋 회의 사전 준비 가이드 (Meeting Prep Rule)</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1 text-xs leading-relaxed text-white/85">
            {tvd.meetingPrep}
          </RelationshipReportParagraph>
        </RelationshipReportInset>
      </div>
    </RelationshipReportCard>
  );
}

function CrunchModeCard({
  meta,
  names,
  isEn,
}: {
  meta: any;
  names: [string, string];
  isEn?: boolean;
}) {
  const cmd = meta?.crunch_deadline_mode;
  if (!cmd) return null;
  return (
    <RelationshipReportCard
      title={isEn ? "Crunch & Emergency Response Mode" : "마감 임박 & 위기 대응 모드 (Crunch & Deadline Shift)"}
      accentColor={ACCENT}
      variant="warning"
    >
      <div className="space-y-3">
        {/* 1. 평소 vs 마감 압박 시 변화 */}
        <RelationshipReportInset className="border-amber-400/20 bg-amber-950/10">
          <RelationshipReportLabel className="text-amber-300 font-bold">
            {isEn ? "🚨 1. How Work Styles Shift Under Tight Deadlines" : "🚨 1. 평소와 다른 마감 압박 시 일하는 방식의 변화"}
          </RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1 text-xs leading-relaxed text-white/90">
            {cmd.normalVsDeadlineShift}
          </RelationshipReportParagraph>
        </RelationshipReportInset>

        {/* 2. 개인별 압박 반응 */}
        <div className="grid gap-3 sm:grid-cols-2">
          <RelationshipReportInset>
            <RelationshipReportLabel className="text-sky-200/90 font-semibold">
              ⚡ {isEn ? `${names[0]}'s Action Shift Under Pressure` : `${names[0]}님의 마감 속 행동 변화`}
            </RelationshipReportLabel>
            <RelationshipReportParagraph className="mt-1 text-xs leading-relaxed text-white/85">
              {cmd.personAPressureShift}
            </RelationshipReportParagraph>
          </RelationshipReportInset>
          <RelationshipReportInset>
            <RelationshipReportLabel className="text-purple-200/90 font-semibold">
              🛡️ {isEn ? `${names[1]}'s Action Shift Under Pressure` : `${names[1]}님의 마감 속 행동 변화`}
            </RelationshipReportLabel>
            <RelationshipReportParagraph className="mt-1 text-xs leading-relaxed text-white/85">
              {cmd.personBPressureShift}
            </RelationshipReportParagraph>
          </RelationshipReportInset>
        </div>

        {/* 3. 위기 시 역할 분담 & 4. 압박 속 충돌 지점 */}
        <div className="grid gap-3 sm:grid-cols-2">
          <RelationshipReportInset>
            <RelationshipReportLabel className="text-emerald-200/90 font-semibold">
              🧩 {isEn ? "3. Natural Emergency Role Split" : "3. 위기 상황에서의 자연스러운 역할 분담"}
            </RelationshipReportLabel>
            <RelationshipReportParagraph className="mt-1 text-xs leading-relaxed text-white/85">
              {cmd.crunchRoleSplit}
            </RelationshipReportParagraph>
          </RelationshipReportInset>
          <RelationshipReportInset className="border-red-400/20 bg-red-950/10">
            <RelationshipReportLabel className="text-red-300 font-semibold">
              ⚡ {isEn ? "4. Potential Friction Point Under Stress" : "4. 마감 압박 속 생길 수 있는 충돌 지점"}
            </RelationshipReportLabel>
            <RelationshipReportParagraph className="mt-1 text-xs leading-relaxed text-white/85">
              {cmd.pressureFrictionPoint}
            </RelationshipReportParagraph>
          </RelationshipReportInset>
        </div>

        {/* 5. 실전 운영 규칙 & 버퍼 보호 */}
        <div className="grid gap-3 sm:grid-cols-3">
          <RelationshipReportInset>
            <RelationshipReportLabel className="text-amber-300 font-bold">
              ✂️ {isEn ? "Priority Cut Rule" : "우선순위 축소 규칙"}
            </RelationshipReportLabel>
            <RelationshipReportParagraph className="mt-1 text-xs leading-relaxed text-white/85">
              {cmd.priorityCutLead}
            </RelationshipReportParagraph>
          </RelationshipReportInset>
          <RelationshipReportInset>
            <RelationshipReportLabel className="text-emerald-300 font-bold">
              🛡️ {isEn ? "Quality Baseline" : "최소 품질 기준선"}
            </RelationshipReportLabel>
            <RelationshipReportParagraph className="mt-1 text-xs leading-relaxed text-white/85">
              {cmd.baselineHolder}
            </RelationshipReportParagraph>
          </RelationshipReportInset>
          <RelationshipReportInset className="border-sky-400/20 bg-sky-950/10">
            <RelationshipReportLabel className="text-sky-300 font-bold">
              🔋 {isEn ? "Buffer Support Rule" : "버퍼 & 과부하 방지 처방"}
            </RelationshipReportLabel>
            <RelationshipReportParagraph className="mt-1 text-xs leading-relaxed text-white/90">
              {cmd.bufferSupportNeed}
            </RelationshipReportParagraph>
          </RelationshipReportInset>
        </div>
      </div>
    </RelationshipReportCard>
  );
}

function MistakeRepairCard({
  meta,
  names,
}: {
  meta: any;
  names: [string, string];
}) {
  const mr = meta?.mistake_response;
  const ra = meta?.repair_apology;
  if (!mr && !ra) return null;

  return (
    <RelationshipReportCard title="방향성 실수 민감도 & 신뢰 복구 프로토콜 (Directional Repair)" accentColor={ACCENT}>
      {mr ? (
        <div className="mb-4 space-y-3">
          <RelationshipReportLabel className="text-amber-300">⚠️ 실수가 생겼을 때 서로 민감하게 반응하는 지점</RelationshipReportLabel>
          <div className="grid gap-3 sm:grid-cols-2">
            <RelationshipReportInset>
              <RelationshipReportLabel>{names[0]}의 실수 → {names[1]}의 반응 민감도</RelationshipReportLabel>
              <RelationshipReportParagraph className="mt-1 text-xs leading-relaxed text-white/85">
                {mr.whenAMakesMistakeBReactsTo}
              </RelationshipReportParagraph>
            </RelationshipReportInset>
            <RelationshipReportInset>
              <RelationshipReportLabel>{names[1]}의 실수 → {names[0]}의 반응 민감도</RelationshipReportLabel>
              <RelationshipReportParagraph className="mt-1 text-xs leading-relaxed text-white/85">
                {mr.whenBMakesMistakeAReactsTo}
              </RelationshipReportParagraph>
            </RelationshipReportInset>
          </div>
        </div>
      ) : null}
      {ra ? (
        <div className="space-y-3">
          <RelationshipReportLabel className="text-emerald-300">🤝 신뢰 회복 및 사과 순서 (Directional Apology Guide)</RelationshipReportLabel>
          <div className="grid gap-3 sm:grid-cols-2">
            <RelationshipReportInset className="border-emerald-400/20 bg-emerald-950/10">
              <RelationshipReportLabel className="text-emerald-200">{names[0]} $\rightarrow$ {names[1]} 신뢰 회복 순서</RelationshipReportLabel>
              <RelationshipReportParagraph className="mt-1 text-xs leading-relaxed text-white/90">
                {typeof ra.repairAtoB === "object" ? ra.repairAtoB.repairGuidance : ra.repairAtoB}
              </RelationshipReportParagraph>
            </RelationshipReportInset>
            <RelationshipReportInset className="border-emerald-400/20 bg-emerald-950/10">
              <RelationshipReportLabel className="text-emerald-200">{names[1]} $\rightarrow$ {names[0]} 신뢰 회복 순서</RelationshipReportLabel>
              <RelationshipReportParagraph className="mt-1 text-xs leading-relaxed text-white/90">
                {typeof ra.repairBtoA === "object" ? ra.repairBtoA.repairGuidance : ra.repairBtoA}
              </RelationshipReportParagraph>
            </RelationshipReportInset>
          </div>
        </div>
      ) : null}
    </RelationshipReportCard>
  );
}

function MutualGrowthCard({
  meta,
  names,
}: {
  meta: any;
  names: [string, string];
}) {
  const mg = meta?.mutual_growth_effect;
  const rcv = meta?.recognition_credit_visibility;
  if (!mg && !rcv) return null;

  const getGrowthText = (val: any) => {
    if (!val) return "";
    if (typeof val === "string") return val;
    return val.growthSummary ?? val.summary ?? JSON.stringify(val);
  };

  return (
    <RelationshipReportCard title="상호 성장 효과 & 성과 인정 리듬 (Mutual Growth & Credit)" accentColor={ACCENT}>
      {mg ? (
        <div className="mb-4 space-y-3">
          <RelationshipReportLabel className="text-purple-300">🌱 함께 일하며 배우는 성장 경로 (Directional Growth)</RelationshipReportLabel>
          <div className="grid gap-3 sm:grid-cols-2">
            <RelationshipReportInset>
              <RelationshipReportLabel>{names[0]} $\rightarrow$ {names[1]}를 통해 발전하는 역량</RelationshipReportLabel>
              <RelationshipReportParagraph className="mt-1 text-xs leading-relaxed text-white/85">
                {getGrowthText(mg.aGrowsThroughB)}
              </RelationshipReportParagraph>
            </RelationshipReportInset>
            <RelationshipReportInset>
              <RelationshipReportLabel>{names[1]} $\rightarrow$ {names[0]}를 통해 발전하는 역량</RelationshipReportLabel>
              <RelationshipReportParagraph className="mt-1 text-xs leading-relaxed text-white/85">
                {getGrowthText(mg.bGrowsThroughA)}
              </RelationshipReportParagraph>
            </RelationshipReportInset>
          </div>
        </div>
      ) : null}
      {rcv ? (
        <RelationshipReportInset className="border-sky-400/20 bg-sky-950/10">
          <RelationshipReportLabel className="text-sky-300">🏆 성과 인정 & 공로 명시 가이드 (Credit & Authorship)</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1 text-xs leading-relaxed text-white/90">
            {typeof rcv === "string" ? rcv : rcv.creditSharingRule ?? rcv.summary ?? JSON.stringify(rcv)}
          </RelationshipReportParagraph>
        </RelationshipReportInset>
      ) : null}
    </RelationshipReportCard>
  );
}

function PlaybookSummaryCard({ meta }: { meta: any }) {
  const bvr = meta?.best_vs_risky_config;
  const tvd = meta?.think_vs_discuss;
  const ra = meta?.repair_apology;
  const cmd = meta?.crunch_deadline_mode;

  const bestText =
    typeof bvr?.bestConfiguration === "string"
      ? bvr.bestConfiguration
      : bvr?.bestConfiguration?.summary ?? "서로의 주역량 영역을 명확히 하고 권한을 위임합니다.";

  const riskyText =
    typeof bvr?.riskyConfiguration === "string"
      ? bvr.riskyConfiguration
      : bvr?.riskyConfiguration?.warningNote ??
        bvr?.riskyConfiguration?.primaryRiskPattern ??
        "결정 권한이 모호한 상태에서 중복 검수하는 상황을 피합니다.";

  return (
    <RelationshipReportCard title="내일부터 바로 쓰는 1:1 협업 플레이북 (Action Rules)" accentColor={ACCENT} variant="success">
      <div className="grid gap-3 sm:grid-cols-2">
        <RelationshipReportInset className="border-emerald-400/20 bg-emerald-950/10">
          <RelationshipReportLabel className="text-emerald-300 font-bold">✅ DO: 꼭 지켜야 할 협업 원칙</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1 text-xs leading-relaxed text-white/90">
            {bestText}
          </RelationshipReportParagraph>
        </RelationshipReportInset>
        <RelationshipReportInset className="border-red-400/20 bg-red-950/10">
          <RelationshipReportLabel className="text-red-300 font-bold">❌ DON'T: 피해야 할 위험 조합</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1 text-xs leading-relaxed text-white/90">
            {riskyText}
          </RelationshipReportParagraph>
        </RelationshipReportInset>
        <RelationshipReportInset>
          <RelationshipReportLabel className="text-sky-300 font-bold">📋 MEETING RULE: 회의 전 규칙</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1 text-xs leading-relaxed text-white/85">
            {tvd?.meetingPrep ?? "회의 전 핵심 의안과 사전 생각 정리 시간을 먼저 보장합니다."}
          </RelationshipReportParagraph>
        </RelationshipReportInset>
        <RelationshipReportInset>
          <RelationshipReportLabel className="text-amber-300 font-bold">🚨 DEADLINE RULE: 마감 압박 규칙</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1 text-xs leading-relaxed text-white/85">
            {cmd?.priorityCutLead ?? "마감 시점에는 즉시 핵심 우선순위만 남기고 감정 소모를 차단합니다."}
          </RelationshipReportParagraph>
        </RelationshipReportInset>
      </div>
    </RelationshipReportCard>
  );
}

// ---- Work V2 Phase 5 Dispatcher & 7-Chapter Assembly ------------------------

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
      const exhaustiveCheck: never = section;
      return exhaustiveCheck;
    }
  }
}

/** ViewModel 전체를 RelationshipReportLayout에 조립 — Work V2 Phase 5 Production 진입점. */
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
  const names = vm.opening.names;

  const meta = (vm.raw?.report?.meta as any) ?? {};

  const snapshot = vm.sections.find(
    (s): s is Extract<WorkReportSection, { type: "snapshot" }> => s.type === "snapshot",
  );
  const compareTableSection = vm.sections.find(
    (s): s is CompareTableSection => s.type === "compare_table",
  );
  const psychRadarSection = vm.sections.find(
    (s): s is PsychRadarSection => s.type === "psych_radar",
  );
  const comparisonSection = vm.sections.find(
    (s): s is ComparisonSection => s.type === "comparison",
  );
  const roleMatrixSection = vm.sections.find(
    (s): s is RoleMatrixSection => s.type === "role_matrix",
  );
  const loopSection = vm.sections.find(
    (s): s is RelationshipLoopSection => s.type === "relationship_loop",
  );
  const deepReadSection = vm.sections.find(
    (s): s is DeepReadSection => s.type === "deep_read",
  );
  const warningSection = vm.sections.find(
    (s): s is WarningSection => s.type === "warning",
  );
  const prescriptionSection = vm.sections.find(
    (s): s is PrescriptionSection => s.type === "prescription",
  );

  const navItems = [
    { id: "ch1_glance", number: "01", title: isEn ? "Partnership at a Glance" : "한눈에 보는 업무 파트너십" },
    { id: "ch2_roles_rnr", number: "02", title: isEn ? "Roles & Decision Authority" : "업무 역할과 R&R 분담" },
    { id: "ch3_style_comm", number: "03", title: isEn ? "Work Style & Communication" : "업무 스타일과 소통 리듬" },
    { id: "ch4_crunch_pressure", number: "04", title: isEn ? "Pressure & Crunch Mode" : "마감 압박과 긴급 상황 대처" },
    { id: "ch5_mistake_repair", number: "05", title: isEn ? "Mistakes & Trust Repair" : "실수, 갈등과 신뢰 회복" },
    { id: "ch6_mutual_growth", number: "06", title: isEn ? "Mutual Growth & Synergy" : "함께 일하며 성장하는 방식" },
    { id: "ch7_playbook", number: "07", title: isEn ? "Practical Playbook" : "실전 협업 플레이북" },
  ];

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
      <WorkChapterNav items={navItems} />
      {/* Chapter 1: 01 · Partnership at a Glance */}
      <WorkChapterSection
        id="ch1_glance"
        number="01"
        title={isEn ? "01 · Partnership at a Glance" : "01 · 한눈에 보는 업무 파트너십"}
        accent={ACCENT}
      >
        <div id="ch_snapshot" />
        <UserQuestionBanner question={isEn ? "What kind of working pair are we, and what is our core fit?" : "우리 둘은 업무적으로 어떤 파트너인가?"} />
        {snapshot ? (() => {
          const topics = snapshot.panel?.narrative?.topics ?? [];
          const fit = topics.find(t => t.topic === "intimacy");
          const synergy = topics.find(t => t.topic === "stability");
          const risk = topics.find(t => t.topic === "conflict");
          
          const cards: OverviewCardData[] = [
            {
              key: "fit",
              icon: "🔥",
              label: t.scoreLabelFit,
              score: snapshot.scores.fitPct,
              tone: "good",
              inverted: false,
              gradeLabel: fit?.title ?? t.scoreLabelFit,
              oneLiner: fit?.subtitle ?? "",
              measures: pick(locale, "How smoothly your work styles and paces align", "서로의 업무 템포와 방식이 얼마나 매끄럽게 호흡을 맞추는지"),
              why: fit?.interpretation ?? "",
              thresholdText: fit?.axisNote,
            },
            {
              key: "synergy",
              icon: "🧩",
              label: t.scoreLabelSynergy,
              score: snapshot.scores.synergyPct,
              tone: "neutral",
              inverted: false,
              gradeLabel: synergy?.title ?? t.scoreLabelSynergy,
              oneLiner: synergy?.subtitle ?? "",
              measures: pick(locale, "How well your different strengths complement each other for better output", "서로 다른 강점이 시너지를 내어 결과물의 퀄리티를 얼마나 높이는지"),
              why: synergy?.interpretation ?? "",
              thresholdText: synergy?.axisNote,
            },
            {
              key: "risk",
              icon: "⚡",
              label: t.scoreLabelRisk,
              score: snapshot.scores.riskPct,
              tone: "warn",
              inverted: true,
              gradeLabel: risk?.title ?? t.scoreLabelRisk,
              oneLiner: risk?.subtitle ?? "",
              measures: pick(locale, "The potential for friction or misunderstanding during collaboration", "협업 과정에서 의사소통 오해나 마찰이 발생할 가능성"),
              why: risk?.interpretation ?? "",
              thresholdText: risk?.axisNote,
            },
          ];

          return (
            <div className="mb-6 mt-2">
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
        {meta?.best_vs_risky_config?.bestConfiguration?.summary ? (
          <RelationshipReportCard title="핵심 파트너십 결합 요약 (Best vs Risky Summary)" accentColor={ACCENT}>
            <RelationshipReportParagraph className="text-sm font-semibold text-white/90">
              {meta.best_vs_risky_config.bestConfiguration.summary}
            </RelationshipReportParagraph>
          </RelationshipReportCard>
        ) : null}
      </WorkChapterSection>

      {/* Chapter 2: 02 · Roles, Ownership & Decision Authority */}
      <WorkChapterSection
        id="ch2_roles_rnr"
        number="02"
        title={isEn ? "02 · Roles, Ownership & Decision Authority" : "02 · 업무 역할과 R&R 분담"}
        accent={ACCENT}
      >
        <div id="ch_role_matrix" />
        <UserQuestionBanner question={isEn ? "Who leads direction, execution, risk QA, and final decisions?" : "누가 방향을 잡고, 누가 실행하고, 누가 검수하고, 누가 결정해야 가장 잘 굴러가는가?"} />
        <CanonicalRoleMapCard meta={meta} names={names} />
        {roleMatrixSection ? <RoleMatrixCard section={roleMatrixSection} /> : null}
        {comparisonSection ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <DnaCard profile={comparisonSection.dna.me} accent={ACCENT} />
            <DnaCard profile={comparisonSection.dna.partner} accent={ACCENT} />
          </div>
        ) : null}
      </WorkChapterSection>

      {/* Chapter 3: 03 · Work Style & Communication Rhythm */}
      <WorkChapterSection
        id="ch3_style_comm"
        number="03"
        title={isEn ? "03 · Work Style & Communication Rhythm" : "03 · 업무 스타일과 소통 리듬"}
        accent={ACCENT}
      >
        <div id="ch_compare_table" />
        <div id="ch_psych_radar" />
        <div id="ch_comparison" />
        <UserQuestionBanner question={isEn ? "How do we think, communicate, focus, and prep for meetings?" : "우리는 어떻게 생각하고, 소통하고, 집중하고, 결정을 준비하는가?"} />
        {psychRadarSection ? <PsychRadarCard section={psychRadarSection} names={names} /> : null}
        {compareTableSection ? <CompareTableCard section={compareTableSection} names={names} /> : null}
        {comparisonSection ? <ComparisonCard section={comparisonSection} names={names} /> : null}
        <ThinkVsDiscussCard meta={meta} />
      </WorkChapterSection>

      {/* Chapter 4: 04 · Pressure, Deadline & Crunch Mode */}
      <WorkChapterSection
        id="ch4_crunch_pressure"
        number="04"
        title={isEn ? "04 · Pressure, Deadline & Crunch Mode" : "04 · 마감 압박과 긴급 상황 대처"}
        accent={ACCENT}
      >
        <div id="ch_crunch" />
        <UserQuestionBanner question={isEn ? "What changes under tight deadlines and emergency pressure?" : "평소에는 괜찮아도 마감이나 위기 상황에서는 둘이 어떻게 달라지는가?"} />
        <CrunchModeCard meta={meta} names={names} isEn={isEn} />
      </WorkChapterSection>

      {/* Chapter 5: 05 · Mistakes, Conflict & Trust Repair */}
      <WorkChapterSection
        id="ch5_mistake_repair"
        number="05"
        title={isEn ? "05 · Mistakes, Conflict & Trust Repair" : "05 · 실수, 갈등과 신뢰 회복"}
        accent={ACCENT}
      >
        <div id="ch_warning" />
        <UserQuestionBanner question={isEn ? "What triggers sensitivity during mistakes, and how is trust repaired?" : "실수나 충돌이 생겼을 때 무엇에 민감하고, 어떻게 해야 다시 신뢰가 회복되는가?"} />
        <MistakeRepairCard meta={meta} names={names} />
        {warningSection ? <WarningCard section={warningSection} /> : null}
      </WorkChapterSection>

      {/* Chapter 6: 06 · Mutual Growth & Long-Term Synergy */}
      <WorkChapterSection
        id="ch6_mutual_growth"
        number="06"
        title={isEn ? "06 · Mutual Growth & Long-Term Synergy" : "06 · 함께 일하며 성장하는 방식"}
        accent={ACCENT}
      >
        <div id="ch_relationship_loop" />
        <div id="ch_deep_read" />
        <UserQuestionBanner question={isEn ? "How do we learn from each other and build long-term synergy?" : "이 사람과 계속 일하면 나는 무엇을 배우고 어떤 사람이 되는가?"} />
        <MutualGrowthCard meta={meta} names={names} />
        {loopSection ? <RelationshipLoopCard section={loopSection} /> : null}
        {deepReadSection ? <DeepReadSectionCard section={deepReadSection} /> : null}
      </WorkChapterSection>

      {/* Chapter 7: 07 · Practical Collaboration Playbook */}
      <WorkChapterSection
        id="ch7_playbook"
        number="07"
        title={isEn ? "07 · Practical Collaboration Playbook" : "07 · 실전 협업 플레이북"}
        accent={ACCENT}
      >
        <div id="ch_prescription" />
        <div id="pair-prescription-work" />
        <UserQuestionBanner question={isEn ? "What are our immediate 1:1 operational rules starting tomorrow?" : "그래서 내일부터 둘이 어떻게 일하면 되는가?"} />
        <PlaybookSummaryCard meta={meta} />
        {prescriptionSection ? <PrescriptionCard section={prescriptionSection} /> : null}
      </WorkChapterSection>
    </RelationshipReportLayout>
  );
}
