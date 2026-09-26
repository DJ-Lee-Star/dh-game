import type { RecipeId } from './content';
import type { HeldDish } from './engine';

export function FoodArt({ id, size = 96, dish }: { id: RecipeId; size?: number; dish?: HeldDish | null }) {
  const toast = ['jam_toast', 'banana_toast', 'cheese_toast', 'flower_sandwich', 'butter_toast'].includes(id);
  const egg = ['fried_egg', 'salted_egg', 'tomato_egg'].includes(id);
  const drink = ['cocoa_milk', 'strawberry_smoothie'].includes(id);
  const pancake = ['pancake', 'berry_pancake'].includes(id);
  const yogurt = id === 'fruit_yogurt';
  const noodle = id === 'cozy_noodle';
  return <svg width={size} height={size} viewBox="0 0 140 140" role="img" aria-label={id} className="food-art">
    <ellipse cx="70" cy="117" rx="58" ry="14" fill="#b58a6e" opacity=".22"/>
    <ellipse cx="70" cy="103" rx="59" ry="28" fill="#fffdf7" stroke="#855d4b" strokeWidth="4"/>
    <ellipse cx="70" cy="102" rx="48" ry="19" fill="#f6e6cb"/>
    {toast && <><path d="M30 91Q25 63 46 62Q69 52 94 62Q114 66 109 92L100 110H40Z" fill="#b77042" stroke="#754b35" strokeWidth="4"/><path d="M41 89Q38 71 53 71Q70 64 87 71Q102 70 99 91L94 101H47Z" fill="#f4c87c"/>
      {(id === 'jam_toast' || id === 'banana_toast') && <path d="M46 83Q69 73 94 83L90 94Q69 88 48 94Z" fill="#d65d72"/>}
      {id === 'banana_toast' && <><circle cx="55" cy="84" r="8" fill="#fff0b6" stroke="#d6b16c" strokeWidth="2"/><circle cx="77" cy="88" r="8" fill="#fff0b6" stroke="#d6b16c" strokeWidth="2"/></>}
      {(id === 'cheese_toast' || id === 'flower_sandwich') && <path d="M45 77L94 76L87 97L74 91L61 101L50 91Z" fill="#f9d45a" stroke="#d8993e" strokeWidth="2"/>}
      {id === 'butter_toast' && <><path d="M43 82Q70 74 95 83" fill="none" stroke="#f2d779" strokeWidth="6" strokeLinecap="round"/><rect x="62" y="73" width="25" height="15" rx="4" fill="#fff0aa" stroke="#e7bf5e" strokeWidth="2"/><circle cx="51" cy="94" r="2" fill="#fff4cb"/><circle cx="93" cy="91" r="2" fill="#fff4cb"/></>}
      {id === 'flower_sandwich' && <><path d="M43 90Q67 70 98 91" fill="none" stroke="#6ea471" strokeWidth="8"/><circle cx="72" cy="81" r="6" fill="#e76e5f"/></>}
    </>}
    {egg && <><path d="M27 87Q31 68 50 69Q61 56 78 67Q104 59 111 83Q117 102 93 110Q65 118 51 106Q31 109 27 87Z" fill="#fffdf3" stroke="#aa805f" strokeWidth="3"/><circle cx="70" cy="87" r="18" fill="#f7bd50" stroke="#e69b38" strokeWidth="3"/><ellipse cx="64" cy="81" rx="6" ry="3" fill="#ffdf83"/>
      {id === 'tomato_egg' && <><circle cx="42" cy="88" r="7" fill="#dc6458"/><circle cx="97" cy="92" r="7" fill="#dc6458"/></>}{id === 'salted_egg' && <><circle cx="44" cy="81" r="2" fill="#9fb485"/><circle cx="98" cy="94" r="2" fill="#9fb485"/></>}
    </>}
    {pancake && <><ellipse cx="70" cy="101" rx="39" ry="10" fill="#d38b4c" stroke="#8e5d38" strokeWidth="3"/><ellipse cx="70" cy="91" rx="39" ry="10" fill="#f1bb6e" stroke="#8e5d38" strokeWidth="3"/><ellipse cx="70" cy="81" rx="38" ry="10" fill="#d99252" stroke="#8e5d38" strokeWidth="3"/><ellipse cx="70" cy="72" rx="38" ry="11" fill="#f3c77b" stroke="#8e5d38" strokeWidth="3"/><path d="M58 70L73 66L84 74L69 79Z" fill="#ffe68e"/>{id === 'berry_pancake' && <><circle cx="53" cy="67" r="7" fill="#da5870"/><circle cx="82" cy="63" r="7" fill="#da5870"/></>}</>}
    {(drink || yogurt) && <><path d="M45 52H95L90 108Q70 117 50 108Z" fill={id === 'cocoa_milk' ? '#a67052' : id === 'strawberry_smoothie' ? '#ee9caf' : '#fff7e8'} stroke="#855d4b" strokeWidth="4"/><ellipse cx="70" cy="52" rx="25" ry="8" fill={id === 'cocoa_milk' ? '#c08a68' : id === 'strawberry_smoothie' ? '#f3b7c2' : '#fffef7'} stroke="#855d4b" strokeWidth="3"/>{id === 'fruit_yogurt' && <><circle cx="56" cy="58" r="6" fill="#f4dc8c"/><circle cx="79" cy="61" r="6" fill="#f4dc8c"/></>}{id === 'strawberry_smoothie' && <path d="M78 52L89 30" stroke="#e6c08d" strokeWidth="5"/>}</>}
    {noodle && <><path d="M31 78H109L99 108Q70 119 41 108Z" fill="#e65f55" stroke="#855d4b" strokeWidth="4"/><ellipse cx="70" cy="78" rx="39" ry="13" fill="#f6c977" stroke="#855d4b" strokeWidth="3"/><path d="M43 76Q49 66 57 76T72 76T87 76T99 77" fill="none" stroke="#e9a648" strokeWidth="5"/><path d="M48 59Q42 50 51 41M69 56Q61 46 70 36M89 58Q82 48 90 39" fill="none" stroke="#d4ba9f" strokeWidth="3" strokeLinecap="round"/></>}
    {dish?.topping === 'strawberry' && <circle cx="91" cy="69" r="9" fill="#d9576b" stroke="#fff0db" strokeWidth="2"/>}
    {dish?.topping === 'banana' && <circle cx="91" cy="69" r="9" fill="#f4de8d" stroke="#fff0db" strokeWidth="2"/>}
    {dish?.topping === 'jam' && <path d="M76 69Q91 57 100 72Q86 74 77 82Z" fill="#c75468"/>}
    {dish && <text x="39" y="64" fontSize="17" fill="#ed7c8b">{dish.shape === 'heart' ? '♥' : dish.shape === 'star' ? '★' : '☺'}</text>}
  </svg>;
}
