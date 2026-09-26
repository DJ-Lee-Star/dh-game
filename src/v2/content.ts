export const INGREDIENTS = {
  egg: { name: '달걀', price: 40, level: 1, home: 'fridge', icon: '🥚' },
  bread: { name: '식빵', price: 55, level: 1, home: 'shelf', icon: '🍞' },
  milk: { name: '우유', price: 65, level: 1, home: 'fridge', icon: '🥛' },
  jam: { name: '딸기잼', price: 45, level: 1, home: 'shelf', icon: '🍓' },
  cocoa: { name: '코코아 가루', price: 35, level: 1, home: 'pantry', icon: '🍫' },
  banana: { name: '바나나', price: 50, level: 2, home: 'shelf', icon: '🍌' },
  tomato: { name: '토마토', price: 45, level: 2, home: 'fridge', icon: '🍅' },
  cheese: { name: '치즈', price: 55, level: 3, home: 'fridge', icon: '🧀' },
  yogurt: { name: '요거트', price: 60, level: 3, home: 'fridge', icon: '🥣' },
  butter: { name: '버터', price: 45, level: 3, home: 'fridge', icon: '🧈' },
  flour: { name: '밀가루', price: 50, level: 4, home: 'pantry', icon: '🌾' },
  strawberry: { name: '딸기', price: 65, level: 4, home: 'fridge', icon: '🍓' },
  noodle: { name: '라면', price: 70, level: 5, home: 'pantry', icon: '🍜' },
  broth: { name: '라면 스프', price: 20, level: 5, home: 'pantry', icon: '🧂' },
  lettuce: { name: '상추', price: 45, level: 5, home: 'fridge', icon: '🥬' },
  oil: { name: '식용유', price: 0, level: 1, home: 'pantry', icon: '🫙' },
  salt: { name: '소금', price: 0, level: 1, home: 'pantry', icon: '🧂' },
  sugar: { name: '설탕', price: 0, level: 1, home: 'pantry', icon: '🍬' },
} as const;

export type IngredientId = keyof typeof INGREDIENTS;
export type HomeId = 'fridge' | 'shelf' | 'pantry';
export const HOMES: Record<HomeId, { name: string; hint: string; icon: string }> = {
  fridge: { name: '냉장고', hint: '차갑고 신선한 재료', icon: '🧊' },
  shelf: { name: '간식 선반', hint: '빵과 과일이 놓인 곳', icon: '🧺' },
  pantry: { name: '상온 보관장', hint: '밀가루와 라면이 있는 곳', icon: '🏠' },
};
export const MART_ITEMS = (Object.keys(INGREDIENTS) as IngredientId[]).filter(id => INGREDIENTS[id].price > 0);

export type CookAction = 'crack' | 'heat' | 'spread' | 'pour' | 'wash' | 'slice' | 'stir' | 'flip' | 'sprinkle' | 'stack';
export interface Stage { action: CookAction; ingredients: IngredientId[]; instruction: string; visual: string }
export interface Recipe { name: string; level: number; xp: number; reward: number; sweet: boolean; secret?: boolean; hint?: string; stages: Stage[] }

