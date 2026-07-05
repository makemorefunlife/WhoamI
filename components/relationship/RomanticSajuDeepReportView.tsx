"use client";

import type { ReactNode } from "react";
import { polishRomanticDisplayText, stripComparisonCellSubject } from "@/lib/relationship/romanticEverydayText";
import {
  buildRomanticScreenPlanFromStored,
  getScreen1Opening,
  type RomanticScreenSlot,
  type StoredRankedInsight,
} from "@/lib/relationship/romanticHeadline/screenMap";
import type {
  AdviceItem,
  DialogueTableRow,
  RomanticSajuDeepReport,
} from "@/lib/prompts/relationshipPremium/romanticSajuDeep/outputSchema";
import { resolveSnapshotPanelFromReport } from "@/lib/relationship/romanticSnapshot/buildRomanticSnapshot";
import RomanticSnapshotPanelView from "@/components/relationship/RomanticSnapshotPanel";

const COMPARISON_ASPECTS = [
  "감정 표현",
  "갈등 반응",
  "애정 언어",
  "스트레스 패턴",
  "의사결정",
  "소통 방식",
] as const;

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <h3 className="mb-3 text-sm font-semibold text-[#ffd6a5]">{title}</h3>
      <div className="space-y-2 text-sm leading-relaxed text-[var(--space-text)]">
        {children}
      </div>
    </section>
  );
}

function P({ children }: { children: ReactNode }) {
  const text =
    typeof children === "string"
      ? polishRomanticDisplayText(children)
      : children;
  return (
    <p className="whitespace-pre-wrap text-[var(--space-text-muted)]">{text}</p>
  );
}

function formatAdvice(item: AdviceItem): {
  title: string;
  detail: string;
  phrase?: string;
} {
  if (typeof item === "string") {
    return { title: item, detail: "", phrase: undefined };
  }
  return {
    title: item.title?.trim() ?? "",
    detail: item.detail?.trim() ?? "",
    phrase: item.phrase_example?.trim(),
  };
}

function isRedundantInsightHook(slot: RomanticScreenSlot): boolean {
  if (slot.insightId === "metaphor_combo") return true;
  if (slot.resolvedFrom === "fallback" && slot.key === "nature") {
    const body = polishRomanticDisplayText(slot.body);
    if (
      body.includes("서로 다른 리듬을 채워요") ||
      /같은\s+.+\s+같은/.test(body)
    ) {
      return true;
    }
  }
  const body = polishRomanticDisplayText(slot.body);
  const headline = polishRomanticDisplayText(slot.headline);
  if (body.includes("서로 다른 리듬을 채워요")) return true;
  if (/같은\s+.+\s+같은/.test(body)) return true;
  if (body.includes("바람막이가 되어") || body.includes("서로를 밝히고")) {
    return true;
  }
  if (/^\d+\.\s/.test(body.trim()) && body.split(/\d+\.\s/).length > 2) {
    const parts = body.split(/\d+\.\s/).filter(Boolean).map((s) => s.trim());
    if (parts.length >= 2 && parts.every((p) => p === parts[0])) return true;
  }
  if (slot.key === "conflict" || slot.key === "action") return true;
  return false;
}

function InsightHook({ slot }: { slot: RomanticScreenSlot | undefined }) {
  if (!slot?.body || isRedundantInsightHook(slot)) return null;
  return (
    <div className="mb-3 rounded-lg border border-[#ffd6a5]/15 bg-[#ffd6a5]/5 px-3 py-2">
      <p className="text-xs font-medium text-[#ffd6a5]/90">
        {polishRomanticDisplayText(slot.headline)}
      </p>
      <P>{slot.body}</P>
    </div>
  );
}

function resolveScreenPlan(
  report: RomanticSajuDeepReport["report"],
): RomanticScreenSlot[] | null {
  const meta = report.meta as
    | {
        screen_plan?: RomanticScreenSlot[];
        ranked_insights?: StoredRankedInsight[];
      }
    | undefined;

  if (meta?.screen_plan?.length) return meta.screen_plan;

  return buildRomanticScreenPlanFromStored({
    ranked_insights: meta?.ranked_insights,
    section1: report.section_1_summary,
  });
}

