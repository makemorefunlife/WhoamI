import { buildEnrichmentReviewPackage } from "@/lib/relationship/enrichment/buildEnrichmentReviewPackage";
import * as fs from "node:fs";

const pkgKo = buildEnrichmentReviewPackage({
  domain: "family",
  caseId: "strong",
  locale: "ko-KR",
});

const pkgEn = buildEnrichmentReviewPackage({
  domain: "family",
  caseId: "strong",
  locale: "en-US",
});

if (!fs.existsSync("scratch")) {
  fs.mkdirSync("scratch", { recursive: true });
}

fs.writeFileSync(
  "scratch/family_review_output.json",
  JSON.stringify({ ko: pkgKo, en: pkgEn }, null, 2),
  "utf-8"
);
console.log("SUCCESS: Family review package written to scratch/family_review_output.json");
