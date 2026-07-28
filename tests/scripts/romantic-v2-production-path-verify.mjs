/**
 * Romantic V2 production-path wiring + module audit.
 * Run: npx tsx tests/scripts/romantic-v2-production-path-verify.mjs [relationshipReportId] [viewerReportId]
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildRomanticExperienceViewModel } from "../../lib/relationship/romantic/experience/buildRomanticExperienceViewModel.ts";
import {
  shouldRenderRomanticExperienceV2,
  isRomanticExperienceV2Enabled,
} from "../../lib/relationship/romantic/experience/romanticExperienceFlag.ts";
import { summarizeRomanticModuleSlots } from "../../lib/relationship/romantic/experience/romanticExperienceTypes.ts";
import { getRomanticSajuDeepReport } from "../../lib/relationship/premiumByKind.ts";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, "../..");

function loadPublicFlagFromEnvLocal() {
  const envPath = join(root, ".env.local");
  let raw = "";
  try {
    raw = readFileSync(envPath, "utf8");
  } catch {
    return {};
  }
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*NEXT_PUBLIC_ROMANTIC_EXPERIENCE_V2\s*=\s*(.+?)\s*$/);
    if (m) env.NEXT_PUBLIC_ROMANTIC_EXPERIENCE_V2 = m[1].replace(/^["']|["']$/g, "");
  }
  return env;
}

function auditVm(label, report, names = {}) {
  const vm = buildRomanticExperienceViewModel({
    report,
    viewerIsReportA: names.viewerIsReportA ?? true,
    myName: names.myName ?? "Viewer",
    partnerName: names.partnerName ?? "Partner",
    nameA: names.nameA ?? "A",
    nameB: names.nameB ?? "B",
    locale: "ko-KR",
  });

  const core = summarizeRomanticModuleSlots(vm);
  const closing = [
    { id: "M11 Horizon", available: vm.horizon.available },
    { id: "M12 Reflection", available: vm.reflection.available },
    { id: "M12 Save/Share", available: vm.saveShare.available },
  ];

  console.log(`\n--- ${label} ---`);
  console.log(`buildId: ${vm.meta.buildId}`);
  for (const slot of core) {
    console.log(`  ${slot.id}: ${slot.available ? "ready" : "omitted"}`);
  }
  for (const slot of closing) {
    console.log(`  ${slot.id}: ${slot.available ? "ready" : "omitted"}`);
  }

  return { vm, core, closing };
}

function omissionReasons(vm) {
  const reasons = [];
  if (!vm.conflictTranslation.available) {
    reasons.push(
      "M7 Conflict Translation: no dialogue_table rows in section_3_conversation_patterns.conflict_situation",
    );
  } else if (
    vm.conflictTranslation.rows.length > 0 &&
    vm.conflictTranslation.rows.every((r) => !r.meant && !r.heard)
  ) {
    reasons.push(
      "M7: meant/heard absent in payload contract (said/better only — expected, not fabricated)",
    );
  }
  if (!vm.repairGuide.available) {
    reasons.push(
      "M8 Repair Guide: composeRepairGuide found insufficient canonical repair stages",
    );
  }
  if (!vm.doDont.available) {
    reasons.push(
      "M9 Do/Don't: no canonical prescription items after dedupe (expression/recovery/reassurance)",
    );
  }
  if (!vm.nextStep.available) {
    reasons.push("M10 Next Step: M9 produced no first do_list action");
  }
  if (!vm.horizon.available) {
    reasons.push(
      "M11 Horizon: section_6_timeline has no LLM waypoint text blocks",
    );
  }
  if (!vm.reflection.available) {
    reasons.push(
      "M12 Reflection: no Repair Guide interrupt point (recovery_mismatch not present)",
    );
  }
  if (!vm.saveShare.available) {
    reasons.push("M12 Save/Share: opening signature absent");
  }
  if (!vm.snapshot.available) {
    reasons.push(
      "M2 Snapshot: canonical_projections missing balance/reassurance/recovery signals",
    );
  }
  if (!vm.differenceMap.available) {
    reasons.push(
      "M3 Difference Map: comparison_table canonical rows insufficient",
    );
  }
  if (!vm.flow.available) {
    reasons.push("M4 Flow: fewer than 2 canonical flow nodes");
  }
  return reasons;
}

async function fetchDetail(relationshipReportId, viewerReportId) {
  const url = new URL("http://localhost:3000/api/relationship/detail");
  url.searchParams.set("relationshipReportId", relationshipReportId);
  url.searchParams.set("viewerReportId", viewerReportId);
  url.searchParams.set("relationshipKind", "romantic");
  url.searchParams.set("language", "ko-KR");
  const res = await fetch(url.toString());
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function loadPersistedFromSupabase(relationshipReportId, viewerReportId) {
  const { createRequire } = await import("module");
  const require = createRequire(join(root, "package.json"));
  require("dotenv").config({ path: join(root, ".env.local") });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  const { createClient } = require("@supabase/supabase-js");
  const sb = createClient(url, key, { auth: { persistSession: false } });
  const { data: rr, error } = await sb
    .from("relationship_reports")
    .select("id, report_id_a, report_id_b, result_premium_by_kind, relationship_kind")
    .eq("id", relationshipReportId)
    .maybeSingle();
  if (error || !rr || rr.relationship_kind !== "romantic") return null;
  const byKind = rr.result_premium_by_kind ?? {};
  const report = getRomanticSajuDeepReport(byKind, "ko-KR");
  if (!report || typeof report !== "object") return null;
  const viewerIsReportA = viewerReportId === rr.report_id_a;
  const { data: repA } = await sb
    .from("reports")
    .select("name")
    .eq("id", rr.report_id_a)
    .maybeSingle();
  const { data: repB } = await sb
    .from("reports")
    .select("name")
    .eq("id", rr.report_id_b)
    .maybeSingle();
  return {
    report,
    viewerIsReportA,
    nameA: repA?.name?.trim() || "A",
    nameB: repB?.name?.trim() || "B",
    myName: viewerIsReportA ? repA?.name?.trim() || "A" : repB?.name?.trim() || "B",
    partnerName: viewerIsReportA ? repB?.name?.trim() || "B" : repA?.name?.trim() || "A",
  };
}

async function puppeteerCheck(url) {
  const puppeteer = await import("puppeteer");
  const browser = await puppeteer.default.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto(url, { waitUntil: "networkidle2", timeout: 120_000 });
    const desktop = await page.evaluate(() => ({
      v2: document.querySelector('[data-romantic-experience="v2"]')?.getAttribute("data-romantic-build") ?? null,
      legacyScoreBoard: Boolean(document.querySelector('[class*="ScoreBoard"], [data-score-board]')),
      part1: document.body.innerText.includes("Part 1"),
      radar: document.body.innerText.includes("11축") || document.body.innerText.includes("psych"),
      signIn: document.body.innerText.includes("Sign in") || document.body.innerText.includes("로그인"),
      moduleTitles: Array.from(document.querySelectorAll("article h3")).map((el) => el.textContent?.trim()).filter(Boolean),
    }));
    await page.setViewport({ width: 390, height: 844 });
    await page.goto(url, { waitUntil: "networkidle2", timeout: 120_000 });
    const mobile = await page.evaluate(() => ({
      v2: document.querySelector('[data-romantic-experience="v2"]')?.getAttribute("data-romantic-build") ?? null,
      moduleCount: document.querySelectorAll("article h3").length,
    }));
    return { desktop, mobile };
  } finally {
    await browser.close();
  }
}

const envFromFile = loadPublicFlagFromEnvLocal();
process.env.NEXT_PUBLIC_ROMANTIC_EXPERIENCE_V2 =
  envFromFile.NEXT_PUBLIC_ROMANTIC_EXPERIENCE_V2 ??
  process.env.NEXT_PUBLIC_ROMANTIC_EXPERIENCE_V2;

console.log("\n=== 1) Flag wiring ===");
assert.equal(isRomanticExperienceV2Enabled(process.env), true);
assert.equal(shouldRenderRomanticExperienceV2("romantic", process.env), true);
console.log("NEXT_PUBLIC_ROMANTIC_EXPERIENCE_V2 enabled for client bundle");

const relationshipReportId = process.argv[2]?.trim();
const viewerReportId = process.argv[3]?.trim();

if (relationshipReportId && viewerReportId) {
  console.log("\n=== 2) Persisted report VM audit ===");
  let persisted = null;
  const { status, data } = await fetchDetail(relationshipReportId, viewerReportId);
  console.log(`detail API status: ${status}`);
  if (status === 200 && data?.romantic_deep_report) {
    persisted = {
      report: data.romantic_deep_report,
      viewerIsReportA: data.viewer_is_report_a !== false,
      myName: data.viewer_name ?? data.my_name ?? "Viewer",
      partnerName: data.partner_name ?? "Partner",
      nameA: data.person_a_name ?? "A",
      nameB: data.person_b_name ?? "B",
    };
    console.log("source: detail API (production path payload)");
  } else {
    persisted = await loadPersistedFromSupabase(relationshipReportId, viewerReportId);
    if (persisted) {
      console.log("source: Supabase result_premium_by_kind.romantic (read-only audit)");
    } else {
      console.log("Could not load romantic_deep_report (auth + supabase read failed).");
    }
  }
  if (persisted) {
    const { vm } = auditVm("Persisted premium report", persisted.report, persisted);
    const reasons = omissionReasons(vm);
    if (reasons.length) {
      console.log("\nOmission notes:");
      for (const r of reasons) console.log(`  - ${r}`);
    }
  }

  const pageUrl = `http://localhost:3000/kr/relationship/${relationshipReportId}?viewer=${viewerReportId}&kind=romantic`;
  console.log("\n=== 3) Browser production-path check ===");
  console.log(`URL: ${pageUrl}`);
  try {
    const browser = await puppeteerCheck(pageUrl);
    console.log("Desktop:", JSON.stringify(browser.desktop, null, 2));
    console.log("Mobile:", JSON.stringify(browser.mobile, null, 2));
  } catch (e) {
    console.log("Browser check failed:", e instanceof Error ? e.message : e);
  }
} else {
  console.log(
    "\nPass relationshipReportId viewerReportId args for persisted report + browser audit.",
  );
}

console.log("\nDone.");
