"use client";

import { useMemo } from "react";
import type { WorkColleagueReportBody } from "@/lib/relationship/workColleague/buildWorkColleagueReport";
import { buildWorkPsychMatchBundle } from "@/lib/relationship/psychDomainLens/buildWorkPsychMatch";
import { resolveReportPsychDisplay } from "@/lib/relationship/psychDomainLens/resolvePsychDisplay";
import RelationshipPsychMatchSection from "@/components/relationship/RelationshipPsychMatchSection";
import type { OfficePersonRoleCard } from "@/lib/relationship/workColleague/officeReportTemplate";
import { hydrateWorkSnapshotPanel } from "@/lib/relationship/workColleague/buildWorkSnapshotPanel";
import { pickViewerFirstPair } from "@/lib/relationship/viewerFirstDisplay";
import TriScoreSnapshotPanel from "@/components/relationship/TriScoreSnapshotPanel";
import PairPrescriptionSection from "@/components/relationship/shared/PairPrescriptionSection";
import {
  DnaCard,
  UpsetGuideCard,
  IdealRoleCard,
  RoleCard,
  DeEscalationBlock,
  WorkCompareTableCard,
} from "@/components/relationship/workColleague/officeCards";
import {
  RelationshipReportLayout,
  RelationshipReportCard,
  RelationshipReportBody,
  RelationshipReportParagraph,
  RelationshipReportLabel,
  getTabTheme,
} from "@/components/relationship/reportLayout";
import { useLocale, useMessages } from "@/lib/i18n/LocaleProvider";
import { buildWorkReportViewModel } from "@/lib/relationship/workColleague/viewModel/buildWorkReportViewModel";
import { WorkReportViewModelView } from "@/components/relationship/workColleague/sections/SectionRenderer";

/**
 * ko-KR 신규 렌더러(WorkReportViewModelView) 진입 가능 여부를 판단하는 구조 점검.
 *
 * buildWorkReportViewModel()은 새 shape(section_roles.person_a/b 등)만 이해한다.
 * 아래 3개 필드는 이 컴포넌트가 이미 방어적으로 처리해 온 "레거시 대체 shape"
 * (my_work_style/partner_work_style, my_boundary/partner_boundary,
 * my_weapons/delegate_to_partner)가 실존한다는 증거다 — 그 대체 shape로 저장된
 * 오래된 캐시 row가 새 렌더러에 들어가면 일부를 조용히 비우거나(마이크로 매니징
 * 카드 공백) 크래시(RoleCard가 undefined.weapons를 읽음)를 낼 수 있으므로,
 * 이런 payload는 신규 렌더러를 타지 않고 기존 렌더러로 안전하게 남긴다.
 * viewmodel adapter(buildWorkReportViewModel.ts) 자체는 건드리지 않는다.
 */
function workReportSupportsNewRenderer(report: WorkColleagueReportBody): boolean {
  // Structural gate only — no debug logging (Next treats console.error as overlay errors).
  const office = report.office;
  if (!office) return false;

  const roles = office.section_roles as
    | { person_a?: unknown; person_b?: unknown }
    | undefined;
  if (
    !roles ||
    typeof roles.person_a !== "object" ||
    roles.person_a === null ||
    typeof roles.person_b !== "object" ||
    roles.person_b === null
  ) {
    return false;
  }

  const mixFit = office.section_mix_fit as
    | { person_a_work_style?: unknown; person_b_work_style?: unknown }
    | undefined;
  if (
    !mixFit ||
    typeof mixFit.person_a_work_style !== "string" ||
    typeof mixFit.person_b_work_style !== "string"
  ) {
    return false;
  }

  // section_respect is legitimately optional (buildWorkReportViewModel already
  // omits the boundary block gracefully when absent) — only reject it when it's
  // present in the old alternate shape.
  const respect = office.section_respect as
    | { person_a_boundary?: unknown; person_b_boundary?: unknown }
    | undefined;
  if (
    respect &&
    (typeof respect.person_a_boundary !== "string" ||
      typeof respect.person_b_boundary !== "string")
  ) {
    return false;
  }

  return true;
}

