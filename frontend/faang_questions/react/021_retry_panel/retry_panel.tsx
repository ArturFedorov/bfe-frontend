import {ReactNode, useEffect, useRef, useState} from 'react';

export interface RetryPanelProps {
  runCheck: () => Promise<string>;
  initialDelayMs?: number;
  backoffFactor?: number;
  maxDelayMs?: number;
}

type Phase =
  | { kind: 'checking'}
  | { kind: 'success', message: string }
  | { kind: 'waiting', error: string, secondsLeft: number}

export function RetryPanel({
  runCheck,
  initialDelayMs = 5000,
  backoffFactor = 2,
  maxDelayMs = 60000,
}: RetryPanelProps): ReactNode {
  const [phase, setPhase] = useState<Phase>({ kind: 'checking'});
  const[attempt, setAttempt] = useState<number>(0);

  const failuresRef = useRef(0);
  const runCheckRef = useRef(runCheck);

  useEffect(() => {
    runCheckRef.current = runCheck;
  }, [runCheck]);

  const retry = () => setAttempt((n) => n + 1);

  useEffect(() => {
    let cancelled = false;
    setPhase({ kind: 'checking' });
    runCheckRef.current().then(
      (message) => {
        if(cancelled) return;
        failuresRef.current = 0;
        setPhase({ kind: 'success', message });
      },
      (err: unknown) => {
        if(cancelled) return;
        const delay = Math.min(maxDelayMs, initialDelayMs * backoffFactor ** failuresRef.current);

        failuresRef.current += 1;
        setPhase({
          kind: 'waiting',
          error: err instanceof Error ? err.message : String(err),
          secondsLeft: Math.round(delay/1000),
        })
      }
    )

    return () => {
      cancelled = true;
    }
  }, [attempt, initialDelayMs, backoffFactor, maxDelayMs]);

  useEffect(() => {
    if(phase.kind !== 'waiting') return;
    const id = setTimeout(() => {
      if(phase.secondsLeft > 1) setPhase({ ...phase, secondsLeft: phase.secondsLeft - 1})
      else retry();
    }, 1000);

    return () => {
      clearTimeout(id);
    }
  }, [phase]);

  switch (phase.kind) {
    case 'checking':
      return <div role="status">Checking integration…</div>
    case 'success':
      return <div role="status">{phase.message}</div>
    case "waiting":
      return (
        <div>
          <div role="alert">{phase.error}</div>
          <p>Retrying in {phase.secondsLeft}s</p>
          <button type="button" onClick={retry}>Retry now</button>
        </div>
      )
  }
}
