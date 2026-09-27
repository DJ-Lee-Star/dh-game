import { useRef, useState } from 'react';
import type { CSSProperties, Dispatch, KeyboardEvent, PointerEvent, SetStateAction } from 'react';
import { Pointer } from 'lucide-react';
import type { CookAction, IngredientId, RecipeId } from './content';
import { CookScene } from './CookScene';
import { IngredientVisual } from './IngredientVisual';
import { audio } from './audio';

type Point = { x: number; y: number };
type Setup = { source: Point; target: Point; radius: Point; tool: string; goal: string };

const SETUP: Record<CookAction, Setup> = {
  crack: { source: { x: 18, y: 25 }, target: { x: 40, y: 49 }, radius: { x: 13, y: 15 }, tool: '달걀', goal: '팬 가장자리' },
  wash: { source: { x: 18, y: 64 }, target: { x: 62, y: 52 }, radius: { x: 20, y: 24 }, tool: '재료', goal: '물줄기 아래' },
  slice: { source: { x: 17, y: 20 }, target: { x: 51, y: 55 }, radius: { x: 20, y: 25 }, tool: '칼 손잡이', goal: '도마 위 재료' },
  stir: { source: { x: 19, y: 22 }, target: { x: 50, y: 54 }, radius: { x: 22, y: 25 }, tool: '거품기', goal: '반죽 안' },
  spread: { source: { x: 17, y: 25 }, target: { x: 53, y: 54 }, radius: { x: 22, y: 21 }, tool: '잼 스푼', goal: '빵 위' },
  pour: { source: { x: 17, y: 22 }, target: { x: 53, y: 56 }, radius: { x: 20, y: 20 }, tool: '그릇', goal: '받는 그릇' },
  heat: { source: { x: 17, y: 72 }, target: { x: 52, y: 67 }, radius: { x: 23, y: 20 }, tool: '불 조절 손잡이', goal: '화구 아래' },
  flip: { source: { x: 18, y: 77 }, target: { x: 52, y: 66 }, radius: { x: 21, y: 18 }, tool: '뒤집개', goal: '음식 아래' },
  sprinkle: { source: { x: 18, y: 23 }, target: { x: 52, y: 52 }, radius: { x: 23, y: 22 }, tool: '양념통', goal: '음식 위' },
  stack: { source: { x: 18, y: 23 }, target: { x: 52, y: 52 }, radius: { x: 21, y: 22 }, tool: '재료', goal: '접시 위' },
};

function ToolArt({ action, ingredient }: { action: CookAction; ingredient?: IngredientId }) {
  if (action === 'crack') return <img className="cook-tool-ingredient" src="/game/ingredient-egg-v3.webp" alt="" draggable={false}/>;
  if (action === 'wash' && ingredient && ['tomato', 'strawberry', 'lettuce'].includes(ingredient)) return <img className="cook-tool-ingredient" src={`/game/ingredient-${ingredient}-v3.webp`} alt="" draggable={false}/>;
  if (action === 'wash' || action === 'stack') return <IngredientVisual id={ingredient ?? 'egg'} size={51}/>;
  return <svg viewBox="0 0 70 70" width="55" height="55" role="img" aria-label={SETUP[action].tool}>
    <defs><linearGradient id="steel" x2="0" y2="1"><stop stopColor="#fffaf0"/><stop offset="1" stopColor="#9dadb0"/></linearGradient><linearGradient id="wood" x2="0" y2="1"><stop stopColor="#deb582"/><stop offset="1" stopColor="#9a6748"/></linearGradient></defs>
    {action === 'slice' && <><path d="M22 8H42V35L36 57Q29 62 22 50Z" fill="url(#steel)" stroke="#586872" strokeWidth="3"/><path d="M23 6H42V29H23Z" fill="url(#wood)" stroke="#80553e" strokeWidth="3"/></>}
    {action === 'stir' && <><path d="M34 5V43" stroke="#a27953" strokeWidth="8" strokeLinecap="round"/><path d="M17 40Q20 65 35 63Q50 65 53 40M25 36Q27 59 35 62Q43 59 45 36M35 35V63" fill="none" stroke="#8b9a9c" strokeWidth="3.5" strokeLinecap="round"/></>}
    {action === 'spread' && <><path d="M13 13L41 44" stroke="#a97953" strokeWidth="9" strokeLinecap="round"/><ellipse cx="49" cy="51" rx="15" ry="8" transform="rotate(42 49 51)" fill="url(#steel)" stroke="#78898a" strokeWidth="2"/><path d="M46 49Q53 43 59 52" fill="none" stroke="#d35d72" strokeWidth="5"/></>}
    {action === 'pour' && <><path d="M15 19H52L48 55Q34 62 20 55Z" fill="#c7e2dc" stroke="#6e938f" strokeWidth="3"/><path d="M52 25Q66 25 62 41Q59 50 51 49" fill="none" stroke="#6e938f" strokeWidth="4"/><ellipse cx="34" cy="19" rx="19" ry="6" fill="#fff8e5" stroke="#6e938f" strokeWidth="3"/></>}
    {action === 'flip' && <><path d="M11 56L43 35" stroke="#a87953" strokeWidth="8" strokeLinecap="round"/><path d="M38 35Q38 17 57 15L65 19Q64 39 45 43Z" fill="url(#steel)" stroke="#6d7b7c" strokeWidth="3"/><path d="M48 21L53 34M57 19L60 29" stroke="#6d7b7c" strokeWidth="2"/></>}
    {action === 'heat' && <><circle cx="35" cy="35" r="25" fill="#d2c1a4" stroke="#876344" strokeWidth="5"/><circle cx="35" cy="35" r="14" fill="#f6e7cd" stroke="#876344" strokeWidth="3"/><path d="M35 35L49 22" stroke="#b66f53" strokeWidth="6" strokeLinecap="round"/></>}
    {action === 'sprinkle' && <><path d="M21 23H49L46 59H24Z" fill="#f1e3bf" stroke="#82604a" strokeWidth="3"/><path d="M18 16H52V27H18Z" fill="#88b7a3" stroke="#82604a" strokeWidth="3"/><circle cx="28" cy="20" r="2" fill="#f9f2da"/><circle cx="36" cy="20" r="2" fill="#f9f2da"/><circle cx="44" cy="20" r="2" fill="#f9f2da"/></>}
  </svg>;
}

