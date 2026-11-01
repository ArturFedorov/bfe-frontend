import {ReactElement, useEffect, useState} from 'react';

export interface LastUpdatedClockProps {
  /** Epoch milliseconds of the last successful refresh. */
  updatedAt: number;
  /** How often to re-render the elapsed time. Defaults to 1000 ms. */
  tickMs?: number;
}

export function LastUpdatedClock({
  updatedAt,
  tickMs = 1000,
}: LastUpdatedClockProps): ReactElement {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now), tickMs);

    return () => clearInterval(timer);
  }, [tickMs]);

  const elapsedSeconds = Math.max(0, Math.floor((now - updatedAt )/ 1000));
  return (
    <div role="timer">
      Updated {elapsedSeconds}s ago
    </div>
  )
}
