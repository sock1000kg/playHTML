import React from 'react';
import { SharedGameState } from '../../game/types';

interface ViewProps {
  state: SharedGameState;
  onAdvance: () => void;
}

export const LobbyView: React.FC<ViewProps> = ({ onAdvance }) => {
  return (
    <div>
      <h2>Lobby</h2>
      <button onClick={onAdvance}>Start Game (Host)</button>
    </div>
  );
};

