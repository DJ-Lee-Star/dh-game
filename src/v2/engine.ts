import { COSMETICS, COSMETIC_IDS, CUSTOMERS, FAMILY_FAVORITES, INGREDIENTS, LEVEL_XP, MART_ITEMS, RECIPES, RECIPE_IDS, levelFromXp, recipeCost, recipeIngredients } from './content';
import type { CosmeticId, CosmeticSlot, CustomerId, FamilyId, IngredientId, Recipe, RecipeId } from './content';

export const LEGACY_SAVE_KEY = 'nyanyang-restaurant-v2';
export type QuestId = 'cook_2' | 'serve_2';
export type ToppingId = 'none' | 'jam' | 'banana' | 'strawberry';
export type ShapeId = 'heart' | 'star' | 'smile';
export interface Order { kind: 'specific' | 'wish'; recipeId: RecipeId; accepted: RecipeId[]; customerId: CustomerId; special: boolean; wish?: string }
export interface HeldDish { id: RecipeId; topping: ToppingId; shape: ShapeId }
export interface DailyProgress { date: string; cooked: number; served: number; claimed: QuestId[] }
export interface MinigameRun { id: string; startedAt: number; seed: number }
export interface GameState {
  version: 3;
  xp: number;
  money: number;
  hearts: number;
  inventory: Record<IngredientId, number>;
  order: Order;
  heldDish: HeldDish | null;
  successfulServes: number;
  combo: number;
  discovered: RecipeId[];
  combinations: string[];
  stories: number[];
  owned: CosmeticId[];
  equipped: Partial<Record<CosmeticSlot, CosmeticId>>;
  daily: DailyProgress;
  minigame: MinigameRun | null;
}

export type Command =
  | { type: 'BUY_CART'; items: Partial<Record<IngredientId, number>> }
  | { type: 'COOK'; recipeId: RecipeId; topping: ToppingId; shape: ShapeId }
  | { type: 'SERVE'; target: 'customer' | FamilyId }
  | { type: 'CLAIM'; questId: QuestId }
  | { type: 'DRAW' }
  | { type: 'BUY_COSMETIC'; id: CosmeticId }
  | { type: 'EQUIP'; id: CosmeticId | null; slot: CosmeticSlot }
  | { type: 'START_MINIGAME' }
  | { type: 'FINISH_MINIGAME'; runId: string; score: number }
  | { type: 'ABANDON_MINIGAME' }
  | { type: 'RESET' };

export interface Outcome { kind: 'purchase' | 'cook' | 'customer' | 'family' | 'reward' | 'minigame' | 'reset'; message: string; dish?: HeldDish; eater?: CustomerId | FamilyId; reward?: { money?: number; hearts?: number; ingredients?: Partial<Record<IngredientId, number>> }; story?: number }
export class GameRuleError extends Error { constructor(message: string) { super(message); this.name = 'GameRuleError'; } }
const fail = (message: string): never => { throw new GameRuleError(message); };
const validInt = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) >= 0;
const validId = <T extends string>(value: unknown, values: readonly T[]): value is T => typeof value === 'string' && values.includes(value as T);
const ingredients = Object.keys(INGREDIENTS) as IngredientId[];
const customerIds = Object.keys(CUSTOMERS) as CustomerId[];
const toppingIds: ToppingId[] = ['none', 'jam', 'banana', 'strawberry'];
const shapeIds: ShapeId[] = ['heart', 'star', 'smile'];
const questIds: QuestId[] = ['cook_2', 'serve_2'];

export function dateKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function initialGame(today = dateKey()): GameState {
  const inventory = Object.fromEntries(ingredients.map(id => [id, id === 'egg' ? 3 : 0])) as Record<IngredientId, number>;
  return { version: 3, xp: 0, money: 350, hearts: 0, inventory,
    order: { kind: 'specific', recipeId: 'fried_egg', accepted: ['fried_egg'], customerId: 'dog', special: false },
    heldDish: null, successfulServes: 0, combo: 0, discovered: [], combinations: [], stories: [], owned: [], equipped: {},
    daily: { date: today, cooked: 0, served: 0, claimed: [] }, minigame: null };
}

function todayState(state: GameState, today: string): GameState {
  return state.daily.date === today ? state : { ...state, daily: { date: today, cooked: 0, served: 0, claimed: [] } };
}

export function orderMatches(order: Order, recipeId: RecipeId): boolean {
  return order.accepted.includes(recipeId) || (recipeId === 'salted_egg' && order.accepted.includes('fried_egg')) || (recipeId === 'berry_pancake' && order.accepted.includes('pancake'));
}

