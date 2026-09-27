import type { CookAction, IngredientId, RecipeId } from './content';
import { IngredientVisual } from './IngredientVisual';

const STATION: Record<CookAction, string> = {
  crack: 'pan', heat: 'pan', flip: 'pan', sprinkle: 'pan',
  wash: 'sink', slice: 'board', spread: 'board',
  stir: 'bowl', pour: 'bowl', stack: 'plate',
};

function cookingFood(recipeId: RecipeId) {
  if (recipeId.includes('egg')) return 'egg';
  if (recipeId.includes('pancake')) return 'pancake';
  if (recipeId.includes('noodle')) return 'noodle';
  return 'toast';
}

export function CookScene({ action, progress, ingredient, recipeId }: { action: CookAction; progress: number; ingredient?: IngredientId; recipeId: RecipeId }) {
  const selected: IngredientId = ingredient && !['oil', 'salt', 'sugar', 'flour'].includes(ingredient) ? ingredient : recipeId.includes('egg') ? 'egg' : 'bread';
  const paintedIngredient = ['banana', 'tomato', 'strawberry', 'lettuce'].includes(selected);
  const sprite = cookingFood(recipeId);
  const cocoaMix = action === 'stir' ? progress / 100 : 0;
  const cocoaColor = `rgb(${Math.round(249 - 97 * cocoaMix)},${Math.round(238 - 142 * cocoaMix)},${Math.round(224 - 156 * cocoaMix)})`;
  const showFood = recipeId !== 'cocoa_milk' && (['heat', 'flip', 'sprinkle', 'spread', 'stack'].includes(action) || (action === 'crack' && progress > 0));
  return <div className={`cook-scene-art scene-${action} recipe-${recipeId}`} aria-hidden="true">
    <img className="cook-station" src={`/game/station-${STATION[action]}-v3.webp`} alt="" draggable={false}/>
    {showFood && <img className="cook-scene-food" src={`/game/cook-${sprite}-v3.webp`} alt="" draggable={false} style={{ rotate: action === 'flip' ? `${progress * 1.2}deg` : undefined, marginTop: action === 'flip' ? `${-progress / 5}px` : undefined }}/>}
    {recipeId === 'fried_egg' && action === 'crack' && <div className="egg-white-change" style={{ opacity: progress / 100, scale: `${0.55 + progress / 220}` }}><i/></div>}
    {recipeId === 'fried_egg' && action === 'heat' && <div className="egg-cooked-edge" style={{ opacity: progress / 100 }}/>}
    {recipeId === 'jam_toast' && action === 'spread' && <div className="toast-jam-change" style={{ width: `${progress * .72}%`, opacity: progress ? 1 : 0 }}/>}
    {recipeId === 'cocoa_milk' && <div className="cocoa-liquid" style={{ background: `radial-gradient(circle at 35% 22%,#fff9ee,${cocoaColor} 75%)` }}><i style={{ opacity: action === 'stir' ? Math.max(.15, 1 - progress / 100) : 0 }}/></div>}
    {recipeId === 'banana_toast' && action === 'slice' && <div className="banana-slices">{Array.from({ length: Math.ceil(progress / 20) }, (_, index) => <i key={index}/>)}</div>}
    {recipeId === 'cheese_toast' && action === 'heat' && <div className="cheese-stretch" style={{ height: `${progress * .65}px`, opacity: progress / 100 }}/>}
    {recipeId === 'cozy_noodle' && action === 'heat' && <div className="noodle-steam" style={{ opacity: progress / 100 }}>♨ ♨ ♨</div>}
    {['wash', 'slice'].includes(action) && <div className="cook-scene-ingredient">{paintedIngredient ? <img src={`/game/ingredient-${selected}-v3.webp`} alt="" draggable={false}/> : <IngredientVisual id={selected} size={76}/>}</div>}
    {action === 'wash' && <div className="cook-water" style={{ opacity: progress > 0 ? 1 : .45 }}><i/><i/><i/><i/></div>}
    {action === 'stir' && <div className="cook-mix" style={{ transform: `rotate(${progress * 3.6}deg)` }}><span/></div>}
    {action === 'pour' && <div className="cook-pour" style={{ opacity: progress / 100 }}/>}
    {action === 'heat' && <div className="cook-heat-glow" style={{ opacity: progress / 100 }}/>}
    {action === 'sprinkle' && <div className="cook-sprinkles" style={{ opacity: progress / 100 }}>✦ · ✧ · ✦</div>}
  </div>;
}
