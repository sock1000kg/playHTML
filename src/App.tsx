import React, { useState, useEffect } from 'react';
import { PlayProvider, usePlayContext } from '@playhtml/react';
import { getRoomCodeFromUrl, setRoomCodeInUrl, generateRoomCode } from './game/roomHelpers';
import { HomeScreen } from './screens/HomeScreen';
import { GameScreen } from './screens/GameScreen';
import { EndScreen } from './screens/EndScreen';
import { GameStateProvider, useSharedGameState } from './hooks/useSharedGameState';
import { useLocalPlayer } from './hooks/useLocalPlayer';
import { startGame, advancePhase, submitPrompt, submitDrawing, submitVote } from './game/StateMachine';
import { defaultSharedState } from './game/types';

const GameContainer: React.FC = () => {
  const { state, setState } = useSharedGameState();
  const { player } = useLocalPlayer();
  const { isLoading } = usePlayContext();
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (isLoading || !player.name || isLeaving) return;
    if (!state.players) return;

    const me = state.players[player.id];
    if (me && me.name === player.name && me.avatarColor === player.avatarColor) return;

    const tryRegister = () => {
      setState(draft => {
        if (!draft.players) draft.players = {};
        if (!draft.room) draft.room = { ...defaultSharedState.room };

        // Auto-assign host: if the room has no host, the first person to sync claims it.
        // This solves the bug where the host is lost upon page reload.
        if (!draft.room.hostId) {
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
          draft.players[player.id].isConnected = true; 
        }
        if (!draft.room.roomCode) draft.room.roomCode = getRoomCodeFromUrl() || '';
      });
    };

    tryRegister();
    const timer = setInterval(tryRegister, 500);
    return () => clearInterval(timer);
  }, [isLoading, isLeaving, state.players, player.id, player.name, player.avatarColor, setState]);

  const handleAdvance = () => {
    if (state.room?.phase === 'LOBBY') {
      const isHost = !state.room.hostId || state.room.hostId === player.id;
      const nextState = startGame(state);
      if (isHost) {
        nextState.room.hostId = player.id;
      }
      setState(nextState);
    } else {
      setState(advancePhase(state));
    }
  };

  const handleLeaveRoom = () => {
    setIsLeaving(true);
    setState(draft => {
      delete draft.players[player.id];
    });
    
    // Allow the mutation to flush over WebSocket before the page reload severs it
    setTimeout(() => {
      setRoomCodeInUrl('');
    }, 500);
  };

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
      onSubmitPrompt={(text) => setState(advancePhase(submitPrompt(state, text)))}
      onSubmitDrawing={(id, dataUrl) => setState(submitDrawing(state, id, dataUrl))}
      onSubmitVote={(voter, voted) => setState(submitVote(state, voter, voted))}
    />
  );
};

// Waits for PlayProvider to mount before rendering GameStateProvider
const RoomGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoading } = usePlayContext();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#111827', color: 'white' }}>
        <p>Connecting to room...</p>
      </div>
    );
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  // Read initial room code on mount. We don't need a setter because we reload on change 
  // -> Hack to go around playHTML's race conditions.
  const [roomCode] = useState<string | null>(getRoomCodeFromUrl());
  const { player, updatePlayer } = useLocalPlayer();

  useEffect(() => {
    const handleHashChange = () => {
      // Manual reload hack: forces playhtml to initialize cleanly on the new room
      // and completely bypasses the 'createPageData is not available before init' race condition.
      window.location.reload();
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <PlayProvider 
      initOptions={{ room: () => getRoomCodeFromUrl() || 'lobby' }}
      pathname={roomCode || 'home'}
    >
      {!roomCode ? (
        <HomeScreen 
          playerName={player.name}
          onNameChange={(name) => updatePlayer({ name })}
          onStartLocal={() => {
            if (!player.name) updatePlayer({ name: 'Host' });
            setRoomCodeInUrl(generateRoomCode());
          }} 
        />
      ) : (
        <RoomGate>
          <GameStateProvider>
            <GameContainer />
          </GameStateProvider>
        </RoomGate>
      )}
    </PlayProvider>
  );
};

export default App;