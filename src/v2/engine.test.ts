import { describe, expect, it } from 'vitest';
import { COSMETICS, INGREDIENTS, RECIPES, RECIPE_IDS, levelFromXp, recipeIngredients } from './content';
import type { IngredientId, RecipeId } from './content';
import { applyCommand, canRecoverIngredient, GameRuleError, importLegacy, initialGame, minigameReward, orderMatches, restoreState, rewardValue } from './engine';
import type { GameState } from './engine';

const now = new Date(2026, 8, 27, 12).getTime();
const cook = (state: GameState, recipeId: RecipeId) => applyCommand(state, { type: 'COOK', recipeId, topping: 'none', shape: 'heart' }, now, () => 0).state;
const stocked = (state: GameState): GameState => ({ ...state, inventory: Object.fromEntries(Object.keys(INGREDIENTS).map(id => [id, 20])) as GameState['inventory'] });

describe('냥냥식당 v2 콘텐츠와 성장', () => {
  it('Lv.2~5 each unlock at least two new normal dishes, with secrets every two levels', () => {
    for (const level of [2, 3, 4, 5]) expect(RECIPE_IDS.filter(id => RECIPES[id].level === level && !('secret' in RECIPES[id])).length).toBeGreaterThanOrEqual(2);
    expect(RECIPE_IDS.filter(id => 'secret' in RECIPES[id] && RECIPES[id].level <= 2).length).toBeGreaterThanOrEqual(1);
    expect(RECIPE_IDS.filter(id => 'secret' in RECIPES[id] && RECIPES[id].level > 2 && RECIPES[id].level <= 4).length).toBeGreaterThanOrEqual(1);
  });
  it('levels after first dish, then two more dishes', () => {
    let state = stocked(initialGame());
    state = cook(state, 'fried_egg'); expect(levelFromXp(state.xp)).toBe(2);
    state = applyCommand(state, { type: 'SERVE', target: 'customer' }, now, () => 0).state;
    state = cook(state, 'banana_toast'); expect(levelFromXp(state.xp)).toBe(2);
    state = applyCommand(state, { type: 'SERVE', target: 'mother' }, now, () => 0).state;
    state = cook(state, 'tomato_egg'); expect(levelFromXp(state.xp)).toBe(3);
  });
  it('never consumes ingredients on a failed cook and prevents another cook while holding a dish', () => {
    const fresh = initialGame();
    expect(() => cook(fresh, 'jam_toast')).toThrow(GameRuleError);
    expect(fresh.inventory.bread).toBe(0);
    const cooked = cook(fresh, 'fried_egg');
    expect(cooked.inventory.egg).toBe(2);
    expect(() => cook(cooked, 'fried_egg')).toThrow('먼저 서빙');
  });
  it('counts ingredients used in multiple stages and in plating exactly once per use', () => {
    const state = stocked({ ...initialGame(), xp: 780 });
    const before = state.inventory.strawberry;
    const result = applyCommand(state, { type: 'COOK', recipeId: 'strawberry_smoothie', topping: 'strawberry', shape: 'star' }, now);
    expect(result.state.inventory.strawberry).toBe(before - 3);
    expect(recipeIngredients('strawberry_smoothie').filter(id => id === 'strawberry')).toHaveLength(2);
  });
  it('keeps up to three placed decorations through a save and charges for each edible topping', () => {
    const state = stocked({ ...initialGame(), xp: 780 });
    const decorations = [
      { kind: 'shape' as const, id: 'heart' as const, x: 25, y: 70 },
      { kind: 'topping' as const, id: 'strawberry' as const, x: 60, y: 30 },
      { kind: 'topping' as const, id: 'strawberry' as const, x: 72, y: 48 },
    ];
    const cooked = applyCommand(state, { type: 'COOK', recipeId: 'fried_egg', topping: 'strawberry', shape: 'heart', decorations }, now).state;
    expect(cooked.inventory.strawberry).toBe(state.inventory.strawberry - 2);
    expect(restoreState(JSON.parse(JSON.stringify(cooked))).heldDish?.decorations).toEqual(decorations);
    expect(() => applyCommand(state, { type: 'COOK', recipeId: 'fried_egg', topping: 'none', shape: 'heart', decorations: [...decorations, decorations[0]] }, now)).toThrow('장식');
    expect(() => applyCommand(state, { type: 'COOK', recipeId: 'fried_egg', topping: 'none', shape: 'heart', decorations: [{ ...decorations[0], x: 200 }] }, now)).toThrow('장식');
  });
  it('allows special dishes to satisfy their base order and preserves the panda customer', () => {
    const state = stocked({ ...initialGame(), xp: 120 });
    const cooked = cook(state, 'salted_egg');
    expect(orderMatches(state.order, 'salted_egg')).toBe(true);
    const served = applyCommand(cooked, { type: 'SERVE', target: 'customer' }, now, () => 0).state;
    expect(served.successfulServes).toBe(1);
    expect(served.heldDish).toBeNull();
  });
});

