import type { HomeId } from './content';

export function StorageArt({ id }: { id: HomeId }) {
  return <svg width="50" height="50" viewBox="0 0 64 64" role="img" aria-label={id === 'fridge' ? '냉장고' : id === 'shelf' ? '간식 선반' : '상온 보관장'}>
    <defs><linearGradient id={`storage-${id}`} x2="1" y2="1"><stop stopColor="#fff9e7"/><stop offset="1" stopColor={id === 'fridge' ? '#9bc9cb' : '#c69a69'}/></linearGradient></defs>
    {id === 'fridge' && <><rect x="13" y="5" width="38" height="54" rx="6" fill="url(#storage-fridge)" stroke="#6c8a88" strokeWidth="4"/><path d="M14 32H50" stroke="#6c8a88" strokeWidth="3"/><path d="M20 17V25M20 39V47" stroke="#eaf4e8" strokeWidth="4" strokeLinecap="round"/><path d="M36 11Q46 20 41 30" fill="none" stroke="#fff" strokeWidth="3" opacity=".6"/></>}
    {id === 'shelf' && <><path d="M8 53H56M11 32H53M12 11H52" stroke="#845a3d" strokeWidth="6" strokeLinecap="round"/><path d="M14 10V57M50 10V57" stroke="#a97950" strokeWidth="5"/><path d="M19 16H30V30H19Z" fill="#f5d48b" stroke="#8b623f" strokeWidth="2"/><path d="M36 16H46V30H36Z" fill="#eaa5a3" stroke="#8b623f" strokeWidth="2"/><path d="M20 37H44V51H20Z" fill="#e9c68b" stroke="#8b623f" strokeWidth="2"/></>}
    {id === 'pantry' && <><rect x="10" y="6" width="44" height="52" rx="4" fill="url(#storage-pantry)" stroke="#815a3d" strokeWidth="4"/><path d="M32 7V57" stroke="#815a3d" strokeWidth="3"/><circle cx="27" cy="33" r="2" fill="#f5dfb4"/><circle cx="37" cy="33" r="2" fill="#f5dfb4"/><path d="M14 13H28M36 13H50" stroke="#fff1d5" strokeWidth="3" opacity=".6"/></>}
  </svg>;
}
