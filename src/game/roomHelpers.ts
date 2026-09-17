export function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function getRoomCodeFromUrl(): string | null {
  const hash = window.location.hash;
  if (hash && hash.length > 1) {
    return hash.substring(1).toUpperCase();
  }
  return null;
}

export function setRoomCodeInUrl(code: string): void {
  window.location.hash = code;
}

export function isHost(playerId: string, hostId: string): boolean {
  return playerId === hostId;
}

