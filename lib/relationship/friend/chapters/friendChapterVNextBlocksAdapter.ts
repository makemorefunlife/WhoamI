/**
 * Converts each Friend VNext Ch4-8 typed chapter output into a uniform
 * { title (◤-prefixed), headline, description }[] block list for rendering.
 * Kept separate from the chapter engines themselves so the engines stay pure
 * data producers and all UI-facing string assembly lives in one place.
 *
 * Every headline/description passes through sanitizeKoreanParticles() as a
 * final pass — no "은(는)"/"이(가)" dual-particle syntax may reach the UI
 * (spec §14).
 */
import type { Locale } from "@/lib/i18n/locale";
import { sanitizeKoreanParticles } from "@/lib/relationship/koreanParticles";
import type { FriendInitiativeRoleProfile, FriendTravelPlayRoleProfile } from "@/lib/relationship/friend/canonical/friendCanonicalTypes";
import type { FriendResponseIntelligence } from "@/lib/relationship/friend/response/friendResponseIntelligenceTypes";
import { buildFriendChapter04TeamPlay } from "./friendChapter04TeamPlay";
import { buildFriendChapter05Support } from "./friendChapter05Support";
import { buildFriendChapter06Conflict } from "./friendChapter06Conflict";
import { buildFriendChapter07Boundary } from "./friendChapter07Boundary";
import { buildFriendChapter08Distance } from "./friendChapter08Distance";

/** One side of an A/B (or A→B / B→A) comparison rendered as its own column. */
export type FriendVNextCompareEntry = { name: string; label?: string; body: string };

export type FriendVNextBlock = {
  title: string;
  headline: string;
  description: string;
  /** Present only for blocks with genuine per-person/per-direction content —
   * rendered as side-by-side columns instead of a single joined paragraph. */
  compare?: FriendVNextCompareEntry[];
};

function pick(locale: Locale, en: string, ko: string): string {
  return locale === "en-US" ? en : ko;
}

function clean(text: string, names: string[]): string {
  return sanitizeKoreanParticles(text, names);
}

function block(
  names: string[],
  title: string,
  headline: string,
  description: string,
  compareEntries?: FriendVNextCompareEntry[],
): FriendVNextBlock {
  return {
    title,
    headline: clean(headline, names),
    description: clean(description, names),
    ...(compareEntries
      ? {
          compare: compareEntries.map((c) => ({
            name: c.name,
            label: c.label ? clean(c.label, names) : undefined,
            body: clean(c.body, names),
          })),
        }
      : {}),
  };
}

export function buildFriendChapter04Blocks(params: {
  initiative: FriendInitiativeRoleProfile;
  travelPlay: FriendTravelPlayRoleProfile;
  nameA: string;
  nameB: string;
  locale: Locale;
}): FriendVNextBlock[] {
  const ch04 = buildFriendChapter04TeamPlay(params);
  const names = [params.nameA, params.nameB];
  const l = params.locale;
  return [
    block(names, pick(l, "▫ How Plans Start", "▫ 약속의 시작"), ch04.initiation.headline, ch04.initiation.description),
    block(names, pick(l, "▫ Who Makes It Real", "▫ 현실화 담당"), ch04.realization.headline, ch04.realization.description),
    block(names, pick(l, "▫ Our Play Tempo", "▫ 우리의 놀이 템포"), ch04.tempo.headline, ch04.tempo.description),
    block(names, pick(l, "▫ How We Work Best Together", "▫ 둘이 가장 잘 움직이는 방식"), ch04.pairSynthesis.headline, ch04.pairSynthesis.description),
  ];
}

