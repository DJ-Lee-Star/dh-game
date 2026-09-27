export function BasketArt({ size = 76 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 110 90" role="img" aria-label="나무 장바구니" className="basket-art">
    <defs><linearGradient id="basketWicker" x2="0" y2="1"><stop stopColor="#e8b773"/><stop offset="1" stopColor="#a96e42"/></linearGradient></defs>
    <ellipse cx="55" cy="84" rx="43" ry="6" fill="#6a452f" opacity=".22"/>
    <path d="M21 38Q24 12 55 12Q86 12 89 38" fill="none" stroke="#835438" strokeWidth="8" strokeLinecap="round"/>
    <path d="M22 39Q55 32 88 39L80 78Q55 86 30 78Z" fill="url(#basketWicker)" stroke="#75492f" strokeWidth="4"/>
    <path d="M25 48Q55 42 85 48M27 58Q55 53 83 58M29 68Q55 64 81 68M39 39L35 77M52 38V81M66 38L72 79" fill="none" stroke="#f4d298" strokeWidth="4" opacity=".85"/>
    <path d="M20 38Q54 46 90 38" fill="none" stroke="#815237" strokeWidth="6" strokeLinecap="round"/>
    <path d="M42 15Q55 8 68 15" fill="none" stroke="#e9bc7f" strokeWidth="3" strokeLinecap="round"/>
  </svg>;
}
