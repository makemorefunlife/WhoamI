/**
 * Personal deep report: view vs generate separation, per-language storage,
 * no-survey rule. Run: npx tsx tests/unit/personal-locale-view.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  decidePersonalDeepPost,
  decidePersonalDeepView,
} from "../../lib/report/personalDeepEssenceView";
import { runPersonalDeepEssenceGeneration } from "../../lib/report/personalDeepEssenceGeneration";
import { buildDeepEssenceStructuredPartAUserPrompt } from "../../lib/prompts/deepEssenceStructured";
import { buildSurveyAnalysisForSlimV1 } from "../../lib/v1/slim/surveyAnalysis";
import type { SlimV1ReportResult } from "../../lib/v1/slim/types";

const slim = (report: string) => ({ report, llm_source: "llm", structured: null }) as unknown as SlimV1ReportResult;
const row = (locale: string | undefined, report: string) =>
  JSON.stringify(locale ? { locale, slim_v1: slim(report) } : { slim_v1: slim(report) });

let passed = 0;
const ok = (name: string, fn: () => void | Promise<void>) =>
  Promise.resolve(fn()).then(() => {
    passed++;
    console.log(`ok - ${name}`);
  });

async function main() {
  // ── View rules ──────────────────────────────────────────────────────────
  await ok("per-language row is served for its language only", () => {
    const rows = { localeRows: { "ko-KR": row("ko-KR", "KO") }, legacyRow: null };
    const ko = decidePersonalDeepView({ locale: "ko-KR", ...rows });
    assert.equal(ko.state, "ready");
    assert.equal(ko.state === "ready" && ko.slim_v1.report, "KO");
    const en = decidePersonalDeepView({ locale: "en-US", ...rows });
    assert.equal(en.state, "not_generated");
    assert.deepEqual(en.otherLocales, ["ko-KR"]);
  });

  await ok("legacy row with a recorded language counts for that language", () => {
    const rows = { localeRows: {}, legacyRow: row("en-US", "OLD-EN") };
    const en = decidePersonalDeepView({ locale: "en-US", ...rows });
    assert.equal(en.state, "ready");
    assert.equal(en.state === "ready" && en.source, "legacy");
    assert.equal(decidePersonalDeepView({ locale: "ko-KR", ...rows }).state, "not_generated");
  });

  await ok("legacy row without a language is shown as the previous report, not guessed", () => {
    const rows = { localeRows: {}, legacyRow: row(undefined, "OLD") };
    for (const locale of ["ko-KR", "en-US"] as const) {
      const v = decidePersonalDeepView({ locale, ...rows });
      assert.equal(v.state, "legacy_unknown");
    }
  });

  await ok("new per-language row wins over the legacy row; legacy stays untouched", () => {
    const rows = { localeRows: { "ko-KR": row("ko-KR", "NEW") }, legacyRow: row(undefined, "OLD") };
    const v = decidePersonalDeepView({ locale: "ko-KR", ...rows });
    assert.equal(v.state === "ready" && v.slim_v1.report, "NEW");
    assert.equal(rows.legacyRow, row(undefined, "OLD"));
  });

  await ok("placeholder / broken rows are not reports", () => {
    const fallback = JSON.stringify({ locale: "ko-KR", slim_v1: { report: "x", llm_source: "fallback" } });
    assert.equal(decidePersonalDeepView({ locale: "ko-KR", localeRows: { "ko-KR": fallback }, legacyRow: "{bad" }).state, "not_generated");
  });

  // ── POST decision ───────────────────────────────────────────────────────
  await ok("POST on an existing report returns it with no generation (re-open / double click)", () => {
    const v = decidePersonalDeepView({ locale: "ko-KR", localeRows: { "ko-KR": row("ko-KR", "KO") }, legacyRow: null });
    const d = decidePersonalDeepPost(v, { regenerate: false });
    assert.equal(d.generate, false);
  });
  await ok("other language / legacy-unknown -> first generation; confirmed regenerate -> user_regenerate", () => {
    const none = decidePersonalDeepView({ locale: "en-US", localeRows: { "ko-KR": row("ko-KR", "KO") }, legacyRow: null });
    assert.deepEqual(decidePersonalDeepPost(none, { regenerate: false }), { generate: true, reason: "first_generation" });
    const legacy = decidePersonalDeepView({ locale: "ko-KR", localeRows: {}, legacyRow: row(undefined, "OLD") });
    assert.deepEqual(decidePersonalDeepPost(legacy, { regenerate: false }), { generate: true, reason: "first_generation" });
    const ready = decidePersonalDeepView({ locale: "ko-KR", localeRows: { "ko-KR": row("ko-KR", "KO") }, legacyRow: null });
    assert.deepEqual(decidePersonalDeepPost(ready, { regenerate: true }), { generate: true, reason: "user_regenerate" });
  });

  // ── Charge simulation (mock credits, real generation transaction) ───────
  await ok("mock flow: open 0, generate 1, re-open 0, other language 1, failure 0", async () => {
    const store: Record<string, string> = {};
    let credits = 2;
    let reserved = 0;
    let consumed = 0;
    let releases = 0;
    const lockHeld = new Set<string>();

    const view = (locale: "ko-KR" | "en-US") =>
      decidePersonalDeepView({ locale, localeRows: { "ko-KR": store["ko-KR"], "en-US": store["en-US"] }, legacyRow: null });

    // POST, as the route does it: confirm -> read -> lock -> re-read -> generate.
    async function post(locale: "ko-KR" | "en-US", opts: { fail?: boolean } = {}) {
      const d = decidePersonalDeepPost(view(locale), { regenerate: false });
      if (!d.generate) return "served";
      if (lockHeld.has(locale)) return "409";
      lockHeld.add(locale);
      try {
        const again = decidePersonalDeepPost(view(locale), { regenerate: false });
        if (!again.generate) return "served";
        const out = await runPersonalDeepEssenceGeneration({
          reserveCredit: async () => {
            if (credits < 1) return { ok: false, reason: "insufficient_balance" };
            credits--;
            reserved++;
            return { ok: true };
          },
          generate: async () => {
            await new Promise((r) => setTimeout(r, 5));
            if (opts.fail) throw new Error("llm down");
            return slim(`${locale}-report`);
          },
          stillOwnsLock: async () => true,
          persist: async (s) => {
            store[locale] = JSON.stringify({ locale, slim_v1: s });
            return true;
          },
          consumeCredit: async () => {
            consumed++;
          },
          releaseCredit: async () => {
            releases++;
            credits++;
          },
          log: () => {},
        });
        return out.kind;
      } finally {
        lockHeld.delete(locale);
      }
    }

    // Opening the page = GET = view only.
    assert.equal(view("ko-KR").state, "not_generated");
    assert.equal(reserved, 0);

    // Generation failure releases the credit.
    assert.equal(await post("ko-KR", { fail: true }), "failed");
    assert.equal(credits, 2);
    assert.equal(releases, 1);

    // Double click: two POSTs at once -> one generation, one charge.
    const [a, b] = await Promise.all([post("ko-KR"), post("ko-KR")]);
    assert.deepEqual([a, b].sort(), ["409", "ok"]);
    assert.equal(consumed, 1);
    assert.equal(credits, 1);

    // Re-open / refresh / POST again in the same language: no charge.
    assert.equal(view("ko-KR").state, "ready");
    assert.equal(await post("ko-KR"), "served");
    assert.equal(consumed, 1);

    // Other language: a new report, one more credit.
    assert.equal(view("en-US").state, "not_generated");
    assert.equal(await post("en-US"), "ok");
    assert.equal(consumed, 2);
    assert.equal(credits, 0);

    // Switching back and forth costs nothing.
    assert.equal(await post("ko-KR"), "served");
    assert.equal(await post("en-US"), "served");
    assert.equal(consumed, 2);

    // Out of credits for a new report -> insufficient.
    delete store["en-US"];
    assert.equal(await post("en-US"), "insufficient_credit");
  });

  // ── No-survey rule (AI input) ───────────────────────────────────────────
  await ok("no survey: prompt says so and carries no current scores", () => {
    const survey = buildSurveyAnalysisForSlimV1(null, "ko-KR");
    const prompt = buildDeepEssenceStructuredPartAUserPrompt({
      surveyAnalysis: survey.text,
      essenceAnalysisSummary: "essence",
      birthEnergyContext: "birth",
      currentAxisScores: null,
      locale: "ko-KR",
      part01Evidence: null,
    });
    assert.match(prompt, /No survey: the person did not take the survey/);
    assert.doesNotMatch(prompt, /Survey-scored "current" axis scores/);
    assert.doesNotMatch(prompt, /"autonomy":50/);
    assert.match(survey.text, /설문 미입력/);
  });
  await ok("with survey: real scores are still passed as survey scores", () => {
    const prompt = buildDeepEssenceStructuredPartAUserPrompt({
      surveyAnalysis: "s",
      essenceAnalysisSummary: "e",
      birthEnergyContext: "b",
      currentAxisScores: { autonomy: 70, connection: 40, stability: 55, growth: 60, structure: 45, adaptability: 50 },
      locale: "en-US",
      part01Evidence: null,
    });
    assert.match(prompt, /Survey-scored "current" axis scores/);
    assert.match(prompt, /"autonomy":70/);
  });

  // ── Wiring (source checks) ──────────────────────────────────────────────
  await ok("page mount reads with GET only; POST needs confirmGenerate; no neutral-50 fallback", () => {
    const hook = readFileSync("lib/v1/slim/useSlimV1Integrated.ts", "utf8");
    const refreshBody = hook.slice(hook.indexOf("const refresh = useCallback"), hook.indexOf("const postGenerate"));
    assert.doesNotMatch(refreshBody, /method:\s*"POST"/);
    assert.match(hook, /useEffect\(\(\) => \{\s*if \(!enabled \|\| !reportId\) return;\s*void refresh\(\);/);
    assert.match(hook, /confirmGenerate: true/);
    const route = readFileSync("app/api/v2/deep/essence/route.ts", "utf8");
    assert.match(route, /export async function GET/);
    assert.match(route, /body\.confirmGenerate !== true/);
    assert.doesNotMatch(route, /writePersistedDeepEssenceAnalysis/);
    const run = readFileSync("lib/v1/slim/runSlimIntegratedReport.ts", "utf8");
    assert.doesNotMatch(run, /fallbackAxisScores|buildNeutralV2Profile/);
    assert.match(run, /const radarCurrent = v2Profile\?\.primary_axes \?\? null;/);
    const page = readFileSync("app/blueprint-preview/[reportId]/essence/deep/page.tsx", "utf8");
    assert.doesNotMatch(page, /autostart/);
    assert.match(page, /setConfirmRegenerate\(true\)/);
  });

  console.log(`\n${passed} passed`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
