// Read-only evidence probe. From the repository root:
// node --import tsx docs/qa-play-review-20260927/engine-probe.mjs
// Calls pure engine functions in memory; does not access the server or player DB.
import { initialGame, applyCommand } from '../../src/v2/engine.ts';
import { RECIPES, RECIPE_IDS, recipeIngredients, levelFromXp } from '../../src/v2/content.ts';

let state = initialGame();
const command = input => { state = applyCommand(state, input).state; };
const cook = recipeId => command({ type: 'COOK', recipeId, topping: 'none', shape: 'heart' });

for (let i = 0; i < 3; i++) {
  cook('fried_egg');
  command({ type: 'SERVE', target: 'father' });
}
command({ type: 'CLAIM', questId: 'cook_2' });
for (const id of ['garden_background', 'evening_background', 'mint_outfit']) {
  command({ type: 'BUY_COSMETIC', id });
}
const cookable = RECIPE_IDS
  .filter(id => RECIPES[id].level <= levelFromXp(state.xp))
  .filter(id => recipeIngredients(id).every(ingredient => state.inventory[ingredient]
    >= recipeIngredients(id).filter(value => value === ingredient).length));
const economyLock = {
  money: state.money, xp: state.xp, hearts: state.hearts,
  inventoryTotal: Object.values(state.inventory).reduce((a, b) => a + b, 0),
  heldDish: state.heldDish, cookable, claimed: state.daily.claimed, served: state.daily.served,
};

state = initialGame();
const route = ['fried_egg', 'banana_toast', 'banana_toast', 'cheese_toast', 'cheese_toast', 'pancake', 'pancake', 'pancake'];
const steps = [];
for (const recipeId of route) {
  const counts = {};
  for (const id of recipeIngredients(recipeId)) counts[id] = (counts[id] ?? 0) + 1;
  const items = Object.fromEntries(Object.entries(counts)
    .map(([id, count]) => [id, Math.max(0, count - state.inventory[id])])
    .filter(([, count]) => count > 0));
  if (Object.keys(items).length) command({ type: 'BUY_CART', items });
  cook(recipeId);
  command({ type: 'SERVE', target: 'father' });
  steps.push({ recipeId, xp: state.xp, level: levelFromXp(state.xp) });
}
console.log(JSON.stringify({ economyLock, eightCooks: { steps, money: state.money } }, null, 2));
