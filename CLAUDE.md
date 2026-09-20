# Sketchvote — Multiplayer Drawing & Voting Game

> **CRITICAL INSTRUCTION FOR AI:** Keep this file up-to-date as you implement features. Update the checklist, state machine, and any data-model changes as they happen.
> Read `AGENTS.md` for workflow instructions and learning-mode guidance.

---

## 0. Browser Support Policy

**Target:** Baseline Widely Available + Newly Available (feature-detected with graceful degradation).

- **View Transitions API** (screen navigation): Use `document.startViewTransition()` with a functional fallback (bare DOM update) for browsers that don't support it. Baseline Newly Available since 2025-10-14.
- **Pointer Events API** (canvas drawing): Use `pointer*` events instead of `mouse*` + `touch*`. Baseline Widely Available.
- **Web Audio API** (AudioManager): Use for SFX/BGM. Widely available; lazy-initialize `AudioContext` on first user gesture.
- **`transition-behavior: allow-discrete`** (animate `display`): Baseline Widely Available. Use for show/hide phase overlays.

---

## 1. Tech Stack

| Concern | Tool |
|---|---|
| Language | TypeScript (strict) |
| UI Framework | React 18 + ReactDOM |
| Bundler | Vite |
| Multiplayer / Sync | `@playhtml/react` + `playhtml` |
| Graphics | HTML5 Canvas API (`<canvas>`) |
| Audio | Web Audio API (`AudioManager` wrapper) |
| Styling | Plain CSS (CSS custom properties, Grid, Flexbox) |

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────┐
│  React SPA (Vite)                                        │
│                                                          │
│  ┌──────────────┐   ┌───────────────────────────────┐   │
│  │ PlayProvider │   │  GameStateContext (React ctx)  │   │
│  │ (room=code)  │──▶│  useSharedState / withShared   │   │
│  └──────────────┘   └────────────┬──────────────────┘   │
│                                  │ shared state           │
│        ┌─────────────────────────▼──────────────────┐    │
│        │           App Router (phase-based)          │    │
│        │  HOME → LOBBY → PROMPT → DRAW → VOTE        │    │
│        │         → SCORE → [loop] → END_GAME         │    │
│        └───────┬──────────┬──────────┬──────────────┘    │
│                │          │          │                    │
│         HomeScreen   GameScreen  EndScreen               │
│                       ┌──┴──┐                            │
│                 LeftSidebar  RightSidebar                 │
│                 (tools)      (leaderboard)                │
│                 DrawingCanvas                             │
│                 PhaseOverlay                              │
└─────────────────────────────────────────────────────────┘
         │
         ▼ PartyKit sync (via @playhtml/react)
   All clients share the same RoomState object
```

### Key Architectural Decisions

1. **Single shared state via `@playhtml/react`**. The entire game state lives in a custom `useSharedGameState` hook powered by `usePageData`. This syncs data globally across the room channel without relying on DOM element binding. All clients react to the same object reactively.
2. **Host-driven transitions**. Only the client whose `playerId === roomState.hostId` may call `setData` to advance game phases. Other clients are read-only observers for state transitions.
3. **Room routing via URL hash**. Room codes are stored in `window.location.hash` (`#ABCD`). `PlayProvider` uses `room={roomCode}` to isolate the PartyKit channel.
4. **Canvas sync on submit**. Drawings are NOT streamed in real-time. On submission, each player exports their canvas as a Base64 PNG string and writes it to `roundData.drawings[playerId]`. This avoids flooding the sync channel.
5. **Screen transitions** via `document.startViewTransition()` (View Transitions API) with a no-animation fallback.

---

## 3. Game State Machine

All phases live in the shared `RoomState.phase` field. Only the **Host** writes to it.

```
                  ┌─────────────────────────────────────────────┐
                  │                                             │
                  ▼                                             │
[JOIN/CREATE] ──▶ LOBBY ──(host clicks Start)──▶ PROMPT_PHASE  │
                                                      │         │
                                     ┌────────────────┘         │
                                     ▼                          │
                               DRAW_PHASE                       │
                                     │                          │
                               (timer expires / all submit)     │
                                     ▼                          │
                               VOTE_PHASE                       │
                                     │                          │
                               (all voted or timer)             │
                                     ▼                          │
                               SCORE_PHASE                      │
                                     │                          │
                  ┌──────────────────┤                          │
                  │                  │                          │
                  │      (currentBigRound < maxBigRounds AND     │
                  │       players remain to prompt)             │
                  │                  └─────────────────────────▶│
                  │                  │ (big round complete)      │
                  │                  ▼                          │
                  │         (increment bigRound)                │
                  │                  │                          │
                  │  (bigRound >= maxBigRounds)                 │
                  │                  ▼                          │
                  └─────────── END_GAME ◀───────────────────────┘
                                     │
                             (host "Play Again")
                                     │
                                     ▼
                                  LOBBY
```

