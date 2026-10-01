import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outDir = path.join(__dirname, 'artifacts', 'screenshots');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function capture() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--hide-scrollbars']
  });

  const page = await browser.newPage();
  
  // Set fake cookie to potentially hide banner
  await page.setCookie({
    name: 'cookie-consent',
    value: 'true',
    domain: 'localhost'
  });

  const url = 'http://localhost:3000/dev/romantic-v4-content-prototype?variant=complete&locale=ko-KR';
  console.log(`Navigating to ${url}...`);
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });

  // Hide any fixed/sticky elements (Cookie banners, progress bars, sticky headers) 
  // so they don't duplicate during full-page stitching or block content in splits.
  await page.evaluate(() => {
    const elements = document.querySelectorAll('*');
    for (const el of elements) {
      const style = window.getComputedStyle(el);
      if (style.position === 'fixed' || style.position === 'sticky') {
        el.style.setProperty('display', 'none', 'important');
      }
    }
    // Also explicitly remove anything containing 'cookie' or 'banner' in class or id just in case
    document.querySelectorAll('[class*="cookie" i], [id*="cookie" i], [class*="banner" i], [id*="banner" i]').forEach(el => el.remove());
    // And remove any fixed div directly under root
    document.querySelectorAll('[data-v4-prototype-root] > div.fixed').forEach(el => el.remove());
  });

  // Small delay to allow fonts/charts to settle
  await new Promise(r => setTimeout(r, 2000));

  // --- DESKTOP ---
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  
  const desktopOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth;
  });
  console.log(`Desktop Horizontal Overflow detected: ${desktopOverflow}`);

  console.log('Capturing desktop full...');
  await page.screenshot({ path: path.join(outDir, 'complete-ko-desktop-full.png'), fullPage: true });

  const desktopHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  const desktopViewportHeight = 900;
  const desktopSplits = 4;
  const desktopSplitHeight = Math.ceil(desktopHeight / desktopSplits);

  console.log('Capturing desktop splits...');
  for (let i = 0; i < desktopSplits; i++) {
    await page.screenshot({
      path: path.join(outDir, `complete-ko-desktop-split-${i+1}.png`),
      clip: { x: 0, y: i * desktopSplitHeight, width: 1440, height: Math.min(desktopSplitHeight, desktopHeight - i * desktopSplitHeight) }
    });
  }

  // --- MOBILE ---
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  
  // Recalculate after resize
  await new Promise(r => setTimeout(r, 1000));
  
  const mobileOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth;
  });
  console.log(`Mobile Horizontal Overflow detected: ${mobileOverflow}`);

  console.log('Capturing mobile full...');
  await page.screenshot({ path: path.join(outDir, 'complete-ko-mobile-full.png'), fullPage: true });

  const mobileHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  const mobileSplits = 8;
  const mobileSplitHeight = Math.ceil(mobileHeight / mobileSplits);

  console.log('Capturing mobile splits...');
  for (let i = 0; i < mobileSplits; i++) {
    await page.screenshot({
      path: path.join(outDir, `complete-ko-mobile-split-${i+1}.png`),
      clip: { x: 0, y: i * mobileSplitHeight, width: 390, height: Math.min(mobileSplitHeight, mobileHeight - i * mobileSplitHeight) }
    });
  }

  console.log('Done.');
  await browser.close();
}

capture().catch(err => {
  console.error('Capture failed:', err);
  process.exit(1);
});