export default function WorkColleagueReportView({
  report,
  myName: myNameProp,
  partnerName: partnerNameProp,
  viewerIsReportA = true,
}: {
  report: WorkColleagueReportBody;
  myName?: string;
  partnerName?: string;
  viewerIsReportA?: boolean;
}) {
  const { locale } = useLocale();
  const messages = useMessages();
  const t = messages.relationshipDrilldown.work;
  const theme = getTabTheme("work");
  const office = report.office;
  const dnaPair = office?.section_dna
    ? pickViewerFirstPair(
        office.section_dna.person_a,
        office.section_dna.person_b,
        viewerIsReportA,
      )
    : null;
  const myName = myNameProp ?? dnaPair?.me.nickname ?? messages.report.meFallbackLabel;
  const partnerName =
    partnerNameProp ?? dnaPair?.partner.nickname ?? messages.report.partnerFallbackLabel;

  const snap = office?.section_snapshot ?? {
    fit_pct: report.meta?.fit_pct ?? 0,
    synergy_pct: report.meta?.synergy_pct ?? 0,
    risk_pct: report.meta?.risk_pct ?? 0,
    one_line_definition: report.one_line_definition ?? report.headline,
  };

  const panel = useMemo(() => {
    const pc = report.meta?.person_core;
    return hydrateWorkSnapshotPanel(report.snapshot_panel, {
      psychA: pc?.psych_a,
      psychB: pc?.psych_b,
      nicknameA: office?.section_dna?.person_a.nickname ?? report.snapshot_panel.personA.nickname,
      nicknameB: office?.section_dna?.person_b.nickname ?? report.snapshot_panel.personB.nickname,
    });
  }, [report.snapshot_panel, report.meta?.person_core, office?.section_dna]);

  const psychDisplay = useMemo(
    () => resolveReportPsychDisplay(report.meta, buildWorkPsychMatchBundle),
    [report.meta],
  );

  const mixFit = office?.section_mix_fit as
    | {
        person_a_work_style?: string;
        person_b_work_style?: string;
        my_work_style?: string;
        partner_work_style?: string;
        communication_fit?: string;
      }
    | undefined;
  const { me: workStyleMe, partner: workStylePartner } = pickViewerFirstPair(
    mixFit?.person_a_work_style ?? mixFit?.my_work_style ?? "",
    mixFit?.person_b_work_style ?? mixFit?.partner_work_style ?? "",
    viewerIsReportA,
  );

  const respect = office?.section_respect as
    | {
        person_a_boundary?: string;
        person_b_boundary?: string;
        my_boundary?: string;
        partner_boundary?: string;
      }
    | undefined;
  const { me: boundaryMe, partner: boundaryPartner } = pickViewerFirstPair(
    respect?.person_a_boundary ?? respect?.my_boundary ?? "",
    respect?.person_b_boundary ?? respect?.partner_boundary ?? "",
    viewerIsReportA,
  );

  const roles = office?.section_roles as
    | {
        person_a?: OfficePersonRoleCard;
        person_b?: OfficePersonRoleCard;
        synergy_one_liner?: string;
        my_weapons?: string[];
        delegate_to_partner?: Array<{
          task: string;
          delegate_to: string;
          reason: string;
        }>;
      }
    | undefined;
  const rolePair = roles?.person_a && roles?.person_b
    ? pickViewerFirstPair(roles.person_a, roles.person_b, viewerIsReportA)
    : null;
  const idealPair = office?.section_ideal_roles
    ? pickViewerFirstPair(
        office.section_ideal_roles.person_a,
        office.section_ideal_roles.person_b,
        viewerIsReportA,
      )
    : null;
  const upsetPair = office?.section_upset
    ? pickViewerFirstPair(
        office.section_upset.person_a,
        office.section_upset.person_b,
        viewerIsReportA,
      )
    : null;

  const deCard = office?.section_warning?.de_escalation;

  // Part 렌더러 — en-US/ko-KR 둘 다 지원(SECTION_TITLES가 locale-aware, 주 타겟이
  // 영어권이라 ko-KR로 게이트하면 안 됨). 페이로드가 새 ViewModel 어댑터가 이해하는
  // 모양이 아니면(레거시 payload 등) structural check에서 걸러져 아래 레거시 JSX로
  // 폴백한다. 이건 buildWorkReportViewModel.ts 자체나 premium API route, 저장된
  // report shape을 건드리지 않는다.
  //
  // Only the adapter call is try/caught — constructing/returning JSX inside a
  // try/catch would NOT catch errors thrown while React actually renders
  // <WorkReportViewModelView> (react-hooks/error-boundaries), so this only
  // protects against buildWorkReportViewModel() itself throwing on a payload
  // that slipped past the structural check above. A crash inside the
  // renderer's own JSX tree is not covered by this net.
  let koRendererViewModel: ReturnType<typeof buildWorkReportViewModel> | null = null;
  try {
    koRendererViewModel = buildWorkReportViewModel(report, {
      viewerIsReportA,
      myName,
      partnerName,
      locale,
    });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error(
        "[WorkColleagueReportView] buildWorkReportViewModel failed, falling back to legacy view",
        err,
      );
    }
  }
  if (koRendererViewModel) {
    return <WorkReportViewModelView vm={koRendererViewModel} kindLabel={t.eyebrow} />;
  }

  return (
    <RelationshipReportLayout
      kind="work"
      kindLabel={t.eyebrow}
      headline={{
        title: report.headline || snap.one_line_definition,
        subtitle: snap.one_line_definition,
        names: [myName, partnerName],
        badge: report.meta?.grade ? t.gradeBadge(report.meta.grade) : undefined,
      }}
      scores={[
        { emoji: "🔥", label: t.scoreLabelFit, value: snap.fit_pct, tone: "warm" },
        {
          emoji: "🧩",
          label: t.scoreLabelSynergy,
          value: snap.synergy_pct,
          tone: "cool",
        },
        {
          emoji: "⚡",
          label: t.scoreLabelRisk,
          value: snap.risk_pct,
          tone: "alert",
        },
      ]}
      scoreFooter={<TriScoreSnapshotPanel panel={panel} kind="work" />}
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

      {office?.section_compare_table?.length ? (
        <RelationshipReportCard
          title={t.compareTableCardTitle}
          accentColor={theme.accent}
        >
          <WorkCompareTableCard
            rows={office.section_compare_table}
            viewerIsReportA={viewerIsReportA}
            accent={theme.accent}
            myName={myName}
            partnerName={partnerName}
          />
        </RelationshipReportCard>
      ) : null}

      {dnaPair ? (
        <RelationshipReportCard
          title={t.dnaCardTitle}
          accentColor={theme.accent}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <DnaCard profile={dnaPair.me} accent={theme.accent} />
            <DnaCard
              profile={dnaPair.partner}
              accent={theme.accent}
            />
          </div>
        </RelationshipReportCard>
      ) : null}

      {mixFit ? (
        <RelationshipReportCard
          title={t.mixFitCardTitle}
          accentColor={theme.accent}
        >
          <RelationshipReportBody>
            <div>
              <RelationshipReportLabel>{t.workStyleLabel(myName)}</RelationshipReportLabel>
              <RelationshipReportParagraph className="mt-1.5">
                {workStyleMe}
              </RelationshipReportParagraph>
            </div>
            <div>
              <RelationshipReportLabel>{t.workStyleLabel(partnerName)}</RelationshipReportLabel>
              <RelationshipReportParagraph className="mt-1.5">
                {workStylePartner}
              </RelationshipReportParagraph>
            </div>
            <div>
              <RelationshipReportLabel>{t.communicationFitLabel}</RelationshipReportLabel>
              <RelationshipReportParagraph className="mt-1.5">
                {mixFit.communication_fit}
              </RelationshipReportParagraph>
            </div>
          </RelationshipReportBody>
        </RelationshipReportCard>
      ) : null}

      {respect ? (
        <RelationshipReportCard
          title={t.respectCardTitle}
          accentColor={theme.accent}
        >
          <RelationshipReportBody>
            <div>
              <RelationshipReportLabel>{t.boundaryLabel(myName)}</RelationshipReportLabel>
              <RelationshipReportParagraph className="mt-1.5">
                {boundaryMe}
              </RelationshipReportParagraph>
            </div>
            <div>
              <RelationshipReportLabel>{t.boundaryLabel(partnerName)}</RelationshipReportLabel>
              <RelationshipReportParagraph className="mt-1.5">
                {boundaryPartner}
              </RelationshipReportParagraph>
            </div>
          </RelationshipReportBody>
        </RelationshipReportCard>
      ) : null}

      {roles ? (
        <RelationshipReportCard
          title={t.rolesCardTitle}
          accentColor={theme.accent}
        >
          {rolePair ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <RoleCard card={rolePair.me} accent={theme.accent} />
              <RoleCard card={rolePair.partner} accent={theme.accent} />
            </div>
          ) : (
            <RelationshipReportBody>
              <RelationshipReportLabel>
                {t.myWeaponsLabel(myName)}
              </RelationshipReportLabel>
              <ul className="mt-2 list-inside list-disc space-y-1" style={{ color: theme.accent }}>
                {(roles.my_weapons ?? []).map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </RelationshipReportBody>
          )}
          {roles.synergy_one_liner ? (
            <RelationshipReportParagraph className="mt-4 italic">
              💬 {roles.synergy_one_liner}
            </RelationshipReportParagraph>
          ) : null}
        </RelationshipReportCard>
      ) : null}

      {idealPair ? (
        <RelationshipReportCard
          title={t.idealRolesCardTitle}
          accentColor={theme.accent}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <IdealRoleCard fit={idealPair.me} accent={theme.accent} />
            <IdealRoleCard
              fit={idealPair.partner}
              accent={theme.accent}
            />
          </div>
          <RelationshipReportParagraph className="mt-4 italic">
            💬 {office.section_ideal_roles.together_combo}
          </RelationshipReportParagraph>
        </RelationshipReportCard>
      ) : null}

      {upsetPair ? (
        <RelationshipReportCard
          title={t.upsetCardTitle}
          accentColor={theme.accent}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <UpsetGuideCard guide={upsetPair.me} />
            <UpsetGuideCard guide={upsetPair.partner} />
          </div>
        </RelationshipReportCard>
      ) : null}

      {office?.section_warning ? (
        <RelationshipReportCard
          title={t.warningCardTitle}
          accentColor={theme.accent}
          variant="warning"
        >
          <RelationshipReportBody>
            <div>
              <RelationshipReportLabel>{t.conflictTriggerLabel}</RelationshipReportLabel>
              <RelationshipReportParagraph className="mt-1.5">
                {office.section_warning.conflict_trigger}
              </RelationshipReportParagraph>
            </div>
            {deCard ? <DeEscalationBlock deCard={deCard} /> : null}
          </RelationshipReportBody>
        </RelationshipReportCard>
      ) : null}

      <PairPrescriptionSection
        pack={report.meta?.prescription_work}
        accentColor={theme.accent}
        domain="work"
      />
    </RelationshipReportLayout>
  );
}
