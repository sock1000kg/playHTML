import React, { useRef, useState, useEffect } from 'react';
import { SharedGameState } from '../../game/types';
import { DrawingCanvas, DrawingCanvasRef } from '../canvas/DrawingCanvas';
import { Button } from '../ui/Button';
import { useTimer } from '../../hooks/useTimer';

interface DrawViewProps {
  state: SharedGameState;
  localPlayerId: string;
  onSubmitDrawing: (playerId: string, dataUrl: string) => void;
}

export const DrawView: React.FC<DrawViewProps> = ({ state, localPlayerId, onSubmitDrawing }) => {
  const canvasRef = useRef<DrawingCanvasRef>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const { secondsRemaining, isExpired } = useTimer(state.room.roundInfo.phaseStartedAt, state.room.settings.drawTimerSeconds);

  // Auto-submit when the timer expires
  useEffect(() => {
    if (isExpired && !hasSubmitted) {
      submitCurrentDrawing();
    }
  }, [isExpired, hasSubmitted]);

  const submitCurrentDrawing = () => {
    if (hasSubmitted) return;
    setHasSubmitted(true);
    
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.exportDataUrl();
      if (dataUrl) {
        onSubmitDrawing(localPlayerId, dataUrl);
      }
    }
  };

  if (hasSubmitted) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <h2>Drawing Submitted!</h2>
        <p>Waiting for other players...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0 }}>Draw Phase</h2>
          <p style={{ margin: 0, fontSize: '1.2rem', color: '#aaa' }}>Prompt: <strong style={{ color: '#fff' }}>{state.room.roundInfo.promptText}</strong></p>
        </div>
        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: secondsRemaining <= 10 ? '#ef4444' : 'inherit' }}>
          {secondsRemaining}s
        </div>
      </div>
      
      <div style={{ flex: 1, position: 'relative', marginBottom: '1rem', border: '2px solid #444', borderRadius: '8px', overflow: 'hidden' }}>
        <DrawingCanvas ref={canvasRef} />
      </div>
      
      <Button variant="primary" onClick={submitCurrentDrawing}>
        Submit Drawing 
        (If you don't submit, your drawing will be blank!)
      </Button>
    </div>
  );
};

