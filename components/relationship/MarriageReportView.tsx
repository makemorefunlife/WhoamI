"use client";

import type { MarriageReportBody } from "@/lib/relationship/marriage/buildMarriageReport";
import type { HomeLifeDnaProfile } from "@/lib/relationship/marriage/homeLifeLanguage";
import type { HomeUpsetGuide } from "@/lib/relationship/marriage/homeLifeLanguage";
import type { BedroomPersonProfile } from "@/lib/relationship/marriage/bedroomProfile";
import type { HomeDeEscalationCard } from "@/lib/relationship/marriage/homeDeEscalationPrescriptions";
import { hydrateMarriageSnapshotPanel } from "@/lib/relationship/marriage/buildMarriageSnapshotPanel";
import TriScoreSnapshotPanel from "@/components/relationship/TriScoreSnapshotPanel";
import {
  RelationshipReportLayout,
  RelationshipReportCard,
  RelationshipReportBody,
  RelationshipReportParagraph,
  RelationshipReportLabel,
  RelationshipReportInset,
  getTabTheme,
} from "@/components/relationship/reportLayout";

const DE_ESCALATION_COLORS: Record<string, string> = {
  red: "border-red-400/30 bg-red-950/20 text-red-200",
  yellow: "border-yellow-400/30 bg-yellow-950/15 text-yellow-100",
  orange: "border-orange-400/30 bg-orange-950/15 text-orange-100",
  blue: "border-blue-400/30 bg-blue-950/15 text-blue-100",
  green: "border-emerald-400/30 bg-emerald-950/15 text-emerald-100",
};

function DnaCard({ profile, accent }: { profile: HomeLifeDnaProfile; accent: string }) {
  return (
    <RelationshipReportInset>
      <p className="text-sm font-bold text-white/92">👤 {profile.nickname}</p>
      <p className="mt-2 text-base font-semibold" style={{ color: accent }}>
        {profile.lifestyle_title}
      </p>
      <ul className="mt-4 space-y-3">
        <li>
          <RelationshipReportLabel>🏡 추구하는 삶의 가치관</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1.5">
            {profile.life_values}
          </RelationshipReportParagraph>
        </li>
        <li>
          <RelationshipReportLabel>🛏️ 문 닫은 집 안에서의 모습</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1.5">
            {profile.private_home_self}
          </RelationshipReportParagraph>
        </li>
        <li>
          <RelationshipReportLabel>🔋 에너지 배터리</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1.5">
            {profile.energy_battery}
          </RelationshipReportParagraph>
        </li>
        <li>
          <RelationshipReportLabel>🔮 패밀리 정체성</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1.5">
            {profile.family_identity}
          </RelationshipReportParagraph>
        </li>
      </ul>
    </RelationshipReportInset>
  );
}

