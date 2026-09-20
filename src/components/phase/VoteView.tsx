import React, { useState, useEffect } from 'react';
import { SharedGameState } from '../../game/types';
import { Button } from '../ui/Button';
import { useTimer } from '../../hooks/useTimer';

interface VoteViewProps {
  state: SharedGameState;
  localPlayerId: string;
  onSubmitVote: (voterId: string, votedForId: string) => void;
}

export const VoteView: React.FC<VoteViewProps> = ({ state, localPlayerId, onSubmitVote }) => {
  const drawings = Object.entries(state.round.drawings);
  const [hasVoted, setHasVoted] = useState(false);
  
  const { secondsRemaining, isExpired } = useTimer(state.room.roundInfo.phaseStartedAt, state.room.settings.voteTimerSeconds);

  /**
   * Auto-Vote Orchestration:
   * When the timer hits 0, if the player hasn't voted yet, this effect randomly 
   * picks another player's drawing and casts a vote for it. This ensures the 
   * game isn't deadlocked by AFK players while still assigning points fairly.
   */
  useEffect(() => {
    if (isExpired && !hasVoted) {
      // Pick a random drawing that isn't ours
      const validDrawings = drawings.filter(([id]) => id !== localPlayerId);
      if (validDrawings.length > 0) {
        const randomDrawing = validDrawings[Math.floor(Math.random() * validDrawings.length)];
        onSubmitVote(localPlayerId, randomDrawing[0]);
      }
      setHasVoted(true);
    }
  }, [isExpired, hasVoted, drawings, localPlayerId, onSubmitVote]);

  if (hasVoted) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <h2>Vote Submitted!</h2>
        <p>Waiting for other players...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0 }}>Vote Phase</h2>
          <p style={{ margin: 0, fontSize: '1.2rem', color: '#aaa' }}>Prompt: <strong style={{ color: '#fff' }}>{state.room.roundInfo.promptText}</strong></p>
        </div>
        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: secondsRemaining <= 10 ? '#ef4444' : 'inherit' }}>
          {secondsRemaining}s
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 20 }}>
        {drawings.map(([playerId, dataUrl]) => {
          const playerName = state.players[playerId]?.name || playerId;
          return (
            <div key={playerId} style={{ border: '1px solid #555', padding: 10, textAlign: 'center' }}>
              <img src={dataUrl} alt={`Drawing by ${playerName}`} style={{ width: 300, height: 225, objectFit: 'contain', backgroundColor: '#2a2a2a' }} />
              <div style={{ marginTop: 10, fontWeight: 'bold' }}>Drawn by: {playerName}</div>
              
              {playerId !== localPlayerId && (
                <div style={{ marginTop: 10 }}>
                  <Button variant="primary" onClick={() => {
                    onSubmitVote(localPlayerId, playerId);
                    setHasVoted(true);
                  }}>Vote</Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

