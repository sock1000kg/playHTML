import React from 'react';
import { SharedGameState } from '../../game/types';
import { getRoomCodeFromUrl } from '../../game/roomHelpers';

interface LobbyViewProps {
  state: SharedGameState;
  localPlayerId: string;
  onAdvance: () => void;
  onLeaveRoom: () => void;
}

export const LobbyView: React.FC<LobbyViewProps> = ({ state, localPlayerId, onAdvance, onLeaveRoom }) => {
  const roomCode = getRoomCodeFromUrl() || state.room.roomCode;
  const isHost = state.room.hostId === localPlayerId || !state.room.hostId;

  return (
    <div style={{ textAlign: 'center' }}>
      <h2>Lobby</h2>
      <div style={{ marginBottom: 20 }}>
        <span style={{ fontSize: '1.2rem' }}>Room Code:</span>
        <h1 style={{ letterSpacing: '0.2em', color: '#4fc3f7', margin: '10px 0' }}>{roomCode}</h1>
      </div>
      
      <div style={{ background: '#2a2a2a', padding: 20, borderRadius: 8, marginBottom: 20, maxWidth: 400, margin: '0 auto 20px auto' }}>
        <h3>Players ({Object.keys(state.players).length})</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {Object.values(state.players).map(p => (
            <li key={p.id} style={{ padding: '8px 0', borderBottom: '1px solid #444', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: p.avatarColor }} />
              {p.name} {p.id === state.room.hostId ? '(Host)' : ''}
            </li>
          ))}
        </ul>
      </div>

      {isHost ? (
        <button 
          onClick={onAdvance}
          style={{ padding: '15px 30px', fontSize: '1.1rem', background: '#4fc3f7', color: '#1a1a1a', border: 'none', fontWeight: 'bold', cursor: 'pointer', borderRadius: 4 }}
        >
          Start Game
        </button>
      ) : (
        <p style={{ fontStyle: 'italic', color: '#aaa' }}>Waiting for host to start...</p>
      )}
      
      <div style={{ marginTop: 20 }}>
        <button 
          onClick={() => { 
            onLeaveRoom()
            window.location.hash = ''
          }}>
            Leave Room
        </button>
      </div>
    </div>
  );
};
