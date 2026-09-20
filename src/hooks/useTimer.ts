import { useState, useEffect } from 'react';

export function useTimer(startTimeMs: number | null, durationSeconds: number) {
  const [secondsRemaining, setSecondsRemaining] = useState(durationSeconds);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!startTimeMs) {
      setSecondsRemaining(durationSeconds);
      setIsExpired(false);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const elapsedMs = now - startTimeMs;
      const elapsedSeconds = Math.floor(elapsedMs / 1000);
      const remaining = Math.max(0, durationSeconds - elapsedSeconds);
      
      setSecondsRemaining(remaining);
      
      if (remaining <= 0) {
        setIsExpired(true);
      } else {
        setIsExpired(false);
      }
    };

    // Initial call
    updateTimer();

    // Set interval to update every second
    const intervalId = setInterval(updateTimer, 500); // 500ms for more responsive updates

    return () => clearInterval(intervalId);
  }, [startTimeMs, durationSeconds]);

  return { secondsRemaining, isExpired };
}

