/**
 * DEV-only Relationship Incremental Enrichment review surface.
 * Query: ?domain=friend|work|family|partner&case=strong&locale=ko-KR|en-US&mode=current|v1|dev
 * Production relationship routes are untouched.
 */
import { notFound } from "next/navigation";
import { EnrichmentReviewClient } from "./EnrichmentReviewClient";
import type { EnrichmentDomain, CorpusCaseId } from "@/lib/relationship/enrichment/corpusCases";
import {
  CORPUS_CASES,
  ENRICHMENT_DOMAINS,
} from "@/lib/relationship/enrichment/corpusCases";
import { buildEnrichmentReviewPackage } from "@/lib/relationship/enrichment/buildEnrichmentReviewPackage";
import type { Locale } from "@/lib/i18n/locale";

export const dynamic = "force-dynamic";
export const robots = { index: false, follow: false };

const MODES = ["current", "v1", "previous_dev", "final_dev", "dev"] as const;

type Search = {
  domain?: string;
  case?: string;
  locale?: string;
  mode?: string;
};

export default async function RelationshipEnrichmentReviewPage({
  searchParams,
}: {
  searchParams: Promise<Search> | Search;
}) {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_ENRICHMENT_DEV !== "1") {
    notFound();
  }

  const sp = await Promise.resolve(searchParams);
  const domain = (ENRICHMENT_DOMAINS.includes(sp.domain as EnrichmentDomain)
    ? sp.domain
    : "friend") as EnrichmentDomain;
  const caseId = (CORPUS_CASES.some((c) => c.id === sp.case)
    ? sp.case
    : "strong") as CorpusCaseId;
  const locale = (sp.locale === "en-US" ? "en-US" : "ko-KR") as Locale;
  const rawMode = MODES.includes(sp.mode as (typeof MODES)[number])
    ? (sp.mode as (typeof MODES)[number])
    : "final_dev";
  const mode = rawMode === "dev" ? "final_dev" : rawMode;

  let pkg = null as ReturnType<typeof buildEnrichmentReviewPackage> | null;
  let error: string | null = null;
  try {
    pkg = buildEnrichmentReviewPackage({ domain, caseId, locale });
  } catch (e) {
    error = e instanceof Error ? e.stack ?? e.message : String(e);
  }

  return (
    <main className="min-h-screen bg-[#0c0a0f] text-white">
      <EnrichmentReviewClient
        domain={domain}
        caseId={caseId}
        locale={locale}
        mode={mode}
        pkg={pkg}
        error={error}
        cases={CORPUS_CASES.map((c) => ({
          id: c.id,
          label_ko: c.label_ko,
          label_en: c.label_en,
        }))}
        domains={[...ENRICHMENT_DOMAINS]}
      />
    </main>
  );
}
