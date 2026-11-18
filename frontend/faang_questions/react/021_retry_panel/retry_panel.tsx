import {ReactNode, useEffect, useRef, useState} from 'react';

export interface RetryPanelProps {
  runCheck: () => Promise<string>;
  initialDelayMs?: number;
  backoffFactor?: number;
  maxDelayMs?: number;
}

type Phase =
  | { kind: 'checking'}
  | { kind: 'success', message: string}
  | { kind: 'waiting', error: string, secondsLeft: number};

export function RetryPanel({
  runCheck,
  initialDelayMs = 5000,
  backoffFactor = 2,
  maxDelayMs = 60000,
}: RetryPanelProps): ReactNode {
  const [phase, setPhase] = useState<Phase>({ kind: 'checking'});
  const [attempt, setAttempt] = useState<number>(0);

  const failuresRef = useRef(0);

  const latest = useRef({ runCheck, initialDelayMs, backoffFactor, maxDelayMs });
  useEffect(() => {
    latest.current = { runCheck, initialDelayMs, backoffFactor, maxDelayMs };
  });

  const retryNow = () => setAttempt((n) => n + 1);

  useEffect(() => {
    let cancelled = false;
    setPhase({ kind: 'checking' });

    latest.current.runCheck().then(
      (message) => {
        if(cancelled) return;
        failuresRef.current = 0;
        setPhase({ kind: 'success', message });
      },
      (err: unknown) => {
        if(cancelled) return;
        const { initialDelayMs, backoffFactor, maxDelayMs } = latest.current;

        const delayMs = Math.min(
          initialDelayMs * backoffFactor ** failuresRef.current,
          maxDelayMs
        );

        failuresRef.current += 1;
        setPhase({
          kind: 'waiting',
          error: err instanceof Error ? err.message : String(err),
          secondsLeft: Math.max(1, Math.ceil(delayMs / 1000)),
        });
      }
    )

    return () => {
      cancelled = true;
    }
  }, [attempt]);

  useEffect(() => {
    if(phase.kind !== 'waiting') return;

    const timer = setTimeout(() => {
      if(phase.secondsLeft > 1) {
        setPhase({ ...phase, secondsLeft: phase.secondsLeft - 1});
      } else {
        retryNow();
      }
    }, 1000);

    return () => {
      clearTimeout(timer);
    }
  }, [phase]);

  switch (phase.kind) {
    case 'checking':
      return <p role="status">Checking integration…</p>;
    case 'success':
      return <p role="status">{phase.message}</p>
    case 'waiting':
      return (
        <div>
          <p role="alert">{phase.error}</p>
          <p>Retrying in {phase.secondsLeft}s</p>
          <button type="button" onClick={retryNow}>
            Retry now
          </button>
        </div>
      )
  }
}
