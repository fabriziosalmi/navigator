import { Page } from '@playwright/test';

export async function robustGoto(page: Page, url: string, retries = 10, delay = 500) {
  // Normalize URL: if relative, use Playwright config baseURL via process.env.BASE_URL or fallback
  const base = process.env.BASE_URL ?? '';
  const target = url.startsWith('http') ? url : base.replace(/\/$/, '') + '/' + url.replace(/^\//, '');
  for (let i = 0; i < retries; i++) {
    try {
      const res = await page.request.get(target);
      if (res.ok()) {
        // small delay allow server to stabilize
        await page.waitForTimeout(50);
        await page.goto(target, { waitUntil: 'domcontentloaded' });
        return;
      }
    } catch (err) {
      // silently ignore and retry
    }
    await page.waitForTimeout(delay);
  }
  throw new Error(`Server at ${target} did not become available after ${retries} retries.`);
}
