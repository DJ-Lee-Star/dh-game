import React, { useState } from 'react';
import type { GameState } from '../types';
import Icon from '../components/Icon';
import './Mart.css';

interface Props {
  gameState: GameState;
}

const MART_ITEMS = [
  { id: 'egg', name: '신선한 계란', icon: 'egg', price: 50, reqLevel: 1 },
  { id: 'milk', name: '고소한 우유', icon: 'milk', price: 100, reqLevel: 2 },
  { id: 'flour', name: '부드러운 밀가루', icon: 'flour', price: 80, reqLevel: 2 },
];

const MartView: React.FC<Props> = ({ gameState }) => {
  const [purchaseMsg, setPurchaseMsg] = useState<string | null>(null);

  const buyItem = (item: typeof MART_ITEMS[0]) => {
    if (gameState.level < item.reqLevel) {
      setPurchaseMsg(`앗! 아직 레벨이 부족해. (Lv.${item.reqLevel} 필요)`);
      return;
    }
    if (gameState.money >= item.price) {
      gameState.setMoney(prev => prev - item.price);
      gameState.setInventory(prev => ({
        ...prev,
        [item.id]: (prev[item.id] || 0) + 1
      }));
      setPurchaseMsg(`${item.name} 1개를 샀어!`);
    } else {
      setPurchaseMsg(`앗! 돈이 부족해! 요리를 해서 돈을 더 벌어오렴.`);
    }
  };

  return (
    <div className="mart-container view-container">
      {/* Mart Background using concept art */}
      <div className="mart-bg">
        <div className="mart-overlay">
          <h2>🛒 곰 아저씨 마트</h2>
          
          <div className="bear-speech">
            {purchaseMsg ? purchaseMsg : '어세오렴! 싱싱한 재료가 많단다! 양념은 무료로 줄게.'}
          </div>

          <div className="mart-shelves">
            {MART_ITEMS.map(item => (
              <div key={item.id} className={`mart-item-card ${gameState.level < item.reqLevel ? 'locked' : ''}`}>
                <div className="item-icon">
                  <Icon name={item.icon as any} size={50} />
                </div>
                <div className="item-info">
                  <h4>{item.name}</h4>
                  <p>보유: {gameState.inventory[item.id] || 0}개</p>
                  <button 
                    className="btn-buy" 
                    onClick={() => buyItem(item)}
                  >
                    💰 {item.price}
                  </button>
                  {gameState.level < item.reqLevel && (
                    <div className="lock-overlay">Lv.{item.reqLevel} 오픈</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MartView;
