"use client";

import type { ReactNode } from "react";
import type { MarriageReportBody } from "@/lib/relationship/marriage/buildMarriageReport";
import type { HomeLifeDnaProfile } from "@/lib/relationship/marriage/homeLifeLanguage";
import type { HomeUpsetGuide } from "@/lib/relationship/marriage/homeLifeLanguage";
import type { BedroomPersonProfile } from "@/lib/relationship/marriage/bedroomProfile";
import type { HomeDeEscalationCard } from "@/lib/relationship/marriage/homeDeEscalationPrescriptions";
import { hydrateMarriageSnapshotPanel } from "@/lib/relationship/marriage/buildMarriageSnapshotPanel";
import TriScoreSnapshotPanel from "@/components/relationship/TriScoreSnapshotPanel";

const ACCENT = "#d4a5e8";

const DE_ESCALATION_COLORS: Record<string, string> = {
  red: "border-red-400/30 bg-red-950/20 text-red-200",
  yellow: "border-yellow-400/30 bg-yellow-950/15 text-yellow-100",
  orange: "border-orange-400/30 bg-orange-950/15 text-orange-100",
  blue: "border-blue-400/30 bg-blue-950/15 text-blue-100",
  green: "border-emerald-400/30 bg-emerald-950/15 text-emerald-100",
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <h3 className="mb-3 text-sm font-semibold" style={{ color: ACCENT }}>
        {title}
      </h3>
      <div className="space-y-2 text-sm leading-relaxed text-[var(--space-text)]">
        {children}
      </div>
    </section>
  );
}

function DnaCard({ profile }: { profile: HomeLifeDnaProfile }) {
  return (
    <div className="rounded-lg border border-white/8 bg-black/15 p-3">
      <p className="text-xs font-bold text-[var(--space-text)]">
        👤 {profile.nickname}
      </p>
      <p className="mt-1 text-[11px] font-semibold" style={{ color: ACCENT }}>
        {profile.lifestyle_title}
      </p>
      <ul className="mt-2 space-y-1.5 text-[11px] text-[var(--space-text-muted)]">
        <li>
          <span className="text-[var(--space-text)]">🏡 추구하는 삶의 가치관</span>
          <br />
          {profile.life_values}
        </li>
        <li>
          <span className="text-[var(--space-text)]">🛏️ 문 닫은 집 안에서의 모습</span>
          <br />
          {profile.private_home_self}
        </li>
        <li>
          <span className="text-[var(--space-text)]">🔋 에너지 배터리</span>
          <br />
          {profile.energy_battery}
        </li>
        <li>
          <span className="text-[var(--space-text)]">🔮 패밀리 정체성</span>
          <br />
          {profile.family_identity}
        </li>
      </ul>
    </div>
  );
}

function BedroomProfileCard({ profile }: { profile: BedroomPersonProfile }) {
  return (
    <div className="rounded-lg border border-white/8 bg-black/15 p-3">
      <p className="text-xs font-bold text-[var(--space-text)]">
        {profile.nickname}의 밤 프로필
      </p>
      <ul className="mt-2 space-y-1.5 text-[11px] text-[var(--space-text-muted)]">
        <li>
          <span className="text-[var(--space-text)]">🔋 스태미나 & 지속력</span>
          <br />
          {profile.stamina}
        </li>
        <li>
          <span className="text-[var(--space-text)]">🔮 판타지 & 새로움</span>
          <br />
          {profile.fantasy}
        </li>
        <li>
          <span className="text-[var(--space-text)]">💖 침실 매너 & 배려</span>
          <br />
          {profile.manner}
        </li>
      </ul>
    </div>
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
    <div className={`rounded-lg border p-4 ${DE_ESCALATION_COLORS[card.color] ?? DE_ESCALATION_COLORS.blue}`}>
      <p className="text-[10px] font-medium uppercase tracking-wide opacity-80">
        ⚡ {card.upset_nickname}가 화났을 때
      </p>
      <p className="mt-1 text-[10px] opacity-75">
        → {card.partner_nickname}의 화 풀림 처방
      </p>
      <p className="mt-2 text-sm font-bold">{card.hashtag}</p>
      {card.archetype_label ? (
        <p className="mt-0.5 text-[10px] opacity-75">{card.archetype_label}</p>
      ) : null}
      <div className="mt-3 space-y-3 text-[11px] leading-relaxed">
        <div>
          <p className="font-semibold">🧠 {card.upset_nickname}의 심리 상태</p>
          <p className="mt-1 opacity-95">{card.psych_state}</p>
        </div>
        <div>
          <p className="font-semibold">🛑 {card.partner_nickname}가 하면 안 되는 것</p>
          <p className="mt-1 opacity-95">{card.avoid_actions}</p>
        </div>
        <div>
          <p className="font-semibold">💊 {card.partner_nickname} → {card.upset_nickname} Script</p>
          <p className="mt-1 rounded-md bg-black/20 p-2.5 italic opacity-95">
            {card.solution_script}
          </p>
        </div>
      </div>
    </div>
  );
}

