import { buildEnrichmentReviewPackage } from "./lib/relationship/enrichment/buildEnrichmentReviewPackage";
import fs from "fs";

const pkg = buildEnrichmentReviewPackage({
  domain: "friend",
  caseId: "strong",
  locale: "ko",
});

fs.writeFileSync(
  "scratch/friend_review_output.json",
  JSON.stringify(pkg, null, 2),
  "utf-8"
);
console.log("Friend review package written to scratch/friend_review_output.json");
