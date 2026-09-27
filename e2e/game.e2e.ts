import { test, expect, type Browser, type Page } from '@playwright/test';
import { mkdirSync, readdirSync } from 'node:fs';
import { INGREDIENTS, RECIPES, RECIPE_IDS } from '../src/v2/content';
import type { IngredientId, RecipeId } from '../src/v2/content';

const shots = 'docs/qa-v2-followup';
mkdirSync(shots, { recursive: true });
const seenCookActions = new Set<string>();

async function newGame(page: Page, name = '테스트냥냥') {
  await page.goto('/');
  await page.getByLabel('새 셰프 이름').fill(name);
  await page.getByRole('button', { name: '새로 시작' }).click();
  await expect(page.getByText('Lv.1')).toBeVisible();
  await expect(page.locator('.room-heading strong')).toHaveText('몽실이');
}
async function settleRestaurant(page: Page) {
  await page.locator('.customer-figure').evaluate(async element => { await Promise.all(element.getAnimations().map(animation => animation.finished)); });
}
async function gesture(page: Page) {
  const toolLocator = page.locator('.cook-tool');
  await toolLocator.scrollIntoViewIfNeeded();
  const tool = await toolLocator.boundingBox();
  const target = await page.locator('.cook-target').boundingBox();
  const action = (await page.locator('.gesture-surface').getAttribute('class'))?.split(' ').find(name => name.startsWith('gesture-') && name !== 'gesture-surface')?.slice(8);
  if (!tool || !target || !action) throw new Error('visible cooking tool or target missing');
  const center = { x: target.x + target.width / 2, y: target.y + target.height / 2 };
  await page.mouse.move(tool.x + tool.width / 2, tool.y + tool.height / 2);
  await page.mouse.down();
  await page.mouse.move(center.x, center.y, { steps: 8 });
  if (action === 'stir') {
    for (let i = 0; i < 24; i++) {
      const angle = i / 24 * Math.PI * 4;
      await page.mouse.move(center.x + Math.cos(angle) * target.width * .25, center.y + Math.sin(angle) * target.height * .25);
    }
  } else if (!['crack', 'pour', 'stack'].includes(action)) {
    for (let i = 0; i < 12; i++) {
      await page.mouse.move(center.x + (['slice', 'flip'].includes(action) ? 0 : (i % 2 ? 1 : -1) * target.width * .24), center.y + (['slice', 'flip'].includes(action) ? (i % 2 ? 1 : -1) * target.height * .24 : 0), { steps: 2 });
    }
  }
  await page.mouse.up();
  await expect(page.locator('.cook-meter span')).toHaveAttribute('style', /width: 100%/);
}
async function cookEgg(page: Page) {
  await page.getByRole('button', { name: /요리/ }).last().click();
  await page.locator('.recipe-card-v2').filter({ hasText: '노릇 달걀 프라이' }).click();
  await page.getByRole('button', { name: /냉장고/ }).click();
  await page.locator('.storage-inside button').filter({ hasText: '달걀' }).click();
  await page.locator('.cook-board').screenshot({ path: `${shots}/07-cooking-gesture.png` });
  const board = page.locator('.gesture-surface');
  await board.scrollIntoViewIfNeeded();
  const bounds = await board.boundingBox();
  if (!bounds) throw new Error('cooking board missing');
  await page.mouse.move(bounds.x + bounds.width * .88, bounds.y + bounds.height * .8);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width * .65, bounds.y + bounds.height * .7, { steps: 8 });
  await page.mouse.up();
  await expect(page.locator('.cook-meter span')).toHaveAttribute('style', /width: 0%/);
  await page.getByRole('button', { name: '손 모양 시범 보기' }).click();
  await expect(page.locator('.cook-guide-hand')).toBeVisible();
  await expect(page.locator('.cook-meter span')).toHaveAttribute('style', /width: 0%/);
  await gesture(page);
  await page.getByRole('button', { name: /다음 조리 단계로/ }).click();
  await page.getByRole('button', { name: /상온 보관장/ }).click();
  await page.locator('.storage-inside button').filter({ hasText: '식용유' }).click();
  await gesture(page);
  await page.getByRole('button', { name: /접시 꾸미기로/ }).click();
  await page.locator('.plating-plate').click();
  await page.getByRole('button', { name: /이 접시로 완성하기/ }).click();
  await expect(page.getByText('Lv.2')).toBeVisible();
}
async function token(page: Page) {
  return await page.evaluate(() => {
    const list = JSON.parse(localStorage.getItem('nyang-v2-profiles') || '[]') as { id: string; token: string }[];
    const id = localStorage.getItem('nyang-v2-active');
    return list.find(item => item.id === id)?.token || '';
  });
}
async function apiCommand(page: Page, command: unknown) {
  const response = await page.request.post('http://127.0.0.1:5173/api/command', { headers: { Authorization: `Bearer ${await token(page)}` }, data: { command, requestId: crypto.randomUUID() } });
  expect(response.ok(), await response.text()).toBeTruthy();
  return await response.json();
}
async function apiState(page: Page) {
  const response = await page.request.get('http://127.0.0.1:5173/api/state', { headers: { Authorization: `Bearer ${await token(page)}` } });
  expect(response.ok()).toBeTruthy();
  return (await response.json()).state;
}
async function importLevelFive(page: Page) {
  const legacyInventory = Object.fromEntries(['egg', 'bread', 'milk', 'flour', 'butter'].map(id => [id, 20]));
  await page.evaluate(inventory => localStorage.setItem('nyanyang-restaurant-v2', JSON.stringify({ version: 2, xp: 1300, money: 10000, hearts: 10, inventory, order: { recipeId: 'fried_egg', customerId: 'dog', special: false }, heldDish: null })), legacyInventory);
  await page.getByRole('button', { name: '설정' }).click();
  await page.getByRole('button', { name: '이전 기록 가져오기' }).click();
  await expect(page.getByText('Lv.5')).toBeVisible();
  const paid = (Object.keys(INGREDIENTS) as IngredientId[]).filter(id => INGREDIENTS[id].price > 0 && !['egg', 'bread', 'milk', 'flour', 'butter'].includes(id));
  for (let index = 0; index < paid.length; index += 3) {
    const items = Object.fromEntries(paid.slice(index, index + 3).map(id => [id, 10]));
    await apiCommand(page, { type: 'BUY_CART', items });
  }
  await page.reload();
}
async function cookRecipeUI(page: Page, recipeId: RecipeId) {
  await page.locator('.v2-nav button').filter({ hasText: '요리' }).click();
  await page.locator('.recipe-card-v2').nth(RECIPE_IDS.indexOf(recipeId)).click();
  for (let index = 0; index < RECIPES[recipeId].stages.length; index++) {
    const stage = RECIPES[recipeId].stages[index];
    for (const ingredient of stage.ingredients) {
      const home = INGREDIENTS[ingredient].home;
      const door = page.locator(`.storage-door.${home}`);
      if (!(await door.evaluate(element => element.classList.contains('opened')))) await door.click();
      await page.locator('.storage-inside button').filter({ hasText: INGREDIENTS[ingredient].name }).first().click();
    }
    if (!seenCookActions.has(stage.action)) {
      await page.locator('.cook-board').screenshot({ path: `${shots}/cook-${stage.action}.png` });
      seenCookActions.add(stage.action);
    }
    await gesture(page);
    await page.getByRole('button', { name: index + 1 < RECIPES[recipeId].stages.length ? /다음 조리 단계로/ : /접시 꾸미기로/ }).click();
  }
  await page.locator('.plating-plate').click();
  await page.getByRole('button', { name: /이 접시로 완성하기/ }).click();
  await expect(page.locator('.ready-dish strong')).toHaveText(RECIPES[recipeId].name);
}

