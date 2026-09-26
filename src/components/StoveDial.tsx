import React, { useState, useRef, useEffect } from 'react';
import { playSound } from '../utils/audio';

interface StoveDialProps {
  isOn: boolean;
  onToggle: (isOn: boolean) => void;
}

const StoveDial: React.FC<StoveDialProps> = ({ isOn, onToggle }) => {
  const [rotation, setRotation] = useState(isOn ? 90 : 0);
  const dialRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    setRotation(isOn ? 90 : 0);
  }, [isOn]);

  const handlePointerMove = (e: React.PointerEvent) => {
    if (e.buttons !== 1 && e.pointerType !== 'touch') return;
    if (!dialRef.current) return;
    
    const rect = dialRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = e.clientX - centerX;
    const deltaY = e.clientY - centerY;
    
    // Calculate angle in degrees
    let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    angle = angle + 90; // Adjust so 0 is top
    
    if (angle < 0) angle += 360;
    
    // Limit rotation between 0 and 90 degrees
    if (angle > 180) angle = 0;
    if (angle > 90 && angle <= 180) angle = 90;
    
    setRotation(angle);
    
    if (angle > 75 && !isOn) {
      playSound('click');
      onToggle(true);
    } else if (angle < 15 && isOn) {
      playSound('click');
      onToggle(false);
    }
  };

  return (
    <div className="stove-dial-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div 
        ref={dialRef}
        className="stove-dial"
        onPointerMove={handlePointerMove}
        style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #f1f2f6, #dcdde1)',
          boxShadow: '0 4px 6px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.8)',
          border: '2px solid #bdc3c7',
          position: 'relative',
          cursor: 'grab',
          touchAction: 'none',
          transform: `rotate(${rotation}deg)`
        }}
      >
        {/* Dial Indicator */}
        <div style={{
          position: 'absolute',
          top: '5px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '6px',
          height: '15px',
          background: isOn ? '#ff7675' : '#7f8fa6',
          borderRadius: '3px',
          boxShadow: isOn ? '0 0 5px #ff7675' : 'none'
        }} />
      </div>
      <span style={{ marginTop: '10px', fontWeight: 'bold', color: isOn ? '#ff7675' : '#636e72' }}>
        {isOn ? '🔥 불 켜짐' : '👆 다이얼 돌리기'}
      </span>
    </div>
  );
};

export default StoveDial;
