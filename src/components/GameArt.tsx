import type { ActionId, IngredientId, RecipeId, ToolId } from '../game/data';
import type { HatId } from '../game/engine';

interface ArtProps { size?: number; className?: string }

const stroke = { stroke: '#6e4b3d', strokeWidth: 3.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

export function HatArt({ id, size = 38 }: { id: HatId; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 56 56" role="img" aria-label={id}>
    {id === 'berry' && <><path d="M28 27C15 10 3 16 6 33C11 42 21 37 28 29C35 37 45 42 50 33C53 16 41 10 28 27Z" fill="#e96572" stroke="#7b4a45" strokeWidth="2.5"/><circle cx="28" cy="28" r="6" fill="#ffd9a2" stroke="#7b4a45" strokeWidth="2"/><path d="M20 34L15 51L28 42L41 51L36 34" fill="#e96572" stroke="#7b4a45" strokeWidth="2.5"/></>}
    {id === 'star' && <><circle cx="28" cy="28" r="22" fill="#ffe7ae" stroke="#996337" strokeWidth="2.5"/><path d="M28 7L33 21L48 21L36 30L40 45L28 36L16 45L20 30L8 21L23 21Z" fill="#efb54a" stroke="#996337" strokeWidth="2.5"/><circle cx="23" cy="27" r="1.5" fill="#754b38"/><circle cx="33" cy="27" r="1.5" fill="#754b38"/><path d="M24 32Q28 36 32 32" fill="none" stroke="#754b38" strokeWidth="1.5"/></>}
    {id === 'clover' && <><path d="M28 31C13 29 11 17 18 13C24 10 28 16 28 21C28 16 32 10 38 13C45 17 43 29 28 31C42 31 45 42 39 46C33 50 28 44 28 38C28 44 23 50 17 46C11 42 14 31 28 31Z" fill="#67ad83" stroke="#3e775f" strokeWidth="2.5"/><path d="M28 31L28 53" stroke="#3e775f" strokeWidth="4" strokeLinecap="round"/><circle cx="28" cy="29" r="3" fill="#d9edb3"/></>}
  </svg>;
}

export function IngredientArt({ id, size = 60, className }: ArtProps & { id: IngredientId }) {
  return <svg className={className} width={size} height={size} viewBox="0 0 120 120" role="img" aria-label={id}>
    {id === 'egg' && <><ellipse cx="60" cy="65" rx="33" ry="42" fill="#fff5df" {...stroke}/><path d="M40 45Q60 32 80 45" fill="none" stroke="#fff" strokeWidth="7"/></>}
    {id === 'bread' && <><path d="M25 48Q25 22 48 24Q60 15 72 24Q95 22 95 48V93H25Z" fill="#d78f56" {...stroke}/><path d="M34 50Q34 32 50 33Q60 27 70 33Q86 32 86 50V84H34Z" fill="#fff0bb" {...stroke}/></>}
    {id === 'milk' && <><path d="M37 31L49 17H75L85 31V99H37Z" fill="#f9fcf8" {...stroke}/><path d="M37 31H85L75 17H49Z" fill="#85c9c2" {...stroke}/><rect x="43" y="52" width="36" height="29" rx="6" fill="#b9e4dd"/><path d="M52 64Q60 55 69 64Q67 75 60 75Q53 75 52 64" fill="#fff"/></>}
    {id === 'flour' && <><path d="M35 31H85L91 98H29Z" fill="#f6e7c9" {...stroke}/><path d="M35 31Q60 40 85 31" fill="none" {...stroke}/><circle cx="60" cy="65" r="19" fill="#fffaf0"/><path d="M48 68Q61 50 73 68M47 73Q60 58 74 73" fill="none" stroke="#d8ac79" strokeWidth="4"/></>}
    {id === 'butter' && <><ellipse cx="60" cy="93" rx="42" ry="10" fill="#e9cfa8"/><path d="M27 57L72 43L93 58L46 75Z" fill="#ffe38c" {...stroke}/><path d="M46 75L93 58V82L46 98Z" fill="#eeb957" {...stroke}/><path d="M27 57L46 75V98L27 79Z" fill="#f9d777" {...stroke}/></>}
    {id === 'oil' && <><rect x="43" y="34" width="34" height="59" rx="8" fill="#f4c65d" {...stroke}/><path d="M49 34V22H70V34" fill="#b8d9a3" {...stroke}/><path d="M48 72Q60 58 72 72" fill="none" stroke="#fff1aa" strokeWidth="5"/></>}
    {id === 'salt' && <><path d="M43 37H77V92Q60 100 43 92Z" fill="#f7f5ef" {...stroke}/><rect x="40" y="27" width="40" height="13" rx="4" fill="#91cfc5" {...stroke}/><circle cx="53" cy="64" r="3" fill="#91cfc5"/><circle cx="66" cy="70" r="3" fill="#91cfc5"/></>}
    {id === 'sugar' && <><path d="M38 40H82L78 93H42Z" fill="#fffbef" {...stroke}/><path d="M40 39H80L75 28H45Z" fill="#f6b8ad" {...stroke}/><path d="M51 65L60 52L69 65L60 78Z" fill="#e8ad92"/></>}
  </svg>;
}

export function DishArt({ id, size = 94, className }: ArtProps & { id: RecipeId }) {
  const egg = id === 'fried_egg' || id === 'salted_egg';
  const toast = id === 'toast' || id === 'butter_toast';
  return <svg className={className} width={size} height={size} viewBox="0 0 140 140" role="img" aria-label={id}>
    <ellipse cx="70" cy="113" rx="58" ry="17" fill="#e7ccb4" opacity=".6"/>
    <ellipse cx="70" cy="105" rx="58" ry="24" fill="#fffdf4" {...stroke}/>
    <ellipse cx="70" cy="104" rx="48" ry="18" fill="#f3e2c8"/>
    {egg && <><path d="M27 88Q28 65 51 68Q62 51 79 64Q102 61 109 83Q117 103 91 110Q75 120 55 108Q30 111 27 88Z" fill="#fffaf0" {...stroke}/><circle cx="70" cy="86" r="19" fill="#f9bf4c" stroke="#e89f38" strokeWidth="3"/><ellipse cx="64" cy="78" rx="6" ry="3" fill="#ffe9a2"/>{id === 'salted_egg' && <><circle cx="42" cy="79" r="2" fill="#98bc9b"/><circle cx="93" cy="95" r="2" fill="#98bc9b"/><circle cx="56" cy="103" r="2" fill="#98bc9b"/></>}</>}
    {toast && <><path d="M33 93Q30 71 47 70Q69 59 92 70Q108 69 107 93L97 110H43Z" fill="#b77241" {...stroke}/><path d="M42 93Q40 77 54 78Q70 70 86 78Q100 76 98 93L91 103H49Z" fill="#f7c880" {...stroke}/>{id === 'butter_toast' && <><path d="M61 79L77 75L85 85L69 90Z" fill="#ffe681" {...stroke}/><path d="M48 88L52 84M90 90L94 86" stroke="#fff3b0" strokeWidth="4"/></>}</>}
    {id === 'warm_milk' && <><path d="M44 55H96V105Q70 116 44 105Z" fill="#fffaf0" {...stroke}/><ellipse cx="70" cy="55" rx="26" ry="9" fill="#f9e8c6" {...stroke}/><path d="M97 66Q119 62 114 82Q113 91 97 91" fill="none" {...stroke}/><path d="M58 38Q52 28 59 21M74 39Q68 29 75 20" fill="none" stroke="#cdb7a6" strokeWidth="3"/></>}
    {id === 'pancake' && <><ellipse cx="70" cy="102" rx="39" ry="11" fill="#d89553" {...stroke}/><ellipse cx="70" cy="93" rx="38" ry="10" fill="#f0b76b" {...stroke}/><ellipse cx="70" cy="84" rx="37" ry="10" fill="#d89553" {...stroke}/><ellipse cx="70" cy="75" rx="37" ry="10" fill="#f5c77a" {...stroke}/><path d="M46 70Q70 59 94 70L83 84Q76 74 68 84L58 78L53 87Z" fill="#d79258"/><path d="M63 67L77 66L83 74L69 77Z" fill="#ffe590" {...stroke}/></>}
  </svg>;
}

export function ToolArt({ tool, action, progress = 0, size = 220 }: { tool: ToolId; action: ActionId; progress?: number; size?: number }) {
  return <div className={`tool-art tool-${tool} ${progress > 0 ? 'is-active' : ''}`} style={{ width: size, height: size }} role="img" aria-label={tool}>
    <img src={`/game/tool-${tool}.webp`} alt="" draggable={false}/>
    {progress > 0 && tool !== 'bowl' && <svg className="tool-effect" viewBox="0 0 240 240" aria-hidden="true"><g className="steam-lines" fill="none" stroke="#f7d596" strokeWidth="5" strokeLinecap="round"><path d="M79 60Q70 43 82 27"/><path d="M117 52Q108 35 122 18"/><path d="M153 58Q145 41 157 26"/></g></svg>}
    {progress > 0 && tool === 'bowl' && <svg className="tool-effect" viewBox="0 0 240 240" aria-hidden="true"><path className="mix-swirl" d="M84 108Q121 87 156 108Q128 130 94 118" fill="none" stroke="#fff8d8" strokeWidth="6" strokeLinecap="round"/></svg>}
    {progress > 0 && action === 'flip' && <span className="flip-sparkle" aria-hidden="true">✦</span>}
  </div>;
}