function nextOrder(xp: number, served: number, random: () => number): Order {
  const available = RECIPE_IDS.filter(id => !(RECIPES[id] as Recipe).secret && RECIPES[id].level <= levelFromXp(xp));
  const special = served > 0 && served % 5 === 4;
  const recipeId = special ? available[available.length - 1] : available[Math.floor(random() * available.length) % available.length];
  const customerId = special ? 'panda' : customerIds[Math.floor(random() * 4) % 4];
  const wish = !special && served > 0 && served % 3 === 2;
  const accepted = wish ? available.filter(id => RECIPES[id].sweet === RECIPES[recipeId].sweet) : [recipeId];
  return { kind: wish ? 'wish' : 'specific', recipeId, accepted, customerId, special,
    ...(wish ? { wish: RECIPES[recipeId].sweet ? '달콤한 간식이 먹고 싶어!' : '따뜻하고 든든한 요리가 좋아!' } : {}) };
}

export function minigameDrops(seed: number): { id: number; x: number; at: number; ingredient: IngredientId }[] {
  const pool: IngredientId[] = ['egg', 'bread', 'milk', 'jam', 'banana'];
  let value = seed >>> 0;
  return Array.from({ length: 12 }, (_, id) => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return { id, x: 8 + value % 84, at: id * 850, ingredient: pool[id % pool.length] };
  });
}

export function minigameReward(score: number): Partial<Record<IngredientId, number>> {
  if (!validInt(score) || score > 12) fail('점수를 다시 확인해 주세요.');
  if (score >= 8) return { egg: 2, milk: 2, jam: 1 };
  if (score >= 4) return { milk: 2, bread: 1 };
  return { egg: 2, bread: 1 };
}
export const rewardValue = (reward: Partial<Record<IngredientId, number>>) =>
  Object.entries(reward).reduce((sum, [id, count]) => sum + INGREDIENTS[id as IngredientId].price * (count ?? 0), 0);

