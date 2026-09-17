import { SharedGameState, GamePhase } from './types';

export function startGame(state: SharedGameState): SharedGameState {
  const playerIds = Object.keys(state.players);
  if (playerIds.length === 0) return state;

  const nextPrompterId = playerIds[0];

  return {
    ...state,
    room: {
      ...state.room,
      phase: 'PROMPT_PHASE',
      roundInfo: {
        ...state.room.roundInfo,
        currentBigRound: 1,
        currentPrompterId: nextPrompterId,
        promptedPlayerIds: [nextPrompterId],
        promptText: null,
        phaseStartedAt: Date.now()
      }
    },
    round: { drawings: {}, votes: {}, submittedPlayerIds: [] }
  };
}

export function advancePhase(state: SharedGameState): SharedGameState {
  const currentPhase = state.room.phase;
  let nextPhase: GamePhase = currentPhase;
  let { room, round } = state;
  let newRoundInfo = { ...room.roundInfo };
  let newRoundData = { ...round };

  switch (currentPhase) {
    case 'PROMPT_PHASE':
      nextPhase = 'DRAW_PHASE';
      break;
    case 'DRAW_PHASE':
      nextPhase = 'VOTE_PHASE';
      break;
    case 'VOTE_PHASE':
      nextPhase = 'SCORE_PHASE';
      // Calculate scores
      const newPlayers = { ...state.players };
      for (const [_voterId, votedForId] of Object.entries(round.votes)) {
        if (newPlayers[votedForId]) {
          newPlayers[votedForId] = {
            ...newPlayers[votedForId],
            score: newPlayers[votedForId].score + 10 // Arbitrary 10 points per vote
          };
        }
      }
      return {
        ...state,
        players: newPlayers,
        room: {
          ...room,
          phase: nextPhase,
          roundInfo: { ...newRoundInfo, phaseStartedAt: Date.now() }
        }
      };
    case 'SCORE_PHASE':
      const playerIds = Object.keys(state.players);
      const remainingPrompters = playerIds.filter(
        (id) => !newRoundInfo.promptedPlayerIds.includes(id)
      );

      if (remainingPrompters.length > 0) {
        // Next prompter in current big round
        const nextPrompterId = remainingPrompters[0];
        nextPhase = 'PROMPT_PHASE';
        newRoundInfo = {
          ...newRoundInfo,
          currentPrompterId: nextPrompterId,
          promptedPlayerIds: [...newRoundInfo.promptedPlayerIds, nextPrompterId],
          promptText: null
        };
        newRoundData = { drawings: {}, votes: {}, submittedPlayerIds: [] };
      } else {
        // End of big round
        if (newRoundInfo.currentBigRound < room.settings.maxBigRounds) {
          // Next big round
          const nextPrompterId = playerIds[0];
          nextPhase = 'PROMPT_PHASE';
          newRoundInfo = {
            ...newRoundInfo,
            currentBigRound: newRoundInfo.currentBigRound + 1,
            currentPrompterId: nextPrompterId,
            promptedPlayerIds: [nextPrompterId],
            promptText: null
          };
          newRoundData = { drawings: {}, votes: {}, submittedPlayerIds: [] };
        } else {
          // End game
          nextPhase = 'END_GAME';
        }
      }
      break;
    case 'END_GAME':
      nextPhase = 'LOBBY';
      break;
    default:
      break;
  }

  return {
    ...state,
    room: {
      ...room,
      phase: nextPhase,
      roundInfo: { ...newRoundInfo, phaseStartedAt: Date.now() }
    },
    round: newRoundData
  };
}

export function submitPrompt(state: SharedGameState, promptText: string): SharedGameState {
  return {
    ...state,
    room: {
      ...state.room,
      roundInfo: {
        ...state.room.roundInfo,
        promptText
      }
    }
  };
}

export function submitDrawing(state: SharedGameState, playerId: string, drawingDataUrl: string): SharedGameState {
  return {
    ...state,
    round: {
      ...state.round,
      drawings: {
        ...state.round.drawings,
        [playerId]: drawingDataUrl
      },
      submittedPlayerIds: [...state.round.submittedPlayerIds, playerId]
    }
  };
}

export function submitVote(state: SharedGameState, voterId: string, votedForId: string): SharedGameState {
  return {
    ...state,
    round: {
      ...state.round,
      votes: {
        ...state.round.votes,
        [voterId]: votedForId
      }
    }
  };
}