function mergeComparisonTable(
  rows: Array<{ aspect: string; a: string; b: string }>,
  nameA: string,
  nameB: string,
): Array<{ aspect: string; a: string; b: string }> {
  const byAspect = new Map(rows.map((r) => [r.aspect, r]));
  const merged = COMPARISON_ASPECTS.map((aspect) => {
    const hit = byAspect.get(aspect);
    if (!hit) return { aspect, a: "—", b: "—" };
    return {
      aspect,
      a: stripComparisonCellSubject(hit.a, nameA),
      b: stripComparisonCellSubject(hit.b, nameB),
    };
  });
  for (const row of rows) {
    if (!COMPARISON_ASPECTS.includes(row.aspect as (typeof COMPARISON_ASPECTS)[number])) {
      merged.push({
        aspect: row.aspect,
        a: stripComparisonCellSubject(row.a, nameA),
        b: stripComparisonCellSubject(row.b, nameB),
      });
    }
  }
  return merged;
}

function screenByKey(
  plan: RomanticScreenSlot[] | null,
  key: RomanticScreenSlot["key"],
): RomanticScreenSlot | undefined {
  return plan?.find((s) => s.key === key);
}

function eventScoreHint(
  meta: RomanticSajuDeepReport["report"]["meta"] | undefined,
): string | null {
  const scores = meta?.event_scores as
    | {
        overall?: { activation: number; benefit: number; risk: number };
      }
    | undefined;
  if (!scores?.overall) return null;
  const { activation, benefit, risk } = scores.overall;
  return `🔥 호감 ${activation} · 🧩 케미 ${benefit} · ⚡ 예민 ${risk}`;
}

function ruleScreenTitle(
  meta: RomanticSajuDeepReport["report"]["meta"] | undefined,
  key: string,
  fallback: string,
): string {
  const plan = meta?.rule_screen_plan as
    | Array<{ key: string; title: string }>
    | undefined;
  return plan?.find((s) => s.key === key)?.title ?? fallback;
}

function filterDialogueTable(
  rows: DialogueTableRow[],
): DialogueTableRow[] {
  return rows.filter((row) => {
    const label = String(row.label ?? row.speaker ?? "").trim();
    if (!label) return true;
    if (label === "결과" || label.startsWith("결과")) return false;
    return true;
  });
}