export function applyCommand(input: GameState, command: Command, now = Date.now(), random = Math.random): { state: GameState; outcome: Outcome } {
  const state = todayState(input, dateKey(new Date(now)));
  switch (command.type) {
    case 'RESET': return { state: initialGame(dateKey(new Date(now))), outcome: { kind: 'reset', message: '새로운 냥냥식당이 열렸어요!' } };
    case 'BUY_CART': {
      if (!command.items || typeof command.items !== 'object') fail('장바구니를 다시 확인해 주세요.');
      const entries = Object.entries(command.items) as [IngredientId, number][];
      if (!entries.length || entries.length > MART_ITEMS.length) fail('장바구니가 비어 있어요.');
      let total = 0;
      let quantity = 0;
      const inventory = { ...state.inventory };
      for (const [id, count] of entries) {
        if (!MART_ITEMS.includes(id) || !validInt(count) || count < 1 || count > 20 || INGREDIENTS[id].level > levelFromXp(state.xp)) fail('살 수 없는 재료가 장바구니에 있어요.');
        quantity += count; total += INGREDIENTS[id].price * count; inventory[id] += count;
      }
      if (quantity > 30) fail('한 번에 30개까지만 살 수 있어요.');
      if (state.money < total) fail('코인이 부족해요. 장바구니를 조금 줄여 볼까요?');
      return { state: { ...state, money: state.money - total, inventory }, outcome: { kind: 'purchase', message: `${quantity}개를 냉장고와 선반에 쏙! −${total}코인` } };
    }
    case 'COOK': {
      const { recipeId, topping, shape } = command;
      if (!validId(recipeId, RECIPE_IDS) || !validId(topping, toppingIds) || !validId(shape, shapeIds)) fail('요리 정보를 다시 확인해 주세요.');
      if (state.heldDish) fail('완성한 요리를 먼저 서빙해 주세요.');
      const recipe = RECIPES[recipeId];
      if (recipe.level > levelFromXp(state.xp)) fail('아직 배우지 않은 요리예요.');
      const needed: Partial<Record<IngredientId, number>> = {};
      for (const id of recipeIngredients(recipeId)) needed[id] = (needed[id] ?? 0) + 1;
      if (topping !== 'none') {
        if (INGREDIENTS[topping].level > levelFromXp(state.xp)) fail('이 장식 재료는 아직 살 수 없어요.');
        needed[topping] = (needed[topping] ?? 0) + 1;
      }
      const inventory = { ...state.inventory };
      for (const [id, count] of Object.entries(needed) as [IngredientId, number][]) {
        if (inventory[id] < count) fail(`앗, ${INGREDIENTS[id].name}이(가) 부족해요! 마트에서 데려올까요?`);
        inventory[id] -= count;
      }
      const heldDish = { id: recipeId, topping, shape };
      const combination = `${recipeId}:${topping}:${shape}`;
      const next = { ...state, xp: state.xp + recipe.xp, inventory, heldDish,
        discovered: state.discovered.includes(recipeId) ? state.discovered : [...state.discovered, recipeId],
        combinations: state.combinations.includes(combination) ? state.combinations : [...state.combinations, combination],
        daily: { ...state.daily, cooked: state.daily.cooked + 1 } };
      const leveled = levelFromXp(next.xp) > levelFromXp(state.xp);
      return { state: next, outcome: { kind: 'cook', dish: heldDish, message: `${recipe.name} 완성! +${recipe.xp} XP${leveled ? ` · Lv.${levelFromXp(next.xp)} 달성!` : ''}` } };
    }
    case 'SERVE': {
      if (!state.heldDish) fail('먼저 요리를 만들어 주세요.');
      const dish = state.heldDish!;
      if (command.target === 'customer') {
        if (!orderMatches(state.order, dish.id)) fail('손님 주문과 달라요. 가족에게 대접해 볼까요?');
        const recipe = RECIPES[dish.id];
        const earned = Math.round(recipe.reward * (state.order.special ? 2 : 1) * (state.combo >= 2 ? 1.15 : 1));
        const hearts = state.order.special ? 3 : 1;
        const successfulServes = state.successfulServes + 1;
        const chapter = successfulServes % 3 === 0 ? Math.floor(successfulServes / 3) : 0;
        const newStory = chapter > 0 && chapter <= 3 && !state.stories.includes(chapter);
        const storyBonus = newStory ? 100 : 0;
        const next = { ...state, heldDish: null, money: state.money + earned + storyBonus, hearts: state.hearts + hearts,
          combo: state.combo + 1, successfulServes, stories: newStory ? [...state.stories, chapter] : state.stories,
          order: nextOrder(state.xp, successfulServes, random), daily: { ...state.daily, served: state.daily.served + 1 } };
        return { state: next, outcome: { kind: 'customer', dish, eater: state.order.customerId, story: newStory ? chapter : undefined,
          reward: { money: earned + storyBonus, hearts }, message: `${CUSTOMERS[state.order.customerId]}가 맛있게 먹었어요! +${earned + storyBonus}코인 · +${hearts}하트${newStory ? ' · 이야기 스티커 발견!' : ''}` } };
      }
      if (!validId(command.target, ['mother', 'father', 'sibling'] as const)) fail('누구에게 줄지 골라 주세요.');
      const favorite = FAMILY_FAVORITES[command.target].includes(dish.id);
      const earned = recipeCost(dish.id) + (favorite ? 110 : 45);
      const hearts = favorite ? 1 : 0;
      return { state: { ...state, heldDish: null, money: state.money + earned, hearts: state.hearts + hearts, combo: 0 },
        outcome: { kind: 'family', dish, eater: command.target, reward: { money: earned, hearts },
          message: `${command.target === 'mother' ? '엄마' : command.target === 'father' ? '아빠' : '동생'}가 ${favorite ? '정말 좋아해요!' : '맛있게 먹었어요!'} +${earned}코인${hearts ? ' · +1하트' : ''}` } };
    }
    case 'CLAIM': {
      if (!validId(command.questId, questIds)) fail('퀘스트를 다시 확인해 주세요.');
      const progress = command.questId === 'cook_2' ? state.daily.cooked : state.daily.served;
      if (progress < 2) fail('조금만 더 하면 보상을 받을 수 있어요!');
      if (state.daily.claimed.includes(command.questId)) fail('오늘은 이미 보상을 받았어요.');
      const money = command.questId === 'cook_2' ? 150 : 0;
      const hearts = command.questId === 'serve_2' ? 2 : 0;
      return { state: { ...state, money: state.money + money, hearts: state.hearts + hearts,
        daily: { ...state.daily, claimed: [...state.daily.claimed, command.questId] } },
        outcome: { kind: 'reward', reward: { money, hearts }, message: `오늘의 퀘스트 보상! ${money ? `+${money}코인` : `+${hearts}하트`}` } };
    }
    case 'DRAW': {
      const pool: CosmeticId[] = ['berry_hat', 'star_hat', 'flower_hat', 'bow_accessory', 'bell_accessory', 'clover_accessory'];
      const unowned = pool.filter(id => !state.owned.includes(id));
      if (!unowned.length) fail('하트 선물을 모두 모았어요!');
      if (state.hearts < 5) fail('하트 5개가 필요해요.');
      const id = unowned[Math.floor(random() * unowned.length) % unowned.length];
      return { state: { ...state, hearts: state.hearts - 5, owned: [...state.owned, id], equipped: { ...state.equipped, [COSMETICS[id].slot]: id } },
        outcome: { kind: 'reward', message: `${COSMETICS[id].name}을(를) 선물 받았어요!` } };
    }
    case 'BUY_COSMETIC': {
      if (!validId(command.id, COSMETIC_IDS)) fail('아이템을 다시 골라 주세요.');
      const item = COSMETICS[command.id];
      if (state.owned.includes(command.id)) fail('이미 가지고 있어요. 장착해 볼까요?');
      if (state.money < item.price) fail('코인이 조금 부족해요. 요리를 더 만들어 볼까요?');
      return { state: { ...state, money: state.money - item.price, owned: [...state.owned, command.id], equipped: { ...state.equipped, [item.slot]: command.id } },
        outcome: { kind: 'reward', message: `${item.name} 구매 완료! 바로 꾸며 봤어요.` } };
    }
    case 'EQUIP': {
      if (!['hat', 'outfit', 'accessory', 'background'].includes(command.slot)) fail('꾸미기 자리를 다시 확인해 주세요.');
      if (command.id !== null && (!validId(command.id, COSMETIC_IDS) || !state.owned.includes(command.id) || COSMETICS[command.id].slot !== command.slot)) fail('가지고 있는 아이템만 장착할 수 있어요.');
      return { state: { ...state, equipped: { ...state.equipped, [command.slot]: command.id ?? undefined } },
        outcome: { kind: 'reward', message: command.id ? `${COSMETICS[command.id].name} 장착!` : '기본 모습으로 돌아왔어요.' } };
    }
    case 'START_MINIGAME': {
      if (state.minigame) fail('이미 재료 받기 놀이를 하고 있어요.');
      if (state.money < 100) fail('참가비 100코인이 필요해요.');
      const run: MinigameRun = { id: crypto.randomUUID(), startedAt: now, seed: Math.floor(random() * 0xffffffff) };
      return { state: { ...state, money: state.money - 100, minigame: run },
        outcome: { kind: 'minigame', message: '100코인을 내고 재료 받기 시작! 바구니를 움직여요.' } };
    }
    case 'FINISH_MINIGAME': {
      if (!state.minigame || command.runId !== state.minigame.id) fail('진행 중인 놀이를 찾지 못했어요.');
      if (!validInt(command.score) || command.score > 12) fail('점수를 다시 확인해 주세요.');
      if (now - state.minigame!.startedAt < 10_000) fail('놀이가 끝날 때까지 재료를 받아 보세요.');
      const reward = minigameReward(command.score);
      const inventory = { ...state.inventory };
      for (const [id, count] of Object.entries(reward) as [IngredientId, number][]) inventory[id] += count;
      return { state: { ...state, inventory, minigame: null }, outcome: { kind: 'minigame', reward: { ingredients: reward },
        message: `${command.score}점! ${rewardValue(reward)}코인어치 재료를 받았어요!` } };
    }
    case 'ABANDON_MINIGAME': return { state: { ...state, minigame: null }, outcome: { kind: 'minigame', message: '다음에 또 놀아요! 참가비는 돌아오지 않아요.' } };
  }
}

