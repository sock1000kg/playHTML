> **CRITICAL INSTRUCTION FOR AI:** Keep this file up-to-date as you implement features. Update the checklist, state machine, and any data-model changes as they happen.
> Read `CLAUDE.md` for project architecture and milestones before making changes.

---

# @playhtml/react Quirks and Rules

## Room Switching and Singleton Persistence

`@playhtml/react` operates as a **global singleton** in the browser window context. If you pass a static string to `initOptions.room`, the library locks its internal WebSocket connection to that room on mount and silently ignores future changes to the prop.

**The Fix (Dynamic Room Navigation):** 
To properly switch rooms in a Single Page Application without forcing a hard page reload, you must use `playhtml`'s documented navigation handling:

1. Pass a function to `initOptions.room` that dynamically resolves the room ID.
2. Pass a `pathname` prop to `<PlayProvider>` that changes whenever the room changes.

Because our app uses a hash-based router (`window.location.hash`) rather than real URL paths, the browser's pathname never changes. We can manually trigger `PlayProvider`'s navigation handling by feeding our `roomCode` state directly into the `pathname` prop!

```tsx
<PlayProvider 
  initOptions={{ 
    // Evaluated dynamically by playhtml when handleNavigation() fires
    room: () => getRoomCodeFromUrl() || "lobby" 
  }}
  // Whenever this prop changes, PlayProvider calls playhtml.handleNavigation()
  pathname={roomCode || "home"}
>
  <App />
</PlayProvider>
```

When `pathname` changes, `playhtml` will internally tear down the current document, invoke the `room()` function to get the new room ID, and reconnect gracefully!

*(Note: When leaving a room, if you are optimistically deleting a player from state, you should still use a small `setTimeout` before changing the URL hash to ensure the mutation flushes over the WebSocket before `handleNavigation()` severs the connection).*

## `usePageData` and `isLoading` No-Op Quirk

When using the `usePageData` hook from `@playhtml/react` to manage shared state, the returned `setData` mutator function will **silently no-op** if it is called before the `playhtml` WebSocket/Yjs handshake completes.

**The Issue:**
Calling `setData` (e.g., to register a local player) inside a `useEffect` on component mount will usually run before `playhtml` has finished syncing. The mutation will be ignored, resulting in missing data (e.g., the player never joins the room or state is blank).

The `isLoading` flag from `usePlayContext()` is helpful, but `setData` can still fail silently immediately after it flips. The safest approach is a **self-healing retry loop** inside the `useEffect` that continuously attempts the registration until the player successfully appears in the synced state.

```tsx
import { usePageData, usePlayContext } from '@playhtml/react';

const { isLoading } = usePlayContext();
const [state, setState] = usePageData('game-state', defaultState);

useEffect(() => {
  if (isLoading) return; 
  if (state.players[myId]) return; // Successfully registered!

  const tryRegister = () => {
    setState(draft => {
      draft.players[myId] = { id: myId, name: myName };
    });
  };

  tryRegister();
  const timer = setInterval(tryRegister, 500);
  return () => clearInterval(timer);
}, [isLoading, state.players, myId, myName, setState]); 
```

## State Mutations with SyncedStore (Yjs)
Because `playhtml` uses SyncedStore/Yjs under the hood, you cannot mix React immutable state updates (spreading/returning new objects) with SyncedStore proxy mutations (modifying the draft). 

Pick one approach and stick to it consistently:

### Approach 1: The Mutator Form (Recommended for fine-grained updates)
Mutate the `draft` directly. **DO NOT** use `Object.assign` to merge a freshly generated state object back into the `draft`, and **DO NOT** spread proxy objects (`...draft.players`). Assigning a live SyncedStore proxy back into itself will cause the CRDT to silently crash or abort the update.

```tsx
// CORRECT
setState(draft => {
  draft.room.phase = 'PROMPT_PHASE';
  draft.players[myId].score += 10;
});

// FATAL ERROR (Self-assigning proxies)
setState(draft => {
  const nextState = { ...draft, room: { phase: 'PROMPT_PHASE' } };
  Object.assign(draft, nextState); 
});
```

### Approach 2: The Value Form (For full state replacement / pure functions)
If you have pure functions (e.g. `StateMachine.ts`) that take a state and return a completely new immutable object, bypass the `draft` mutator entirely. Pass the returned object directly to `setState(value)`. `@playhtml/react`'s `usePageData` natively supports this and will perform a canonical diff-and-replace to sync the new snapshot over the network.

```tsx
// CORRECT
const handleAdvance = () => {
  const nextState = startGame(state); // pass the read-only snapshot
  setState(nextState); // pass value directly!
};
```

