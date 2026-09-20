import React from 'react';
import { SharedGameState } from '../game/types';
import { LobbyView } from '../components/phase/LobbyView';
import { PromptView } from '../components/phase/PromptView';
import { DrawView } from '../components/phase/DrawView';
import { VoteView } from '../components/phase/VoteView';
import { ScoreView } from '../components/phase/ScoreView';

interface GameScreenProps {
  state: SharedGameState;
  localPlayerId: string;
  onLeaveRoom: () => void;
  onAdvancePhase: () => void;
  onSubmitPrompt: (text: string) => void;
  onSubmitDrawing: (playerId: string, dataUrl: string) => void;
  onSubmitVote: (voterId: string, votedForId: string) => void;
}

export const GameScreen: React.FC<GameScreenProps> = (props) => {
  const { state } = props;
  const phase = state.room.phase;

  let content = null;
  switch (phase) {
    case 'LOBBY':
      content = <LobbyView state={state} localPlayerId={props.localPlayerId} onAdvance={props.onAdvancePhase} onLeaveRoom={props.onLeaveRoom}/>;
      break;
    case 'PROMPT_PHASE':
      content = <PromptView state={state} localPlayerId={props.localPlayerId} onSubmitPrompt={props.onSubmitPrompt} />;
      break;
    case 'DRAW_PHASE':
      content = <DrawView state={state} localPlayerId={props.localPlayerId} onSubmitDrawing={props.onSubmitDrawing} />;
      break;
    case 'VOTE_PHASE':
      content = <VoteView state={state} localPlayerId={props.localPlayerId} onSubmitVote={props.onSubmitVote} />;
      break;
    case 'SCORE_PHASE':
      content = <ScoreView state={state} onAdvance={props.onAdvancePhase} />;
      break;
    default:
      content = <div>Unknown phase: {phase}</div>;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 200px', height: '100dvh' }}>
      <div style={{ borderRight: '1px solid #333', padding: 10, display: 'flex', flexDirection: 'column' }}>
        <h3>Tools</h3>
        {/* mock tools */}
        
        <div style={{ marginTop: 'auto', background: '#333', padding: 10, fontSize: '0.8rem', borderRadius: 4 }}>
          <strong>DEBUG INFO</strong><br/>
          My ID: {props.localPlayerId}<br/>
          Host ID: {state.room.hostId}
        </div>
      </div>
      <div style={{ padding: 20, overflow: 'auto' }}>
        {content}
      </div>
      <div style={{ borderLeft: '1px solid #333', padding: 10 }}>
        {state.room.roundInfo.currentBigRound > 0 && (
          <h3>Round: {state.room.roundInfo.currentBigRound}</h3>
        )}

        <h3>Leaderboard</h3>
        {Object.values(state.players).map(p => (
          <div key={p.id}>{p.name}: {p.score}</div>
        ))}
      </div>
    </div>
  );
};

