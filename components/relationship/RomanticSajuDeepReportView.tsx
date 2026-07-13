"use client";

import { useCallback, useMemo, type ReactNode } from "react";
import {
  filterShareSummaryKeywords,
  isGenericRomanticActionPhrase,
  isShareSummaryRelationshipNameExcluded,
  polishConflictDialogueLine,
  polishRomanticDisplayText,
  stripComparisonCellSubject,
} from "@/lib/relationship/romanticEverydayText";
import { buildRomanticTimelineBlocks, type TimelineBlock } from "@/lib/relationship/romanticTimeline";
import { romanticHeadlineViewerFirst } from "@/lib/relationship/dayStemRomanticProfile";
import type { SajuChartProvenance } from "@/lib/saju/loadSajuBundleFromReport";
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
import { pickViewerFirstPair } from "@/lib/relationship/viewerFirstDisplay";
import RomanticSnapshotPanelView from "@/components/relationship/RomanticSnapshotPanel";
import {
  RelationshipReportLayout,
  RelationshipReportCard,
  RelationshipReportBody,
  RelationshipReportParagraph,
  RelationshipReportLabel,
  RelationshipReportInset,
  ChemistryBreakdown,
  PsychMatchRadarChart,
  ShareSummaryCard,
  StrengthWeaknessCard,
  EssenceActionGuidelineList,
  getStitchTabTheme,
  getTabTheme,
  useReportTone,
  type ScoreMetric,
} from "@/components/relationship/reportLayout";
import {
  buildChemistryApproxScores,
  buildStrengthWeaknessLists,
} from "@/lib/relationship/psychMatch";
import { buildRomanticDisplayContext } from "@/lib/relationship/romanticReportViewModel";
import {
  dedupeActionGuidelines,
  normalizeActionGuideline,
} from "@/lib/relationship/essenceActionGuideline";
import {
  shouldShowBondFormula,
  shouldShowWhySpecial,
  isGenericBondParagraph,
} from "@/lib/relationship/romanticBondDisplay";

const COMPARISON_ASPECTS = [
  "감정 표현",
  "갈등 반응",
  "애정 언어",
  "스트레스 패턴",
  "의사결정",
  "소통 방식",
] as const;

type NatureBlock = {
  description?: string;
  first_person_voice?: string;
  meeting_a?: string;
  meeting_b?: string;
  together_change?: string;
  image_metaphor?: string;
};

const GENERIC_ACTION_DETAILS = new Set([
  "갈등 직후 바로 결론 내리지 말고, 감정 라벨링 후 20분 쉬어가요.",
  "설문에서 나온 행동 팁을 갈등 전에 미리 써 보세요.",
  "거리가 생겼을 때 먼저 연결 신호(짧은 메시지·안부)를 보내세요.",
]);

function hasActionGuidelineContent(items?: AdviceItem[]): boolean {
  return (items ?? []).some((line) =>
    Boolean(normalizeActionGuideline(line, { target_user: "" })),
  );
}

function pickPersonHiddenInsight(
  ranked:
    | Array<{ id: string; headline: string; body: string; screenHint?: string }>
    | undefined,
  reportSlot: "a" | "b",
): { headline: string; body: string } | null {
  if (!ranked?.length) return null;
  const hit = ranked.find(
    (row) =>
      row.screenHint === "hidden" && row.id.startsWith(`person_${reportSlot}_`),
  );
  if (!hit?.body?.trim()) return null;
  return { headline: hit.headline, body: hit.body };
}

function resolveHiddenVoice(
  hidden: { voice?: string; need?: string; reason?: string },
  insightBody?: string,
): string {
  const voice = hidden.voice?.trim();
  if (voice && voice.length >= 20) return voice;
  const parts = [hidden.need, hidden.reason, insightBody]
    .map((p) => p?.trim())
    .filter(Boolean);
  return parts.join(" ");
}

type HiddenHeartBlock = {
  voice?: string;
  need?: string;
  reason?: string;
};