export const RECIPES = {
  fried_egg: { name: '노릇 달걀 프라이', level: 1, xp: 120, reward: 155, sweet: false, stages: [
    { action: 'crack', ingredients: ['egg'], instruction: '달걀을 톡 깨서 팬에 넣어요', visual: '달걀 껍데기가 갈라져요' },
    { action: 'heat', ingredients: ['oil'], instruction: '불을 알맞게 조절해 익혀요', visual: '흰자가 노릇하게 익어요' },
  ] },
  jam_toast: { name: '딸기잼 토스트', level: 1, xp: 120, reward: 190, sweet: true, stages: [
    { action: 'flip', ingredients: ['bread'], instruction: '빵을 뒤집어 바삭하게 구워요', visual: '빵에 갈색 구움 자국이 생겨요' },
    { action: 'spread', ingredients: ['jam'], instruction: '주걱으로 잼을 골고루 발라요', visual: '분홍 잼이 빵에 퍼져요' },
  ] },
  cocoa_milk: { name: '포근 코코아 우유', level: 1, xp: 120, reward: 180, sweet: true, stages: [
    { action: 'pour', ingredients: ['milk'], instruction: '잔에 우유를 천천히 부어요', visual: '잔이 우유로 채워져요' },
    { action: 'stir', ingredients: ['cocoa'], instruction: '코코아를 넣고 빙글빙글 저어요', visual: '우유가 초코색으로 바뀌어요' },
  ] },
  banana_toast: { name: '바나나 토스트', level: 2, xp: 150, reward: 245, sweet: true, stages: [
    { action: 'slice', ingredients: ['banana'], instruction: '바나나를 조심조심 썰어요', visual: '동글동글 바나나 조각이 생겨요' },
    { action: 'spread', ingredients: ['bread', 'jam'], instruction: '구운 빵에 잼을 펴 발라요', visual: '잼 위로 바나나가 올라가요' },
  ] },
  tomato_egg: { name: '토마토 달걀 컵', level: 2, xp: 150, reward: 240, sweet: false, stages: [
    { action: 'wash', ingredients: ['tomato'], instruction: '토마토를 물에 씻어요', visual: '반짝반짝 깨끗해져요' },
    { action: 'slice', ingredients: ['tomato'], instruction: '토마토를 작게 썰어요', visual: '빨간 토마토 조각이 쏙쏙' },
    { action: 'crack', ingredients: ['egg'], instruction: '달걀을 톡 넣어 익혀요', visual: '달걀과 토마토가 어울려요' },
  ] },
  salted_egg: { name: '비밀 소금꽃 프라이', level: 2, xp: 160, reward: 230, sweet: false, secret: true, hint: '달걀에 소금 한 꼬집을 더하면?', stages: [
    { action: 'crack', ingredients: ['egg'], instruction: '달걀을 톡 깨요', visual: '달걀이 팬에 들어가요' },
    { action: 'heat', ingredients: ['oil'], instruction: '노릇하게 익혀요', visual: '노릇노릇 익어요' },
    { action: 'sprinkle', ingredients: ['salt'], instruction: '소금을 꽃처럼 뿌려요', visual: '소금꽃이 반짝여요' },
  ] },
  cheese_toast: { name: '쭉쭉 치즈 토스트', level: 3, xp: 180, reward: 250, sweet: false, stages: [
    { action: 'stack', ingredients: ['bread', 'cheese'], instruction: '빵 위에 치즈를 올려요', visual: '치즈가 빵에 포개져요' },
    { action: 'heat', ingredients: ['butter'], instruction: '버터를 두르고 치즈가 녹도록 구워요', visual: '치즈가 쭉 늘어나요' },
  ] },
  fruit_yogurt: { name: '과일 요거트 컵', level: 3, xp: 180, reward: 265, sweet: true, stages: [
    { action: 'slice', ingredients: ['banana'], instruction: '바나나를 얇게 썰어요', visual: '바나나 조각이 생겨요' },
    { action: 'pour', ingredients: ['yogurt'], instruction: '요거트를 컵에 부어요', visual: '하얀 요거트가 차올라요' },
    { action: 'stack', ingredients: [], instruction: '과일 조각을 위에 올려요', visual: '과일이 예쁘게 놓여요' },
  ] },
  pancake: { name: '구름 팬케이크', level: 4, xp: 220, reward: 355, sweet: true, stages: [
    { action: 'stir', ingredients: ['flour', 'milk', 'egg'], instruction: '거품기로 반죽을 둥글게 저어요', visual: '가루가 폭신한 반죽이 돼요' },
    { action: 'flip', ingredients: ['oil'], instruction: '팬케이크를 들어 뒤집어요', visual: '양면이 황금빛으로 구워져요' },
  ] },
  strawberry_smoothie: { name: '딸기 스무디', level: 4, xp: 220, reward: 270, sweet: true, stages: [
    { action: 'wash', ingredients: ['strawberry'], instruction: '딸기를 깨끗이 씻어요', visual: '딸기가 반짝여요' },
    { action: 'slice', ingredients: ['strawberry'], instruction: '딸기를 반으로 잘라요', visual: '빨간 딸기 단면이 보여요' },
    { action: 'stir', ingredients: ['milk'], instruction: '우유와 함께 섞어요', visual: '분홍 스무디가 완성돼요' },
  ] },
  berry_pancake: { name: '비밀 별딸기 팬케이크', level: 4, xp: 240, reward: 420, sweet: true, secret: true, hint: '팬케이크에 딸기를 올리면?', stages: [
    { action: 'stir', ingredients: ['flour', 'milk', 'egg'], instruction: '반죽을 동그랗게 저어요', visual: '폭신한 반죽이 생겨요' },
    { action: 'flip', ingredients: ['oil'], instruction: '팬케이크를 뒤집어요', visual: '양면이 노릇해져요' },
    { action: 'slice', ingredients: ['strawberry'], instruction: '딸기를 썰어 별처럼 올려요', visual: '빨간 별딸기가 반짝여요' },
  ] },
  cozy_noodle: { name: '따끈 라면', level: 5, xp: 250, reward: 310, sweet: false, stages: [
    { action: 'pour', ingredients: ['noodle', 'broth'], instruction: '냄비에 면과 스프를 넣어요', visual: '면이 국물에 퐁당' },
    { action: 'stir', ingredients: [], instruction: '젓가락으로 면을 풀어요', visual: '꼬불꼬불 면이 풀려요' },
    { action: 'heat', ingredients: [], instruction: '보글보글 끓여요', visual: '따끈한 김이 올라와요' },
  ] },
  flower_sandwich: { name: '꽃밭 샌드위치', level: 5, xp: 250, reward: 340, sweet: false, stages: [
    { action: 'wash', ingredients: ['lettuce'], instruction: '상추를 씻어요', visual: '상추가 싱싱해져요' },
    { action: 'slice', ingredients: ['tomato'], instruction: '토마토를 얇게 썰어요', visual: '빨간 조각이 생겨요' },
    { action: 'stack', ingredients: ['bread', 'cheese'], instruction: '빵과 채소와 치즈를 쌓아요', visual: '층층 샌드위치가 돼요' },
  ] },
  butter_toast: { name: '버터 토스트', level: 5, xp: 250, reward: 270, sweet: true, stages: [
    { action: 'spread', ingredients: ['bread', 'butter'], instruction: '빵에 버터를 골고루 발라요', visual: '버터가 부드럽게 퍼져요' },
    { action: 'flip', ingredients: ['sugar'], instruction: '노릇하게 뒤집고 설탕을 뿌려요', visual: '달콤한 토스트가 완성돼요' },
  ] },
} satisfies Record<string, Recipe>;

