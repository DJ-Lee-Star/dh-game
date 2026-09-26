import { useState, useEffect } from 'react';
import './App.css';
import RestaurantView from './views/RestaurantView';
import KitchenView from './views/KitchenView';
import MartView from './views/MartView';
import RecipeBookPopup from './components/RecipeBookPopup';
import QuestsPopup from './components/QuestsPopup';
import GachaPopup from './components/GachaPopup';
import type { GameState, ViewType } from './types';

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('RESTAURANT');
  const [isRecipeOpen, setIsRecipeOpen] = useState(false);
  const [isIntroOpen, setIsIntroOpen] = useState(true);

  const [xp, setXp] = useState(0);
  const [money, setMoney] = useState(1000);
  const [hearts, setHearts] = useState(0);
  const [combo, setCombo] = useState(0);
  const [isFeverTime, setIsFeverTime] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<string | null>('fried_egg');
  const [currentCustomer, setCurrentCustomer] = useState<string | null>('🐶');
  const [cookedDish, setCookedDish] = useState<string | null>(null);
  const [equippedHat, setEquippedHat] = useState<string | null>(null);
  const [equippedBg, setEquippedBg] = useState<string | null>(null);
  const [showQuests, setShowQuests] = useState(false);
  const [showGacha, setShowGacha] = useState(false);
  
  const [inventory, setInventory] = useState<Record<string, number>>({
    egg: 5,
    milk: 2,
    flour: 2,
  });

  const [unlockedRecipes, setUnlockedRecipes] = useState<string[]>(['fried_egg']);

  // 레벨 계산: 로그 곡선 스케일링 적용
  const getLevelFromXp = (xp: number) => {
    if (xp >= 600000) return 20;
    if (xp >= 450000) return 19;
    if (xp >= 350000) return 18;
    if (xp >= 270000) return 17;
    if (xp >= 210000) return 16;
    if (xp >= 160000) return 15;
    if (xp >= 120000) return 14;
    if (xp >= 90000) return 13;
    if (xp >= 68000) return 12;
    if (xp >= 50000) return 11;
    if (xp >= 36000) return 10;
    if (xp >= 26000) return 9;
    if (xp >= 18000) return 8;
    if (xp >= 12000) return 7;
    if (xp >= 7500) return 6;
    if (xp >= 4500) return 5;
    if (xp >= 2500) return 4;
    if (xp >= 1200) return 3;
    if (xp >= 500) return 2;
    return 1;
  };

  const getNextLevelXp = (lvl: number) => {
    const table = [0, 500, 1200, 2500, 4500, 7500, 12000, 18000, 26000, 36000, 50000, 68000, 90000, 120000, 160000, 210000, 270000, 350000, 450000, 600000, 600000];
    return table[lvl] || 600000;
  };

  const level = getLevelFromXp(xp);
  const xpRequired = getNextLevelXp(level);
  const currentLevelBaseXp = getNextLevelXp(level - 1);
  const xpProgress = ((xp - currentLevelBaseXp) / (xpRequired - currentLevelBaseXp)) * 100 || 0;

  // 레벨업 시 새로운 레시피 자동 해금
  useEffect(() => {
    if (level >= 2 && !unlockedRecipes.includes('pancake')) {
      setUnlockedRecipes(prev => [...prev, 'pancake']);
    }
  }, [level, unlockedRecipes]);

  const gameState: GameState = {
    level, xp, money, hearts, combo, isFeverTime, currentOrder, currentCustomer, cookedDish, inventory, unlockedRecipes, equippedHat, equippedBg,
    setXp, setMoney, setHearts, setCombo, setIsFeverTime, setCurrentOrder, setCurrentCustomer, setCookedDish, setInventory, setUnlockedRecipes, setEquippedHat, setEquippedBg,
    navigate: setCurrentView
  };

  const renderView = () => {
    switch (currentView) {
      case 'RESTAURANT': return <RestaurantView gameState={gameState} />;
      case 'KITCHEN': return <KitchenView gameState={gameState} />;
      case 'MART': return <MartView gameState={gameState} />;
      default: return <RestaurantView gameState={gameState} />;
    }
  };

  return (
    <div className="game-container">
      {/* 타이틀 인트로 화면 */}
      {isIntroOpen && (
        <div className="intro-overlay">
          <div className="intro-content">
            <h1 className="intro-title">냥냥식당</h1>
            <p className="intro-subtitle">🐾 귀여운 고양이 셰프가 되어보세요!</p>
            <button className="btn-start" onClick={() => setIsIntroOpen(false)}>게임 시작하기</button>
          </div>
        </div>
      )}

      {showQuests && <QuestsPopup gameState={gameState} onClose={() => setShowQuests(false)} />}
      {showGacha && <GachaPopup gameState={gameState} onClose={() => setShowGacha(false)} />}

      <header className="game-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.2))' }} onClick={() => setShowQuests(true)}>📜</button>
          <h1 className="game-title">냥냥식당 🐾</h1>
          <button style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.2))' }} onClick={() => setShowGacha(true)}>🎁</button>
        </div>
        <div className="xp-bar-container">
          <div className="xp-bar" style={{ width: `${xpProgress}%` }}></div>
          <span className="xp-text">LV.{level} ({xp - currentLevelBaseXp}/{xpRequired - currentLevelBaseXp})</span>
        </div>
        <div className="status-bar">
          <div className="status-item money-badge">
            <span className="icon">💰</span>
            <span className="value">{money}</span>
          </div>
          <div className="status-item heart-badge" onClick={() => setShowGacha(true)} style={{ cursor: 'pointer' }}>
            <span className="icon">❤️</span>
            <span className="value">{hearts}</span>
          </div>
        </div>
      </header>

      <main className="game-main">
        {renderView()}
      </main>

      <button className="floating-recipe-btn" onClick={() => setIsRecipeOpen(true)}>
        <span className="icon">📖</span>
        <span className="text">레시피</span>
      </button>

      {isRecipeOpen && <RecipeBookPopup gameState={gameState} onClose={() => setIsRecipeOpen(false)} />}

      <nav className="game-nav">
        <button 
          className={`nav-btn ${currentView === 'RESTAURANT' ? 'active' : ''}`}
          onClick={() => setCurrentView('RESTAURANT')}
        >
          <span className="nav-icon">🍽️</span>
          <span className="nav-text">식당</span>
        </button>
        <button 
          className={`nav-btn ${currentView === 'KITCHEN' ? 'active' : ''}`}
          onClick={() => setCurrentView('KITCHEN')}
        >
          <span className="nav-icon">🍳</span>
          <span className="nav-text">주방</span>
        </button>
        <button 
          className={`nav-btn ${currentView === 'MART' ? 'active' : ''}`}
          onClick={() => setCurrentView('MART')}
        >
          <span className="nav-icon">🛒</span>
          <span className="nav-text">마트</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
