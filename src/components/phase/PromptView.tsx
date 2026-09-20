import React, { useState } from 'react';
import { SharedGameState } from '../../game/types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface PromptViewProps {
  state: SharedGameState;
  localPlayerId: string;
  onSubmitPrompt: (text: string) => void;
}

export const PromptView: React.FC<PromptViewProps> = ({ state, localPlayerId, onSubmitPrompt }) => {
  const [text, setText] = useState('');
  
  const currentPrompterId = state.room.roundInfo.currentPrompterId;
  const isPrompter = localPlayerId === currentPrompterId;
  
  const prompter = currentPrompterId ? state.players[currentPrompterId] : null;
  const prompterName = prompter ? prompter.name : 'Someone (Prompter is missing from room state)';

  if (!isPrompter) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1rem' }}>
        <style>
          {`
            @keyframes pulse {
              50% { opacity: .5; }
            }
          `}
        </style>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Prompt Phase</h2>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
          <div 
            style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%', 
              marginBottom: '1rem',
              backgroundColor: prompter?.avatarColor || '#ccc' 
            }}
          />
          <p style={{ fontSize: '1.25rem', margin: 0 }}>Waiting for <strong>{prompterName}</strong> to choose a prompt...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', maxWidth: '28rem', margin: '0 auto', gap: '1.5rem' }}>
      <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', margin: 0 }}>Your Turn to Prompt!</h2>
      <p style={{ color: '#d1d5db', textAlign: 'center', margin: 0 }}>Enter a fun or challenging prompt for everyone to draw.</p>
      
      <Input 
        placeholder="e.g. A cat drinking coffee on the moon"
        value={text} 
        onChange={e => setText(e.target.value)} 
        onKeyDown={e => {
          if (e.key === 'Enter' && text.trim()) {
            onSubmitPrompt(text.trim());
          }
        }}
      />
      
      <Button 
        variant="primary"
        fullWidth
        disabled={!text.trim()}
        onClick={() => {
          if (text.trim()) {
            onSubmitPrompt(text.trim());
          }
        }}
      >
        Submit Prompt
      </Button>
    </div>
  );
};
