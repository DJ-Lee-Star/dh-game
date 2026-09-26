import { BASE_RECIPES, CUSTOMERS, INGREDIENTS, LEVEL_XP, MART_ITEMS, RECIPES, SPECIAL_CUSTOMER_ID, levelFromXp, recipeCost, recipeIngredients } from './data';
import type { CustomerId, IngredientId, RecipeId } from './data';

export const SAVE_KEY = 'nyanyang-restaurant-v2';
export type QuestId = 'cook_2' | 'serve_2';
export type HatId = 'berry' | 'star' | 'clover';
export const HATS: Record<HatId, { name: string; color: string }> = {
  berry: { name: '딸기 리본', color: '#e96572' },
  star: { name: '별빛 배지', color: '#efb54a' },
  clover: { name: '행운 클로버', color: '#67ad83' },
};

export interface Order { recipeId: RecipeId; customerId: CustomerId; special: boolean }
export interface DailyProgress { date: string; cooked: number; served: number; claimed: QuestId[] }
export interface GameEvent { kind: 'success' | 'served' | 'special' | 'family' | 'error' | 'reward' | 'discovery' | 'finale'; message: string; id: number; completedOrder?: Order }
export interface GameState {
  version: 2;
  xp: number;
  money: number;
  hearts: number;
  inventory: Record<IngredientId, number>;
  order: Order;
  heldDish: RecipeId | null;
  combo: number;
  successfulServes: number;
  discovered: RecipeId[];
  ownedHats: HatId[];
  equippedHat: HatId | null;
  finaleDone: boolean;
  daily: DailyProgress;
  event: GameEvent | null;
}

export type GameAction =
  | { type: 'RESET'; date: string }
  | { type: 'BUY'; ingredient: IngredientId }
  | { type: 'COOK'; recipeId: RecipeId; date: string }
  | { type: 'SERVE'; date: string; recipeRoll: number; customerRoll: number }
  | { type: 'CLAIM'; questId: QuestId; date: string }
  | { type: 'DRAW'; roll: number }
  | { type: 'EQUIP'; hatId: HatId }
  | { type: 'CLEAR_EVENT' }
  | { type: 'NEW_DAY'; date: string };

export function localDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function createInitialGame(date = localDateKey()): GameState {
  return {
    version: 2, xp: 0, money: 350, hearts: 0,
    inventory: { egg: 3, bread: 0, milk: 0, flour: 0, butter: 0, oil: 0, salt: 0, sugar: 0 },
    order: { recipeId: 'fried_egg', customerId: 'dog', special: false }, heldDish: null, combo: 0, successfulServes: 0,
    discovered: [], ownedHats: [], equippedHat: null, finaleDone: false,
    daily: { date, cooked: 0, served: 0, claimed: [] }, event: null,
  };
}

export function availableRecipes(level: number): RecipeId[] {
  return BASE_RECIPES.filter(id => RECIPES[id].level <= level);
}

export function questProgress(state: GameState, questId: QuestId): { value: number; target: number; reward: string } {
  return questId === 'cook_2'
    ? { value: Math.min(state.daily.cooked, 2), target: 2, reward: '150 코인' }
    : { value: Math.min(state.daily.served, 2), target: 2, reward: '하트 2개' };
}

function withDate(state: GameState, date: string): GameState {
  return state.daily.date === date ? state : { ...state, daily: { date, cooked: 0, served: 0, claimed: [] } };
}

function withEvent(state: GameState, kind: GameEvent['kind'], message: string, completedOrder?: Order): GameState {
  return { ...state, event: { kind, message, id: (state.event?.id ?? 0) + 1, completedOrder } };
}

