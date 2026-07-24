/**
 * Friendship travel_planner — typed canonical projection.
 * Resolver: refineTravelStyleSplit (wrap only — no re-resolve).
 * Independent of treasurer and hangout_planning.
 */
import type { CanonicalJudgment } from "@/lib/relationship/contextEngine/canonicalJudgment";
import type { FriendTravelStyleSplit } from "./friendPsychFit";

export const FRIEND_TRAVEL_PLANNER_CANONICAL_SOURCE =
  "refineTravelStyleSplit" as const;

export const FRIEND_TRAVEL_PLANNER_PERSISTENCE_PATH =
  "canonical_projections.travel_planner" as const;

export const FRIEND_TRAVEL_PLANNER_CLIENT_PATH =
  "canonical_projections.travel_planner" as const;

export const FRIEND_TRAVEL_PLANNER_PSYCH_MODE_WITH_PSYCH = "soft" as const;
export const FRIEND_TRAVEL_PLANNER_PSYCH_MODE_LEGACY = "none" as const;

export type FriendTravelPlannerValue = {
  planner_side: "a" | "b";
  align?: "confirms" | "caution";
  confidence?: "high" | "low";
};

export type FriendTravelPlannerCanonical =
  CanonicalJudgment<FriendTravelPlannerValue>;

function cloneValue(v: FriendTravelPlannerValue): FriendTravelPlannerValue {
  return {
    planner_side: v.planner_side,
    ...(v.align ? { align: v.align } : {}),
    ...(v.confidence ? { confidence: v.confidence } : {}),
  };
}

/** Map finalized travel split + nicknames → typed side (no re-resolve). */
export function travelPlannerValueFromSplit(
  split: FriendTravelStyleSplit | null | undefined,
  nicknameA: string,
  nicknameB: string,
): FriendTravelPlannerValue | null {
  if (!split?.planner?.nickname) return null;
  let planner_side: "a" | "b" | null = null;
  if (split.planner.nickname === nicknameA) planner_side = "a";
  else if (split.planner.nickname === nicknameB) planner_side = "b";
  if (!planner_side) return null;
  return {
    planner_side,
    ...(split.align ? { align: split.align } : {}),
    ...(split.confidence ? { confidence: split.confidence } : {}),
  };
}

export function buildFriendTravelPlannerCanonical(
  finalized: FriendTravelPlannerValue | null | undefined,
): FriendTravelPlannerCanonical | null {
  if (!finalized) return null;
  const psychApplied =
    finalized.align != null || finalized.confidence != null;
  return {
    value: cloneValue(finalized),
    source: FRIEND_TRAVEL_PLANNER_CANONICAL_SOURCE,
    psychMode: psychApplied
      ? FRIEND_TRAVEL_PLANNER_PSYCH_MODE_WITH_PSYCH
      : FRIEND_TRAVEL_PLANNER_PSYCH_MODE_LEGACY,
    ...(finalized.confidence ? { confidence: finalized.confidence } : {}),
    ...(finalized.align ? { align: finalized.align } : {}),
    persistencePath: FRIEND_TRAVEL_PLANNER_PERSISTENCE_PATH,
  };
}

export function buildFriendTravelPlannerClientProjection(
  value: FriendTravelPlannerValue | null | undefined,
): FriendTravelPlannerValue | null {
  if (!value) return null;
  return cloneValue(value);
}

type ReportWithProjections = {
  canonical_projections?: {
    travel_planner?: unknown;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export function injectFriendTravelPlannerClientProjection<
  T extends ReportWithProjections,
>(report: T, projection: FriendTravelPlannerValue | null | undefined): T {
  const { canonical_projections: prior, ...rest } = report;
  const priorRest =
    prior && typeof prior === "object"
      ? Object.fromEntries(
          Object.entries(prior).filter(([k]) => k !== "travel_planner"),
        )
      : {};
  if (!projection) {
    if (Object.keys(priorRest).length === 0) return rest as T;
    return { ...(rest as T), canonical_projections: priorRest };
  }
  return {
    ...(rest as T),
    canonical_projections: {
      ...priorRest,
      travel_planner: cloneValue(projection),
    },
  };
}

export function readFriendTravelPlannerCanonicalProjection(
  report:
    | { canonical_projections?: { travel_planner?: unknown } }
    | null
    | undefined,
): FriendTravelPlannerValue | null {
  const raw = report?.canonical_projections?.travel_planner;
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.planner_side !== "a" && o.planner_side !== "b") return null;
  const align =
    o.align === "confirms" || o.align === "caution" ? o.align : undefined;
  const confidence =
    o.confidence === "high" || o.confidence === "low"
      ? o.confidence
      : undefined;
  if (o.align !== undefined && !align) return null;
  if (o.confidence !== undefined && !confidence) return null;
  return {
    planner_side: o.planner_side,
    ...(align ? { align } : {}),
    ...(confidence ? { confidence } : {}),
  };
}

export function formatFriendTravelPlannerCanonicalLabel(
  value: FriendTravelPlannerValue,
  params: { nameA: string; nameB: string; locale?: string | null },
): string {
  const en =
    params.locale === "en" ||
    params.locale === "en-US" ||
    Boolean(params.locale?.startsWith("en"));
  const planner =
    value.planner_side === "a" ? params.nameA : params.nameB;
  let base = en
    ? `${planner} plans the itinerary`
    : `${planner} 쪽이 일정·동선 계획`;
  if (value.align === "confirms") {
    base = en ? `${base} · confirmed` : `${base} · 보강 일치`;
  } else if (value.align === "caution") {
    base = en ? `${base} · caution` : `${base} · 보강 주의`;
  }
  return base;
}

export function travelPlannerJudgmentFields(
  v: FriendTravelPlannerValue | null | undefined,
): FriendTravelPlannerValue | null {
  if (!v) return null;
  return cloneValue(v);
}
