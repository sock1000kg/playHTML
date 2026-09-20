import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

interface HomeScreenProps {
  playerName: string;
  onNameChange: (name: string) => void;
  onStartLocal: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ playerName, onNameChange, onStartLocal }) => {
  const [joinCode, setJoinCode] = useState('');

  return (
    <div style={{ padding: 40, maxWidth: 400, margin: '0 auto', textAlign: 'center' }}>
      <h1 style={{ color: 'white', marginBottom: '2rem' }}>Sketchvote</h1>
      
      <div style={{ marginBottom: 20, textAlign: 'left' }}>
        <label style={{ display: 'block', marginBottom: 5, color: '#ccc' }}>Your Name</label>
        <Input 
          value={playerName} 
          onChange={e => onNameChange(e.target.value)} 
          placeholder="Enter your name..."
          style={{ padding: '0.75rem', fontSize: '1rem' }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
        <Button 
          variant="secondary"
          fullWidth
          onClick={onStartLocal}
          disabled={!playerName.trim()}
        >
          Create New Room
        </Button>

        <div style={{ borderTop: '1px solid #333', paddingTop: 15, textAlign: 'left' }}>
          <label style={{ display: 'block', marginBottom: 5, color: '#ccc' }}>Join Existing Room</label>
          <div style={{ display: 'flex', gap: 5 }}>
            <Input 
              value={joinCode} 
              onChange={e => setJoinCode(e.target.value.toUpperCase())} 
              placeholder="ABCD"
              maxLength={4}
              style={{ padding: '0.75rem', fontSize: '1rem', flex: 1, textTransform: 'uppercase' }}
              fullWidth={false}
            />
            <Button 
              variant="primary"
              onClick={() => {
                if (joinCode.length === 4) {
                  window.location.hash = joinCode;
                }
              }}
              disabled={!playerName.trim() || joinCode.length < 4}
              style={{ padding: '0.75rem 1.5rem' }}
            >
              Join
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
