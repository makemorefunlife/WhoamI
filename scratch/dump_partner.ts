import { buildEnrichmentReviewPackage } from "@/lib/relationship/enrichment/buildEnrichmentReviewPackage";
import * as fs from "node:fs";

const pkgKo = buildEnrichmentReviewPackage({
  domain: "partner",
  caseId: "strong",
  locale: "ko-KR",
});

const pkgEn = buildEnrichmentReviewPackage({
  domain: "partner",
  caseId: "strong",
  locale: "en-US",
});

if (!fs.existsSync("scratch")) {
  fs.mkdirSync("scratch", { recursive: true });
}

fs.writeFileSync(
  "scratch/partner_review_output.json",
  JSON.stringify({ ko: pkgKo, en: pkgEn }, null, 2),
  "utf-8"
);
console.log("SUCCESS: Partner review package written to scratch/partner_review_output.json");
