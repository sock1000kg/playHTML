import React from 'react';
import { SharedGameState } from '../game/types';
import { Button } from '../components/ui/Button';

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
      <Button variant="primary" onClick={onPlayAgain}>Play Again</Button>
    </div>
  );
};

