import {ReactNode, useEffect, useState} from 'react';

export type IngestionStatus = 'queued' | 'processing' | 'succeeded' | 'failed';

export const TERMINAL_STATUSES: IngestionStatus[] = ['succeeded', 'failed'];

export interface PollingStatusWidgetProps {
  fetchStatus: () => Promise<IngestionStatus>;
  intervalMs?: number;
  maxIntervalMs?: number;
}

const renderStatus = (s: IngestionStatus) => s === 'queued' ? 'Waiting for status…' : `Status: ${s}`;

export function PollingStatusWidget({
  fetchStatus,
  intervalMs = 5000,
  maxIntervalMs = 60000,
}: PollingStatusWidgetProps): ReactNode {
  const [status, setStatus] = useState<IngestionStatus>('queued');
  const [showAlert, setShowAlert] = useState(false);


  const pollingFinished = TERMINAL_STATUSES.includes(status);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let delay = intervalMs;

    const poll = async () => {
      try {
        const next = await fetchStatus();

        if(cancelled) return;
        setStatus(next);
        setShowAlert(false);
        delay = intervalMs;

        if(TERMINAL_STATUSES.includes(next)) return;
      } catch {
        if(cancelled) return;
        setShowAlert(true);
        delay = Math.min(delay * 2, maxIntervalMs);
      }

      timer = setTimeout(poll, delay);
    }

    poll();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    }
  }, [])

  return (
    <div>
      <div role="status">{renderStatus(status)}</div>
      {showAlert && <div role="alert">Connection lost — retrying</div>}
      {pollingFinished && <div>Polling stopped</div>}

    </div>
  )
}