export function buildFriendChapter05Blocks(params: {
  intel: FriendResponseIntelligence;
  nameA: string;
  nameB: string;
  locale: Locale;
}): FriendVNextBlock[] {
  const ch05 = buildFriendChapter05Support(params);
  const names = [params.nameA, params.nameB];
  const l = params.locale;

  const myStyleHeadline = ch05.myStyle.map((s) => `${s.name}: ${s.headline}`).join(" · ");
  const myStyleDescription = ch05.myStyle.map((s) => `${s.name} — ${s.description}`).join(" / ");
  const myStyleCompare = ch05.myStyle.map((s) => ({ name: s.name, label: s.headline, body: s.description }));

  const whatIGiveHeadline = ch05.whatIGive.map((d) => `${d.giverName} → ${d.receiverName}`).join(" · ");
  const whatIGiveDescription = ch05.whatIGive.map((d) => `${d.giverName}→${d.receiverName}: ${d.description}`).join(" / ");
  const whatIGiveCompare = ch05.whatIGive.map((d) => ({
    name: pick(l, `${d.giverName} → ${d.receiverName}`, `${d.giverName} → ${d.receiverName}`),
    label: d.headline,
    body: d.description,
  }));

  return [
    block(names, pick(l, "◤ When I'm Struggling", "◤ 힘들 때 나는"), myStyleHeadline, myStyleDescription, myStyleCompare),
    block(names, pick(l, "◤ What I Give When You're Struggling", "◤ 이 친구가 힘들 때 내가 해주는 것"), whatIGiveHeadline, whatIGiveDescription, whatIGiveCompare),
    block(names, pick(l, "◤ Where Comfort Can Miss", "◤ 위로가 엇갈리는 순간"), ch05.mismatch.headline, ch05.mismatch.description),
    block(names, pick(l, "◤ What Actually Works For Us", "◤ 우리에게 잘 통하는 위로법"), ch05.whatWorks.headline, ch05.whatWorks.description),
  ];
}

export function buildFriendChapter06Blocks(params: {
  intel: FriendResponseIntelligence;
  nameA: string;
  nameB: string;
  locale: Locale;
}): FriendVNextBlock[] {
  const ch06 = buildFriendChapter06Conflict(params);
  const names = [params.nameA, params.nameB];
  const l = params.locale;

  const blocks: FriendVNextBlock[] = [];
  blocks.push(block(
    names,
    pick(l, "◤ When I'm Hurt", "◤ 내가 서운하면"),
    ch06.myReaction.map((r) => `${r.name}: ${r.headline}`).join(" · "),
    ch06.myReaction.map((r) => `${r.name} — ${r.description}`).join(" / "),
    ch06.myReaction.map((r) => ({ name: r.name, label: r.headline, body: r.description })),
  ));
  blocks.push(block(
    names,
    pick(l, "◤ How It Can Spiral", "◤ 우리가 싸우면 이렇게 꼬일 수 있어"),
    ch06.conflictLoop.headline,
    ch06.conflictLoop.steps.join(" → "),
  ));
  blocks.push(block(
    names,
    pick(l, "◤ What Especially Hurts Each of You", "◤ 각자가 특히 서운해지는 순간"),
    ch06.hurtMomentsSharedFraming ?? ch06.hurtMoments.map((h) => h.name).join(" · "),
    ch06.hurtMoments.map((h) => `${h.name}: ${h.triggers.map((t) => t.label).join(", ")}`).join(" / "),
    ch06.hurtMoments.map((h) => ({ name: h.name, body: h.triggers.map((t) => t.label).join(", ") })),
  ));
  blocks.push(block(
    names,
    pick(l, "◤ What Each of You Needs to Make Up", "◤ 화해할 때 각자 필요한 것"),
    ch06.repairNeeds.map((r) => `${r.name}: ${r.label}`).join(" · "),
    ch06.repairNeeds.map((r) => `${r.name} — ${r.label} (${r.nuance})`).join(" / "),
    ch06.repairNeeds.map((r) => ({ name: r.name, label: r.label, body: r.nuance })),
  ));
  blocks.push(block(
    names,
    pick(l, "◤ A Repair Order That Fits You Two", "◤ 우리에게 맞는 회복 순서"),
    ch06.repairSequence.headline,
    ch06.repairSequence.steps.join(" → "),
  ));
  return blocks;
}

