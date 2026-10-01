
import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1600 });
  await page.goto('http://localhost:3000/dev/romantic-v2-visual', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'C:/Users/tehch/.gemini/antigravity/brain/9f8f3428-7693-47d7-9d8c-fad2a2e78323/desktop_clarity.png', fullPage: true });
  await page.setViewport({ width: 375, height: 2000 });
  await page.screenshot({ path: 'C:/Users/tehch/.gemini/antigravity/brain/9f8f3428-7693-47d7-9d8c-fad2a2e78323/mobile_clarity.png', fullPage: true });
  
  await browser.close();
  console.log('Screenshots captured');
})();

