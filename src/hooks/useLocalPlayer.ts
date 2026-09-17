import { useState } from 'react';

export interface LocalPlayer {
  id: string;
  name: string;
  avatarColor: string;
}

const generateId = () => {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2, 15);
};

const defaultColors = ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93'];
const getRandomColor = () => defaultColors[Math.floor(Math.random() * defaultColors.length)];

export function useLocalPlayer() {
  const [player, setPlayer] = useState<LocalPlayer>(() => {
    const saved = localStorage.getItem('sketchvote_player');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    
    const newPlayer = {
      id: generateId(),
      name: '',
      avatarColor: getRandomColor()
    };
    localStorage.setItem('sketchvote_player', JSON.stringify(newPlayer));
    return newPlayer;
  });

  const updatePlayer = (updates: Partial<LocalPlayer>) => {
    setPlayer(prev => {
      const next = { ...prev, ...updates };
      localStorage.setItem('sketchvote_player', JSON.stringify(next));
      return next;
    });
  };

  return { player, updatePlayer };
}
