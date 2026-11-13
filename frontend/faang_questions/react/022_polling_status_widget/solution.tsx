import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

export type IngestionStatus = 'queued' | 'processing' | 'succeeded' | 'failed';

export const TERMINAL_STATUSES: IngestionStatus[] = ['succeeded', 'failed'];

export interface PollingStatusWidgetProps {
  fetchStatus: () => Promise<IngestionStatus>;
  intervalMs?: number;
  maxIntervalMs?: number;
}

const isTerminal = (s: IngestionStatus): boolean => TERMINAL_STATUSES.includes(s);

/**
 * Settle-then-schedule polling.
 *
 * Instead of `setInterval` (which fires regardless of whether the previous
 * request finished), each poll awaits its response and only THEN arms a
 * single `setTimeout` for the next one. That gives us for free:
 *  - no overlapping requests, no out-of-order responses;
 *  - a natural place to pick the next delay (backoff on error, reset on
 *    success);
 *  - a natural place to stop (terminal status → simply don't re-arm).
 *
 * Everything the loop needs lives in the effect closure: a `cancelled` flag
 * flipped by the cleanup, the current timer handle, and the current delay.
 */
export function PollingStatusWidget({
  fetchStatus,
  intervalMs = 5000,
  maxIntervalMs = 60000,
}: PollingStatusWidgetProps): ReactNode {
  // null = no response yet.
  const [status, setStatus] = useState<IngestionStatus | null>(null);
  const [connectionLost, setConnectionLost] = useState(false);

  // Latest-ref so a parent re-creating `fetchStatus` each render does not
  // restart the loop (and fire an extra immediate poll).
  const fetchStatusRef = useRef(fetchStatus);
  useEffect(() => {
    fetchStatusRef.current = fetchStatus;
  }, [fetchStatus]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let delay = intervalMs;

    const poll = async (): Promise<void> => {
      let shouldContinue = true;

      try {
        const next = await fetchStatusRef.current();
        if (cancelled) return;

        setStatus(next);
        setConnectionLost(false);
        delay = intervalMs; // success resets the backoff
        shouldContinue = !isTerminal(next);
      } catch {
        if (cancelled) return;

        // Keep the last known status on screen, announce the problem, and
        // back off: ×2 per consecutive error, capped.
        setConnectionLost(true);
        delay = Math.min(delay * 2, maxIntervalMs);
      }

      if (shouldContinue) timer = setTimeout(poll, delay);
    };

    void poll(); // poll immediately on mount

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [intervalMs, maxIntervalMs]);

  const finished = status !== null && isTerminal(status);

  return (
    <div>
      <p role="status">{status === null ? 'Waiting for status…' : `Status: ${status}`}</p>
      {connectionLost && <p role="alert">Connection lost — retrying</p>}
      {finished && <p>Polling stopped</p>}
    </div>
  );
}