describe('경제·가족·보상', () => {
  it('recovers from a genuine dead end once and preserves progress and purchases', () => {
    let state = initialGame('2026-09-27');
    for (let index = 0; index < 3; index++) {
      state = cook(state, 'fried_egg');
      state = applyCommand(state, { type: 'SERVE', target: 'father' }, now).state;
    }
    expect(canRecoverIngredient(state, '2026-09-27')).toBe(false); // The quest reward is still available.
    state = applyCommand(state, { type: 'CLAIM', questId: 'cook_2' }, now).state;
    for (const id of ['garden_background', 'evening_background', 'mint_outfit'] as const) {
      state = applyCommand(state, { type: 'BUY_COSMETIC', id }, now).state;
    }
    state = applyCommand(state, { type: 'START_MINIGAME' }, now).state;
    state = applyCommand(state, { type: 'ABANDON_MINIGAME' }, now).state;
    expect(state.money).toBe(0);
    expect(canRecoverIngredient(state, '2026-09-27')).toBe(true);
    const savedXp = state.xp, savedOwned = state.owned;
    const recovered = applyCommand(state, { type: 'RECOVER_INGREDIENT' }, now).state;
    expect(recovered.inventory.egg).toBe(1);
    expect(recovered.xp).toBe(savedXp);
    expect(recovered.owned).toEqual(savedOwned);
    expect(canRecoverIngredient(recovered, '2026-09-27')).toBe(false);
    expect(() => applyCommand(recovered, { type: 'RECOVER_INGREDIENT' }, now)).toThrow();
    expect(cook(recovered, 'fried_egg').heldDish?.id).toBe('fried_egg');
  });
  it('cart changes money and stock together and rejects invalid quantity or unaffordable carts', () => {
    const start = initialGame();
    const result = applyCommand(start, { type: 'BUY_CART', items: { bread: 2, jam: 1 } }, now);
    expect(result.state.money).toBe(195);
    expect(result.state.inventory.bread).toBe(2);
    expect(result.state.inventory.jam).toBe(1);
    expect(() => applyCommand(start, { type: 'BUY_CART', items: { bread: 100 } }, now)).toThrow();
    expect(() => applyCommand(start, { type: 'BUY_CART', items: { milk: 20 } }, now)).toThrow();
    expect(start.money).toBe(350);
  });
  it('gives distinct family preference rewards and keeps the customer order intact', () => {
    const start = stocked(initialGame());
    const cooked = cook(start, 'fried_egg');
    const father = applyCommand(cooked, { type: 'SERVE', target: 'father' }, now);
    const sibling = applyCommand(cooked, { type: 'SERVE', target: 'sibling' }, now);
    expect(father.outcome.reward!.money).toBeGreaterThan(sibling.outcome.reward!.money!);
    expect(father.state.order).toEqual(cooked.order);
    expect(father.state.heldDish).toBeNull();
    expect(() => applyCommand(father.state, { type: 'SERVE', target: 'father' }, now)).toThrow();
  });
  it('rejects duplicate quest claims and purchased cosmetics', () => {
    const start = { ...initialGame(), daily: { date: '2026-09-27', cooked: 2, served: 2, claimed: [] } } as GameState;
    const claim = applyCommand(start, { type: 'CLAIM', questId: 'cook_2' }, now);
    expect(claim.state.money).toBe(500);
    expect(() => applyCommand(claim.state, { type: 'CLAIM', questId: 'cook_2' }, now)).toThrow('이미');
    const buy = applyCommand(claim.state, { type: 'BUY_COSMETIC', id: 'berry_hat' }, now);
    expect(buy.state.owned).toContain('berry_hat');
    expect(buy.state.equipped.hat).toBe('berry_hat');
    expect(() => applyCommand(buy.state, { type: 'BUY_COSMETIC', id: 'berry_hat' }, now)).toThrow('이미');
    expect(COSMETICS.berry_hat.price).toBe(180);
  });
  it('all completed minigame tiers exceed 100 coins and only one fee/reward occurs', () => {
    for (let score = 0; score <= 12; score++) expect(rewardValue(minigameReward(score))).toBeGreaterThanOrEqual(100);
    expect(minigameReward(0)).not.toEqual(minigameReward(4));
    expect(minigameReward(4)).not.toEqual(minigameReward(8));
    expect(() => applyCommand({ ...initialGame(), money: 99 }, { type: 'START_MINIGAME' }, now)).toThrow('100코인');
    const started = applyCommand(initialGame(), { type: 'START_MINIGAME' }, now, () => .5).state;
    expect(started.money).toBe(250);
    expect(() => applyCommand(started, { type: 'START_MINIGAME' }, now)).toThrow();
    const abandoned = applyCommand(started, { type: 'ABANDON_MINIGAME' }, now).state;
    expect(abandoned.money).toBe(250);
    expect(abandoned.minigame).toBeNull();
    const done = applyCommand(started, { type: 'FINISH_MINIGAME', runId: started.minigame!.id, score: 4 }, now + 12_500);
    expect(done.state.inventory.milk).toBe(2);
    expect(done.state.minigame).toBeNull();
    expect(() => applyCommand(done.state, { type: 'FINISH_MINIGAME', runId: started.minigame!.id, score: 4 }, now + 13_000)).toThrow();
  });
  it('draws only unowned gifts and deducts real hearts', () => {
    const first = applyCommand({ ...initialGame(), hearts: 10 }, { type: 'DRAW' }, now, () => 0).state;
    expect(first.hearts).toBe(5);
    expect(first.owned).toHaveLength(1);
    const second = applyCommand(first, { type: 'DRAW' }, now, () => 0).state;
    expect(second.hearts).toBe(0);
    expect(second.owned).toHaveLength(2);
    expect(new Set(second.owned).size).toBe(2);
  });
});

