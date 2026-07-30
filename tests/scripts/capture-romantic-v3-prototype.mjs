/**
 * Capture Romantic V3 prototype pages (complete + anti-overfit + en smoke).
 * Run: npx tsx tests/scripts/capture-romantic-v3-prototype.mjs
 */
import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer";

const BASE = process.env.ROMANTIC_V3_BASE_URL ?? "http://localhost:3000";
const OUT = path.resolve("tests/artifacts/romantic-v3-prototype");
fs.mkdirSync(OUT, { recursive: true });

async function waitForServer(url, attempts = 30) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { method: "GET" });
      if (res.ok) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 1200));
  }
  throw new Error(`server not reachable: ${url}`);
}

const targets = [
  {
    id: "complete-ko",
    url: `${BASE}/dev/romantic-v3-content-prototype?variant=complete&locale=ko-KR`,
    viewports: [
      { suffix: "desktop-full", width: 1440, height: 900 },
      { suffix: "mobile-full", width: 390, height: 844 },
    ],
  },
  {
    id: "complete-en-smoke",
    url: `${BASE}/dev/romantic-v3-content-prototype?variant=complete&locale=en-US`,
    viewports: [{ suffix: "desktop", width: 1280, height: 920 }],
  },
  {
    id: "tension-ko-check",
    url: `${BASE}/dev/romantic-v3-content-prototype?variant=tension&locale=ko-KR`,
    viewports: [{ suffix: "desktop", width: 1280, height: 920 }],
  },
  {
    id: "minimal-ko-check",
    url: `${BASE}/dev/romantic-v3-content-prototype?variant=minimal&locale=ko-KR`,
    viewports: [{ suffix: "desktop", width: 1280, height: 920 }],
  },
];

const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});

const report = [];
try {
  await waitForServer(targets[0].url);
  const page = await browser.newPage();
  for (const t of targets) {
    for (const viewport of t.viewports) {
      await page.setViewport({ width: viewport.width, height: viewport.height });
      await page.goto(t.url, { waitUntil: "networkidle0", timeout: 120000 });
      await new Promise((r) => setTimeout(r, 600));
      const shot = path.join(OUT, `${t.id}-${viewport.suffix}.png`);
      await page.screenshot({ path: shot, fullPage: true });
      const info = await page.evaluate(() => {
        const root =
          document.querySelector("[data-v3-prototype-root]") ?? document.body;
        const rootText = root?.innerText ?? "";
        const hasKorean = /[가-힣]/.test(rootText);
        return {
          title: document.title,
          hasKorean,
          hasTOC: rootText.includes("Table of Contents"),
          hasAxis: rootText.includes("11-Axis"),
          hasOwnership: rootText.includes("Insight Ownership Table"),
        };
      });
      report.push({ id: `${t.id}-${viewport.suffix}`, url: t.url, screenshot: shot, ...info });
      console.log(`SHOT: ${shot}`);
    }
  }
  const outJson = path.join(OUT, "capture-report.json");
  fs.writeFileSync(outJson, JSON.stringify(report, null, 2));
  console.log(`REPORT: ${outJson}`);
} finally {
  await browser.close();
}
