"use client";

import { useMemo } from "react";
import type { MarriageReportBody } from "@/lib/relationship/marriage/buildMarriageReport";
import { buildCohabitationPsychMatchBundle } from "@/lib/relationship/psychDomainLens/buildCohabitationPsychMatch";
import { resolveReportPsychDisplay } from "@/lib/relationship/psychDomainLens/resolvePsychDisplay";
import RelationshipPsychMatchSection from "@/components/relationship/RelationshipPsychMatchSection";
import type { HomeLifeDnaProfile } from "@/lib/relationship/marriage/homeLifeLanguage";
import type { HomeUpsetGuide } from "@/lib/relationship/marriage/homeLifeLanguage";
import type { BedroomPersonProfile } from "@/lib/relationship/marriage/bedroomProfile";
import type { HomeDeEscalationCard } from "@/lib/relationship/marriage/homeDeEscalationPrescriptions";
import { hydrateMarriageSnapshotPanel } from "@/lib/relationship/marriage/buildMarriageSnapshotPanel";
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

const DE_ESCALATION_COLORS: Record<string, string> = {
  red: "border-red-400/30 bg-red-950/20 text-red-200",
  yellow: "border-yellow-400/30 bg-yellow-950/15 text-yellow-100",
  orange: "border-orange-400/30 bg-orange-950/15 text-orange-100",
  blue: "border-blue-400/30 bg-blue-950/15 text-blue-100",
  green: "border-emerald-400/30 bg-emerald-950/15 text-emerald-100",
};

function DnaCard({ profile, accent }: { profile: HomeLifeDnaProfile; accent: string }) {
  const t = useMessages().relationshipDrilldown.cohabitation;
  return (
    <RelationshipReportInset>
      <p className="text-sm font-bold text-white/92">👤 {profile.nickname}</p>
      <p className="mt-2 text-base font-semibold" style={{ color: accent }}>
        {profile.lifestyle_title}
      </p>
      <ul className="mt-4 space-y-3">
        <li>
          <RelationshipReportLabel>{t.dnaValuesLabel}</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1.5">
            {profile.life_values}
          </RelationshipReportParagraph>
        </li>
        <li>
          <RelationshipReportLabel>{t.dnaPrivateSelfLabel}</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1.5">
            {profile.private_home_self}
          </RelationshipReportParagraph>
        </li>
        <li>
          <RelationshipReportLabel>{t.dnaEnergyLabel}</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1.5">
            {profile.energy_battery}
          </RelationshipReportParagraph>
        </li>
        <li>
          <RelationshipReportLabel>{t.dnaFamilyIdentityLabel}</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1.5">
            {profile.family_identity}
          </RelationshipReportParagraph>
        </li>
      </ul>
    </RelationshipReportInset>
  );
}

function BedroomProfileCard({ profile }: { profile: BedroomPersonProfile }) {
  const t = useMessages().relationshipDrilldown.cohabitation;
  return (
    <RelationshipReportInset>
      <p className="text-sm font-bold text-white/92">
        {t.bedroomProfileTitle(profile.nickname)}
      </p>
      <ul className="mt-4 space-y-3">
        <li>
          <RelationshipReportLabel>{t.bedroomStaminaLabel}</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1.5">
            {profile.stamina}
          </RelationshipReportParagraph>
        </li>
        <li>
          <RelationshipReportLabel>{t.bedroomFantasyLabel}</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1.5">
            {profile.fantasy}
          </RelationshipReportParagraph>
        </li>
        <li>
          <RelationshipReportLabel>{t.bedroomMannerLabel}</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1.5">
            {profile.manner}
          </RelationshipReportParagraph>
        </li>
      </ul>
    </RelationshipReportInset>
  );
}

