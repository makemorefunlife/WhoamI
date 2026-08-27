/**
 * Production Cache Staleness Guards for Relationship Reports.
 * Ensures that cached DB JSON payloads lacking current VNext canonical structures
 * are identified as stale, prompting dynamic regeneration or rejection.
 *
 * Phase 3A: each guard is now version-first — meta.report_schema_version
 * must exactly match that vertical's current *_REPORT_SCHEMA_VERSION
 * constant (exact equality, not >=: a payload claiming a newer version than
 * this running code understands is just as unsafe to render as an older
 * one). A missing/older/newer version is stale outright, including records
 * persisted before this field existed — their structure is never inspected
 * to "grandfather" them in, since that's exactly the bug class (a
 * structural check silently falling behind schema growth) this closes. The
 * structural checks below remain as a secondary layer: even a report
 * claiming the current version must still have the mandatory current
 * fields, protecting against partial writes, corrupted payloads, or a
 * failed generation that still updated the version field.
 *
 * Phase 3B adds a second, independent version check: meta.analysis_engine_version
 * must exactly match that vertical's current *_ANALYSIS_ENGINE_VERSION
 * constant, same exact-equality/no-grandfathering rule as report_schema_version.
 * report_schema_version gates persisted STRUCTURE; analysis_engine_version
 * gates the deterministic ANALYTICAL LOGIC that produced it — a report can
 * have the current shape while having been generated under an old/buggy
 * scoring or classification algorithm (exactly what this phase fixed for
 * Marriage and Family), so both must independently agree before a report is
 * treated as current.
 */
import { WORK_REPORT_SCHEMA_VERSION, WORK_ANALYSIS_ENGINE_VERSION } from "./workColleague/buildWorkColleagueReport";
import { MARRIAGE_REPORT_SCHEMA_VERSION, MARRIAGE_ANALYSIS_ENGINE_VERSION } from "./marriage/buildMarriageReport";
import { FAMILY_REPORT_SCHEMA_VERSION, FAMILY_ANALYSIS_ENGINE_VERSION } from "./familyParent/buildFamilyParentReport";
import { FRIEND_REPORT_SCHEMA_VERSION, FRIEND_ANALYSIS_ENGINE_VERSION } from "./friend/buildFriendReport";

export function isStaleWorkReportBlock(payload: unknown): boolean {
  if (!payload || typeof payload !== "object") return true;
  const report = (payload as { report?: Record<string, unknown> }).report ?? payload;
  if (typeof report !== "object" || !report) return true;

  const r = report as Record<string, unknown>;
  const meta = r.meta as Record<string, unknown> | undefined;
  if (meta?.report_schema_version !== WORK_REPORT_SCHEMA_VERSION) return true;
  if (meta?.analysis_engine_version !== WORK_ANALYSIS_ENGINE_VERSION) return true;

  const office = r.office as Record<string, unknown> | undefined;
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
  const meta = r.meta as Record<string, unknown> | undefined;
  if (meta?.report_schema_version !== MARRIAGE_REPORT_SCHEMA_VERSION) return true;
  if (meta?.analysis_engine_version !== MARRIAGE_ANALYSIS_ENGINE_VERSION) return true;

  const household = r.household as Record<string, unknown> | undefined;
  const canonicalProjections = r.canonical_projections as Record<string, unknown> | undefined;
  const marriageCanonicalBundle = canonicalProjections?.marriage_canonical_bundle as
    | Record<string, unknown>
    | undefined;

  // Phase 1 fix, unchanged: modern VNext Marriage report requires Chapter 07
  // AND Chapter 08 intelligence to actually be present inside the bundle —
  // a bundle (or a story plan) merely existing is NOT sufficient. See the
  // Fallback Remediation Phase 1 report for the 2026-08-13→08-25 incident
  // this closed. Kept as the secondary structural layer under the new
  // version-first check above.
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
  const meta = r.meta as Record<string, unknown> | undefined;
  if (meta?.report_schema_version !== FAMILY_REPORT_SCHEMA_VERSION) return true;
  if (meta?.analysis_engine_version !== FAMILY_ANALYSIS_ENGINE_VERSION) return true;

  const family = r.family as Record<string, unknown> | undefined;
  const canonicalProjections = r.canonical_projections as Record<string, unknown> | undefined;
  const storyPlan = (canonicalProjections?.story_plan ?? r.canonicalStoryPlan) as
    | Record<string, unknown>
    | undefined;

  // Modern VNext Family report requires canonical story plan or household roles
  const hasStoryPlan = Boolean(storyPlan);
  const hasHouseholdRoles = Boolean(family?.section_household_roles);
  const hasFamilySnapshot = Boolean(family?.section_snapshot);

  // Phase 3B (F4 fix): a story_plan merely existing is not sufficient — the
  // client view model (buildFamilyReportViewModel) used to silently
  // reconstruct growthChapterBundle/repairChapterBundle/actionChapterBundle
  // from incomplete, misattributed data whenever any of the three was
  // missing (see the F1/F2 fix there). That reconstruction path has been
  // removed; a story_plan lacking any of these three bundles must now be
  // treated as stale so the report regenerates with buildCanonicalFamilyStoryPlan's
  // real, role-correct evidence instead of silently rendering thinner or
  // misattributed content.
  const hasCompleteChapterBundles = Boolean(
    storyPlan?.growthChapterBundle &&
      storyPlan?.repairChapterBundle &&
      storyPlan?.actionChapterBundle,
  );

  if (hasStoryPlan) return !hasCompleteChapterBundles;
  return !(hasHouseholdRoles && hasFamilySnapshot);
}

export function isStaleFriendReportBlock(payload: unknown): boolean {
  if (!payload || typeof payload !== "object") return true;
  const report = (payload as { report?: Record<string, unknown> }).report ?? payload;
  if (typeof report !== "object" || !report) return true;

  const r = report as Record<string, unknown>;
  const meta = r.meta as Record<string, unknown> | undefined;
  if (meta?.report_schema_version !== FRIEND_REPORT_SCHEMA_VERSION) return true;
  if (meta?.analysis_engine_version !== FRIEND_ANALYSIS_ENGINE_VERSION) return true;

  // friend_engine_version remains a secondary subsystem signal (names the
  // narrative/character engine, not the full persisted structural
  // contract) — kept because other logic/tests still depend on it, per
  // Phase 3A's instruction not to remove it.
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
