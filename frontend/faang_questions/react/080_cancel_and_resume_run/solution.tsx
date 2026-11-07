/**
 * Reference solution for 080 — keep run_controller.tsx blank for redo
 * practice; this file is for comparison after your own attempt.
 */
import { useEffect, useRef, useState, type ReactElement } from 'react';

export type RunStatus = 'idle' | 'running' | 'finished' | 'cancelled';

export type RunEvent = { type: 'output'; chunk: string } | { type: 'finished' };

export interface RunSnapshot {
  runId: string;
  output: string;
  status: RunStatus;
}

export interface RunControllerProps {
  startRun: (runId: string, signal: AbortSignal) => AsyncIterable<RunEvent>;
  snapshot: () => Promise<RunSnapshot | null>;
  storage: Storage;
  newRunId?: () => string;
}

const STORAGE_KEY = 'run-state';

const STATUS_LABEL: Record<RunStatus, string> = {
  idle: 'Idle',
  running: 'Running',
  finished: 'Finished',
  cancelled: 'Cancelled — partial output kept',
};

/** Everything the UI shows about the current run, kept together so persistence sees one consistent triple. */
interface RunView {
  runId: string | null;
  output: string;
  status: RunStatus;
  error: string | null;
}

const IDLE: RunView = { runId: null, output: '', status: 'idle', error: null };

function restore(storage: Storage): RunView {
  const raw = storage.getItem(STORAGE_KEY);
  if (raw === null) return IDLE;
  try {
    const record = JSON.parse(raw) as RunSnapshot;
    // A run that was "running" when the tab closed has no live stream here:
    // present it as cancelled so Resume is available (the snapshot may upgrade it).
    const status: RunStatus = record.status === 'running' ? 'cancelled' : record.status;
    return { runId: record.runId, output: record.output, status, error: null };
  } catch {
    return IDLE;
  }
}

export function RunController({
  startRun,
  snapshot,
  storage,
  newRunId = () => crypto.randomUUID(),
}: RunControllerProps): ReactElement {
  // Lazy initialiser: the stored record is on screen in the very first render.
  const [run, setRun] = useState<RunView>(() => restore(storage));

  const controllerRef = useRef<AbortController | null>(null);
  // Which run is allowed to write state. Everything async checks this first.
  const activeRunIdRef = useRef<string | null>(run.runId);
  const aliveRef = useRef(true);

  // Persist the triple whenever it changes and a run exists.
  useEffect(() => {
    if (run.runId === null) return;
    storage.setItem(STORAGE_KEY, JSON.stringify({ runId: run.runId, output: run.output, status: run.status }));
  }, [storage, run.runId, run.output, run.status]);

  // Reconcile a restored record with the server, exactly once, on mount.
  const restoredRunIdRef = useRef(run.runId);
  const snapshotAskedRef = useRef(false);
  useEffect(() => {
    aliveRef.current = true;
    const restoredRunId = restoredRunIdRef.current;
    if (restoredRunId === null || snapshotAskedRef.current) return;
    snapshotAskedRef.current = true;

    snapshot().then(
      (server) => {
        if (!aliveRef.current || !server) return;
        // The user may have started a new run while we waited: never clobber it.
        if (activeRunIdRef.current !== restoredRunId || server.runId !== restoredRunId) return;
        setRun((prev) => {
          if (prev.runId !== restoredRunId) return prev;
          const output = server.output.length > prev.output.length ? server.output : prev.output;
          const status = server.status === 'finished' ? 'finished' : prev.status;
          return output === prev.output && status === prev.status ? prev : { ...prev, output, status };
        });
      },
      () => undefined, // a failed snapshot leaves the restored view as is
    );
  }, [snapshot]);

  useEffect(
    () => () => {
      aliveRef.current = false;
      controllerRef.current?.abort();
    },
    [],
  );

  const begin = () => {
    controllerRef.current?.abort();
    const runId = newRunId();
    const controller = new AbortController();
    controllerRef.current = controller;
    activeRunIdRef.current = runId;
    setRun({ runId, output: '', status: 'running', error: null });

    // Two guards on every write: the signal (cancel/unmount) and the run id (superseded run).
    const isCurrent = () => aliveRef.current && !controller.signal.aborted && activeRunIdRef.current === runId;

    (async () => {
      try {
        for await (const event of startRun(runId, controller.signal)) {
          if (!isCurrent()) return;
          if (event.type === 'output') {
            setRun((prev) => ({ ...prev, output: prev.output + event.chunk }));
          } else {
            setRun((prev) => ({ ...prev, status: 'finished' }));
          }
        }
      } catch (err: unknown) {
        if (!isCurrent()) return;
        const message = err instanceof Error ? err.message : String(err);
        setRun((prev) => ({ ...prev, status: 'cancelled', error: message }));
      }
    })();
  };

  const cancel = () => {
    controllerRef.current?.abort();
    setRun((prev) => ({ ...prev, status: 'cancelled' }));
  };

  return (
    <div>
      <div role="status">{STATUS_LABEL[run.status]}</div>
      {run.error !== null && <div role="alert">{run.error}</div>}
      <pre role="log" aria-label="Run output">
        {run.output}
      </pre>
      <div>
        {(run.status === 'idle' || run.status === 'finished') && (
          <button type="button" onClick={begin}>
            Start
          </button>
        )}
        {run.status === 'running' && (
          <button type="button" onClick={cancel}>
            Cancel
          </button>
        )}
        {run.status === 'cancelled' && (
          <button type="button" onClick={begin}>
            Resume
          </button>
        )}
      </div>
    </div>
  );
}