export function CookingInteraction({ action, progress, setProgress, ingredient, recipeId, ready, help }: {
  action: CookAction; progress: number; setProgress: Dispatch<SetStateAction<number>>;
  ingredient?: IngredientId; recipeId: RecipeId; ready: boolean; help: boolean;
}) {
  const setup = SETUP[action];
  const surface = useRef<HTMLDivElement>(null);
  const drag = useRef<{ last: Point; angle: number; inside: boolean } | null>(null);
  const [position, setPosition] = useState<Point>(setup.source);
  const targetRadius = help ? { x: setup.radius.x * 1.28, y: setup.radius.y * 1.28 } : setup.radius;
  const inside = (point: Point) => Math.abs(point.x - setup.target.x) <= targetRadius.x && Math.abs(point.y - setup.target.y) <= targetRadius.y;
  const location = (event: PointerEvent<HTMLButtonElement>): Point => {
    const rect = surface.current!.getBoundingClientRect();
    return { x: Math.max(2, Math.min(98, (event.clientX - rect.left) / rect.width * 100)), y: Math.max(2, Math.min(98, (event.clientY - rect.top) / rect.height * 100)) };
  };
  const move = (point: Point) => {
    const state = drag.current;
    setPosition(point);
    if (!state || !ready || progress >= 100) return;
    const hit = inside(point);
    const dx = point.x - state.last.x, dy = point.y - state.last.y;
    const angle = Math.atan2(point.y - setup.target.y, point.x - setup.target.x);
    let amount = 0;
    if (hit) {
      if (['crack', 'pour', 'stack'].includes(action)) amount = state.inside ? 0 : 100;
      else if (action === 'stir') amount = state.inside ? Math.abs(Math.atan2(Math.sin(angle - state.angle), Math.cos(angle - state.angle))) * 22 : 0;
      else if (action === 'slice' || action === 'flip') amount = state.inside ? (action === 'slice' ? Math.max(0, dy) : Math.max(0, -dy)) * 1.2 : 0;
      else amount = state.inside ? Math.abs(dx) * 1.1 : 0;
    }
    if (amount > 0) {
      setProgress(value => Math.min(100, value + amount));
      audio.effect(action === 'slice' ? 'slice' : action === 'stir' ? 'stir' : 'tap');
    }
    drag.current = { last: point, angle, inside: hit };
  };
  const onDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (!ready || progress >= 100) return;
    event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId);
    const point = location(event);
    drag.current = { last: point, angle: Math.atan2(point.y - setup.target.y, point.x - setup.target.x), inside: inside(point) };
  };
  const onKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!ready || progress >= 100) return;
    const offset: Record<string, Point> = { ArrowUp: { x: 0, y: -10 }, ArrowDown: { x: 0, y: 10 }, ArrowLeft: { x: -10, y: 0 }, ArrowRight: { x: 10, y: 0 } };
    if (offset[event.key]) { event.preventDefault(); setPosition(current => ({ x: Math.max(2, Math.min(98, current.x + offset[event.key].x)), y: Math.max(2, Math.min(98, current.y + offset[event.key].y)) })); }
    if ((event.key === 'Enter' || event.key === ' ') && inside(position)) { event.preventDefault(); setProgress(value => Math.min(100, value + 20)); }
  };
  return <div className={`gesture-surface direct-cook gesture-${action} ${ready ? 'ready' : ''} ${help ? 'show-guide' : ''}`} ref={surface} aria-label={`${setup.tool}을(를) 잡아 ${setup.goal}(으)로 움직이는 조리 화면`}>
    <CookScene action={action} progress={progress} ingredient={ingredient} recipeId={recipeId}/>
    <div className="cook-target" style={{ left: `${setup.target.x}%`, top: `${setup.target.y}%`, width: `${targetRadius.x * 2}%`, height: `${targetRadius.y * 2}%` }} aria-hidden="true"><span>{setup.goal}</span></div>
    {help && <div className="cook-guide-hand" style={{ '--from-x': `${setup.source.x}%`, '--from-y': `${setup.source.y}%`, '--to-x': `${setup.target.x}%`, '--to-y': `${setup.target.y}%` } as CSSProperties} aria-hidden="true"><Pointer size={30}/></div>}
    <button type="button" className="cook-tool" disabled={!ready || progress >= 100} style={{ left: `${position.x}%`, top: `${position.y}%` }} onPointerDown={onDown} onPointerMove={event => { if (drag.current) move(location(event)); }} onPointerUp={() => { drag.current = null; setPosition(setup.source); }} onPointerCancel={() => { drag.current = null; setPosition(setup.source); }} onKeyDown={onKey} aria-label={`${setup.tool} 잡기`}><ToolArt action={action} ingredient={ingredient}/></button>
  </div>;
}
