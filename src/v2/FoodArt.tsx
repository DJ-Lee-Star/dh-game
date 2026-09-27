import type { RecipeId } from './content';
import type { HeldDish, ShapeId, ToppingId } from './engine';

function ShapeGarnish({ shape }: { shape: ShapeId }) {
  return <svg className="food-shape" viewBox="0 0 64 64" aria-hidden="true">
    <defs>
      <linearGradient id="garnish-pink" x1="0" y1="0" x2=".7" y2="1"><stop stopColor="#ffb8be"/><stop offset=".55" stopColor="#ed697f"/><stop offset="1" stopColor="#bf405f"/></linearGradient>
      <linearGradient id="garnish-gold" x1="0" y1="0" x2=".7" y2="1"><stop stopColor="#fff1b5"/><stop offset=".65" stopColor="#f4b950"/><stop offset="1" stopColor="#d58e39"/></linearGradient>
    </defs>
    <ellipse cx="33" cy="54" rx="21" ry="6" fill="#73504c" opacity=".22"/>
    {shape === 'heart' && <><path d="M32 51C19 41 8 33 8 22C8 12 18 8 26 13C29 15 31 18 32 19C33 18 35 15 38 13C46 8 56 12 56 22C56 33 45 41 32 51Z" fill="#fff5e8" stroke="#89564c" strokeWidth="3"/><path d="M32 46C21 38 13 31 13 22C13 16 19 13 25 17C29 19 31 23 32 25C33 23 35 19 39 17C45 13 51 16 51 22C51 31 43 38 32 46Z" fill="url(#garnish-pink)"/><path d="M18 22C19 18 23 17 27 20" fill="none" stroke="#ffe6e5" strokeWidth="3" strokeLinecap="round"/><circle cx="44" cy="27" r="2" fill="#ffd6d9"/></>}
    {shape === 'star' && <><path d="M32 7L39 21L55 23L43 35L46 52L32 44L18 52L21 35L9 23L25 21Z" fill="#fff5e8" stroke="#89564c" strokeWidth="3" strokeLinejoin="round"/><path d="M32 13L37 25L49 26L40 35L42 46L32 40L22 46L24 35L15 26L27 25Z" fill="url(#garnish-gold)"/><path d="M28 23L32 16" stroke="#fff9d9" strokeWidth="3" strokeLinecap="round"/></>}
    {shape === 'smile' && <><circle cx="32" cy="30" r="23" fill="#fff5e8" stroke="#89564c" strokeWidth="3"/><circle cx="32" cy="30" r="18" fill="url(#garnish-gold)"/><circle cx="25" cy="26" r="2.5" fill="#6d433e"/><circle cx="39" cy="26" r="2.5" fill="#6d433e"/><path d="M24 33Q32 43 40 33" fill="none" stroke="#6d433e" strokeWidth="3" strokeLinecap="round"/><ellipse cx="19" cy="33" rx="3" ry="2" fill="#ed8d85"/><ellipse cx="45" cy="33" rx="3" ry="2" fill="#ed8d85"/></>}
  </svg>;
}

function ToppingGarnish({ topping }: { topping: ToppingId }) {
  return <svg className="food-topping" viewBox="0 0 64 64" aria-hidden="true">
    {topping === 'none' && <><path d="M32 5L37 25L57 32L37 37L32 57L26 37L7 32L26 25Z" fill="#fff1b4" stroke="#b8844e" strokeWidth="2"/><circle cx="48" cy="12" r="4" fill="#fff9d9"/><circle cx="11" cy="49" r="3" fill="#fff9d9"/></>}
    {topping === 'jam' && <><path d="M13 37C12 21 24 11 38 13C50 15 56 26 50 39C44 51 23 54 16 45Z" fill="#ad3656" stroke="#783d45" strokeWidth="3"/><path d="M17 32C20 19 30 16 39 18" fill="none" stroke="#f899ab" strokeWidth="5" strokeLinecap="round"/><circle cx="43" cy="38" r="4" fill="#e96d85"/></>}
    {topping === 'banana' && <><ellipse cx="29" cy="33" rx="20" ry="14" transform="rotate(-24 29 33)" fill="#f6df93" stroke="#9f743e" strokeWidth="3"/><ellipse cx="29" cy="33" rx="14" ry="9" transform="rotate(-24 29 33)" fill="#fff3bd"/><circle cx="28" cy="32" r="2" fill="#ba8b49"/><circle cx="37" cy="27" r="2" fill="#ba8b49"/><circle cx="23" cy="38" r="2" fill="#ba8b49"/></>}
    {topping === 'strawberry' && <><path d="M17 24C19 15 29 13 34 18C41 13 50 18 49 27C48 41 35 53 32 54C28 53 16 40 17 24Z" fill="#e75962" stroke="#8f4644" strokeWidth="3"/><path d="M21 17L30 21L34 11L39 21L48 17L40 27L31 24L23 27Z" fill="#6da96e" stroke="#456d4d" strokeWidth="2"/>{[[26,31],[38,32],[31,42],[43,39]].map(([x,y]) => <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="1.5" ry="2.5" fill="#ffe8ad"/>)}</>}
  </svg>;
}

export function FoodArt({ id, size = 96, dish }: { id: RecipeId; size?: number; dish?: HeldDish | null }) {
  return <span className="food-art" style={{ width: size, height: size }} role="img" aria-label={id.replaceAll('_', ' ')}>
    <img src={`/game/food-${id.replaceAll('_', '-')}-v3.webp`} alt="" draggable={false} loading="lazy" decoding="async"/>
    {dish && <><ShapeGarnish shape={dish.shape}/><ToppingGarnish topping={dish.topping}/></>}
  </span>;
}
