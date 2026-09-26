import { useEffect, useReducer, useRef, useState } from 'react';
import { BookOpen, ChefHat, Check, ChevronLeft, Coins, Gift, Heart, ScrollText, Settings2, ShoppingBasket, Sparkles, X } from 'lucide-react';
import { DishArt, HatArt, IngredientArt, ToolArt } from './components/GameArt';
import { ACTION_NAMES, BASE_RECIPES, CUSTOMER_NAMES, INGREDIENTS, MART_ITEMS, MAX_LEVEL, RECIPES, SEASONINGS, TOOL_NAMES, levelFromXp, levelProgress } from './game/data';
import type { IngredientId, RecipeId } from './game/data';
import { HATS, gameReducer, loadGame, localDateKey, questProgress, saveGame } from './game/engine';
import type { GameAction, GameState, HatId, QuestId } from './game/engine';
import { playSound } from './utils/audio';
import './App.css';

type View = 'restaurant' | 'kitchen' | 'mart';
type Modal = 'recipes' | 'quests' | 'gifts' | 'settings' | 'finale' | null;
const CUSTOMER_IMAGE = (id: string, happy = false) => `/game/customer-${id}${happy ? '-happy' : ''}.webp`;

function readIntroSeen(): boolean {
  try { return window.localStorage.getItem('nyanyang-intro-v2') === '1'; } catch { return false; }
}

