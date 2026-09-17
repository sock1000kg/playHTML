import React, { useState, useEffect } from 'react';
import { PlayProvider, usePlayContext } from '@playhtml/react';
import { getRoomCodeFromUrl, setRoomCodeInUrl, generateRoomCode } from './game/roomHelpers';
import { HomeScreen } from './screens/HomeScreen';
import { GameScreen } from './screens/GameScreen';
import { EndScreen } from './screens/EndScreen';
import { GameStateProvider, useSharedGameState } from './hooks/useSharedGameState';
import { useLocalPlayer } from './hooks/useLocalPlayer';
import { startGame, advancePhase, submitPrompt, submitDrawing, submitVote } from './game/StateMachine';
import { defaultSharedState, SharedGameState } from './game/types';

const GameContainer: React.FC = () => {
  const { state, setState } = useSharedGameState();
  const { player } = useLocalPlayer();
  const { isLoading } = usePlayContext();
  const [ isLeaving, setIsLeaving ]  = useState(false)

  // Self-healing registration: playhtml's setData can silently no-op during early connection phases.
  // We retry registration until the player successfully appears in the synced state.
  useEffect(() => {
    if (isLoading || !player.name || isLeaving) return;
    
    // If we are already fully registered in the shared state, we're done!
    const me = state.players[player.id];
    if (me && me.name === player.name && me.avatarColor === player.avatarColor) return;

    const tryRegister = () => {
      setState(draft => {
        const isFirst = Object.keys(draft.players).length === 0;
        if (isFirst && !draft.room.hostId) {
          draft.room.hostId = player.id;
        }
        if (!draft.players[player.id]) {
          draft.players[player.id] = {
            id: player.id,
            name: player.name,
            score: 0,
            avatarColor: player.avatarColor,
            isConnected: true
          };
        } else {
          draft.players[player.id].name = player.name;
          draft.players[player.id].avatarColor = player.avatarColor;
        }
      });
    };

    // Try immediately
    tryRegister();

    // Retry periodically in case it no-opped
    const timer = setInterval(tryRegister, 500);
    return () => clearInterval(timer);
  }, [isLoading, isLeaving, state.players, player.id, player.name, player.avatarColor, setState]);

  const handleAdvance = () => {
    setState(draft => {
      if (draft.room.phase === 'LOBBY') {
        const isHost = !draft.room.hostId || draft.room.hostId === player.id;
        const nextState = startGame(draft as SharedGameState);
        if (isHost) {
          nextState.room.hostId = player.id;
        }
        Object.assign(draft, nextState);
      } else {
        Object.assign(draft, advancePhase(draft as SharedGameState));
      }
    });
  };

  const handleLeaveRoom = () => {
    setState(draft => {
      setIsLeaving(true)
      
      delete draft.players[player.id]
    })
  }

  const handlePlayAgain = () => {
    setState(draft => {
      Object.assign(draft, {
        ...defaultSharedState,
        players: draft.players,
        room: {
          ...defaultSharedState.room,
          roomCode: draft.room.roomCode,
          hostId: draft.room.hostId
        }
      });
    });
  };

  if (state.room.phase === 'END_GAME') {
    return <EndScreen state={state} onPlayAgain={handlePlayAgain} />;
  }

  return (
    <GameScreen 
      state={state} 
      localPlayerId={player.id}
      onAdvancePhase={handleAdvance}
      onLeaveRoom={handleLeaveRoom}
      onSubmitPrompt={(text) => setState(draft => { Object.assign(draft, submitPrompt(draft as SharedGameState, text)); })}
      onSubmitDrawing={(id, dataUrl) => setState(draft => { Object.assign(draft, submitDrawing(draft as SharedGameState, id, dataUrl)); })}
      onSubmitVote={(voter, voted) => setState(draft => { Object.assign(draft, submitVote(draft as SharedGameState, voter, voted)); })}
    />
  );
};

const App: React.FC = () => {
  const [roomCode, setRoomCode] = useState<string | null>(getRoomCodeFromUrl());
  const { player, updatePlayer } = useLocalPlayer();

  useEffect(() => {
    const handleHashChange = () => {
      setRoomCode(getRoomCodeFromUrl());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (!roomCode) {
    return (
      <HomeScreen 
        playerName={player.name}
        onNameChange={(name) => updatePlayer({ name })}
        onStartLocal={() => {
          if (!player.name) updatePlayer({ name: 'Host' });
          setRoomCodeInUrl(generateRoomCode());
        }} 
      />
    );
  }

  return (
    <PlayProvider initOptions={{ room: roomCode }}>
      <GameStateProvider>
        <GameContainer />
      </GameStateProvider>
    </PlayProvider>
  );
};

export default App;
