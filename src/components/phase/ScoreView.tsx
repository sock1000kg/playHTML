import React from 'react';
import { SharedGameState } from '../../game/types';
import { Button } from '../ui/Button';

interface ScoreViewProps {
  state: SharedGameState;
  localPlayerId: string;
  onAdvance: () => void;
}

export const ScoreView: React.FC<ScoreViewProps> = ({ state, localPlayerId, onAdvance }) => {
  const isHost = state.room.hostId === localPlayerId;
  const sortedPlayers = Object.values(state.players).sort((a, b) => b.score - a.score);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', gap: '1rem', padding: '2rem' }}>
      <h2>Current Scores</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '400px' }}>
        {sortedPlayers.map(p => (
          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 15px', background: '#333', borderRadius: '8px' }}>
            <span style={{ fontWeight: p.id === localPlayerId ? 'bold' : 'normal', color: p.avatarColor }}>
              {p.name} {p.id === localPlayerId ? '(You)' : ''}
            </span>
            <span style={{ fontWeight: 'bold' }}>{p.score}</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '2rem' }}>
        {isHost ? (
          <Button variant="primary" onClick={onAdvance}>Next Round</Button>
        ) : (
          <p style={{ fontStyle: 'italic', color: '#aaa' }}>Waiting for host to continue...</p>
        )}
      </div>
    </div>
  );
};

