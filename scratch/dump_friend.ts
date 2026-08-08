import { buildEnrichmentReviewPackage } from "@/lib/relationship/enrichment/buildEnrichmentReviewPackage";
import * as fs from "node:fs";

const pkg = buildEnrichmentReviewPackage({
  domain: "friend",
  caseId: "strong",
  locale: "ko-KR",
});

if (!fs.existsSync("scratch")) {
  fs.mkdirSync("scratch", { recursive: true });
}

fs.writeFileSync(
  "scratch/friend_review_output.json",
  JSON.stringify(pkg, null, 2),
  "utf-8"
);
console.log("SUCCESS: Friend review package written to scratch/friend_review_output.json");
