import { buildEnrichmentReviewPackage } from "../../lib/relationship/enrichment/buildEnrichmentReviewPackage";
import { CORPUS_CASES } from "../../lib/relationship/enrichment/corpusCases";

console.log("=== Testing Friend Enriched Mode Across All Corpus Cases ===");

let passed = 0;
let failed = 0;

for (const caseDef of CORPUS_CASES) {
  for (const locale of ["ko-KR", "en-US"] as const) {
    try {
      const pkg = buildEnrichmentReviewPackage({
        domain: "friend",
        caseId: caseDef.id,
        locale,
      });

      // 1. Check current baseline
      if (!pkg.current || !pkg.current.report || !pkg.current.view_model_sections) {
        throw new Error(`Missing current package data for case ${caseDef.id} [${locale}]`);
      }

      // 2. Check current_enriched
      if (!pkg.current_enriched || !pkg.current_enriched.report || !pkg.current_enriched.view_model_sections) {
        throw new Error(`Missing current_enriched package data for case ${caseDef.id} [${locale}]`);
      }

      // 3. Verify section count & type equality (Design & Structure preservation!)
      const currentSectionTypes = pkg.current.view_model_sections.map((s) => s.type);
      const enrichedSectionTypes = pkg.current_enriched.view_model_sections.map((s) => s.type);
      if (currentSectionTypes.length !== enrichedSectionTypes.length) {
        throw new Error(
          `Section count mismatch: current=${currentSectionTypes.length}, enriched=${enrichedSectionTypes.length}`,
        );
      }
      for (let i = 0; i < currentSectionTypes.length; i++) {
        if (currentSectionTypes[i] !== enrichedSectionTypes[i]) {
          throw new Error(
            `Section order mismatch at index ${i}: current=${currentSectionTypes[i]}, enriched=${enrichedSectionTypes[i]}`,
          );
        }
      }

      // 4. Verify enriched content enhancements
      const enrichedReport = pkg.current_enriched.report as any;
      if (!enrichedReport.headline || typeof enrichedReport.headline !== "string") {
        throw new Error("Missing enriched headline");
      }
      if (locale === "ko-KR") {
        if (!enrichedReport.headline.includes("영혼을 나눈 환상의 덤앤더머")) {
          throw new Error("KO headline does not contain expected enriched phrasing");
        }
      } else {
        if (!enrichedReport.headline.includes("Soulmate Partners in Crime")) {
          throw new Error("EN headline does not contain expected enriched phrasing");
        }
      }

      // 5. Verify dev_evidence mode
      if (!pkg.dev_evidence || !pkg.dev_evidence.evidence || !pkg.dev_evidence.lenses) {
        throw new Error("Missing dev_evidence mode data");
      }

      passed++;
    } catch (err) {
      console.error(`❌ Failed case ${caseDef.id} [${locale}]:`, err);
      failed++;
    }
  }
}

console.log(`\nResults: ${passed} passed, ${failed} failed.`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log("✅ All Friend Enriched test cases passed with 100% section design preservation!");
}
