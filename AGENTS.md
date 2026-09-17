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

## State Mutations with SyncedStore
Because `playhtml` uses SyncedStore/Yjs under the hood, if you pass a callback to `setData`, you must explicitly **mutate** the provided `draft` proxy. If you use pure React functions that return a completely new state object, you must map the new object onto the `draft` (e.g., using `Object.assign(draft, newState)`) or use the Value form `setData(newState)`.

Replacing a root proxy directly with a standard object using `draft = newState` or similar will fail to sync.

