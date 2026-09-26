import { describe, expect, it } from 'vitest';
import { LEVEL_XP, levelFromXp, levelProgress, recipeIngredients } from './data';
import type { IngredientId, RecipeId } from './data';
import { SAVE_KEY, createInitialGame, gameReducer, loadGame, questProgress, saveGame } from './engine';

const day = '2026-09-26';

describe('growth and order loop', () => {
  it('shows a valid first-level meter and caps level five', () => {
    expect(levelProgress(0)).toEqual({ current: 0, needed: 300, percent: 0 });
    expect(levelFromXp(LEVEL_XP[4])).toBe(5);
    expect(levelProgress(LEVEL_XP[4])).toEqual({ current: 0, needed: 0, percent: 100 });
  });

  it('completes the first order, awards currency, and unlocks level two', () => {
    let state = createInitialGame(day);
    for (let i = 0; i < 3; i += 1) {
      state = gameReducer(state, { type: 'COOK', recipeId: 'fried_egg', date: day });
      state = gameReducer(state, { type: 'SERVE', date: day, recipeRoll: 0, customerRoll: 0.5 });
    }
    expect(levelFromXp(state.xp)).toBe(2);
    expect(state.order.recipeId).toBe('fried_egg');
    expect(state.inventory.egg).toBe(0);
    expect(state.money).toBeGreaterThan(350);
    expect(state.hearts).toBe(4);
    expect(state.daily.served).toBe(3);
  });

  it('does not consume stock on a blocked recipe or insufficient ingredients', () => {
    const initial = createInitialGame(day);
    expect(gameReducer(initial, { type: 'COOK', recipeId: 'toast', date: day }).inventory).toEqual(initial.inventory);
    const empty = { ...initial, inventory: { ...initial.inventory, egg: 0 } };
    const result = gameReducer(empty, { type: 'COOK', recipeId: 'fried_egg', date: day });
    expect(result.heldDish).toBeNull();
    expect(result.inventory.egg).toBe(0);
  });

  it('serves a wrong dish to family without removing the order or losing money', () => {
    let state = { ...createInitialGame(day), xp: 300, inventory: { ...createInitialGame(day).inventory, bread: 1 } };
    state = gameReducer(state, { type: 'COOK', recipeId: 'toast', date: day });
    const before = state.money;
    state = gameReducer(state, { type: 'SERVE', date: day, recipeRoll: 0.8, customerRoll: 0.8 });
    expect(state.order.recipeId).toBe('fried_egg');
    expect(state.heldDish).toBeNull();
    expect(state.money).toBe(before + 95);
    expect(state.combo).toBe(0);
  });

  it('discovers salted egg and lets it satisfy a fried egg order', () => {
    let state = createInitialGame(day);
    state = gameReducer(state, { type: 'COOK', recipeId: 'salted_egg', date: day });
    expect(state.discovered).toContain('salted_egg');
    state = gameReducer(state, { type: 'SERVE', date: day, recipeRoll: 0, customerRoll: 0 });
    expect(state.hearts).toBe(1);
    expect(state.money).toBe(580);
  });

  it('plays from level one through every level-five recipe with affordable supplies', () => {
    let state = createInitialGame(day);
    const served = new Set<RecipeId>();
    for (let turn = 0; turn < 30; turn += 1) {
      const recipeId = state.order.recipeId;
      const needed = recipeIngredients(recipeId).reduce((counts, id) => {
        counts[id] = (counts[id] ?? 0) + 1;
        return counts;
      }, {} as Partial<Record<IngredientId, number>>);
      for (const [id, count] of Object.entries(needed)) {
        while (state.inventory[id as IngredientId] < count) {
          state = gameReducer(state, { type: 'BUY', ingredient: id as IngredientId });
          expect(state.event?.kind).not.toBe('error');
        }
      }
      state = gameReducer(state, { type: 'COOK', recipeId, date: day });
      expect(state.heldDish).toBe(recipeId);
      state = gameReducer(state, { type: 'SERVE', date: day, recipeRoll: 0.999, customerRoll: 0.999 });
      served.add(recipeId);
      expect(state.heldDish).toBeNull();
      expect(Object.values(state.inventory).every(count => count >= 0)).toBe(true);
      if (served.has('butter_toast')) break;
    }
    expect(levelFromXp(state.xp)).toBe(5);
    expect(served).toEqual(new Set(['fried_egg', 'toast', 'warm_milk', 'pancake', 'butter_toast']));
    expect(state.finaleDone).toBe(true);
    expect(state.money).toBeGreaterThan(0);
  });
});

