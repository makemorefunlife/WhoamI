import {
  buildRomanticDayStemOneLiner,
  formatRomanticEssencePair,
  formatRomanticMetaphorComboBody,
  romanticHeadlineFromProfiles,
} from "@/lib/relationship/dayStemRomanticProfile";
import {
  formatMetaphorPairLine,
  humanizeDayStemInteraction,
  humanizeRomanticCrossBody,
  humanizeStrengthComplement,
  joinPersonalityHeadline,
} from "@/lib/relationship/romanticEverydayText";
import { normalizeRomanticHeadlineLocale } from "@/lib/relationship/romanticHeadline/locale";
import type { HeadlineRuleOutput, RomanticRule, RomanticRuleContext } from "./types";
import {
  crossHits,
  dayStemIncludes,
  hasCross,
  hasHeavenlyStemCombine,
  romanticCrossBodyContext,
  strengthComplement,
  temperatureComplement,
  TENSION_CROSS,
} from "./types";

const HEADLINE_TENSION_DAY_CROSS_KO = "가까울수록 예민해지는 조합";
const HEADLINE_TENSION_DAY_CROSS_EN = "Closeness that turns sharp";
const HEADLINE_YUKHAP_PULL_KO = "끌리는데 이유가 있는 관계";
const HEADLINE_YUKHAP_PULL_EN = "There's a reason you're drawn together";
const HEADLINE_STEM_COMBINE_KO = "이유 없이 끌리는 본능적 케미";
const HEADLINE_STEM_COMBINE_EN = "A pull you can't quite explain";

function headlineTensionDayCross(locale: RomanticRuleContext["locale"]): string {
  return normalizeRomanticHeadlineLocale(locale) === "en"
    ? HEADLINE_TENSION_DAY_CROSS_EN
    : HEADLINE_TENSION_DAY_CROSS_KO;
}

function headlineYukhapPull(locale: RomanticRuleContext["locale"]): string {
  return normalizeRomanticHeadlineLocale(locale) === "en"
    ? HEADLINE_YUKHAP_PULL_EN
    : HEADLINE_YUKHAP_PULL_KO;
}

function headlineStemCombine(locale: RomanticRuleContext["locale"]): string {
  return normalizeRomanticHeadlineLocale(locale) === "en"
    ? HEADLINE_STEM_COMBINE_EN
    : HEADLINE_STEM_COMBINE_KO;
}

function johuComplementBody(
  ctx: RomanticRuleContext,
  coldName: string,
  hotName: string,
): string {
  return normalizeRomanticHeadlineLocale(ctx.locale) === "en"
    ? `${coldName} runs cool and ${hotName} runs warm — together you fill in each other's temperature, like two candles lighting up the same room.`
    : `${coldName}은(는) 차분하고 ${hotName}은(는) 따뜻해서, 서로의 온도를 채워주는 촛불과 촛불 같은 조합이에요.`;
}

function stemCombineBody(ctx: RomanticRuleContext): string {
  const { nicknameA, nicknameB } = ctx;
  return normalizeRomanticHeadlineLocale(ctx.locale) === "en"
    ? `${nicknameA} and ${nicknameB} — your day-stems form one of the five classic heavenly-stem combines, the kind of chemistry that runs on instinct rather than logic.`
    : `${nicknameA}와 ${nicknameB} — 두 사람의 일간이 천간합을 이루는 조합이라, 이유를 따지기 전에 이미 본능적으로 끌리는 케미예요.`;
}