function App() {
  const [game, dispatch] = useReducer(gameReducer, undefined, () => loadGame(window.localStorage));
  const [view, setView] = useState<View>('restaurant');
  const [modal, setModal] = useState<Modal>(null);
  const [introOpen, setIntroOpen] = useState(() => !readIntroSeen());
  const playfieldRef = useRef<HTMLElement>(null);
  const level = levelFromXp(game.xp);
  const progress = levelProgress(game.xp);

  useEffect(() => saveGame(window.localStorage, game), [game]);
  useEffect(() => {
    if (!game.event) return;
    playSound(game.event.kind === 'error' ? 'fail' : ['served', 'special', 'finale'].includes(game.event.kind) ? 'coin' : 'success');
    const timer = window.setTimeout(() => dispatch({ type: 'CLEAR_EVENT' }), game.event.completedOrder ? 1900 : 3200);
    return () => window.clearTimeout(timer);
  }, [game.event]);
  useEffect(() => {
    const timer = window.setInterval(() => dispatch({ type: 'NEW_DAY', date: localDateKey() }), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => { playfieldRef.current?.scrollTo(0, 0); }, [view]);

  const startGame = () => {
    try { window.localStorage.setItem('nyanyang-intro-v2', '1'); } catch { /* Private mode is fine. */ }
    setIntroOpen(false);
    playSound('click');
  };

  const serve = () => {
    const firstFinale = game.heldDish === 'butter_toast' && game.order.recipeId === 'butter_toast' && !game.finaleDone;
    dispatch({ type: 'SERVE', date: localDateKey(), recipeRoll: Math.random(), customerRoll: Math.random() });
    if (firstFinale) setModal('finale');
  };

  const resetGame = () => {
    dispatch({ type: 'RESET', date: localDateKey() });
    setView('restaurant');
    setModal(null);
  };

  return <div className="game-shell">
    <header className="hud">
      <div className="hud-top">
        <div className="brand"><span className="brand-mark"><ChefHat size={23}/></span><span><strong>냥냥식당</strong><small>오늘도 맛있는 하루</small></span></div>
        <div className="hud-buttons">
          <button className="icon-button" aria-label="오늘의 퀘스트" onClick={() => setModal('quests')}><ScrollText size={22}/></button>
          <button className="icon-button" aria-label="꾸미기 상점" onClick={() => setModal('gifts')}><Gift size={22}/></button>
          <button className="icon-button" aria-label="설정" onClick={() => setModal('settings')}><Settings2 size={22}/></button>
        </div>
      </div>
      <div className="hud-progress">
        <div className="level-pill" aria-label={game.finaleDone ? '레벨 5 첫 시즌 완료' : `레벨 ${level}`}>LV {level}{game.finaleDone ? ' ★' : ''}</div>
        <div className="progress-track" role="progressbar" aria-label="레벨 경험치" aria-valuenow={progress.current} aria-valuemin={0} aria-valuemax={progress.needed || 1}>
          <div className="progress-fill" style={{ width: `${progress.percent}%` }}/>
        </div>
        <span className="xp-count">{level === MAX_LEVEL ? 'MAX' : `${progress.current}/${progress.needed}`}</span>
      </div>
      <div className="currency-row"><span className="currency"><Coins size={18}/> {game.money.toLocaleString()}</span><span className="currency hearts"><Heart size={18} fill="currentColor"/> {game.hearts}</span></div>
    </header>

    <main ref={playfieldRef} className={`playfield playfield-${view}`}>
      {view === 'restaurant' && <RestaurantScreen game={game} onCook={() => setView('kitchen')} onServe={serve}/>}
      {view === 'kitchen' && <KitchenScreen game={game} dispatch={dispatch} onRestaurant={() => setView('restaurant')} onMart={() => setView('mart')}/>}
      {view === 'mart' && <MartScreen game={game} dispatch={dispatch}/>}
    </main>

    <nav className="bottom-nav" aria-label="게임 장소">
      <button className={view === 'restaurant' ? 'active' : ''} onClick={() => setView('restaurant')}><ChefHat size={23}/><span>식당</span></button>
      <button className={view === 'kitchen' ? 'active' : ''} onClick={() => setView('kitchen')}><span className="nav-pan">◒</span><span>주방</span></button>
      <button className={view === 'mart' ? 'active' : ''} onClick={() => setView('mart')}><ShoppingBasket size={23}/><span>마트</span></button>
      <button className="book-nav" onClick={() => setModal('recipes')}><BookOpen size={23}/><span>도감</span></button>
    </nav>

    {game.event && <div className={`game-toast ${game.event.kind}`} role="status" key={game.event.id}>{game.event.message}</div>}
    {modal === 'recipes' && <RecipeModal game={game} onClose={() => setModal(null)}/>}
    {modal === 'quests' && <QuestModal game={game} dispatch={dispatch} onClose={() => setModal(null)}/>}
    {modal === 'gifts' && <GiftModal game={game} dispatch={dispatch} onClose={() => setModal(null)}/>}
    {modal === 'settings' && <SettingsModal onClose={() => setModal(null)} onReset={resetGame}/>}
    {modal === 'finale' && <ModalFrame title="첫 시즌 완성!" onClose={() => setModal(null)}><div className="finale-content"><img src="/game/chef-cat-happy.webp" alt="기뻐하는 냥냥 셰프"/><strong>다섯 번째 요리까지 완성했어요!</strong><p>손님들과 함께한 냥냥식당의 첫 이야기가 완성됐어요. 앞으로도 새로운 주문을 받으며 자유롭게 요리할 수 있어요.</p><button className="primary-button" onClick={() => setModal(null)}>계속 요리하기 <Sparkles size={18}/></button></div></ModalFrame>}
    {introOpen && <div className="intro-screen"><div className="intro-glow"/><img className="intro-chef" src="/game/chef-cat.webp" alt="웃고 있는 고양이 셰프"/><div className="intro-card"><span className="eyebrow">작고 따뜻한 요리 이야기</span><h1>냥냥식당에<br/>어서 와!</h1><p>손님이 기다리고 있어요.<br/>함께 첫 요리를 만들어 볼까요?</p><button className="primary-button" onClick={startGame}>식당 문 열기 <Sparkles size={18}/></button></div></div>}
  </div>;
}

function RestaurantScreen({ game, onCook, onServe }: { game: GameState; onCook: () => void; onServe: () => void }) {
  const visibleOrder = game.event?.completedOrder ?? game.order;
  const order = RECIPES[visibleOrder.recipeId];
  const held = game.heldDish ? RECIPES[game.heldDish] : null;
  const expression = game.event?.completedOrder ? 'happy' : game.event?.kind === 'family' ? 'thinking' : 'waiting';
  return <div className="restaurant-screen">
    <div className={`scene restaurant-scene ${visibleOrder.special ? 'special-guest-scene' : ''}`}>
      <div className="scene-topline"><span className="scene-label"><Sparkles size={15}/> {visibleOrder.special ? '스페셜 손님' : '오늘의 손님'}</span>{game.combo >= 2 && <span className="combo-pill">연속 {game.combo}번 성공!</span>}</div>
      <div className="order-bubble"><span className="order-eyebrow">{CUSTOMER_NAMES[visibleOrder.customerId]}의 {visibleOrder.special ? '스페셜 주문' : '주문'}</span><div className="order-title"><DishArt id={order.id} size={76}/><span><strong>{order.name}</strong><small>{visibleOrder.special ? '별님이 가장 새로 배운 요리를 맛보고 싶대요!' : order.description}</small></span></div>{visibleOrder.special && <span className="special-reward"><Sparkles size={13}/> 코인·XP 2배 · 하트 +2</span>}</div>
      <div className={`character-stage expression-${expression}`}>
        <div className="stage-character chef-character"><img src={expression === 'happy' ? '/game/chef-cat-happy.webp' : '/game/chef-cat.webp'} alt="냥냥 셰프"/>{game.equippedHat && <span className="hat-badge" aria-label={`${HATS[game.equippedHat].name} 장착`}><HatArt id={game.equippedHat} size={38}/></span>}<span className="name-tag">냥냥 셰프</span></div>
        <div className="stage-character customer-character"><img src={CUSTOMER_IMAGE(visibleOrder.customerId, expression === 'happy')} alt={`${CUSTOMER_NAMES[visibleOrder.customerId]} 손님`}/><span className="expression-mark" aria-hidden="true">{expression === 'happy' ? '♥' : expression === 'thinking' ? '?' : visibleOrder.special ? '★' : '♪'}</span><span className="name-tag">{CUSTOMER_NAMES[visibleOrder.customerId]}</span></div>
      </div>
    </div>
    <div className="restaurant-bottom">
      {held ? <><div className="held-dish"><DishArt id={held.id} size={64}/><span><small>완성한 요리</small><strong>{held.name}</strong></span></div><button className="primary-button" onClick={onServe}>손님에게 서빙하기 <Check size={20}/></button></>
        : <><p className="bottom-copy">{game.event?.completedOrder ? '손님이 맛있게 먹고 있어요!' : '시간 제한은 없어요. 천천히 요리해요!'}</p><button className="primary-button" disabled={Boolean(game.event?.completedOrder)} onClick={onCook}>주방에서 요리하기 <ChefHat size={20}/></button></>}
    </div>
  </div>;
}

function KitchenScreen({ game, dispatch, onRestaurant, onMart }: { game: GameState; dispatch: React.Dispatch<GameAction>; onRestaurant: () => void; onMart: () => void }) {
  const [selected, setSelected] = useState<RecipeId | null>(null);
  const [step, setStep] = useState(0);
  const [added, setAdded] = useState<IngredientId[]>([]);
  const [actionProgress, setActionProgress] = useState(0);
  const [hint, setHint] = useState('');
  const pointer = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const level = levelFromXp(game.xp);
  const recipe = selected ? RECIPES[selected] : null;
  const stage = recipe?.stages[step];
  const required = stage?.ingredients ?? [];
  const requiredDone = required.every((id, index) => added[index] === id);
  const secretReady = selected === 'fried_egg' && step === 0 && added.includes('salt');

  useEffect(() => { document.querySelector('.playfield')?.scrollTo(0, 0); }, [selected, step]);

  function resetSession() { setStep(0); setAdded([]); setActionProgress(0); setHint(''); }
  function chooseRecipe(id: RecipeId) { setSelected(id); resetSession(); }
  function addIngredient(id: IngredientId) {
    if (!stage || actionProgress > 0) return;
    if (requiredDone && selected === 'fried_egg' && id === 'salt' && !added.includes('salt')) {
      setAdded([...added, id]); setHint('비밀 재료를 찾았어요! 짭짤한 프라이가 될 거예요.'); playSound('click'); return;
    }
    const expected = required[added.length];
    if (!expected || id !== expected) { setHint(expected ? `다음에는 ${INGREDIENTS[expected].name} 먼저 넣어 주세요.` : '재료가 다 들어갔어요. 이제 조리해요!'); playSound('fail'); return; }
    if (INGREDIENTS[id].price > 0 && game.inventory[id] < 1) { setHint(`${INGREDIENTS[id].name} 재료가 없어요. 마트에서 사 오세요.`); playSound('fail'); return; }
    setAdded([...added, id]); setHint(`${INGREDIENTS[id].name} 투입 완료!`); playSound('click');
  }
  function advance(amount: number) { if (requiredDone) setActionProgress(value => Math.min(100, value + amount)); }
  function finishStage() {
    if (!recipe || actionProgress < 100) return;
    if (step < recipe.stages.length - 1) { setStep(step + 1); setAdded([]); setActionProgress(0); setHint('좋아요! 다음 조리 단계로 가요.'); playSound('success'); return; }
    const needs = new Map<IngredientId, number>();
    for (const part of recipe.stages) for (const id of part.ingredients) if (INGREDIENTS[id].price > 0) needs.set(id, (needs.get(id) ?? 0) + 1);
    if ([...needs].some(([id, count]) => game.inventory[id] < count)) { setHint('완성에 필요한 재료가 부족해요. 마트에서 채우고 다시 요리해요.'); playSound('fail'); return; }
    dispatch({ type: 'COOK', recipeId: secretReady ? 'salted_egg' : recipe.id, date: localDateKey() });
    setSelected(null); resetSession(); onRestaurant();
  }
  function onPointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    if (!requiredDone) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointer.current = { x: event.clientX, y: event.clientY, moved: false };
  }
  function onPointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    if (!pointer.current || !stage || !requiredDone) return;
    const dx = event.clientX - pointer.current.x;
    const dy = event.clientY - pointer.current.y;
    const distance = Math.hypot(dx, dy);
    if (stage.action === 'flip' ? Math.abs(dy) > 28 : distance > 12) {
      advance(stage.action === 'flip' ? 50 : Math.min(22, Math.round(distance / 3)));
      pointer.current = { x: event.clientX, y: event.clientY, moved: true };
    }
  }

  if (game.heldDish) return <div className="kitchen-screen"><div className="simple-header"><span className="eyebrow">주방</span><h2>요리 완성!</h2></div><div className="finished-card"><DishArt id={game.heldDish} size={170}/><h3>{RECIPES[game.heldDish].name}</h3><p>따뜻할 때 손님에게 가져가요.</p><button className="primary-button" onClick={onRestaurant}>식당으로 돌아가기</button></div></div>;

  if (!recipe || !stage) return <div className="kitchen-screen recipe-choice">
    <div className="simple-header"><span className="eyebrow">오늘은 무엇을 만들까요?</span><h2>냥냥 주방</h2><p>주문 요리에는 작은 별을 붙여 두었어요.</p></div>
    <div className="recipe-grid">{BASE_RECIPES.map(id => { const item = RECIPES[id]; const unlocked = item.level <= level; return <button key={id} className={`recipe-tile ${unlocked ? '' : 'locked'}`} disabled={!unlocked} onClick={() => chooseRecipe(id)}>
      {id === game.order.recipeId && <span className="ordered-tag">주문 요리</span>}<DishArt id={id} size={93}/><strong>{unlocked ? item.name : `LV ${item.level} 해금`}</strong><small>{unlocked ? item.description : '조금만 더 요리해요'}</small>
    </button>; })}</div>
    <p className="kitchen-tip"><Sparkles size={16}/> 달걀 프라이에 소금을 더하면 비밀 요리가 돼요.</p>
  </div>;

  const tray = [...new Set([...required, ...(selected === 'fried_egg' ? ['salt' as IngredientId] : []), ...SEASONINGS.filter(id => !required.includes(id))])];
  return <div className="kitchen-screen cooking-screen">
    <div className="cook-header"><button className="back-button" onClick={() => { setSelected(null); resetSession(); }} aria-label="요리 선택으로 돌아가기"><ChevronLeft size={23}/></button><span><small>{recipe.name} · {step + 1}/{recipe.stages.length} 단계</small><strong>{TOOL_NAMES[stage.tool]}에서 요리해요</strong></span><button className="text-button" onClick={resetSession}>처음부터</button></div>
    <div className="cook-stage"><div className="cook-stage-top"><span className="stage-chip">STEP {step + 1}</span><p>{stage.instruction}</p></div>
      <div className="tool-wrap"><ToolArt tool={stage.tool} action={stage.action} progress={actionProgress} size={208}/><div className="ingredient-floats">{added.map((id, index) => <span key={`${id}-${index}`} style={{ left: `${18 + index * 28}%` }}><IngredientArt id={id} size={42}/></span>)}</div></div>
      <div className="ingredient-steps">{required.map((id, index) => <div key={`${id}-${index}`} className={added[index] === id ? 'done' : ''}>{added[index] === id ? <Check size={15}/> : index + 1}<span>{INGREDIENTS[id].name}</span></div>)}</div>
      <div className="action-panel"><div className="action-label"><strong>{ACTION_NAMES[stage.action]}</strong><span>{requiredDone ? '드래그하거나 버튼을 탭해요' : '재료를 순서대로 넣어 주세요'}</span></div>
        <button className={`action-pad action-${stage.action}`} disabled={!requiredDone || actionProgress >= 100} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={() => { pointer.current = null; }} onClick={() => advance(stage.action === 'flip' ? 50 : 25)} aria-label={`${ACTION_NAMES[stage.action]} 동작`}><span>{stage.action === 'mix' ? '↻' : stage.action === 'flip' ? '↥' : '◉'}</span>{actionProgress >= 100 ? '완료!' : '여기를 문지르거나 탭'}</button>
        <div className="action-meter" role="progressbar" aria-label="조리 진행도" aria-valuenow={actionProgress} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${actionProgress}%` }}/></div>
      </div>
    </div>
    <div className="ingredient-panel"><div className="panel-heading"><strong>재료 선반</strong><small>순서대로 터치해요</small></div><div className="ingredient-tray">{tray.map(id => <button key={id} className="ingredient-button" onClick={() => addIngredient(id)}><IngredientArt id={id} size={49}/><span>{INGREDIENTS[id].name}</span><small>{INGREDIENTS[id].price === 0 ? '무제한' : `보유 ${game.inventory[id]}`}</small></button>)}</div>{hint && <p className="cook-hint" role="status">{hint}</p>}</div>
    {actionProgress >= 100 && <button className="primary-button next-step" onClick={finishStage}>{step < recipe.stages.length - 1 ? '다음 단계로' : '요리 완성하기'} <Sparkles size={19}/></button>}
    {required.some(id => INGREDIENTS[id].price > 0 && game.inventory[id] < 1) && <button className="mart-link" onClick={onMart}>재료가 부족한가요? 마트로 가기</button>}
  </div>;
}

function MartScreen({ game, dispatch }: { game: GameState; dispatch: React.Dispatch<GameAction> }) {
  const level = levelFromXp(game.xp);
  return <div className="mart-screen"><div className="mart-hero scene"><div className="mart-title"><span className="eyebrow">필요한 만큼만 사요</span><h2>곰 아저씨 마트</h2><p>“신선한 재료가 가득하단다!”</p></div><img src="/game/customer-bear.webp" alt="곰 아저씨"/></div>
    <div className="mart-list"><h3>오늘의 재료 <small>양념은 주방에서 무료예요</small></h3>{MART_ITEMS.map(id => { const item = INGREDIENTS[id]; const unlocked = level >= item.level; return <div className={`mart-item ${unlocked ? '' : 'locked'}`} key={id}><div className="mart-item-art"><IngredientArt id={id} size={64}/></div><div className="mart-item-info"><strong>{item.name}</strong><small>{unlocked ? `보유 ${game.inventory[id]}개` : `LV ${item.level}에 열려요`}</small></div><button disabled={!unlocked || game.money < item.price} onClick={() => dispatch({ type: 'BUY', ingredient: id })} aria-label={`${item.name} ${item.price} 코인에 구매`}>{unlocked ? <><Coins size={14}/>{item.price}</> : '잠김'}</button></div>; })}</div>
  </div>;
}

function ModalFrame({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="modal-scrim" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}><section className="modal-card" role="dialog" aria-modal="true" aria-label={title}><div className="modal-header"><h2>{title}</h2><button className="icon-button" aria-label="닫기" onClick={onClose}><X size={21}/></button></div>{children}</section></div>;
}

function RecipeModal({ game, onClose }: { game: GameState; onClose: () => void }) {
  const level = levelFromXp(game.xp);
  return <ModalFrame title="냥냥 요리 도감" onClose={onClose}><p className="modal-lead">새 요리를 만들고 비밀 레시피를 발견해요.</p><div className="collection-list">{[...BASE_RECIPES, 'salted_egg' as RecipeId].map(id => {
    const recipe = RECIPES[id];
    const made = game.discovered.includes(id);
    const visible = recipe.secret ? made : level >= recipe.level;
    const ingredients = recipe.stages.map(stage => stage.ingredients.map(ingredient => INGREDIENTS[ingredient].name).join(' + ')).join(' → ');
    return <div className={`collection-item ${visible ? '' : 'hidden'}`} key={id}><DishArt id={id} size={70}/><span><strong>{visible ? recipe.name : recipe.secret ? '비밀 요리 ???' : `LV ${recipe.level} 해금`}</strong><small>{visible ? `${ingredients}${made ? ' · 완성' : ' · 아직 요리 전'}` : recipe.secret ? '달걀에 무언가 더해볼까요?' : '레벨을 올리면 배울 수 있어요'}</small></span>{made && <Check size={18}/>}</div>;
  })}</div></ModalFrame>;
}

function QuestModal({ game, dispatch, onClose }: { game: GameState; dispatch: React.Dispatch<GameAction>; onClose: () => void }) {
  const quests: { id: QuestId; name: string }[] = [{ id: 'cook_2', name: '오늘 요리 2번 완성하기' }, { id: 'serve_2', name: '손님 2명 만족시키기' }];
  return <ModalFrame title="오늘의 퀘스트" onClose={onClose}><p className="modal-lead">매일 새로운 하루가 시작돼요. 보상은 한 번씩 받을 수 있어요.</p><div className="quest-list">{quests.map(quest => { const progress = questProgress(game, quest.id); const claimed = game.daily.claimed.includes(quest.id); return <div className="quest-card" key={quest.id}><div className="quest-heading"><strong>{quest.name}</strong><span>{progress.value}/{progress.target}</span></div><div className="quest-track"><span style={{ width: `${progress.value / progress.target * 100}%` }}/></div><button disabled={claimed || progress.value < progress.target} onClick={() => dispatch({ type: 'CLAIM', questId: quest.id, date: localDateKey() })}>{claimed ? '오늘 받았어요' : `보상 받기 · ${progress.reward}`}</button></div>; })}</div></ModalFrame>;
}

function GiftModal({ game, dispatch, onClose }: { game: GameState; dispatch: React.Dispatch<GameAction>; onClose: () => void }) {
  const hats = Object.keys(HATS) as HatId[];
  return <ModalFrame title="하트 선물 상자" onClose={onClose}><p className="modal-lead">요리로 모은 하트로 꾸미기를 얻어요. 이미 가진 선물은 다시 나오지 않아요.</p><div className="gift-hero"><Gift size={56}/><strong>남은 선물 {hats.length - game.ownedHats.length}개</strong><span>하트 {game.hearts}개 보유</span><button className="primary-button" disabled={game.hearts < 5 || game.ownedHats.length === hats.length} onClick={() => dispatch({ type: 'DRAW', roll: Math.random() })}>하트 5개로 선물 열기</button></div><div className="hat-list"><h3>내 꾸미기</h3>{hats.map(id => <button key={id} className={game.ownedHats.includes(id) ? 'owned' : ''} disabled={!game.ownedHats.includes(id)} onClick={() => dispatch({ type: 'EQUIP', hatId: id })}><span className="hat-swatch"><HatArt id={id} size={34}/></span><strong>{game.ownedHats.includes(id) ? HATS[id].name : '아직 없는 선물'}</strong><small>{game.equippedHat === id ? '장착 중' : game.ownedHats.includes(id) ? '장착하기' : '미획득'}</small></button>)}</div></ModalFrame>;
}

function SettingsModal({ onClose, onReset }: { onClose: () => void; onReset: () => void }) {
  const [confirming, setConfirming] = useState(false);
  return <ModalFrame title="설정" onClose={onClose}>
    <p className="modal-lead">이 기기에서 이어 하던 냥냥식당 기록을 관리해요.</p>
    <div className="settings-card"><strong>플레이 기록 초기화</strong><p>레벨, 코인, 재료, 주문, 퀘스트, 꾸미기 기록을 처음 상태로 되돌려요.</p>
      {confirming ? <div className="reset-confirm"><p role="alert">정말 초기화할까요? 이 기기의 현재 기록은 되돌릴 수 없어요.</p><div className="reset-actions"><button onClick={() => setConfirming(false)}>취소</button><button className="reset-danger" onClick={onReset}>초기화하기</button></div></div>
        : <button className="reset-start" onClick={() => setConfirming(true)}>플레이 기록 초기화</button>}
    </div>
  </ModalFrame>;
}

export default App;
