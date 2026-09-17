import React, { createContext, useContext } from 'react';
import { usePageData } from '@playhtml/react';
import { SharedGameState, defaultSharedState } from '../game/types';

interface GameStateContextType {
  state: SharedGameState;
  setState: (
    updater: SharedGameState | ((draft: SharedGameState) => void)
  ) => void;
}

const GameStateContext = createContext<GameStateContextType | null>(null);

export const GameStateProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [data, setData] = usePageData<SharedGameState>('game-state', defaultSharedState);

  return (
    <GameStateContext.Provider value={{ state: data, setState: setData }}>
      {children}
    </GameStateContext.Provider>
  );
};

export function useSharedGameState(): GameStateContextType {
  const context = useContext(GameStateContext);
  if (!context) {
    throw new Error('useSharedGameState must be used within a GameStateProvider');
  }
  return context;
}



