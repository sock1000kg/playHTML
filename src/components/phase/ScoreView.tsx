import React from 'react';
import { SharedGameState } from '../../game/types';
import { Button } from '../ui/Button';

interface ScoreViewProps {
  state: SharedGameState;
  onAdvance: () => void;
}

export const ScoreView: React.FC<ScoreViewProps> = ({ state, onAdvance }) => {
  return (
    <div>
      <h2>Scores</h2>
      <ul>
        {Object.values(state.players).map(p => (
          <li key={p.id}>{p.name}: {p.score}</li>
        ))}
      </ul>
      <Button variant="primary" onClick={onAdvance}>Next Round</Button>
    </div>
  );
};

