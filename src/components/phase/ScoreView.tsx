import React from 'react';
import { SharedGameState } from '../../game/types';

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
      <button onClick={onAdvance}>Next Round</button>
    </div>
  );
};

