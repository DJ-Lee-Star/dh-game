import React, { useState, useEffect } from 'react';
import './Kitchen.css';
import Icon from '../components/Icon';
import type { GameState } from '../types';
import { playSound } from '../utils/audio';
import StoveDial from '../components/StoveDial';

type StorageTab = 'FRIDGE' | 'SHELF' | 'PANTRY';
type ToolType = 'PAN' | 'POT' | 'BOWL' | null;

interface Ingredient {
  id: string;
  name: string;
  iconName: 'egg' | 'oil' | 'milk' | 'flour' | 'salt';
}

interface Props {
  gameState: GameState;
}

const KitchenView: React.FC<Props> = ({ gameState }) => {
  const [selectedRecipe, setSelectedRecipe] = useState<{ id: string, name: string } | null>(null);
  
  // Cooking States
  const [cookingStep, setCookingStep] = useState<'CHOOSE_TOOL' | 'COOKING'>('CHOOSE_TOOL');
  const [selectedTool, setSelectedTool] = useState<ToolType>(null);
  const [isStoveOn, setIsStoveOn] = useState(false);
  
  // Interactive Mixing State
  const [mixProgress, setMixProgress] = useState(0);
  const isMixed = mixProgress >= 100;
  
  const [activeTab, setActiveTab] = useState<StorageTab>('FRIDGE');
  const [ingredientsInTool, setIngredientsInTool] = useState<Ingredient[]>([]);
  const [cookingResult, setCookingResult] = useState<{ message: string, isSuccess: boolean, finalImage?: string, recipeId?: string } | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // For interactive mixing
  const handleBowlPointerMove = (e: React.PointerEvent) => {
    // Only mix if it's a mouse drag (buttons === 1) OR if it's a touch event (pointerType === 'touch')
    const isDragging = e.pointerType === 'touch' || e.buttons === 1;
    if (selectedTool === 'BOWL' && ingredientsInTool.length > 0 && !isMixed && isDragging) {
      setMixProgress(prev => {
        const next = Math.min(prev + 2, 100);
        if (next % 10 === 0) playSound('mix'); // Play sound occasionally while mixing
        return next;
      });
    }
  };

  const storageData: Record<StorageTab, Ingredient[]> = {
    FRIDGE: [
      { id: 'egg', name: '계란', iconName: 'egg' },
      { id: 'milk', name: '우유', iconName: 'milk' }
    ],
    SHELF: [
      { id: 'oil', name: '식용유', iconName: 'oil' },
      { id: 'salt', name: '소금', iconName: 'salt' }
    ],
    PANTRY: [
      { id: 'flour', name: '밀가루', iconName: 'flour' }
    ]
  };

  const startCooking = (tool: ToolType) => {
    setSelectedTool(tool);
    setCookingStep('COOKING');
  };

  const addIngredient = (ing: Ingredient) => {
    if (ingredientsInTool.length < 4 && !cookingResult) {
      if (ing.id !== 'oil' && ing.id !== 'salt') {
        if (!gameState.inventory[ing.id] || gameState.inventory[ing.id] <= 0) {
          alert(`재료 부족! 마트에서 [${ing.name}]을(를) 사오세요!`);
          return;
        }
        gameState.setInventory(prev => ({ ...prev, [ing.id]: prev[ing.id] - 1 }));
      }
      setIngredientsInTool([...ingredientsInTool, ing]);
    }
  };

  const triggerCollectionEffect = (recipeId: string) => {
    if (!gameState.unlockedRecipes.includes(recipeId)) {
      gameState.setUnlockedRecipes(prev => [...prev, recipeId]);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  };

  const handleFinish = () => {
    const sequence = ingredientsInTool.map(i => i.id).join(',');

    if (selectedRecipe?.id === 'fried_egg') {
      if (selectedTool === 'PAN' && isStoveOn) {
        if (sequence === 'oil,egg') {
          playSound('success');
          setCookingResult({ message: '🍳 완벽한 계란 프라이 완성!', isSuccess: true, finalImage: '/assets/fried_egg.jpg', recipeId: 'fried_egg' });
        } else if (sequence === 'oil,egg,salt') {
          playSound('success');
          setCookingResult({ message: '🧂 짭짤한 프라이! (시크릿 발동!)', isSuccess: true, finalImage: '/assets/fried_egg.jpg', recipeId: 'secret_fried_egg' });
          triggerCollectionEffect('secret_fried_egg');
        } else {
          playSound('fail');
          setCookingResult({ message: '🔥 앗... 순서가 틀렸어요!', isSuccess: false });
        }
      } else {
        playSound('fail');
        setCookingResult({ message: '🔥 프라이팬을 선택하고 불을 켜야 해요!', isSuccess: false });
      }
    } 
    else if (selectedRecipe?.id === 'pancake') {
      if (selectedTool === 'BOWL') {
        if (sequence === 'flour,milk,egg' && isMixed) {
          playSound('success');
          setCookingResult({ message: '🥞 폭신폭신 팬케이크 완성!', isSuccess: true, finalImage: '/assets/pancake.jpg', recipeId: 'pancake' });
        } else {
          playSound('fail');
          setCookingResult({ message: '🔥 반죽이 덜 섞였거나 재료가 틀렸어요!', isSuccess: false });
        }
      } else {
        playSound('fail');
        setCookingResult({ message: '🔥 팬케이크 반죽은 [보울]에서 만들어야 해요!', isSuccess: false });
      }
    }
  };

  const resetCooking = () => {
    ingredientsInTool.forEach(ing => {
      if (ing.id !== 'oil' && ing.id !== 'salt') {
        gameState.setInventory(prev => ({ ...prev, [ing.id]: (prev[ing.id] || 0) + 1 }));
      }
    });
    setIngredientsInTool([]);
    setCookingResult(null);
    setSelectedRecipe(null); 
    setCookingStep('CHOOSE_TOOL');
    setSelectedTool(null);
    setIsStoveOn(false);
    setMixProgress(0);
  };

  const takeToRestaurant = () => {
    if (cookingResult?.recipeId) {
      gameState.setCookedDish(selectedRecipe?.id || null); // Return the base ID
      gameState.navigate('RESTAURANT');
    }
  };

  // 1. 요리 선택 화면
  if (!selectedRecipe) {
    return (
      <div className="kitchen-container view-container select-recipe-mode">
        <h2>어떤 요리를 만들까요?</h2>
        <div className="recipe-select-list">
          <button className="recipe-select-btn" onClick={() => setSelectedRecipe({ id: 'fried_egg', name: '계란 프라이' })}>
            <img src="/assets/fried_egg.jpg" alt="계란 프라이" className="recipe-thumb" />
            <span>🍳 계란 프라이 만들기</span>
          </button>
          <button className="recipe-select-btn" onClick={() => setSelectedRecipe({ id: 'pancake', name: '팬케이크' })}>
            <img src="/assets/pancake.jpg" alt="팬케이크" className="recipe-thumb" />
            <span>🥞 팬케이크 만들기</span>
          </button>
        </div>
      </div>
    );
  }

  // 2. 도구 선택 화면
  if (cookingStep === 'CHOOSE_TOOL') {
    return (
      <div className="kitchen-container view-container select-tool-mode">
        <button className="btn-back" onClick={resetCooking}>⬅️ 취소</button>
        <h2>[{selectedRecipe.name}] 조리 도구를 선택하세요</h2>
        <div className="tool-select-list">
          <button className="tool-btn" onClick={() => startCooking('PAN')}>
            <div className="tool-icon">🍳</div>
            <span>프라이팬</span>
          </button>
          <button className="tool-btn" onClick={() => startCooking('POT')}>
            <div className="tool-icon">🍲</div>
            <span>냄비</span>
          </button>
          <button className="tool-btn" onClick={() => startCooking('BOWL')}>
            <div className="tool-icon">🥣</div>
            <span>믹싱 보울</span>
          </button>
        </div>
      </div>
    );
  }

  // 3. 요리 완성 화면
  if (cookingResult?.isSuccess && cookingResult.finalImage) {
    return (
      <div className="kitchen-container view-container success-mode">
        {showConfetti && <div className="confetti-overlay">🎉 NEW 도감 등록! 🎉</div>}
        <h2 className="bounce-text">요리 완성!</h2>
        <div className="finished-dish-card">
          <img src={cookingResult.finalImage} alt="완성된 요리" className="finished-img" />
          <h3>{cookingResult.message}</h3>
          <button className="btn-cook" style={{marginTop: '20px', background: '#55efc4'}} onClick={takeToRestaurant}>
            🏃 손님에게 서빙하러 가기
          </button>
        </div>
      </div>
    );
  }

  // 4. 조리 진행 화면
  return (
    <div className="kitchen-container view-container">
      <div className="cooking-header">
        <button className="btn-back" onClick={resetCooking}>⬅️ 취소</button>
        <h2>[{selectedRecipe.name}] 요리 중...</h2>
      </div>
      
      <div className="cooking-area">
        <div className="stove-controls">
          {(selectedTool === 'PAN' || selectedTool === 'POT') && (
            <StoveDial isOn={isStoveOn} onToggle={setIsStoveOn} />
          )}
          {selectedTool === 'BOWL' && (
            <div className="mix-instruction">
              {isMixed ? '✨ 반죽 완료!' : '👇 보울 위를 터치/드래그해서 섞으세요!'}
              <div className="mix-bar"><div className="mix-fill" style={{ width: `${mixProgress}%` }}></div></div>
            </div>
          )}
        </div>

        <div 
          className={`cooking-tool ${selectedTool?.toLowerCase()} ${isStoveOn ? 'hot' : ''}`}
          onPointerMove={handleBowlPointerMove}
          style={{ touchAction: 'none' }} // Prevent scrolling while mixing
        >
          {cookingResult && !cookingResult.isSuccess ? (
            <div className="result-text fail bounce">{cookingResult.message}</div>
          ) : (
            <div className="live-cooking-visual">
              {ingredientsInTool.some(i => i.id === 'oil') && <div className="visual-layer oil-layer"></div>}
              {ingredientsInTool.some(i => i.id === 'flour') && <div className={`visual-layer batter-layer ${isMixed ? 'mixed' : ''}`}></div>}
              {ingredientsInTool.some(i => i.id === 'egg') && <div className="visual-layer egg-layer"><div className="egg-yolk"></div></div>}
              {ingredientsInTool.some(i => i.id === 'salt') && <div className="visual-layer salt-layer"><span>🧂</span><span>🧂</span></div>}
            </div>
          )}
        </div>
        
        <div className="current-steps">
          {ingredientsInTool.length > 0 && !cookingResult && (
            <p>{ingredientsInTool.map(i => i.name).join(' ➡️ ')}</p>
          )}
        </div>

        <div className="action-buttons">
          <button className="btn-clear" onClick={() => setIngredientsInTool([])}>다시하기</button>
          <button className="btn-cook" onClick={handleFinish} disabled={ingredientsInTool.length === 0 || cookingResult !== null}>
            접시에 담기 (완성)
          </button>
        </div>
      </div>

      <div className="ingredient-storage">
        <div className="storage-tabs">
          <button className={`tab-btn ${activeTab === 'FRIDGE' ? 'active' : ''}`} onClick={() => setActiveTab('FRIDGE')}>❄️ 냉장고</button>
          <button className={`tab-btn ${activeTab === 'SHELF' ? 'active' : ''}`} onClick={() => setActiveTab('SHELF')}>🧂 선반</button>
          <button className={`tab-btn ${activeTab === 'PANTRY' ? 'active' : ''}`} onClick={() => setActiveTab('PANTRY')}>🌾 식료품</button>
        </div>
        <div className="storage-content">
          {storageData[activeTab].map(ing => (
            <button key={ing.id} className="ing-card" onClick={() => addIngredient(ing)}>
              <Icon name={ing.iconName} size={40} />
              <span className="ing-name">{ing.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default KitchenView;