describe('저장 유효성·이전 기록', () => {
  it('restores a current save and sanitizes damaged fields', () => {
    const state = initialGame();
    expect(restoreState(JSON.parse(JSON.stringify(state)))).toEqual(state);
    const damaged = restoreState({ ...state, inventory: { egg: -9 }, money: -1 });
    expect(damaged.money).toBe(350);
    expect(damaged.inventory.egg).toBe(3);
  });
  it('imports old coins, XP, ingredients and hats without deleting the source', () => {
    const old = { version: 2, xp: 500, money: 880, hearts: 6, inventory: { egg: 4, bread: 3, milk: 2, flour: 1, butter: 1, oil: 0, salt: 0, sugar: 0 },
      order: { recipeId: 'toast', customerId: 'rabbit', special: false }, heldDish: 'fried_egg', ownedHats: ['berry'], equippedHat: 'berry' };
    const imported = importLegacy(old);
    expect(imported.xp).toBe(500);
    expect(imported.money).toBe(880);
    expect(imported.order.recipeId).toBe('jam_toast');
    expect(imported.heldDish?.id).toBe('fried_egg');
    expect(imported.owned).toContain('berry_hat');
    expect(imported.inventory.butter).toBe(1);
    expect(old.money).toBe(880);
    expect(() => importLegacy({ ...old, money: -1 })).toThrow('형식');
  });
  it('does not allow negative quantities for any inventory item', () => {
    const state = stocked({ ...initialGame(), xp: 1300 });
    let next = state;
    for (const id of RECIPE_IDS) { next = cook(next, id); next = applyCommand(next, { type: 'SERVE', target: 'mother' }, now).state; }
    for (const id of Object.keys(INGREDIENTS) as IngredientId[]) expect(next.inventory[id]).toBeGreaterThanOrEqual(0);
  });
});

