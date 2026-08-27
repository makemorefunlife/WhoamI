/**
 * Production Cache Staleness Guards for Relationship Reports.
 * Ensures that cached DB JSON payloads lacking current VNext canonical structures
 * are identified as stale, prompting dynamic regeneration or rejection.
 */

export function isStaleWorkReportBlock(payload: unknown): boolean {
  if (!payload || typeof payload !== "object") return true;
  const report = (payload as { report?: Record<string, unknown> }).report ?? payload;
  if (typeof report !== "object" || !report) return true;

  const office = (report as { office?: Record<string, unknown> }).office;
  if (!office || typeof office !== "object") return true;

  // Modern VNext Work report requires canonical role, mix fit, and respect sections
  const hasSectionRoles = Boolean(office.section_roles);
  const hasSectionMixFit = Boolean(office.section_mix_fit);
  const hasSectionRespect = Boolean(office.section_respect);

  return !(hasSectionRoles && hasSectionMixFit && hasSectionRespect);
}

export function isStaleCohabitationReportBlock(payload: unknown): boolean {
  if (!payload || typeof payload !== "object") return true;
  const report = (payload as { report?: Record<string, unknown> }).report ?? payload;
  if (typeof report !== "object" || !report) return true;

  const r = report as Record<string, unknown>;
  const household = r.household as Record<string, unknown> | undefined;
  const canonicalProjections = r.canonical_projections as Record<string, unknown> | undefined;
  const marriageCanonicalBundle = canonicalProjections?.marriage_canonical_bundle as
    | Record<string, unknown>
    | undefined;

  // Modern VNext Marriage report requires Chapter 07 AND Chapter 08
  // intelligence to actually be present inside the bundle — a bundle (or a
  // story plan) merely existing is NOT sufficient. buildMarriageCanonicalEngine
  // has generated chapter07Intelligence/chapter08Intelligence unconditionally
  // alongside the rest of the bundle since 2026-08-26; any report generated
  // before that date can have a truthy bundle while lacking both, which the
  // old (bundle-existence-only) check accepted as current. That let such
  // reports silently render a blank Chapter 08 and a degraded, null-psych
  // Chapter 07 as if they were up to date. Structural requirement, not a
  // date check — this stays correct as the schema grows further.
  const hasChapter08 = Boolean(marriageCanonicalBundle?.chapter08Intelligence);
  const hasChapter07 = Boolean(marriageCanonicalBundle?.chapter07Intelligence);
  const hasHouseholdDna = Boolean(household?.section_dna);

  return !(hasChapter07 && hasChapter08 && hasHouseholdDna);
}

export function isStaleFamilyReportBlock(payload: unknown): boolean {
  if (!payload || typeof payload !== "object") return true;
  const report = (payload as { report?: Record<string, unknown> }).report ?? payload;
  if (typeof report !== "object" || !report) return true;

  const r = report as Record<string, unknown>;
  const family = r.family as Record<string, unknown> | undefined;
  const canonicalProjections = r.canonical_projections as Record<string, unknown> | undefined;

  // Modern VNext Family report requires canonical story plan or household roles
  const hasStoryPlan = Boolean(canonicalProjections?.story_plan || r.canonicalStoryPlan);
  const hasHouseholdRoles = Boolean(family?.section_household_roles);
  const hasFamilySnapshot = Boolean(family?.section_snapshot);

  return !(hasStoryPlan || (hasHouseholdRoles && hasFamilySnapshot));
}

export function isStaleFriendReportBlock(payload: unknown): boolean {
  if (!payload || typeof payload !== "object") return true;
  const report = (payload as { report?: Record<string, unknown> }).report ?? payload;
  if (typeof report !== "object" || !report) return true;

  const r = report as Record<string, unknown>;
  const meta = r.meta as Record<string, unknown> | undefined;

  // Structural version guard — bumped for the Ch4-8 VNext rollout (Friend
  // Response Intelligence). Any report generated before this version lacks
  // canonical_bundle.responseIntelligence and must be treated as stale so it
  // gets regenerated rather than silently keep showing legacy Ch5-8 content.
  if (meta?.friend_engine_version !== "friend_vnext_ch1_ch8_v3_canonical") {
    return true;
  }

  const friend = (r.friend as Record<string, unknown> | undefined) ?? r;
  const dnaA = friend?.section_social_dna_a as Record<string, unknown> | undefined;
  const dnaB = friend?.section_social_dna_b as Record<string, unknown> | undefined;

  if (!dnaA || !dnaB) return true;

  const canonicalBundle = meta?.canonical_bundle as Record<string, unknown> | undefined;
  if (!canonicalBundle?.responseIntelligence) return true;

  return false;
}


