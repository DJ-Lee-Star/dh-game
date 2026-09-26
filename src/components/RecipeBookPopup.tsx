import React from 'react';
import type { GameState } from '../types';
import './RecipeBook.css';

interface Props {
  gameState: GameState;
  onClose: () => void;
}

const RecipeBookPopup: React.FC<Props> = ({ gameState, onClose }) => {
  const { unlockedRecipes } = gameState;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content recipe-book" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>✖</button>
        <h2>📖 냥냥 레시피북</h2>
        <p className="recipe-desc">요리 레시피를 확인하세요! 새로운 요리를 발명하면 시크릿 레시피가 열립니다.</p>
        
        <div className="recipe-list">
          {/* 계란 프라이 (기본 해금) */}
          <div className="recipe-card">
            <img src="/assets/fried_egg.jpg" alt="계란 프라이" className="recipe-img-thumb" />
            <div className="recipe-info">
              <h3>🍳 계란 프라이</h3>
              <p>순서: 식용유 ➡️ 계란</p>
            </div>
          </div>
          
          {/* 팬케이크 (레벨 2 해금) */}
          <div className={`recipe-card ${unlockedRecipes.includes('pancake') ? '' : 'locked'}`}>
            <div className="recipe-img-placeholder">🥞</div>
            <div className="recipe-info">
              <h3>{unlockedRecipes.includes('pancake') ? '🥞 팬케이크' : '??? (Lv.2 해금)'}</h3>
              <p>{unlockedRecipes.includes('pancake') ? '순서: 밀가루 ➡️ 우유 ➡️ 계란' : '아직 알 수 없습니다.'}</p>
            </div>
          </div>

          {/* 시크릿 레시피 */}
          <div className={`recipe-card secret ${unlockedRecipes.includes('secret_fried_egg') ? 'unlocked' : ''}`}>
            <div className="recipe-img-placeholder">❓</div>
            <div className="recipe-info">
              <h3>{unlockedRecipes.includes('secret_fried_egg') ? '🧂 짭짤한 프라이' : '시크릿 레시피 1'}</h3>
              <p>{unlockedRecipes.includes('secret_fried_egg') ? '순서: 식용유 ➡️ 계란 ➡️ 소금' : '요리하다가 우연히 발견해 보세요!'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeBookPopup;