test('first play, cooking gestures, serving, persistence and mart cart', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await newGame(page);
  await settleRestaurant(page);
  await page.screenshot({ path: `${shots}/01-first-play.png`, fullPage: true });
  await cookEgg(page);
  await expect(page.locator('.ready-dish strong')).toHaveText('노릇 달걀 프라이');
  await page.getByRole('button', { name: /손님에게 서빙하기/ }).click();
  await expect(page.locator('.eating-stage')).toBeVisible();
  await expect(page.locator('.eating-stage .eating-dish')).toBeVisible();
  await page.locator('.eating-overlay').waitFor({ state: 'hidden' });
  await page.reload();
  await expect(page.getByText('Lv.2')).toBeVisible();
  await page.getByRole('button', { name: /마트/ }).last().click();
  await page.locator('.mart-checkout-scene img').evaluate(async image => { await (image as HTMLImageElement).decode(); });
  await page.screenshot({ path: `${shots}/02-mart-entry.png`, fullPage: true });
  const money = await page.locator('.v2-currency').first().textContent();
  const cartY = (await page.locator('.cart-summary').boundingBox())?.y;
  await page.locator('.shelf-product').filter({ hasText: '치즈' }).getByRole('button').click();
  await expect(page.locator('.mart-message')).toContainText('Lv.3에 열려요');
  await expect(page.locator('.cart-summary')).toContainText('0개');
  await page.screenshot({ path: `${shots}/02-mart-locked.png`, fullPage: true });
  await page.locator('.shelf-product').filter({ hasText: '식빵' }).getByRole('button').click();
  expect((await page.locator('.cart-summary').boundingBox())?.y).toBe(cartY);
  expect(await page.locator('.shelf-scroll').evaluate(node => getComputedStyle(node).scrollSnapType)).toBe('none');
  await page.screenshot({ path: `${shots}/02-mart-shelf.png`, fullPage: true });
  await expect(page.locator('.v2-currency').first()).toHaveText(money!);
  await page.getByRole('button', { name: /장바구니 1개/ }).click();
  await page.getByRole('button', { name: /계산대로 돌아가기/ }).click();
  await page.getByRole('button', { name: /계산하고 재료 가져가기/ }).click();
  await expect(page.locator('.shelf-product').filter({ hasText: '식빵' })).toContainText('보관 1개');
  await page.screenshot({ path: `${shots}/02-mart.png`, fullPage: true });
  const shelf = await page.locator('.shelf-scroll').evaluate(node => ({ width: node.scrollWidth, view: node.clientWidth }));
  expect(shelf.width).toBeGreaterThan(shelf.view);
  for (let i = 0; i < 8; i++) await page.locator('.shelf-product').filter({ hasText: '식빵' }).getByRole('button').click();
  await page.locator('.shelf-product').filter({ hasText: '식빵' }).getByRole('button').click();
  await expect(page.locator('.mart-message')).toContainText('코인이 부족해요');
  await expect(page.locator('.cart-summary')).toContainText('8개');
});