function pickNextOrder(xp: number, recipeRoll: number, customerRoll: number, special: boolean): Order {
  const pool = availableRecipes(levelFromXp(xp));
  if (special) return { recipeId: pool[pool.length - 1], customerId: SPECIAL_CUSTOMER_ID, special: true };
  const recipeIndex = Math.min(pool.length - 1, Math.floor(Math.max(0, recipeRoll) * pool.length));
  const customerIndex = Math.min(CUSTOMERS.length - 1, Math.floor(Math.max(0, customerRoll) * CUSTOMERS.length));
  return { recipeId: pool[recipeIndex], customerId: CUSTOMERS[customerIndex], special: false };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'RESET': return createInitialGame(action.date);
    case 'BUY': {
      const item = INGREDIENTS[action.ingredient];
      if (!MART_ITEMS.includes(action.ingredient) || levelFromXp(state.xp) < item.level) return withEvent(state, 'error', '아직 살 수 없는 재료예요.');
      if (state.money < item.price) return withEvent(state, 'error', '코인이 부족해요. 주문을 완성해 보세요!');
      return withEvent({ ...state, money: state.money - item.price,
        inventory: { ...state.inventory, [action.ingredient]: state.inventory[action.ingredient] + 1 } },
      'reward', `${item.name} 구매 완료! 장바구니에 담았어요.`);
    }
    case 'COOK': {
      if (state.heldDish) return withEvent(state, 'error', '먼저 들고 있는 요리를 서빙해 주세요.');
      const recipe = RECIPES[action.recipeId];
      if (levelFromXp(state.xp) < recipe.level) return withEvent(state, 'error', '이 요리는 아직 배우지 않았어요.');
      const needed: Partial<Record<IngredientId, number>> = {};
      for (const ingredient of recipeIngredients(action.recipeId)) needed[ingredient] = (needed[ingredient] ?? 0) + 1;
      if (Object.entries(needed).some(([id, count]) => state.inventory[id as IngredientId] < count)) {
        return withEvent(state, 'error', '재료가 부족해요. 마트에서 장을 봐요!');
      }
      const inventory = { ...state.inventory };
      for (const [id, count] of Object.entries(needed)) inventory[id as IngredientId] -= count;
      const today = withDate(state, action.date);
      const discovered = today.discovered.includes(action.recipeId) ? today.discovered : [...today.discovered, action.recipeId];
      const next = { ...today, inventory, heldDish: action.recipeId, discovered,
        daily: { ...today.daily, cooked: today.daily.cooked + 1 } };
      return withEvent(next, discovered.length > today.discovered.length ? 'discovery' : 'success',
        discovered.length > today.discovered.length ? `새 요리 발견! ${recipe.name}` : `${recipe.name} 완성! 손님에게 가져가요.`);
    }
    case 'SERVE': {
      if (!state.heldDish) return state;
      const dish = state.heldDish;
      const matches = dish === state.order.recipeId || (dish === 'salted_egg' && state.order.recipeId === 'fried_egg');
      const today = withDate(state, action.date);
      if (!matches) {
        const familyReward = recipeCost(dish) + 40;
        return withEvent({ ...today, heldDish: null, money: today.money + familyReward, xp: today.xp + 45, combo: 0 },
          'family', `손님 주문과 달라 가족에게 대접했어요. +${familyReward} 코인`);
      }
      const recipe = RECIPES[dish];
      const combo = today.combo + 1;
      const bonus = combo >= 3 ? 1.25 : 1;
      const money = Math.round(recipe.reward * bonus * (today.order.special ? 2 : 1));
      const hearts = (combo >= 3 ? 2 : 1) + (today.order.special ? 2 : 0);
      const earnedXp = recipe.xp * (today.order.special ? 2 : 1);
      const xp = today.xp + earnedXp;
      const successfulServes = today.successfulServes + 1;
      const finale = dish === 'butter_toast' && !today.finaleDone;
      const next = { ...today, heldDish: null, money: today.money + money,
        hearts: today.hearts + hearts, xp, combo, successfulServes,
        finaleDone: today.finaleDone || finale,
        order: pickNextOrder(xp, action.recipeRoll, action.customerRoll, !today.order.special && successfulServes % 5 === 4),
        daily: { ...today.daily, served: today.daily.served + 1 } };
      const leveled = levelFromXp(xp) > levelFromXp(today.xp);
      return withEvent(next, finale ? 'finale' : today.order.special ? 'special' : 'served',
        `${finale ? '첫 시즌 완성! ' : leveled ? `레벨 ${levelFromXp(xp)} 달성! ` : ''}${today.order.special ? '스페셜 주문 성공! ' : '맛있게 먹었어요! '}+${money} 코인 · +${earnedXp} XP · +${hearts} 하트${next.order.special ? ' · 다음 손님은 별님!' : ''}`,
        today.order);
    }
    case 'CLAIM': {
      const today = withDate(state, action.date);
      const progress = questProgress(today, action.questId);
      if (progress.value < progress.target) return withEvent(today, 'error', '아직 퀘스트를 완료하지 않았어요.');
      if (today.daily.claimed.includes(action.questId)) return withEvent(today, 'error', '오늘은 이미 보상을 받았어요.');
      const claimed = [...today.daily.claimed, action.questId];
      return withEvent({ ...today, money: today.money + (action.questId === 'cook_2' ? 150 : 0),
        hearts: today.hearts + (action.questId === 'serve_2' ? 2 : 0),
        daily: { ...today.daily, claimed } }, 'reward', `${progress.reward} 보상 획득!`);
    }
    case 'DRAW': {
      if (state.hearts < 5) return withEvent(state, 'error', '하트 5개가 필요해요.');
      const unowned = (Object.keys(HATS) as HatId[]).filter(id => !state.ownedHats.includes(id));
      if (unowned.length === 0) return withEvent(state, 'error', '모든 꾸미기 아이템을 모았어요!');
      const index = Math.min(unowned.length - 1, Math.floor(Math.max(0, action.roll) * unowned.length));
      const hatId = unowned[index];
      return withEvent({ ...state, hearts: state.hearts - 5, ownedHats: [...state.ownedHats, hatId], equippedHat: hatId },
        'reward', `${HATS[hatId].name} 획득! 셰프가 바로 장착했어요.`);
    }
    case 'EQUIP':
      return state.ownedHats.includes(action.hatId)
        ? withEvent({ ...state, equippedHat: action.hatId }, 'reward', `${HATS[action.hatId].name} 장착!`)
        : state;
    case 'CLEAR_EVENT': return { ...state, event: null };
    case 'NEW_DAY': return withDate(state, action.date);
  }
}

