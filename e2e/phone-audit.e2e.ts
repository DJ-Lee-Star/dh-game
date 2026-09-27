import { test, expect } from '@playwright/test';

test('audit narrow cooking and milk visibility', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/');
  await page.getByLabel('새 셰프 이름').fill('화면 검수');
  await page.getByRole('button', { name: '새로 시작' }).click();
  await expect(page.getByText('Lv.1')).toBeVisible();
  const token = await page.evaluate(() => {
    const profiles = JSON.parse(localStorage.getItem('nyang-v2-profiles') || '[]') as { id: string; token: string }[];
    return profiles.find(item => item.id === localStorage.getItem('nyang-v2-active'))?.token;
  });
  const bought = await page.request.post('/api/command', { headers: { Authorization: `Bearer ${token}` }, data: { command: { type: 'BUY_CART', items: { milk: 1, cocoa: 1 } }, requestId: crypto.randomUUID() } });
  expect(bought.ok(), await bought.text()).toBeTruthy();
  await page.reload();
  await page.locator('.v2-nav button').filter({ hasText: '요리' }).click();
  await page.locator('[data-recipe-id="cocoa_milk"]').click();
  await page.getByRole('button', { name: /냉장고/ }).click();
  for (const [width, height] of [[280, 568], [320, 568], [360, 740], [390, 844], [430, 932]]) {
    await page.setViewportSize({ width, height });
    const positions = await page.evaluate(() => {
      const box = (selector: string) => { const rect = document.querySelector(selector)?.getBoundingClientRect(); return rect ? { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom } : null; };
      return { width: innerWidth, documentWidth: document.documentElement.scrollWidth, shell: box('.v2-shell'), hudAction: box('.hud-mini-actions button:last-child'), navAction: box('.v2-nav button:last-child'), drawer: box('.storage-inside'), scene: box('.gesture-surface') };
    });
    expect(positions.documentWidth).toBeLessThanOrEqual(width);
    expect(positions.shell?.right).toBeLessThanOrEqual(width);
    expect(positions.hudAction?.right).toBeLessThanOrEqual(width);
    expect(positions.navAction?.right).toBeLessThanOrEqual(width);
    expect(positions.drawer?.right).toBeLessThanOrEqual(width);
    expect(positions.scene?.right).toBe(0);
    await page.screenshot({ path: `test-results/phone-audit-${width}.png` });
  }
  await page.setViewportSize({ width: 320, height: 568 });
  await page.locator('.storage-inside button').filter({ hasText: '우유' }).click();
  await expect(page.locator('.storage-inside')).toHaveCount(0);
  await expect(page.locator('.gesture-surface')).toBeVisible();
  await page.screenshot({ path: 'test-results/phone-audit-milk-added.png' });
  await page.locator('.cook-tool').click();
  await expect(page.locator('.cook-meter span')).toHaveAttribute('style', /width: 100%/);
  await expect(page.locator('.cocoa-liquid')).toHaveCSS('opacity', '1');
  await page.screenshot({ path: 'test-results/phone-audit-milk-poured.png' });
});

test('a new chef can finish the first order by tapping the obvious actions', async ({ page }) => {
  await page.setViewportSize({ width: 280, height: 568 });
  await page.goto('/');
  await page.getByLabel('새 셰프 이름').fill('첫 요리 검수');
  await page.getByRole('button', { name: '새로 시작' }).click();
  await expect(page.getByText('Lv.1')).toBeVisible();
  await page.getByRole('button', { name: '첫 주문 바로 만들기' }).click();
  await expect(page.locator('.cook-heading')).toContainText('노릇 달걀 프라이');
  await expect(page.locator('.recipe-card-v2')).toHaveCount(0);
  await page.screenshot({ path: 'test-results/phone-first-cook-280.png' });
  await page.getByRole('button', { name: /달걀 넣기/ }).click();
  await page.locator('.cook-tool').click();
  await expect(page.locator('.cook-meter span')).toHaveAttribute('style', /width: 100%/);
  await page.getByRole('button', { name: /다음 조리 단계로/ }).click();
  await page.getByRole('button', { name: /식용유 넣기/ }).click();
  await page.locator('.cook-tool').click();
  await expect(page.locator('.cook-meter span')).toHaveAttribute('style', /width: 50%/);
  await page.locator('.cook-tool').click();
  await page.getByRole('button', { name: /접시 꾸미기로/ }).click();
  const plateLayout = await page.evaluate(() => ({ navTop: document.querySelector('.v2-nav')!.getBoundingClientRect().top, finishBottom: document.querySelector('.plating-v2>.big-primary')!.getBoundingClientRect().bottom, choices: [...document.querySelectorAll('.plating-v2 .choice-row button')].map(item => item.getBoundingClientRect().right) }));
  expect(plateLayout.finishBottom).toBeLessThanOrEqual(plateLayout.navTop);
  expect(plateLayout.choices.every(right => right <= 280)).toBe(true);
  await page.screenshot({ path: 'test-results/phone-first-plate-280.png' });
  await page.getByRole('button', { name: /이 접시로 완성하기/ }).click();
  await expect(page.locator('.ready-dish strong')).toHaveText('노릇 달걀 프라이');
  await page.getByRole('button', { name: /손님에게 서빙하기/ }).click();
  await expect(page.locator('.eating-stage')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(280);
});

test('first order also works with phone touch input', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true });
  try {
    const page = await context.newPage();
    await page.goto('/');
    await page.getByLabel('새 셰프 이름').fill('손가락 검수');
    await page.getByRole('button', { name: '새로 시작' }).tap();
    await expect(page.getByText('Lv.1')).toBeVisible();
    await page.getByRole('button', { name: '첫 주문 바로 만들기' }).tap();
    await page.getByRole('button', { name: /달걀 넣기/ }).tap();
    await page.locator('.cook-tool').tap();
    await expect(page.locator('.cook-meter span')).toHaveAttribute('style', /width: 100%/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  } finally { await context.close(); }
});
