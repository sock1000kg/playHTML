import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './global.css';
// removed PlayProvider
import { audioManager } from './audio/AudioManager.ts';

// Auto-init audio on first gesture
function initAudio() {
  audioManager.init();
  document.removeEventListener('pointerdown', initAudio);
  document.removeEventListener('keydown', initAudio);
}
document.addEventListener('pointerdown', initAudio);
document.addEventListener('keydown', initAudio);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
