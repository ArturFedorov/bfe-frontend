import { useEffect, useState } from 'react';
import { RunController, RunEvent, RunSnapshot } from './run_controller';

/**
 * Demo harness for RunController — auto-discovered by the playground
 * (playground/App.tsx). This file is not part of the task: the spec lives in
 * README.md and the grader is run_controller.test.tsx.
 *
 * The fake backend below models a server that keeps working after the client
 * disconnects: aborting the stream (Cancel, reload, unmount) only stops the
 * client from reading, the server-side record keeps growing until the run
 * finishes. That is what makes the snapshot reconciliation after a "reload"
 * visible — the server output is longer than what sessionStorage holds.
 */

const STORAGE_KEY = 'run-state';

const CHUNKS: string[] = [
  'Queued pre-annotate run on worker gpu-pool-b\n',
  'Loading batch-42: 120 items pending annotation\n',
  'Model: pre-annotate-v3 (confidence threshold 0.80)\n',
  ...Array.from({ length: 20 }, (_, i) => {
    const from = String(i * 6 + 1).padStart(3, '0');
    const to = String(i * 6 + 6).padStart(3, '0');
    const suggestions = 12 + ((i * 5) % 9);
    const confidence = (0.78 + ((i * 7) % 20) / 100).toFixed(2);
    return `Items ${from}–${to} → ${suggestions} suggestions (mean conf ${confidence})\n`;
  }),
  'Wrote 312 suggestion rows\n',
  'Notified 3 reviewers — done\n',
];

// ---------------------------------------------------------------------------
// Fake server: one job per run id, kept in a module-level Map.
// ---------------------------------------------------------------------------

interface ServerJob {
  record: RunSnapshot;
  listeners: Set<() => void>;
}

const jobs = new Map<string, ServerJob>();
const timers = new Set<ReturnType<typeof setTimeout>>();
let latestRunId: string | null = null;

function schedule(fn: () => void, ms: number): void {
  const id = setTimeout(() => {
    timers.delete(id);
    fn();
  }, ms);
  timers.add(id);
}

function chunkDelay(): number {
  return 200 + Math.random() * 150;
}

function notify(job: ServerJob): void {
  for (const listener of job.listeners) listener();
}

function startServerJob(runId: string): ServerJob {
  const job: ServerJob = {
    record: { runId, output: '', status: 'running' },
    listeners: new Set(),
  };
  jobs.set(runId, job);
  latestRunId = runId;

  let next = 0;
  const tick = () => {
    if (job.record.status !== 'running') return;
    if (next < CHUNKS.length) {
      job.record = { ...job.record, output: job.record.output + CHUNKS[next] };
      next += 1;
      schedule(tick, chunkDelay());
    } else {
      job.record = { ...job.record, status: 'finished' };
    }
    notify(job);
  };
  schedule(tick, chunkDelay());
  return job;
}

/** Called when the demo unmounts: stop every pending timer and mark unfinished jobs cancelled. */
function shutDownServer(): void {
  for (const id of timers) clearTimeout(id);
  timers.clear();
  for (const job of jobs.values()) {
    if (job.record.status === 'running') {
      job.record = { ...job.record, status: 'cancelled' };
      notify(job);
    }
  }
}

function nextChange(job: ServerJob, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const done = () => {
      job.listeners.delete(done);
      signal.removeEventListener('abort', done);
      resolve();
    };
    job.listeners.add(done);
    signal.addEventListener('abort', done);
  });
}

/** Streams the job's output as `output` chunks and a final `finished`; stops as soon as `signal` aborts. */
async function* startRun(runId: string, signal: AbortSignal): AsyncIterable<RunEvent> {
  const job = jobs.get(runId) ?? startServerJob(runId);
  let sent = 0;
  while (!signal.aborted) {
    const { output, status } = job.record;
    if (output.length > sent) {
      const chunk = output.slice(sent);
      sent = output.length;
      yield { type: 'output', chunk };
      continue;
    }
    if (status !== 'running') {
      if (status === 'finished') yield { type: 'finished' };
      return;
    }
    await nextChange(job, signal);
  }
}

/** Server-side view of the most recent run, after a little network latency. */
function snapshot(): Promise<RunSnapshot | null> {
  return new Promise((resolve) => {
    schedule(() => {
      const job = latestRunId === null ? undefined : jobs.get(latestRunId);
      resolve(job ? { ...job.record } : null);
    }, 400);
  });
}

// ---------------------------------------------------------------------------
// Demo
// ---------------------------------------------------------------------------

function readStored(): string {
  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (raw === null) return '(nothing stored)';
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

function describeServer(): string {
  const job = latestRunId === null ? undefined : jobs.get(latestRunId);
  if (!job) return '(no run on the server)';
  const { runId, output, status } = job.record;
  return `run ${runId.slice(0, 8)}… · ${status} · ${output.length} chars`;
}

export default function Demo() {
  const [mountKey, setMountKey] = useState(0);
  const [stored, setStored] = useState(readStored);
  const [server, setServer] = useState(describeServer);

  useEffect(() => {
    const id = setInterval(() => {
      setStored(readStored());
      setServer(describeServer());
    }, 250);
    return () => {
      clearInterval(id);
      shutDownServer();
    };
  }, []);

  const simulateReload = () => setMountKey((k) => k + 1);
  const clearStorage = () => {
    window.sessionStorage.removeItem(STORAGE_KEY);
    setStored(readStored());
  };

  return (
    <div className="demo">
      <h2>Cancel and Resume Run</h2>
      <p className="demo-note">
        Implement <code>RunController</code> in <code>run_controller.tsx</code> — Start streams
        output, Cancel aborts the signal and keeps the partial log, Resume starts a fresh run id,
        and a reload restores <code>sessionStorage</code> then reconciles with{' '}
        <code>snapshot()</code>. The fake server emits 25 chunks 200–350ms apart and keeps running
        after the client disconnects, so after &quot;Simulate reload&quot; the snapshot is longer
        than the stored record (and reports <code>finished</code> once the job ends).
      </p>
      <div className="demo-stage">
        <div className="demo-controls">
          <button onClick={simulateReload}>Simulate reload</button>
          <button onClick={clearStorage}>Clear storage</button>
        </div>
        <RunController
          key={mountKey}
          startRun={startRun}
          snapshot={snapshot}
          storage={window.sessionStorage}
        />
        <p className="demo-note">
          <strong>sessionStorage[&quot;run-state&quot;]</strong>
        </p>
        <pre>{stored}</pre>
        <p className="demo-note">
          <strong>Server record:</strong> {server}
        </p>
      </div>
    </div>
  );
}
