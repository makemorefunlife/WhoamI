"use client";

import type { WorkColleagueReportBody } from "@/lib/relationship/workColleague/buildWorkColleagueReport";
import type {
  OfficeDnaProfile,
  OfficeIdealRoleFit,
  OfficeUpsetGuide,
} from "@/lib/relationship/workColleague/officeLanguage";
import type { OfficePersonRoleCard } from "@/lib/relationship/workColleague/officeReportTemplate";
import { hydrateWorkSnapshotPanel } from "@/lib/relationship/workColleague/buildWorkSnapshotPanel";
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

function DnaCard({
  label,
  profile,
  accent,
}: {
  label: string;
  profile: OfficeDnaProfile & { nickname: string };
  accent: string;
}) {
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
          <RelationshipReportLabel>🌌 추구하는 일 스타일</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1.5">
            {profile.work_style}
          </RelationshipReportParagraph>
        </li>
        <li>
          <RelationshipReportLabel>🪵 내면의 행동 기준</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1.5">
            {profile.inner_standard}
          </RelationshipReportParagraph>
        </li>
        <li>
          <RelationshipReportLabel>🔮 오피스 캐릭터</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1.5">
            {profile.overall_character}
          </RelationshipReportParagraph>
        </li>
      </ul>
    </RelationshipReportInset>
  );
}

