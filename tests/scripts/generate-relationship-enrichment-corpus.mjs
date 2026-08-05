/**
 * Generate Relationship Incremental Enrichment corpus JSON.
 * Run from enrichment worktree:
 *   npx tsx tests/scripts/generate-relationship-enrichment-corpus.mjs
 *
 * Writes to tests/artifacts/relationship-enrichment/baseline/
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  CORPUS_CASES,
  ENRICHMENT_DOMAINS,
} from "../../lib/relationship/enrichment/corpusCases.ts";
import { buildEnrichmentReviewPackage } from "../../lib/relationship/enrichment/buildEnrichmentReviewPackage.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");
const bucket = process.env.CORPUS_BUCKET === "after" ? "after" : "baseline";
const outRoot = path.join(
  root,
  `tests/artifacts/relationship-enrichment/${bucket}`,
);

const locales = ["ko-KR", "en-US"];
const domains = process.env.DOMAIN
  ? [process.env.DOMAIN]
  : ENRICHMENT_DOMAINS;
const cases = process.env.CASE
  ? CORPUS_CASES.filter((c) => c.id === process.env.CASE)
  : CORPUS_CASES;

fs.mkdirSync(outRoot, { recursive: true });

const index = [];
let ok = 0;
let fail = 0;

for (const domain of domains) {
  for (const c of cases) {
    for (const locale of locales) {
      const tag = `${domain}/${c.id}/${locale}`;
      try {
        const pkg = buildEnrichmentReviewPackage({
          domain,
          caseId: c.id,
          locale,
        });
        const dir = path.join(outRoot, domain, c.id);
        fs.mkdirSync(dir, { recursive: true });
        const file = path.join(dir, `${locale}.json`);
        fs.writeFileSync(file, JSON.stringify(pkg, null, 2), "utf8");

        // Slim card for quick human scan
        const slim = {
          domain: pkg.domain,
          caseId: pkg.caseId,
          locale: pkg.locale,
          case_meta: pkg.case_meta,
          current_summary: pkg.current.summary,
          current_sections: pkg.current.view_model_sections,
          v1_inventory: pkg.v1.inventory,
          v1_projection_keys: pkg.v1.projections
            ? Object.keys(pkg.v1.projections)
            : [],
          dev_evidence: pkg.dev.evidence,
          dev_lenses: pkg.dev.lenses.map((l) => ({
            id: l.lens_id,
            headline: l.headline_ko,
            abstain: l.is_abstaining,
            confidence: l.confidence,
          })),
          narrative_scenes: (pkg.dev.narrative?.scenes ?? []).map((s) => ({
            n: s.scene_number,
            id: s.scene_id,
            title_ko: s.title_ko,
            title_en: s.title_en,
            recognition:
              locale === "en-US"
                ? s.beats?.recognition?.en
                : s.beats?.recognition?.ko,
            action:
              locale === "en-US" ? s.beats?.action?.en : s.beats?.action?.ko,
          })),
        };
        fs.writeFileSync(
          path.join(dir, `${locale}.slim.json`),
          JSON.stringify(slim, null, 2),
          "utf8",
        );

        index.push({
          tag,
          file: path.relative(root, file).replace(/\\/g, "/"),
          headline: pkg.current.summary.headline,
          sections: pkg.current.view_model_sections.length,
          lenses_active: pkg.dev.evidence.active_lenses,
        });
        ok += 1;
        console.log(`ok  ${tag} — ${pkg.current.summary.headline}`);
      } catch (err) {
        fail += 1;
        console.error(`FAIL ${tag}`, err);
        index.push({ tag, error: String(err?.stack ?? err) });
      }
    }
  }
}

fs.writeFileSync(
  path.join(outRoot, "index.json"),
  JSON.stringify(
    {
      generated_at: new Date().toISOString(),
      ok,
      fail,
      total: ok + fail,
      entries: index,
    },
    null,
    2,
  ),
  "utf8",
);

console.log(`\nDone. ok=${ok} fail=${fail} → ${outRoot}`);
if (fail > 0) process.exit(1);
