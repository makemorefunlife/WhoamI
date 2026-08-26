"use client";

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

  // Modern VNext Marriage report requires canonical story plan or chapter intelligences
  const hasCanonicalPlan = Boolean(r.canonicalStoryPlan || r.canonicalBundle);
  const hasChapter08 = Boolean(r.chapter08Intelligence);
  const hasChapter07 = Boolean(r.chapter07Intelligence);
  const hasHouseholdDna = Boolean(household?.section_dna);

  return !(hasCanonicalPlan || (hasChapter08 && hasChapter07 && hasHouseholdDna));
}