export function loadGame(storage: Pick<Storage, 'getItem'>, date = localDateKey()): GameState {
  try {
    const raw = storage.getItem(SAVE_KEY);
    if (!raw) return createInitialGame(date);
    const value = JSON.parse(raw) as GameState;
    const base = createInitialGame(date);
    const validCount = (count: unknown): count is number => Number.isSafeInteger(count) && (count as number) >= 0;
    if (value.version !== 2 || !validCount(value.xp) || !validCount(value.money) || !validCount(value.hearts)
      || !validCount(value.combo) || (value.successfulServes !== undefined && !validCount(value.successfulServes)) || !value.inventory
      || !(Object.keys(base.inventory) as IngredientId[]).every(id => validCount(value.inventory[id]))
      || !value.order || !BASE_RECIPES.includes(value.order.recipeId)
      || (value.order.special === true ? value.order.customerId !== SPECIAL_CUSTOMER_ID : !CUSTOMERS.includes(value.order.customerId))
      || (value.heldDish !== null && !RECIPES[value.heldDish])
      || !value.daily || typeof value.daily.date !== 'string'
      || !validCount(value.daily.cooked) || !validCount(value.daily.served)) return base;
    const ownedHats = Array.isArray(value.ownedHats)
      ? [...new Set(value.ownedHats.filter(id => Boolean(HATS[id])))] : [];
    return withDate({ ...base, ...value,
      inventory: { ...base.inventory, ...value.inventory },
      order: { ...value.order, special: value.order.special === true },
      successfulServes: value.successfulServes ?? 0,
      event: null,
      discovered: Array.isArray(value.discovered) ? value.discovered.filter(id => Boolean(RECIPES[id])) : base.discovered,
      ownedHats,
      equippedHat: value.equippedHat && ownedHats.includes(value.equippedHat) ? value.equippedHat : null,
      finaleDone: value.finaleDone === true,
      daily: { ...value.daily, claimed: Array.isArray(value.daily.claimed)
        ? value.daily.claimed.filter(id => id === 'cook_2' || id === 'serve_2') : [] },
    }, date);
  } catch { return createInitialGame(date); }
}

export function saveGame(storage: Pick<Storage, 'setItem'>, state: GameState): void {
  try { storage.setItem(SAVE_KEY, JSON.stringify({ ...state, event: null })); } catch { /* Storage may be unavailable. */ }
}

export function nextLevelName(level: number): string {
  return level >= LEVEL_XP.length ? '최고 레벨' : `다음 레벨까지 ${LEVEL_XP[level] - LEVEL_XP[level - 1]} XP`;
}
