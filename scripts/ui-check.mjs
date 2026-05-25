import { chromium } from 'playwright';

const BASE = 'http://localhost:5173';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(BASE, { waitUntil: 'networkidle' });

  const text = await page.locator('body').innerText();
  const hasFriendly = text.includes('Гана') || text.includes('Товарищ');
  const hasMexicoGhana = text.includes('Мексика') && text.includes('Гана');

  console.log('--- Matches tab (default) ---');
  console.log('Has Mexico vs Ghana visible:', hasMexicoGhana);
  console.log('Has friendly label:', hasFriendly);

  // scroll and snapshot structure
  const cards = await page.locator('.match-card').count();
  console.log('Match cards visible without scroll:', cards);

  const firstCards = await page.locator('.match-card').allTextContents();
  console.log('First 3 cards preview:', firstCards.slice(0, 3).map(t => t.replace(/\s+/g, ' ').slice(0, 80)));

  // Profile admin
  await page.getByRole('button', { name: 'Профиль' }).click();
  const adminBtn = page.getByRole('button', { name: /Admin/ });
  console.log('Admin button visible:', await adminBtn.count() > 0);
  if (await adminBtn.count()) {
    await adminBtn.click();
    await page.waitForTimeout(500);
    const adminText = await page.locator('.admin-page').innerText();
    console.log('Admin has #1001:', adminText.includes('#1001'));
    console.log('Admin has fixture input:', adminText.includes('Fixture ID'));
  }

  await page.screenshot({ path: '/Users/fansmok/Лига Прогнозов/scripts/ui-check-matches.png', fullPage: true });
  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
