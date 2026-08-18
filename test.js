import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  // Set viewport for a nice screenshot
  await page.setViewport({ width: 1280, height: 900 });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error(`PAGE ERROR: ${msg.text()}`);
    }
  });
  page.on('pageerror', err => {
    console.error(`PAGE EXCEPTION: ${err.message}`);
  });

  console.log("Navigating to http://localhost:5173/");
  await page.goto('http://localhost:5173/');
  
  console.log("Waiting for file input...");
  await page.waitForSelector('input[type="file"]');
  
  const elementHandle = await page.$('input[type="file"]');
  const filePath = join(__dirname, 'mock_data.csv');
  console.log("Uploading file: " + filePath);
  
  await elementHandle.uploadFile(filePath);
  
  console.log("Waiting for table to render...");
  // Wait for the leaderboard table
  await page.waitForSelector('table', { timeout: 10000 });
  
  // Give it a second to render chart animations
  await new Promise(r => setTimeout(r, 2000));

  const screenshotPath = '/root/.gemini/antigravity-cli/brain/38d47c40-366b-4cfc-a5cd-f02b67aff2c7/screenshot.png';
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Screenshot saved to ${screenshotPath}`);

  await browser.close();
  console.log("Done");
})();
