import React from 'react';

export type ViewType = 'RESTAURANT' | 'KITCHEN' | 'MART';

export interface GameState {
  level: number;
  xp: number;
  money: number;
  hearts: number;
  combo: number;
  isFeverTime: boolean;
  currentOrder: string | null;
  currentCustomer: string | null;
  cookedDish: string | null;
  inventory: Record<string, number>;
  unlockedRecipes: string[];
  equippedHat: string | null;
  equippedBg: string | null;
  
  setXp: React.Dispatch<React.SetStateAction<number>>;
  setMoney: React.Dispatch<React.SetStateAction<number>>;
  setHearts: React.Dispatch<React.SetStateAction<number>>;
  setCombo: React.Dispatch<React.SetStateAction<number>>;
  setIsFeverTime: React.Dispatch<React.SetStateAction<boolean>>;
  setCurrentOrder: React.Dispatch<React.SetStateAction<string | null>>;
  setCurrentCustomer: React.Dispatch<React.SetStateAction<string | null>>;
  setCookedDish: React.Dispatch<React.SetStateAction<string | null>>;
  setInventory: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  setUnlockedRecipes: React.Dispatch<React.SetStateAction<string[]>>;
  setEquippedHat: React.Dispatch<React.SetStateAction<string | null>>;
  setEquippedBg: React.Dispatch<React.SetStateAction<string | null>>;
  navigate: (view: ViewType) => void;
}