describe('special guest', () => {
  it('visits after four successful orders, waits after a wrong dish, and pays the promised bonus', () => {
    let state = { ...createInitialGame(day), inventory: { ...createInitialGame(day).inventory, egg: 6, bread: 1 } };
    for (let i = 0; i < 4; i += 1) {
      state = gameReducer(state, { type: 'COOK', recipeId: 'fried_egg', date: day });
      state = gameReducer(state, { type: 'SERVE', date: day, recipeRoll: 0, customerRoll: 0 });
    }
    expect(state.successfulServes).toBe(4);
    expect(state.order).toEqual({ recipeId: 'toast', customerId: 'panda', special: true });
    const specialOrder = state.order;
    state = gameReducer(state, { type: 'COOK', recipeId: 'fried_egg', date: day });
    state = gameReducer(state, { type: 'SERVE', date: day, recipeRoll: 0, customerRoll: 0 });
    expect(state.order).toEqual(specialOrder);
    expect(state.successfulServes).toBe(4);
    const beforeMoney = state.money;
    const beforeXp = state.xp;
    const beforeHearts = state.hearts;
    state = gameReducer(state, { type: 'COOK', recipeId: 'toast', date: day });
    state = gameReducer(state, { type: 'SERVE', date: day, recipeRoll: 0, customerRoll: 0 });
    expect(state.event?.kind).toBe('special');
    expect(state.event?.completedOrder).toEqual(specialOrder);
    expect(state.money - beforeMoney).toBe(480);
    expect(state.xp - beforeXp).toBe(300);
    expect(state.hearts - beforeHearts).toBe(3);
    expect(state.successfulServes).toBe(5);
    expect(state.order.special).toBe(false);
  });

  it('restores a waiting special guest and migrates older save data without losing progress', () => {
    const base = createInitialGame(day);
    const special = { ...base, xp: 480, successfulServes: 4,
      order: { recipeId: 'toast' as const, customerId: 'panda' as const, special: true } };
    const storage = { getItem: () => JSON.stringify(special) };
    expect(loadGame(storage, day).order).toEqual(special.order);
    expect(loadGame(storage, day).successfulServes).toBe(4);
    const { successfulServes: _oldCount, ...oldFields } = base;
    void _oldCount;
    const oldSave = { ...oldFields, xp: 300, order: { recipeId: 'toast', customerId: 'rabbit' } };
    const legacyStorage = { getItem: () => JSON.stringify(oldSave) };
    const loaded = loadGame(legacyStorage, day);
    expect(loaded.xp).toBe(300);
    expect(loaded.order).toEqual({ ...oldSave.order, special: false });
    expect(loaded.successfulServes).toBe(0);
  });
});

describe('shop, daily quests, and gifts', () => {
  it('locks ingredients by level and charges exactly once on purchase', () => {
    const initial = createInitialGame(day);
    expect(gameReducer(initial, { type: 'BUY', ingredient: 'bread' }).money).toBe(initial.money);
    const next = gameReducer(initial, { type: 'BUY', ingredient: 'egg' });
    expect(next.money).toBe(310);
    expect(next.inventory.egg).toBe(4);
  });

  it('tracks real quest progress and prevents duplicate claims', () => {
    let state = createInitialGame(day);
    for (let i = 0; i < 2; i += 1) {
      state = gameReducer(state, { type: 'COOK', recipeId: 'fried_egg', date: day });
      state = gameReducer(state, { type: 'SERVE', date: day, recipeRoll: 0, customerRoll: 0 });
    }
    expect(questProgress(state, 'cook_2').value).toBe(2);
    expect(questProgress(state, 'serve_2').value).toBe(2);
    state = gameReducer(state, { type: 'CLAIM', questId: 'cook_2', date: day });
    const awarded = state.money;
    state = gameReducer(state, { type: 'CLAIM', questId: 'cook_2', date: day });
    expect(state.money).toBe(awarded);
    state = gameReducer(state, { type: 'NEW_DAY', date: '2026-09-27' });
    expect(state.daily.cooked).toBe(0);
    expect(state.daily.claimed).toEqual([]);
  });

  it('adds and equips a real gift without giving duplicates', () => {
    let state = { ...createInitialGame(day), hearts: 15 };
    state = gameReducer(state, { type: 'DRAW', roll: 0 });
    expect(state.hearts).toBe(10);
    expect(state.ownedHats).toEqual(['berry']);
    expect(state.equippedHat).toBe('berry');
    state = gameReducer(state, { type: 'DRAW', roll: 0 });
    expect(state.ownedHats).toEqual(['berry', 'star']);
  });
});

describe('save data', () => {
  it('resets the current play record and keeps the new game after reload', () => {
    const values = new Map<string, string>();
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
    const progressed = { ...createInitialGame(day), xp: 850, money: 975, hearts: 8,
      ownedHats: ['berry' as const], equippedHat: 'berry' as const,
      inventory: { ...createInitialGame(day).inventory, bread: 4 } };
    saveGame(storage, progressed);
    const reset = gameReducer(loadGame(storage, day), { type: 'RESET', date: day });
    saveGame(storage, reset);
    expect(reset).toEqual(createInitialGame(day));
    expect(loadGame(storage, day)).toEqual(createInitialGame(day));
  });

  it('restores progress and refreshes only the daily quest date', () => {
    const values = new Map<string, string>();
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
    const state = { ...createInitialGame(day), xp: 910, money: 777, hearts: 9 };
    saveGame(storage, state);
    const loaded = loadGame(storage, '2026-09-27');
    expect(loaded.xp).toBe(910);
    expect(loaded.money).toBe(777);
    expect(loaded.hearts).toBe(9);
    expect(loaded.daily.date).toBe('2026-09-27');
    expect(loaded.daily.served).toBe(0);
  });

  it('starts safely when stored data is corrupt', () => {
    const storage = { getItem: (key: string) => key === SAVE_KEY ? '{bad' : null };
    expect(loadGame(storage, day)).toEqual(createInitialGame(day));
  });

  it('rejects malformed inventory and currency values in a stored game', () => {
    const bad = { ...createInitialGame(day), hearts: -5, inventory: { ...createInitialGame(day).inventory, egg: -10 } };
    const storage = { getItem: () => JSON.stringify(bad) };
    expect(loadGame(storage, day)).toEqual(createInitialGame(day));
  });
});
