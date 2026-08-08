"use client";

/**
 * Work Colleague Premium — 카드 프리미티브 (DNA/역할/이상적 역할/속상함 가이드/디에스컬레이션).
 *
 * WorkColleagueReportView.tsx(en-US 레거시 경로)에서 이 파일로 그대로 이동한 것 —
 * JSX·로직 변경 없음. 동일한 컴포넌트를 components/relationship/workColleague/
 * sections/SectionRenderer.tsx(ko-KR ViewModel 경로, Phase 2/3)도 함께 사용한다.
 * 두 렌더러가 서로 다른 사본을 갖지 않도록 여기 한 곳에서만 정의한다.
 */
import type {
  OfficeDnaProfile,
  OfficeIdealRoleFit,
  OfficeUpsetGuide,
} from "@/lib/relationship/workColleague/officeLanguage";
import type { OfficePersonRoleCard } from "@/lib/relationship/workColleague/officeReportTemplate";
import type { WorkCompareRow } from "@/lib/relationship/workColleague/sajuCompareTable";
import { User } from "lucide-react";
import {
  RelationshipReportParagraph,
  RelationshipReportLabel,
  RelationshipReportInset,
} from "@/components/relationship/reportLayout";
import { useMessages } from "@/lib/i18n/LocaleProvider";

function PersonLabel({ name, accent }: { name: string; accent: string }) {
  return (
    <p className="flex items-center gap-1.5 text-sm font-bold text-white/92">
      <User className="h-3.5 w-3.5 shrink-0" style={{ color: accent }} strokeWidth={1.75} aria-hidden />
      {name}
    </p>
  );
}

export function DnaCard({
  profile,
  accent,
}: {
  profile: OfficeDnaProfile & {
    nickname: string;
    contribution_style_label?: string | null;
  };
  accent: string;
}) {
  const t = useMessages().relationshipDrilldown.work;
  return (
    <RelationshipReportInset>
      <PersonLabel name={profile.nickname} accent={accent} />
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
        {profile.contribution_style_label ? (
          <li>
            <RelationshipReportLabel>{t.contributionStyleLabel}</RelationshipReportLabel>
            <RelationshipReportParagraph className="mt-1.5">
              {profile.contribution_style_label}
            </RelationshipReportParagraph>
          </li>
        ) : null}
      </ul>
    </RelationshipReportInset>
  );
}

export function UpsetGuideCard({ guide }: { guide: OfficeUpsetGuide }) {
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

export function IdealRoleCard({
  fit,
  accent,
}: {
  fit: OfficeIdealRoleFit;
  accent: string;
}) {
  const t = useMessages().relationshipDrilldown.work;
  return (
    <RelationshipReportInset>
      <PersonLabel name={fit.nickname} accent={accent} />
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

export function RoleCard({ card, accent }: { card: OfficePersonRoleCard; accent: string }) {
  const t = useMessages().relationshipDrilldown.work;
  return (
    <RelationshipReportInset>
      <PersonLabel name={card.nickname} accent={accent} />
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

/**
 * 사주 기반 "한눈에 비교" 표 — 진짜 `<table>` (row/column). 카드형 UI가 서사에
 * 강하다면, 이 표는 스캔에 강해야 한다는 설계 원칙(제품 논의)에 따라 만들었다.
 * 데이터는 `buildWorkSajuCompareTable`(사주 신호 6종) — 11축 심리 설문과는
 * 별개 소스다.
 */
export function WorkCompareTableCard({
  rows,
  viewerIsReportA,
  accent,
  myName,
  partnerName,
}: {
  rows: WorkCompareRow[];
  viewerIsReportA: boolean;
  accent: string;
  myName: string;
  partnerName: string;
}) {
  const t = useMessages().relationshipDrilldown.work;
  if (!rows.length) return null;

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10">
      <table className="w-full min-w-[520px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.04]">
            <th className="px-4 py-3 font-semibold text-white/55">&nbsp;</th>
            <th className="px-4 py-3 font-semibold text-white/80">
              {myName}
            </th>
            <th className="px-4 py-3 font-semibold text-white/80">
              {partnerName}
            </th>
            <th className="px-4 py-3 font-semibold text-white/55">
              {t.compareTableColMeaning}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const me = viewerIsReportA ? row.personA : row.personB;
            const partner = viewerIsReportA ? row.personB : row.personA;
            return (
              <tr
                key={row.id}
                className={i % 2 === 0 ? "bg-white/[0.015]" : undefined}
              >
                <td className="border-t border-white/8 px-4 py-3 align-top font-medium text-white/70">
                  {row.label}
                </td>
                <td
                  className="border-t border-white/8 px-4 py-3 align-top font-semibold"
                  style={{ color: accent }}
                >
                  {me.shortLabel}
                </td>
                <td className="border-t border-white/8 px-4 py-3 align-top font-semibold text-white/85">
                  {partner.shortLabel}
                </td>
                <td className="border-t border-white/8 px-4 py-3 align-top text-white/72">
                  {row.meaning}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function DeEscalationBlock({
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
