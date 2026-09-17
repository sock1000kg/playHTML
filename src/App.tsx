import React from 'react';
import { defaultSharedState, SharedGameState } from './game/types';
import { startGame, advancePhase, submitPrompt, submitDrawing, submitVote } from './game/StateMachine';
import { HomeScreen } from './screens/HomeScreen';
import { GameScreen } from './screens/GameScreen';
import { EndScreen } from './screens/EndScreen';

const App: React.FC = () => {
  const [inGame, setInGame] = React.useState(false);
  const localPlayerId = 'player-1';
  
  const [state, setState] = React.useState<SharedGameState>({
    ...defaultSharedState,
    players: {
      'player-1': { id: 'player-1', name: 'Alice', score: 0, avatarColor: 'red', isConnected: true },
      'player-2': { id: 'player-2', name: 'Bob', score: 0, avatarColor: 'blue', isConnected: true }
    }
  });

  if (!inGame) {
    return <HomeScreen onStartLocal={() => setInGame(true)} />;
  }

  if (state.room.phase === 'END_GAME') {
    return (
      <EndScreen 
        state={state} 
        onPlayAgain={() => {
          setState({ ...defaultSharedState, players: state.players });
          setInGame(false);
        }} 
      />
    );
  }

  const handleAdvance = () => {
    setState(prevState => {
      if (prevState.room.phase === 'LOBBY') {
        return startGame(prevState);
      } else {
        return advancePhase(prevState);
      }
    });
  };

  return (
    <GameScreen 
      state={state} 
      localPlayerId={localPlayerId}
      onAdvancePhase={handleAdvance}
      onSubmitPrompt={(text) => setState(prev => submitPrompt(prev, text))}
      onSubmitDrawing={(id, dataUrl) => setState(prev => submitDrawing(prev, id, dataUrl))}
      onSubmitVote={(voter, voted) => setState(prev => submitVote(prev, voter, voted))}
    />
  );
};

export default App;

