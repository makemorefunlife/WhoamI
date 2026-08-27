/**
 * Friend Chapter 4 — "같이 놀 때 우리는 어떤 팀인가"
 *
 * NOT part of the shared FriendResponseIntelligence core (spec §4/§13 — Ch4
 * answers a different question and is built separately, Wave 3).
 *
 * This is a thin PROJECTOR over already-live, already-evidence-based Friend
 * assets (spec §21 — audit before replacing):
 *   - buildFriendInitiativeRoleProfile()  → CH4-A (약속의 시작), part of CH4-B
 *   - buildFriendTravelPlayRoleProfile()  → CH4-B (현실화 담당), CH4-C (템포)
 * No raw chart facts are recomputed here.
 */
import type { Locale } from "@/lib/i18n/locale";
import type { PsychMasterJson } from "@/lib/personCore/types/psychMaster";
import type { FriendRuleContext } from "@/lib/relationship/friend/buildFriendRuleContext";
import {
  buildFriendInitiativeRoleProfile,
  buildFriendTravelPlayRoleProfile,
} from "@/lib/relationship/friend/canonical/friendPsychCoverageEngine";
import type {
  FriendInitiativeRoleProfile,
  FriendTravelPlayRoleProfile,
} from "@/lib/relationship/friend/canonical/friendCanonicalTypes";
import type { EvidenceRef } from "@/lib/relationship/friend/response/friendEvidenceTypes";
import { resolveConfidence } from "@/lib/relationship/friend/response/friendEvidenceTypes";

export type FriendTeamPlayRoleKey = "A_LEADS" | "B_LEADS" | "SHARED" | "CONTEXT_DEPENDENT";
export type FriendTeamPlayExecKey = "A_EXECUTES" | "B_EXECUTES" | "SHARED";
export type FriendTeamPlayTempoDimension = "NOVELTY_VS_FAMILIARITY" | "PLANNED_VS_SPONTANEOUS" | "PACKED_VS_RELAXED";
export type FriendTempoBand = "LOW" | "BALANCED" | "HIGH";

export type FriendChapter04TeamPlay = {
  initiation: {
    role: FriendTeamPlayRoleKey;
    leaderName?: string;
    headline: string;
    description: string;
    evidence: EvidenceRef[];
    confidence: ReturnType<typeof resolveConfidence>;
  };
  realization: {
    initiatorName: string;
    executorName: string;
    /** true when one person proposes ideas but a different person handles logistics. */
    isSplit: boolean;
    headline: string;
    description: string;
    evidence: EvidenceRef[];
    confidence: ReturnType<typeof resolveConfidence>;
  };
  tempo: {
    energyBand: FriendTempoBand;
    headline: string;
    description: string;
    evidence: EvidenceRef[];
    confidence: ReturnType<typeof resolveConfidence>;
  };
  pairSynthesis: {
    headline: string;
    description: string;
  };
};

function pick(locale: Locale, en: string, ko: string): string {
  return locale === "en-US" ? en : ko;
}

function nameParticleGa(name: string): string {
  if (!name) return name;
  const lastChar = name.charCodeAt(name.length - 1);
  const hasBatchim = (lastChar - 0xac00) % 28 !== 0;
  return hasBatchim ? `${name}이` : `${name}가`;
}