### Phase Descriptions

| Phase | Who acts | What happens |
|---|---|---|
| `LOBBY` | All (join); Host (start) | Show room code, player list, host settings, "Start Game" |
| `PROMPT_PHASE` | Prompter only | Selected player types a secret prompt; others wait |
| `DRAW_PHASE` | All | Prompt revealed; canvas enabled; countdown timer |
| `VOTE_PHASE` | All (except prompter) | Drawings displayed in a grid; each player votes once |
| `SCORE_PHASE` | Host (auto-advance) | Votes tallied; scores updated; next prompter selected |
| `END_GAME` | Host | Final rankings; "Play Again" or "Leave Room" |

---

## 4. Data Models (Shared via `@playhtml/react`)

All types live in `src/game/types.ts`.

### 4.1 Top-level Shared State

```typescript
interface SharedGameState {
  room: RoomState;
  players: Record<string, Player>;  // keyed by playerId
  round: RoundData;
}
```

### 4.2 `RoomState`

```typescript
type GamePhase =
  | 'LOBBY'
  | 'PROMPT_PHASE'
  | 'DRAW_PHASE'
  | 'VOTE_PHASE'
  | 'SCORE_PHASE'
  | 'END_GAME';

interface RoomState {
  roomCode: string;
  hostId: string;
  phase: GamePhase;
  settings: {
    maxBigRounds: number;
    drawTimerSeconds: number;  // e.g. 90
    voteTimerSeconds: number;  // e.g. 30
  };
  roundInfo: {
    currentBigRound: number;       // 1-indexed
    currentPrompterId: string | null;
    promptText: string | null;
    promptedPlayerIds: string[];   // who has prompted this big round
    phaseStartedAt: number | null; // Date.now() for timer sync
  };
}
```

### 4.3 `Player`

```typescript
interface Player {
  id: string;         // stable per-session ID (UUID)
  name: string;
  score: number;
  avatarColor: string; // CSS color string for avatar/cursor
  isConnected: boolean;
}
```

### 4.4 `RoundData` (reset every small round)

```typescript
interface RoundData {
  drawings: Record<string, string>;   // playerId → base64 PNG data URL
  votes: Record<string, string>;      // voterPlayerId → votedForPlayerId
  submittedPlayerIds: string[];       // who has submitted a drawing
}
```

---

## 5. `@playhtml/react` Integration Pattern

```tsx
// src/hooks/useSharedGameState.tsx
import React, { createContext, useContext } from 'react';
import { usePageData } from '@playhtml/react';
import { SharedGameState, defaultSharedState } from '../game/types';

interface GameStateContextType {
  state: SharedGameState;
  setState: (
    updater: SharedGameState | ((draft: SharedGameState) => void)
  ) => void;
}

const GameStateContext = createContext<GameStateContextType | null>(null);

export const GameStateProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [data, setData] = usePageData<SharedGameState>('game-state', defaultSharedState);

  return (
    <GameStateContext.Provider value={{ state: data, setState: setData }}>
      {children}
    </GameStateContext.Provider>
  );
};

// In PlayProvider, set room={roomCode} to silo per game room:
<PlayProvider initOptions={{ room: roomCode }}>
  <GameStateProvider>
    <App />
  </GameStateProvider>
</PlayProvider>
```

> **Important**: When mutating `setData` with a callback, explicitly mutate the `draft` proxy. When applying pure functions that return completely new state objects, use the Value form: `setState(newState)` directly to bypass the mutator entirely.

---

## 6. Folder Structure

