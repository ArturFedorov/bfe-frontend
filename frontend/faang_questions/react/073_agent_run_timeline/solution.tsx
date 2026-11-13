import { useEffect, useReducer, useRef, useState } from 'react';
import type { ReactElement } from 'react';

export type StepStatus = 'running' | 'ok' | 'error';
export type RunStatus = 'running' | 'succeeded' | 'failed' | 'cancelled';

export type RunEvent =
  | { type: 'step_started'; stepId: string; name: string }
  | { type: 'step_output'; stepId: string; chunk: string }
  | { type: 'step_finished'; stepId: string; status: 'ok' | 'error'; message?: string }
  | { type: 'run_finished'; status: 'succeeded' | 'failed' };

export interface AgentStep {
  id: string;
  name: string;
  status: StepStatus;
  output: string;
  message?: string;
}

export interface AgentRunTimelineProps {
  /** Starts a run and streams its events. Must stop yielding once the signal is aborted. */
  run: (signal: AbortSignal) => AsyncIterable<RunEvent>;
}

/* ------------------------------------------------------------------ */
/* Reducer: one place owns the event -> state mapping                  */
/* ------------------------------------------------------------------ */

interface TimelineState {
  status: RunStatus;
  steps: AgentStep[];
  error: string | null;
  elapsed: number;
}

type TimelineAction =
  | { type: 'event'; event: RunEvent }
  | { type: 'stream_failed'; message: string }
  | { type: 'cancel' }
  | { type: 'tick' }
  | { type: 'reset' };

const INITIAL_STATE: TimelineState = {
  status: 'running',
  steps: [],
  error: null,
  elapsed: 0,
};

const RUN_LABEL: Record<RunStatus, string> = {
  running: 'Running',
  succeeded: 'Succeeded',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

/** Patch one step by id; unknown ids leave the array untouched (same reference). */
function patchStep(
  steps: AgentStep[],
  id: string,
  patch: (step: AgentStep) => AgentStep,
): AgentStep[] {
  const index = steps.findIndex((s) => s.id === id);
  if (index === -1) return steps;
  const next = steps.slice();
  next[index] = patch(steps[index]);
  return next;
}

function applyEvent(state: TimelineState, event: RunEvent): TimelineState {
  switch (event.type) {
    case 'step_started':
      // Idempotent: a duplicate start for a known id is ignored.
      if (state.steps.some((s) => s.id === event.stepId)) return state;
      return {
        ...state,
        steps: [
          ...state.steps,
          { id: event.stepId, name: event.name, status: 'running', output: '' },
        ],
      };
    case 'step_output':
      return {
        ...state,
        steps: patchStep(state.steps, event.stepId, (s) => ({
          ...s,
          output: s.output + event.chunk,
        })),
      };
    case 'step_finished':
      return {
        ...state,
        steps: patchStep(state.steps, event.stepId, (s) => ({
          ...s,
          status: event.status,
          message: event.message,
        })),
      };
    case 'run_finished':
      return { ...state, status: event.status };
  }
}

function reducer(state: TimelineState, action: TimelineAction): TimelineState {
  switch (action.type) {
    case 'event':
      // Once terminal, nothing from the stream may change the picture.
      if (state.status !== 'running') return state;
      return applyEvent(state, action.event);
    case 'stream_failed':
      if (state.status !== 'running') return state;
      return { ...state, status: 'failed', error: action.message };
    case 'cancel':
      if (state.status !== 'running') return state;
      return { ...state, status: 'cancelled' };
    case 'tick':
      return state.status === 'running'
        ? { ...state, elapsed: state.elapsed + 1 }
        : state;
    case 'reset':
      return INITIAL_STATE;
  }
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

/**
 * Reference solution.
 *
 *  - A single effect owns the `for await` loop. It creates its own
 *    `AbortController` per run; cleanup aborts it. `signal.aborted` is checked
 *    after every await, which simultaneously handles Cancel, unmount and the
 *    stale-run case (an old iterable yielding after Retry) — there is no
 *    separate "run id" to compare.
 *  - Retry is just "bump `attempt`": the effect re-runs, the old controller is
 *    aborted by cleanup, and the reducer is reset to the initial state.
 *  - The clock is a second effect keyed on `status` and `attempt`: it runs only
 *    while `running`, and restarts from zero on Retry because reset puts
 *    `elapsed` back to 0.
 *  - The reducer refuses stream events once terminal, so even a producer that
 *    ignores the signal cannot overwrite a Cancelled/Failed status.
 */
export function AgentRunTimeline({ run }: AgentRunTimelineProps): ReactElement {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const [attempt, setAttempt] = useState(0);
  const controllerRef = useRef<AbortController | null>(null);

  // Stream consumption — one controller per (run, attempt).
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    controllerRef.current = controller;

    (async () => {
      try {
        for await (const event of run(signal)) {
          if (signal.aborted) return;
          dispatch({ type: 'event', event });
        }
      } catch (err) {
        if (signal.aborted) return;
        dispatch({
          type: 'stream_failed',
          message: err instanceof Error ? err.message : String(err),
        });
      }
    })();

    return () => {
      controller.abort();
      if (controllerRef.current === controller) controllerRef.current = null;
    };
  }, [run, attempt]);

  // Elapsed clock — ticks only while running; re-armed on each attempt.
  const isRunning = state.status === 'running';
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => dispatch({ type: 'tick' }), 1000);
    return () => clearInterval(id);
  }, [isRunning, attempt]);

  const cancel = () => {
    controllerRef.current?.abort();
    dispatch({ type: 'cancel' });
  };

  const retry = () => {
    dispatch({ type: 'reset' });
    setAttempt((n) => n + 1);
  };

  const canRetry = state.status === 'failed' || state.status === 'cancelled';

  return (
    <section aria-label="Agent run">
      <div role="status">
        {RUN_LABEL[state.status]} · Elapsed: {state.elapsed}s
      </div>

      {state.error !== null && <div role="alert">{state.error}</div>}

      <div>
        {isRunning && (
          <button type="button" onClick={cancel}>
            Cancel
          </button>
        )}
        {canRetry && (
          <button type="button" onClick={retry}>
            Retry
          </button>
        )}
      </div>

      <ul aria-label="Steps">
        {state.steps.map((step) => (
          <li key={step.id}>
            <strong>{step.name}</strong> <span>{step.status}</span>
            {step.message && <p>{step.message}</p>}
            <pre>{step.output}</pre>
          </li>
        ))}
      </ul>
    </section>
  );
}