test('minigame pays guaranteed ingredient value, wardrobe and profiles stay separate', async ({ page }) => {
  await page.setViewportSize({ width: 430, height: 932 });
  await newGame(page, '첫째 셰프');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('button', { name: '설정' }).click();
  await page.getByRole('checkbox', { name: /동작 효과음/ }).uncheck();
  await page.getByRole('button', { name: '닫기' }).click();
  await page.getByRole('button', { name: /놀이/ }).last().click();
  await page.getByRole('button', { name: /100코인 내고 시작하기/ }).click();
  await page.reload();
  await page.getByRole('button', { name: /놀이/ }).last().click();
  await expect(page.locator('.catch-board')).toBeVisible();
  await expect(page.getByText(/점수/)).toBeVisible();
  await expect(page.locator('.v2-currency').first()).toContainText('250');
  await expect(page.locator('.minigame-warning')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('.catch-board')).toHaveClass(/ending-soon/);
  expect(await page.locator('.catch-board').evaluate(element => parseFloat(getComputedStyle(element).animationDuration))).toBeLessThan(.01);
  await expect(page.getByText(/코인어치 재료를 받았어요/)).toBeVisible({ timeout: 18_000 });
  await page.getByRole('button', { name: /꾸미기/ }).last().click();
  await page.getByRole('button', { name: /모자/ }).click();
  await page.locator('.wardrobe-item').filter({ hasText: '딸기 베레모' }).getByRole('button', { name: '구매하기' }).click();
  await expect(page.locator('.wardrobe-item').filter({ hasText: '딸기 베레모' })).toContainText('장착 중');
  await page.reload();
  await page.getByRole('button', { name: /꾸미기/ }).last().click();
  await page.getByRole('button', { name: /모자/ }).click();
  await expect(page.locator('.wardrobe-item').filter({ hasText: '딸기 베레모' })).toContainText('장착 중');
  await page.getByRole('button', { name: '설정' }).click();
  await page.getByRole('textbox', { name: '새 셰프 이름' }).fill('둘째 셰프');
  await page.getByRole('button', { name: '추가' }).click();
  await expect(page.getByText('Lv.1')).toBeVisible();
  await page.getByRole('button', { name: '설정' }).click();
  await page.getByRole('button', { name: /첫째 셰프.*전환/ }).click();
  await expect(page.locator('.v2-brand')).toContainText('첫째 셰프');
  await page.getByRole('button', { name: /꾸미기/ }).last().click();
  await page.getByRole('button', { name: /모자/ }).click();
  await expect(page.locator('.wardrobe-item').filter({ hasText: '딸기 베레모' })).toContainText('장착 중');
  await page.screenshot({ path: `${shots}/03-wardrobe.png`, fullPage: true });
  await page.getByRole('button', { name: '설정' }).click();
  await page.getByRole('button', { name: /둘째 셰프.*전환/ }).click();
  await page.getByRole('button', { name: '설정' }).click();
  await page.getByRole('button', { name: '초기화 선택' }).click();
  await page.getByRole('button', { name: '정말 초기화하기' }).click();
  await expect(page.getByText('Lv.1')).toBeVisible();
  await page.getByRole('button', { name: '설정' }).click();
  await page.getByRole('button', { name: /첫째 셰프.*전환/ }).click();
  await page.getByRole('button', { name: /꾸미기/ }).last().click();
  await page.getByRole('button', { name: /모자/ }).click();
  await expect(page.locator('.wardrobe-item').filter({ hasText: '딸기 베레모' })).toContainText('장착 중');
});

