/**
 * Romantic V2 browser validation — complete/tension/minimal × 375/1280.
 * Requires: npm run dev on localhost:3000
 * Run: npx tsx tests/scripts/validate-romantic-v2-browser.mjs
 */
import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer";

const BASE = process.env.ROMANTIC_V2_BASE_URL ?? "http://localhost:3000";
const OUT = path.resolve("tests/artifacts/romantic-v2-browser");
const VARIANTS = ["complete", "tension", "minimal"];
const VIEWPORTS = [
  { name: "mobile", width: 375, height: 812 },
  { name: "desktop", width: 1280, height: 900 },
];

const EXPECTED_ORDER_HINTS = [
  "hero",
  "essence",
  "snapshot",
  "differenceMap",
  "axisComparison",
  "flow",
  "conflict",
  "hiddenHeart",
  "special",
  "repair",
  "doDont",
  "actionAdvice",
  "horizon",
  "reflection",
  "saveShare",
];

fs.mkdirSync(OUT, { recursive: true });

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForServer(url, attempts = 40) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { method: "GET" });
      if (res.ok || res.status === 404 || res.status === 500) return;
    } catch {
      // retry
    }
    await sleep(1500);
  }
  throw new Error(`Server not reachable: ${url}`);
}

async function inspectPage(page, variant, viewportName) {
  const result = await page.evaluate(() => {
    const root = document.querySelector('[data-romantic-experience="v2"]');
    const bodyText = root?.textContent ?? "";
    const html = root?.innerHTML ?? "";

    const chapterOrderAttr =
      root?.getAttribute("data-romantic-chapter-order")?.split(",") ?? [];

    const chapters = Array.from(
      document.querySelectorAll("[data-romantic-chapter]"),
    ).map((el) => el.getAttribute("data-romantic-chapter"));

    const ids = Array.from(document.querySelectorAll("[id^='romantic-']")).map(
      (el) => el.id,
    );

    const overflow = (() => {
      if (!root) return true;
      return root.scrollWidth > root.clientWidth + 2;
    })();

    const leakPatterns = [
      /\bundefined\b/i,
      /\bNaN\b/,
      /\bcanonical\b/i,
      /\bsaju frame\b/i,
      /\bprimary vs\b/i,
      /\bAffinity\b/,
      /\bChemistry\b/,
      /\b11-Axis Relationship Map\b/,
      /meets [AB]\b/,
      /\bnull\b/,
    ];
    const leaks = leakPatterns
      .filter((re) => re.test(bodyText))
      .map((re) => re.toString());

    const hasScoreBoard =
      /친밀도[\s\S]{0,80}텐션[\s\S]{0,80}보완성/.test(bodyText) ||
      bodyText.includes("ScoreBoard");

    const hasHiddenHeart = Boolean(
      document.querySelector("#romantic-m5-hidden") ||
        bodyText.includes("숨은 마음"),
    );

    const hasDiffMeaning = bodyText.includes("이 차이가 관계에서 뜻하는 것");
    const hasAxis = bodyText.includes("성향 비교 보조 지도");
    const hasSave = Boolean(document.querySelector("#romantic-m12-save"));

    const emptyHeadings = Array.from(
      (root || document).querySelectorAll("h1,h2,h3"),
    ).filter((h) => !(h.textContent || "").trim()).length;

    return {
      chapterOrderAttr,
      chapters,
      ids,
      overflow,
      leaks,
      hasScoreBoard,
      hasHiddenHeart,
      hasDiffMeaning,
      hasAxis,
      hasSave,
      emptyHeadings,
      bodySample: bodyText.slice(0, 400),
      scrollHeight: document.documentElement.scrollHeight,
      clientWidth: document.documentElement.clientWidth,
      rootPresent: Boolean(root),
    };
  });

  return { variant, viewportName, ...result };
}

let failed = false;
function check(label, cond, detail) {
  if (cond) console.log(`PASS: ${label}`);
  else {
    console.error(`FAIL: ${label}${detail ? ` — ${detail}` : ""}`);
    failed = true;
  }
}

const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});

try {
  await waitForServer(`${BASE}/dev/romantic-v2-visual?variant=complete`);
  const page = await browser.newPage();
  const reports = [];

  for (const variant of VARIANTS) {
    for (const vp of VIEWPORTS) {
      await page.setViewport({ width: vp.width, height: vp.height });
      const url = `${BASE}/dev/romantic-v2-visual?variant=${variant}`;
      await page.goto(url, { waitUntil: "networkidle0", timeout: 120000 });
      await sleep(500);
      // Cookie / consent chrome can overlay shots; dismiss if present.
      try {
        await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll("button"));
          const hit = buttons.find((b) =>
            /accept|동의|확인|닫기|got it|ok/i.test(
              (b.textContent || "").trim(),
            ),
          );
          hit?.click();
        });
        await sleep(200);
      } catch {
        // ignore
      }

      const report = await inspectPage(page, variant, vp.name);
      reports.push(report);

      const shot = path.join(OUT, `${variant}-${vp.name}.png`);
      await page.screenshot({ path: shot, fullPage: true });
      console.log(`SHOT: ${shot}`);

      check(
        `${variant}/${vp.name}: V2 root present`,
        await page.$('[data-romantic-experience="v2"]'),
      );
      check(
        `${variant}/${vp.name}: no horizontal overflow`,
        !report.overflow,
        `scrollWidth > clientWidth`,
      );
      check(
        `${variant}/${vp.name}: no leak patterns in body text`,
        report.leaks.length === 0,
        report.leaks.join(", "),
      );
      check(
        `${variant}/${vp.name}: no empty headings`,
        report.emptyHeadings === 0,
      );
      check(
        `${variant}/${vp.name}: Hero not score-led`,
        !report.hasScoreBoard,
      );
      check(
        `${variant}/${vp.name}: Save/Share present when opening exists`,
        report.hasSave || variant === "minimal",
      );

      check(
        `${variant}/${vp.name}: Korean fixture route keeps Korean axis labels`,
        variant !== "minimal" ||
          (!report.bodySample.includes("Novelty seeking") &&
            !report.bodySample.includes("Self-control") &&
            (report.bodySample.includes("자극추구") ||
              report.bodySample.includes("자기통제") ||
              report.bodySample.includes("성향 비교"))),
      );

      if (variant === "complete") {
        check(
          `${variant}/${vp.name}: Hidden Heart visible`,
          report.hasHiddenHeart,
        );
        check(
          `${variant}/${vp.name}: Difference meaning visible`,
          report.hasDiffMeaning,
        );
        check(
          `${variant}/${vp.name}: Axis subordinate label present`,
          report.hasAxis,
        );
      }

      const orderAttr = report.chapterOrderAttr;
      if (orderAttr.length) {
        const conflictIdx = orderAttr.indexOf("conflict");
        const heartIdx = orderAttr.indexOf("hiddenHeart");
        const specialIdx = orderAttr.indexOf("special");
        check(
          `${variant}/${vp.name}: chapter-order attr Heart after Conflict`,
          conflictIdx >= 0 && heartIdx > conflictIdx && specialIdx > heartIdx,
          orderAttr.join(","),
        );
      }
    }
  }

  fs.writeFileSync(
    path.join(OUT, "validation-report.json"),
    JSON.stringify({ expectedHints: EXPECTED_ORDER_HINTS, reports }, null, 2),
  );
  console.log(`REPORT: ${path.join(OUT, "validation-report.json")}`);
} finally {
  await browser.close();
}

if (failed) {
  console.error("\nBrowser validation FAILED.");
  process.exit(1);
}
console.log("\nBrowser validation PASSED.");