function resolveDeEscalationCards(
  deEscalation: unknown,
  nicknameA: string,
  nicknameB: string,
): {
  cards: HomeDeEscalationCard[];
  isLegacySingle: boolean;
  sharedTriggerNote: string | null;
} {
  if (!deEscalation || typeof deEscalation !== "object") {
    return { cards: [], isLegacySingle: false, sharedTriggerNote: null };
  }

  if ("person_a" in deEscalation && "person_b" in deEscalation) {
    const pair = deEscalation as {
      person_a: HomeDeEscalationCard;
      person_b: HomeDeEscalationCard;
      shared_trigger_note?: string | null;
    };
    return {
      cards: [pair.person_a, pair.person_b],
      isLegacySingle: false,
      sharedTriggerNote: pair.shared_trigger_note ?? null,
    };
  }

  if ("upset_nickname" in deEscalation && "partner_nickname" in deEscalation) {
    return {
      cards: [deEscalation as HomeDeEscalationCard],
      isLegacySingle: true,
      sharedTriggerNote: null,
    };
  }

  if ("target_nickname" in deEscalation) {
    const legacy = deEscalation as HomeDeEscalationCard & {
      target_nickname?: string;
    };
    const upset = legacy.target_nickname ?? nicknameA;
    const partner = upset === nicknameA ? nicknameB : nicknameA;
    return {
      cards: [
        {
          ...legacy,
          upset_nickname: upset,
          partner_nickname: partner,
        },
      ],
      isLegacySingle: true,
      sharedTriggerNote: null,
    };
  }

  return { cards: [], isLegacySingle: false, sharedTriggerNote: null };
}

function DeEscalationPrescriptionCard({
  card,
}: {
  card: HomeDeEscalationCard;
}) {
  const t = useMessages().relationshipDrilldown.cohabitation;
  return (
    <div
      className={`rounded-xl border p-5 ${DE_ESCALATION_COLORS[card.color] ?? DE_ESCALATION_COLORS.blue}`}
    >
      <p className="text-xs font-medium uppercase tracking-wide opacity-80">
        {t.deEscalationCardUpsetLabel(card.upset_nickname)}
      </p>
      <p className="mt-1 text-xs opacity-75">
        {t.deEscalationCardArrowLabel(card.partner_nickname)}
      </p>
      <p className="mt-3 text-base font-bold">{card.hashtag}</p>
      {card.archetype_label ? (
        <p className="mt-0.5 text-xs opacity-75">{card.archetype_label}</p>
      ) : null}
      <div className="mt-4 space-y-4 text-[15px] leading-relaxed">
        <div>
          <p className="font-semibold">{t.deEscalationPsychStateLabel(card.upset_nickname)}</p>
          <p className="mt-1.5 opacity-95">{card.psych_state}</p>
        </div>
        <div>
          <p className="font-semibold">{t.deEscalationAvoidLabel(card.partner_nickname)}</p>
          <p className="mt-1.5 opacity-95">{card.avoid_actions}</p>
        </div>
        <div>
          <p className="font-semibold">
            {t.deEscalationScriptLabel(card.partner_nickname, card.upset_nickname)}
          </p>
          <p className="mt-2 rounded-lg bg-black/20 p-3 italic opacity-95">
            {card.solution_script}
          </p>
        </div>
      </div>
    </div>
  );
}