```
d:\projects\playHTML\
├── index.html                    # Vite entry point
├── package.json
├── tsconfig.json
├── vite.config.ts
├── CLAUDE.md                     # ← this file
│
└── src/
    ├── main.tsx                  # React root, PlayProvider setup
    ├── App.tsx                   # Phase-based router (renders correct Screen)
    ├── global.css                # CSS custom properties, resets, typography
    │
    ├── game/
    │   ├── types.ts              # All shared interfaces (GamePhase, Player, etc.)
    │   ├── StateMachine.ts       # Pure functions: nextPhase(), nextPrompter()
    │   └── roomHelpers.ts        # generateRoomCode(), isHost(), etc.
    │
    ├── hooks/
    │   ├── useSharedGameState.ts # withSharedState HOC + GameStateContext
    │   ├── useLocalPlayer.ts     # localStorage: playerId, playerName, avatarColor
    │   └── useTimer.ts           # Countdown timer hook, synced via phaseStartedAt
    │
    ├── screens/
    │   ├── HomeScreen.tsx        # Join / Create room UI
    │   ├── GameScreen.tsx        # Main game layout (3-column)
    │   └── EndScreen.tsx         # Final rankings
    │
    ├── components/
    │   ├── canvas/
    │   │   ├── DrawingCanvas.tsx # <canvas> element, pointer events
    │   │   └── Toolbar.tsx       # Color palette + brush size picker
    │   ├── phase/
    │   │   ├── LobbyView.tsx     # Player list, settings, Start button
    │   │   ├── PromptView.tsx    # Prompter: text input; others: waiting
    │   │   ├── DrawView.tsx      # Canvas + prompt + timer
    │   │   ├── VoteView.tsx      # Drawing gallery + vote buttons
    │   │   └── ScoreView.tsx     # Animated score reveal
    │   ├── Leaderboard.tsx       # Right sidebar player scores list
    │   ├── TimerBar.tsx          # Visual countdown strip
    │   └── PlayerAvatar.tsx      # Colored circle + name
    │
    └── audio/
        ├── AudioManager.ts       # Web Audio API: load, play, volume control
        └── SettingsMenu.tsx      # SFX / BGM volume sliders (future)
```

---

## 7. UI Layout (Game Screen)

```
┌─────────────────────────────────────────────────────────────┐
│  Left Sidebar (200px)  │  Canvas Area (flex-1)  │  Right (200px) │
│  ─────────────────     │  ─────────────────────  │  ──────────── │
│  🎨 Color palette      │  [Prompt text at top]   │  🏆 Leaderboard│
│  ● ● ● ● ● ● ●        │                          │  Player 1 12  │
│                        │   <canvas>               │  Player 2 9   │
│  Brush Size            │   (full remaining height)│  ...          │
│  ○ ○ ○ ○              │                          │               │
│                        │  [Timer bar at bottom]  │               │
│                        │                          │  Room: ABCD   │
│                        │                          │  [Leave Game] │
└─────────────────────────────────────────────────────────────┘
```

- **Layout**: `display: grid; grid-template-columns: 200px 1fr 200px; height: 100dvh`
- **Canvas**: fills its column using `ResizeObserver` to keep internal resolution in sync with CSS size
- Sidebars scroll internally; canvas column does not scroll

---

## 8. Canvas Implementation Notes

- Use **Pointer Events** (`pointerdown`, `pointermove`, `pointerup`, `pointercancel`) — covers mouse, touch, and stylus uniformly
- Call `canvas.setPointerCapture(e.pointerId)` on `pointerdown` to track strokes that leave the canvas bounds
- Use `ctx.beginPath()` / `ctx.moveTo()` / `ctx.lineTo()` / `ctx.stroke()` for smooth paths
- For smooth curves, prefer `ctx.quadraticCurveTo()` with midpoints between sampled positions
- Use a `ResizeObserver` to update `canvas.width` / `canvas.height` to match `canvas.getBoundingClientRect()` — prevent coordinate mismatch
- Export: `canvas.toDataURL('image/png')` → base64 string stored in `roundData.drawings[playerId]`

---

## 9. Timer Synchronization

Because all clients observe the same shared state, timers are synced by storing `phaseStartedAt: Date.now()` (set by the Host when a phase begins). Each client then computes remaining time locally:

```ts
const elapsed = (Date.now() - state.room.roundInfo.phaseStartedAt) / 1000;
const remaining = Math.max(0, settings.drawTimerSeconds - elapsed);
```

The Host's `useTimer` hook watches `remaining === 0` and advances the phase automatically. The `useTimer` hook fires every second via `setInterval`.

---

