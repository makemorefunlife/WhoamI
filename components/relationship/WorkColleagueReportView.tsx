"use client";

import type { ReactNode } from "react";
import type { WorkColleagueReportBody } from "@/lib/relationship/workColleague/buildWorkColleagueReport";
import type {
  OfficeDnaProfile,
  OfficeIdealRoleFit,
  OfficeUpsetGuide,
} from "@/lib/relationship/workColleague/officeLanguage";
import type { OfficePersonRoleCard } from "@/lib/relationship/workColleague/officeReportTemplate";
import { hydrateWorkSnapshotPanel } from "@/lib/relationship/workColleague/buildWorkSnapshotPanel";
import TriScoreSnapshotPanel from "@/components/relationship/TriScoreSnapshotPanel";

const DE_ESCALATION_COLORS: Record<string, string> = {
  red: "border-red-400/30 bg-red-950/20 text-red-200",
  yellow: "border-yellow-400/30 bg-yellow-950/15 text-yellow-100",
  orange: "border-orange-400/30 bg-orange-950/15 text-orange-100",
  blue: "border-blue-400/30 bg-blue-950/15 text-blue-100",
  green: "border-emerald-400/30 bg-emerald-950/15 text-emerald-100",
};

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <h3 className="mb-3 text-sm font-semibold text-[#67b7ff]">{title}</h3>
      <div className="space-y-2 text-sm leading-relaxed text-[var(--space-text)]">
        {children}
      </div>
    </section>
  );
}

function DnaCard({
  label,
  profile,
}: {
  label: string;
  profile: OfficeDnaProfile & { nickname: string };
}) {
  return (
    <div className="rounded-lg border border-white/8 bg-black/15 p-3">
      <p className="text-xs font-bold text-[var(--space-text)]">
        {label} {profile.nickname}
      </p>
      <p className="mt-1 text-[11px] font-semibold text-[#67b7ff]">
        {profile.character_title}
      </p>
      <ul className="mt-2 space-y-1.5 text-[11px] text-[var(--space-text-muted)]">
        <li>
          <span className="text-[var(--space-text)]">🌌 추구하는 일 스타일</span>
          <br />
          {profile.work_style}
        </li>
        <li>
          <span className="text-[var(--space-text)]">🪵 내면의 행동 기준</span>
          <br />
          {profile.inner_standard}
        </li>
        <li>
          <span className="text-[var(--space-text)]">🔮 오피스 캐릭터</span>
          <br />
          {profile.overall_character}
        </li>
      </ul>
    </div>
  );
}

