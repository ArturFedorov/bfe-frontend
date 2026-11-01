import { ReactElement } from 'react';

export type RunStatus = 'idle' | 'running' | 'finished' | 'cancelled';

export type RunEvent = { type: 'output'; chunk: string } | { type: 'finished' };

export interface RunSnapshot {
  runId: string;
  output: string;
  status: RunStatus;
}

export interface RunControllerProps {
  /** Starts run `runId` on the server and streams its events. Must stop yielding once `signal` aborts. */
  startRun: (runId: string, signal: AbortSignal) => AsyncIterable<RunEvent>;
  /** Server-side view of the most recent run for this task, or `null` when there is none. */
  snapshot: () => Promise<RunSnapshot | null>;
  /** Where the client persists `{ runId, output, status }` under the key `run-state` (e.g. `sessionStorage`). */
  storage: Storage;
  /** Generates the id for each new run. Defaults to `crypto.randomUUID()`. */
  newRunId?: () => string;
}

export function RunController(_props: RunControllerProps): ReactElement {
  throw new Error('Not implemented');
}
