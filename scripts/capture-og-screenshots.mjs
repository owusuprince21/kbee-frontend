import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = (process.env.OG_CAPTURE_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
const outputDir = path.join(process.cwd(), 'public', 'og');

const routes = [
  ['/', 'home.png'],
  ['/shop', 'shop.png'],
  ['/about', 'about.png'],
  ['/contact', 'contact.png'],
  ['/faq', 'faq.png'],
  ['/cart', 'cart.png'],
  ['/checkout', 'checkout.png'],
  ['/checkout/success', 'checkout-success.png'],
  ['/wishlist', 'wishlist.png'],
  ['/orders', 'orders.png'],
  ['/profile', 'profile.png'],
  ['/signin', 'signin.png'],
  ['/search', 'search.png'],
  ['/policies/privacy', 'privacy.png'],
  ['/policies/cookies', 'cookies.png'],
  ['/policies/returns', 'returns.png'],
];

async function loadPlaywright() {
  try {
    return await import('playwright');
  } catch {
    console.error('Playwright is required for OG screenshot capture.');
    console.error('Run: npm install -D playwright && npm run og:install');
    process.exit(1);
  }
}

const { chromium } = await loadPlaywright();
await fs.mkdir(outputDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
});

for (const [route, fileName] of routes) {
  const url = `${baseUrl}${route}`;
  const filePath = path.join(outputDir, fileName);
  // console.log(`Capturing ${url} -> public/og/${fileName}`);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60_000 });
  await page.screenshot({ path: filePath, type: 'png', clip: { x: 0, y: 0, width: 1200, height: 630 } });
}

await browser.close();
// console.log('OG screenshots captured.');