## 10. AudioManager (Scaffolded — Phase 6)

```typescript
// src/audio/AudioManager.ts
class AudioManager {
  private ctx: AudioContext | null = null;  // lazy init on first gesture
  private gainSfx: GainNode;
  private gainBgm: GainNode;

  init(): void { /* create AudioContext, GainNodes */ }
  playSfx(name: 'vote' | 'draw_start' | 'timer_tick' | 'score'): void {}
  playBgm(name: 'lobby' | 'draw'): void {}
  setSfxVolume(v: number): void { this.gainSfx.gain.value = v; }
  setBgmVolume(v: number): void { this.gainBgm.gain.value = v; }
}
export const audioManager = new AudioManager();
```

Volumes persist in `localStorage` and are restored on load.

---

## 11. Implementation Checklist

### Milestone 0 — Contracts and Bootstrap ✅
- [x] Install dependencies (`react`, `@playhtml/react`, `vite`, `typescript`)
- [x] Configure Vite and TypeScript (`vite.config.ts`, `tsconfig.json`)
- [x] Create shared type definitions and defaults (`src/game/types.ts`)
- [x] Implement helper functions (`src/game/roomHelpers.ts`)

### Milestone 1 — Local Playable Flow ✅
- [x] Implement `StateMachine.ts` (pure transition functions)
- [x] Scaffold `App.tsx` phase router using mocked local state (no multiplayer yet)
- [x] Build basic UI for Prompt, Draw, Vote, Score, and End phases
- [x] Implement `DrawingCanvas.tsx` with basic pointer events and base64 export
- [x] Test a full loop locally as a single player

### Milestone 2 — Create and Join a Room ✅
- [x] Connect `@playhtml/react` (`PlayProvider` and `useSharedGameState.tsx`)
- [x] Build `HomeScreen.tsx` to generate room codes and update URL hash
- [x] Implement `LobbyView.tsx` showing connected players
- [x] Sync `useLocalPlayer.ts` (localStorage for UUID/name) with `SharedGameState.players`

### Milestone 3 — Shared Submissions
- [x] Connect `PromptView.tsx` to update shared state
- [x] Hook `DrawingCanvas.tsx` to auto-submit canvas base64 to shared state on timer end
- [x] Implement `useTimer.ts` derived from `phaseStartedAt` set by the Host
- [x] Ensure all clients sync into the `DRAW_PHASE` and submit together

### Milestone 4 — Voting and Results
- [x] Connect `VoteView.tsx` to display everyone's drawings from shared state
- [ ] Allow clients to vote and submit to `sharedState.round.votes`
- [ ] Ensure all clients sync into `SCORE_PHASE` when voting completes across all clients
- [ ] Host-driven state machine auto-advances phase

### Milestone 5 — End Game and Loop
- [ ] Build `EndScreen.tsx` to show final leaderboard
- [ ] Implement "Play Again" button (host only) to wipe `round` state but keep players. Implement "Leave room" button.
- [ ] Handle disconnection edge cases (`isConnected: false`)

### Milestone 6 — UI Polish and Audio (Future)
- [ ] Add drawing tools and color changes
- [ ] Improve styling, add view transitions, and reduced-motion fallbacks
- [ ] Scaffold `AudioManager.ts` and volume settings
- [ ] Wire sound effects for drawing, voting, ticking timer, and scoring

---

## 12. Key Open Questions / Design Decisions

> Update or resolve these as the project progresses.

1. **playhtml persistence**: `@playhtml/react` persists state by default. For a game room, we want state to reset when a new game starts. Strategy: on "Play Again", Host resets the shared state to a fresh default. Room codes should be ephemeral (new code = new room key).
2. **Self-voting**: Voters should not be able to vote for their own drawing. Enforce in `VoteView` by disabling/hiding the vote button on the local player's drawing.
3. **Disconnection handling**: When a player disconnects mid-game, `isConnected: false` is set. Host auto-skips disconnected players in PROMPT_PHASE. Votes for disconnected players are still valid (their drawing remains).
4. **Canvas sync size**: Drawing canvas internal resolution should be fixed (e.g., 800×600) regardless of display size, so base64 exports are consistent across devices.
5. **Timer drift**: Server timestamps aren't used; `Date.now()` can drift between clients. For casual gameplay this is acceptable. If precision matters, switch to PartyKit server-side timer in a future iteration.