export function restoreState(raw: unknown): GameState {
  const base = initialGame();
  if (!raw || typeof raw !== 'object') return base;
  const input = raw as Partial<GameState>;
  if (input.version !== 3 || !validInt(input.xp) || !validInt(input.money) || !validInt(input.hearts) || !input.inventory || !input.order) return base;
  const inventory = { ...base.inventory };
  for (const id of ingredients) if (validInt(input.inventory[id])) inventory[id] = input.inventory[id];
  const order = input.order;
  const recipeId = validId(order.recipeId, RECIPE_IDS) ? order.recipeId : 'fried_egg';
  const customerId = validId(order.customerId, customerIds) ? order.customerId : 'dog';
  const accepted = Array.isArray(order.accepted) ? order.accepted.filter(id => validId(id, RECIPE_IDS)) : [recipeId];
  const owned = Array.isArray(input.owned) ? [...new Set(input.owned.filter(id => validId(id, COSMETIC_IDS)))] : [];
  const equipped: GameState['equipped'] = {};
  for (const slot of ['hat', 'outfit', 'accessory', 'background'] as CosmeticSlot[]) {
    const id = input.equipped?.[slot];
    if (id && owned.includes(id) && COSMETICS[id].slot === slot) equipped[slot] = id;
  }
  const held = input.heldDish;
  const heldDish = held && validId(held.id, RECIPE_IDS) ? { id: held.id,
    topping: validId(held.topping, toppingIds) ? held.topping : 'none' as ToppingId,
    shape: validId(held.shape, shapeIds) ? held.shape : 'heart' as ShapeId } : null;
  const daily = input.daily && typeof input.daily.date === 'string' ? input.daily : base.daily;
  const minigame = input.minigame && typeof input.minigame.id === 'string' && validInt(input.minigame.startedAt) && validInt(input.minigame.seed) ? input.minigame : null;
  return { ...base, xp: input.xp, money: input.money, hearts: input.hearts, inventory,
    order: { kind: order.kind === 'wish' ? 'wish' : 'specific', recipeId, accepted: accepted.length ? accepted : [recipeId], customerId, special: order.special === true, wish: typeof order.wish === 'string' ? order.wish.slice(0, 100) : undefined },
    heldDish, successfulServes: validInt(input.successfulServes) ? input.successfulServes : 0, combo: validInt(input.combo) ? input.combo : 0,
    discovered: Array.isArray(input.discovered) ? input.discovered.filter(id => validId(id, RECIPE_IDS)) : [],
    combinations: Array.isArray(input.combinations) ? input.combinations.filter(x => typeof x === 'string').slice(0, 500) : [],
    stories: Array.isArray(input.stories) ? input.stories.filter(x => validInt(x) && x <= 3) : [], owned, equipped,
    daily: { date: daily.date, cooked: validInt(daily.cooked) ? daily.cooked : 0, served: validInt(daily.served) ? daily.served : 0,
      claimed: Array.isArray(daily.claimed) ? daily.claimed.filter(id => validId(id, questIds)) : [] }, minigame };
}