function UpsetGuideCard({ guide }: { guide: OfficeUpsetGuide }) {
  return (
    <RelationshipReportInset>
      <p className="text-sm font-bold text-white/92">
        {guide.nickname}가 삐졌을 때
      </p>
      <div className="mt-4 space-y-3">
        <div>
          <RelationshipReportLabel>신호</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1.5">
            {guide.upset_signals}
          </RelationshipReportParagraph>
        </div>
        <div>
          <RelationshipReportLabel className="text-emerald-200/90">
            이렇게 해보세요
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

function IdealRoleCard({
  label,
  fit,
  accent,
}: {
  label: string;
  fit: OfficeIdealRoleFit;
  accent: string;
}) {
  return (
    <RelationshipReportInset>
      <p className="text-sm font-bold text-white/92">
        {label} {fit.nickname}
      </p>
      <RelationshipReportParagraph className="mt-3">{fit.why}</RelationshipReportParagraph>
      <div className="mt-4">
        <RelationshipReportLabel>잘 맞는 직군</RelationshipReportLabel>
        <ul className="mt-2 list-inside list-disc space-y-1" style={{ color: accent }}>
          {fit.ideal_roles.map((role) => (
            <li key={role} className="text-[15px] leading-relaxed">
              {role}
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-4">
        <RelationshipReportLabel>잘 맞는 부서·팀</RelationshipReportLabel>
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
  return (
    <RelationshipReportInset>
      <p className="text-sm font-bold text-white/92">👤 {card.nickname}</p>
      <div className="mt-4">
        <RelationshipReportLabel>
          {card.nickname}가 맡으면 좋은 일
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
            {card.nickname} → 파트너에게 넘기면 좋은 일
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
          파트너에게 넘기는 게 유리한 영역은 뚜렷하지 않아요. 각자 강점 쪽에
          집중하면 됩니다.
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
}: {
  report: WorkColleagueReportBody;
}) {
  const theme = getTabTheme("work");
  const panel = hydrateWorkSnapshotPanel(report.snapshot_panel);
  const office = report.office;
  const snap = office?.section_snapshot ?? {
    fit_pct: report.meta?.fit_pct ?? 0,
    synergy_pct: report.meta?.synergy_pct ?? 0,
    risk_pct: report.meta?.risk_pct ?? 0,
    one_line_definition: report.one_line_definition ?? report.headline,
  };

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

  const deCard = office?.section_warning?.de_escalation;

  return (
    <RelationshipReportLayout
      kind="work"
      kindLabel="Premium · 오피스 파트너십"
      headline={{
        title: report.headline || snap.one_line_definition,
        subtitle: snap.one_line_definition,
        names: [nameA, nameB],
        badge: report.meta?.grade
          ? `파트너십 등급 ${report.meta.grade}`
          : undefined,
      }}
      scores={[
        { emoji: "🔥", label: "업무적 핏", value: snap.fit_pct, tone: "warm" },
        {
          emoji: "🧩",
          label: "협업 시너지",
          value: snap.synergy_pct,
          tone: "cool",
        },
        {
          emoji: "⚡",
          label: "오피스 리스크",
          value: snap.risk_pct,
          tone: "alert",
        },
      ]}
      scoreFooter={<TriScoreSnapshotPanel panel={panel} kind="work" />}
    >
      {office?.section_dna ? (
        <RelationshipReportCard
          title="🧬 파트너십 DNA — 우린 일할 때 어떤 사람일까?"
          accentColor={theme.accent}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <DnaCard
              label="👤"
              profile={office.section_dna.person_a}
              accent={theme.accent}
            />
            <DnaCard
              label="👤"
              profile={office.section_dna.person_b}
              accent={theme.accent}
            />
          </div>
        </RelationshipReportCard>
      ) : null}

      {mixFit ? (
        <RelationshipReportCard
          title="💻 두 사람의 일하는 캐릭터 & 믹스 핏"
          accentColor={theme.accent}
        >
          <RelationshipReportBody>
            <div>
              <RelationshipReportLabel>[{nameA}의 일 스타일]</RelationshipReportLabel>
              <RelationshipReportParagraph className="mt-1.5">
                {workStyleA}
              </RelationshipReportParagraph>
            </div>
            <div>
              <RelationshipReportLabel>[{nameB}의 일 스타일]</RelationshipReportLabel>
              <RelationshipReportParagraph className="mt-1.5">
                {workStyleB}
              </RelationshipReportParagraph>
            </div>
            <div>
              <RelationshipReportLabel>[둘의 커뮤니케이션 핏]</RelationshipReportLabel>
              <RelationshipReportParagraph className="mt-1.5">
                {mixFit.communication_fit}
              </RelationshipReportParagraph>
            </div>
          </RelationshipReportBody>
        </RelationshipReportCard>
      ) : null}

      {respect ? (
        <RelationshipReportCard
          title="🤝 평화를 지키는 상호 존중 가이드"
          accentColor={theme.accent}
        >
          <RelationshipReportBody>
            <div>
              <RelationshipReportLabel>[{nameA}의 영역]</RelationshipReportLabel>
              <RelationshipReportParagraph className="mt-1.5">
                {boundaryA}
              </RelationshipReportParagraph>
            </div>
            <div>
              <RelationshipReportLabel>[{nameB}의 영역]</RelationshipReportLabel>
              <RelationshipReportParagraph className="mt-1.5">
                {boundaryB}
              </RelationshipReportParagraph>
            </div>
          </RelationshipReportBody>
        </RelationshipReportCard>
      ) : null}

      {roles ? (
        <RelationshipReportCard
          title="🎯 롤 분담 치트키"
          accentColor={theme.accent}
        >
          {roles.person_a && roles.person_b ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <RoleCard card={roles.person_a} accent={theme.accent} />
              <RoleCard card={roles.person_b} accent={theme.accent} />
            </div>
          ) : (
            <RelationshipReportBody>
              <RelationshipReportLabel>
                [{nameA}가 맡으면 좋은 일]
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

      {office?.section_ideal_roles ? (
        <RelationshipReportCard
          title="🏢 잘 어울리는 직군·부서"
          accentColor={theme.accent}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <IdealRoleCard
              label="👤"
              fit={office.section_ideal_roles.person_a}
              accent={theme.accent}
            />
            <IdealRoleCard
              label="👤"
              fit={office.section_ideal_roles.person_b}
              accent={theme.accent}
            />
          </div>
          <RelationshipReportParagraph className="mt-4 italic">
            💬 {office.section_ideal_roles.together_combo}
          </RelationshipReportParagraph>
        </RelationshipReportCard>
      ) : null}

      {office?.section_upset ? (
        <RelationshipReportCard
          title="😤 삐졌을 때 이렇게 대응하세요"
          accentColor={theme.accent}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <UpsetGuideCard guide={office.section_upset.person_a} />
            <UpsetGuideCard guide={office.section_upset.person_b} />
          </div>
        </RelationshipReportCard>
      ) : null}

      {office?.section_warning ? (
        <RelationshipReportCard
          title="⚠️ 오피스 워닝 & 싸움 해독제"
          accentColor={theme.accent}
          variant="warning"
        >
          <RelationshipReportBody>
            <div>
              <RelationshipReportLabel>갈등 트리거</RelationshipReportLabel>
              <RelationshipReportParagraph className="mt-1.5">
                {office.section_warning.conflict_trigger}
              </RelationshipReportParagraph>
            </div>
            {deCard ? <DeEscalationBlock deCard={deCard} /> : null}
          </RelationshipReportBody>
        </RelationshipReportCard>
      ) : null}
    </RelationshipReportLayout>
  );
}
