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
  romanticCrossBodyContext,
  strengthComplement,
  TENSION_CROSS,
} from "./types";

const HEADLINE_TENSION_DAY_CROSS_KO = "가까울수록 예민해지는 조합";
const HEADLINE_TENSION_DAY_CROSS_EN = "Closeness that turns sharp";
const HEADLINE_YUKHAP_PULL_KO = "끌리는데 이유가 있는 관계";
const HEADLINE_YUKHAP_PULL_EN = "There's a reason you're drawn together";

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
