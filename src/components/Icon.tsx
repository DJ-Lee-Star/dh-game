import React from 'react';

type IconName = 'egg' | 'oil' | 'milk' | 'flour' | 'salt' | 'fridge' | 'shelf' | 'pantry' | 'unknown';

interface IconProps {
  name: IconName;
  size?: number;
}

const Icon: React.FC<IconProps> = ({ name, size = 64 }) => {
  const getIcon = () => {
    switch (name) {
      case 'egg':
        return (
          <svg viewBox="0 0 100 100" width={size} height={size}>
            <ellipse cx="50" cy="55" rx="35" ry="40" fill="#fffbe6" stroke="#f1c40f" strokeWidth="4" />
            <circle cx="50" cy="55" r="15" fill="#f39c12" />
          </svg>
        );
      case 'oil':
        return (
          <svg viewBox="0 0 100 100" width={size} height={size}>
            <rect x="30" y="20" width="40" height="70" rx="10" fill="#f1c40f" stroke="#d35400" strokeWidth="4" />
            <rect x="40" y="10" width="20" height="15" fill="#e67e22" />
            <text x="50" y="60" textAnchor="middle" fill="#fff" fontSize="20" fontWeight="bold">OIL</text>
          </svg>
        );
      case 'milk':
        return (
          <svg viewBox="0 0 100 100" width={size} height={size}>
            <rect x="25" y="30" width="50" height="60" rx="5" fill="#ecf0f1" stroke="#bdc3c7" strokeWidth="4" />
            <polygon points="25,30 50,10 75,30" fill="#3498db" />
            <text x="50" y="65" textAnchor="middle" fill="#3498db" fontSize="18" fontWeight="bold">MILK</text>
          </svg>
        );
      case 'flour':
        return (
          <svg viewBox="0 0 100 100" width={size} height={size}>
            <path d="M20,90 L25,30 L75,30 L80,90 Z" fill="#f5f6fa" stroke="#dcdde1" strokeWidth="4" />
            <path d="M25,30 C40,10 60,10 75,30" fill="#e1b12c" />
            <text x="50" y="65" textAnchor="middle" fill="#7f8fa6" fontSize="14" fontWeight="bold">FLOUR</text>
          </svg>
        );
      case 'salt':
        return (
          <svg viewBox="0 0 100 100" width={size} height={size}>
            <rect x="35" y="30" width="30" height="60" rx="15" fill="#fff" stroke="#bdc3c7" strokeWidth="4" />
            <rect x="35" y="20" width="30" height="10" fill="#e74c3c" />
            <circle cx="50" cy="50" r="2" fill="#7f8fa6" />
            <circle cx="45" cy="60" r="2" fill="#7f8fa6" />
            <circle cx="55" cy="70" r="2" fill="#7f8fa6" />
          </svg>
        );
      case 'fridge': return <span style={{fontSize: size/1.5}}>❄️</span>;
      case 'shelf': return <span style={{fontSize: size/1.5}}>🧂</span>;
      case 'pantry': return <span style={{fontSize: size/1.5}}>🌾</span>;
      default:
        return <span style={{fontSize: size/1.5}}>❓</span>;
    }
  };

  return <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size, height: size }}>{getIcon()}</div>;
};

export default Icon;
