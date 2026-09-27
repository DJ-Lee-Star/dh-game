import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, ChefHat, ChevronLeft, Coins, Gift, Heart, Home, Music2, Settings2, ShoppingBasket, Sparkles, Trophy, Volume2, X } from 'lucide-react';
import { COSMETICS, COSMETIC_IDS, CUSTOMERS, FAMILY, FAMILY_FAVORITES, HOMES, INGREDIENTS, MART_ITEMS, MAX_LEVEL, RECIPES, RECIPE_IDS, STORIES, levelFromXp, recipeIngredients } from './content';
import type { CosmeticId, CosmeticSlot, FamilyId, HomeId, IngredientId, Recipe, RecipeId } from './content';
import { activeProfile, ApiError, createProfile, fetchState, importOldSave, savedProfiles, saveProfile, selectProfile, sendCommand } from './api';
import type { Profile } from './api';
import { LEGACY_SAVE_KEY, levelProgress, minigameDrops, orderMatches } from './engine';
import type { Command, GameState, HeldDish, Outcome, ShapeId, ToppingId } from './engine';
import { FoodArt } from './FoodArt';
import { GearArt } from './GearArt';
import { IngredientVisual } from './IngredientVisual';
import { CookingInteraction } from './CookingInteraction';
import { BasketArt } from './BasketArt';
import { StorageArt } from './StorageArt';
import { audio, type AudioSettings } from './audio';
import './AppV2.css';

type View = 'restaurant' | 'kitchen' | 'mart' | 'minigame' | 'wardrobe';
type Modal = 'settings' | 'recipes' | 'quests' | 'family' | 'stories' | null;
const familyIds: FamilyId[] = ['mother', 'father', 'sibling'];
const homeIds: HomeId[] = ['fridge', 'shelf', 'pantry'];
const customerImage = (id: keyof typeof CUSTOMERS, happy = false) => `/game/customer-${id}${happy ? '-happy' : ''}.webp`;
const familyImage = (id: FamilyId, happy = false) => `/game/family-${id}${happy ? '-happy' : ''}-v2.png`;