export function importLegacy(raw: unknown): GameState {
  if (!raw || typeof raw !== 'object') fail('이전 저장 기록을 읽을 수 없어요.');
  const old = raw as Record<string, unknown>;
  if (old.version !== 2 || !validInt(old.xp) || !validInt(old.money) || !validInt(old.hearts)) fail('이전 저장 기록 형식이 맞지 않아요.');
  const base = initialGame();
  const inv = old.inventory && typeof old.inventory === 'object' ? old.inventory as Record<string, unknown> : {};
  for (const id of ['egg', 'bread', 'milk', 'flour', 'butter'] as IngredientId[]) if (validInt(inv[id])) base.inventory[id] = inv[id];
  const map: Record<string, RecipeId> = { fried_egg: 'fried_egg', toast: 'jam_toast', warm_milk: 'cocoa_milk', pancake: 'pancake', butter_toast: 'butter_toast', salted_egg: 'salted_egg' };
  const oldOrder = old.order && typeof old.order === 'object' ? old.order as Record<string, unknown> : {};
  const orderId = typeof oldOrder.recipeId === 'string' ? map[oldOrder.recipeId] : undefined;
  if (orderId) base.order = { kind: 'specific', recipeId: orderId, accepted: [orderId], customerId: validId(oldOrder.customerId, customerIds) ? oldOrder.customerId : 'dog', special: oldOrder.special === true };
  const oldHeld = typeof old.heldDish === 'string' ? map[old.heldDish] : undefined;
  const hatMap: Record<string, CosmeticId> = { berry: 'berry_hat', star: 'star_hat', clover: 'clover_accessory' };
  const owned = Array.isArray(old.ownedHats) ? old.ownedHats.map(id => typeof id === 'string' ? hatMap[id] : undefined).filter((id): id is CosmeticId => Boolean(id)) : [];
  const equipped = typeof old.equippedHat === 'string' ? hatMap[old.equippedHat] : undefined;
  return { ...base, xp: old.xp as number, money: old.money as number, hearts: old.hearts as number,
    heldDish: oldHeld ? { id: oldHeld, topping: 'none', shape: 'heart' } : null,
    successfulServes: validInt(old.successfulServes) ? old.successfulServes : 0,
    combo: validInt(old.combo) ? old.combo : 0,
    discovered: Array.isArray(old.discovered) ? old.discovered.map(id => typeof id === 'string' ? map[id] : undefined).filter((id): id is RecipeId => Boolean(id)) : [],
    owned, equipped: equipped && owned.includes(equipped) ? { [COSMETICS[equipped].slot]: equipped } : {} };
}

export function levelProgress(xp: number): { value: number; needed: number; percent: number } {
  const level = levelFromXp(xp);
  if (level >= 5) return { value: 0, needed: 0, percent: 100 };
  const value = xp - LEVEL_XP[level - 1];
  const needed = LEVEL_XP[level] - LEVEL_XP[level - 1];
  return { value, needed, percent: Math.min(100, Math.round(value / needed * 100)) };
}