function UpsetGuideCard({ guide }: { guide: HomeUpsetGuide }) {
  const t = useMessages().relationshipDrilldown.cohabitation;
  return (
    <RelationshipReportInset>
      <p className="text-sm font-bold text-white/92">
        {t.upsetGuideTitle(guide.nickname)}
      </p>
      <div className="mt-4 space-y-3">
        <div>
          <RelationshipReportLabel>{t.upsetPointLabel}</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1.5">
            {guide.upset_signals}
          </RelationshipReportParagraph>
        </div>
        <div>
          <RelationshipReportLabel className="text-emerald-200/90">
            {t.resolveLabel}
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
            {t.avoidLabel}
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

export default function MarriageReportView({
  report,
  myName: myNameProp,
  partnerName: partnerNameProp,
  viewerIsReportA = true,
}: {
  report: MarriageReportBody;
  myName?: string;
  partnerName?: string;
  viewerIsReportA?: boolean;
}) {
  const messages = useMessages();
  const t = messages.relationshipDrilldown.cohabitation;
  const theme = getTabTheme("cohabitation");
  const hh = report.household;
  const dnaPair = hh?.section_dna
    ? pickViewerFirstPair(
        hh.section_dna.person_a,
        hh.section_dna.person_b,
        viewerIsReportA,
      )
    : null;
  const myName = myNameProp ?? dnaPair?.me.nickname ?? messages.report.meFallbackLabel;
  const partnerName =
    partnerNameProp ?? dnaPair?.partner.nickname ?? messages.report.partnerFallbackLabel;

  const panel = useMemo(() => {
    const pc = report.meta?.person_core;
    return hydrateMarriageSnapshotPanel(report.snapshot_panel, {
      psychA: pc?.psych_a,
      psychB: pc?.psych_b,
      nicknameA:
        hh?.section_dna?.person_a.nickname ??
        report.snapshot_panel.personA.nickname,
      nicknameB:
        hh?.section_dna?.person_b.nickname ??
        report.snapshot_panel.personB.nickname,
    });
  }, [report.snapshot_panel, report.meta?.person_core, hh?.section_dna]);

  const snap = hh?.section_snapshot ?? {
    romantic_fit_pct: report.meta?.romantic_fit_pct ?? 0,
    life_synergy_pct: report.meta?.life_synergy_pct ?? 0,
    home_risk_pct: report.meta?.home_risk_pct ?? 0,
    one_line_household: report.one_line_household ?? report.headline,
  };

  const psychDisplay = useMemo(
    () =>
      resolveReportPsychDisplay(report.meta, buildCohabitationPsychMatchBundle),
    [report.meta],
  );

  const slotAName = hh?.section_dna?.person_a.nickname ?? "A";
  const slotBName = hh?.section_dna?.person_b.nickname ?? "B";
  const {
    cards: rawDeCards,
    isLegacySingle: deLegacySingle,
    sharedTriggerNote: deSharedNote,
  } = resolveDeEscalationCards(
    hh?.section_warning?.de_escalation,
    slotAName,
    slotBName,
  );
  const deCards = viewerIsReportA
    ? rawDeCards
    : rawDeCards.length === 2
      ? [rawDeCards[1]!, rawDeCards[0]!]
      : rawDeCards;
  const deSameType =
    deCards.length === 2 && deCards[0]!.hashtag === deCards[1]!.hashtag;
  const bedroomPair = hh?.section_bedroom?.matrix
    ? pickViewerFirstPair(
        hh.section_bedroom.matrix.person_a,
        hh.section_bedroom.matrix.person_b,
        viewerIsReportA,
      )
    : null;
  const familyBoundaryPair = hh?.section_family_boundary
    ? pickViewerFirstPair(
        hh.section_family_boundary.person_a_boundary_note,
        hh.section_family_boundary.person_b_boundary_note,
        viewerIsReportA,
      )
    : null;
  const parentingPair = hh?.section_parenting
    ? pickViewerFirstPair(
        hh.section_parenting.person_a_style,
        hh.section_parenting.person_b_style,
        viewerIsReportA,
      )
    : null;
  const privacyPair = hh?.section_privacy
    ? pickViewerFirstPair(
        hh.section_privacy.person_a_private_line,
        hh.section_privacy.person_b_private_line,
        viewerIsReportA,
      )
    : null;
  const upsetPair = hh?.section_upset
    ? pickViewerFirstPair(
        hh.section_upset.person_a,
        hh.section_upset.person_b,
        viewerIsReportA,
      )
    : null;

  return (
    <RelationshipReportLayout
      kind="cohabitation"
      kindLabel={t.eyebrow}
      headline={{
        title: report.headline || snap.one_line_household,
        subtitle: snap.one_line_household,
        names: [myName, partnerName],
        badge: report.meta?.grade ? t.gradeBadge(report.meta.grade) : undefined,
      }}
      scores={[
        {
          emoji: "🔥",
          label: t.scoreLabelRomanticFit,
          value: snap.romantic_fit_pct,
          tone: "warm",
        },
        {
          emoji: "🧩",
          label: t.scoreLabelLifeSynergy,
          value: snap.life_synergy_pct,
          tone: "cool",
        },
        {
          emoji: "⚡",
          label: t.scoreLabelHomeRisk,
          value: snap.home_risk_pct,
          tone: "alert",
        },
      ]}
      scoreFooter={<TriScoreSnapshotPanel panel={panel} kind="cohabitation" />}
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
            <DnaCard profile={dnaPair.me} accent={theme.accent} />
            <DnaCard profile={dnaPair.partner} accent={theme.accent} />
          </div>
        </RelationshipReportCard>
      ) : null}

      {hh?.section_weather_forecast ? (
        <RelationshipReportCard
          title={t.weatherCardTitle}
          accentColor={theme.accent}
        >
          <RelationshipReportParagraph className="font-medium text-white/90">
            {hh.section_weather_forecast.summary_line}
          </RelationshipReportParagraph>
          <ul className="mt-4 space-y-3">
            {hh.section_weather_forecast.years.map((y) => (
              <li key={y.year}>
                <p className="font-medium text-white/88">
                  {y.icon} {y.year_label} ({y.year}): {y.weather_label}
                </p>
                {y.advisory ? (
                  <p className="mt-2 rounded-lg border border-amber-400/20 bg-amber-950/15 p-3 text-amber-100/90">
                    {y.advisory}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </RelationshipReportCard>
      ) : null}

      {hh?.section_bedroom ? (
        <RelationshipReportCard
          title={t.bedroomCardTitle}
          accentColor={theme.accent}
        >
          <RelationshipReportBody>
            <div>
              <RelationshipReportLabel>{t.bedroomChemistryLabel}</RelationshipReportLabel>
              <RelationshipReportParagraph className="mt-1.5">
                {hh.section_bedroom.matrix?.sexual_chemistry_summary ??
                  (hh.section_bedroom as { sexual_chemistry?: string })
                    .sexual_chemistry ??
                  ""}
              </RelationshipReportParagraph>
            </div>
            {bedroomPair ? (
              <>
                <RelationshipReportLabel className="mt-2">
                  {t.bedroomMatrixLabel}
                </RelationshipReportLabel>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <BedroomProfileCard profile={bedroomPair.me} />
                  <BedroomProfileCard profile={bedroomPair.partner} />
                </div>
                <div className="mt-4">
                  <RelationshipReportLabel>{t.bedroomFrequencyLabel}</RelationshipReportLabel>
                  <RelationshipReportParagraph className="mt-1.5">
                    {hh.section_bedroom.matrix.frequency_one_liner}
                  </RelationshipReportParagraph>
                </div>
              </>
            ) : null}
            {hh.section_bedroom.sleep_fit ? (
              <RelationshipReportInset className="mt-4">
                <p className="font-medium text-white/90">
                  {hh.section_bedroom.sleep_fit.title}
                </p>
                <RelationshipReportParagraph className="mt-2">
                  {hh.section_bedroom.sleep_fit.narrative}
                </RelationshipReportParagraph>
                <RelationshipReportLabel className="mt-3 text-emerald-200/90">
                  {t.sleepPrescriptionLabel}
                </RelationshipReportLabel>
                <RelationshipReportParagraph className="mt-1.5">
                  {hh.section_bedroom.sleep_fit.prescription}
                </RelationshipReportParagraph>
              </RelationshipReportInset>
            ) : null}
            <div className="mt-4">
              <RelationshipReportLabel>{t.attachmentStyleLabel}</RelationshipReportLabel>
              <RelationshipReportParagraph className="mt-1.5">
                {hh.section_bedroom.attachment_style}
              </RelationshipReportParagraph>
            </div>
          </RelationshipReportBody>
        </RelationshipReportCard>
      ) : null}

      {hh?.section_money_chores ? (
        <RelationshipReportCard
          title={t.moneyChoresCardTitle}
          accentColor={theme.accent}
        >
          <RelationshipReportBody>
            <RelationshipReportParagraph>
              <span className="font-medium text-white/90">
                {t.cfoQuestionLabel}
              </span>
              <strong>{hh.section_money_chores.cfo_nickname}</strong>
              {" — "}
              {hh.section_money_chores.cfo_reason}
            </RelationshipReportParagraph>
            <RelationshipReportParagraph>
              <span className="font-medium text-white/90">{t.choresLabel}</span>
              {hh.section_money_chores.chores_guideline}
            </RelationshipReportParagraph>
          </RelationshipReportBody>
        </RelationshipReportCard>
      ) : null}

      {hh?.section_family_boundary ? (
        <RelationshipReportCard
          title={t.familyBoundaryCardTitle}
          accentColor={theme.accent}
        >
          <RelationshipReportBody>
            <div>
              <RelationshipReportLabel>{t.inlawStressLabel}</RelationshipReportLabel>
              <RelationshipReportParagraph className="mt-1.5">
                {hh.section_family_boundary.inlaw_stress_summary}
              </RelationshipReportParagraph>
            </div>
            <RelationshipReportParagraph>
              <span className="font-medium text-white/90">[{myName}] </span>
              {familyBoundaryPair?.me}
            </RelationshipReportParagraph>
            <RelationshipReportParagraph>
              <span className="font-medium text-white/90">[{partnerName}] </span>
              {familyBoundaryPair?.partner}
            </RelationshipReportParagraph>
          </RelationshipReportBody>
        </RelationshipReportCard>
      ) : null}

      {hh?.section_parenting ? (
        <RelationshipReportCard
          title={t.parentingCardTitle}
          accentColor={theme.accent}
        >
          <RelationshipReportBody>
            <RelationshipReportParagraph>
              {hh.section_parenting.combined_attitude}
            </RelationshipReportParagraph>
            <RelationshipReportParagraph>
              <span className="font-medium text-white/90">[{myName}] </span>
              {parentingPair?.me}
            </RelationshipReportParagraph>
            <RelationshipReportParagraph>
              <span className="font-medium text-white/90">[{partnerName}] </span>
              {parentingPair?.partner}
            </RelationshipReportParagraph>
            <RelationshipReportParagraph className="italic">
              {hh.section_parenting.harmony_tip}
            </RelationshipReportParagraph>
          </RelationshipReportBody>
        </RelationshipReportCard>
      ) : null}

      {hh?.section_privacy ? (
        <RelationshipReportCard
          title={t.privacyCardTitle}
          accentColor={theme.accent}
        >
          <RelationshipReportBody>
            <RelationshipReportParagraph>
              <span className="font-medium text-white/90">
                {t.myPrivacyLineLabel}
              </span>
              {privacyPair?.me}
            </RelationshipReportParagraph>
            <RelationshipReportParagraph>
              <span className="font-medium text-white/90">
                {t.partnerPrivacyLineLabel}
              </span>
              {privacyPair?.partner}
            </RelationshipReportParagraph>
          </RelationshipReportBody>
        </RelationshipReportCard>
      ) : null}

      {hh?.section_warning || hh?.section_upset ? (
        <RelationshipReportCard
          title={t.warningCardTitle}
          accentColor={theme.accent}
          variant="warning"
        >
          {hh?.section_warning ? (
            <RelationshipReportBody>
              <div>
                <RelationshipReportLabel>{t.conflictTriggerLabel}</RelationshipReportLabel>
                <RelationshipReportParagraph className="mt-1.5">
                  {hh.section_warning.conflict_trigger}
                </RelationshipReportParagraph>
              </div>
            </RelationshipReportBody>
          ) : null}
          {upsetPair ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <UpsetGuideCard guide={upsetPair.me} />
              <UpsetGuideCard guide={upsetPair.partner} />
            </div>
          ) : null}
          {hh?.section_warning?.conflict_communication ? (
            <RelationshipReportInset className="mt-4">
              <p className="font-medium text-white/90">
                {hh.section_warning.conflict_communication.title}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-white/55">
                {hh.section_warning.conflict_communication.pattern_label}
              </p>
              <RelationshipReportParagraph className="mt-2">
                {hh.section_warning.conflict_communication.narrative}
              </RelationshipReportParagraph>
              <RelationshipReportLabel className="mt-3 text-amber-200/90">
                {t.neglectRiskLabel}
              </RelationshipReportLabel>
              <RelationshipReportParagraph className="mt-1.5">
                {
                  hh.section_warning.conflict_communication
                    .emotional_neglect_risk
                }
              </RelationshipReportParagraph>
            </RelationshipReportInset>
          ) : null}
          {deCards.length > 0 ? (
            <div className="mt-5 space-y-4">
              <div>
                <p className="text-sm font-semibold text-white/92">
                  {t.dePrescriptionHeading}
                </p>
                <RelationshipReportParagraph className="mt-2" muted>
                  {t.deIntro(myName, partnerName)}
                  {deSameType ? t.deSameTypeSuffix : t.deDifferentTypeSuffix}
                </RelationshipReportParagraph>
                {deSharedNote || deSameType ? (
                  <p className="mt-3 rounded-lg border border-violet-400/25 bg-violet-950/20 p-3 text-sm text-violet-100/90">
                    🔁{" "}
                    {deSharedNote ?? t.deSharedNoteFallback(myName, partnerName)}
                  </p>
                ) : null}
                {deLegacySingle ? (
                  <p className="mt-3 rounded-lg border border-amber-400/25 bg-amber-950/20 p-3 text-sm text-amber-100/90">
                    {t.deLegacyNotice(myName, partnerName)}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {deCards.map((card) => (
                  <DeEscalationPrescriptionCard
                    key={`${card.upset_nickname}-${card.partner_nickname}`}
                    card={card}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </RelationshipReportCard>
      ) : null}

      {report.meta?.prescription_cohabitation ? (
        <PairPrescriptionSection
          pack={report.meta.prescription_cohabitation}
          accentColor={theme.accent}
          domain="cohabitation"
        />
      ) : null}
    </RelationshipReportLayout>
  );
}
