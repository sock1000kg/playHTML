import React from 'react';
import { SharedGameState } from '../../game/types';

interface VoteViewProps {
  state: SharedGameState;
  localPlayerId: string;
  onSubmitVote: (voterId: string, votedForId: string) => void;
  onAdvance: () => void;
}

export const VoteView: React.FC<VoteViewProps> = ({ state, localPlayerId, onSubmitVote, onAdvance }) => {
  const drawings = Object.entries(state.round.drawings);
  
  return (
    <div>
      <h2>Vote Phase</h2>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {drawings.map(([playerId, dataUrl]) => {
          const playerName = state.players[playerId]?.name || playerId;
          return (
            <div key={playerId} style={{ border: '1px solid #555', padding: 10, textAlign: 'center' }}>
              <img src={dataUrl} alt={`Drawing by ${playerName}`} style={{ width: 300, height: 225, objectFit: 'contain', backgroundColor: '#2a2a2a' }} />
              <div style={{ marginTop: 10, fontWeight: 'bold' }}>Drawn by: {playerName}</div>
              
              {playerId !== localPlayerId && (
                <button style={{ marginTop: 10 }} onClick={() => {
                  onSubmitVote(localPlayerId, playerId);
                  onAdvance();
                }}>Vote</button>
              )}
            </div>
          );
        })}
      </div>
      
      {/* local mock advance if no drawings, or if player is alone and can't vote */}
      {(drawings.length === 0 || (drawings.length === 1 && drawings[0][0] === localPlayerId)) && (
        <div style={{ marginTop: 20 }}>
          <button onClick={onAdvance}>Skip Vote (Local Test)</button>
        </div>
      )}
    </div>
  );
};

