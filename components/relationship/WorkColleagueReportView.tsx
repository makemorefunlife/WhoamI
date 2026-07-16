"use client";

import { useMemo } from "react";
import type { WorkColleagueReportBody } from "@/lib/relationship/workColleague/buildWorkColleagueReport";
import { buildWorkPsychMatchBundle } from "@/lib/relationship/psychDomainLens/buildWorkPsychMatch";
import { resolveReportPsychDisplay } from "@/lib/relationship/psychDomainLens/resolvePsychDisplay";
import RelationshipPsychMatchSection from "@/components/relationship/RelationshipPsychMatchSection";
import type {
  OfficeDnaProfile,
  OfficeIdealRoleFit,
  OfficeUpsetGuide,
} from "@/lib/relationship/workColleague/officeLanguage";
import type { OfficePersonRoleCard } from "@/lib/relationship/workColleague/officeReportTemplate";
import { hydrateWorkSnapshotPanel } from "@/lib/relationship/workColleague/buildWorkSnapshotPanel";
import { pickViewerFirstPair } from "@/lib/relationship/viewerFirstDisplay";
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

function DnaCard({
  label,
  profile,
  accent,
}: {
  label: string;
  profile: OfficeDnaProfile & { nickname: string };
  accent: string;
}) {
  const t = useMessages().relationshipDrilldown.work;
  return (
    <RelationshipReportInset>
      <p className="text-sm font-bold text-white/92">
        {label} {profile.nickname}
      </p>
      <p className="mt-2 text-base font-semibold" style={{ color: accent }}>
        {profile.character_title}
      </p>
      <ul className="mt-4 space-y-3">
        <li>
          <RelationshipReportLabel>{t.dnaWorkStyleLabel}</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1.5">
            {profile.work_style}
          </RelationshipReportParagraph>
        </li>
        <li>
          <RelationshipReportLabel>{t.dnaInnerStandardLabel}</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1.5">
            {profile.inner_standard}
          </RelationshipReportParagraph>
        </li>
        <li>
          <RelationshipReportLabel>{t.dnaCharacterLabel}</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1.5">
            {profile.overall_character}
          </RelationshipReportParagraph>
        </li>
      </ul>
    </RelationshipReportInset>
  );
}

function UpsetGuideCard({ guide }: { guide: OfficeUpsetGuide }) {
  const t = useMessages().relationshipDrilldown.work;
  return (
    <RelationshipReportInset>
      <p className="text-sm font-bold text-white/92">
        {t.upsetTitle(guide.nickname)}
      </p>
      <div className="mt-4 space-y-3">
        <div>
          <RelationshipReportLabel>{t.upsetSignalLabel}</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1.5">
            {guide.upset_signals}
          </RelationshipReportParagraph>
        </div>
        <div>
          <RelationshipReportLabel className="text-emerald-200/90">
            {t.upsetDoLabel}
          </RelationshipReportLabel>
          <ul className="mt-2 list-inside list-disc space-y-1">
            {guide.do_list.map((item) => (
              <li key={item}>
                <RelationshipReportParagraph>{item}</RelationshipReportParagraph>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <RelationshipReportLabel className="text-red-200/80">
            {t.upsetAvoidLabel}
          </RelationshipReportLabel>
          <ul className="mt-2 list-inside list-disc space-y-1">
            {guide.avoid_list.map((item) => (
              <li key={item}>
                <RelationshipReportParagraph>{item}</RelationshipReportParagraph>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </RelationshipReportInset>
  );
}

function IdealRoleCard({
  label,
  fit,
  accent,
}: {
  label: string;
  fit: OfficeIdealRoleFit;
  accent: string;
}) {
  const t = useMessages().relationshipDrilldown.work;
  return (
    <RelationshipReportInset>
      <p className="text-sm font-bold text-white/92">
        {label} {fit.nickname}
      </p>
      <RelationshipReportParagraph className="mt-3">{fit.why}</RelationshipReportParagraph>
      <div className="mt-4">
        <RelationshipReportLabel>{t.idealRolesLabel}</RelationshipReportLabel>
        <ul className="mt-2 list-inside list-disc space-y-1" style={{ color: accent }}>
          {fit.ideal_roles.map((role) => (
            <li key={role} className="text-[15px] leading-relaxed">
              {role}
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-4">
        <RelationshipReportLabel>{t.idealDeptsLabel}</RelationshipReportLabel>
        <ul className="mt-2 list-inside list-disc space-y-1">
          {fit.ideal_departments.map((dept) => (
            <li key={dept}>
              <RelationshipReportParagraph>{dept}</RelationshipReportParagraph>
            </li>
          ))}
        </ul>
      </div>
    </RelationshipReportInset>
  );
}

function RoleCard({ card, accent }: { card: OfficePersonRoleCard; accent: string }) {
  const t = useMessages().relationshipDrilldown.work;
  return (
    <RelationshipReportInset>
      <p className="text-sm font-bold text-white/92">👤 {card.nickname}</p>
      <div className="mt-4">
        <RelationshipReportLabel>
          {t.roleWeaponsLabel(card.nickname)}
        </RelationshipReportLabel>
        <ul className="mt-2 list-inside list-disc space-y-1" style={{ color: accent }}>
          {card.weapons.map((w) => (
            <li key={w} className="text-[15px] leading-relaxed">
              {w}
            </li>
          ))}
        </ul>
      </div>
      {card.handoff_tasks.length > 0 ? (
        <div className="mt-4 space-y-2">
          <RelationshipReportLabel>
            {t.handoffLabel(card.nickname)}
          </RelationshipReportLabel>
          {card.handoff_tasks.map((task) => (
            <div
              key={`${task.handoff_to}-${task.task_label}`}
              className="rounded-xl border border-white/10 bg-black/15 p-4"
            >
              <p className="font-semibold text-white/90">
                {task.task_label}
                <span className="text-white/40"> → </span>
                <span style={{ color: accent }}>{task.handoff_to}</span>
              </p>
              <RelationshipReportParagraph className="mt-2" muted>
                {task.reason}
              </RelationshipReportParagraph>
            </div>
          ))}
        </div>
      ) : (
        <RelationshipReportParagraph className="mt-3" muted>
          {t.noHandoffNote}
        </RelationshipReportParagraph>
      )}
    </RelationshipReportInset>
  );
}

function DeEscalationBlock({
  deCard,
}: {
  deCard: {
    hashtag: string;
    title: string;
    detail: string;
    color: string;
  };
}) {
  return (
    <RelationshipReportInset className="border-amber-400/20 bg-amber-950/15">
      <p className="text-base font-bold text-white/95">{deCard.hashtag}</p>
      <p className="mt-1 text-sm font-medium text-white/80">{deCard.title}</p>
      <RelationshipReportParagraph className="mt-2">{deCard.detail}</RelationshipReportParagraph>
    </RelationshipReportInset>
  );
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

      {dnaPair ? (
        <RelationshipReportCard
          title={t.dnaCardTitle}
          accentColor={theme.accent}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <DnaCard label="👤" profile={dnaPair.me} accent={theme.accent} />
            <DnaCard
              label="👤"
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
            <IdealRoleCard label="👤" fit={idealPair.me} accent={theme.accent} />
            <IdealRoleCard
              label="👤"
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
