import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Set viewport to desktop size
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000/dev/romantic-v2-visual', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'C:/dev/WhoamI/desktop.png', fullPage: true });

  // Set viewport to mobile size
  await page.setViewport({ width: 375, height: 812 });
  await page.screenshot({ path: 'C:/dev/WhoamI/mobile.png', fullPage: true });

  await browser.close();
  console.log("Screenshots captured");
})();
