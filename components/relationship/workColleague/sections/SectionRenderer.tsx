"use client";

/**
 * Work Colleague Premium — WorkReportViewModel 전용 렌더러.
 *
 * WorkColleagueReportView.tsx에서 en-US/ko-KR 둘 다에 대해 production 렌더링에
 * 쓰인다(구조 체크 통과 시). buildWorkColleagueReport.ts는 건드리지 않았고,
 * 여기서 재사용하는 TriScoreSnapshotPanel·PairPrescriptionSection도 원본
 * 그대로다(수정 없음). 카드 시각 스킨은 Marriage/Friend와 같은 크림-진초록
 * editorial 시스템(workEditorialAdapter.tsx)을 쓴다 — 옛 reportLayout의
 * 다크 카드/blue 액센트가 아님.
 *
 * 카드 내부 라벨은 전부 `useMessages().relationshipDrilldown.work`(i18n 메시지
 * 카탈로그)에서 가져온다 — 하드코딩 금지, 새 라벨이 필요하면 en-US.ts/ko-KR.ts에
 * 같이 추가할 것.
 */
import type { ReactNode } from "react";
import { Noto_Sans_KR, Noto_Serif_KR } from "next/font/google";
import { MessageCircle, Mic, AlertTriangle } from "lucide-react";
import RelationshipReportCard, {
  RelationshipReportBody,
  RelationshipReportParagraph,
  RelationshipReportLabel,
  RelationshipReportInset,
  WorkEditorialHero,
} from "@/components/relationship/workColleague/editorial/workEditorialAdapter";
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
import { buildWorkOverviewChapterBundle } from "@/lib/relationship/workColleague/workOverviewChapterEngine";
import { useMessages, useLocale } from "@/lib/i18n/LocaleProvider";

const relSans = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-rel-sans-var",
});
const relSerif = Noto_Serif_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-rel-serif-var",
});

/** Shared editorial accent (rel-deep) — matches Romantic V4 / Friend / Marriage, not the old per-domain blue. */
const ACCENT = "#1b3b2b";

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
      {isFirst ? null : <p className="py-1 text-center text-rel-ink-mute">↓</p>}
      <RelationshipReportInset>
        <p className="text-sm font-semibold text-rel-ink">{title}</p>
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
          <RelationshipReportLabel className="text-emerald-700">{t.loopStrengthLabel}</RelationshipReportLabel>
          {section.positiveLoop.map((item, i) => (
            <LoopRow key={`pos-${item.title}-${i}`} title={item.title} body={item.body} isFirst={i === 0} />
          ))}
        </div>
      ) : null}
      {section.frictionLoop.length > 0 ? (
        <div className={section.positiveLoop.length > 0 ? "mt-6 space-y-1" : "space-y-1"}>
          <RelationshipReportLabel className="text-red-700">{t.loopFrictionLabel}</RelationshipReportLabel>
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
          <RelationshipReportInset className="border-amber-100 bg-amber-50/60">
            <RelationshipReportParagraph className="flex items-start gap-2 text-amber-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" strokeWidth={1.75} aria-hidden />
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
    <div className="rounded-xl border border-rel-line bg-rel-taupe-soft/25 px-4 py-3 text-xs font-medium tracking-wide text-rel-deep sm:px-5">
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
    <RelationshipReportCard title="8차원 권한 및 역할 지도 (Canonical Role Map)" accentColor={ACCENT} showMarker={true}>
      <RelationshipReportParagraph className="mb-4 text-xs text-rel-ink-mute">
        사주 구조와 11축 심리 역량을 종합 검증한 권한 및 R&R 최적 분담 구조입니다.
      </RelationshipReportParagraph>
      <div className="grid gap-3 sm:grid-cols-2">
        <RelationshipReportInset>
          <RelationshipReportLabel className="text-amber-700">🧭 방향 설정 & 비전 리드 (Direction)</RelationshipReportLabel>
          <p className="mt-1 text-sm font-bold text-rel-ink">{getOwnerLabel(map.directionOwner)}</p>
        </RelationshipReportInset>
        <RelationshipReportInset>
          <RelationshipReportLabel className="text-emerald-700">⚡ 실제 구현 & 빠른 실행 (Execution)</RelationshipReportLabel>
          <p className="mt-1 text-sm font-bold text-rel-ink">{getOwnerLabel(map.executionOwner)}</p>
        </RelationshipReportInset>
        <RelationshipReportInset>
          <RelationshipReportLabel className="text-sky-700">🔍 리스크 감지 & 품질 검수 (QA / Risk)</RelationshipReportLabel>
          <p className="mt-1 text-sm font-bold text-rel-ink">{getOwnerLabel(map.qaRiskOwner)}</p>
        </RelationshipReportInset>
        <RelationshipReportInset>
          <RelationshipReportLabel className="text-purple-700">🎤 대외 발표 & 메인 스피커 (External Lead)</RelationshipReportLabel>
          <p className="mt-1 text-sm font-bold text-rel-ink">{getOwnerLabel(map.externalOwner)}</p>
        </RelationshipReportInset>
      </div>
    </RelationshipReportCard>
  );
}

