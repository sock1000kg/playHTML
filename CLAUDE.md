# Sketchvote — Multiplayer Drawing & Voting Game

> **CRITICAL INSTRUCTION FOR AI:** Keep this file up-to-date as you implement features. Update the checklist, state machine, and any data-model changes as they happen.

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

1. **Single shared state via `@playhtml/react`**. The entire game state lives in one `withSharedState`-wrapped component (or a custom `useSharedGameState` hook). All clients react to the same object reactively.
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
// src/hooks/useSharedGameState.ts
import { withSharedState } from '@playhtml/react';

const defaultState: SharedGameState = {
  room: { ... },
  players: {},
  round: { drawings: {}, votes: {}, submittedPlayerIds: [] },
};

// Wrap the root provider:
export const GameStateProvider = withSharedState(
  { defaultData: defaultState },
  ({ data, setData, children }) => (
    <GameStateContext.Provider value={{ state: data, setState: setData }}>
      {children}
    </GameStateContext.Provider>
  )
);

// In PlayProvider, set room={roomCode} to silo per game room:
<PlayProvider room={roomCode}>
  <GameStateProvider>
    <App />
  </GameStateProvider>
</PlayProvider>
```

> **Important**: `setData` performs a **full replace** of the shared object. Always spread to merge:  
> `setData(prev => ({ ...prev, room: { ...prev.room, phase: 'DRAW_PHASE' } }))`

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

### Phase 1 — Project Bootstrap ✅
- [ ] Install dependencies: `react`, `react-dom`, `@playhtml/react`, `playhtml`, `@vitejs/plugin-react`
- [ ] Install dev deps: `@types/react`, `@types/react-dom`, TypeScript
- [ ] Configure `vite.config.ts` with `@vitejs/plugin-react`
- [ ] Configure `tsconfig.json` (strict, jsx: react-jsx)
- [ ] Set up `src/main.tsx` with AudioManager init on first gesture
- [ ] Define `global.css` with CSS custom properties, reduced-motion queries, View Transitions
- [ ] Create `src/game/types.ts` with all interfaces and defaults
- [ ] Create `src/game/roomHelpers.ts` (generateRoomCode, isHost, URL hash helpers)

### Phase 2 — Shared State Foundation ✅
- [ ] Implement `useSharedGameState.tsx` using `usePageData` from `@playhtml/react`
- [ ] Implement `useLocalPlayer.ts` hook (localStorage: UUID, name, color)
- [ ] Implement `StateMachine.ts` (pure transition functions)
- [ ] Implement `useTimer.ts` hook (derived from `phaseStartedAt`)

### Phase 3 — UI Scaffolding + Screen Routing ✅
- [ ] Build `App.tsx` with phase-based screen router + `document.startViewTransition()`
- [ ] Build `HomeScreen.tsx` (create room, join room, name + settings input)
- [ ] Build `GameScreen.tsx` (2-column CSS Grid layout, all phase dispatch)
- [ ] Build `EndScreen.tsx` (ranked player list, medal icons)
- [ ] Build `Leaderboard.tsx`, `TimerBar.tsx`, `PlayerAvatar.tsx`

### Phase 4 — Drawing Engine ✅
- [ ] Build `DrawingCanvas.tsx` (Pointer Events, `setPointerCapture`, `quadraticCurveTo` smoothing)
- [ ] Fixed 800×600 internal resolution with CSS scaling (no ResizeObserver needed)
- [ ] Build `Toolbar.tsx` (12 colors, 4 brush sizes, clear button)
- [ ] Implement base64 export via `canvas.toDataURL('image/png')`

### Phase 5 — Phase UIs & Gameplay Loop ✅
- [ ] `LobbyView.tsx`: player list, host settings, Start button, room code display
- [ ] `PromptView.tsx`: prompter text input, waiting screen for others
- [ ] `DrawView.tsx`: canvas + prompt label + timer, auto-submit on timer end
- [ ] `VoteView.tsx`: drawing gallery grid, vote button (disabled after vote; hidden for own drawing)
- [ ] `ScoreView.tsx`: vote tally with thumbnails, host auto-advances after 5s

### Phase 6 — End Game & Audio Scaffold ✅
- [ ] `EndScreen.tsx`: final ranking display with medals, winner highlight, host controls
- [ ] Scaffold `AudioManager.ts` (Web Audio API, lazy init, SFX/BGM stubs, volume in localStorage)
- [ ] Scaffold `SettingsMenu.tsx` (volume sliders wired to AudioManager)
- [ ] `prefers-reduced-motion` CSS overrides applied in global.css

### Phase 7 — Audio (Future)
- [ ] Load and cache sound assets
- [ ] Wire SFX calls at correct game events (`audioManager.playSfx(...)`)
- [ ] Wire BGM transitions (`audioManager.playBgm(...)`)

---

## 12. Key Open Questions / Design Decisions

> Update or resolve these as the project progresses.

1. **playhtml persistence**: `@playhtml/react` persists state by default. For a game room, we want state to reset when a new game starts. Strategy: on "Play Again", Host resets the shared state to a fresh default. Room codes should be ephemeral (new code = new room key).
2. **Self-voting**: Voters should not be able to vote for their own drawing. Enforce in `VoteView` by disabling/hiding the vote button on the local player's drawing.
3. **Disconnection handling**: When a player disconnects mid-game, `isConnected: false` is set. Host auto-skips disconnected players in PROMPT_PHASE. Votes for disconnected players are still valid (their drawing remains).
4. **Canvas sync size**: Drawing canvas internal resolution should be fixed (e.g., 800×600) regardless of display size, so base64 exports are consistent across devices.
5. **Timer drift**: Server timestamps aren't used; `Date.now()` can drift between clients. For casual gameplay this is acceptable. If precision matters, switch to PartyKit server-side timer in a future iteration.