describe('접시 앨범·가족 이야기·선택 목표', () => {
  it('keeps a named colored plate and placed decorations through save and serving', () => {
    const start = stocked(initialGame());
    const decorations = [{ kind: 'shape' as const, id: 'star' as const, x: 73, y: 31 }];
    const made = applyCommand(start, { type: 'COOK', recipeId: 'fried_egg', topping: 'none', shape: 'star', plateColor: 'mint', name: '반짝 프라이', decorations }, now).state;
    expect(made.album).toHaveLength(1);
    expect(made.album[0].dish).toEqual(made.heldDish);
    expect(restoreState(JSON.parse(JSON.stringify(made))).album[0].dish.decorations).toEqual(decorations);
    const served = applyCommand(made, { type: 'SERVE', target: 'father' }, now);
    expect(served.outcome.message).toContain('별 장식');
    expect(served.state.album[0].dish.name).toBe('반짝 프라이');
    expect(() => applyCommand(start, { type: 'COOK', recipeId: 'fried_egg', topping: 'none', shape: 'heart', name: '가'.repeat(25) }, now)).toThrow('24글자');
  });
  it('advances a story with family meals and records a favorite memory', () => {
    let state = stocked(initialGame());
    for (let index = 0; index < 3; index++) {
      state = cook(state, 'fried_egg');
      const result = applyCommand(state, { type: 'SERVE', target: 'father' }, now);
      state = result.state;
      if (index === 2) expect(result.outcome.story).toBe(1);
    }
    expect(state.storyProgress).toBe(3);
    expect(state.successfulServes).toBe(0);
    expect(state.stories).toContain(1);
    expect(state.familyVisits.father).toBe(3);
    expect(state.familyMemories).toContain('father');
  });
  it('unlocks optional Lv.5 goals, claims once, and restores old saves with new defaults', () => {
    const oldSave = initialGame();
    const restored = restoreState({ ...oldSave, album: undefined, familyVisits: undefined, storyProgress: undefined, selectedGoal: undefined, completedGoals: undefined });
    expect(restored.album).toEqual([]);
    expect(restored.familyVisits.father).toBe(0);
    const levelFive = stocked({ ...initialGame(), xp: 1300, discovered: [...RECIPE_IDS.slice(0, 8)] });
    expect(() => applyCommand(initialGame(), { type: 'SELECT_GOAL', id: 'discover_8' }, now)).toThrow('Lv.5');
    const selected = applyCommand(levelFive, { type: 'SELECT_GOAL', id: 'discover_8' }, now).state;
    const claimed = applyCommand(selected, { type: 'CLAIM_GOAL', id: 'discover_8' }, now).state;
    expect(claimed.money).toBe(selected.money + 100);
    expect(claimed.hearts).toBe(selected.hearts + 2);
    expect(() => applyCommand(claimed, { type: 'CLAIM_GOAL', id: 'discover_8' }, now)).toThrow();
  });
});