export default function AppV2() {
  const [profile, setProfile] = useState<Profile | null>(() => activeProfile());
  const [game, setGame] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(Boolean(profile));
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<View>('restaurant');
  const [modal, setModal] = useState<Modal>(null);
  const [notice, setNotice] = useState('');
  const [retryAvailable, setRetryAvailable] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(() => audio.getSettings());
  const pending = useRef<{ command: Command; requestId: string } | null>(null);

  useEffect(() => {
    if (!profile) return;
    let live = true;
    fetchState(profile).then(state => { if (live) { setGame(state); setNotice(''); } })
      .catch(error => { if (live) setNotice(error.message); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [profile]);
  useEffect(() => {
    audio.setScene(view === 'mart' ? 'mart' : 'restaurant');
    return () => audio.stopMusic();
  }, [view]);
  useEffect(() => {
    if (!outcome) return;
    const timer = window.setTimeout(() => setOutcome(null), outcome.kind === 'customer' || outcome.kind === 'family' ? 3900 : 2400);
    return () => clearTimeout(timer);
  }, [outcome]);
  useEffect(() => {
    if (!notice || retryAvailable) return;
    const timer = window.setTimeout(() => setNotice(''), 3000);
    return () => clearTimeout(timer);
  }, [notice, retryAvailable]);

  const enter = () => { audio.unlock(); audio.setScene(view === 'mart' ? 'mart' : 'restaurant'); };
  const navigate = (next: View) => { enter(); setView(next); setNotice(''); };
  const run = useCallback(async (command: Command, done?: () => void) => {
    if (!profile || busy) return false;
    const requestId = crypto.randomUUID();
    pending.current = { command, requestId };
    setRetryAvailable(true);
    setBusy(true);
    try {
      const result = await sendCommand(profile, command, requestId);
      setGame(result.state); setOutcome(result.outcome); setNotice(result.outcome.message);
      audio.effect(result.outcome.kind === 'customer' || result.outcome.kind === 'family' ? 'serve' : result.outcome.kind === 'cook' ? 'cook' : 'reward');
      pending.current = null; setRetryAvailable(false); done?.(); return true;
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : '잠시 문제가 생겼어요.');
      if (cause instanceof ApiError && cause.status < 500) { pending.current = null; setRetryAvailable(false); }
      audio.effect('error'); return false;
    } finally { setBusy(false); }
  }, [profile, busy]);
  const retry = async () => {
    if (!pending.current || !profile || busy) return;
    setBusy(true);
    try {
      const result = await sendCommand(profile, pending.current.command, pending.current.requestId);
      setGame(result.state); setOutcome(result.outcome); setNotice(result.outcome.message); pending.current = null; setRetryAvailable(false);
    } catch (cause) { setNotice(cause instanceof Error ? cause.message : '다시 시도해 주세요.'); }
    finally { setBusy(false); }
  };
  const changeProfile = (item: Profile) => { saveProfile(item); selectProfile(item.id); setLoading(true); setProfile(item); setGame(null); setView('restaurant'); setModal(null); };
  const updateAudio = (next: AudioSettings) => { setAudioSettings(next); audio.saveSettings(next); };
  const legacyExists = (() => { try { return Boolean(localStorage.getItem(LEGACY_SAVE_KEY)); } catch { return false; } })();
  const importLegacySave = async () => {
    if (!profile) return;
    try {
      const raw = localStorage.getItem(LEGACY_SAVE_KEY);
      if (!raw) { setNotice('이전 기록이 없어요.'); return; }
      setBusy(true);
      const result = await importOldSave(profile, JSON.parse(raw));
      setGame(result.state); setNotice(result.outcome.message); setModal(null);
      // The old browser save remains untouched as a backup.
    } catch (cause) { setNotice(cause instanceof Error ? cause.message : '이전 기록을 가져오지 못했어요.'); }
    finally { setBusy(false); }
  };

  if (!profile || (!game && !loading)) return <ProfileGate onChoose={changeProfile} notice={notice} />;
  if (!game) return <div className="v2-loading">냥냥식당을 열고 있어요… 🐾</div>;
  const level = levelFromXp(game.xp);
  const progress = levelProgress(game.xp);
  const order = game.order;
  const restaurantBackground = game.equipped.background === 'evening_background' ? 'evening' : game.equipped.background === 'garden_background' ? 'garden' : '';
  return <div className="v2-shell" onPointerDown={enter}>
    <header className="v2-hud">
      <div className="v2-brand"><span className="brand-paw">🐾</span><span><strong>냥냥식당</strong><small>{profile.name} 셰프의 하루</small></span></div>
      <div className="hud-mini-actions"><button aria-label="도감" onClick={() => setModal('recipes')}><BookOpen size={20}/></button><button aria-label="퀘스트" onClick={() => setModal('quests')}><Gift size={20}/></button><button aria-label="설정" onClick={() => setModal('settings')}><Settings2 size={20}/></button></div>
      <div className="v2-status"><span className="v2-level">Lv.{level}{level === MAX_LEVEL ? ' ★' : ''}</span><div className="v2-xp" role="progressbar" aria-label="레벨 경험치" aria-valuenow={progress.value} aria-valuemin={0} aria-valuemax={progress.needed || 1}><span style={{ width: `${progress.percent}%` }}/></div><small>{level === MAX_LEVEL ? '최고 레벨' : `${progress.value}/${progress.needed} XP`}</small><span className="v2-currency"><Coins size={16}/> {game.money}</span><span className="v2-currency heart"><Heart size={16}/> {game.hearts}</span></div>
    </header>
    <main className="v2-main" key={view}>
      {view === 'restaurant' && <div className="restaurant-v2">
        <div className={`restaurant-scene-v2 ${restaurantBackground}`}>
          <div className="room-heading"><span>{order.special ? '⭐ 스페셜 손님이 왔어요!' : '🍽️ 오늘의 손님'}</span><strong>{CUSTOMERS[order.customerId]}</strong></div>
          <div className="order-note"><small>{order.kind === 'wish' ? '오늘은 골라 주는 주문' : '주문서'}</small><div><FoodArt id={order.recipeId} size={74}/><span><strong>{order.kind === 'wish' ? order.wish : RECIPES[order.recipeId].name}</strong><small>{order.kind === 'wish' ? `${order.accepted.length}가지 요리 중 골라도 좋아요` : order.special ? '별님은 새로운 맛을 기다리고 있어요' : '시간 제한 없이 천천히 만들어 주세요'}</small></span></div></div>
          <div className="restaurant-stage"><ChefFigure game={game}/><div className="restaurant-counter"><div className="counter-worktop">{game.heldDish && <FoodArt id={game.heldDish.id} dish={game.heldDish} size={75}/>}</div><div className="counter-front"><span>냥냥식당</span></div></div><div className="customer-figure"><img src={customerImage(order.customerId)} alt={`${CUSTOMERS[order.customerId]} 손님`}/><span>{CUSTOMERS[order.customerId]}</span></div></div>
        </div>
        <div className="restaurant-actions-v2">
          {game.heldDish ? <><div className="ready-dish"><FoodArt id={game.heldDish.id} dish={game.heldDish} size={70}/><span><small>내가 만든 요리</small><strong>{RECIPES[game.heldDish.id].name}</strong></span></div><button className="big-primary" disabled={busy || !orderMatches(order, game.heldDish.id)} onClick={() => run({ type: 'SERVE', target: 'customer' })}>손님에게 서빙하기 ✨</button><button className="soft-button" disabled={busy} onClick={() => setModal('family')}>가족에게 대접하기</button>{!orderMatches(order, game.heldDish.id) && <p className="friendly-line">앗, 손님 주문과 달라요! 가족이 맛보고 싶대요. 🐱</p>}</>
            : <><p className="friendly-line">{level === MAX_LEVEL ? '최고 레벨 셰프! 오늘도 마음에 드는 요리를 만들어 봐요. 🌟' : game.xp > 0 ? '다음엔 어떤 맛을 만들까? 요리하러 가요!' : '첫 요리 하나만 만들면 Lv.2가 돼요! 🌟'}</p><button className="big-primary" onClick={() => navigate('kitchen')}>주방에서 요리하기 <ChefHat size={19}/></button></>}
          {legacyExists && game.successfulServes === 0 && game.xp === 0 && <button className="legacy-banner" onClick={() => setModal('settings')}>📦 예전 식당 기록이 있어요 · 설정에서 가져오기</button>}
          <button className="story-progress" onClick={() => setModal('stories')}><span>📖 {STORIES[Math.min(2, Math.floor(game.successfulServes / 3))].title}</span><strong>{game.successfulServes >= 9 ? '모든 이야기 완성!' : `${game.successfulServes % 3}/3 접시 · 이야기 보기 →`}</strong></button>
        </div>
      </div>}
      {view === 'kitchen' && <Kitchen game={game} busy={busy} run={run} onMart={() => navigate('mart')} onRestaurant={() => navigate('restaurant')}/>}
      {view === 'mart' && <Mart game={game} busy={busy} run={run}/>}
      {view === 'minigame' && <MiniGame key={game.minigame?.id ?? 'idle'} game={game} busy={busy} run={run}/>}
      {view === 'wardrobe' && <Wardrobe game={game} busy={busy} run={run}/>}
    </main>
    <nav className="v2-nav" aria-label="게임 장소">
      <button className={view === 'restaurant' ? 'active' : ''} onClick={() => navigate('restaurant')}><Home size={21}/><span>식당</span></button>
      <button className={view === 'kitchen' ? 'active' : ''} onClick={() => navigate('kitchen')}><ChefHat size={21}/><span>요리</span></button>
      <button className={view === 'mart' ? 'active' : ''} onClick={() => navigate('mart')}><ShoppingBasket size={21}/><span>마트</span></button>
      <button className={view === 'minigame' ? 'active' : ''} onClick={() => navigate('minigame')}><Trophy size={21}/><span>놀이</span></button>
      <button className={view === 'wardrobe' ? 'active' : ''} onClick={() => navigate('wardrobe')}><Sparkles size={21}/><span>꾸미기</span></button>
    </nav>
    {notice && <div className="v2-toast" role="status" onClick={() => setNotice('')}>{notice}{retryAvailable && <button onClick={event => { event.stopPropagation(); retry(); }}>같은 요청 다시 확인</button>}</div>}
    {outcome && (outcome.kind === 'customer' || outcome.kind === 'family') && <EatingScene outcome={outcome} onDone={() => setOutcome(null)}/>}
    {modal === 'family' && game.heldDish && <Overlay title="누구에게 줄까요?" onClose={() => setModal(null)}><p className="overlay-lead">가족마다 좋아하는 음식이 달라요. 원래 손님 주문은 그대로 기다려요!</p><div className="family-choices">{familyIds.map(id => <button key={id} disabled={busy} onClick={() => run({ type: 'SERVE', target: id }, () => setModal(null))}><img src={familyImage(id)} alt={`${FAMILY[id]} 캐릭터`}/><strong>{FAMILY[id]}</strong><small>{FAMILY_FAVORITES[id].includes(game.heldDish!.id) ? '좋아하는 음식! 💗' : '맛있게 먹을게요'}</small></button>)}</div></Overlay>}
    {modal === 'recipes' && <Overlay title="냥냥 요리 도감" onClose={() => setModal(null)}><div className="recipe-collection">{RECIPE_IDS.map(id => { const recipe = RECIPES[id]; const secret = (recipe as Recipe).secret; const visible = !secret || game.discovered.includes(id); return <div key={id} className="collection-row"><FoodArt id={id} size={60}/><span><strong>{visible ? recipe.name : '비밀 레시피 ???'}</strong><small>{visible ? `Lv.${recipe.level} · ${game.discovered.includes(id) ? '완성했어요 ✓' : '아직 만들지 않았어요'}` : (recipe as Recipe).hint}</small></span></div>; })}</div><h3>새 조합 발견 {game.combinations.length}개</h3></Overlay>}
    {modal === 'quests' && <Overlay title="오늘의 작은 목표" onClose={() => setModal(null)}><div className="quest-v2">{(['cook_2', 'serve_2'] as const).map(id => { const value = id === 'cook_2' ? game.daily.cooked : game.daily.served; const claimed = game.daily.claimed.includes(id); return <div key={id}><strong>{id === 'cook_2' ? '요리 2번 만들기' : '손님 2명 대접하기'}</strong><span>{Math.min(2, value)}/2</span><button disabled={claimed || value < 2 || busy} onClick={() => run({ type: 'CLAIM', questId: id })}>{claimed ? '오늘 받았어요' : id === 'cook_2' ? '150코인 받기' : '하트 2개 받기'}</button></div>; })}</div></Overlay>}
    {modal === 'stories' && <Overlay title="손님들의 작은 이야기" onClose={() => setModal(null)}><div className="story-list">{STORIES.map((story, index) => { const complete = game.stories.includes(index + 1); const current = Math.floor(game.successfulServes / 3) === index; return <article key={story.title} className={complete ? 'complete' : current ? 'current' : 'locked'}><span className="story-number">{complete ? '⭐' : `0${index + 1}`}</span><div><h3>{story.title}</h3><p>{story.intro}</p><small>{complete ? `${story.ending} · ${story.sticker} 스티커 획득` : current ? `지금 진행 중 · ${game.successfulServes % 3}/3 접시` : '앞 이야기를 완성하면 열려요'}</small></div></article>; })}</div></Overlay>}
    {modal === 'settings' && <Settings game={game} profile={profile} onClose={() => setModal(null)} onSelect={changeProfile} onImport={importLegacySave} onReset={() => run({ type: 'RESET' }, () => { setView('restaurant'); setModal(null); })} busy={busy} legacyExists={legacyExists} audioSettings={audioSettings} onAudio={updateAudio}/>}
  </div>;
}
function ProfileGate({ onChoose, notice }: { onChoose: (profile: Profile) => void; notice: string }) {
  const [name, setName] = useState('냥냥');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const profiles = savedProfiles();
  const create = async () => {
    if (!name.trim() || creating) return;
    setCreating(true);
    try { const result = await createProfile(name); onChoose(result.profile); }
    catch (cause) { setError(cause instanceof Error ? cause.message : '프로필을 만들지 못했어요.'); }
    finally { setCreating(false); }
  };
  return <div className="profile-gate"><div className="profile-hero"><img src="/game/chef-cat.webp" alt="냥냥 셰프"/><span>우리만의 작은 식당</span><h1>냥냥식당</h1><p>어느 셰프가 오늘 요리할까요?</p></div><div className="profile-box">{profiles.map(item => <button key={item.id} onClick={() => onChoose(item)}>🐾 {item.name} 셰프의 식당 <span>이어 하기 →</span></button>)}<label htmlFor="chef-name">새 셰프 이름</label><div className="profile-create"><input id="chef-name" maxLength={20} value={name} onChange={event => setName(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') create(); }}/><button disabled={creating || !name.trim()} onClick={create}>새로 시작</button></div>{(error || notice) && <p role="alert">{error || notice}</p>}</div></div>;
}

function ChefFigure({ game }: { game: GameState }) {
  const outfit = game.equipped.outfit;
  const src = outfit === 'mint_outfit' ? '/game/chef-mint-outfit.png' : outfit === 'berry_outfit' ? '/game/chef-berry-outfit.png' : outfit === 'sky_outfit' ? '/game/chef-sky-outfit.png' : '/game/chef-cat.webp';
  return <div className="chef-figure"><img src={src} alt="냥냥 셰프"/>{game.equipped.hat && <span className="chef-hat" aria-label={`${COSMETICS[game.equipped.hat].name} 장착`}><GearArt id={game.equipped.hat}/></span>}{game.equipped.accessory && <span className="chef-accessory" aria-label={`${COSMETICS[game.equipped.accessory].name} 장착`}><GearArt id={game.equipped.accessory}/></span>}<span className="figure-label">냥냥 셰프</span></div>;
}

function CosmeticPreview({ id, slot }: { id: CosmeticId | null; slot: CosmeticSlot }) {
  if (!id) return <img className="wardrobe-item-image" src={slot === 'background' ? '/game/bg-restaurant.webp' : '/game/chef-cat.webp'} alt=""/>;
  if (slot === 'hat' || slot === 'accessory') return <GearArt id={id}/>;
  const image = slot === 'background' ? id === 'evening_background' ? '/game/bg-evening.png' : '/game/bg-garden.png' : id === 'mint_outfit' ? '/game/chef-mint-outfit.png' : id === 'berry_outfit' ? '/game/chef-berry-outfit.png' : '/game/chef-sky-outfit.png';
  return <img className="wardrobe-item-image" src={image} alt=""/>;
}

function Kitchen({ game, busy, run, onMart, onRestaurant }: { game: GameState; busy: boolean; run: (command: Command, done?: () => void) => Promise<boolean>; onMart: () => void; onRestaurant: () => void }) {
  const [selected, setSelected] = useState<RecipeId | null>(null);
  const [step, setStep] = useState(0);
  const [added, setAdded] = useState<IngredientId[]>([]);
  const [progress, setProgress] = useState(0);
  const [home, setHome] = useState<HomeId | null>(null);
  const [plating, setPlating] = useState(false);
  const [topping, setTopping] = useState<ToppingId>('none');
  const [shape, setShape] = useState<ShapeId>('heart');
  const [platePoint, setPlatePoint] = useState<{ x: number; y: number } | null>(null);
  const [hint, setHint] = useState('먼저 요리를 골라 볼까요?');
  const [cookHelp, setCookHelp] = useState(false);
  const recipe = selected ? RECIPES[selected] : null;
  const stage = recipe?.stages[step];
  const neededStage = stage?.ingredients ?? [];
  const ingredientsReady = neededStage.every((id, index) => added[index] === id);
  const pickRecipe = (id: RecipeId) => { setSelected(id); setStep(0); setAdded([]); setProgress(0); setPlating(false); setHome(null); setCookHelp(false); setHint(`${RECIPES[id].name}을(를) 만들어요. 재료를 찾아 볼까요?`); };
  const reset = () => { setSelected(null); setStep(0); setAdded([]); setProgress(0); setPlating(false); setHome(null); setCookHelp(false); setHint('다음 요리도 해 볼까요?'); };
  const addIngredient = (id: IngredientId) => {
    if (!stage) return;
    const expected = neededStage[added.length];
    if (id !== expected) { setHint(expected ? `다음에는 ${INGREDIENTS[expected].name}을(를) 넣어 주세요. 🐾` : '재료는 모두 넣었어요. 이제 손으로 조리해요!'); audio.effect('error'); return; }
    const total = recipeIngredients(selected!).filter(item => item === id).length;
    if (INGREDIENTS[id].price > 0 && game.inventory[id] < total) { setHint(`앗, ${INGREDIENTS[id].name}이(가) 부족해요! 마트에서 데려올까요?`); audio.effect('error'); return; }
    setAdded([...added, id]); setHint(`${INGREDIENTS[id].name} 쏙! ${stage.instruction}`); audio.effect('tap');
  };
  const nextStep = () => { if (!recipe || !stage || progress < 100) return; if (step + 1 < recipe.stages.length) { setStep(step + 1); setAdded([]); setProgress(0); setHome(null); setCookHelp(false); setHint('좋아요! 다음 단계도 해 볼까요?'); } else { setPlating(true); setHint('마지막으로 요리를 꾸며 주세요!'); } };
  const finish = async () => { if (!selected) return; const success = await run({ type: 'COOK', recipeId: selected, topping, shape }); if (success) { reset(); onRestaurant(); } };
  if (game.heldDish) return <div className="kitchen-v2"><div className="v2-section-title"><span>🍳 냥냥 주방</span><h2>요리가 완성됐어요!</h2></div><div className="kitchen-ready"><FoodArt id={game.heldDish.id} dish={game.heldDish} size={190}/><h3>{RECIPES[game.heldDish.id].name}</h3><button className="big-primary" onClick={onRestaurant}>식당에서 대접하기</button></div></div>;
  if (!recipe || !stage) return <div className="kitchen-v2"><div className="v2-section-title"><span>🍳 냥냥 주방</span><h2>오늘은 뭘 만들까?</h2><p>요리를 만들면 바로 경험치를 얻어요. 시간 제한은 없어요!</p></div><div className="recipe-cards">{RECIPE_IDS.map(id => { const item = RECIPES[id]; const locked = item.level > levelFromXp(game.xp); const secret = (item as Recipe).secret; const counts: Partial<Record<IngredientId, number>> = {}; for (const ing of recipeIngredients(id)) counts[ing] = (counts[ing] ?? 0) + 1; const missing = Object.entries(counts).filter(([ing, count]) => game.inventory[ing as IngredientId] < (count ?? 0)); return <button key={id} className={`recipe-card-v2 ${locked ? 'locked' : ''}`} disabled={locked} onClick={() => pickRecipe(id)}><FoodArt id={id} size={84}/><span><strong>{locked ? `Lv.${item.level} 해금` : secret && !game.discovered.includes(id) ? '비밀 요리 ???' : item.name}</strong><small>{locked ? '조금만 더 요리해요' : secret && !game.discovered.includes(id) ? (item as Recipe).hint : `${item.stages.length}단계 · +${item.xp} XP`}</small>{!locked && missing.length > 0 && <em>재료 부족: {missing.map(([ing]) => INGREDIENTS[ing as IngredientId].name).join(', ')}</em>}</span>{game.order.accepted.includes(id) && <b className="order-flag">주문</b>}</button>; })}</div></div>;
  const dishPreview: HeldDish = { id: selected!, topping, shape };
  if (plating) return <div className="kitchen-v2 plating-v2"><button className="back-text" onClick={() => setPlating(false)}><ChevronLeft size={18}/> 조리로 돌아가기</button><div className="v2-section-title"><span>✨ 내 마음대로 완성하기</span><h2>접시를 꾸며 주세요</h2><p>장식과 모양을 고른 뒤 접시 위에 직접 놓아요.</p></div><div className="plating-plate" onClick={event => { const rect = event.currentTarget.getBoundingClientRect(); setPlatePoint({ x: (event.clientX - rect.left) / rect.width * 100, y: (event.clientY - rect.top) / rect.height * 100 }); audio.effect('tap'); }} role="button" tabIndex={0} onKeyDown={event => { if (event.key === 'Enter') setPlatePoint({ x: 50, y: 50 }); }} aria-label="접시에 장식 놓기"><FoodArt id={selected!} dish={dishPreview} size={194}/>{platePoint && <span className="placed-topping" style={{ left: `${platePoint.x}%`, top: `${platePoint.y}%` }}>{topping === 'none' ? <Sparkles size={28}/> : <IngredientVisual id={topping} size={34}/>}</span>}</div><div className="choice-row"><strong>장식 재료</strong>{(['none', 'jam', 'banana', 'strawberry'] as ToppingId[]).map(id => <button key={id} className={topping === id ? 'chosen' : ''} disabled={id !== 'none' && (INGREDIENTS[id].level > levelFromXp(game.xp) || game.inventory[id] < recipeIngredients(selected!).filter(item => item === id).length + 1)} onClick={() => { setTopping(id); setPlatePoint(null); }}>{id === 'none' ? '반짝이' : `${INGREDIENTS[id].icon} ${INGREDIENTS[id].name} · ${game.inventory[id]}개`}</button>)}</div><div className="choice-row"><strong>모양</strong>{(['heart', 'star', 'smile'] as ShapeId[]).map(id => <button key={id} className={shape === id ? 'chosen' : ''} onClick={() => setShape(id)}>{id === 'heart' ? '♥ 하트' : id === 'star' ? '★ 별' : '☺ 웃음'}</button>)}</div><button className="big-primary" disabled={busy || !platePoint} onClick={finish}>이 접시로 완성하기 ✨</button></div>;
  const actionLabels: Record<string, string> = { crack: '달걀을 아래로 톡!', heat: '불 조절 손잡이를 좌우로', spread: '잼을 좌우로 펴 발라요', pour: '그릇을 아래로 기울여요', wash: '물줄기 아래서 좌우로 씻어요', slice: '칼을 위아래로 움직여요', stir: '거품기를 동그랗게 저어요', flip: '뒤집개를 위로 들어요', sprinkle: '소금을 좌우로 톡톡', stack: '재료를 위로 포개요' };
  return <div className="kitchen-v2"><div className="cook-heading"><button onClick={reset} aria-label="요리 취소"><ChevronLeft size={22}/></button><span><small>{recipe.name} · {step + 1}/{recipe.stages.length}단계</small><strong>{stage.instruction}</strong></span><button onClick={() => { setStep(0); setAdded([]); setProgress(0); setCookHelp(false); setHint('처음부터 천천히 해 볼까요?'); }}>처음부터</button></div><div className="cook-board"><div className="step-visual"><div className={`process-art process-${stage.action}`} style={{ '--cook-progress': `${progress}%` } as React.CSSProperties}><span className="process-item"><IngredientVisual id={stage.ingredients[0] ?? "egg"} size={54}/></span><div className="process-result" style={{ opacity: progress / 100 }}>{stage.visual}</div></div></div><div className="stage-required">{neededStage.map((id, index) => <span key={`${id}-${index}`} className={added[index] === id ? 'added' : ''}>{added[index] === id ? '✓ ' : `${index + 1}. `}{INGREDIENTS[id].name}</span>)}{neededStage.length === 0 && <span className="added">재료 준비 완료 ✓</span>}</div><div className="gesture-instruction">{ingredientsReady ? actionLabels[stage.action] : '아래 보관 장소를 열어 재료를 순서대로 넣어요'}</div><CookingInteraction key={`${selected}-${step}`} action={stage.action} progress={progress} setProgress={setProgress} ingredient={stage.ingredients[0]} recipeId={selected!} ready={ingredientsReady} help={cookHelp}/><div className="cook-meter"><span style={{ width: `${progress}%` }}/></div><button className="easy-cook" disabled={!ingredientsReady || progress >= 100} onClick={() => { setCookHelp(value => !value); setHint("반짝이는 목표 안에서 도구를 움직여 봐요. 천천히 해도 괜찮아요!"); }}>{cookHelp ? "손 모양 시범 숨기기" : "손 모양 시범 보기"}</button></div><div className="storage-area"><h3>재료는 어디에 있을까?</h3><div className="storage-doors">{homeIds.map(id => <button key={id} className={`storage-door ${id} ${home === id ? 'opened' : ''}`} onClick={() => setHome(home === id ? null : id)}><span className="door-icon"><StorageArt id={id}/></span><strong>{HOMES[id].name}</strong><small>{HOMES[id].hint}</small></button>)}</div>{home && <div className="storage-inside"><h4>{HOMES[home].name} 안에 있어요</h4><div>{(Object.keys(INGREDIENTS) as IngredientId[]).filter(id => INGREDIENTS[id].home === home && INGREDIENTS[id].level <= levelFromXp(game.xp)).map(id => <button key={id} className={INGREDIENTS[id].price > 0 && game.inventory[id] === 0 ? 'empty' : ''} onClick={() => addIngredient(id)}><span><IngredientVisual id={id} size={42}/></span><strong>{INGREDIENTS[id].name}</strong><small>{INGREDIENTS[id].price === 0 ? '무제한' : `${game.inventory[id]}개${game.inventory[id] === 0 ? ' · 없음' : ''}`}</small></button>)}</div></div>}</div><p className="kitchen-hint" role="status">🐱 {hint}</p>{progress >= 100 && <button className="big-primary" onClick={nextStep}>{step + 1 < recipe.stages.length ? '다음 조리 단계로 →' : '접시 꾸미기로 →'}</button>}<button className="subtle-link" onClick={onMart}>재료가 부족하면 마트로 가기 →</button></div>;
}

function Mart({ game, busy, run }: { game: GameState; busy: boolean; run: (command: Command) => Promise<boolean> }) {
  const [cart, setCart] = useState<Partial<Record<IngredientId, number>>>({});
  const [showCart, setShowCart] = useState(false);
  const [atCounter, setAtCounter] = useState(true);
  const [message, setMessage] = useState('곰 아저씨가 기다려요. 오른쪽 진열대로 가 볼까요?');
  const [lastAdded, setLastAdded] = useState<IngredientId | null>(null);
  const [shopkeeperHappy, setShopkeeperHappy] = useState(true);
  const world = useRef<HTMLDivElement>(null);
  useEffect(() => { if (!lastAdded) return; const timer = window.setTimeout(() => setLastAdded(null), 650); return () => clearTimeout(timer); }, [lastAdded]);
  useEffect(() => { if (!shopkeeperHappy) return; const timer = window.setTimeout(() => setShopkeeperHappy(false), 2200); return () => clearTimeout(timer); }, [shopkeeperHappy]);
  const total = Object.entries(cart).reduce((sum, [id, count]) => sum + INGREDIENTS[id as IngredientId].price * (count ?? 0), 0);
  const count = Object.values(cart).reduce((sum, item) => sum + (item ?? 0), 0);
  const add = (id: IngredientId, amount: number) => {
    if (amount > 0 && total + INGREDIENTS[id].price > game.money) { setMessage(`${INGREDIENTS[id].name}을(를) 담기엔 코인이 부족해요.`); audio.effect('error'); return; }
    setCart(current => { const next = { ...current }; const number = Math.max(0, Math.min(20, (next[id] ?? 0) + amount)); if (number) next[id] = number; else delete next[id]; return next; });
    setLastAdded(amount > 0 ? id : null);
    setMessage(amount > 0 ? `${INGREDIENTS[id].name}이(가) 장바구니에 쏙!` : `${INGREDIENTS[id].name}을(를) 하나 뺐어요.`);
    audio.effect('tap');
  };
  const checkout = async () => {
    if (!atCounter) { world.current?.scrollTo({ left: 0, behavior: 'smooth' }); setMessage('곰 아저씨 계산대로 돌아가서 구매를 확인해요.'); return; }
    const success = await run({ type: 'BUY_CART', items: cart });
    if (success) { setCart({}); setShowCart(false); setShopkeeperHappy(true); setMessage('계산 완료! 재료를 보관 장소에 넣었어요.'); }
  };
  const bays = Array.from({ length: Math.ceil(MART_ITEMS.length / 6) }, (_, index) => MART_ITEMS.slice(index * 6, index * 6 + 6));
  return <div className="mart-v2"><div className="mart-title"><strong>곰 아저씨 마트</strong><span>계산대에서 오른쪽으로 이어지는 진열대예요 →</span></div>
    <div className="mart-world shelf-scroll" ref={world} aria-label="마트 가로 진열대" onScroll={event => setAtCounter(event.currentTarget.scrollLeft < 35)}>
      <section className="mart-checkout-scene" aria-label="곰 아저씨 계산대"><div className="mart-shop-sign">냥냥 마트 <span>매일 신선해요</span></div><img className={shopkeeperHappy ? 'greeting' : ''} src={shopkeeperHappy ? '/game/customer-bear-happy.webp' : '/game/customer-bear.webp'} alt="인사하는 곰 주인아저씨"/><div className="mart-counter-top"><span>{shopkeeperHappy ? '어서 와요! 반가워요!' : '필요한 재료를 골라 보렴.'}</span><div className="register"><Coins size={17}/> 계산대</div></div><div className="mart-counter-front">🐾 곰 아저씨 마트</div><span className="mart-direction">진열대로 가기 →</span></section>
      {bays.map((items, bay) => <section className="mart-bay" key={bay} aria-label={`${bay + 1}번째 진열대`}><div className="mart-bay-head">{['기본 재료', '더 많은 재료', '특별 재료'][bay] ?? '재료 진열대'}<span>{bay + 1}/{bays.length}</span></div><div className="mart-bay-grid">{items.map(id => { const item = INGREDIENTS[id]; const locked = item.level > levelFromXp(game.xp); const poor = !locked && total + item.price > game.money; const reason = locked ? `Lv.${item.level}에 열려요` : poor ? '코인이 부족해요' : null; return <div className={`shelf-product ${reason ? 'locked' : ''} ${lastAdded === id ? 'just-added' : ''}`} key={id}><div className="shelf-item-art"><IngredientVisual id={id} size={64}/>{locked && <span className="product-lock" aria-hidden="true">🔒</span>}</div><strong>{item.name}</strong><small>{reason ?? `보관 ${game.inventory[id]}개`}</small><button data-unavailable={Boolean(reason)} onClick={() => reason ? setMessage(`${item.name}: ${reason}`) : add(id, 1)}>{reason ?? `담기 · ${item.price}코인`}</button></div>; })}</div></section>)}
    </div><p className="mart-message" role="status">{message}</p><div className={`mart-cart-dock ${lastAdded ? 'cart-bump' : ''}`}><button className="cart-summary" onClick={() => setShowCart(!showCart)} aria-expanded={showCart}><ShoppingBasket size={22}/><strong>장바구니 {count}개</strong><span>{total}코인 {showCart ? '▲' : '▼'}</span></button>{showCart && <div className="cart-detail">{count === 0 ? <p>아직 비어 있어요. 진열대에서 재료를 골라요!</p> : <>{Object.entries(cart).map(([id, quantity]) => <div className="cart-row" key={id}><span><IngredientVisual id={id as IngredientId} size={30}/> {INGREDIENTS[id as IngredientId].name}</span><div><button aria-label={`${INGREDIENTS[id as IngredientId].name} 빼기`} onClick={() => add(id as IngredientId, -1)}>−</button><strong>{quantity}</strong><button aria-label={`${INGREDIENTS[id as IngredientId].name} 더하기`} onClick={() => add(id as IngredientId, 1)}>+</button></div></div>)}<div className="cart-total"><span>합계</span><strong>{total}코인</strong></div><button className="big-primary" disabled={busy || total > game.money} onClick={checkout}>{atCounter ? '계산하고 재료 가져가기' : '계산대로 돌아가기'}</button><button className="subtle-link" onClick={() => { setCart({}); setLastAdded(null); }}>장바구니 비우기</button></>}</div>}</div></div>;
}

function MiniGame({ game, busy, run }: { game: GameState; busy: boolean; run: (command: Command) => Promise<boolean> }) {
  const [basketX, setBasketX] = useState(50);
  const [now, setNow] = useState(() => Date.now());
  const [caught, setCaught] = useState<number[]>([]);
  const resolved = useRef<Set<number>>(new Set());
  const caughtRef = useRef<number[]>([]);
  const basketRef = useRef(50);
  const sent = useRef(false);
  const lastCountdown = useRef(0);
  const board = useRef<HTMLDivElement>(null);
  const active = game.minigame;
  const seed = active?.seed;
  const drops = useMemo(() => seed === undefined ? [] : minigameDrops(seed), [seed]);
  const elapsed = active ? now - active.startedAt : 0;
  const remaining = Math.max(0, Math.ceil((12_400 - elapsed) / 1000));
  const endingSoon = Boolean(active && remaining <= 5 && remaining > 0);
  useEffect(() => {
    if (!endingSoon || lastCountdown.current === remaining) return;
    lastCountdown.current = remaining;
    audio.effect('countdown');
  }, [endingSoon, remaining]);
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => {
      const tick = Date.now(), ageTotal = tick - active.startedAt;
      setNow(tick);
      for (const drop of drops) {
        const age = ageTotal - drop.at;
        if (age < 2050 || resolved.current.has(drop.id)) continue;
        resolved.current.add(drop.id);
        if (age < 2400 && Math.abs(basketRef.current - drop.x) < 15) {
          caughtRef.current = [...caughtRef.current, drop.id];
          setCaught(caughtRef.current);
          audio.effect('catch');
        }
      }
      if (ageTotal >= 12_400 && !sent.current) { sent.current = true; void run({ type: 'FINISH_MINIGAME', runId: active.id, score: caughtRef.current.length }); }
    }, 50);
    return () => clearInterval(timer);
  }, [active, drops, run]);
  const changeBasket = (value: number) => { const next = Math.max(8, Math.min(92, value)); basketRef.current = next; setBasketX(next); };
  const move = (clientX: number) => { if (!board.current) return; const rect = board.current.getBoundingClientRect(); changeBasket((clientX - rect.left) / rect.width * 100); };
  return <div className="minigame-v2"><div className="v2-section-title"><span>🧺 재료 받기 놀이</span><h2>떨어지는 재료를 쏙!</h2><p>바구니를 좌우로 움직여 받아요. 천천히 즐겨요!</p></div>{!active ? <div className="minigame-start"><div className="basket-hero"><BasketArt size={108}/></div><p>참가비 <strong>100코인</strong> · 한 판을 끝내면 최소 135코인어치 식재료!</p><div className="reward-tiers"><span>0~3점: 135코인</span><span>4~7점: 185코인</span><span>8~12점: 255코인</span></div><button className="big-primary" disabled={busy || game.money < 100} onClick={() => run({ type: 'START_MINIGAME' })}>{game.money < 100 ? '100코인이 필요해요' : '100코인 내고 시작하기'}</button></div> : <><div className="minigame-stats"><span>점수 <strong>{caught.length}</strong>/12</span><span>남은 시간 <strong>{remaining}</strong>초</span></div>{endingSoon && <div className="minigame-warning" role="status">곧 끝나요! {remaining}초 남았어요</div>}<div className={`catch-board ${endingSoon ? "ending-soon" : ""}`} ref={board} onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); move(event.clientX); }} onPointerMove={event => { if (event.buttons) move(event.clientX); }} aria-label="재료를 받는 놀이판">{drops.map(drop => { const age = elapsed - drop.at; if (age < 0 || age > 2400) return null; return <span className="falling-food" key={drop.id} style={{ left: `${drop.x}%`, top: `${Math.min(85, age / 2050 * 85)}%` }}><IngredientVisual id={drop.ingredient} size={40}/></span>; })}<div className="catch-basket" style={{ left: `${basketX}%` }}><BasketArt size={73}/></div></div><div className="basket-controls"><button onClick={() => changeBasket(basketRef.current - 12)}>← 왼쪽</button><button onClick={() => changeBasket(basketRef.current + 12)}>오른쪽 →</button></div><button className="subtle-link" disabled={busy} onClick={() => run({ type: 'ABANDON_MINIGAME' })}>그만하기 · 참가비는 돌아오지 않아요</button></>}</div>;
}