export const HEADLINE_RULES: RomanticRule<HeadlineRuleOutput>[] = [
  {
    id: "headline_tension_day_cross",
    screen: 1,
    priority: 92,
    when: (ctx) =>
      crossHits(ctx, [...TENSION_CROSS]).some(
        (h) =>
          h.personA_pillar.startsWith("일주") || h.personB_pillar.startsWith("일주"),
      ),
    build: (ctx) => {
      const hit = crossHits(ctx, [...TENSION_CROSS]).sort(
        (a, b) => b.priority - a.priority,
      )[0]!;
      return {
        ruleId: "headline_tension_day_cross",
        headline: headlineTensionDayCross(ctx.locale),
        body: `${ctx.nicknameA}와 ${ctx.nicknameB} — ${humanizeRomanticCrossBody(hit, romanticCrossBodyContext(ctx), { closeRelationship: true })}`,
        insightTags: ["pair_cross", hit.type, "close"],
      };
    },
  },
  {
    id: "headline_stem_combine_pull",
    screen: 1,
    priority: 90,
    when: (ctx) => hasHeavenlyStemCombine(ctx),
    build: (ctx) => ({
      ruleId: "headline_stem_combine_pull",
      headline: headlineStemCombine(ctx.locale),
      body: stemCombineBody(ctx),
      insightTags: ["day_stem_combine"],
    }),
  },
  {
    id: "headline_day_stem_sangsaeng",
    screen: 1,
    priority: 88,
    when: (ctx) => dayStemIncludes(ctx, "상생"),
    build: (ctx) => {
      const profileA = ctx.romanticProfileA;
      const profileB = ctx.romanticProfileB;
      const body =
        profileA && profileB
          ? buildRomanticDayStemOneLiner({
              profileA,
              profileB,
              nicknameA: ctx.nicknameA,
              nicknameB: ctx.nicknameB,
              dayStemInteraction: ctx.pairAnalysis.dayStemInteraction,
              closeRelationship: true,
              locale: ctx.locale,
            })
          : humanizeDayStemInteraction(ctx.pairAnalysis.dayStemInteraction);
      return {
        ruleId: "headline_day_stem_sangsaeng",
        headline:
          profileA && profileB
            ? romanticHeadlineFromProfiles(profileA, profileB, ctx.locale)
            : ctx.metaphorCombo,
        body,
        insightTags: ["pair_day_stem", "support"],
      };
    },
  },
  {
    id: "headline_yukhap_pull",
    screen: 1,
    priority: 85,
    when: (ctx) => hasCross(ctx, "육합"),
    build: (ctx) => {
      const hit = crossHits(ctx, "육합")[0]!;
      return {
        ruleId: "headline_yukhap_pull",
        headline: headlineYukhapPull(ctx.locale),
        body: humanizeRomanticCrossBody(hit, romanticCrossBodyContext(ctx)),
        insightTags: ["pair_cross", "육합"],
      };
    },
  },
  {
    id: "headline_johu_complement",
    screen: 1,
    priority: 82,
    when: (ctx) => temperatureComplement(ctx) != null,
    build: (ctx) => {
      const dir = temperatureComplement(ctx);
      const [coldName, hotName] =
        dir === "ab"
          ? [ctx.nicknameA, ctx.nicknameB]
          : [ctx.nicknameB, ctx.nicknameA];
      return {
        ruleId: "headline_johu_complement",
        headline: joinPersonalityHeadline(ctx.metaphorA, ctx.metaphorB, ctx.locale),
        body: johuComplementBody(ctx, coldName, hotName),
        insightTags: ["johu_complement"],
      };
    },
  },
  {
    id: "headline_strength_complement",
    screen: 1,
    priority: 80,
    when: (ctx) => strengthComplement(ctx) != null,
    build: (ctx) => {
      const dir = strengthComplement(ctx);
      const [strong, soft] =
        dir === "ab"
          ? [ctx.nicknameA, ctx.nicknameB]
          : [ctx.nicknameB, ctx.nicknameA];
      return {
        ruleId: "headline_strength_complement",
        headline: joinPersonalityHeadline(ctx.metaphorA, ctx.metaphorB, ctx.locale),
        body: humanizeStrengthComplement(strong, soft),
        insightTags: ["strength_complement"],
      };
    },
  },
  {
    id: "headline_metaphor_default",
    screen: 1,
    priority: 1,
    when: () => true,
    build: (ctx) => {
      const profileA = ctx.romanticProfileA;
      const profileB = ctx.romanticProfileB;
      const defaultBody =
        profileA && profileB
          ? formatRomanticMetaphorComboBody(
              formatRomanticEssencePair(
                profileA,
                ctx.nicknameA,
                profileB,
                ctx.nicknameB,
                ctx.locale,
              ),
              ctx.locale,
            )
          : formatRomanticMetaphorComboBody(
              formatMetaphorPairLine(
                ctx.metaphorA,
                ctx.nicknameA,
                ctx.metaphorB,
                ctx.nicknameB,
                ctx.locale,
              ),
              ctx.locale,
            );
      return {
        ruleId: "headline_metaphor_default",
        headline:
          profileA && profileB
            ? romanticHeadlineFromProfiles(profileA, profileB, ctx.locale)
            : ctx.metaphorCombo,
        body: defaultBody,
        insightTags: ["metaphor_combo"],
      };
    },
  },
];

export function resolveHeadlineRule(ctx: RomanticRuleContext): HeadlineRuleOutput {
  const ranked = [...HEADLINE_RULES].sort((a, b) => b.priority - a.priority);
  for (const rule of ranked) {
    if (rule.when(ctx)) return rule.build(ctx);
  }
  return HEADLINE_RULES[HEADLINE_RULES.length - 1]!.build(ctx);
}
