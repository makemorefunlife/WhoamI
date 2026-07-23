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
  formatRomanticBalanceCanonicalLabel,
  readRomanticBalanceCanonicalProjection,
} from "@/lib/relationship/romantic/romanticBalanceOfPowerCanonical";
import {
  formatRomanticRecoveryCanonicalLabel,
  readRomanticRecoveryCanonicalProjection,
} from "@/lib/relationship/romantic/romanticRecoverySpeedCanonical";
import {
  dedupeActionGuidelines,
  normalizeActionGuideline,
} from "@/lib/relationship/essenceActionGuideline";
import {
  shouldShowBondFormula,
  shouldShowWhySpecial,
  isGenericBondParagraph,
} from "@/lib/relationship/romanticBondDisplay";
import { useMessages } from "@/lib/i18n/LocaleProvider";
import type { MessageCatalog } from "@/lib/i18n/messages";

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
  const messages = useMessages();
  const { hook, body } = formatHiddenHeartDisplay(hidden, insightBody, polish);
  if (!hook && !body) return null;

  return (
    <div className="space-y-2">
      <RelationshipReportLabel>
        {messages.relationshipDrilldown.romantic.hiddenHeartPanelLabel(name)}
      </RelationshipReportLabel>
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

/** friend/family SectionRenderer.tsx와 동일한 Part 구분선 패턴. */
function PartHeading({
  title,
  accentColor,
}: {
  title: string;
  accentColor: string;
}) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <h2 className="text-base font-bold tracking-tight text-white/90 sm:text-lg">
        {title}
      </h2>
      <div
        className="h-px flex-1"
        style={{ backgroundColor: `${accentColor}33` }}
      />
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
  t: {
    scoreLabelAffinity: string;
    scoreLabelChemistry: string;
    scoreLabelSensitivity: string;
  },
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
      label: t.scoreLabelAffinity,
      value: activation,
      polarity: "higher_better",
    },
    {
      emoji: "🧩",
      label: t.scoreLabelChemistry,
      value: benefit,
      polarity: "higher_better",
    },
    {
      emoji: "⚡",
      label: t.scoreLabelSensitivity,
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
  t: MessageCatalog["relationshipDrilldown"]["romantic"],
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
    const fallbackTitles = t.fallbackActionTitlesA;
    const fallbackTitlesB = t.fallbackActionTitlesB;

    const toGuideline = (
      phrase: string,
      index: number,
      target: string,
      titles: readonly string[],
    ) => ({
      relationship_kind: "연인",
      target_user: target,
      action_title: titles[index] ?? t.fallbackActionTitleDefault,
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
  const messages = useMessages();
  const t = messages.relationshipDrilldown.romantic;
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
  const dynamics = report.section_1_relationship_dynamics;
  const reportLocale =
    typeof report.meta?.locale === "string"
      ? report.meta.locale
      : typeof report.meta?.language === "string"
        ? report.meta.language
        : null;
  const balanceCanonical = readRomanticBalanceCanonicalProjection(report);
  const balanceCanonicalLabel = balanceCanonical
    ? formatRomanticBalanceCanonicalLabel(balanceCanonical, {
        nameA,
        nameB,
        locale: reportLocale,
      })
    : null;
  const recoveryCanonical = readRomanticRecoveryCanonicalProjection(report);
  const recoveryCanonicalLabel = recoveryCanonical
    ? formatRomanticRecoveryCanonicalLabel(recoveryCanonical, {
        nameA,
        nameB,
        locale: reportLocale,
      })
    : null;
  const s2 = report.section_2_nature ?? {};
  const special = report.section_4_special_bond;
  const frames = report.section_4_relationship_frames;
  const reassurance = frames?.reassurance_signal;
  const { me: myReassurance, partner: partnerReassurance } = pickViewerFirstPair(
    { body: reassurance?.a_body },
    { body: reassurance?.b_body },
    viewerIsReportA,
  );
  const s3 = (report.section_3_conversation_patterns ?? {}) as Record<
    string,
    Record<string, unknown>
  >;
  const s4 = (report.section_4_hidden_hearts ?? {}) as Record<string, unknown>;
  const s5 = resolveActionSection(
    (report.section_5_action ?? {}) as ActionSection,
    report.meta,
    t,
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
  const snapshotPanel = resolveSnapshotPanelFromReport(report.meta, locale);
  const scores = extractRomanticScores(report.meta, t);
  const psychMatch = report.meta?.psych_match ?? null;
  const { chemistryApprox: chemistryScores, strengthWeakness: strengthWeaknessResult } =
    useMemo(() => {
      // 2026-07-21부터: 서버가 생성 시점에 meta.chemistry_approx/strength_weakness를
      // 저장함 — 있으면 그대로 쓰고, 없으면(그 이전에 생성된 구버전 캐시) 클라이언트에서
      // 재계산해 하위호환 유지.
      if (report.meta?.chemistry_approx && report.meta?.strength_weakness) {
        return {
          chemistryApprox: report.meta.chemistry_approx,
          strengthWeakness: report.meta.strength_weakness,
        };
      }
      if (!psychMatch?.axis_results?.length) {
        return { chemistryApprox: null, strengthWeakness: null };
      }
      return {
        chemistryApprox: buildChemistryApproxScores(psychMatch.axis_results),
        strengthWeakness: buildStrengthWeaknessLists(psychMatch.axis_results, locale),
      };
    }, [report.meta, psychMatch, locale]);
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
      kindLabel={t.eyebrow}
      headline={{
        title: displayText(opening.headline),
        subtitle: displayText(opening.body),
        names: [myName, partnerName],
        badge: opening.grade ? t.gradeBadge(opening.grade) : undefined,
      }}
      scores={scores}
      scoreSourceNote={t.scoreSourceNote}
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
          title={t.chemistryCardTitle}
          accentColor={theme.accent}
        >
          <ChemistryBreakdown scores={chemistryScores} />
        </RelationshipReportCard>
      ) : null}

      <PartHeading title={t.part1Title} accentColor={theme.accent} />

      <RelationshipReportCard
        title={`🔍 ${ruleScreenTitle(report.meta, "compare", t.compareCardTitleFallback)}`}
        accentColor={theme.accent}
      >
        <p className="mb-3 text-xs leading-relaxed text-on-surface-variant">
          {t.compareCardIntro}
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
                <th className="px-4 py-3 font-medium">{t.comparisonAspectColumn}</th>
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
                    {t.comparisonAspectLabels[
                      row.aspect as keyof typeof t.comparisonAspectLabels
                    ] ?? row.aspect}
                  </td>
                  <td className={["px-4 py-3", tone.body].join(" ")}>{row.a}</td>
                  <td className={["px-4 py-3", tone.body].join(" ")}>{row.b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </RelationshipReportCard>

      {dynamics &&
      (dynamics.balance_of_power?.body || dynamics.recovery_speed?.body) ? (
        <RelationshipReportCard
          title={t.dynamicsCardTitle}
          accentColor={theme.accent}
        >
          <RelationshipReportBody className="space-y-5">
            {dynamics.balance_of_power?.body ? (
              <div className="space-y-2">
                <RelationshipReportLabel>
                  {t.dynamicsBalanceLabel}
                  {dynamics.balance_of_power.headline?.trim()
                    ? ` — ${displayText(dynamics.balance_of_power.headline)}`
                    : ""}
                </RelationshipReportLabel>
                {balanceCanonicalLabel ? (
                  <p
                    className={[
                      "text-sm font-semibold tracking-tight",
                      tone.bodyMedium,
                    ].join(" ")}
                  >
                    {balanceCanonicalLabel}
                  </p>
                ) : null}
                <P>{displayText(dynamics.balance_of_power.body)}</P>
              </div>
            ) : null}
            {dynamics.recovery_speed?.body ? (
              <div className="space-y-2">
                <RelationshipReportLabel>
                  {t.dynamicsRecoveryLabel}
                  {dynamics.recovery_speed.headline?.trim()
                    ? ` — ${displayText(dynamics.recovery_speed.headline)}`
                    : ""}
                </RelationshipReportLabel>
                {recoveryCanonicalLabel ? (
                  <p
                    className={[
                      "text-sm font-semibold tracking-tight",
                      tone.bodyMedium,
                    ].join(" ")}
                  >
                    {recoveryCanonicalLabel}
                  </p>
                ) : null}
                <P>{displayText(dynamics.recovery_speed.body)}</P>
              </div>
            ) : null}
          </RelationshipReportBody>
        </RelationshipReportCard>
      ) : null}

      <PartHeading title={t.part2Title} accentColor={theme.accent} />

      <RelationshipReportCard title={t.natureCardTitle} accentColor={theme.accent}>
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
          title={t.psychMatchCardTitle}
          accentColor={theme.accent}
        >
          <p className="mb-3 text-xs leading-relaxed text-on-surface-variant">
            {t.psychMatchIntro}
          </p>
          <PsychMatchRadarChart
            axisResults={psychAxisForViewer}
            personALabel={myName}
            personBLabel={partnerName}
          />
        </RelationshipReportCard>
      ) : null}

      <PartHeading title={t.part3Title} accentColor={theme.accent} />

      {special ? (
        <RelationshipReportCard
          title={t.specialCardTitle}
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
                  {t.specialWhyLabel}
                </RelationshipReportLabel>
                <P>{special.why_special}</P>
              </div>
            ) : null}
          </RelationshipReportBody>
        </RelationshipReportCard>
      ) : null}

      {frames &&
      (myReassurance.body ||
        partnerReassurance.body ||
        frames.unconscious_role_play?.body) ? (
        <RelationshipReportCard
          title={t.framesCardTitle}
          accentColor={theme.accent}
        >
          <RelationshipReportBody className="space-y-6">
            {myReassurance.body || partnerReassurance.body ? (
              <div className="space-y-2">
                <RelationshipReportLabel>
                  {t.framesReassuranceLabel}
                  {reassurance?.headline?.trim()
                    ? ` — ${displayText(reassurance.headline)}`
                    : ""}
                </RelationshipReportLabel>
                {myReassurance.body ? (
                  <P>{`${myName}: ${displayText(myReassurance.body)}`}</P>
                ) : null}
                {partnerReassurance.body ? (
                  <P>{`${partnerName}: ${displayText(partnerReassurance.body)}`}</P>
                ) : null}
                {reassurance?.match_note?.trim() ? (
                  <P>{displayText(reassurance.match_note)}</P>
                ) : null}
              </div>
            ) : null}
            {frames.unconscious_role_play?.body ? (
              <div className="space-y-2">
                <RelationshipReportLabel>
                  {t.framesRolePlayLabel}
                  {frames.unconscious_role_play.headline?.trim()
                    ? ` — ${displayText(frames.unconscious_role_play.headline)}`
                    : ""}
                </RelationshipReportLabel>
                <P>{displayText(frames.unconscious_role_play.body)}</P>
              </div>
            ) : null}
          </RelationshipReportBody>
        </RelationshipReportCard>
      ) : null}

      <PartHeading title={t.part4Title} accentColor={theme.accent} />

      {showStrengthWeakness && strengthWeaknessResult ? (
        <RelationshipReportCard
          title={t.strengthWeaknessCardTitle}
          accentColor={theme.accent}
        >
          <StrengthWeaknessCard result={strengthWeaknessResult} />
        </RelationshipReportCard>
      ) : null}

      {hasHiddenContent ? (
      <RelationshipReportCard
        title={t.hiddenHeartsCardTitle}
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
                {t.hiddenHeartsMutualGiftLabel}
              </RelationshipReportLabel>
              <P>{displayText(String(s4.mutual_gift))}</P>
            </div>
          ) : null}
        </RelationshipReportBody>
      </RelationshipReportCard>
      ) : null}

      {conflict && dialogueTable.length > 0 ? (
        <RelationshipReportCard
          title={`💬 ${displayText(String(conflict.title ?? t.conflictCardTitleFallback))}`}
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
                  <th className="px-4 py-3">{t.conflictColumnLabel}</th>
                  <th className="px-4 py-3">{t.conflictBadLineColumn}</th>
                  <th className="px-4 py-3">{t.conflictGoodLineColumn}</th>
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

      <PartHeading title={t.part5Title} accentColor={theme.accent} />

      {hasActionContent ? (
      <RelationshipReportCard
        title={t.actionCardTitle}
        accentColor={theme.accent}
      >
        <RelationshipReportBody>
          {myAdvice.length > 0 ? (
            <>
              <RelationshipReportLabel>
                {t.actionGuideLabel(myName)}
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
                {t.actionGuideLabel(partnerName)}
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
                {t.actionDiaryLabel}
              </RelationshipReportLabel>
              <P>{String(s5.together)}</P>
              {s5.together_starter?.trim() &&
              !isGenericRomanticActionPhrase(s5.together_starter) ? (
                <p className="text-sm leading-relaxed text-on-surface-variant">
                  <span className="font-medium text-on-surface">
                    {t.actionStarterPrefix}
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
        title={t.timelineCardTitle}
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
          t.shareFormulaFallback
        }
      />
    </RelationshipReportLayout>
  );
}
