/**
 * Friend Chapter 6 — "서운할 때 우리는 어떻게 달라지는가"
 * Projects FriendResponseIntelligence.personA/B.conflict + pair.conflictLoop
 * + pair.repairSequenceA/B. No new drama invented — every step traces back
 * to an already-resolved person profile (spec §10 CH6-C).
 */
import type { Locale } from "@/lib/i18n/locale";
import type { FriendResponseIntelligence } from "@/lib/relationship/friend/response/friendResponseIntelligenceTypes";
import {
  CONFLICT_RESPONSE_COPY,
  CONFLICT_UNDERLYING_NEED_COPY,
  CONFLICT_INTERPRETATION_COPY,
  CONFLICT_LOOP_TYPE_COPY,
  HURT_TRIGGER_COPY,
  REPAIR_NEED_COPY,
  REPAIR_NEED_WHY_COPY,
  REPAIR_STEP_COPY,
} from "./friendChapterCopyDictionary";

function pick(locale: Locale, en: string, ko: string): string {
  return locale === "en-US" ? en : ko;
}

export type FriendChapter06Conflict = {
  /** ◤ 내가 서운하면 (per person, two layers: first response + underlying need) */
  myReaction: { name: string; headline: string; description: string }[];
  /** ◤ 우리가 싸우면 이렇게 꼬일 수 있어 */
  conflictLoop: { headline: string; lowRisk: boolean; steps: string[] };
  /** ◤ 각자가 특히 서운해지는 순간 (per person, max 2 each) */
  hurtMoments: { name: string; triggers: { label: string; importance: "PRIMARY" | "SECONDARY" }[] }[];
  /** Present only when both people's trigger SET matches but PRIMARY/SECONDARY
   * order differs — surfaces the same-set-different-priority nuance instead
   * of two flat, seemingly-repetitive lists (spec §13, §11-B). */
  hurtMomentsSharedFraming?: string;
  /** ◤ 화해할 때 각자 필요한 것 (per person) — `nuance` is always a distinct
   * sentence from `label`, never falls back to repeating it. */
  repairNeeds: { name: string; label: string; nuance: string }[];
  /** ◤ 우리에게 맞는 회복 순서 */
  repairSequence: { headline: string; steps: string[] };
};

