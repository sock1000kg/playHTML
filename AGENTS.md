> **CRITICAL INSTRUCTION FOR AI:** Keep this file up-to-date as you implement features. Update the checklist, state machine, and any data-model changes as they happen.
> Read `CLAUDE.md` for project architecture and milestones before making changes.

---

# @playhtml/react Quirks and Rules

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

