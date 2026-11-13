import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

export interface RetryPanelProps {
  runCheck: () => Promise<string>;
  initialDelayMs?: number;
  backoffFactor?: number;
  maxDelayMs?: number;
}

/**
 * The panel is always in exactly one of these phases. `waiting` carries the
 * countdown as state, so the UI is a pure function of `phase` and a 1s timer
 * just moves us from one `waiting` value to the next.
 */
type Phase =
  | { kind: 'checking' }
  | { kind: 'success'; message: string }
  | { kind: 'waiting'; error: string; secondsLeft: number };

export function RetryPanel({
  runCheck,
  initialDelayMs = 5000,
  backoffFactor = 2,
  maxDelayMs = 60000,
}: RetryPanelProps): ReactNode {
  const [phase, setPhase] = useState<Phase>({ kind: 'checking' });
  // Bumping `attempt` is the one way to start a new check (auto or manual).
  const [attempt, setAttempt] = useState(0);

  // Consecutive-failure streak. A ref, not state: it only feeds the next
  // delay calculation and must never cause a render by itself.
  const failuresRef = useRef(0);

  // "Latest props" ref so the check effect can depend on `attempt` alone.
  // Without this, a parent passing a fresh `runCheck` arrow each render would
  // restart the in-flight check on every re-render.
  const latest = useRef({ runCheck, initialDelayMs, backoffFactor, maxDelayMs });
  useEffect(() => {
    latest.current = { runCheck, initialDelayMs, backoffFactor, maxDelayMs };
  });

  const retryNow = () => setAttempt((n) => n + 1);

  // Effect 1: run one check per `attempt`.
  useEffect(() => {
    let cancelled = false;
    setPhase({ kind: 'checking' });

    latest.current.runCheck().then(
      (message) => {
        if (cancelled) return;
        failuresRef.current = 0; // success resets the streak
        setPhase({ kind: 'success', message });
      },
      (err: unknown) => {
        if (cancelled) return;
        const { initialDelayMs, backoffFactor, maxDelayMs } = latest.current;
        // 1st failure → initial, 2nd → ×factor, 3rd → ×factor², … capped.
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
    );

    // Unmount (or a manual "Retry now" mid-check) makes this run stale: its
    // settlement must neither update state nor schedule anything.
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  // Effect 2: the countdown. Only active while waiting. Each tick re-arms a
  // single 1s timeout; cleanup clears it, so unmount or "Retry now" (which
  // changes `phase` to checking) stops the clock with no stray ticks.
  useEffect(() => {
    if (phase.kind !== 'waiting') return;

    const timer = setTimeout(() => {
      if (phase.secondsLeft > 1) {
        setPhase({ ...phase, secondsLeft: phase.secondsLeft - 1 });
      } else {
        retryNow(); // countdown hit zero → automatic retry
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [phase]);

  switch (phase.kind) {
    case 'checking':
      return <p role="status">Checking integration…</p>;

    case 'success':
      return <p role="status">{phase.message}</p>;

    case 'waiting':
      return (
        <div>
          <p role="alert">{phase.error}</p>
          <p>Retrying in {phase.secondsLeft}s</p>
          <button type="button" onClick={retryNow}>
            Retry now
          </button>
        </div>
      );
  }
}