export default function RomanticSajuDeepReportView({
  report,
  nameA,
  nameB,
}: {
  report: RomanticSajuDeepReport["report"];
  nameA: string;
  nameB: string;
}) {
  const s1 = report.section_1_summary;
  const s2 = report.section_2_nature;
  const special = report.section_4_special_bond;
  const s3 = report.section_3_conversation_patterns as Record<
    string,
    Record<string, unknown>
  >;
  const s4 = report.section_4_hidden_hearts as Record<string, unknown>;
  const s5 = report.section_5_action as Record<string, unknown>;
  const s6 = report.section_6_timeline as Record<string, Record<string, string>>;

  const conflict = s3?.conflict_situation;
  const comparisonTable = mergeComparisonTable(s2.comparison_table ?? [], nameA, nameB);
  const dialogueTable = filterDialogueTable(
    (conflict?.dialogue_table ?? []) as DialogueTableRow[],
  );

  const adviceA = (s5.advice_for_a as AdviceItem[] | undefined) ?? [];
  const adviceB = (s5.advice_for_b as AdviceItem[] | undefined) ?? [];

  const screenPlan = resolveScreenPlan(report);
  const opening = getScreen1Opening(screenPlan, s1);
  const snapshotPanel = resolveSnapshotPanelFromReport(report.meta);

  return (
    <div className="space-y-4">
      <Section title="💞 관계 요약">
        <p className="text-base font-medium text-[var(--space-text)]">
          {polishRomanticDisplayText(opening.headline)}
        </p>
        <P>{opening.body}</P>
        <p className="inline-flex rounded-full border border-[#ffd6a5]/30 bg-[#ffd6a5]/10 px-3 py-1 text-xs font-medium text-[#ffd6a5]">
          궁합 등급 {opening.grade}
        </p>
        {eventScoreHint(report.meta) ? (
          <p className="mt-2 text-xs leading-relaxed text-[var(--space-text-muted)]">
            {eventScoreHint(report.meta)}
          </p>
        ) : null}
      </Section>

      {snapshotPanel ? (
        <Section title="📊 관계 스냅샷">
          <RomanticSnapshotPanelView panel={snapshotPanel} />
        </Section>
      ) : null}

      <Section
        title={`🔍 ${ruleScreenTitle(report.meta, "compare", "서로 비교")}`}
      >
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full min-w-[280px] text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-[var(--space-text-muted)]">
                <th className="px-2 py-2 font-medium">항목</th>
                <th className="px-2 py-2 font-medium">{nameA}</th>
                <th className="px-2 py-2 font-medium">{nameB}</th>
              </tr>
            </thead>
            <tbody>
              {comparisonTable.map((row) => (
                <tr
                  key={row.aspect}
                  className="border-b border-white/5 last:border-0"
                >
                  <td className="px-2 py-2 font-medium text-[var(--space-text)]">
                    {row.aspect}
                  </td>
                  <td className="px-2 py-2 text-[var(--space-text-muted)]">
                    {row.a}
                  </td>
                  <td className="px-2 py-2 text-[var(--space-text-muted)]">
                    {row.b}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="📝 서로의 성향">
        <p className="mt-3 font-medium text-[var(--space-text)]">{nameA}</p>
        {s2.a_nature.image_metaphor ? (
          <p className="text-xs text-[#ffd6a5]/85">{s2.a_nature.image_metaphor}</p>
        ) : null}
        {s2.a_nature.first_person_voice ? (
          <blockquote className="rounded-lg border border-[#67b7ff]/20 bg-[#67b7ff]/8 p-3 text-sm italic text-[var(--space-text)]">
            {s2.a_nature.first_person_voice}
          </blockquote>
        ) : null}
        <P>{s2.a_nature.description}</P>
        <P>{s2.a_nature.meeting_b}</P>
        <P>{s2.a_nature.together_change}</P>

        <p className="mt-3 font-medium text-[var(--space-text)]">{nameB}</p>
        {s2.b_nature.image_metaphor ? (
          <p className="text-xs text-[#ffd6a5]/85">{s2.b_nature.image_metaphor}</p>
        ) : null}
        {s2.b_nature.first_person_voice ? (
          <blockquote className="rounded-lg border border-[#67b7ff]/20 bg-[#67b7ff]/8 p-3 text-sm italic text-[var(--space-text)]">
            {s2.b_nature.first_person_voice}
          </blockquote>
        ) : null}
        <P>{s2.b_nature.description}</P>
        <P>{s2.b_nature.meeting_a}</P>
        <P>{s2.b_nature.together_change}</P>
      </Section>

      {special ? (
        <Section title="⚖️ 이 관계가 특별한 이유">
          <InsightHook slot={screenByKey(screenPlan, "bond")} />
          {special.a_gives_b ? (
            <>
              <p className="text-xs font-medium text-[var(--space-text)]">
                ✨ {nameA} → {nameB}
              </p>
              <P>{special.a_gives_b}</P>
            </>
          ) : null}
          {special.b_gives_a ? (
            <>
              <p className="text-xs font-medium text-[var(--space-text)]">
                ✨ {nameB} → {nameA}
              </p>
              <P>{special.b_gives_a}</P>
            </>
          ) : null}
          {special.power_to_each_other && !special.a_gives_b ? (
            <P>{special.power_to_each_other}</P>
          ) : null}
          <P>{special.only_together}</P>
          <p className="font-medium text-[#ffd6a5]/90">
            {special.relationship_formula}
          </p>
          <P>{special.why_special}</P>
        </Section>
      ) : null}

      <Section title="🌙 서로의 숨은 마음">
        <InsightHook slot={screenByKey(screenPlan, "hidden")} />
        <p className="text-xs font-medium text-[var(--space-text)]">{nameA}</p>
        <P>{String((s4.a_hidden as { voice?: string })?.voice ?? "")}</P>
        <p className="text-xs font-medium text-[var(--space-text)]">{nameB}</p>
        <P>{String((s4.b_hidden as { voice?: string })?.voice ?? "")}</P>
        <P>{String(s4.mutual_gift ?? "")}</P>
      </Section>

      {conflict && dialogueTable.length > 0 ? (
        <Section title={`💬 ${String(conflict.title ?? "갈등 패턴")}`}>
          <div className="overflow-x-auto rounded-lg border border-white/10">
            <table className="w-full min-w-[300px] text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-[var(--space-text-muted)]">
                  <th className="px-2 py-2">구분</th>
                  <th className="px-2 py-2">❌ 자주 하던 말</th>
                  <th className="px-2 py-2">✅ 이렇게 바꿔보면</th>
                </tr>
              </thead>
              <tbody>
                {dialogueTable.map((row, i) => (
                  <tr
                    key={`${row.label}-${i}`}
                    className="border-b border-white/5 last:border-0"
                  >
                    <td className="px-2 py-2 text-[var(--space-text)]">
                      {row.label ?? row.speaker}
                      {row.emoji ? ` ${row.emoji}` : ""}
                    </td>
                    <td className="px-2 py-2 text-red-200/80">
                      {row.bad_line}
                    </td>
                    <td className="px-2 py-2 text-emerald-200/80">
                      {row.good_line}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      ) : null}

      <Section title="🌱 서로에게 도움이 되는 행동들">
        {adviceA.length > 0 ? (
          <p className="text-xs font-medium text-[var(--space-text)]">
            {nameA}께
          </p>
        ) : null}
        {adviceA.map((line, i) => {
          const item = formatAdvice(line);
          return (
            <div
              key={`a-${i}`}
              className="space-y-1 border-b border-white/5 pb-2 last:border-0"
            >
              <p className="text-[var(--space-text)]">
                {i + 1}. {item.title}
              </p>
              {item.detail ? <P>{item.detail}</P> : null}
              {item.phrase ? (
                <p className="text-xs italic text-[#9ec8ff]">{item.phrase}</p>
              ) : null}
            </div>
          );
        })}
        {adviceB.length > 0 ? (
          <p className="mt-2 text-xs font-medium text-[var(--space-text)]">
            {nameB}께
          </p>
        ) : null}
        {adviceB.map((line, i) => {
          const item = formatAdvice(line);
          return (
            <div
              key={`b-${i}`}
              className="space-y-1 border-b border-white/5 pb-2 last:border-0"
            >
              <p className="text-[var(--space-text)]">
                {i + 1}. {item.title}
              </p>
              {item.detail ? <P>{item.detail}</P> : null}
              {item.phrase ? (
                <p className="text-xs italic text-[#9ec8ff]">{item.phrase}</p>
              ) : null}
            </div>
          );
        })}
        <P>{String(s5.together ?? "")}</P>
        {s5.together_starter ? (
          <p className="text-xs italic text-[#9ec8ff]">
            {String(s5.together_starter)}
          </p>
        ) : null}
        <p className="italic text-[#ffd6a5]/90">{String(s5.promise ?? "")}</p>
      </Section>

      <Section title="⏰ 시간이 지나면 이렇게 달라져요">
        {Object.entries(s6 ?? {}).map(([key, block]) => (
          <div
            key={key}
            className="border-t border-white/5 pt-2 first:border-0 first:pt-0"
          >
            <p className="text-xs font-medium text-[var(--space-text)]">
              {block.period}
            </p>
            <P>
              {block.description ??
                block.change ??
                block.growth ??
                block.vision ??
                block.advice ??
                ""}
            </P>
            {block.focus || block.prepare || block.goal || block.memory ? (
              <P>
                {block.focus ?? block.prepare ?? block.goal ?? block.memory}
              </P>
            ) : null}
          </div>
        ))}
      </Section>
    </div>
  );
}
