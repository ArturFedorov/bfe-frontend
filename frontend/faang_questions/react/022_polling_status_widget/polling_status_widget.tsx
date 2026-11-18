import {ReactNode, useEffect, useRef, useState} from 'react';

export type IngestionStatus = 'queued' | 'processing' | 'succeeded' | 'failed';

export const TERMINAL_STATUSES: IngestionStatus[] = ['succeeded', 'failed'];

export interface PollingStatusWidgetProps {
  fetchStatus: () => Promise<IngestionStatus>;
  intervalMs?: number;
  maxIntervalMs?: number;
}

const isTerminal = (status: IngestionStatus) => TERMINAL_STATUSES.includes(status);

export function PollingStatusWidget({
  fetchStatus,
  intervalMs = 5000,
  maxIntervalMs = 60000,
}: PollingStatusWidgetProps): ReactNode {
  const [status, setStatus] = useState<IngestionStatus | null>(null);
  const [connectionLost, setConnectionLost] = useState(false);

  const fetchStatusRef = useRef(fetchStatus);
  useEffect(() => {
    fetchStatusRef.current = fetchStatus;
  }, [fetchStatus]);

  useEffect(() => {
    let canceled = false;
    let delay = intervalMs;
    let timer: ReturnType<typeof setTimeout> | undefined = undefined;

    const poll = async () => {
      let shouldContinue = true;

      try {
        const status = await fetchStatusRef.current();
        if(canceled) return;

        setStatus(status);
        setConnectionLost(false);

        delay = intervalMs;
        shouldContinue = !isTerminal(status);
      } catch {
        if(canceled) return;
        setConnectionLost(true);
        delay = Math.min(delay * 2, maxIntervalMs);
      }

      if (shouldContinue && !canceled) timer = setTimeout(poll, delay);
    }

    void poll();

    return () => {
      canceled = true;
      clearTimeout(timer);
    }

  }, [intervalMs, maxIntervalMs]);

  const finished = status !== null && isTerminal(status);

  return (
    <div>
      <p role="status">{status === null ? 'Waiting for status…' : `Status: ${status}`}</p>
      {connectionLost && <p role="alert">Connection lost — retrying</p>}
      {finished && <p>Polling stopped</p>}
    </div>
  )
}
