/**
 * Global Constants
 */

// ----------------------------------------------------------------------
// Timers and Delays
// ----------------------------------------------------------------------

export const DRAW_TIMER_SECONDS = 90;
export const VOTE_TIMER_SECONDS = 30;

// Removed PHASE_TRANSITION_GRACE_PERIOD_MS because the Host no longer forcefully cuts off phases.

/**
 * PLAYER_REGISTRATION_RETRY_INTERVAL_MS
 * 
 * Where: Used in `App.tsx` on initial mount for `tryRegister`.
 * 
 * Why: `@playhtml/react` operates as a global singleton. Calling `setState` mutators before 
 * the Yjs WebSocket handshake completes causes the mutations to silently drop (no-op). 
 * This recurring interval continuously attempts to inject the local player into the globally 
 * synced state every 500ms until it verifies the mutation succeeded.
 */
export const PLAYER_REGISTRATION_RETRY_INTERVAL_MS = 500;

/**
 * LEAVE_ROOM_TIMEOUT_MS
 * 
 * Where: Used in `App.tsx` in `handleLeaveRoom`.
 * 
 * Why: When a player clicks "Leave Room", they optimistically delete themselves from the Yjs state
 * using a mutator, and then change the URL to navigate home. Because changing the URL immediately 
 * tears down the `playhtml` WebSocket context, the mutation often doesn't have time to flush over 
 * the network. This 500ms delay guarantees the network packet is sent before the socket is killed.
 */
export const LEAVE_ROOM_TIMEOUT_MS = 500;

// ----------------------------------------------------------------------
// Scoring
// ----------------------------------------------------------------------

/**
 * VOTE_SCORE_INCREMENT
 * 
 * Where: Used by the Host in `App.tsx` during `VOTE_PHASE` transition.
 * 
 * Why: The amount of points awarded to a player for each vote their drawing receives.
 */
export const VOTE_SCORE_INCREMENT = 10;

// ----------------------------------------------------------------------
// Canvas Details
// ----------------------------------------------------------------------

/**
 * CANVAS_WIDTH / CANVAS_HEIGHT
 * 
 * Where: Used in `DrawingCanvas.tsx` to set the internal DOM resolution.
 * 
 * Why: We lock the internal rendering resolution to a 4:3 800x600 grid so that 
 * drawings are identical across all clients, regardless of device screen size.
 * CSS `object-fit: contain` handles scaling it up/down visually.
 */
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

export const CANVAS_BG_COLOR = '#fcfcfc'; // Note: matches both init and clear
export const CANVAS_FALLBACK_BG_COLOR = '#fffefe';

// Host no longer assigns blanks.