export function buildFriendChapter06Conflict(params: {
  intel: FriendResponseIntelligence;
  nameA: string;
  nameB: string;
  locale?: Locale;
}): FriendChapter06Conflict {
  const locale = params.locale ?? "ko-KR";
  const { intel, nameA, nameB } = params;

  // ◤ 내가 서운하면 — surface response + the core need it's protecting.
  const myReaction = [
    { name: nameA, profile: intel.personA.conflict },
    { name: nameB, profile: intel.personB.conflict },
  ].map(({ name, profile }) => {
    const respCopy = CONFLICT_RESPONSE_COPY[profile.initialResponse];
    const needText = CONFLICT_UNDERLYING_NEED_COPY[profile.underlyingNeed](locale);
    const description = pick(
      locale,
      `${respCopy.description(locale, name)} Underneath that, it's really ${needText}.`,
      `${respCopy.description(locale, name)} 그 안에는 ${needText}이(가) 여전히 필요한 편이에요.`,
    );
    return { name, headline: respCopy.label(locale), description };
  });

  // ◤ 우리가 싸우면 이렇게 꼬일 수 있어 — real classified loop, not raw concatenation.
  const loop = intel.pair.conflictLoop;
  const nameById: Record<string, string> = { a: nameA, b: nameB };
  const loopSteps = loop.steps.map((step) => {
    const actor = nameById[step.actorId];
    const interpreter = nameById[step.interpretedById];
    const respCopy = CONFLICT_RESPONSE_COPY[step.behavior];
    const interp = CONFLICT_INTERPRETATION_COPY[step.interpretation](locale);
    return pick(
      locale,
      `${respCopy.description(locale, actor)} ${interpreter} can read that as ${interp}.`,
      `${respCopy.description(locale, actor)} ${interpreter}은(는) 이걸 ${interp}처럼 느낄 수 있어요.`,
    );
  });
  const conflictLoop = {
    headline: CONFLICT_LOOP_TYPE_COPY[loop.loopType](locale),
    lowRisk: loop.lowRisk,
    steps: loop.lowRisk
      ? [pick(
          locale,
          `Neither of you tends to escalate the other, so friction here rarely snowballs — the bigger risk is just letting small things go unsaid.`,
          `서로가 서로를 더 키우는 조합은 아니라서 마찰이 쉽게 커지진 않아요 — 다만 사소한 서운함을 말 없이 넘기는 게 더 위험할 수 있어요.`,
        )]
      : loopSteps,
  };

  // ◤ 각자가 특히 서운해지는 순간
  const hurtMoments = [
    { name: nameA, claims: intel.personA.conflict.hurtTriggers },
    { name: nameB, claims: intel.personB.conflict.hurtTriggers },
  ].map(({ name, claims }) => ({
    name,
    triggers: claims.map((c) => ({ label: HURT_TRIGGER_COPY[c.trigger](locale), importance: c.importance })),
  }));

  // Same vulnerability SET, different PRIMARY/SECONDARY order — name it
  // explicitly instead of letting two structurally-identical-looking lists
  // read as repetitive (spec §13: preserve this nuance, don't flatten it).
  const triggersA = intel.personA.conflict.hurtTriggers;
  const triggersB = intel.personB.conflict.hurtTriggers;
  const sameTriggerSet =
    triggersA.length > 0 &&
    triggersA.length === triggersB.length &&
    new Set(triggersA.map((t) => t.trigger)).size === new Set([...triggersA, ...triggersB].map((t) => t.trigger)).size;
  const primaryA = triggersA.find((t) => t.importance === "PRIMARY");
  const primaryB = triggersB.find((t) => t.importance === "PRIMARY");
  const hurtMomentsSharedFraming =
    sameTriggerSet && primaryA && primaryB && primaryA.trigger !== primaryB.trigger
      ? pick(
          locale,
          `You're both sensitive to the same two things — you just feel them in a different order. ${nameA} reacts to "${HURT_TRIGGER_COPY[primaryA.trigger](locale).toLowerCase()}" first, while ${nameB} reacts to "${HURT_TRIGGER_COPY[primaryB.trigger](locale).toLowerCase()}" first.`,
          `둘 다 같은 두 가지에 예민한 편이에요 — 다만 어느 쪽이 먼저 건드리는지가 달라요. ${nameA}은(는) "${HURT_TRIGGER_COPY[primaryA.trigger](locale)}"에 먼저 반응하고, ${nameB}은(는) "${HURT_TRIGGER_COPY[primaryB.trigger](locale)}"에 더 먼저 반응해요.`,
        )
      : undefined;

  // ◤ 화해할 때 각자 필요한 것 — headline (label) and body (nuance) must never
  // say the same thing verbatim. When both share the same repair need, the
  // body differentiates via what's driving it (their own underlying need);
  // otherwise it explains WHY that need applies, from REPAIR_NEED_WHY_COPY —
  // never falls back to repeating the label (spec: CH6-D fix).
  const repairA = intel.personA.conflict;
  const repairB = intel.personB.conflict;
  const sameRepairNeed = repairA.repairNeed === repairB.repairNeed;
  const repairNeeds = [
    { name: nameA, profile: repairA },
    { name: nameB, profile: repairB },
  ].map(({ name, profile }) => ({
    name,
    label: REPAIR_NEED_COPY[profile.repairNeed](locale),
    nuance: sameRepairNeed
      ? pick(
          locale,
          `for ${name}, this is really about ${CONFLICT_UNDERLYING_NEED_COPY[profile.underlyingNeed](locale)}`,
          `${name}에게는 특히 ${CONFLICT_UNDERLYING_NEED_COPY[profile.underlyingNeed](locale)}이(가) 중요해요`,
        )
      : REPAIR_NEED_WHY_COPY[profile.repairNeed](locale, name),
  }));

  // ◤ 우리에게 맞는 회복 순서 — merge both people's sequences into one
  // deduplicated, ordered flow (no new steps beyond the two resolved sequences).
  const mergedSteps: string[] = [];
  const seen = new Set<string>();
  for (const step of [...intel.pair.repairSequenceA.steps, ...intel.pair.repairSequenceB.steps]) {
    if (!seen.has(step)) {
      seen.add(step);
      mergedSteps.push(REPAIR_STEP_COPY[step](locale));
    }
  }
  const repairSequence = {
    headline: pick(locale, "A repair order that works for both of you", "우리에게 맞는 화해 순서"),
    steps: mergedSteps.slice(0, 4),
  };

  return { myReaction, conflictLoop, hurtMoments, hurtMomentsSharedFraming, repairNeeds, repairSequence };
}