function Wardrobe({ game, busy, run }: { game: GameState; busy: boolean; run: (command: Command) => Promise<boolean> }) {
  const [slot, setSlot] = useState<CosmeticSlot>('outfit');
  const slots: { id: CosmeticSlot; name: string }[] = [{ id: 'outfit', name: '의상' }, { id: 'hat', name: '모자' }, { id: 'accessory', name: '액세서리' }, { id: 'background', name: '배경' }];
  return <div className="wardrobe-v2"><div className="v2-section-title"><span>🎀 꾸미기 방</span><h2>오늘의 냥냥 셰프</h2><p>코인으로 사고, 가진 것 중 마음대로 바꿔요!</p></div><div className="wardrobe-preview" style={{ backgroundImage: `linear-gradient(#fff4df55,#ffefdd88),url(${game.equipped.background === "evening_background" ? "/game/bg-evening.png" : game.equipped.background === "garden_background" ? "/game/bg-garden.png" : "/game/bg-restaurant.webp"})` }}><ChefFigure game={game}/><span>내가 고른 모습은 식당에도 보여요 ✨</span></div><div className="wardrobe-tabs">{slots.map(item => <button className={slot === item.id ? 'active' : ''} key={item.id} onClick={() => setSlot(item.id)}>{item.name}</button>)}</div><div className="wardrobe-items"><button className="wardrobe-item" onClick={() => run({ type: 'EQUIP', id: null, slot })}><span className="wardrobe-item-art"><CosmeticPreview id={null} slot={slot}/></span><strong>기본 모습</strong><small>{!game.equipped[slot] ? '선택 중' : '바꾸기'}</small></button>{COSMETIC_IDS.filter(id => COSMETICS[id].slot === slot).map(id => { const item = COSMETICS[id]; const owned = game.owned.includes(id); const equipped = game.equipped[slot] === id; return <div className="wardrobe-item" key={id}><span className="wardrobe-item-art"><CosmeticPreview id={id} slot={slot}/></span><strong>{item.name}</strong><small>{equipped ? '장착 중' : owned ? '보유 중' : `${item.price}코인`}</small><button disabled={busy || equipped || (!owned && game.money < item.price)} onClick={() => run(owned ? { type: 'EQUIP', id, slot } : { type: 'BUY_COSMETIC', id })}>{equipped ? '입고 있어요' : owned ? '장착하기' : '구매하기'}</button></div>; })}</div><div className="heart-gift"><Heart size={20}/> 하트 5개로 랜덤 꾸미기도 받을 수 있어요 <button disabled={busy || game.hearts < 5} onClick={() => run({ type: 'DRAW' })}>선물 열기</button></div></div>;
}

