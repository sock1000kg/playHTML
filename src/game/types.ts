import { DRAW_TIMER_SECONDS, VOTE_TIMER_SECONDS } from './constants';

export type GamePhase =
  | 'LOBBY'
  | 'PROMPT_PHASE'
  | 'DRAW_PHASE'
  | 'VOTE_PHASE'
  | 'SCORE_PHASE'
  | 'END_GAME';

export interface RoomState {
  roomCode: string;
  hostId: string;
  phase: GamePhase;
  settings: {
    maxBigRounds: number;
    drawTimerSeconds: number;
    voteTimerSeconds: number;
  };
  roundInfo: {
    currentBigRound: number;
    currentPrompterId: string | null;
    promptText: string | null;
    promptedPlayerIds: string[];
    phaseStartedAt: number | null;
  };
}

export interface Player {
  id: string;
  name: string;
  score: number;
  avatarColor: string;
  isConnected: boolean;
}

export interface RoundData {
  drawings: Record<string, string>;
  votes: Record<string, string>;
  submittedPlayerIds: string[];
}

export interface SharedGameState {
  room: RoomState;
  players: Record<string, Player>;
  round: RoundData;
}

export const defaultSharedState: SharedGameState = {
  room: {
    roomCode: '',
    hostId: '',
    phase: 'LOBBY',
    settings: {
      maxBigRounds: 2,
      drawTimerSeconds: DRAW_TIMER_SECONDS,
      voteTimerSeconds: VOTE_TIMER_SECONDS
    },
    roundInfo: {
      currentBigRound: 1,
      currentPrompterId: null,
      promptText: null,
      promptedPlayerIds: [],
      phaseStartedAt: null
    }
  },
  players: {},
  round: {
    drawings: {},
    votes: {},
    submittedPlayerIds: []
  }
};