test('small viewports have no page overflow, settings persist, and zero stock is labelled', async ({ page }) => {
  await newGame(page, '작은 화면');
  for (const [width, height] of [[320, 568], [390, 844], [430, 932]]) {
    await page.setViewportSize({ width, height });
    const size = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, view: window.innerWidth }));
    expect(size.scroll).toBeLessThanOrEqual(size.view);
    await page.screenshot({ path: `${shots}/viewport-${width}.png`, fullPage: true });
  }
  await page.getByRole('button', { name: '설정' }).click();
  await page.getByRole('checkbox', { name: /배경음악/ }).uncheck();
  await page.getByRole('button', { name: '닫기' }).click();
  await page.reload();
  await page.getByRole('button', { name: '설정' }).click();
  await expect(page.getByRole('checkbox', { name: /배경음악/ })).not.toBeChecked();
  await page.getByRole('button', { name: '닫기' }).click();
  await page.getByRole('button', { name: /요리/ }).last().click();
  await page.locator('.recipe-card-v2').filter({ hasText: '딸기잼 토스트' }).click();
  await page.getByRole('button', { name: /간식 선반/ }).click();
  await expect(page.locator('.storage-inside button.empty').filter({ hasText: '식빵' })).toContainText('0개 · 없음');
});

test('all Lv.1–5 recipes, secrets, family meals and cooking cancellation work in the UI', async ({ page }) => {
  test.setTimeout(190_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await newGame(page, '모든 요리');
  await importLevelFive(page);
  await page.locator('.v2-nav button').filter({ hasText: '요리' }).click();
  await page.locator('.recipe-card-v2').filter({ hasText: '딸기잼 토스트' }).click();
  await page.getByRole('button', { name: '요리 취소' }).click();
  expect((await apiState(page)).heldDish).toBeNull();
  for (const [index, id] of RECIPE_IDS.entries()) {
    await cookRecipeUI(page, id);
    if (id === 'fried_egg') await settleRestaurant(page);
    if (id === 'fried_egg') await page.screenshot({ path: `${shots}/04-family-choice-before.png`, fullPage: true });
    await page.getByRole('button', { name: '가족에게 대접하기' }).click();
    if (id === 'fried_egg') {
      await page.locator('.family-choices img').evaluateAll(async images => { await Promise.all(images.map(image => (image as HTMLImageElement).decode())); });
      await page.screenshot({ path: `${shots}/04-family-choice.png`, fullPage: true });
    }
    const family = (['mother', 'father', 'sibling'] as const)[index % 3];
    const familyName = { mother: '엄마', father: '아빠', sibling: '동생' }[family];
    await page.locator('.family-choices button').filter({ hasText: familyName }).click();
    await expect(page.locator(`.eating-stage.eater-${family}`)).toBeVisible();
    if (index < 3) await page.screenshot({ path: `${shots}/05-family-${family}-eating.png`, fullPage: true });
    await page.locator('.eating-overlay').click();
  }
  const state = await apiState(page);
  expect(state.discovered).toHaveLength(RECIPE_IDS.length);
  expect(state.order.recipeId).toBe('fried_egg');
  expect(Object.values(state.inventory).every(value => typeof value === 'number' && value >= 0)).toBeTruthy();
  await page.locator('.v2-nav button').filter({ hasText: '꾸미기' }).click();
  await page.locator('.wardrobe-item').filter({ hasText: '민트 앞치마' }).getByRole('button', { name: '구매하기' }).click();
  await page.getByRole('button', { name: '액세서리' }).click();
  await page.locator('.wardrobe-item').filter({ hasText: '리본 목걸이' }).getByRole('button', { name: '구매하기' }).click();
  await page.getByRole('button', { name: '배경' }).click();
  await page.locator('.wardrobe-item').filter({ hasText: '노을 식당' }).getByRole('button', { name: '구매하기' }).click();
  await page.locator('.v2-nav button').filter({ hasText: '식당' }).click();
  await expect(page.locator('.chef-figure img')).toHaveAttribute('src', '/game/chef-mint-outfit.png');
  await expect(page.locator('.chef-accessory')).toBeVisible();
  await expect(page.locator('.restaurant-scene-v2')).toHaveClass(/evening/);
  await expect(page.getByText(/최고 레벨 셰프/)).toBeVisible();
  await settleRestaurant(page);
  await page.screenshot({ path: `${shots}/09-outfit-background.png`, fullPage: true });
  await page.reload();
  await expect(page.locator('.chef-figure img')).toHaveAttribute('src', '/game/chef-mint-outfit.png');
  await expect(page.locator('.restaurant-scene-v2')).toHaveClass(/evening/);
});

test('special panda, short story reward and wrong order family path survive refresh', async ({ page }) => {
  test.setTimeout(100_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await newGame(page, '별님 초대');
  await importLevelFive(page);
  for (let index = 0; index < 4; index++) {
    const state = await apiState(page);
    await apiCommand(page, { type: 'COOK', recipeId: state.order.recipeId, topping: 'none', shape: 'heart' });
    await apiCommand(page, { type: 'SERVE', target: 'customer' });
  }
  await page.reload();
  await expect(page.getByText('스페셜 손님이 왔어요!')).toBeVisible();
  await expect(page.locator('.customer-figure img')).toHaveAttribute('src', '/game/customer-panda.webp');
  await page.screenshot({ path: `${shots}/06-special-panda.png`, fullPage: true });
  await page.locator('.story-progress').click();
  await expect(page.locator('.story-list article').first()).toContainText('스티커 획득');
  await page.getByRole('button', { name: '닫기' }).click();
  const before = await apiState(page);
  const wrong = RECIPE_IDS.find(id => id !== before.order.recipeId && !before.order.accepted.includes(id) && !('secret' in RECIPES[id]))!;
  await apiCommand(page, { type: 'COOK', recipeId: wrong, topping: 'none', shape: 'heart' });
  await page.reload();
  await expect(page.getByRole('button', { name: /손님에게 서빙하기/ })).toBeDisabled();
  await page.getByRole('button', { name: '가족에게 대접하기' }).click();
  await page.locator('.family-choices button').filter({ hasText: '동생' }).click();
  await expect(page.locator('.eating-stage.eater-sibling')).toBeVisible();
  await page.locator('.eating-overlay').click();
  expect((await apiState(page)).order.customerId).toBe('panda');
  await apiCommand(page, { type: 'COOK', recipeId: before.order.recipeId, topping: 'none', shape: 'star' });
  const served = await apiCommand(page, { type: 'SERVE', target: 'customer' });
  expect(served.outcome.reward.hearts).toBe(3);
  expect((await apiState(page)).order.customerId).not.toBe('panda');
});

test('real touch input moves the mart shelf and minigame basket on a 320px screen', async ({ browser }: { browser: Browser }) => {
  test.setTimeout(45_000);
  const context = await browser.newContext({ viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  const page = await context.newPage();
  try {
    await newGame(page, '손가락 셰프');
    const cdp = await context.newCDPSession(page);
    await page.locator('.v2-nav button').filter({ hasText: '요리' }).tap();
    await page.locator('.recipe-card-v2').filter({ hasText: '노릇 달걀 프라이' }).tap();
    await page.getByRole('button', { name: /냉장고/ }).tap();
    await page.locator('.storage-inside button').filter({ hasText: '달걀' }).tap();
    const cookPad = page.locator('.gesture-surface');
    const touchTool = cookPad.locator('.cook-tool');
    await touchTool.scrollIntoViewIfNeeded();
    const toolBox = await touchTool.boundingBox(), targetBox = await cookPad.locator('.cook-target').boundingBox();
    if (!toolBox || !targetBox) throw new Error('touch cooking tool or target missing');
    const cookX = toolBox.x + toolBox.width / 2, cookY = toolBox.y + toolBox.height / 2;
    const targetX = targetBox.x + targetBox.width / 2, targetY = targetBox.y + targetBox.height / 2;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cookX, y: cookY }] });
    for (let i = 1; i <= 8; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: cookX + (targetX - cookX) * i / 8, y: cookY + (targetY - cookY) * i / 8 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect(cookPad.locator('.cook-scene-art')).toBeVisible();
    const progress = await page.locator('.cook-meter span').getAttribute('style');
    expect(progress).not.toBe('width: 0%;');
    await page.locator('.v2-nav button').filter({ hasText: '마트' }).click();
    const shelf = page.locator('.shelf-scroll');
    await shelf.scrollIntoViewIfNeeded();
    const box = await shelf.boundingBox();
    if (!box) throw new Error('mart shelf missing');
    const y = box.y + box.height / 2;
    const startX = box.x + box.width * .82, endX = box.x + box.width * .18;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: startX, y }] });
    for (let i = 1; i <= 8; i++) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: startX + (endX - startX) * i / 8, y }] });
      await page.waitForTimeout(35);
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect.poll(() => shelf.evaluate(node => node.scrollLeft)).toBeGreaterThan(15);
    await page.locator('.v2-nav button').filter({ hasText: '놀이' }).click();
    await page.getByRole('button', { name: /100코인 내고 시작하기/ }).tap();
    const board = page.locator('.catch-board');
    await board.scrollIntoViewIfNeeded();
    const boardBox = await board.boundingBox();
    if (!boardBox) throw new Error('minigame board missing');
    await page.touchscreen.tap(boardBox.x + boardBox.width * .82, boardBox.y + 80);
    await expect(board.locator('.catch-basket')).toHaveAttribute('style', /left: 8[0-9]/);
    const size = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, view: innerWidth }));
    expect(size.scroll).toBeLessThanOrEqual(size.view);
    await page.locator('.v2-toast').waitFor({ state: 'hidden' });
    await page.locator('.minigame-v2').screenshot({ path: `${shots}/08-touch-minigame.png` });
  } finally { await context.close(); }
});

