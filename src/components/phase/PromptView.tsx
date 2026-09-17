import React, { useState } from 'react';
import { SharedGameState } from '../../game/types';

interface PromptViewProps {
  state: SharedGameState;
  onSubmitPrompt: (text: string) => void;
  onAdvance: () => void; // local mock
}

export const PromptView: React.FC<PromptViewProps> = ({ onSubmitPrompt, onAdvance }) => {
  const [text, setText] = useState('');
  return (
    <div>
      <h2>Prompt Phase</h2>
      <p>Enter a prompt for someone to draw!</p>
      <input value={text} onChange={e => setText(e.target.value)} />
      <button onClick={() => {
        onSubmitPrompt(text);
        onAdvance();
      }}>Submit Prompt</button>
    </div>
  );
};