function ThinkVsDiscussCard({ meta }: { meta: any }) {
  const tvd = meta?.think_vs_discuss;
  if (!tvd) return null;
  return (
    <RelationshipReportCard title="생각 정리 방식과 회의 준비 리듬 (Think vs Discuss)" accentColor={ACCENT} showMarker={true}>
      <RelationshipReportInset className="mb-4 border-amber-100 bg-amber-50/60">
        <RelationshipReportLabel className="text-amber-700">💡 둘의 소통 패턴</RelationshipReportLabel>
        <RelationshipReportParagraph className="mt-1 font-semibold text-rel-ink">
          {tvd.pairPattern}
        </RelationshipReportParagraph>
      </RelationshipReportInset>
      <div className="grid gap-3 sm:grid-cols-2">
        <RelationshipReportInset>
          <RelationshipReportLabel className="text-sky-700">개인별 생각 정리 방식</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1 text-xs leading-relaxed text-rel-ink-soft">
            {tvd.personAStyle}
          </RelationshipReportParagraph>
          <RelationshipReportParagraph className="mt-2 text-xs leading-relaxed text-rel-ink-soft">
            {tvd.personBStyle}
          </RelationshipReportParagraph>
        </RelationshipReportInset>
        <RelationshipReportInset>
          <RelationshipReportLabel className="text-emerald-700">📋 회의 사전 준비 가이드 (Meeting Prep Rule)</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1 text-xs leading-relaxed text-rel-ink-soft">
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
        <RelationshipReportInset className="border-amber-100 bg-amber-50/60">
          <RelationshipReportLabel className="text-amber-700 font-bold">
            {isEn ? "🚨 1. How Work Styles Shift Under Tight Deadlines" : "🚨 1. 평소와 다른 마감 압박 시 일하는 방식의 변화"}
          </RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1 text-xs leading-relaxed text-rel-ink">
            {cmd.normalVsDeadlineShift}
          </RelationshipReportParagraph>
        </RelationshipReportInset>

        {/* 2. 개인별 압박 반응 */}
        <div className="grid gap-3 sm:grid-cols-2">
          <RelationshipReportInset>
            <RelationshipReportLabel className="text-sky-700 font-semibold">
              ⚡ {isEn ? `${names[0]}'s Action Shift Under Pressure` : `${names[0]}님의 마감 속 행동 변화`}
            </RelationshipReportLabel>
            <RelationshipReportParagraph className="mt-1 text-xs leading-relaxed text-rel-ink-soft">
              {cmd.personAPressureShift}
            </RelationshipReportParagraph>
          </RelationshipReportInset>
          <RelationshipReportInset>
            <RelationshipReportLabel className="text-purple-700 font-semibold">
              🛡️ {isEn ? `${names[1]}'s Action Shift Under Pressure` : `${names[1]}님의 마감 속 행동 변화`}
            </RelationshipReportLabel>
            <RelationshipReportParagraph className="mt-1 text-xs leading-relaxed text-rel-ink-soft">
              {cmd.personBPressureShift}
            </RelationshipReportParagraph>
          </RelationshipReportInset>
        </div>

        {/* 3. 위기 시 역할 분담 & 4. 압박 속 충돌 지점 */}
        <div className="grid gap-3 sm:grid-cols-2">
          <RelationshipReportInset>
            <RelationshipReportLabel className="text-emerald-700 font-semibold">
              🧩 {isEn ? "3. Natural Emergency Role Split" : "3. 위기 상황에서의 자연스러운 역할 분담"}
            </RelationshipReportLabel>
            <RelationshipReportParagraph className="mt-1 text-xs leading-relaxed text-rel-ink-soft">
              {cmd.crunchRoleSplit}
            </RelationshipReportParagraph>
          </RelationshipReportInset>
          <RelationshipReportInset className="border-red-100 bg-red-50/60">
            <RelationshipReportLabel className="text-red-700 font-semibold">
              ⚡ {isEn ? "4. Potential Friction Point Under Stress" : "4. 마감 압박 속 생길 수 있는 충돌 지점"}
            </RelationshipReportLabel>
            <RelationshipReportParagraph className="mt-1 text-xs leading-relaxed text-rel-ink-soft">
              {cmd.pressureFrictionPoint}
            </RelationshipReportParagraph>
          </RelationshipReportInset>
        </div>

        {/* 5. 실전 운영 규칙 & 버퍼 보호 */}
        <div className="grid gap-3 sm:grid-cols-3">
          <RelationshipReportInset>
            <RelationshipReportLabel className="text-amber-700 font-bold">
              ✂️ {isEn ? "Priority Cut Rule" : "우선순위 축소 규칙"}
            </RelationshipReportLabel>
            <RelationshipReportParagraph className="mt-1 text-xs leading-relaxed text-rel-ink-soft">
              {cmd.priorityCutLead}
            </RelationshipReportParagraph>
          </RelationshipReportInset>
          <RelationshipReportInset>
            <RelationshipReportLabel className="text-emerald-700 font-bold">
              🛡️ {isEn ? "Quality Baseline" : "최소 품질 기준선"}
            </RelationshipReportLabel>
            <RelationshipReportParagraph className="mt-1 text-xs leading-relaxed text-rel-ink-soft">
              {cmd.baselineHolder}
            </RelationshipReportParagraph>
          </RelationshipReportInset>
          <RelationshipReportInset className="border-sky-100 bg-sky-50/60">
            <RelationshipReportLabel className="text-sky-700 font-bold">
              🔋 {isEn ? "Buffer Support Rule" : "버퍼 & 과부하 방지 처방"}
            </RelationshipReportLabel>
            <RelationshipReportParagraph className="mt-1 text-xs leading-relaxed text-rel-ink">
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
    <RelationshipReportCard title="방향성 실수 민감도 & 신뢰 복구 프로토콜 (Directional Repair)" accentColor={ACCENT} showMarker={true}>
      {mr ? (
        <div className="mb-4 space-y-3">
          <RelationshipReportLabel className="text-amber-700">⚠️ 실수가 생겼을 때 서로 민감하게 반응하는 지점</RelationshipReportLabel>
          <div className="grid gap-3 sm:grid-cols-2">
            <RelationshipReportInset>
              <RelationshipReportLabel>{names[0]}의 실수 → {names[1]}의 반응 민감도</RelationshipReportLabel>
              <RelationshipReportParagraph className="mt-1 text-xs leading-relaxed text-rel-ink-soft">
                {mr.whenAMakesMistakeBReactsTo}
              </RelationshipReportParagraph>
            </RelationshipReportInset>
            <RelationshipReportInset>
              <RelationshipReportLabel>{names[1]}의 실수 → {names[0]}의 반응 민감도</RelationshipReportLabel>
              <RelationshipReportParagraph className="mt-1 text-xs leading-relaxed text-rel-ink-soft">
                {mr.whenBMakesMistakeAReactsTo}
              </RelationshipReportParagraph>
            </RelationshipReportInset>
          </div>
        </div>
      ) : null}
      {ra ? (
        <div className="space-y-3">
          <RelationshipReportLabel className="text-emerald-700">🤝 신뢰 회복 및 사과 순서 (Directional Apology Guide)</RelationshipReportLabel>
          <div className="grid gap-3 sm:grid-cols-2">
            <RelationshipReportInset className="border-emerald-100 bg-emerald-50/60">
              <RelationshipReportLabel className="text-emerald-800">{names[0]} $\rightarrow$ {names[1]} 신뢰 회복 순서</RelationshipReportLabel>
              <RelationshipReportParagraph className="mt-1 text-xs leading-relaxed text-rel-ink">
                {typeof ra.repairAtoB === "object" ? ra.repairAtoB.repairGuidance : ra.repairAtoB}
              </RelationshipReportParagraph>
            </RelationshipReportInset>
            <RelationshipReportInset className="border-emerald-100 bg-emerald-50/60">
              <RelationshipReportLabel className="text-emerald-800">{names[1]} $\rightarrow$ {names[0]} 신뢰 회복 순서</RelationshipReportLabel>
              <RelationshipReportParagraph className="mt-1 text-xs leading-relaxed text-rel-ink">
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
    <RelationshipReportCard title="상호 성장 효과 & 성과 인정 리듬 (Mutual Growth & Credit)" accentColor={ACCENT} showMarker={true}>
      {mg ? (
        <div className="mb-4 space-y-3">
          <RelationshipReportLabel className="text-purple-700">🌱 함께 일하며 배우는 성장 경로 (Directional Growth)</RelationshipReportLabel>
          <div className="grid gap-3 sm:grid-cols-2">
            <RelationshipReportInset>
              <RelationshipReportLabel>{names[0]} $\rightarrow$ {names[1]}를 통해 발전하는 역량</RelationshipReportLabel>
              <RelationshipReportParagraph className="mt-1 text-xs leading-relaxed text-rel-ink-soft">
                {getGrowthText(mg.aGrowsThroughB)}
              </RelationshipReportParagraph>
            </RelationshipReportInset>
            <RelationshipReportInset>
              <RelationshipReportLabel>{names[1]} $\rightarrow$ {names[0]}를 통해 발전하는 역량</RelationshipReportLabel>
              <RelationshipReportParagraph className="mt-1 text-xs leading-relaxed text-rel-ink-soft">
                {getGrowthText(mg.bGrowsThroughA)}
              </RelationshipReportParagraph>
            </RelationshipReportInset>
          </div>
        </div>
      ) : null}
      {rcv ? (
        <RelationshipReportInset className="border-sky-100 bg-sky-50/60">
          <RelationshipReportLabel className="text-sky-700">🏆 성과 인정 & 공로 명시 가이드 (Credit & Authorship)</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1 text-xs leading-relaxed text-rel-ink">
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
    <RelationshipReportCard title="내일부터 바로 쓰는 1:1 협업 플레이북 (Action Rules)" accentColor={ACCENT} variant="success" showMarker={true}>
      <div className="grid gap-3 sm:grid-cols-2">
        <RelationshipReportInset className="border-emerald-100 bg-emerald-50/60">
          <RelationshipReportLabel className="text-emerald-700 font-bold">✅ DO: 꼭 지켜야 할 협업 원칙</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1 text-xs leading-relaxed text-rel-ink">
            {bestText}
          </RelationshipReportParagraph>
        </RelationshipReportInset>
        <RelationshipReportInset className="border-red-100 bg-red-50/60">
          <RelationshipReportLabel className="text-red-700 font-bold">❌ DON'T: 피해야 할 위험 조합</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1 text-xs leading-relaxed text-rel-ink">
            {riskyText}
          </RelationshipReportParagraph>
        </RelationshipReportInset>
        <RelationshipReportInset>
          <RelationshipReportLabel className="text-sky-700 font-bold">📋 MEETING RULE: 회의 전 규칙</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1 text-xs leading-relaxed text-rel-ink-soft">
            {tvd?.meetingPrep ?? "회의 전 핵심 의안과 사전 생각 정리 시간을 먼저 보장합니다."}
          </RelationshipReportParagraph>
        </RelationshipReportInset>
        <RelationshipReportInset>
          <RelationshipReportLabel className="text-amber-700 font-bold">🚨 DEADLINE RULE: 마감 압박 규칙</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1 text-xs leading-relaxed text-rel-ink-soft">
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

/** ViewModel 전체를 editorial 히어로 + 챕터 구조로 조립 — Work V2 Phase 5 Production 진입점. */
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
    { id: "ch1_glance", number: "01", title: isEn ? "What Kind of Team Are We?" : "우리가 함께 일하면 어떤 팀일까요?" },
    { id: "ch2_roles_rnr", number: "02", title: isEn ? "Roles & Decision Authority" : "업무 역할과 R&R 분담" },
    { id: "ch3_style_comm", number: "03", title: isEn ? "Work Style & Communication" : "업무 스타일과 소통 리듬" },
    { id: "ch4_crunch_pressure", number: "04", title: isEn ? "Pressure & Crunch Mode" : "마감 압박과 긴급 상황 대처" },
    { id: "ch5_mistake_repair", number: "05", title: isEn ? "Mistakes & Trust Repair" : "실수, 갈등과 신뢰 회복" },
    { id: "ch6_mutual_growth", number: "06", title: isEn ? "Mutual Growth & Synergy" : "함께 일하며 성장하는 방식" },
    { id: "ch7_playbook", number: "07", title: isEn ? "Practical Playbook" : "실전 협업 플레이북" },
  ];

  return (
    <div
      className={`bg-rel-bg font-rel-sans text-rel-ink antialiased ${relSans.variable} ${relSerif.variable}`}
      lang={isEn ? "en" : "ko"}
    >
      <WorkEditorialHero
        eyebrow={kindLabel ?? t.defaultKindLabel}
        headline={vm.opening.headline}
        subtitle={undefined}
        names={vm.opening.names}
        gradeLabel={undefined}
      />
      {/* Top Overview Section: 3 Score Cards with Circular Gauge (Image Reference) */}
      {(() => {
        const overviewBundle = vm.storyPlan?.overviewChapterBundle || buildWorkOverviewChapterBundle({
          nameA: names[0],
          nameB: names[1],
          locale: isEn ? "en-US" : "ko-KR",
          fitPct: snapshot?.scores.fitPct ?? 80,
          synergyPct: snapshot?.scores.synergyPct ?? 75,
          riskPct: snapshot?.scores.riskPct ?? 20,
        });

        if (!overviewBundle) return null;

        const overviewCards: OverviewCardData[] = [
          {
            key: "fit",
            icon: "🔥",
            label: isEn ? "Work Fit" : "업무적 핏",
            score: overviewBundle.workFitCard.score,
            tone: "good",
            inverted: false,
            gradeLabel: overviewBundle.workFitCard.qualitativeLabel,
            oneLiner: isEn ? "Work style & tempo alignment" : "일하는 템포와 기본 호흡",
            measures: overviewBundle.workFitCard.measuresWhat,
            why: overviewBundle.workFitCard.whyThisScore,
          },
          {
            key: "synergy",
            icon: "🧩",
            label: isEn ? "Collaboration Synergy" : "협업 시너지",
            score: overviewBundle.synergyCard.score,
            tone: "neutral",
            inverted: false,
            gradeLabel: overviewBundle.synergyCard.qualitativeLabel,
            oneLiner: isEn ? "Complementary strengths & output quality" : "역량 결합과 시너지",
            measures: overviewBundle.synergyCard.measuresWhat,
            why: overviewBundle.synergyCard.whyThisScore,
          },
          {
            key: "risk",
            icon: "⚡",
            label: isEn ? "Office Risk" : "오피스 리스크",
            score: overviewBundle.officeRiskCard.score,
            tone: "warn",
            inverted: true,
            gradeLabel: overviewBundle.officeRiskCard.qualitativeLabel,
            oneLiner: isEn ? "Potential for collaboration friction" : "마찰과 병목 가능성",
            measures: overviewBundle.officeRiskCard.measuresWhat,
            why: overviewBundle.officeRiskCard.whyThisScore,
          },
        ];

        return (
          <div className="mx-auto w-full max-w-[820px] px-5 pt-4">
            <OverviewSection
              locale={locale}
              eyebrow={pick(locale, "00 · Overview", "00 · 파트너십 한눈에 보기")}
              title={pick(locale, "At a Glance", "업무 파트너십 개요")}
              lead={pick(
                locale,
                "Three signals frame the shape of this partnership.",
                "세 가지 핵심 신호로 두 사람의 협업 핏을 한눈에 확인합니다."
              )}
              cards={overviewCards}
            />
          </div>
        );
      })()}

      <WorkChapterNav items={navItems} />

      {/* Chapter 1: 01 · 우리가 함께 일하면 어떤 팀일까요? */}
      <WorkChapterSection
        id="ch1_glance"
        number="01"
        title={isEn ? "01 · What Kind of Team Are We?" : "01 · 우리가 함께 일하면 어떤 팀일까요?"}
        accent={ACCENT}
      >
        <div id="ch_snapshot" />
        <UserQuestionBanner question={isEn ? "How this pair actually collaborates when assigned to the same project" : "두 사람을 한 프로젝트에 넣었을 때 실제로 나타나는 협업의 모습"} />
        {(() => {
          const overviewBundle = vm.storyPlan?.overviewChapterBundle || buildWorkOverviewChapterBundle({
            nameA: names[0],
            nameB: names[1],
            locale: isEn ? "en-US" : "ko-KR",
            fitPct: snapshot?.scores.fitPct ?? 80,
            synergyPct: snapshot?.scores.synergyPct ?? 75,
            riskPct: snapshot?.scores.riskPct ?? 20,
          });

          if (!overviewBundle) return null;

          const lifecycle = overviewBundle.lifecycleNarrative;
          const portrait = overviewBundle.teamPortrait;

          const lifecycleItems = [
            {
              num: "01",
              title: isEn ? "01. When a New Project Starts" : lifecycle.kickoff.title,
              body: lifecycle.kickoff.body,
              icon: "🚀",
            },
            {
              num: "02",
              title: isEn ? "02. When Work Gets In-Flight" : lifecycle.inFlight.title,
              body: lifecycle.inFlight.body,
              icon: "🔄",
            },
            {
              num: "03",
              title: isEn ? "03. When Strengths Click" : lifecycle.synergyMoment.title,
              body: lifecycle.synergyMoment.body,
              icon: "⚡",
            },
            {
              num: "04",
              title: isEn ? "04. When Friction Triggers Appear" : lifecycle.frictionMoment.title,
              body: lifecycle.frictionMoment.body,
              icon: "⚠️",
            },
          ];

          return (
            <div className="space-y-8 mt-4 mb-8">
              {/* Section 1: ◤ 실제로 한 프로젝트에 들어가면 (01 -> 02 -> 03 -> 04) */}
              <div className="space-y-4">
                <h3 className="font-rel-sans text-base font-bold text-rel-ink flex items-center gap-2 border-b border-rel-line pb-2">
                  <span>◤</span>
                  <span>{isEn ? "When Assigned to a Real Project" : "실제로 한 프로젝트에 들어가면"}</span>
                </h3>
                <div className="space-y-4">
                  {lifecycleItems.map((item, idx) => (
                    <div key={idx} className="rounded-2xl border border-rel-line bg-rel-surface p-5 shadow-sm space-y-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{item.icon}</span>
                        <h4 className="font-rel-sans text-sm font-bold text-rel-ink">{item.title}</h4>
                      </div>
                      <p className="font-rel-sans text-xs sm:text-[13.5px] text-rel-ink-soft leading-relaxed">
                        {item.body}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 2: ◤ 그래서 이 둘은 어떤 팀인가 (Team Portrait) */}
              <div className="space-y-3">
                <h3 className="font-rel-sans text-base font-bold text-rel-ink flex items-center gap-2 border-b border-rel-line pb-2">
                  <span>◤</span>
                  <span>{isEn ? "What Kind of Team Are They?" : "그래서 이 둘은 어떤 팀인가"}</span>
                </h3>
                <div className="rounded-2xl bg-rel-deep-soft/60 p-5 sm:p-6 border border-rel-deep/20 space-y-2.5 shadow-sm">
                  <p className="font-rel-serif text-base sm:text-lg font-bold text-rel-deep leading-snug">
                    “{portrait.headline}”
                  </p>
                  <p className="font-rel-sans text-xs sm:text-[13.5px] text-rel-ink-soft leading-relaxed">
                    {portrait.body}
                  </p>
                </div>
              </div>
            </div>
          );
        })()}
      </WorkChapterSection>

      {/* Chapter 2: 02 · 이 사람은 일할 때 어떤 사람일까요? */}
      <WorkChapterSection
        id="ch2_roles_rnr"
        number="02"
        title={isEn ? "02 · What Kind of Worker Is Each Person?" : "02 · 이 사람은 일할 때 어떤 사람일까요?"}
        accent={ACCENT}
      >
        <div id="ch_role_matrix" />
        <UserQuestionBanner question={isEn ? "Innate work temperament to current behavioral execution style" : "타고난 업무 기질부터 지금 실제로 일하는 방식까지"} />
        {(() => {
          const individualBundle = vm.storyPlan?.individualWorkBundle || buildIndividualWorkChapterBundle({
            nameA: names[0],
            nameB: names[1],
            locale: isEn ? "en-US" : "ko-KR",
          });

          if (!individualBundle) return null;

          const pA = individualBundle.personA;
          const pB = individualBundle.personB;

          return (
            <div className="space-y-8 mt-4 mb-8">
              {/* ================================================================ */}
              {/* GROUP A. 나는 어떻게 일하는 사람인가 */}
              {/* ================================================================ */}
              <div className="space-y-3">
                <h3 className="font-rel-sans text-sm font-bold text-rel-deep tracking-wider flex items-center gap-1.5">
                  <span>◤</span>
                  <span>나는 어떻게 일하는 사람인가</span>
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  {/* Person A Card */}
                  <div className="rounded-2xl border border-rel-line bg-rel-surface p-4 sm:p-5 shadow-sm space-y-5">
                    <div className="border-b border-rel-line/40 pb-3 space-y-1.5">
                      <div>
                        <span className="rounded-full border border-rel-line bg-rel-taupe-soft/60 text-rel-deep text-xs font-bold px-3 py-0.5 inline-block">
                          {pA.name}
                        </span>
                      </div>
                      <p className="font-rel-sans text-xs font-bold text-rel-deep leading-snug">{pA.identityLabel}</p>
                      <div className="flex flex-wrap gap-1">
                        {pA.keyTraits.map((t, i) => (
                          <span key={i} className="rounded bg-rel-deep/10 text-rel-deep text-[10px] font-semibold px-1.5 py-0.5">#{t}</span>
                        ))}
                      </div>
                    </div>

                    {/* ▫ 일하는 기본 스타일 */}
                    <div className="space-y-2 text-xs">
                      <h4 className="font-rel-sans text-xs font-bold text-rel-ink flex items-center gap-1">
                        <span>▫</span>
                        <span>일하는 기본 스타일</span>
                      </h4>
                      <div className="space-y-2.5">
                        {pA.workStyleBehaviors.map((b, idx) => (
                          <div key={idx} className="space-y-1">
                            <p className="text-[11px] font-bold text-rel-deep flex items-center gap-1">
                              <span>-</span>
                              <span>{b.situationLabel}</span>
                            </p>
                            <div className="rounded-xl bg-rel-taupe-soft/40 p-2.5 space-y-0.5 border border-rel-line/30">
                              <p className="font-bold text-rel-ink">{b.behaviorSummary}</p>
                              {b.microcopy ? <p className="text-[11px] text-rel-ink-soft">{b.microcopy}</p> : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ▫ 일에 기여하는 방식 */}
                    <div className="space-y-2 pt-3 border-t border-rel-line/40 text-xs">
                      <h4 className="font-rel-sans text-xs font-bold text-rel-ink flex items-center gap-1">
                        <span>▫</span>
                        <span>일에 기여하는 방식</span>
                      </h4>
                      <div className="space-y-1.5">
                        {pA.topContributions.map((c, i) => (
                          <div key={i} className="rounded-xl bg-rel-taupe-soft/30 p-2.5 border border-rel-line/30 space-y-0.5">
                            <span className="font-bold text-rel-deep text-[11px]">- {c.title}</span>
                            <p className="text-[11px] text-rel-ink-soft">{c.microcopy}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ▫ 일을 잘한다고 느끼는 기준 */}
                    <div className="space-y-2 pt-3 border-t border-rel-line/40 text-xs">
                      <h4 className="font-rel-sans text-xs font-bold text-rel-ink flex items-center gap-1">
                        <span>▫</span>
                        <span>일을 잘한다고 느끼는 기준</span>
                      </h4>
                      <div className="rounded-xl bg-rel-taupe-soft/30 p-2.5 space-y-1 border border-rel-line/30">
                        <div className="flex flex-wrap gap-1">
                          {pA.valueKeywords.map((vk, i) => (
                            <span key={i} className="font-semibold text-rel-deep text-[10px]">#{vk}</span>
                          ))}
                        </div>
                        <p className="text-[11px] text-rel-ink-soft leading-relaxed">{pA.internalStandardSentence}</p>
                      </div>
                    </div>
                  </div>

                  {/* Person B Card */}
                  <div className="rounded-2xl border border-rel-line bg-rel-surface p-4 sm:p-5 shadow-sm space-y-5">
                    <div className="border-b border-rel-line/40 pb-3 space-y-1.5">
                      <div>
                        <span className="rounded-full border border-rel-line bg-rel-taupe-soft/60 text-rel-deep text-xs font-bold px-3 py-0.5 inline-block">
                          {pB.name}
                        </span>
                      </div>
                      <p className="font-rel-sans text-xs font-bold text-rel-deep leading-snug">{pB.identityLabel}</p>
                      <div className="flex flex-wrap gap-1">
                        {pB.keyTraits.map((t, i) => (
                          <span key={i} className="rounded bg-rel-taupe-soft text-rel-deep text-[10px] font-semibold px-1.5 py-0.5 border border-rel-line/30">#{t}</span>
                        ))}
                      </div>
                    </div>

                    {/* ▫ 일하는 기본 스타일 */}
                    <div className="space-y-2 text-xs">
                      <h4 className="font-rel-sans text-xs font-bold text-rel-ink flex items-center gap-1">
                        <span>▫</span>
                        <span>일하는 기본 스타일</span>
                      </h4>
                      <div className="space-y-2.5">
                        {pB.workStyleBehaviors.map((b, idx) => (
                          <div key={idx} className="space-y-1">
                            <p className="text-[11px] font-bold text-rel-deep flex items-center gap-1">
                              <span>-</span>
                              <span>{b.situationLabel}</span>
                            </p>
                            <div className="rounded-xl bg-rel-taupe-soft/40 p-2.5 space-y-0.5 border border-rel-line/30">
                              <p className="font-bold text-rel-ink">{b.behaviorSummary}</p>
                              {b.microcopy ? <p className="text-[11px] text-rel-ink-soft">{b.microcopy}</p> : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ▫ 일에 기여하는 방식 */}
                    <div className="space-y-2 pt-3 border-t border-rel-line/40 text-xs">
                      <h4 className="font-rel-sans text-xs font-bold text-rel-ink flex items-center gap-1">
                        <span>▫</span>
                        <span>일에 기여하는 방식</span>
                      </h4>
                      <div className="space-y-1.5">
                        {pB.topContributions.map((c, i) => (
                          <div key={i} className="rounded-xl bg-rel-taupe-soft/30 p-2.5 border border-rel-line/30 space-y-0.5">
                            <span className="font-bold text-rel-deep text-[11px]">- {c.title}</span>
                            <p className="text-[11px] text-rel-ink-soft">{c.microcopy}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ▫ 일을 잘한다고 느끼는 기준 */}
                    <div className="space-y-2 pt-3 border-t border-rel-line/40 text-xs">
                      <h4 className="font-rel-sans text-xs font-bold text-rel-ink flex items-center gap-1">
                        <span>▫</span>
                        <span>일을 잘한다고 느끼는 기준</span>
                      </h4>
                      <div className="rounded-xl bg-rel-taupe-soft/30 p-2.5 space-y-1 border border-rel-line/30">
                        <div className="flex flex-wrap gap-1">
                          {pB.valueKeywords.map((vk, i) => (
                            <span key={i} className="font-semibold text-rel-deep text-[10px]">#{vk}</span>
                          ))}
                        </div>
                        <p className="text-[11px] text-rel-ink-soft leading-relaxed">{pB.internalStandardSentence}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ================================================================ */}
              {/* GROUP B. 나는 어디에서 강한가 */}
              {/* ================================================================ */}
              <div className="space-y-3">
                <h3 className="font-rel-sans text-sm font-bold text-rel-deep tracking-wider flex items-center gap-1.5">
                  <span>◤</span>
                  <span>나는 어디에서 강한가</span>
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  {/* Person A Card */}
                  <div className="rounded-2xl border border-rel-line bg-rel-surface p-4 sm:p-5 shadow-sm space-y-5">
                    <div className="border-b border-rel-line/40 pb-2">
                      <span className="rounded-full border border-rel-line bg-rel-taupe-soft/60 text-rel-deep text-xs font-bold px-3 py-0.5 inline-block">
                        {pA.name}
                      </span>
                    </div>

                    {/* ▫ 잘 맞는 업무 */}
                    <div className="space-y-1.5 text-xs">
                      <h4 className="font-rel-sans text-xs font-bold text-rel-ink flex items-center gap-1">
                        <span>▫</span>
                        <span>잘 맞는 업무</span>
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {pA.suitableWorkTypes.map((wt, i) => (
                          <span key={i} className="rounded-md bg-rel-taupe-soft text-rel-ink font-medium text-[11px] px-2 py-0.5 border border-rel-line/30">{wt}</span>
                        ))}
                      </div>
                    </div>

                    {/* ▫ 잘 맞는 역할 · 직무 · 기능 */}
                    <div className="space-y-1.5 pt-3 border-t border-rel-line/40 text-xs">
                      <h4 className="font-rel-sans text-xs font-bold text-rel-ink flex items-center gap-1">
                        <span>▫</span>
                        <span>잘 맞는 역할 · 직무 · 기능</span>
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {pA.suitableRoles.map((r, i) => (
                          <span key={i} className="rounded-md bg-rel-deep/10 text-rel-deep font-bold text-[11px] px-2 py-0.5">{r}</span>
                        ))}
                      </div>
                    </div>

                    {/* ▫ 잘 맞는 팀 · 업무 환경 */}
                    <div className="space-y-1.5 pt-3 border-t border-rel-line/40 text-xs">
                      <h4 className="font-rel-sans text-xs font-bold text-rel-ink flex items-center gap-1">
                        <span>▫</span>
                        <span>잘 맞는 팀 · 업무 환경</span>
                      </h4>
                      <ul className="space-y-1 text-[11px] text-rel-ink-soft">
                        {pA.thrivingEnvironments.map((env, i) => (
                          <li key={i}>✓ {env}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Person B Card */}
                  <div className="rounded-2xl border border-rel-line bg-rel-surface p-4 sm:p-5 shadow-sm space-y-5">
                    <div className="border-b border-rel-line/40 pb-2">
                      <span className="rounded-full border border-rel-line bg-rel-taupe-soft/60 text-rel-deep text-xs font-bold px-3 py-0.5 inline-block">
                        {pB.name}
                      </span>
                    </div>

                    {/* ▫ 잘 맞는 업무 */}
                    <div className="space-y-1.5 text-xs">
                      <h4 className="font-rel-sans text-xs font-bold text-rel-ink flex items-center gap-1">
                        <span>▫</span>
                        <span>잘 맞는 업무</span>
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {pB.suitableWorkTypes.map((wt, i) => (
                          <span key={i} className="rounded-md bg-rel-taupe-soft text-rel-ink font-medium text-[11px] px-2 py-0.5 border border-rel-line/30">{wt}</span>
                        ))}
                      </div>
                    </div>

                    {/* ▫ 잘 맞는 역할 · 직무 · 기능 */}
                    <div className="space-y-1.5 pt-3 border-t border-rel-line/40 text-xs">
                      <h4 className="font-rel-sans text-xs font-bold text-rel-ink flex items-center gap-1">
                        <span>▫</span>
                        <span>잘 맞는 역할 · 직무 · 기능</span>
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {pB.suitableRoles.map((r, i) => (
                          <span key={i} className="rounded-md bg-rel-deep/10 text-rel-deep font-bold text-[11px] px-2 py-0.5">{r}</span>
                        ))}
                      </div>
                    </div>

                    {/* ▫ 잘 맞는 팀 · 업무 환경 */}
                    <div className="space-y-1.5 pt-3 border-t border-rel-line/40 text-xs">
                      <h4 className="font-rel-sans text-xs font-bold text-rel-ink flex items-center gap-1">
                        <span>▫</span>
                        <span>잘 맞는 팀 · 업무 환경</span>
                      </h4>
                      <ul className="space-y-1 text-[11px] text-rel-ink-soft">
                        {pB.thrivingEnvironments.map((env, i) => (
                          <li key={i}>✓ {env}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* ================================================================ */}
              {/* GROUP C. 둘이 함께 일할 때 알아두면 좋은 것 */}
              {/* ================================================================ */}
              <div className="space-y-3">
                <h3 className="font-rel-sans text-sm font-bold text-rel-deep tracking-wider flex items-center gap-1.5">
                  <span>◤</span>
                  <span>둘이 함께 일할 때 알아두면 좋은 것</span>
                </h3>

                <div className="rounded-2xl border border-rel-line bg-rel-surface p-4 sm:p-5 shadow-sm space-y-6">
                  {/* ▫ 맡기면 좋은 일 */}
                  <div className="space-y-2">
                    <h4 className="font-rel-sans text-xs font-bold text-rel-ink flex items-center gap-1">
                      <span>▫</span>
                      <span>맡기면 좋은 일</span>
                    </h4>
                    <div className="grid grid-cols-2 gap-2.5 text-xs">
                      <div className="space-y-1.5">
                        {pA.delegationItems.map((item, i) => (
                          <div key={i} className="rounded-xl bg-rel-taupe-soft/40 p-2.5 border border-rel-line/30 space-y-0.5">
                            <p className="font-bold text-rel-ink text-[11px]">{item.workTitle} → <span className="text-rel-deep font-extrabold">{item.partnerName}</span></p>
                            <p className="text-[10.5px] text-rel-ink-soft">{item.reason}</p>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-1.5">
                        {pB.delegationItems.map((item, i) => (
                          <div key={i} className="rounded-xl bg-rel-taupe-soft/40 p-2.5 border border-rel-line/30 space-y-0.5">
                            <p className="font-bold text-rel-ink text-[11px]">{item.workTitle} → <span className="text-rel-deep font-extrabold">{item.partnerName}</span></p>
                            <p className="text-[10.5px] text-rel-ink-soft">{item.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* ▫ 본래의 업무 기질 vs 지금 일하는 방식 */}
                  <div className="space-y-2 pt-4 border-t border-rel-line/40">
                    <h4 className="font-rel-sans text-xs font-bold text-rel-ink flex items-center gap-1">
                      <span>▫</span>
                      <span>본래의 업무 기질 vs 지금 일하는 방식</span>
                    </h4>
                    <div className="grid grid-cols-2 gap-2.5 text-xs">
                      <div className="rounded-xl bg-rel-taupe-soft/30 p-2.5 space-y-1 border border-rel-line/30">
                        <span className={`rounded-full px-2 py-0.5 text-[9.5px] font-bold ${pA.innateVsCurrent.status === "adapted" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                          {pA.innateVsCurrent.status === "adapted" ? "적응형 습관" : "기질 일치"}
                        </span>
                        <p className="text-[11px] text-rel-ink-soft leading-relaxed">{pA.innateVsCurrent.synthesisSentence}</p>
                      </div>
                      <div className="rounded-xl bg-rel-taupe-soft/30 p-2.5 space-y-1 border border-rel-line/30">
                        <span className={`rounded-full px-2 py-0.5 text-[9.5px] font-bold ${pB.innateVsCurrent.status === "adapted" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                          {pB.innateVsCurrent.status === "adapted" ? "적응형 습관" : "기질 일치"}
                        </span>
                        <p className="text-[11px] text-rel-ink-soft leading-relaxed">{pB.innateVsCurrent.synthesisSentence}</p>
                      </div>
                    </div>
                  </div>

                  {/* ▫ 가장 닮은 점 / 가장 다른 점 */}
                  <div className="space-y-1.5 pt-4 border-t border-rel-line/40 text-xs">
                    <h4 className="font-rel-sans text-xs font-bold text-rel-ink flex items-center gap-1 mb-1">
                      <span>▫</span>
                      <span>가장 닮은 점 / 가장 다른 점</span>
                    </h4>
                    <p className="text-rel-ink">🔹 <strong>가장 비슷한 부분:</strong> {individualBundle.mostSimilarInsight}</p>
                    <p className="text-rel-ink">🔸 <strong>가장 다른 부분:</strong> {individualBundle.mostDifferentInsight}</p>
                  </div>
                </div>
              </div>

              {/* 레거시 '역할 및 기여 방식' 카드 (Chapter 02 하단 배치) */}
              {roleMatrixSection ? (
                <div className="mt-6">
                  <RoleMatrixCard section={roleMatrixSection} />
                </div>
              ) : null}
            </div>
          );
        })()}
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
    </div>
  );
}
