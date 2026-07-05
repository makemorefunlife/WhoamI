"use client";

import type { FamilyParentReportBody } from "@/lib/relationship/familyParent/buildFamilyParentReport";

const ACCENT = "#9ed4b8";

const CARD_COLORS: Record<string, string> = {
  red: "border-red-400/40 bg-red-500/10",
  yellow: "border-yellow-400/40 bg-yellow-500/10",
  orange: "border-orange-400/40 bg-orange-500/10",
  blue: "border-blue-400/40 bg-blue-500/10",
  green: "border-emerald-400/40 bg-emerald-500/10",
};

export default function FamilyParentReportView({
  report,
}: {
  report: FamilyParentReportBody;
}) {
  const fam = report.family;
  const roles = fam?.section_roles;
  const snap = fam?.section_snapshot ?? {
    bond_pct: report.meta?.bond_pct ?? 0,
    synergy_pct: report.meta?.synergy_pct ?? report.meta?.bond_pct ?? 0,
    risk_pct: report.meta?.risk_pct ?? 0,
    one_line_family: report.one_line_family ?? report.headline,
  };
  const dna = fam?.section_child_dna;
  const card = fam?.section_de_escalation;

  return (
    <div className="space-y-4">
      {roles ? (
        <p className="text-center text-[11px] text-[var(--space-text-muted)]">
          👶 {roles.child_nickname} · {roles.parent_role_label}{" "}
          {roles.parent_nickname}
        </p>
      ) : null}

      {dna ? (
        <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <h3 className="mb-2 text-sm font-semibold" style={{ color: ACCENT }}>
            🧬 Child DNA 프로필
          </h3>
          <p className="text-sm font-semibold text-white/90">
            {dna.genius_title}
          </p>
          <div className="mt-3 space-y-2 text-[11px] text-[var(--space-text-muted)]">
            <p>
              <span className="font-medium text-white/70">🎨 소통 방식:</span>{" "}
              {dna.communication_style}
            </p>
            <p>
              <span className="font-medium text-white/70">
                🧠 숨겨진 감수성:
              </span>{" "}
              {dna.hidden_sensitivity}
            </p>
            <p>
              <span className="font-medium text-white/70">
                🔋 에너지 몰입 방식:
              </span>{" "}
              {dna.attention_focus_style}
            </p>
            <p>
              <span className="font-medium text-white/70">
                🔮 대기만성형 잠재력:
              </span>{" "}
              {dna.hidden_genius}
            </p>
          </div>
        </section>
      ) : null}

      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <h3 className="mb-2 text-sm font-semibold" style={{ color: ACCENT }}>
          👪 패밀리 기질 정합성 스냅샷
        </h3>
        <div className="flex flex-wrap gap-x-3 text-sm font-semibold tabular-nums">
          <span>🔥 정서적 유대 {snap.bond_pct}%</span>
          <span className="text-white/20">|</span>
          <span>🧩 성장 시너지 {snap.synergy_pct}%</span>
          <span className="text-white/20">|</span>
          <span>⚡ 훈육 마찰 {snap.risk_pct}%</span>
        </div>
        <p className="mt-2 text-sm">{snap.one_line_family}</p>
      </section>

      {fam?.section_destiny ? (
        <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <h3 className="mb-2 text-sm font-semibold" style={{ color: ACCENT }}>
            🤝 [1] 우리의 운명적 스코어
          </h3>
          <p className="text-[11px] text-[var(--space-text-muted)]">
            <span className="font-medium text-white/70">🍀 정합성:</span>{" "}
            {fam.section_destiny.harmony_one_liner}
          </p>
          <p className="mt-2 text-[11px] text-[var(--space-text-muted)]">
            <span className="font-medium text-white/70">
              ⚖️ 편애 리스크:
            </span>{" "}
            {fam.section_destiny.favoritism_warning}
          </p>
          {fam.parent_lens_summary ? (
            <p className="mt-2 text-[10px] italic text-emerald-200/70">
              {fam.parent_lens_summary}
            </p>
          ) : null}
        </section>
      ) : null}

      {fam?.section_growth_tunnel ? (
        <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <h3 className="mb-2 text-sm font-semibold" style={{ color: ACCENT }}>
            ⚠️ [2] 아이의 마음 성장 터널
          </h3>
          <p className="text-[11px] text-[var(--space-text-muted)]">
            {fam.section_growth_tunnel.current_challenge}
          </p>
          {fam.section_growth_tunnel.focus_areas.length > 0 ? (
            <p className="mt-2 text-[10px] text-white/50">
              집중 영역:{" "}
              {fam.section_growth_tunnel.focus_areas.join(" · ")}
            </p>
          ) : null}
        </section>
      ) : null}

      {fam?.section_filial_reward ? (
        <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <h3 className="mb-2 text-sm font-semibold" style={{ color: ACCENT }}>
            🎯 [3] 미래의 패밀리 리워드
          </h3>
          <p className="text-[11px] text-[var(--space-text-muted)]">
            {fam.section_filial_reward.future_reward}
          </p>
        </section>
      ) : null}

      {card ? (
        <section
          className={`rounded-xl border p-4 ${CARD_COLORS[card.color] ?? "border-white/10 bg-white/[0.03]"}`}
        >
          <h3 className="mb-2 text-sm font-semibold" style={{ color: ACCENT }}>
            ⚡ [4] 화 풀림 치트키
          </h3>
          <p className="text-sm font-bold">{card.hashtag}</p>
          <p className="text-[10px] text-white/50">{card.archetype_label}</p>
          <div className="mt-3 space-y-2 text-[11px] text-[var(--space-text-muted)]">
            <p>
              <span className="font-medium text-white/70">화났을 때:</span>{" "}
              {card.psych_state}
            </p>
            <p>
              <span className="font-medium text-red-300/80">하지 말 것:</span>{" "}
              {card.avoid_actions}
            </p>
            <p className="italic text-emerald-200/80">
              💬 {card.solution_script}
            </p>
          </div>
        </section>
      ) : null}
    </div>
  );
}
