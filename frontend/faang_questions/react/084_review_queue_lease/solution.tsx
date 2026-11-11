/**
 * Reference solution for 084 — keep review_queue.tsx blank for redo practice;
 * this file is for comparison after your own attempt.
 */
import { useEffect, useRef, useState, type ReactElement } from 'react';

export type Decision = 'approve' | 'reject' | 'skip' | 'flag';

export interface Task {
  id: string;
  text: string;
  leaseExpiresAt: number;
}

export interface QueueApi {
  next(): Promise<Task | null>;
  renew(taskId: string): Promise<void>;
  submit(taskId: string, decision: Decision): Promise<void>;
}

export type QueueError = Error & { code?: string };

export interface ReviewQueueProps {
  api: QueueApi;
  heartbeatMs?: number;
}

type View = { kind: 'loading' } | { kind: 'task'; task: Task } | { kind: 'empty' };

const HOTKEYS: Record<string, Decision> = { a: 'approve', r: 'reject', s: 'skip', f: 'flag' };

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

export function ReviewQueue({ api, heartbeatMs = 15000 }: ReviewQueueProps): ReactElement {
  const [view, setView] = useState<View>({ kind: 'loading' });
  const [error, setError] = useState<string | null>(null);

  const aliveRef = useRef(true);
  // The ONE prefetched `next()` for the task currently shown. Held, never displayed early.
  const prefetchRef = useRef<Promise<Task | null> | null>(null);
  // Synchronous double-submit guard: state lags a tick, a ref does not.
  const submittedIdRef = useRef<string | null>(null);
  const startedRef = useRef(false);

  /** Put a task (or the empty state) on screen and immediately prefetch the one after it. */
  const show = (task: Task | null) => {
    if (!aliveRef.current) return;
    if (task === null) {
      prefetchRef.current = null;
      setView({ kind: 'empty' });
      return;
    }
    setView({ kind: 'task', task });
    prefetchRef.current = api.next().catch((err: unknown) => {
      if (aliveRef.current) setError(err instanceof Error ? err.message : String(err));
      return null;
    });
  };

  useEffect(() => {
    aliveRef.current = true;
    if (!startedRef.current) {
      startedRef.current = true; // StrictMode runs effects twice; fetch the first task once
      api.next().then(show, (err: unknown) => {
        if (!aliveRef.current) return;
        setError(err instanceof Error ? err.message : String(err));
        setView({ kind: 'empty' });
      });
    }
    return () => {
      aliveRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const decide = (decision: Decision) => {
    if (view.kind !== 'task') return;
    const { id } = view.task;
    if (submittedIdRef.current === id) return; // second click / hotkey for the same task
    submittedIdRef.current = id;
    setError(null);

    // Fire and forget: the reviewer moves on; failures surface as an alert later.
    api.submit(id, decision).then(
      () => undefined,
      (err: unknown) => {
        if (!aliveRef.current) return;
        const e = err as QueueError;
        setError(
          e.code === 'lease_expired'
            ? `Your lease on task ${id} expired — it was returned to the queue`
            : e.message,
        );
      },
    );

    // Advance to the held prefetch. Resolved → shown next tick; in flight → Loading… until it lands.
    const pending = prefetchRef.current ?? api.next();
    prefetchRef.current = null;
    setView({ kind: 'loading' });
    pending.then(show);
  };

  // Keep the latest `decide` for the window listener without re-subscribing per render.
  const decideRef = useRef(decide);
  decideRef.current = decide;

  // Heartbeat: a fresh interval per shown task, cleared when the task changes or unmounts.
  const shownId = view.kind === 'task' ? view.task.id : null;
  useEffect(() => {
    if (shownId === null) return;
    const timer = setInterval(() => {
      void api.renew(shownId);
    }, heartbeatMs);
    return () => clearInterval(timer);
  }, [api, shownId, heartbeatMs]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;
      const decision = HOTKEYS[event.key.toLowerCase()];
      if (decision) decideRef.current(decision);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const disabled = view.kind !== 'task';

  return (
    <div>
      {view.kind === 'loading' && <div role="status">Loading…</div>}
      {view.kind === 'empty' && <div role="status">Queue empty</div>}
      {view.kind === 'task' && <p>{view.task.text}</p>}
      {error !== null && <div role="alert">{error}</div>}
      <div>
        {(['approve', 'reject', 'skip', 'flag'] as const).map((decision) => (
          <button
            key={decision}
            type="button"
            disabled={disabled}
            aria-keyshortcuts={decision[0].toUpperCase()}
            onClick={() => decide(decision)}
          >
            {decision[0].toUpperCase() + decision.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}
