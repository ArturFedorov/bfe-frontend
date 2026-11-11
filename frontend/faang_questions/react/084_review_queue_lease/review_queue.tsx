import {ReactElement, useEffect, useRef, useState} from 'react';

export type Decision = 'approve' | 'reject' | 'skip' | 'flag';

export interface Task {
  id: string;
  text: string;
  /** Epoch ms at which the server lease on this task lapses unless renewed. */
  leaseExpiresAt: number;
}

export interface QueueApi {
  /** Lease and return the next task, or `null` when the queue is empty. */
  next(): Promise<Task | null>;
  /** Heartbeat: extend the lease on `taskId`. */
  renew(taskId: string): Promise<void>;
  /** Record a decision. Rejects with `{ code: 'lease_expired' }` when the lease lapsed. */
  submit(taskId: string, decision: Decision): Promise<void>;
}

/** Errors thrown by the api may carry a machine-readable code. */
export type QueueError = Error & { code?: string };

export interface ReviewQueueProps {
  api: QueueApi;
  /** Interval between `renew` calls while a task is shown. Default 15000. */
  heartbeatMs?: number;
}

type View = { kind: 'loading' } | { kind: 'task', task: Task } | { kind: 'empty' };

const HOTKEYS: Record<string, Decision> = { a: 'approve', r: 'reject', s: 'skip', f: 'flag' };

function isTypeTarget(target: EventTarget | null): boolean {
  if(!(target instanceof HTMLElement )) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

export function ReviewQueue({ api, heartbeatMs = 15000 }: ReviewQueueProps): ReactElement {
  const [view, setView] = useState<View>({ kind: 'loading' });
  const [error, setError] = useState<string | null>(null);

  const aliveRef = useRef(true);
  const prefetchRef = useRef<Promise<Task | null>>(null);
  const submittedIdRef = useRef<string | null>(null);
  const startedRef = useRef(false);

  const show = (task: Task | null) => {
    if(!aliveRef.current) return;
    if(task === null) {
      prefetchRef.current = null;
      setView({ kind: 'empty'});
      return;
    }

    setView({ kind: 'task', task });
    prefetchRef.current = api.next().catch((err: unknown) => {
      if(aliveRef.current) setError(err instanceof Error ? err.message : String(err));
      return null;
    });
  }

  useEffect(() => {
    aliveRef.current = true;
    if(!startedRef.current) {
      startedRef.current = true;
      api.next().then(show, (err: unknown) => {
        if(!aliveRef.current) return;
        setError(err instanceof Error ? err.message : String(err));
        setView({ kind: 'empty' });
      })
    }

    return () => {
      aliveRef.current = false;
    }
  }, []);

  const decide = (decision: Decision) => {
    if(view.kind !== 'task') return;
    const { id } = view.task;
    if(submittedIdRef.current === id) return;
    submittedIdRef.current = id;
    setError(null);

    api.submit(id, decision).then(
      () => undefined,
      (err: unknown) => {
        if(!aliveRef.current) return;
        const e = err as QueueError;
        setError(
          e.code === 'lease_expired'
            ? `Your lease on task ${id} expired — it was returned to the queue`
            : e.message,
        )
      }
    );

    const pending = prefetchRef.current ?? api.next();
    prefetchRef.current = null;
    setView({ kind: 'loading' });
    pending.then(show);
  }

  const decideRef = useRef(decide);
  decideRef.current = decide;

  const shownId  = view.kind === 'task' ? view.task.id : null;
  useEffect(() => {
    if(shownId === null) return;
    const timer = setInterval(() => {
      void api.renew(shownId);
    }, heartbeatMs)

    return () => clearInterval(timer);
  }, [shownId, api, heartbeatMs]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if(event.ctrlKey || event.metaKey || event.altKey) return;
      if(isTypeTarget(event.target)) return;

      const decision = HOTKEYS[event.key.toLowerCase()];
      if(decision) decideRef.current(decision);
    }

    window.addEventListener('keydown', onKeyDown);

    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const disabled = view.kind !== 'task';

  return (
    <div>
      { view.kind === 'loading' && <div role="status">Loading…</div>}
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
  )
}
