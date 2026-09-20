import React, { useState, useEffect } from 'react';
import { PlayProvider, usePlayContext } from '@playhtml/react';
import { getRoomCodeFromUrl, setRoomCodeInUrl, generateRoomCode } from './game/roomHelpers';
import { HomeScreen } from './screens/HomeScreen';
import { GameScreen } from './screens/GameScreen';
import { EndScreen } from './screens/EndScreen';
import { GameStateProvider, useSharedGameState } from './hooks/useSharedGameState';
import { useLocalPlayer } from './hooks/useLocalPlayer';
import { startGame, advancePhase, submitPrompt } from './game/StateMachine';
import { defaultSharedState } from './game/types';
import { 
  PLAYER_REGISTRATION_RETRY_INTERVAL_MS, 
  LEAVE_ROOM_TIMEOUT_MS, 
  VOTE_SCORE_INCREMENT 
} from './game/constants';

const GameContainer: React.FC = () => {
  const { state, setState } = useSharedGameState();
  const { player } = useLocalPlayer();
  const { isLoading } = usePlayContext();
  const [isLeaving, setIsLeaving] = useState(false);

  /**
   * Self-Healing Player Registration:
   * This effect continuously attempts to register the local player into the globally synced Yjs state.
   * We use a recurring `setInterval` because `@playhtml/react` mutators can silently fail or get dropped  
   * when `isLoading` turns false because the mutators fired during the split-second WebSocket handshake.
   * The loop automatically bails out on every tick once it verifies the player's data successfully made it into the synced state.
   */
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
    const timer = setInterval(tryRegister, PLAYER_REGISTRATION_RETRY_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [isLoading, isLeaving, state.players, player.id, player.name, player.avatarColor, setState]);

  const isHost = state.room?.hostId === player.id;

  const handleAdvance = () => {
    if (state.room?.phase === 'LOBBY') {
      const isHostLocal = !state.room.hostId || state.room.hostId === player.id;
      const nextState = startGame(state);
      if (isHostLocal) {
        nextState.room.hostId = player.id;
      }
      setState(nextState);
    } else {
      setState(advancePhase(state));
    }
  };

  // Phase Transition Orchestration:
  // We elect the Host to observe the synchronized array of submitted drawings or votes. 
  // Once all active players have submitted, the Host safely steps the StateMachine forward.
  // We strictly wait for `allSubmitted` (client-driven auto-submissions) instead of forcing
  // a timer transition to prevent clock-skew race conditions where the Host cuts off slower clients.
  useEffect(() => {
    if (!isHost) return;

    if (state.room?.phase === 'DRAW_PHASE') {
      const expected = Object.keys(state.players || {}).length; // Everyone draws
      const submitted = state.round?.submittedPlayerIds?.length || 0;
      const allSubmitted = submitted >= expected && expected > 0;
      
      if (allSubmitted) {
        setState(draft => {
          draft.room.phase = 'VOTE_PHASE';
          draft.room.roundInfo.phaseStartedAt = Date.now();
        });
      }
    }
    else if (state.room?.phase === 'VOTE_PHASE') {
      const expected = Object.keys(state.players || {}).length; 
      const submitted = Object.keys(state.round?.votes || {}).length;
      const allSubmitted = submitted >= expected && expected > 0;
      
      if (allSubmitted) {
        setState(draft => {
          for (const [_voterId, votedForId] of Object.entries(draft.round.votes || {})) {
            if (draft.players[votedForId]) {
              draft.players[votedForId].score = (draft.players[votedForId].score || 0) + VOTE_SCORE_INCREMENT;
            }
          }
          draft.room.phase = 'SCORE_PHASE';
          draft.room.roundInfo.phaseStartedAt = Date.now();
        });
      }
    }
  }, [state, isHost, setState]);

  const handleLeaveRoom = () => {
    setIsLeaving(true);
    setState(draft => {
      delete draft.players[player.id];
    });
    
    // Allow the mutation to flush over WebSocket before the page reload severs it
    setTimeout(() => {
      setRoomCodeInUrl('');
    }, LEAVE_ROOM_TIMEOUT_MS);
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
      onSubmitDrawing={(id, dataUrl) => setState(draft => {
        if (!draft.round.drawings) draft.round.drawings = {};
        draft.round.drawings[id] = dataUrl;
        if (!draft.round.submittedPlayerIds) draft.round.submittedPlayerIds = [];
        if (!draft.round.submittedPlayerIds.includes(id)) {
          draft.round.submittedPlayerIds.push(id);
        }
      })}
      onSubmitVote={(voter, voted) => setState(draft => {
        if (!draft.round.votes) draft.round.votes = {};
        draft.round.votes[voter] = voted;
      })}
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

  /**
   * Router/Navigation Race Condition Fix:
   * `@playhtml/react` has a severe bug where dynamically changing the room prop without a hard reload
   * causes it to crash with `createPageData is not available before init`. 
   * Since the app uses hash routing, we attach this listener. When the URL hash changes, we force 
   * a hard browser refresh, ensuring `playhtml` initializes cleanly with the new room code on mount.
   */
  useEffect(() => {
    const handleHashChange = () => {
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