import React from 'react';
import { SharedGameState } from '../game/types';
import { Button } from '../components/ui/Button';

interface EndScreenProps {
  state: SharedGameState;
  localPlayerId: string;
  onPlayAgain: () => void;
  onLeaveRoom: () => void;
}

export const EndScreen: React.FC<EndScreenProps> = ({ state, localPlayerId, onPlayAgain, onLeaveRoom }) => {
  const sortedPlayers = Object.values(state.players).sort((a, b) => b.score - a.score);
  const isHost = state.room.hostId === localPlayerId;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100dvh', padding: 20 }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '2rem', color: '#10b981' }}>Game Over!</h1>
      
      <div style={{ background: '#222', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '500px', marginBottom: '2rem' }}>
        <h2 style={{ textAlign: 'center', borderBottom: '1px solid #444', paddingBottom: '1rem', marginTop: 0 }}>Final Rankings</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
          {sortedPlayers.map((p, index) => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#333', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', width: '30px' }}>
                  {index === 0 ? '🏆' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                </span>
                <span style={{ fontSize: '1.2rem', fontWeight: p.id === localPlayerId ? 'bold' : 'normal', color: p.avatarColor }}>
                  {p.name} {p.id === localPlayerId ? '(You)' : ''}
                </span>
              </div>
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{p.score} pts</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        {isHost ? (
          <Button variant="primary" onClick={onPlayAgain} style={{ fontSize: '1.2rem', padding: '1rem 2rem' }}>
            Play Again
          </Button>
        ) : (
          <div style={{ padding: '1rem 2rem', fontSize: '1.2rem', color: '#aaa', fontStyle: 'italic' }}>
            Waiting for host to play again...
          </div>
        )}
        <Button variant="secondary" onClick={onLeaveRoom} style={{ fontSize: '1.2rem', padding: '1rem 2rem' }}>
          Leave Room
        </Button>
      </div>
    </div>
  );
};

