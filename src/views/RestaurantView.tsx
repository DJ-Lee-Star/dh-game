import React, { useState, useEffect } from 'react';
import type { GameState } from '../types';
import './Restaurant.css';
import { playSound } from '../utils/audio';

interface Props {
  gameState: GameState;
}

const RECIPE_DATA: Record<string, { name: string, image: string, reward: number }> = {
  'fried_egg': { name: '계란 프라이', image: '/assets/fried_egg.jpg', reward: 300 },
  'pancake': { name: '팬케이크', image: '/assets/pancake.jpg', reward: 500 }
};

const CUSTOMERS = ['🐶', '🐰', '🦊', '🐼', '🦦', '🐹'];
const HINTS = [
  '소금을 쳐서 먹어볼까?',
  '기름에 튀기듯이!',
  '우유랑 밀가루를 섞으면 어떨까?',
  '시크릿 레시피를 찾아줘!'
];

const RestaurantView: React.FC<Props> = ({ gameState }) => {
  const [serveMessage, setServeMessage] = useState<string | null>(null);

  const getNextCustomer = () => {
    return CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)];
  };

  const handleServe = () => {
    if (gameState.cookedDish === gameState.currentOrder) {
      playSound('coin');
      // 성공적인 서빙
      const baseReward = RECIPE_DATA[gameState.cookedDish].reward;
      const multiplier = gameState.isFeverTime ? 2 : 1;
      const finalMoney = baseReward * multiplier;
      const finalHeart = 1 * multiplier;
      const finalXp = 150 * multiplier;

      const newCombo = gameState.combo + 1;
      gameState.setCombo(newCombo);
      if (newCombo >= 3 && !gameState.isFeverTime) {
        playSound('success');
        gameState.setIsFeverTime(true);
      }

      setServeMessage(`와! 고마워! 팁까지 💰${finalMoney}원 줄게! ❤️하트도 받아!`);
      gameState.setMoney(prev => prev + finalMoney);
      gameState.setHearts(prev => prev + finalHeart);
      gameState.setXp(prev => prev + finalXp);
      
      gameState.setCookedDish(null);
      gameState.setCurrentOrder(null);

      setTimeout(() => {
        setServeMessage(null);
        gameState.setCurrentCustomer(getNextCustomer());
        gameState.setCurrentOrder(gameState.level >= 2 && Math.random() > 0.5 ? 'pancake' : 'fried_egg');
      }, 3000);
    } else {
      playSound('fail');
      // 잘못된 서빙
      setServeMessage(`음... 내가 주문한 건 아니지만 잘 먹을게! (가족에게 줬어요) 💰100원 획득`);
      gameState.setMoney(prev => prev + 100);
      gameState.setXp(prev => prev + 50); 
      gameState.setCookedDish(null);
      
      gameState.setCombo(0);
      gameState.setIsFeverTime(false);
      
      setTimeout(() => {
        setServeMessage(null);
      }, 3000);
    }
  };

  return (
    <div className={`restaurant-container view-container ${gameState.isFeverTime ? 'fever-mode' : ''}`}>
      <div className="restaurant-bg">
        {gameState.isFeverTime && <div className="fever-overlay">🔥 FEVER TIME 🔥</div>}
        
        {gameState.combo > 0 && <div className="combo-counter">{gameState.combo} COMBO!</div>}

        {gameState.cookedDish && (
          <div className="holding-dish bounce">
            <span className="holding-text">현재 들고 있는 요리</span>
            <img src={RECIPE_DATA[gameState.cookedDish].image} alt="dish" />
          </div>
        )}

        <div className="customer-area" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', padding: '0 20px' }}>
          {/* Main Character (Chef) */}
          <div className="chef-avatar" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <img src="/assets/char_cat_chef.jpg" alt="Cat Chef" className="character-img" style={{ transform: 'scaleX(-1)', height: '180px', mixBlendMode: 'multiply' }} />
              {gameState.equippedHat && <div style={{ position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)', fontSize: '40px' }}>{gameState.equippedHat}</div>}
            </div>
            <div style={{ background: 'rgba(255,255,255,0.8)', padding: '5px 15px', borderRadius: '15px', fontWeight: 'bold', fontSize: '14px', marginTop: '-20px', zIndex: 5 }}>나 (냥셰프)</div>
          </div>

          {/* Customer */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {serveMessage ? (
              <div className="bubble happy-bubble">{serveMessage}</div>
            ) : gameState.currentOrder ? (
              <div className="bubble order-bubble bounce">
                <span className="order-text">이거 만들어 줘!</span>
                <img src={RECIPE_DATA[gameState.currentOrder].image} alt="order" />
                {Math.random() > 0.7 && <span className="hint-text">💡 힌트: {HINTS[Math.floor(Math.random() * HINTS.length)]}</span>}
              </div>
            ) : (
              <div className="bubble waiting-bubble">...다음 손님 기다리는 중...</div>
            )}
            
            <div className={`customer-avatar ${serveMessage ? 'happy' : ''}`}>
              {gameState.currentCustomer === '🐶' ? (
                <img src="/assets/char_puppy.jpg" alt="Puppy" className="character-img" style={{ mixBlendMode: 'multiply' }} />
              ) : gameState.currentCustomer === '🐰' ? (
                <img src="/assets/char_rabbit.jpg" alt="Rabbit" className="character-img" style={{ mixBlendMode: 'multiply' }} />
              ) : gameState.currentCustomer === '🦊' ? (
                <img src="/assets/char_fox.jpg" alt="Fox" className="character-img" style={{ mixBlendMode: 'multiply' }} />
              ) : (
                <span className="character-emoji">{gameState.currentCustomer}</span>
              )}
            </div>
          </div>
        </div>

        <div className="restaurant-actions">
          {gameState.currentOrder && !gameState.cookedDish && !serveMessage && (
            <button className="btn-go-kitchen" onClick={() => gameState.navigate('KITCHEN')}>
              👨‍🍳 주방으로 요리하러 가기
            </button>
          )}

          {gameState.cookedDish && !serveMessage && (
            <button className="btn-serve" onClick={handleServe}>
              🍽️ 손님에게 대접하기
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RestaurantView;
