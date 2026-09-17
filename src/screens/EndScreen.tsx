import React from 'react';
import { SharedGameState } from '../game/types';

interface EndScreenProps {
  state: SharedGameState;
  onPlayAgain: () => void;
}

export const EndScreen: React.FC<EndScreenProps> = ({ state, onPlayAgain }) => {
  return (
    <div>
      <h2>Game Over!</h2>
      <ol>
        {Object.values(state.players).sort((a, b) => b.score - a.score).map(p => (
          <li key={p.id}>{p.name}: {p.score}</li>
        ))}
      </ol>
      <button onClick={onPlayAgain}>Play Again</button>
    </div>
  );
};