function UpsetGuideCard({ guide }: { guide: HomeUpsetGuide }) {
  return (
    <div className="rounded-lg border border-white/8 bg-black/15 p-3">
      <p className="text-xs font-bold text-[var(--space-text)]">
        {guide.nickname}가 화날 때
      </p>
      <p className="mt-2 text-[11px] text-[var(--space-text-muted)]">
        <span className="font-medium text-[var(--space-text)]">
          잘 터지는 포인트
        </span>
        <br />
        {guide.upset_signals}
      </p>
      <p className="mt-2 text-[11px] font-medium text-emerald-200/90">
        이렇게 풀어보세요
      </p>
      <ul className="mt-1 list-inside list-disc text-[11px] text-[var(--space-text-muted)]">
        {guide.do_list.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] font-medium text-red-200/80">
        피하면 좋아요
      </p>
      <ul className="mt-1 list-inside list-disc text-[11px] text-[var(--space-text-muted)]">
        {guide.avoid_list.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export default function MarriageReportView({
  report,
}: {
  report: MarriageReportBody;
}) {
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
    deCards.length === 2 &&
    deCards[0]!.hashtag === deCards[1]!.hashtag;

  return (
    <div className="space-y-4">
      <Section title="🧬 [0] 홈 라이프 DNA — 한 지붕 아래, 우린 각각 어떤 사람일까?">
        <div className="grid gap-3 sm:grid-cols-2">
          {hh?.section_dna ? (
            <>
              <DnaCard profile={hh.section_dna.person_a} />
              <DnaCard profile={hh.section_dna.person_b} />
            </>
          ) : null}
        </div>
      </Section>

      <div
        className="rounded-xl border bg-gradient-to-b to-transparent p-4 text-center"
        style={{
          borderColor: `${ACCENT}40`,
          backgroundImage: `linear-gradient(to bottom, ${ACCENT}14, transparent)`,
        }}
      >
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.2em]"
          style={{ color: `${ACCENT}e6` }}
        >
          💞 하우스홀드 파트너십 스냅샷
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm font-semibold tabular-nums">
          <span>🔥 로맨틱 핏 {snap.romantic_fit_pct}%</span>
          <span className="text-white/20">|</span>
          <span>🧩 라이프 시너지 {snap.life_synergy_pct}%</span>
          <span className="text-white/20">|</span>
          <span>⚡ 홈 리스크 {snap.home_risk_pct}%</span>
        </div>
        <p className="mt-3 text-sm font-medium text-[var(--space-text)]">
          📌 {snap.one_line_household}
        </p>
      </div>

      <TriScoreSnapshotPanel panel={panel} kind="cohabitation" />

      {hh?.section_weather_forecast ? (
        <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <h3 className="mb-3 text-sm font-semibold" style={{ color: ACCENT }}>
            ⏳ 우리의 향후 3년 홈 리스크 기상도
          </h3>
          <p className="text-sm font-medium text-[var(--space-text)]">
            {hh.section_weather_forecast.summary_line}
          </p>
          <ul className="mt-3 space-y-2 text-[11px] text-[var(--space-text-muted)]">
            {hh.section_weather_forecast.years.map((y) => (
              <li key={y.year}>
                <span className="font-medium text-[var(--space-text)]">
                  {y.icon} {y.year_label} ({y.year})
                </span>
                : {y.weather_label}
                {y.advisory ? (
                  <p className="mt-1 rounded-md border border-amber-400/20 bg-amber-950/15 p-2 text-amber-100/90">
                    {y.advisory}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {hh?.section_bedroom ? (
        <Section title="🔞 [1] 침실 케미스트리 & 애착 유형">
          <p className="text-[11px] text-[var(--space-text-muted)]">
            <span className="font-medium text-[var(--space-text)]">
              🌙 밤의 정합성
            </span>{" "}
            {hh.section_bedroom.matrix?.sexual_chemistry_summary ??
              (hh.section_bedroom as { sexual_chemistry?: string })
                .sexual_chemistry ??
              ""}
          </p>
          {hh.section_bedroom.matrix ? (
            <>
              <p className="mt-3 text-[11px] font-medium text-[var(--space-text)]">
                📊 밤의 성능 & 성향 매트릭스
              </p>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <BedroomProfileCard profile={hh.section_bedroom.matrix.person_a} />
                <BedroomProfileCard profile={hh.section_bedroom.matrix.person_b} />
              </div>
              <p className="mt-3 text-[11px] font-medium text-[var(--space-text)]">
                🔥 침실 주파수 한줄평
              </p>
              <p className="text-[11px] text-[var(--space-text-muted)]">
                {hh.section_bedroom.matrix.frequency_one_liner}
              </p>
            </>
          ) : null}
          {hh.section_bedroom.sleep_fit ? (
            <div className="mt-4 rounded-lg border border-white/8 bg-black/15 p-3">
              <p className="text-[11px] font-medium text-[var(--space-text)]">
                {hh.section_bedroom.sleep_fit.title}
              </p>
              <p className="mt-2 text-[11px] text-[var(--space-text-muted)]">
                {hh.section_bedroom.sleep_fit.narrative}
              </p>
              <p className="mt-2 text-[11px] font-medium text-emerald-200/90">
                💡 수면 처방
              </p>
              <p className="text-[11px] text-[var(--space-text-muted)]">
                {hh.section_bedroom.sleep_fit.prescription}
              </p>
            </div>
          ) : null}
          <p className="mt-3 text-[11px] text-[var(--space-text-muted)]">
            <span className="font-medium text-[var(--space-text)]">
              ❤️ 정서적 애착 유형
            </span>{" "}
            {hh.section_bedroom.attachment_style}
          </p>
        </Section>
      ) : null}

      {hh?.section_money_chores ? (
        <Section title="💸 [2] 자산 관리 주도권 & 가사 분담">
          <p className="text-[11px] text-[var(--space-text-muted)]">
            <span className="font-medium text-[var(--space-text)]">
              💰 통장 잔고는 누가 쥐어야 할까?
            </span>{" "}
            <strong className="text-[var(--space-text)]">
              {hh.section_money_chores.cfo_nickname}
            </strong>
            — {hh.section_money_chores.cfo_reason}
          </p>
          <p className="text-[11px] text-[var(--space-text-muted)]">
            <span className="font-medium text-[var(--space-text)]">
              [살림 분담]
            </span>{" "}
            {hh.section_money_chores.chores_guideline}
          </p>
        </Section>
      ) : null}

      {hh?.section_family_boundary ? (
        <Section title="👪 [3] 원가족과의 바운더리 & 독립성">
          <p className="text-[11px] text-[var(--space-text-muted)]">
            <span className="font-medium text-[var(--space-text)]">
              ⚠️ 시댁·처가 스트레스 지수
            </span>
            <br />
            {hh.section_family_boundary.inlaw_stress_summary}
          </p>
          <p className="mt-3 text-[11px] text-[var(--space-text-muted)]">
            <span className="font-medium text-[var(--space-text)]">
              [{hh.section_dna?.person_a.nickname ?? "A"}]
            </span>{" "}
            {hh.section_family_boundary.person_a_boundary_note}
          </p>
          <p className="text-[11px] text-[var(--space-text-muted)]">
            <span className="font-medium text-[var(--space-text)]">
              [{hh.section_dna?.person_b.nickname ?? "B"}]
            </span>{" "}
            {hh.section_family_boundary.person_b_boundary_note}
          </p>
        </Section>
      ) : null}

      {hh?.section_parenting ? (
        <Section title="👶 [4] 육아·교육 가치관">
          <p className="text-[11px] text-[var(--space-text-muted)]">
            {hh.section_parenting.combined_attitude}
          </p>
          <p className="mt-2 text-[11px] text-[var(--space-text-muted)]">
            <span className="font-medium text-[var(--space-text)]">
              [{hh.section_dna?.person_a.nickname ?? "A"}]
            </span>{" "}
            {hh.section_parenting.person_a_style}
          </p>
          <p className="text-[11px] text-[var(--space-text-muted)]">
            <span className="font-medium text-[var(--space-text)]">
              [{hh.section_dna?.person_b.nickname ?? "B"}]
            </span>{" "}
            {hh.section_parenting.person_b_style}
          </p>
          <p className="mt-2 text-[11px] italic text-[var(--space-text-muted)]">
            {hh.section_parenting.harmony_tip}
          </p>
        </Section>
      ) : null}

      {hh?.section_privacy ? (
        <Section title="🤝 [5] 사생활 존중 가이드">
          <p className="text-[11px] text-[var(--space-text-muted)]">
            <span className="font-medium text-[var(--space-text)]">
              [내가 침범받기 싫은 선]
            </span>{" "}
            {hh.section_privacy.person_a_private_line}
          </p>
          <p className="text-[11px] text-[var(--space-text-muted)]">
            <span className="font-medium text-[var(--space-text)]">
              [상대에게 보장해 줄 선]
            </span>{" "}
            {hh.section_privacy.person_b_private_line}
          </p>
        </Section>
      ) : null}

      {hh?.section_warning || hh?.section_upset ? (
        <Section title="⚠️ [6] 홈 워닝 & 부부 싸움 해독제">
          {hh?.section_warning ? (
            <p className="text-[11px] text-[var(--space-text-muted)]">
              <span className="font-medium text-[var(--space-text)]">
                갈등 트리거
              </span>{" "}
              {hh.section_warning.conflict_trigger}
            </p>
          ) : null}
          {hh?.section_upset ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <UpsetGuideCard guide={hh.section_upset.person_a} />
              <UpsetGuideCard guide={hh.section_upset.person_b} />
            </div>
          ) : null}
          {hh?.section_warning?.conflict_communication ? (
            <div className="mt-4 rounded-lg border border-white/8 bg-black/15 p-3">
              <p className="text-[11px] font-medium text-[var(--space-text)]">
                {hh.section_warning.conflict_communication.title}
              </p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide opacity-75">
                {hh.section_warning.conflict_communication.pattern_label}
              </p>
              <p className="mt-2 text-[11px] text-[var(--space-text-muted)]">
                {hh.section_warning.conflict_communication.narrative}
              </p>
              <p className="mt-2 text-[11px] font-medium text-amber-200/90">
                정서적 방임 리스크
              </p>
              <p className="text-[11px] text-[var(--space-text-muted)]">
                {hh.section_warning.conflict_communication.emotional_neglect_risk}
              </p>
            </div>
          ) : null}
          {deCards.length > 0 ? (
            <div className="mt-4 space-y-3">
              <div>
                <p className="text-[11px] font-semibold text-[var(--space-text)]">
                  💊 화 풀림 처방전 — 두 사람 각각 1장
                </p>
                <p className="mt-1 text-[10px] text-[var(--space-text-muted)]">
                  각 카드 = 「{nickA} 또는 {nickB}가 화났을 때 → 상대가 할
                  말·행동」입니다.
                  {deSameType
                    ? " 두 사람의 1순위 화 풀림 유형이 같습니다."
                    : " 두 사람의 화 풀림 방식은 다릅니다."}
                </p>
                {deSharedNote || deSameType ? (
                  <p className="mt-2 rounded-md border border-violet-400/25 bg-violet-950/20 p-2 text-[10px] text-violet-100/90">
                    🔁{" "}
                    {deSharedNote ??
                      `${nickA}와 ${nickB}는 같은 화 풀림 유형입니다. 비슷한 지점에서 동시에 터지기 쉬우니, 한 명이 먼저 타임아웃을 선언하세요.`}
                  </p>
                ) : null}
                {deLegacySingle ? (
                  <p className="mt-2 rounded-md border border-amber-400/25 bg-amber-950/20 p-2 text-[10px] text-amber-100/90">
                    이 리포트는 구버전(카드 1장)입니다. 「동거·결혼 심화 분석
                    다시 만들기」를 누르면 {nickA}·{nickB} 각각의 처방 카드 2장이
                    표시됩니다.
                  </p>
                ) : null}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {deCards.map((card) => (
                  <DeEscalationPrescriptionCard
                    key={`${card.upset_nickname}-${card.partner_nickname}`}
                    card={card}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </Section>
      ) : null}
    </div>
  );
}