export function buildFriendChapter04TeamPlay(params: {
  /** Provide either `ctx` (computes fresh) or the already-computed `initiative`/`travelPlay` profiles (e.g. read back from a persisted report). */
  ctx?: FriendRuleContext;
  initiative?: FriendInitiativeRoleProfile;
  travelPlay?: FriendTravelPlayRoleProfile;
  nameA?: string;
  nameB?: string;
  psychA?: PsychMasterJson | null;
  psychB?: PsychMasterJson | null;
  locale?: Locale;
}): FriendChapter04TeamPlay {
  const locale = params.locale ?? params.ctx?.locale ?? "ko-KR";
  const { ctx, psychA, psychB } = params;
  const nameA = params.nameA ?? ctx?.nicknameA;
  const nameB = params.nameB ?? ctx?.nicknameB;
  if (!nameA || !nameB) throw new Error("buildFriendChapter04TeamPlay requires nameA/nameB (directly, or via ctx)");

  const initiative: FriendInitiativeRoleProfile =
    params.initiative ?? (ctx ? buildFriendInitiativeRoleProfile({ ctx, psychA, psychB, locale }) : undefined!);
  const travelPlay: FriendTravelPlayRoleProfile =
    params.travelPlay ?? (ctx ? buildFriendTravelPlayRoleProfile({ ctx, psychA, psychB, locale }) : undefined!);
  if (!initiative || !travelPlay) throw new Error("buildFriendChapter04TeamPlay requires either ctx or precomputed initiative/travelPlay profiles");

  // ---------------------------------------------------------------------
  // CH4-A ◤ 약속의 시작
  // ---------------------------------------------------------------------
  const initiationEvidence: EvidenceRef[] = [];
  if (psychA?.secondary_axes?.energy_style !== undefined || psychB?.secondary_axes?.energy_style !== undefined) {
    initiationEvidence.push({
      source: "PSYCH_11", key: "energy_style", polarity: "SUPPORTS", strength: "PRIMARY",
      rawValue: `${psychA?.secondary_axes?.energy_style ?? "n/a"}/${psychB?.secondary_axes?.energy_style ?? "n/a"}`,
    });
  }
  initiationEvidence.push({
    source: "EXISTING_FRIEND_INTELLIGENCE", key: "contactInitiator", polarity: "SUPPORTS", strength: "PRIMARY",
    rawValue: initiative.contactInitiator,
  });

  let initiationRole: FriendTeamPlayRoleKey = "SHARED";
  let leaderName: string | undefined;
  if (initiative.contactInitiator === "A_initiates") { initiationRole = "A_LEADS"; leaderName = nameA; }
  else if (initiative.contactInitiator === "B_initiates") { initiationRole = "B_LEADS"; leaderName = nameB; }
  else if (initiative.planningLead === "A_leads") { initiationRole = "CONTEXT_DEPENDENT"; leaderName = nameA; }
  else if (initiative.planningLead === "B_leads") { initiationRole = "CONTEXT_DEPENDENT"; leaderName = nameB; }

  let initiationHeadline: string;
  let initiationDescription: string;
  if (initiationRole === "A_LEADS" || initiationRole === "B_LEADS") {
    initiationHeadline = pick(locale, `${leaderName} tends to open the plan`, `${nameParticleGa(leaderName!)} 먼저 판을 여는 편`);
    initiationDescription = pick(
      locale,
      `${leaderName} tends to bring up a new place or thing to do first, sparking the plan.`,
      `새로운 장소나 할 일을 먼저 꺼내 약속의 시작점을 만드는 쪽이에요.`,
    );
  } else if (initiationRole === "CONTEXT_DEPENDENT") {
    initiationHeadline = pick(locale, `${leaderName} usually shapes the plan once it starts`, `${nameParticleGa(leaderName!)} 일정을 구체화하는 쪽`);
    initiationDescription = pick(
      locale,
      `Either of you can bring up the idea, but ${leaderName} is the one who turns it into an actual plan.`,
      `누가 먼저 말을 꺼내든, 실제 일정으로 다듬는 쪽은 ${leaderName}일 때가 많아요.`,
    );
  } else {
    initiationHeadline = pick(locale, "You both open plans about equally", "둘 다 비슷하게 먼저 제안하는 편");
    initiationDescription = pick(
      locale,
      "Neither of you consistently waits for the other — whoever has the idea first brings it up.",
      "한쪽이 늘 기다리기보다, 그때그때 생각난 쪽이 자연스럽게 먼저 말을 꺼내요.",
    );
  }

  // ---------------------------------------------------------------------
  // CH4-B ◤ 현실화 담당 — distinguish INITIATOR (idea) from EXECUTOR (logistics)
  // ---------------------------------------------------------------------
  const realizationEvidence: EvidenceRef[] = [
    { source: "EXISTING_FRIEND_INTELLIGENCE", key: "ideaCreator", polarity: "SUPPORTS", strength: "PRIMARY", rawValue: travelPlay.ideaCreator },
    { source: "EXISTING_FRIEND_INTELLIGENCE", key: "practicalExecutor", polarity: "SUPPORTS", strength: "PRIMARY", rawValue: travelPlay.practicalExecutor },
  ];
  if (psychA?.secondary_axes?.practicality !== undefined || psychB?.secondary_axes?.practicality !== undefined) {
    realizationEvidence.push({ source: "PSYCH_11", key: "practicality", polarity: "SUPPORTS", strength: "SECONDARY" });
  }

  const isSplit = travelPlay.ideaCreator !== travelPlay.practicalExecutor;
  const realizationHeadline = isSplit
    ? pick(locale, `${travelPlay.ideaCreator} sparks it, ${travelPlay.practicalExecutor} makes it happen`, `${travelPlay.ideaCreator}이(가) 아이디어를 내면 ${travelPlay.practicalExecutor}이(가) 실행에 옮겨요`)
    : pick(locale, `${travelPlay.practicalExecutor} both proposes and handles it`, `${travelPlay.practicalExecutor}이(가) 아이디어부터 실행까지 다 챙기는 편`);
  const realizationDescription = isSplit
    ? pick(
        locale,
        `${travelPlay.ideaCreator} throws out the idea, but it's ${travelPlay.practicalExecutor} who actually books, schedules, and confirms it.`,
        `${travelPlay.ideaCreator}이(가) "이거 하자"고 던지면, 실제로 예약하고 일정을 확정하는 건 ${travelPlay.practicalExecutor}이(가) 맡아요.`,
      )
    : pick(
        locale,
        `${travelPlay.practicalExecutor} doesn't just suggest things — they also see them through to an actual plan.`,
        `${travelPlay.practicalExecutor}은(는) 제안만 하고 끝내지 않고, 실제 일정으로 만드는 것까지 스스로 해내는 편이에요.`,
      );

  // ---------------------------------------------------------------------
  // CH4-C ◤ 우리의 놀이 템포 — translate energyPace enum to natural Korean
  // ---------------------------------------------------------------------
  const tempoEvidence: EvidenceRef[] = [];
  if (psychA?.secondary_axes?.stimulation !== undefined) tempoEvidence.push({ source: "PSYCH_11", key: "stimulation", personId: "a", polarity: "SUPPORTS", strength: "PRIMARY", rawValue: psychA.secondary_axes.stimulation });
  if (psychB?.secondary_axes?.stimulation !== undefined) tempoEvidence.push({ source: "PSYCH_11", key: "stimulation", personId: "b", polarity: "SUPPORTS", strength: "PRIMARY", rawValue: psychB.secondary_axes.stimulation });

  const energyBand = resolveTravelPlayEnergyBand(travelPlay.energyPace);
  const { headline: tempoHeadline, description: tempoDescription } = resolveTravelPlayEnergyPaceCopy(travelPlay.energyPace, locale);

  // ---------------------------------------------------------------------
  // CH4-D ◤ 둘이 가장 잘 움직이는 방식 — pair synthesis ONLY, no new analysis
  // ---------------------------------------------------------------------
  const synthesisHeadline = pick(
    locale,
    `${initiationRole === "SHARED" ? "Either of you" : leaderName} opens it, ${travelPlay.practicalExecutor} locks it in`,
    `${initiationRole === "SHARED" ? "둘 중 누구든" : leaderName} 판을 열고, ${travelPlay.practicalExecutor}이(가) 확정 짓는 흐름`,
  );
  const synthesisDescription = pick(
    locale,
    `That combination of ${initiationRole === "SHARED" ? "shared initiative" : `${leaderName}'s initiative`} and ${travelPlay.practicalExecutor}'s follow-through is what actually gets plans off the ground.`,
    `${initiationRole === "SHARED" ? "둘 다 자연스럽게 먼저 말을 꺼내는 것" : `${leaderName}이(가) 먼저 판을 여는 것`}과 ${travelPlay.practicalExecutor}이(가) 실행까지 챙기는 것, 이 조합이 실제로 약속을 성사시키는 힘이에요.`,
  );

  return {
    initiation: {
      role: initiationRole,
      leaderName,
      headline: initiationHeadline,
      description: initiationDescription,
      evidence: initiationEvidence,
      confidence: resolveConfidence(initiationEvidence),
    },
    realization: {
      initiatorName: travelPlay.ideaCreator,
      executorName: travelPlay.practicalExecutor,
      isSplit,
      headline: realizationHeadline,
      description: realizationDescription,
      evidence: realizationEvidence,
      confidence: resolveConfidence(realizationEvidence),
    },
    tempo: {
      energyBand,
      headline: tempoHeadline,
      description: tempoDescription,
      evidence: tempoEvidence,
      confidence: resolveConfidence(tempoEvidence),
    },
    pairSynthesis: {
      headline: synthesisHeadline,
      description: synthesisDescription,
    },
  };
}

/**
 * Translates the raw travelPlayRole.energyPace enum into a natural-language
 * tempo band. Exported so any other consumer of FriendTravelPlayRoleProfile
 * (e.g. the Ch4 view-model card) can stop leaking the machine string
 * ("balanced_exploration" etc.) directly into rendered copy.
 */
export function resolveTravelPlayEnergyBand(
  energyPace: FriendTravelPlayRoleProfile["energyPace"] | null | undefined,
): FriendTempoBand {
  if (energyPace === "dense_itinerary") return "HIGH";
  if (energyPace === "low_stimulation_relax") return "LOW";
  return "BALANCED";
}

export function resolveTravelPlayEnergyPaceCopy(
  energyPace: FriendTravelPlayRoleProfile["energyPace"] | null | undefined,
  locale: Locale,
): { energyBand: FriendTempoBand; headline: string; description: string } {
  const energyBand = resolveTravelPlayEnergyBand(energyPace);
  if (energyBand === "HIGH") {
    return {
      energyBand,
      headline: pick(locale, "You pack the day full", "일정을 빽빽하게 채우는 편"),
      description: pick(
        locale,
        "You'd rather do a lot in one day than leave big blank stretches of time.",
        "여유 시간을 길게 남기기보다, 하루에 이것저것 채워 넣는 걸 더 좋아하는 조합이에요.",
      ),
    };
  }
  if (energyBand === "LOW") {
    return {
      energyBand,
      headline: pick(locale, "You keep the pace relaxed", "여유 있게 흘러가는 템포를 좋아함"),
      description: pick(
        locale,
        "Fewer things, more downtime — you'd rather not rush from one thing to the next.",
        "일정 개수를 줄이고 쉬는 시간을 충분히 두는 쪽을 편하게 느끼는 조합이에요.",
      ),
    };
  }
  return {
    energyBand,
    headline: pick(locale, "You balance activity and rest", "활동과 휴식을 적당히 섞는 편"),
    description: pick(
      locale,
      "You mix a planned highlight or two with open, unstructured time.",
      "핵심 일정 한두 개를 잡아두고, 나머지는 자유롭게 흘러가도록 두는 조합이에요.",
    ),
  };
}