function formatHiddenHeartDisplay(
  hidden: HiddenHeartBlock,
  insightBody: string | undefined,
  polish: (text: string) => string,
): { hook: string; body: string } {
  const need = hidden.need?.trim() ?? "";
  const voice = hidden.voice?.trim() ?? "";
  const reason = hidden.reason?.trim() ?? "";
  const hook = need ? polish(need) : "";

  let body = "";
  if (voice.length >= 20) {
    body = polish(voice);
  } else {
    body = polish(
      [voice, reason, insightBody].filter(Boolean).join(" "),
    );
  }

  if (hook && body.startsWith(hook)) {
    body = body.slice(hook.length).trim();
  }

  return { hook, body };
}

function HiddenHeartPanel({
  name,
  hidden,
  insightBody,
  polish,
}: {
  name: string;
  hidden: HiddenHeartBlock;
  insightBody?: string;
  polish: (text: string) => string;
}) {
  const { hook, body } = formatHiddenHeartDisplay(hidden, insightBody, polish);
  if (!hook && !body) return null;

  return (
    <div className="space-y-2">
      <RelationshipReportLabel>🌙 {name}의 숨은 마음</RelationshipReportLabel>
      {hook ? (
        <p className="text-sm font-medium leading-relaxed text-on-surface">
          {hook}
        </p>
      ) : null}
      {body ? (
        <RelationshipReportParagraph>{body}</RelationshipReportParagraph>
      ) : null}
    </div>
  );
}

function pickBestNatureParagraph(
  nature: NatureBlock | undefined,
  meetingHint?: string,
): string {
  const candidates = [
    nature?.description,
    nature?.first_person_voice,
    meetingHint,
    nature?.together_change,
  ]
    .map((c) => (c ? polishRomanticDisplayText(String(c)) : ""))
    .filter((c) => c.length >= 12);

  if (candidates.length === 0) return "";

  const seen = new Set<string>();
  const unique: string[] = [];
  for (const c of candidates) {
    const key = c.slice(0, 48);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(c);
    }
  }
  return unique.sort((a, b) => b.length - a.length)[0] ?? "";
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
  if (slot.key === "bond" && isGenericBondParagraph(body)) return true;
  if (!headline && !body) return true;
  return false;
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