function BedroomProfileCard({ profile }: { profile: BedroomPersonProfile }) {
  return (
    <RelationshipReportInset>
      <p className="text-sm font-bold text-white/92">
        {profile.nickname}의 밤 프로필
      </p>
      <ul className="mt-4 space-y-3">
        <li>
          <RelationshipReportLabel>🔋 스태미나 & 지속력</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1.5">
            {profile.stamina}
          </RelationshipReportParagraph>
        </li>
        <li>
          <RelationshipReportLabel>🔮 판타지 & 새로움</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1.5">
            {profile.fantasy}
          </RelationshipReportParagraph>
        </li>
        <li>
          <RelationshipReportLabel>💖 침실 매너 & 배려</RelationshipReportLabel>
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
  return (
    <div
      className={`rounded-xl border p-5 ${DE_ESCALATION_COLORS[card.color] ?? DE_ESCALATION_COLORS.blue}`}
    >
      <p className="text-xs font-medium uppercase tracking-wide opacity-80">
        ⚡ {card.upset_nickname}가 화났을 때
      </p>
      <p className="mt-1 text-xs opacity-75">
        → {card.partner_nickname}의 화 풀림 처방
      </p>
      <p className="mt-3 text-base font-bold">{card.hashtag}</p>
      {card.archetype_label ? (
        <p className="mt-0.5 text-xs opacity-75">{card.archetype_label}</p>
      ) : null}
      <div className="mt-4 space-y-4 text-[15px] leading-relaxed">
        <div>
          <p className="font-semibold">🧠 {card.upset_nickname}의 심리 상태</p>
          <p className="mt-1.5 opacity-95">{card.psych_state}</p>
        </div>
        <div>
          <p className="font-semibold">🛑 {card.partner_nickname}가 하면 안 되는 것</p>
          <p className="mt-1.5 opacity-95">{card.avoid_actions}</p>
        </div>
        <div>
          <p className="font-semibold">
            💊 {card.partner_nickname} → {card.upset_nickname} Script
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
  return (
    <RelationshipReportInset>
      <p className="text-sm font-bold text-white/92">{guide.nickname}가 화날 때</p>
      <div className="mt-4 space-y-3">
        <div>
          <RelationshipReportLabel>잘 터지는 포인트</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1.5">
            {guide.upset_signals}
          </RelationshipReportParagraph>
        </div>
        <div>
          <RelationshipReportLabel className="text-emerald-200/90">
            이렇게 풀어보세요
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
            피하면 좋아요
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
}: {
  report: MarriageReportBody;
}) {
  const theme = getTabTheme("cohabitation");
  const panel = hydrateMarriageSnapshotPanel(report.snapshot_panel);
  const hh = report.household;
  const snap = hh?.section_snapshot ?? {
    romantic_fit_pct: report.meta?.romantic_fit_pct ?? 0,
    life_synergy_pct: report.meta?.life_synergy_pct ?? 0,
    home_risk_pct: report.meta?.home_risk_pct ?? 0,
    one_line_household: report.one_line_household ?? report.headline,
  };
  const nickA = hh?.section_dna?.person_a.nickname ?? "A";
  const nickB = hh?.section_dna?.person_b.nickname ?? "B";
  const {
    cards: deCards,
    isLegacySingle: deLegacySingle,
    sharedTriggerNote: deSharedNote,
  } = resolveDeEscalationCards(
    hh?.section_warning?.de_escalation,
    nickA,
    nickB,
  );
  const deSameType =
    deCards.length === 2 && deCards[0]!.hashtag === deCards[1]!.hashtag;

  return (
    <RelationshipReportLayout
      kind="cohabitation"
      kindLabel="Premium · 하우스홀드"
      headline={{
        title: report.headline || snap.one_line_household,
        subtitle: snap.one_line_household,
        names: [nickA, nickB],
        badge: report.meta?.grade
          ? `하우스홀드 등급 ${report.meta.grade}`
          : undefined,
      }}
      scores={[
        {
          emoji: "🔥",
          label: "로맨틱 핏",
          value: snap.romantic_fit_pct,
          tone: "warm",
        },
        {
          emoji: "🧩",
          label: "라이프 시너지",
          value: snap.life_synergy_pct,
          tone: "cool",
        },
        {
          emoji: "⚡",
          label: "홈 리스크",
          value: snap.home_risk_pct,
          tone: "alert",
        },
      ]}
      scoreFooter={<TriScoreSnapshotPanel panel={panel} kind="cohabitation" />}
    >
      {hh?.section_dna ? (
        <RelationshipReportCard
          title="🧬 홈 라이프 DNA — 한 지붕 아래, 우린 각각 어떤 사람일까?"
          accentColor={theme.accent}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <DnaCard profile={hh.section_dna.person_a} accent={theme.accent} />
            <DnaCard profile={hh.section_dna.person_b} accent={theme.accent} />
          </div>
        </RelationshipReportCard>
      ) : null}

      {hh?.section_weather_forecast ? (
        <RelationshipReportCard
          title="⏳ 향후 3년 홈 리스크 기상도"
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
          title="🔞 침실 케미스트리 & 애착 유형"
          accentColor={theme.accent}
        >
          <RelationshipReportBody>
            <div>
              <RelationshipReportLabel>🌙 밤의 정합성</RelationshipReportLabel>
              <RelationshipReportParagraph className="mt-1.5">
                {hh.section_bedroom.matrix?.sexual_chemistry_summary ??
                  (hh.section_bedroom as { sexual_chemistry?: string })
                    .sexual_chemistry ??
                  ""}
              </RelationshipReportParagraph>
            </div>
            {hh.section_bedroom.matrix ? (
              <>
                <RelationshipReportLabel className="mt-2">
                  📊 밤의 성능 & 성향 매트릭스
                </RelationshipReportLabel>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <BedroomProfileCard
                    profile={hh.section_bedroom.matrix.person_a}
                  />
                  <BedroomProfileCard
                    profile={hh.section_bedroom.matrix.person_b}
                  />
                </div>
                <div className="mt-4">
                  <RelationshipReportLabel>🔥 침실 주파수 한줄평</RelationshipReportLabel>
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
                  💡 수면 처방
                </RelationshipReportLabel>
                <RelationshipReportParagraph className="mt-1.5">
                  {hh.section_bedroom.sleep_fit.prescription}
                </RelationshipReportParagraph>
              </RelationshipReportInset>
            ) : null}
            <div className="mt-4">
              <RelationshipReportLabel>❤️ 정서적 애착 유형</RelationshipReportLabel>
              <RelationshipReportParagraph className="mt-1.5">
                {hh.section_bedroom.attachment_style}
              </RelationshipReportParagraph>
            </div>
          </RelationshipReportBody>
        </RelationshipReportCard>
      ) : null}

      {hh?.section_money_chores ? (
        <RelationshipReportCard
          title="💸 자산 관리 주도권 & 가사 분담"
          accentColor={theme.accent}
        >
          <RelationshipReportBody>
            <RelationshipReportParagraph>
              <span className="font-medium text-white/90">
                💰 통장 잔고는 누가 쥐어야 할까?{" "}
              </span>
              <strong>{hh.section_money_chores.cfo_nickname}</strong>
              {" — "}
              {hh.section_money_chores.cfo_reason}
            </RelationshipReportParagraph>
            <RelationshipReportParagraph>
              <span className="font-medium text-white/90">[살림 분담] </span>
              {hh.section_money_chores.chores_guideline}
            </RelationshipReportParagraph>
          </RelationshipReportBody>
        </RelationshipReportCard>
      ) : null}

      {hh?.section_family_boundary ? (
        <RelationshipReportCard
          title="👪 원가족과의 바운더리 & 독립성"
          accentColor={theme.accent}
        >
          <RelationshipReportBody>
            <div>
              <RelationshipReportLabel>⚠️ 시댁·처가 스트레스 지수</RelationshipReportLabel>
              <RelationshipReportParagraph className="mt-1.5">
                {hh.section_family_boundary.inlaw_stress_summary}
              </RelationshipReportParagraph>
            </div>
            <RelationshipReportParagraph>
              <span className="font-medium text-white/90">
                [{hh.section_dna?.person_a.nickname ?? "A"}]{" "}
              </span>
              {hh.section_family_boundary.person_a_boundary_note}
            </RelationshipReportParagraph>
            <RelationshipReportParagraph>
              <span className="font-medium text-white/90">
                [{hh.section_dna?.person_b.nickname ?? "B"}]{" "}
              </span>
              {hh.section_family_boundary.person_b_boundary_note}
            </RelationshipReportParagraph>
          </RelationshipReportBody>
        </RelationshipReportCard>
      ) : null}

      {hh?.section_parenting ? (
        <RelationshipReportCard
          title="👶 육아·교육 가치관"
          accentColor={theme.accent}
        >
          <RelationshipReportBody>
            <RelationshipReportParagraph>
              {hh.section_parenting.combined_attitude}
            </RelationshipReportParagraph>
            <RelationshipReportParagraph>
              <span className="font-medium text-white/90">
                [{hh.section_dna?.person_a.nickname ?? "A"}]{" "}
              </span>
              {hh.section_parenting.person_a_style}
            </RelationshipReportParagraph>
            <RelationshipReportParagraph>
              <span className="font-medium text-white/90">
                [{hh.section_dna?.person_b.nickname ?? "B"}]{" "}
              </span>
              {hh.section_parenting.person_b_style}
            </RelationshipReportParagraph>
            <RelationshipReportParagraph className="italic">
              {hh.section_parenting.harmony_tip}
            </RelationshipReportParagraph>
          </RelationshipReportBody>
        </RelationshipReportCard>
      ) : null}

      {hh?.section_privacy ? (
        <RelationshipReportCard
          title="🤝 사생활 존중 가이드"
          accentColor={theme.accent}
        >
          <RelationshipReportBody>
            <RelationshipReportParagraph>
              <span className="font-medium text-white/90">
                [내가 침범받기 싫은 선]{" "}
              </span>
              {hh.section_privacy.person_a_private_line}
            </RelationshipReportParagraph>
            <RelationshipReportParagraph>
              <span className="font-medium text-white/90">
                [상대에게 보장해 줄 선]{" "}
              </span>
              {hh.section_privacy.person_b_private_line}
            </RelationshipReportParagraph>
          </RelationshipReportBody>
        </RelationshipReportCard>
      ) : null}

      {hh?.section_warning || hh?.section_upset ? (
        <RelationshipReportCard
          title="⚠️ 홈 워닝 & 부부 싸움 해독제"
          accentColor={theme.accent}
          variant="warning"
        >
          {hh?.section_warning ? (
            <RelationshipReportBody>
              <div>
                <RelationshipReportLabel>갈등 트리거</RelationshipReportLabel>
                <RelationshipReportParagraph className="mt-1.5">
                  {hh.section_warning.conflict_trigger}
                </RelationshipReportParagraph>
              </div>
            </RelationshipReportBody>
          ) : null}
          {hh?.section_upset ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <UpsetGuideCard guide={hh.section_upset.person_a} />
              <UpsetGuideCard guide={hh.section_upset.person_b} />
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
                정서적 방임 리스크
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
                  💊 화 풀림 처방전 — 두 사람 각각 1장
                </p>
                <RelationshipReportParagraph className="mt-2" muted>
                  각 카드 = 「{nickA} 또는 {nickB}가 화났을 때 → 상대가 할
                  말·행동」입니다.
                  {deSameType
                    ? " 두 사람의 1순위 화 풀림 유형이 같습니다."
                    : " 두 사람의 화 풀림 방식은 다릅니다."}
                </RelationshipReportParagraph>
                {deSharedNote || deSameType ? (
                  <p className="mt-3 rounded-lg border border-violet-400/25 bg-violet-950/20 p-3 text-sm text-violet-100/90">
                    🔁{" "}
                    {deSharedNote ??
                      `${nickA}와 ${nickB}는 같은 화 풀림 유형입니다. 비슷한 지점에서 동시에 터지기 쉬우니, 한 명이 먼저 타임아웃을 선언하세요.`}
                  </p>
                ) : null}
                {deLegacySingle ? (
                  <p className="mt-3 rounded-lg border border-amber-400/25 bg-amber-950/20 p-3 text-sm text-amber-100/90">
                    이 리포트는 구버전(카드 1장)입니다. 「동거·결혼 심화 분석
                    다시 만들기」를 누르면 {nickA}·{nickB} 각각의 처방 카드 2장이
                    표시됩니다.
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
    </RelationshipReportLayout>
  );
}
