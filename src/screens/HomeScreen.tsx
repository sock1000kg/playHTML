import React, { useState } from 'react';

interface HomeScreenProps {
  playerName: string;
  onNameChange: (name: string) => void;
  onStartLocal: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ playerName, onNameChange, onStartLocal }) => {
  const [joinCode, setJoinCode] = useState('');

  return (
    <div style={{ padding: 40, maxWidth: 400, margin: '0 auto', textAlign: 'center' }}>
      <h1>Sketchvote</h1>
      
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', marginBottom: 5 }}>Your Name</label>
        <input 
          value={playerName} 
          onChange={e => onNameChange(e.target.value)} 
          placeholder="Enter your name..."
          style={{ padding: 10, width: '100%', boxSizing: 'border-box' }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
        <button 
          onClick={onStartLocal}
          disabled={!playerName.trim()}
          style={{ padding: 15, background: '#4fc3f7', color: '#1a1a1a', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
        >
          Create New Room
        </button>

        <div style={{ borderTop: '1px solid #333', paddingTop: 15 }}>
          <label style={{ display: 'block', marginBottom: 5 }}>Join Existing Room</label>
          <div style={{ display: 'flex', gap: 5 }}>
            <input 
              value={joinCode} 
              onChange={e => setJoinCode(e.target.value.toUpperCase())} 
              placeholder="ABCD"
              maxLength={4}
              style={{ padding: 10, flex: 1, textTransform: 'uppercase' }}
            />
            <button 
              onClick={() => {
                if (joinCode.length === 4) {
                  window.location.hash = joinCode;
                }
              }}
              disabled={!playerName.trim() || joinCode.length < 4}
              style={{ padding: 10, cursor: 'pointer' }}
            >
              Join
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