function buildViewerComparisonTable(
  rows: Array<{ aspect: string; a: string; b: string }>,
  opts: {
    myName: string;
    partnerName: string;
    viewerIsReportA: boolean;
    polish: (text: string) => string;
  },
): Array<{ aspect: string; a: string; b: string }> {
  const { myName, partnerName, viewerIsReportA, polish } = opts;
  const byAspect = new Map(rows.map((r) => [r.aspect, r]));

  const formatRow = (
    aspect: string,
    hit?: { a: string; b: string },
  ): { aspect: string; a: string; b: string } => {
    if (!hit) return { aspect, a: "—", b: "—" };
    const meRaw = viewerIsReportA ? hit.a : hit.b;
    const partnerRaw = viewerIsReportA ? hit.b : hit.a;
    return {
      aspect,
      a: polish(
        stripComparisonCellSubject(meRaw, myName, partnerName),
      ),
      b: polish(
        stripComparisonCellSubject(partnerRaw, partnerName, myName),
      ),
    };
  };

  const merged = COMPARISON_ASPECTS.map((aspect) =>
    formatRow(aspect, byAspect.get(aspect)),
  );

  for (const row of rows) {
    if (
      !COMPARISON_ASPECTS.includes(
        row.aspect as (typeof COMPARISON_ASPECTS)[number],
      )
    ) {
      merged.push(formatRow(row.aspect, row));
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

function extractRomanticScores(
  meta: RomanticSajuDeepReport["report"]["meta"] | undefined,
): ScoreMetric[] {
  const scores = meta?.event_scores as
    | {
        overall?: { activation: number; benefit: number; risk: number };
      }
    | undefined;
  if (!scores?.overall) return [];
  const { activation, benefit, risk } = scores.overall;
  return [
    {
      emoji: "🔥",
      label: "호감",
      value: activation,
      polarity: "higher_better",
    },
    {
      emoji: "🧩",
      label: "케미",
      value: benefit,
      polarity: "higher_better",
    },
    {
      emoji: "⚡",
      label: "예민",
      value: risk,
      polarity: "higher_worse",
    },
  ];
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

function filterDialogueTable(rows: DialogueTableRow[]): DialogueTableRow[] {
  return rows.filter((row) => {
    const label = String(row.label ?? row.speaker ?? "").trim();
    if (!label) return true;
    if (label === "결과" || label.startsWith("결과")) return false;
    return true;
  });
}

type ActionRuleFallback = {
  goodPhrases?: string[];
  avoidPhrases?: string[];
  recoveryTip?: string;
  togetherStarter?: string;
};

type ActionSection = {
  advice_for_a?: AdviceItem[];
  advice_for_b?: AdviceItem[];
  together?: string;
  together_starter?: string;
  promise?: string;
};

function resolveActionSection(
  llm: ActionSection,
  meta: RomanticSajuDeepReport["report"]["meta"] | undefined,
): ActionSection {
  const plan = meta?.rule_screen_plan as
    | Array<{ key: string; output?: ActionRuleFallback }>
    | undefined;
  const action = plan?.find((slot) => slot.key === "action")?.output;

  const buildFallback = (): ActionSection => {
    if (!action?.goodPhrases?.length) return llm;
    const phrases = action.goodPhrases;
    const recovery = action.recoveryTip?.trim() ?? "";
    const contextualReason = (index: number) => {
      if (recovery && !GENERIC_ACTION_DETAILS.has(recovery) && index === 0) {
        return recovery;
      }
      return "";
    };
    const fallbackTitles = [
      "감정이 올라올 때 한 박자 쉬기",
      "상대 마음을 먼저 확인하기",
      "함께 회복하는 말하기",
    ] as const;
    const fallbackTitlesB = [
      "급하게 결론 내리지 않기",
      "표현 방식 차이 인정하기",
      "작은 신호로 연결하기",
    ] as const;

    const toGuideline = (
      phrase: string,
      index: number,
      target: string,
      titles: readonly string[],
    ) => ({
      relationship_kind: "연인",
      target_user: target,
      action_title: titles[index] ?? "실천 팁",
      saju_reason: contextualReason(index),
      real_speech_tip: phrase,
      real_life_example: "",
    });

    return {
      advice_for_a: phrases
        .slice(0, 3)
        .map((phrase, index) => toGuideline(phrase, index, "A", fallbackTitles)),
      advice_for_b: phrases
        .slice(0, 3)
        .map((phrase, index) =>
          toGuideline(phrase, index, "B", fallbackTitlesB),
        ),
      together:
        recovery && !GENERIC_ACTION_DETAILS.has(recovery) ? recovery : "",
      together_starter: action.togetherStarter,
      promise: phrases[0],
    };
  };

  if (
    !hasActionGuidelineContent(llm.advice_for_a) &&
    !hasActionGuidelineContent(llm.advice_for_b)
  ) {
    const fallback = buildFallback();
    if (
      hasActionGuidelineContent(fallback.advice_for_a) ||
      hasActionGuidelineContent(fallback.advice_for_b)
    ) {
      return fallback;
    }
    return llm;
  }

  if (!action?.goodPhrases?.length) return llm;

  const fallback = buildFallback();
  return {
    ...llm,
    advice_for_a: hasActionGuidelineContent(llm.advice_for_a)
      ? llm.advice_for_a
      : fallback.advice_for_a,
    advice_for_b: hasActionGuidelineContent(llm.advice_for_b)
      ? llm.advice_for_b
      : fallback.advice_for_b,
  };
}

function resolveTimelineSection(
  llm: Record<string, Record<string, string>>,
  meta: RomanticSajuDeepReport["report"]["meta"] | undefined,
  polish: (text: string) => string,
): TimelineBlock[] {
  const flow = meta?.romantic_fortune_flow as
    | {
        daewoon?: {
          current_year?: number;
          interaction_note?: string;
        };
      }
    | undefined;

  return buildRomanticTimelineBlocks({
    llm,
    metaYear: flow?.daewoon?.current_year,
    fortuneNote: flow?.daewoon?.interaction_note,
    polish,
  });
}

function hasTimelineContent(blocks: TimelineBlock[]): boolean {
  return blocks.some((block) => Boolean(block.body?.trim()));
}

export default function RomanticSajuDeepReportView({
  report,
  nameA,
  nameB,
  myName: myNameProp,
  partnerName: partnerNameProp,
  viewerIsReportA = true,
}: {
  report: RomanticSajuDeepReport["report"];
  nameA: string;
  nameB: string;
  myName?: string;
  partnerName?: string;
  viewerIsReportA?: boolean;
}) {
  const tone = useReportTone();
  const theme =
    tone.surface === "stitch"
      ? getStitchTabTheme("romantic")
      : getTabTheme("romantic");

  const myName = myNameProp ?? (viewerIsReportA ? nameA : nameB);
  const partnerName = partnerNameProp ?? (viewerIsReportA ? nameB : nameA);

  const { displayText } = useMemo(
    () =>
      buildRomanticDisplayContext({
        nameA,
        nameB,
        myName,
        partnerName,
        viewerIsReportA,
      }),
    [nameA, nameB, myName, partnerName, viewerIsReportA],
  );

  const polishLine = useCallback(
    (raw: string | undefined | null) => displayText(raw),
    [displayText],
  );

  function P({ children }: { children: ReactNode }) {
    const text =
      typeof children === "string" ? displayText(children) : children;
    return (
      <RelationshipReportParagraph className="whitespace-pre-wrap">
        {text}
      </RelationshipReportParagraph>
    );
  }

  function InsightHook({ slot }: { slot: RomanticScreenSlot | undefined }) {
    if (!slot?.body || isRedundantInsightHook(slot)) return null;
    return (
      <RelationshipReportInset
        className={
          tone.surface === "stitch"
            ? "border-secondary/25 bg-secondary/8"
            : "border-[#ffd6a5]/20 bg-[#ffd6a5]/6"
        }
      >
        <p
          className={
            tone.surface === "stitch"
              ? "text-sm font-medium text-secondary"
              : "text-sm font-medium text-[#ffd6a5]/95"
          }
        >
          {displayText(slot.headline)}
        </p>
        <P>{slot.body}</P>
      </RelationshipReportInset>
    );
  }

  function NaturePersonPanel({
    name,
    nature,
    meetingHint,
  }: {
    name: string;
    nature?: NatureBlock;
    meetingHint?: string;
  }) {
    const paragraph = pickBestNatureParagraph(nature, meetingHint);
    return (
      <article className="stitch-hero-panel space-y-3 rounded-extra-large border border-outline-variant/25 p-5 sm:p-6">
        <p className={tone.bodyStrong}>{name}</p>
        {nature?.image_metaphor ? (
          <p className="text-sm text-secondary">
            {displayText(nature.image_metaphor)}
          </p>
        ) : null}
        {paragraph ? <P>{paragraph}</P> : null}
      </article>
    );
  }

  const s1 = report.section_1_summary ?? {};
  const s2 = report.section_2_nature ?? {};
  const special = report.section_4_special_bond;
  const s3 = (report.section_3_conversation_patterns ?? {}) as Record<
    string,
    Record<string, unknown>
  >;
  const s4 = (report.section_4_hidden_hearts ?? {}) as Record<string, unknown>;
  const s5 = resolveActionSection(
    (report.section_5_action ?? {}) as ActionSection,
    report.meta,
  );
  const s6 = resolveTimelineSection(
    (report.section_6_timeline ?? {}) as Record<string, Record<string, string>>,
    report.meta,
    displayText,
  );

  const emptyNature: NatureBlock = {};
  const { me: myNature, partner: partnerNature } = pickViewerFirstPair(
    (s2.a_nature ?? emptyNature) as NatureBlock,
    (s2.b_nature ?? emptyNature) as NatureBlock,
    viewerIsReportA,
  );
  const { me: myAdviceRaw, partner: partnerAdviceRaw } = pickViewerFirstPair(
    s5.advice_for_a ?? [],
    s5.advice_for_b ?? [],
    viewerIsReportA,
  );
  const actionKind = s1.relationship_name?.trim() || "연인";
  const myAdvice = dedupeActionGuidelines(myAdviceRaw, {
    target_user: myName,
    relationship_kind: actionKind,
  });
  const partnerAdvice = dedupeActionGuidelines(partnerAdviceRaw, {
    target_user: partnerName,
    relationship_kind: actionKind,
  });
  const { me: myHidden, partner: partnerHidden } = pickViewerFirstPair(
    (s4.a_hidden as { voice?: string; need?: string; reason?: string } | undefined) ??
      {},
    (s4.b_hidden as { voice?: string; need?: string; reason?: string } | undefined) ??
      {},
    viewerIsReportA,
  );
  const rankedInsights = (
    report.meta as
      | {
          ranked_insights?: Array<{
            id: string;
            headline: string;
            body: string;
            screenHint?: string;
          }>;
        }
      | undefined
  )?.ranked_insights;

  const myReportSlot = viewerIsReportA ? "a" : "b";
  const partnerReportSlot = viewerIsReportA ? "b" : "a";
  const myHiddenInsight = pickPersonHiddenInsight(rankedInsights, myReportSlot);
  const partnerHiddenInsight = pickPersonHiddenInsight(
    rankedInsights,
    partnerReportSlot,
  );

  const myHiddenVoice = resolveHiddenVoice(
    myHidden as HiddenHeartBlock,
    myHiddenInsight?.body,
  );
  const partnerHiddenVoice = resolveHiddenVoice(
    partnerHidden as HiddenHeartBlock,
    partnerHiddenInsight?.body,
  );
  const hasHiddenContent =
    Boolean(myHiddenVoice) ||
    Boolean(partnerHiddenVoice) ||
    Boolean(String(s4.mutual_gift ?? "").trim());

  const conflict = s3?.conflict_situation;
  const comparisonTable = useMemo(
    () =>
      buildViewerComparisonTable(
        (s2.comparison_table as Array<{
          aspect: string;
          a: string;
          b: string;
        }>) ?? [],
        {
          myName,
          partnerName,
          viewerIsReportA,
          polish: polishLine,
        },
      ),
    [s2.comparison_table, myName, partnerName, viewerIsReportA, polishLine],
  );
  const dialogueTable = filterDialogueTable(
    (conflict?.dialogue_table ?? []) as DialogueTableRow[],
  );

  const bondGifts = special
    ? viewerIsReportA
      ? [
          {
            from: myName,
            to: partnerName,
            headline: special.a_gives_b_headline,
            text: special.a_gives_b,
          },
          {
            from: partnerName,
            to: myName,
            headline: special.b_gives_a_headline,
            text: special.b_gives_a,
          },
        ]
      : [
          {
            from: myName,
            to: partnerName,
            headline: special.b_gives_a_headline,
            text: special.b_gives_a,
          },
          {
            from: partnerName,
            to: myName,
            headline: special.a_gives_b_headline,
            text: special.a_gives_b,
          },
        ]
    : [];

  const screenPlan = resolveScreenPlan(report);
  const openingRaw = getScreen1Opening(screenPlan, s1);
  const sajuProvenance = (
    report.meta as
      | {
          saju_provenance?: {
            a?: SajuChartProvenance | null;
            b?: SajuChartProvenance | null;
          };
          language?: string;
        }
      | undefined
  )?.saju_provenance;
  const locale =
    (report.meta as { language?: string } | undefined)?.language === "en"
      ? "en"
      : "ko";
  const viewerFirstHeadline = romanticHeadlineViewerFirst(
    sajuProvenance?.a,
    sajuProvenance?.b,
    viewerIsReportA,
    locale,
  );
  const opening = {
    ...openingRaw,
    headline: viewerFirstHeadline ?? openingRaw.headline,
  };
  const snapshotPanel = resolveSnapshotPanelFromReport(report.meta);
  const scores = extractRomanticScores(report.meta);
  const psychMatch = report.meta?.psych_match ?? null;
  const { chemistryApprox: chemistryScores, strengthWeakness: strengthWeaknessResult } =
    useMemo(() => {
      if (!psychMatch?.axis_results?.length) {
        return { chemistryApprox: null, strengthWeakness: null };
      }
      return {
        chemistryApprox: buildChemistryApproxScores(psychMatch.axis_results),
        strengthWeakness: buildStrengthWeaknessLists(psychMatch.axis_results),
      };
    }, [psychMatch]);
  const showChemistryBreakdown =
    chemistryScores != null &&
    (chemistryScores.emotional !== null ||
      chemistryScores.communication !== null);
  const showStrengthWeakness =
    psychMatch != null &&
    strengthWeaknessResult != null &&
    (strengthWeaknessResult.strengths.length > 0 ||
      strengthWeaknessResult.weaknesses.length > 0);
  const showBondFormula = shouldShowBondFormula(
    special?.relationship_formula,
    special?.only_together,
  );
  const showWhySpecial = shouldShowWhySpecial(special?.why_special, {
    onlyTogether: special?.only_together,
    aGivesB: special?.a_gives_b,
    bGivesA: special?.b_gives_a,
  });
  const shareFormula =
    showBondFormula && special?.relationship_formula
      ? displayText(special.relationship_formula)
      : "";
  const hasActionContent =
    myAdvice.length > 0 ||
    partnerAdvice.length > 0 ||
    Boolean(s5.together?.trim());
  const showTimeline = hasTimelineContent(s6);

  const myMeetingHint = viewerIsReportA
    ? myNature.meeting_b
    : myNature.meeting_a;
  const partnerMeetingHint = viewerIsReportA
    ? partnerNature.meeting_a
    : partnerNature.meeting_b;

  const psychAxisForViewer =
    psychMatch?.axis_results?.map((row) =>
      viewerIsReportA
        ? row
        : { ...row, score_a: row.score_b, score_b: row.score_a },
    ) ?? [];

  return (
    <RelationshipReportLayout
      kind="romantic"
      kindLabel="Premium · 연인 사주 심화"
      headline={{
        title: displayText(opening.headline),
        subtitle: displayText(opening.body),
        names: [myName, partnerName],
        badge: opening.grade ? `궁합 등급 ${opening.grade}` : undefined,
      }}
      scores={scores}
      scoreSourceNote="사주 궁합 신호(합·충·일간 상생 등)로 계산 · 0~100점 · 설문 11축과는 별도예요."
      showTriScoreInsight
      conflictInsightAnchor="relationship-conflict-map"
      scoreFooter={
        snapshotPanel ? (
          <RomanticSnapshotPanelView panel={snapshotPanel} />
        ) : undefined
      }
    >
      {showChemistryBreakdown && chemistryScores ? (
        <RelationshipReportCard
          title="🍀 케미스트리 심화"
          accentColor={theme.accent}
        >
          <ChemistryBreakdown scores={chemistryScores} />
        </RelationshipReportCard>
      ) : null}

      <RelationshipReportCard
        title={`🔍 ${ruleScreenTitle(report.meta, "compare", "서로 비교")}`}
        accentColor={theme.accent}
      >
        <p className="mb-3 text-xs leading-relaxed text-on-surface-variant">
          두 사람 사주·설문 데이터를 바탕으로 AI가 정리한 성향 비교예요. 항목별로
          나와 상대의 차이를 한눈에 볼 수 있어요.
        </p>
        <div
          className={[
            "overflow-x-auto rounded-xl border",
            tone.tableBorder,
          ].join(" ")}
        >
          <table className="w-full min-w-[280px] text-left text-sm">
            <thead>
              <tr className={["border-b", tone.tableBorder, tone.tableHead].join(" ")}>
                <th className="px-4 py-3 font-medium">항목</th>
                <th className="px-4 py-3 font-medium">{myName}</th>
                <th className="px-4 py-3 font-medium">{partnerName}</th>
              </tr>
            </thead>
            <tbody>
              {comparisonTable.map((row) => (
                <tr
                  key={row.aspect}
                  className={["border-b last:border-0", tone.tableBorder].join(
                    " ",
                  )}
                >
                  <td className={["px-4 py-3 font-medium", tone.bodyMedium].join(" ")}>
                    {row.aspect}
                  </td>
                  <td className={["px-4 py-3", tone.body].join(" ")}>{row.a}</td>
                  <td className={["px-4 py-3", tone.body].join(" ")}>{row.b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </RelationshipReportCard>

      <RelationshipReportCard title="📝 서로의 성향" accentColor={theme.accent}>
        <div className="space-y-8 sm:space-y-10">
          <NaturePersonPanel
            name={myName}
            nature={myNature}
            meetingHint={myMeetingHint}
          />
          <NaturePersonPanel
            name={partnerName}
            nature={partnerNature}
            meetingHint={partnerMeetingHint}
          />
        </div>
      </RelationshipReportCard>

      {psychAxisForViewer.length > 0 ? (
        <RelationshipReportCard
          title="🎯 심리 11축 매칭"
          accentColor={theme.accent}
        >
          <p className="mb-3 text-xs leading-relaxed text-on-surface-variant">
            둘의 현재 모습에서 어디가 비슷하고 어디가 다른지 한눈에 볼 수 있게
            정리했어요.
          </p>
          <PsychMatchRadarChart
            axisResults={psychAxisForViewer}
            personALabel={myName}
            personBLabel={partnerName}
          />
        </RelationshipReportCard>
      ) : null}

      {special ? (
        <RelationshipReportCard
          title="⚖️ 이 관계가 특별한 이유"
          accentColor={theme.accent}
        >
          <RelationshipReportBody className="space-y-6">
            <InsightHook slot={screenByKey(screenPlan, "bond")} />
            {bondGifts.map((gift) =>
              gift.text && !isGenericBondParagraph(gift.text) ? (
                <div key={`${gift.from}-${gift.to}`} className="space-y-2">
                  <RelationshipReportLabel>
                    ✨ {gift.from} → {gift.to}
                    {gift.headline?.trim()
                      ? ` : ${displayText(gift.headline.trim())}`
                      : ""}
                  </RelationshipReportLabel>
                  <P>{gift.text}</P>
                </div>
              ) : null,
            )}
            {special.power_to_each_other &&
            !special.a_gives_b &&
            !isGenericBondParagraph(special.power_to_each_other) ? (
              <P>{special.power_to_each_other}</P>
            ) : null}
            {special.only_together &&
            !isGenericBondParagraph(special.only_together) ? (
              <div className="space-y-2">
                <RelationshipReportLabel>
                  ✨ {myName} ↔ {partnerName}
                  {special.only_together_headline?.trim()
                    ? ` : ${displayText(special.only_together_headline.trim())}`
                    : ""}
                </RelationshipReportLabel>
                <P>{special.only_together}</P>
              </div>
            ) : null}
            {showBondFormula && special.relationship_formula ? (
              <p className="text-base font-medium text-accent-emerald">
                {displayText(special.relationship_formula)}
              </p>
            ) : null}
            {showWhySpecial && special.why_special ? (
              <div className="space-y-2">
                <RelationshipReportLabel>
                  💡 두 사람이 맞춰 가는 지점
                </RelationshipReportLabel>
                <P>{special.why_special}</P>
              </div>
            ) : null}
          </RelationshipReportBody>
        </RelationshipReportCard>
      ) : null}

      {showStrengthWeakness && strengthWeaknessResult ? (
        <RelationshipReportCard
          title="💪 강점 · 약점"
          accentColor={theme.accent}
        >
          <StrengthWeaknessCard result={strengthWeaknessResult} />
        </RelationshipReportCard>
      ) : null}

      {hasHiddenContent ? (
      <RelationshipReportCard
        title="🌙 서로의 숨은 마음"
        accentColor={theme.accent}
      >
        <RelationshipReportBody className="space-y-6">
          <HiddenHeartPanel
            name={myName}
            hidden={myHidden as HiddenHeartBlock}
            insightBody={myHiddenInsight?.body}
            polish={displayText}
          />
          <HiddenHeartPanel
            name={partnerName}
            hidden={partnerHidden as HiddenHeartBlock}
            insightBody={partnerHiddenInsight?.body}
            polish={displayText}
          />
          {s4.mutual_gift ? (
            <div className="space-y-2">
              <RelationshipReportLabel>
                💡 두 사람의 무의식 시너지
              </RelationshipReportLabel>
              <P>{displayText(String(s4.mutual_gift))}</P>
            </div>
          ) : null}
        </RelationshipReportBody>
      </RelationshipReportCard>
      ) : null}

      {conflict && dialogueTable.length > 0 ? (
        <RelationshipReportCard
          title={`💬 ${displayText(String(conflict.title ?? "갈등 패턴"))}`}
          accentColor={theme.accent}
          className="scroll-mt-24"
          id="relationship-conflict-map"
        >
          <div
            className={[
              "overflow-x-auto rounded-xl border",
              tone.tableBorder,
            ].join(" ")}
          >
            <table className="w-full min-w-[300px] text-left text-sm">
              <thead>
                <tr
                  className={["border-b", tone.tableBorder, tone.tableHead].join(
                    " ",
                  )}
                >
                  <th className="px-4 py-3">구분</th>
                  <th className="px-4 py-3">❌ 자주 하던 말</th>
                  <th className="px-4 py-3">✅ 이렇게 바꿔보면</th>
                </tr>
              </thead>
              <tbody>
                {dialogueTable.map((row, i) => (
                  <tr
                    key={`${row.label}-${i}`}
                    className={["border-b last:border-0", tone.tableBorder].join(
                      " ",
                    )}
                  >
                    <td className={["px-4 py-3", tone.bodyMedium].join(" ")}>
                      {row.label ?? row.speaker}
                      {row.emoji ? ` ${row.emoji}` : ""}
                    </td>
                    <td className="px-4 py-3 text-red-700/85">
                      {displayText(polishConflictDialogueLine(row.bad_line))}
                    </td>
                    <td className="px-4 py-3 text-accent-emerald">
                      {displayText(polishConflictDialogueLine(row.good_line))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </RelationshipReportCard>
      ) : null}

      {hasActionContent ? (
      <RelationshipReportCard
        title="🌱 서로에게 도움이 되는 행동들"
        accentColor={theme.accent}
      >
        <RelationshipReportBody>
          {myAdvice.length > 0 ? (
            <>
              <RelationshipReportLabel>
                ✨ {myName}님을 위한 에센스 가이드
              </RelationshipReportLabel>
              <EssenceActionGuidelineList
                items={myAdvice}
                polish={displayText}
              />
            </>
          ) : null}
          {partnerAdvice.length > 0 ? (
            <>
              <RelationshipReportLabel
                className={myAdvice.length > 0 ? "mt-6" : undefined}
              >
                ✨ {partnerName}님을 위한 에센스 가이드
              </RelationshipReportLabel>
              <EssenceActionGuidelineList
                items={partnerAdvice}
                polish={displayText}
              />
            </>
          ) : null}
          {s5.together?.trim() &&
          !isGenericRomanticActionPhrase(s5.together) ? (
            <div className="mt-6 space-y-2 border-t pt-5 border-outline-variant/30">
              <RelationshipReportLabel>
                💌 에센스 다이어리 : 우리만의 관계 아카이브
              </RelationshipReportLabel>
              <P>{String(s5.together)}</P>
              {s5.together_starter?.trim() &&
              !isGenericRomanticActionPhrase(s5.together_starter) ? (
                <p className="text-sm leading-relaxed text-on-surface-variant">
                  <span className="font-medium text-on-surface">
                    * 이렇게 대화의 문을 열어보세요:{" "}
                  </span>
                  <span aria-hidden className="text-on-surface-variant/70">
                    “
                  </span>
                  {displayText(s5.together_starter)}
                  <span aria-hidden className="text-on-surface-variant/70">
                    ”
                  </span>
                </p>
              ) : null}
            </div>
          ) : null}
        </RelationshipReportBody>
      </RelationshipReportCard>
      ) : null}

      {showTimeline ? (
      <RelationshipReportCard
        title="⏰ 시간이 지나면 이렇게 달라져요"
        accentColor={theme.accent}
      >
        <RelationshipReportBody>
          {s6.map((block, index) => (
            <div
              key={`timeline-${index}`}
              className={[
                "border-t pt-4 first:border-0 first:pt-0",
                tone.tableBorder,
              ].join(" ")}
            >
              <p className={tone.bodyMedium}>{block.period}</p>
              <P>{block.body}</P>
              {block.sub ? <P>{block.sub}</P> : null}
            </div>
          ))}
        </RelationshipReportBody>
      </RelationshipReportCard>
      ) : null}

      <ShareSummaryCard
        summary={{
          ...s1,
          keywords: filterShareSummaryKeywords(s1.keywords ?? []),
          relationship_name: isShareSummaryRelationshipNameExcluded(
            s1.relationship_name,
          )
            ? ""
            : s1.relationship_name,
        }}
        showGrade={false}
        relationshipFormula={
          shareFormula ||
          displayText(s1.one_line_summary) ||
          s1.relationship_name ||
          "우리 관계"
        }
      />
    </RelationshipReportLayout>
  );
}
