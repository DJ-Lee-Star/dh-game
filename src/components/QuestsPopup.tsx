import React from 'react';
import type { GameState } from '../types';
import { playSound } from '../utils/audio';

interface Props {
  gameState: GameState;
  onClose: () => void;
}

const QuestsPopup: React.FC<Props> = ({ gameState, onClose }) => {
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
        border: '5px solid #ffb8b8'
      }}>
        <h2 style={{ textAlign: 'center', color: '#d63031', marginTop: 0 }}>일일 퀘스트 & 업적</h2>
        
        <div style={{ background: '#fff', borderRadius: '15px', padding: '15px', marginBottom: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
          <h4 style={{ margin: '0 0 5px 0', color: '#2d3436' }}>1. 계란 프라이 5번 만들기</h4>
          <div style={{ background: '#dfe6e9', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
            <div style={{ width: '60%', height: '100%', background: '#ff7675' }}></div>
          </div>
          <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#636e72' }}>진행도: 3/5</p>
        </div>

        <div style={{ background: '#fff', borderRadius: '15px', padding: '15px', marginBottom: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
          <h4 style={{ margin: '0 0 5px 0', color: '#2d3436' }}>2. 강아지 손님 만족시키기</h4>
          <div style={{ background: '#dfe6e9', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
            <div style={{ width: '100%', height: '100%', background: '#55efc4' }}></div>
          </div>
          <button style={{ 
            marginTop: '10px', width: '100%', padding: '8px', 
            background: '#00b894', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold' 
          }} onClick={() => { playSound('coin'); alert('보상 500원을 받았습니다!'); }}>
            보상 받기 (💰 500)
          </button>
        </div>

        <button 
          onClick={() => { playSound('click'); onClose(); }}
          style={{ width: '100%', padding: '15px', background: '#ff7675', color: '#fff', border: 'none', borderRadius: '15px', fontWeight: 'bold', fontSize: '16px', marginTop: '10px' }}
        >
          닫기
        </button>
      </div>
    </div>
  );
};

export default QuestsPopup;