test('BGM starts after interaction, switches scenes and obeys mute and volume settings', async ({ page }) => {
  await newGame(page, '음악 셰프');
  const snapshot = () => page.evaluate(async () => {
    const { audio } = await import('/src/v2/audio.ts');
    const current = audio as unknown as { activeScene: string | null; ctx: AudioContext | null; musicBus: GainNode | null };
    return { scene: current.activeScene, context: current.ctx?.state ?? null, gain: current.musicBus?.gain.value ?? null };
  });
  expect((await snapshot()).context).toBeNull();
  await page.locator('.v2-nav button').filter({ hasText: '식당' }).click();
  await expect.poll(async () => (await snapshot()).scene).toBe('restaurant');
  await page.locator('.v2-nav button').filter({ hasText: '마트' }).click();
  await expect.poll(async () => (await snapshot()).scene).toBe('mart');
  await expect.poll(async () => (await snapshot()).gain ?? 0).toBeGreaterThan(.05);
  await page.getByRole('button', { name: '설정' }).click();
  const musicVolume = page.getByRole('slider', { name: '음악 크기' });
  await musicVolume.press('End');
  await expect(musicVolume).toHaveValue('100');
  await expect.poll(async () => (await snapshot()).gain ?? 0).toBeGreaterThan(.2);
  await musicVolume.press('Home');
  await expect.poll(async () => (await snapshot()).gain ?? 1).toBeLessThan(.01);
  await musicVolume.press('End');
  await page.getByRole('checkbox', { name: /배경음악/ }).uncheck();
  await expect.poll(async () => (await snapshot()).gain ?? 1).toBeLessThan(.01);
  await page.getByRole('checkbox', { name: /동작 효과음/ }).uncheck();
  const effectVolume = page.getByRole('slider', { name: '효과음 크기' });
  await effectVolume.press('Home');
  await expect(effectVolume).toHaveValue('0');
  await page.getByRole('button', { name: '닫기' }).click();
  await page.locator('.v2-nav button').filter({ hasText: '식당' }).click();
  await expect.poll(async () => (await snapshot()).scene).toBe('restaurant');
  await page.reload();
  await page.getByRole('button', { name: '설정' }).click();
  await expect(page.getByRole('checkbox', { name: /배경음악/ })).not.toBeChecked();
  await expect(page.getByRole('checkbox', { name: /동작 효과음/ })).not.toBeChecked();
  await expect(page.getByRole('slider', { name: '효과음 크기' })).toHaveValue('0');
});