function UpsetGuideCard({ guide }: { guide: OfficeUpsetGuide }) {
  return (
    <div className="rounded-lg border border-white/8 bg-black/15 p-3">
      <p className="text-xs font-bold text-[var(--space-text)]">
        {guide.nickname}가 삐졌을 때
      </p>
      <p className="mt-2 text-[11px] text-[var(--space-text-muted)]">
        <span className="font-medium text-[var(--space-text)]">신호</span>
        <br />
        {guide.upset_signals}
      </p>
      <p className="mt-2 text-[11px] font-medium text-emerald-200/90">
        이렇게 해보세요
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

function IdealRoleCard({
  label,
  fit,
}: {
  label: string;
  fit: OfficeIdealRoleFit;
}) {
  return (
    <div className="rounded-lg border border-white/8 bg-black/15 p-3">
      <p className="text-xs font-bold text-[var(--space-text)]">
        {label} {fit.nickname}
      </p>
      <p className="mt-2 text-[11px] text-[var(--space-text-muted)]">{fit.why}</p>
      <p className="mt-2 text-[11px] font-medium text-[var(--space-text)]">
        잘 맞는 직군
      </p>
      <ul className="mt-1 list-inside list-disc text-[11px] text-[#67b7ff]/90">
        {fit.ideal_roles.map((role) => (
          <li key={role}>{role}</li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] font-medium text-[var(--space-text)]">
        잘 맞는 부서·팀
      </p>
      <ul className="mt-1 list-inside list-disc text-[11px] text-[var(--space-text-muted)]">
        {fit.ideal_departments.map((dept) => (
          <li key={dept}>{dept}</li>
        ))}
      </ul>
    </div>
  );
}

function RoleCard({ card }: { card: OfficePersonRoleCard }) {
  return (
    <div className="rounded-lg border border-white/8 bg-black/15 p-3">
      <p className="text-xs font-bold text-[var(--space-text)]">
        👤 {card.nickname}
      </p>
      <p className="mt-2 text-[11px] font-medium text-[var(--space-text)]">
        {card.nickname}가 맡으면 좋은 일
      </p>
      <ul className="mt-1 list-inside list-disc text-[11px] text-[#67b7ff]/90">
        {card.weapons.map((w) => (
          <li key={w}>{w}</li>
        ))}
      </ul>
      {card.handoff_tasks.length > 0 ? (
        <>
          <p className="mt-3 text-[11px] font-medium text-[var(--space-text)]">
            {card.nickname} → 파트너에게 넘기면 좋은 일
          </p>
          <ul className="mt-2 space-y-2">
            {card.handoff_tasks.map((task) => (
              <li
                key={`${task.handoff_to}-${task.task_label}`}
                className="rounded-lg border border-[#67b7ff]/15 bg-[#67b7ff]/5 p-2.5 text-[11px]"
              >
                <span className="font-semibold text-[var(--space-text)]">
                  {task.task_label}
                </span>
                {" → "}
                <span className="text-[#67b7ff]">{task.handoff_to}</span>
                <p className="mt-1 text-[var(--space-text-muted)]">
                  {task.reason}
                </p>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="mt-2 text-[11px] text-[var(--space-text-muted)]">
          파트너에게 넘기는 게 유리한 영역은 뚜렷하지 않아요. 각자 강점 쪽에
          집중하면 됩니다.
        </p>
      )}
    </div>
  );
}

export default function WorkColleagueReportView({
  report,
}: {
  report: WorkColleagueReportBody;
}) {
  const panel = hydrateWorkSnapshotPanel(report.snapshot_panel);
  const office = report.office;
  const snap = office?.section_snapshot ?? {
    fit_pct: report.meta?.fit_pct ?? 0,
    synergy_pct: report.meta?.synergy_pct ?? 0,
    risk_pct: report.meta?.risk_pct ?? 0,
    one_line_definition: report.one_line_definition ?? report.headline,
  };

  const deCard = office?.section_warning?.de_escalation;
  const deClass = deCard
    ? DE_ESCALATION_COLORS[deCard.color] ?? DE_ESCALATION_COLORS.blue!
    : "";

  const nameA = office?.section_dna?.person_a.nickname ?? "첫 번째";
  const nameB = office?.section_dna?.person_b.nickname ?? "두 번째";

  const mixFit = office?.section_mix_fit as
    | {
        person_a_work_style?: string;
        person_b_work_style?: string;
        my_work_style?: string;
        partner_work_style?: string;
        communication_fit?: string;
      }
    | undefined;
  const workStyleA =
    mixFit?.person_a_work_style ?? mixFit?.my_work_style ?? "";
  const workStyleB =
    mixFit?.person_b_work_style ?? mixFit?.partner_work_style ?? "";

  const respect = office?.section_respect as
    | {
        person_a_boundary?: string;
        person_b_boundary?: string;
        my_boundary?: string;
        partner_boundary?: string;
      }
    | undefined;
  const boundaryA =
    respect?.person_a_boundary ?? respect?.my_boundary ?? "";
  const boundaryB =
    respect?.person_b_boundary ?? respect?.partner_boundary ?? "";

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

  return (
    <div className="space-y-4">
      {/* [0] DNA */}
      <Section title="🧬 [0] 파트너십 DNA 프로필 — 우린 일할 때 어떤 사람일까?">
        <div className="grid gap-3 sm:grid-cols-2">
          {office?.section_dna ? (
            <>
              <DnaCard label="👤" profile={office.section_dna.person_a} />
              <DnaCard label="👤" profile={office.section_dna.person_b} />
            </>
          ) : null}
        </div>
      </Section>

      {/* 스냅샷 */}
      <div className="rounded-xl border border-[#67b7ff]/25 bg-gradient-to-b from-[#67b7ff]/8 to-transparent p-4 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#67b7ff]/90">
          💼 오피스 파트너십 스냅샷
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm font-semibold tabular-nums">
          <span>🔥 업무적 핏 {snap.fit_pct}%</span>
          <span className="text-white/20">|</span>
          <span>🧩 협업 시너지 {snap.synergy_pct}%</span>
          <span className="text-white/20">|</span>
          <span>⚡ 오피스 리스크 {snap.risk_pct}%</span>
        </div>
        <p className="mt-3 text-sm font-medium text-[var(--space-text)]">
          📌 {snap.one_line_definition}
        </p>
        {report.meta?.grade ? (
          <p className="mt-2 text-[10px] text-[var(--space-text-muted)]">
            파트너십 등급 {report.meta.grade}
          </p>
        ) : null}
      </div>

      <TriScoreSnapshotPanel panel={panel} kind="work" />

      {/* [1] Mix fit */}
      {mixFit ? (
        <Section title="💻 [1] 두 사람의 일하는 캐릭터 & 믹스 핏">
          <p className="text-[11px] text-[var(--space-text-muted)]">
            <span className="font-medium text-[var(--space-text)]">
              [{nameA}의 일 스타일]
            </span>{" "}
            {workStyleA}
          </p>
          <p className="text-[11px] text-[var(--space-text-muted)]">
            <span className="font-medium text-[var(--space-text)]">
              [{nameB}의 일 스타일]
            </span>{" "}
            {workStyleB}
          </p>
          <p className="text-[11px] text-[var(--space-text-muted)]">
            <span className="font-medium text-[var(--space-text)]">
              [둘의 커뮤니케이션 핏]
            </span>{" "}
            {mixFit.communication_fit}
          </p>
        </Section>
      ) : null}

      {/* [2] Respect */}
      {respect ? (
        <Section title="🤝 [2] 평화를 지키는 '상호 존중' 가이드">
          <p className="text-[11px] text-[var(--space-text-muted)]">
            <span className="font-medium text-[var(--space-text)]">
              [{nameA}의 영역]
            </span>{" "}
            {boundaryA}
          </p>
          <p className="text-[11px] text-[var(--space-text-muted)]">
            <span className="font-medium text-[var(--space-text)]">
              [{nameB}의 영역]
            </span>{" "}
            {boundaryB}
          </p>
        </Section>
      ) : null}

      {/* [3] Roles */}
      {roles ? (
        <Section title="🎯 [3] 롤 분담 치트키 — 두 사람 각각 뭐 맡으면 좋을까">
          {roles.person_a && roles.person_b ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <RoleCard card={roles.person_a} />
              <RoleCard card={roles.person_b} />
            </div>
          ) : (
            <>
              <p className="text-[11px] font-medium text-[var(--space-text)]">
                [{nameA}가 맡으면 좋은 일]
              </p>
              <ul className="mb-3 list-inside list-disc text-[11px] text-[#67b7ff]/90">
                {(roles.my_weapons ?? []).map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
              {(roles.delegate_to_partner ?? []).length > 0 ? (
                <ul className="space-y-2">
                  {(roles.delegate_to_partner ?? []).map((d) => (
                    <li
                      key={`${d.delegate_to}-${d.task}`}
                      className="rounded-lg border border-[#67b7ff]/15 bg-[#67b7ff]/5 p-3 text-[11px]"
                    >
                      <span className="font-semibold text-[var(--space-text)]">
                        {d.task}
                      </span>
                      {" → "}
                      <span className="text-[#67b7ff]">{d.delegate_to}</span>
                      <p className="mt-1 text-[var(--space-text-muted)]">
                        {d.reason}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : null}
            </>
          )}
          {roles.synergy_one_liner ? (
            <p className="mt-3 text-[11px] italic text-[var(--space-text-muted)]">
              💬 {roles.synergy_one_liner}
            </p>
          ) : null}
        </Section>
      ) : null}

      {/* [3.5] Ideal roles */}
      {office?.section_ideal_roles ? (
        <Section title="🏢 [3.5] 이 사람이랑 잘 어울리는 직군·부서">
          <div className="grid gap-3 sm:grid-cols-2">
            <IdealRoleCard
              label="👤"
              fit={office.section_ideal_roles.person_a}
            />
            <IdealRoleCard
              label="👤"
              fit={office.section_ideal_roles.person_b}
            />
          </div>
          <p className="mt-3 text-[11px] italic text-[var(--space-text-muted)]">
            💬 {office.section_ideal_roles.together_combo}
          </p>
        </Section>
      ) : null}

      {/* [3.8] Upset guide */}
      {office?.section_upset ? (
        <Section title="😤 [3.8] 삐졌을 때 이렇게 대응하세요">
          <div className="grid gap-3 sm:grid-cols-2">
            <UpsetGuideCard guide={office.section_upset.person_a} />
            <UpsetGuideCard guide={office.section_upset.person_b} />
          </div>
        </Section>
      ) : null}

      {/* [4] Warning */}
      {office?.section_warning ? (
        <Section title="⚠️ [4] 오피스 워닝 & 싸움 해독제 카드">
          <p className="text-[11px] text-[var(--space-text-muted)]">
            <span className="font-medium text-[var(--space-text)]">
              [갈등 트리거]
            </span>{" "}
            {office.section_warning.conflict_trigger}
          </p>
          {deCard ? (
            <div className={`mt-3 rounded-lg border p-3 ${deClass}`}>
              <p className="text-xs font-bold">{deCard.hashtag}</p>
              <p className="mt-1 text-[11px] font-medium">{deCard.title}</p>
              <p className="mt-1 text-[11px] opacity-90">{deCard.detail}</p>
            </div>
          ) : null}
        </Section>
      ) : null}
    </div>
  );
}
