import type { FriendReportBody } from "@/lib/relationship/friend/buildFriendReport";

const ACCENT = "#67b7ff";

const CARD_COLORS: Record<string, string> = {
  red: "border-red-400/40 bg-red-500/10",
  yellow: "border-yellow-400/40 bg-yellow-500/10",
  orange: "border-orange-400/40 bg-orange-500/10",
  blue: "border-blue-400/40 bg-blue-500/10",
  green: "border-emerald-400/40 bg-emerald-500/10",
};

function PersonDnaBlock({
  title,
  person,
}: {
  title: string;
  person: FriendReportBody["friend"]["section_social_dna_a"];
}) {
  return (
    <div className="rounded-lg border border-white/8 bg-black/15 p-3">
      <p className="text-xs font-bold text-[var(--space-text)]">{title}</p>
      <p className="mt-1 text-sm font-semibold">{person.social_title}</p>
      <div className="mt-2 space-y-1.5 text-[11px] text-[var(--space-text-muted)]">
        <p>
          <span className="font-medium text-white/70">🎭 포지션:</span>{" "}
          {person.friend_position}
        </p>
        <p>
          <span className="font-medium text-white/70">🗣️ 티키타카:</span>{" "}
          {person.tikitaka_label} — {person.tikitaka_description}
        </p>
        <p>
          <span className="font-medium text-white/70">🔋 배터리:</span>{" "}
          {person.battery_description}
        </p>
        <p>
          <span className="font-medium text-white/70">🍻 편한 본모습:</span>{" "}
          {person.private_self}
        </p>
      </div>
    </div>
  );
}

export default function FriendReportView({
  report,
}: {
  report: FriendReportBody;
}) {
  const f = report.friend;
  const snap = f?.section_snapshot ?? {
    connection_pct: report.meta?.connection_pct ?? 0,
    banter_pct: report.meta?.banter_pct ?? 0,
    risk_pct: report.meta?.risk_pct ?? 0,
    one_line_friendship: report.one_line_friendship ?? report.headline,
  };

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <h3 className="mb-2 text-sm font-semibold" style={{ color: ACCENT }}>
          🧬 Social DNA 프로필
        </h3>
        <div className="space-y-3">
          <PersonDnaBlock
            title={`👤 ${f.section_social_dna_a.nickname}`}
            person={f.section_social_dna_a}
          />
          <PersonDnaBlock
            title={`👤 ${f.section_social_dna_b.nickname}`}
            person={f.section_social_dna_b}
          />
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <h3 className="mb-2 text-sm font-semibold" style={{ color: ACCENT }}>
          💞 우정 파트너십 스냅샷
        </h3>
        <div className="flex flex-wrap gap-x-3 text-sm font-semibold tabular-nums">
          <span>🔥 우정 케미 {snap.connection_pct}%</span>
          <span className="text-white/20">|</span>
          <span>🧩 티키타카 {snap.banter_pct}%</span>
          <span className="text-white/20">|</span>
          <span>⚡ 소셜 리스크 {snap.risk_pct}%</span>
        </div>
        <p className="mt-2 text-sm">{snap.one_line_friendship}</p>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <h3 className="mb-2 text-sm font-semibold" style={{ color: ACCENT }}>
          🤝 [1] 우정 주파수 매칭
        </h3>
        <p className="text-[11px] text-[var(--space-text-muted)]">
          {f.section_soulmate.soulmate_verdict}
        </p>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <h3 className="mb-2 text-sm font-semibold" style={{ color: ACCENT }}>
          💸 [2] 노는 코드와 돈 계산
        </h3>
        <p className="text-[11px] text-[var(--space-text-muted)]">
          <span className="font-medium text-white/70">💰 총무:</span>{" "}
          {f.section_play_money.treasurer_nickname} —{" "}
          {f.section_play_money.treasurer_reason}
        </p>
        <p className="mt-2 text-[11px] text-[var(--space-text-muted)]">
          <span className="font-medium text-white/70">🎪 최적 동선:</span>{" "}
          {f.section_play_money.optimal_hangout}
        </p>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <h3 className="mb-2 text-sm font-semibold" style={{ color: ACCENT }}>
          ⚠️ [3] 손절 폭탄 해체 가이드
        </h3>
        <p className="text-[11px] text-[var(--space-text-muted)]">
          {f.section_breakup_guide.trigger_warning_a}
        </p>
        <p className="mt-2 text-[11px] text-[var(--space-text-muted)]">
          {f.section_breakup_guide.trigger_warning_b}
        </p>
      </section>

      <section
        className={`rounded-xl border p-4 ${CARD_COLORS[f.section_de_escalation.color] ?? "border-white/10 bg-white/[0.03]"}`}
      >
        <h3 className="mb-2 text-sm font-semibold" style={{ color: ACCENT }}>
          ⚡ [4] 절친 싸움 해독제
        </h3>
        <p className="text-sm font-bold">{f.section_de_escalation.hashtag}</p>
        <p className="text-[10px] text-white/50">
          {f.section_de_escalation.archetype_label}
        </p>
        <p className="mt-2 text-[11px] italic text-emerald-200/80">
          💬 {f.section_de_escalation.cheat_script}
        </p>
      </section>
    </div>
  );
}
