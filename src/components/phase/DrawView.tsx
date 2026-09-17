import React, { useRef } from 'react';
import { SharedGameState } from '../../game/types';
import { DrawingCanvas, DrawingCanvasRef } from '../canvas/DrawingCanvas';

interface DrawViewProps {
  state: SharedGameState;
  localPlayerId: string;
  onSubmitDrawing: (playerId: string, dataUrl: string) => void;
  onAdvance: () => void;
}

export const DrawView: React.FC<DrawViewProps> = ({ state, localPlayerId, onSubmitDrawing, onAdvance }) => {
  const canvasRef = useRef<DrawingCanvasRef>(null);

  const handleSubmit = () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.exportDataUrl();
      if (dataUrl) {
        onSubmitDrawing(localPlayerId, dataUrl);
      }
    }
    onAdvance();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <h2>Draw Phase</h2>
      <p>Prompt: {state.room.roundInfo.promptText}</p>
      <div style={{ flex: 1, position: 'relative' }}>
        <DrawingCanvas ref={canvasRef} />
      </div>
      <button onClick={handleSubmit}>Submit Drawing</button>
    </div>
  );
};

