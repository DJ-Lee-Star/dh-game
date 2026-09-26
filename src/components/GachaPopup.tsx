import React from 'react';
import type { GameState } from '../types';
import { playSound } from '../utils/audio';

interface Props {
  gameState: GameState;
  onClose: () => void;
}

const GachaPopup: React.FC<Props> = ({ gameState, onClose }) => {
  const handleDraw = () => {
    if (gameState.hearts >= 5) {
      playSound('success');
      gameState.setHearts(prev => prev - 5);
      alert('🎉 축하합니다! [고양이 셰프 모자]를 획득했습니다!');
    } else {
      playSound('fail');
      alert('❤️ 하트가 부족합니다. (5개 필요)');
    }
  };

  return (
    <div className="popup-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex',
      alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="popup-content" style={{
        background: 'linear-gradient(180deg, #fff 0%, #f1f2f6 100%)',
        width: '90%', maxWidth: '350px', borderRadius: '30px',
        padding: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        border: '5px solid #ffeaa7'
      }}>
        <h2 style={{ textAlign: 'center', color: '#e1b12c', marginTop: 0 }}>🎁 하트 뽑기 상점</h2>
        <p style={{ textAlign: 'center', color: '#636e72' }}>현재 내 하트: ❤️ {gameState.hearts}개</p>
        
        <div style={{ 
          background: '#fff', borderRadius: '20px', padding: '30px', 
          marginBottom: '20px', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.05)',
          display: 'flex', flexDirection: 'column', alignItems: 'center'
        }}>
          <div style={{ fontSize: '60px', animation: 'shake 2s infinite alternate' }}>🎀</div>
          <p style={{ fontWeight: 'bold', marginTop: '10px', color: '#d63031' }}>냥냥 셰프의 숨겨진 장비 뽑기!</p>
        </div>

        <button 
          onClick={handleDraw}
          style={{ 
            width: '100%', padding: '15px', background: '#e1b12c', color: '#fff', 
            border: 'none', borderRadius: '15px', fontWeight: 'bold', fontSize: '18px',
            boxShadow: '0 5px 0 #f39c12'
          }}
        >
          ❤️ 하트 5개로 뽑기!
        </button>

        <button 
          onClick={() => { playSound('click'); onClose(); }}
          style={{ width: '100%', padding: '15px', background: '#b2bec3', color: '#fff', border: 'none', borderRadius: '15px', fontWeight: 'bold', fontSize: '16px', marginTop: '15px' }}
        >
          닫기
        </button>
      </div>
    </div>
  );
};

export default GachaPopup;