test('all bundled character and background images decode and reduced motion is honoured', async ({ page }) => {
  const failures: string[] = [];
  page.on('pageerror', error => failures.push(error.message));
  await newGame(page, '그림 확인');
  const images = readdirSync('public/game').filter(name => /\.(png|webp)$/.test(name));
  const broken = await page.evaluate(async names => {
    return (await Promise.all(names.map(name => new Promise<string | null>(resolve => {
      const image = new Image();
      image.onload = () => resolve(image.naturalWidth > 0 ? null : name);
      image.onerror = () => resolve(name);
      image.src = `/game/${name}`;
    })))).filter((name): name is string => Boolean(name));
  }, images);
  expect(broken).toEqual([]);
  expect(failures).toEqual([]);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('.v2-nav button').filter({ hasText: '놀이' }).click();
  const duration = await page.locator('.basket-hero').evaluate(element => getComputedStyle(element).animationDuration);
  expect(parseFloat(duration)).toBeLessThan(.01);
});

test('a lost purchase response retries the same request without double charging', async ({ page }) => {
  await newGame(page, '재시도 셰프');
  await page.locator('.v2-nav button').filter({ hasText: '마트' }).click();
  await page.locator('.shelf-product').filter({ hasText: '식빵' }).getByRole('button').click();
  await page.getByRole('button', { name: /장바구니 1개/ }).click();
  let lost = false;
  await page.route('**/api/command', async route => {
    if (!lost) { lost = true; await route.fetch(); await route.abort('failed'); }
    else await route.continue();
  });
  await page.getByRole('button', { name: /계산하고 재료 가져가기/ }).click();
  await expect(page.getByRole('button', { name: '같은 요청 다시 확인' })).toBeVisible();
  await page.getByRole('button', { name: '같은 요청 다시 확인' }).click();
  await expect(page.locator('.v2-currency').first()).toContainText('295');
  expect((await apiState(page)).inventory.bread).toBe(1);
  await page.reload();
  expect((await apiState(page)).inventory.bread).toBe(1);
  expect((await apiState(page)).money).toBe(295);
});