function EatingScene({ outcome, onDone }: { outcome: Outcome; onDone: () => void }) {
  if (!outcome.dish || !outcome.eater) return null;
  const family = familyIds.includes(outcome.eater as FamilyId);
  const before = family ? familyImage(outcome.eater as FamilyId) : customerImage(outcome.eater as keyof typeof CUSTOMERS);
  const after = family ? familyImage(outcome.eater as FamilyId, true) : customerImage(outcome.eater as keyof typeof CUSTOMERS, true);
  return <div className="eating-overlay" onClick={onDone} role="presentation"><div className="eating-card"><span className="eating-caption">맛있게 드세요!</span><div className={`eating-stage eater-${outcome.eater}`}><div className="eating-dish"><FoodArt id={outcome.dish.id} dish={outcome.dish} size={112}/></div><img className="eater-before" src={before} alt="음식을 받는 캐릭터"/><img className="eater-after" src={after} alt="맛있게 먹고 웃는 캐릭터"/><div className="bite-spark">♥</div></div><strong>{outcome.message}</strong>{outcome.story && <div className="story-unlock"><span>새 이야기 완성!</span><b>{STORIES[outcome.story - 1].title}</b><small>{STORIES[outcome.story - 1].ending}</small><em>{STORIES[outcome.story - 1].sticker} 스티커 획득</em></div>}<small>음식을 받고 · 한 입 먹고 · 활짝 웃어요!</small></div></div>;
}