export type RecipeId = keyof typeof RECIPES;
export const RECIPE_IDS = Object.keys(RECIPES) as RecipeId[];
export const LEVEL_XP = [0, 120, 420, 780, 1300] as const;
export const MAX_LEVEL = 5;
export const levelFromXp = (xp: number) => {
  for (let i = LEVEL_XP.length - 1; i >= 0; i--) if (xp >= LEVEL_XP[i]) return i + 1;
  return 1;
};
export const recipeIngredients = (id: RecipeId) => RECIPES[id].stages.flatMap(stage => stage.ingredients).filter(item => INGREDIENTS[item].price > 0);
export const recipeCost = (id: RecipeId) => recipeIngredients(id).reduce((sum, item) => sum + INGREDIENTS[item].price, 0);

export const CUSTOMERS = { dog: '몽실이', rabbit: '보송이', fox: '루루', bear: '곰 아저씨', panda: '별님' } as const;
export type CustomerId = keyof typeof CUSTOMERS;
export const FAMILY = { mother: '엄마', father: '아빠', sibling: '동생' } as const;
export type FamilyId = keyof typeof FAMILY;
export const FAMILY_FAVORITES: Record<FamilyId, RecipeId[]> = {
  mother: ['fruit_yogurt', 'flower_sandwich', 'strawberry_smoothie', 'jam_toast'],
  father: ['fried_egg', 'tomato_egg', 'cozy_noodle', 'cheese_toast'],
  sibling: ['cocoa_milk', 'banana_toast', 'pancake', 'berry_pancake'],
};

export const STORIES = [
  { title: '비 오는 날의 따뜻한 간식', intro: '몽실이와 친구들이 비를 피해 식당에 왔어요. 따뜻한 음식으로 마음을 녹여 주세요.', ending: '창밖의 비가 그치고 친구들이 환하게 웃어요!', sticker: '☂️ 무지개 우산' },
  { title: '보송이의 생일 파티', intro: '오늘은 보송이의 생일이에요! 친구들에게 맛있는 간식을 대접하며 파티를 준비해요.', ending: '모두 함께 생일 노래를 부르고 축하했어요!', sticker: '🎈 생일 풍선' },
  { title: '별님의 밤 축제', intro: '별님이 밤 축제에 어울리는 요리를 찾고 있어요. 반짝이는 한 접시를 만들어 볼까요?', ending: '별님이 음식 위의 작은 별을 보고 깜짝 놀랐어요!', sticker: '⭐ 별빛' },
] as const;

export const COSMETICS = {
  berry_hat: { name: '딸기 베레모', slot: 'hat', price: 180, icon: '🍓' },
  star_hat: { name: '별빛 모자', slot: 'hat', price: 260, icon: '⭐' },
  flower_hat: { name: '꽃 모자', slot: 'hat', price: 220, icon: '🌼' },
  mint_outfit: { name: '민트 앞치마', slot: 'outfit', price: 200, icon: '🩵' },
  berry_outfit: { name: '딸기 앞치마', slot: 'outfit', price: 280, icon: '❤️' },
  sky_outfit: { name: '하늘 앞치마', slot: 'outfit', price: 320, icon: '💙' },
  bow_accessory: { name: '리본 목걸이', slot: 'accessory', price: 160, icon: '🎀' },
  bell_accessory: { name: '방울 목걸이', slot: 'accessory', price: 230, icon: '🔔' },
  clover_accessory: { name: '클로버 배지', slot: 'accessory', price: 250, icon: '🍀' },
  evening_background: { name: '노을 식당', slot: 'background', price: 350, icon: '🌇' },
  garden_background: { name: '꽃밭 식당', slot: 'background', price: 400, icon: '🌷' },
} as const;
export type CosmeticId = keyof typeof COSMETICS;
export type CosmeticSlot = typeof COSMETICS[CosmeticId]['slot'];
export const COSMETIC_IDS = Object.keys(COSMETICS) as CosmeticId[];
