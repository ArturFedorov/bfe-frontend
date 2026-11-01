import {ReactElement, useEffect, useReducer, useRef, useState} from 'react';

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

interface TimelineState {
  status: RunStatus;
  steps: AgentStep[];
  error: string | null;
  elapsed: number;
}

type TimelineAction =
  | { type: 'event'; event: RunEvent }
  | { type: 'stream_failed'; message: string }
  | { type: 'cancel'}
  | { type: 'tick' }
  | { type: 'reset' };

const INITIAL_STATE: TimelineState = { status: 'running', steps: [], error: null, elapsed: 0 };
const RUN_LABEL: Record<RunStatus, string> = {
  running: 'Running',
  succeeded: 'Succeeded',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

function updateStep(steps: AgentStep[], id: string, patch: (step: AgentStep) => AgentStep):AgentStep[] {
  return steps.map((step) => step.id === id ? patch(step) : step);
}

function applyEvent(state: TimelineState, event: RunEvent): TimelineState {
  switch (event.type) {
    case "step_started":
      if(state.steps.some((step) => step.id === event.stepId)) return state;
      return {
        ...state,
        steps: [...state.steps, { id: event.stepId, name: event.name, status: 'running', output: '' } ],
      }
    case "step_output":
      return {
        ...state,
        steps: updateStep(state.steps, event.stepId, (step) => ({...step, output: step.output + event.chunk }))
      }
    case "step_finished":
      return {
        ...state,
        steps: updateStep(state.steps, event.stepId, (step) => ({
          ...step,
          status: event.status,
          message: event.message,
        }))
      };
    case "run_finished":
      return { ...state, status: event.status };
  }
}

function reducer(state: TimelineState, action: TimelineAction): TimelineState {
  switch (action.type) {
    case "event":
      return applyEvent(state, action.event);
    case "stream_failed":
      return { ...state, status: 'failed', error: action.message };
    case "cancel":
      return { ...state, status: 'cancelled' };
    case "tick":
      return state.status === 'running' ? { ...state, elapsed: state.elapsed + 1 } : state;
    case "reset":
      return INITIAL_STATE;
  }
}

export function AgentRunTimeline({ run }: AgentRunTimelineProps): ReactElement {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const [attempt, setAttempt] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;
    const { signal } = controller;

    (async () => {
      try {
        for await (const event of run(signal)) {
          if(signal.aborted) return;
          dispatch({ type: 'event', event})
        }
      } catch (err: unknown) {
        if(signal.aborted) return;
        dispatch({ type: 'stream_failed', message: err instanceof Error ? err.message : String(err)})
      }
    })();

    return () => controller.abort();
  }, [run, attempt]);

  useEffect(() => {
    if(state.status !== 'running') return;
    const id = setInterval(() => {
      dispatch({ type: 'tick'})
    }, 1000);

    return () => clearInterval(id);
  }, []);

  const cancel = () => {
    abortRef.current?.abort();
    dispatch({ type: 'cancel' });
  }

  const retry = () => {
    dispatch({ type: 'reset'});
    setAttempt((n) => n + 1);
  }

  const isRunning = state.status === 'running';
  const canRetry = state.status === 'failed' || state.status === 'cancelled';

  return (
    <div>
      <div role="status">
        {RUN_LABEL[state.status]} · Elapsed: {state.elapsed}s
        {state.error !== null && <div role="alert">{state.error}</div>}

        <ul aria-label="Steps">
          {state.steps.map((step) => (
            <li key={step.id}>
              <strong>{step.name}</strong> <span>{step.status}</span>
              {step.message && <p>{step.message}</p>}
              <pre>{step.output}</pre>
            </li>
          ))}
        </ul>
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
    </div>
  )
}