function Overlay({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="v2-scrim" onPointerDown={event => { if (event.target === event.currentTarget) onClose(); }}><section className="v2-modal" role="dialog" aria-modal="true" aria-label={title}><header><h2>{title}</h2><button aria-label="닫기" onClick={onClose}><X size={21}/></button></header><div className="v2-modal-body">{children}</div></section></div>;
}

function Settings({ game, profile, onClose, onSelect, onImport, onReset, busy, legacyExists, audioSettings, onAudio }: { game: GameState; profile: Profile; onClose: () => void; onSelect: (p: Profile) => void; onImport: () => void; onReset: () => void; busy: boolean; legacyExists: boolean; audioSettings: AudioSettings; onAudio: (next: AudioSettings) => void }) {
  const [name, setName] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const create = async () => { if (!name.trim()) return; setCreating(true); try { const result = await createProfile(name); onSelect(result.profile); } catch (cause) { setError(cause instanceof Error ? cause.message : '새 프로필을 만들지 못했어요.'); } finally { setCreating(false); } };
  return <Overlay title="설정" onClose={onClose}><div className="settings-v2"><h3><Home size={18}/> 셰프 프로필</h3><p>각 셰프의 기록은 따로 저장돼요. 지금은 <strong>{profile.name}</strong> 셰프예요.</p><div className="profile-switch">{savedProfiles().map(item => <button key={item.id} disabled={item.id === profile.id} onClick={() => onSelect(item)}>{item.name} {item.id === profile.id ? '✓' : '전환'}</button>)}</div><div className="profile-create"><input aria-label="새 셰프 이름" maxLength={20} placeholder="새 셰프 이름" value={name} onChange={event => setName(event.target.value)}/><button disabled={creating || !name.trim()} onClick={create}>추가</button></div>{error && <p role="alert">{error}</p>}
    <h3><Music2 size={18}/> 음악과 효과음</h3><label className="setting-toggle">식당·마트 배경음악 <input type="checkbox" checked={audioSettings.music} onChange={event => onAudio({ ...audioSettings, music: event.target.checked })}/></label><label className="setting-range">음악 크기 <input aria-label="음악 크기" type="range" min="0" max="100" value={audioSettings.musicVolume} onChange={event => onAudio({ ...audioSettings, musicVolume: Number(event.target.value) })}/></label><label className="setting-toggle">동작 효과음 <input type="checkbox" checked={audioSettings.effects} onChange={event => onAudio({ ...audioSettings, effects: event.target.checked })}/></label><label className="setting-range">효과음 크기 <input aria-label="효과음 크기" type="range" min="0" max="100" value={audioSettings.effectsVolume} onChange={event => onAudio({ ...audioSettings, effectsVolume: Number(event.target.value) })}/></label>
    {legacyExists && <><h3>📦 이전 기록</h3><p>기존 브라우저 저장 기록은 가져온 뒤에도 백업으로 남아요.</p><button className="soft-button" disabled={busy || game.xp > 0 || game.money !== 350} onClick={onImport}>이전 기록 가져오기</button></>}
    <h3><Settings2 size={18}/> 현재 셰프 기록 초기화</h3><p>이 프로필의 레벨·코인·요리·재료·꾸미기만 처음으로 되돌려요.</p>{confirm ? <div className="reset-actions"><button onClick={() => setConfirm(false)}>취소</button><button className="danger" disabled={busy} onClick={onReset}>정말 초기화하기</button></div> : <button className="danger-outline" onClick={() => setConfirm(true)}>초기화 선택</button>}<p className="small-note"><Volume2 size={14}/> 음악은 첫 터치 뒤에 시작돼요. 데이터는 이 컴퓨터의 로컬 DB에 저장돼요.</p></div></Overlay>;
}
