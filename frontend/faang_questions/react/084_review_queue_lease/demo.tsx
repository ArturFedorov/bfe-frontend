import { useEffect, useRef, useState } from 'react';
import { ReviewQueue, QueueApi, QueueError, Task, Decision } from './review_queue';

/**
 * Demo harness for ReviewQueue — auto-discovered by the playground
 * (playground/App.tsx). This file is not part of the task: the spec lives in
 * README.md and the grader is review_queue.test.tsx.
 */

const LEASE_MS = 30_000;
const HEARTBEAT_MS = 3000;
/** Submitting this task always fails with `lease_expired` to show the recovery path. */
const EXPIRED_TASK_ID = 'rq-4';

// Module-level queue: what the fake server still has to hand out.
const seedTasks: ReadonlyArray<Omit<Task, 'leaseExpiresAt'>> = [
  { id: 'rq-1', text: 'Street sign "STOP" — box covers the whole octagon, label "stop_sign".' },
  { id: 'rq-2', text: 'Pedestrian partially occluded by a van; annotator marked "occluded: 60%".' },
  { id: 'rq-3', text: 'Two overlapping bicycles — annotator drew one box; should be two.' },
  { id: 'rq-4', text: 'Traffic light at night; colour label "amber" — hard to verify from thumbnail.' },
  { id: 'rq-5', text: 'Speed-limit sign "30" tagged as "50"; check OCR crop.' },
  { id: 'rq-6', text: 'Parked car reflected in shop window — reflection boxed as a vehicle.' },
  { id: 'rq-7', text: 'Crosswalk markings; polygon has a self-intersecting edge.' },
  { id: 'rq-8', text: 'Empty frame (tunnel). Annotator submitted zero boxes.' },
];

interface LogEntry {
  at: string;
  text: string;
}

function now(): string {
  return new Date().toLocaleTimeString('en-GB');
}

export default function Demo() {
  const [runKey, setRunKey] = useState(0);
  const [log, setLog] = useState<LogEntry[]>([]);
  const remaining = useRef<Task[]>([]);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());

  const append = (text: string) =>
    setLog((entries) => [...entries.slice(-29), { at: now(), text }]);

  // Every fake-network delay goes through here so unmount/reset can clear it.
  const schedule = (fn: () => void, ms: number) => {
    const id = setTimeout(() => {
      timers.current.delete(id);
      fn();
    }, ms);
    timers.current.add(id);
  };

  const clearTimers = () => {
    timers.current.forEach((id) => clearTimeout(id));
    timers.current.clear();
  };

  useEffect(() => clearTimers, []);

  // Fake QueueApi: next() leases the head of the queue after 300–600ms,
  // renew() only logs a heartbeat, submit() settles after 500ms and rejects
  // with `code: 'lease_expired'` for one specific task.
  const createApi = (): QueueApi => {
    remaining.current = seedTasks.map((t) => ({ ...t, leaseExpiresAt: 0 }));
    return {
      next: () =>
        new Promise<Task | null>((resolve) => {
          schedule(() => {
            const head = remaining.current.shift();
            if (!head) {
              append('next() → queue empty');
              resolve(null);
              return;
            }
            const task = { ...head, leaseExpiresAt: Date.now() + LEASE_MS };
            append(`next() → leased ${task.id} (${remaining.current.length} left)`);
            resolve(task);
          }, 300 + Math.random() * 300);
        }),
      renew: (taskId: string) =>
        new Promise<void>((resolve) => {
          schedule(() => {
            append(`renew(${taskId}) ♥ lease extended`);
            resolve();
          }, 100);
        }),
      submit: (taskId: string, decision: Decision) =>
        new Promise<void>((resolve, reject) => {
          schedule(() => {
            if (taskId === EXPIRED_TASK_ID) {
              const error: QueueError = new Error(`409 Conflict: lease on ${taskId} has lapsed`);
              error.code = 'lease_expired';
              append(`submit(${taskId}, ${decision}) ✗ lease_expired`);
              reject(error);
              return;
            }
            append(`submit(${taskId}, ${decision}) ✓`);
            resolve();
          }, 500);
        }),
    };
  };

  const [api, setApi] = useState<QueueApi>(createApi);

  const reset = () => {
    clearTimers();
    setLog([]);
    setApi(createApi());
    setRunKey((k) => k + 1);
  };

  return (
    <div className="demo">
      <h2>Review Queue with Lease Heartbeat</h2>
      <p className="demo-note">
        Implement <code>ReviewQueue</code> in <code>review_queue.tsx</code> —
        lease heartbeat, one-task prefetch, optimistic decisions, double-submit
        protection and lease-expiry messaging. The fake queue holds 8 tasks:{' '}
        <code>next()</code> leases the next one after 300–600ms,{' '}
        <code>renew()</code> logs a heartbeat every 3s, and{' '}
        <code>submit()</code> settles after 500ms but rejects with{' '}
        <code>code: &apos;lease_expired&apos;</code> for task{' '}
        <code>{EXPIRED_TASK_ID}</code>. Hotkeys: A / R / S / F.
      </p>
      <div className="demo-stage">
        <div className="demo-controls">
          <button onClick={reset}>Reset queue</button>
        </div>
        <div style={{ marginTop: '1rem' }}>
          <ReviewQueue key={runKey} api={api} heartbeatMs={HEARTBEAT_MS} />
        </div>
        <p className="demo-note">Heartbeat / submit log (newest last):</p>
        <pre className="demo-note" style={{ maxHeight: '14rem', overflowY: 'auto' }}>
          {log.length === 0
            ? '— nothing yet —'
            : log.map((entry) => `${entry.at}  ${entry.text}`).join('\n')}
        </pre>
      </div>
    </div>
  );
}