export function buildFriendChapter07Blocks(params: {
  intel: FriendResponseIntelligence;
  nameA: string;
  nameB: string;
  locale: Locale;
}): FriendVNextBlock[] {
  const ch07 = buildFriendChapter07Boundary(params);
  const names = [params.nameA, params.nameB];
  const l = params.locale;
  const blocks: FriendVNextBlock[] = [];

  blocks.push(block(
    names,
    pick(l, "◤ What I Value in Friendship", "◤ 내가 우정에서 중요하게 보는 것"),
    ch07.myNeeds.map((n) => n.name).join(" · "),
    ch07.myNeeds.map((n) => `${n.name}: ${n.needs.map((x) => x.label).join(", ")}`).join(" / "),
    ch07.myNeeds.map((n) => ({ name: n.name, body: n.needs.map((x) => x.label).join(", ") })),
  ));
  blocks.push(block(
    names,
    pick(l, "◤ This Crosses a Line For Me", "◤ 이건 나에게 선을 넘는 행동"),
    ch07.myBoundaries.map((b) => b.name).join(" · "),
    ch07.myBoundaries.map((b) => `${b.name}: ${b.behaviors.map((x) => `${x.label} — ${x.why}`).join(" / ")}`).join(" // "),
    ch07.myBoundaries.map((b) => ({ name: b.name, body: b.behaviors.map((x) => `${x.label} — ${x.why}`).join(" / ") })),
  ));
  if (ch07.expectationAdjustments.length > 0) {
    blocks.push(block(
      names,
      pick(l, "◤ What's Better Not to Expect From This Friend", "◤ 이 친구에게 기대하지 않는 게 좋은 것"),
      ch07.expectationAdjustments.map((a) => a.name).join(" · "),
      ch07.expectationAdjustments.map((a) => `${a.name}: ${a.description}`).join(" / "),
      ch07.expectationAdjustments.map((a) => ({ name: a.name, label: a.headline, body: a.description })),
    ));
  }
  if (ch07.freedomToGive) {
    blocks.push(block(names, pick(l, "◤ The Room to Give Each Other", "◤ 서로에게 이 정도 자유는 주기"), ch07.freedomToGive.headline, ch07.freedomToGive.description));
  }
  return blocks;
}

export function buildFriendChapter08Blocks(params: {
  intel: FriendResponseIntelligence;
  nameA: string;
  nameB: string;
  locale: Locale;
}): FriendVNextBlock[] {
  const ch08 = buildFriendChapter08Distance(params);
  const names = [params.nameA, params.nameB];
  const l = params.locale;

  const maintenanceDescription =
    ch08.maintenanceMinimum.perPerson.length > 0
      ? [...ch08.maintenanceMinimum.perPerson.map((p) => `${p.name}: ${p.item}`), ...ch08.maintenanceMinimum.shared].join(" / ")
      : ch08.maintenanceMinimum.shared.join(", ");

  return [
    block(names, pick(l, "◤ Our Baseline Distance", "◤ 우리 우정의 기본 거리"), ch08.baseline.headline, ch08.baseline.description),
    block(
      names,
      pick(l, "◤ When Contact Goes Quiet, I...", "◤ 연락이 뜸해지면 나는"),
      ch08.silenceReading.map((s) => `${s.name}: ${s.label}`).join(" · "),
      ch08.silenceReading.map((s) => `${s.name} — ${s.reason}`).join(" / "),
      ch08.silenceReading.map((s) => ({ name: s.name, label: s.label, body: s.reason })),
    ),
    block(
      names,
      pick(l, "◤ What You Still Need, Even at a Distance", "◤ 자주 안 봐도 이것은 필요해"),
      ch08.maintenanceMinimum.headline,
      maintenanceDescription,
      ch08.maintenanceMinimum.perPerson.length > 0
        ? ch08.maintenanceMinimum.perPerson.map((p) => ({ name: p.name, body: p.item }))
        : undefined,
    ),
    block(names, pick(l, "◤ The Real Sign You're Drifting", "◤ 이러면 진짜 멀어지고 있다는 신호"), ch08.disengagementSignals.headline, ch08.disengagementSignals.items.join(", ")),
    block(names, pick(l, "◤ How This Friendship Lasts", "◤ 이 우정이 오래가는 방식"), ch08.howItLasts.headline, ch08.howItLasts.description),
  ];
}
