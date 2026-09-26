import { IngredientArt } from '../components/GameArt';
import type { IngredientId as OldIngredientId } from '../game/data';
import { INGREDIENTS } from './content';
import type { IngredientId } from './content';

const oldIds = ['egg', 'bread', 'milk', 'flour', 'butter', 'oil', 'salt', 'sugar'];
const line = { stroke: '#754e3e', strokeWidth: 3, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

export function IngredientVisual({ id, size = 54 }: { id: IngredientId; size?: number }) {
  if (oldIds.includes(id)) return <IngredientArt id={id as OldIngredientId} size={size}/>;
  return <svg width={size} height={size} viewBox="0 0 120 120" role="img" aria-label={INGREDIENTS[id].name}>
    {id === 'jam' && <><path d="M33 47H87L83 99Q60 106 37 99Z" fill="#efabc0" {...line}/><path d="M29 40H91V52H29Z" fill="#f6d686" {...line}/><path d="M37 34Q60 23 83 34V40H37Z" fill="#d05f71" {...line}/><ellipse cx="60" cy="75" rx="16" ry="13" fill="#d44b68"/><path d="M55 62L50 56M65 62L70 56" stroke="#649659" strokeWidth="4"/></>}
    {id === 'cocoa' && <><path d="M35 32H85L90 98H30Z" fill="#aa7056" {...line}/><path d="M35 32Q60 42 85 32" fill="none" {...line}/><ellipse cx="60" cy="69" rx="20" ry="17" fill="#f5d7a2"/><path d="M49 69Q60 48 71 69Q70 85 60 85Q50 85 49 69" fill="#8b5743"/></>}
    {id === 'banana' && <><path d="M25 55Q32 94 70 94Q94 91 99 60Q87 77 70 77Q47 76 38 51Z" fill="#f8d878" {...line}/><path d="M30 54L35 45L42 51M94 60L103 54L101 65" fill="#7c593b" {...line}/><path d="M39 75Q61 100 88 79" fill="none" stroke="#fff1af" strokeWidth="5"/></>}
    {id === 'tomato' && <><circle cx="60" cy="68" r="33" fill="#e86c5c" {...line}/><path d="M60 42Q52 27 37 32L51 47L60 35L69 47L83 32Q68 28 60 42Z" fill="#6f9d68" {...line}/><ellipse cx="48" cy="61" rx="7" ry="4" fill="#f4a18d"/></>}
    {id === 'cheese' && <><path d="M29 51L80 35L96 54L44 72Z" fill="#ffe496" {...line}/><path d="M44 72L96 54V87L44 103Z" fill="#f6c55b" {...line}/><path d="M29 51L44 72V103L29 83Z" fill="#e9b451" {...line}/><circle cx="69" cy="75" r="5" fill="#e5ac4c"/><circle cx="82" cy="63" r="3" fill="#e5ac4c"/></>}
    {id === 'yogurt' && <><path d="M36 47H84L77 99H43Z" fill="#e5f1ec" {...line}/><ellipse cx="60" cy="47" rx="26" ry="10" fill="#fffef7" {...line}/><path d="M42 71Q60 82 78 70" fill="none" stroke="#ee94a7" strokeWidth="8"/><circle cx="60" cy="72" r="5" fill="#d85c78"/></>}
    {id === 'strawberry' && <><path d="M32 51Q25 70 60 105Q95 70 88 51Q74 40 60 49Q45 40 32 51Z" fill="#e65c6c" {...line}/><path d="M60 49Q43 47 39 32L55 38Q60 24 65 38L81 32Q78 47 60 49Z" fill="#70a16d" {...line}/>{[43,56,69,82].map((x,i) => <circle key={i} cx={x} cy={62+i%2*16} r="2.2" fill="#ffe2a1"/>)}</>}
    {id === 'noodle' && <><path d="M28 50H92L87 98H33Z" fill="#df9b62" {...line}/><path d="M28 50Q60 59 92 50" fill="none" {...line}/><path d="M39 65Q50 50 60 66Q70 50 81 66M39 77Q50 62 60 78Q70 62 81 78" fill="none" stroke="#f8df87" strokeWidth="6" strokeLinecap="round"/><path d="M44 93H76" stroke="#b8584e" strokeWidth="5"/></>}
    {id === 'broth' && <><path d="M37 29H83L90 96Q60 105 30 96Z" fill="#f1d7ad" {...line}/><path d="M37 29L45 18H75L83 29Z" fill="#e47865" {...line}/><circle cx="60" cy="66" r="19" fill="#e7a36b"/><path d="M47 66Q60 51 73 66" fill="none" stroke="#fff1cb" strokeWidth="5"/></>}
    {id === 'lettuce' && <><path d="M60 99Q39 94 29 73Q17 64 29 48Q25 30 43 32Q61 21 70 37Q92 26 94 47Q107 56 90 72Q92 93 60 99Z" fill="#82b682" {...line}/><path d="M60 93Q41 64 37 48M60 93Q76 63 85 45M60 93V43" fill="none" stroke="#c0db9b" strokeWidth="5" strokeLinecap="round"/></>}
  </svg>;
}
