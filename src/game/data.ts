export type IngredientId = 'egg' | 'bread' | 'milk' | 'flour' | 'butter' | 'oil' | 'salt' | 'sugar';
export type ToolId = 'pan' | 'pot' | 'bowl';
export type ActionId = 'heat' | 'mix' | 'flip';
export type RecipeId = 'fried_egg' | 'toast' | 'warm_milk' | 'pancake' | 'butter_toast' | 'salted_egg';
export type CustomerId = 'dog' | 'rabbit' | 'fox' | 'bear' | 'panda';

export interface RecipeStage {
  tool: ToolId;
  ingredients: IngredientId[];
  action: ActionId;
  instruction: string;
}

export interface Recipe {
  id: RecipeId;
  name: string;
  description: string;
  level: number;
  reward: number;
  xp: number;
  stages: RecipeStage[];
  secret?: boolean;
}

export const LEVEL_XP = [0, 300, 750, 1350, 2100] as const;
export const MAX_LEVEL = LEVEL_XP.length;

export const INGREDIENTS: Record<IngredientId, { name: string; price: number; level: number }> = {
  egg: { name: '달걀', price: 40, level: 1 },
  bread: { name: '식빵', price: 55, level: 2 },
  milk: { name: '우유', price: 65, level: 3 },
  flour: { name: '밀가루', price: 50, level: 4 },
  butter: { name: '버터', price: 45, level: 5 },
  oil: { name: '식용유', price: 0, level: 1 },
  salt: { name: '소금', price: 0, level: 1 },
  sugar: { name: '설탕', price: 0, level: 1 },
};

export const MART_ITEMS: IngredientId[] = ['egg', 'bread', 'milk', 'flour', 'butter'];
export const SEASONINGS: IngredientId[] = ['oil', 'salt', 'sugar'];
export const CUSTOMERS: CustomerId[] = ['dog', 'rabbit', 'fox', 'bear'];
export const SPECIAL_CUSTOMER_ID: CustomerId = 'panda';
export const CUSTOMER_NAMES: Record<CustomerId, string> = {
  dog: '몽실이', rabbit: '보송이', fox: '루루', bear: '곰 아저씨', panda: '별님',
};

export const RECIPES: Record<RecipeId, Recipe> = {
  fried_egg: {
    id: 'fried_egg', name: '달걀 프라이', description: '노릇노릇한 첫 번째 요리', level: 1, reward: 180, xp: 120,
    stages: [{ tool: 'pan', ingredients: ['oil', 'egg'], action: 'heat', instruction: '팬에 기름과 달걀을 넣고 불을 조절해요.' }],
  },
  toast: {
    id: 'toast', name: '바삭 토스트', description: '뒤집는 순간이 즐거운 간식', level: 2, reward: 240, xp: 150,
    stages: [{ tool: 'pan', ingredients: ['bread'], action: 'flip', instruction: '식빵을 팬에 올리고 바삭하게 뒤집어요.' }],
  },
  warm_milk: {
    id: 'warm_milk', name: '따뜻한 우유', description: '포근한 한 잔', level: 3, reward: 240, xp: 160,
    stages: [{ tool: 'pot', ingredients: ['milk'], action: 'heat', instruction: '냄비에 우유를 붓고 천천히 데워요.' }],
  },
  pancake: {
    id: 'pancake', name: '폭신 팬케이크', description: '반죽하고 굽는 두 단계 요리', level: 4, reward: 460, xp: 230,
    stages: [
      { tool: 'bowl', ingredients: ['flour', 'milk', 'egg'], action: 'mix', instruction: '보울에 재료를 넣고 골고루 섞어요.' },
      { tool: 'pan', ingredients: ['oil'], action: 'heat', instruction: '반죽을 팬으로 옮겨 노릇하게 구워요.' },
    ],
  },
  butter_toast: {
    id: 'butter_toast', name: '버터 토스트', description: '달콤하고 고소한 특별 간식', level: 5, reward: 330, xp: 200,
    stages: [{ tool: 'pan', ingredients: ['butter', 'bread', 'sugar'], action: 'flip', instruction: '버터와 식빵을 굽고 설탕을 뿌려요.' }],
  },
  salted_egg: {
    id: 'salted_egg', name: '짭짤 프라이', description: '숨겨진 한 꼬집의 비밀', level: 1, reward: 230, xp: 150, secret: true,
    stages: [{ tool: 'pan', ingredients: ['oil', 'egg', 'salt'], action: 'heat', instruction: '달걀에 소금을 한 꼬집 더해요.' }],
  },
};

export const BASE_RECIPES: RecipeId[] = ['fried_egg', 'toast', 'warm_milk', 'pancake', 'butter_toast'];
export const TOOL_NAMES: Record<ToolId, string> = { pan: '프라이팬', pot: '냄비', bowl: '보울' };
export const ACTION_NAMES: Record<ActionId, string> = { heat: '불 조절', mix: '반죽 섞기', flip: '토스트 뒤집기' };

export function levelFromXp(xp: number): number {
  for (let i = LEVEL_XP.length - 1; i >= 0; i -= 1) if (xp >= LEVEL_XP[i]) return i + 1;
  return 1;
}

export function levelProgress(xp: number): { current: number; needed: number; percent: number } {
  const level = levelFromXp(xp);
  if (level === MAX_LEVEL) return { current: 0, needed: 0, percent: 100 };
  const base = LEVEL_XP[level - 1];
  const needed = LEVEL_XP[level] - base;
  const current = Math.max(0, xp - base);
  return { current, needed, percent: Math.min(100, Math.round(current / needed * 100)) };
}

export function recipeIngredients(id: RecipeId): IngredientId[] {
  return RECIPES[id].stages.flatMap(stage => stage.ingredients).filter(ingredient => INGREDIENTS[ingredient].price > 0);
}

export function recipeCost(id: RecipeId): number {
  return recipeIngredients(id).reduce((sum, ingredient) => sum + INGREDIENTS[ingredient].price, 0);
}
