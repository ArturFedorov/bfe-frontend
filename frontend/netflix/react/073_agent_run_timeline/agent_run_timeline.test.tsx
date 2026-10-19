/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AgentRunTimeline, RunEvent } from './agent_run_timeline';

/**
 * A controllable async iterable: the test pushes events, ends the stream, or
 * makes it throw — exactly like a server stream the component cannot predict.
 */
function createSource<T>() {
  type Waiter = { resolve: (r: IteratorResult<T>) => void; reject: (e: unknown) => void };
  const queue: T[] = [];
  const waiters: Waiter[] = [];
  let ended = false;
  let failure: { error: unknown } | null = null;

  const iterable: AsyncIterable<T> = {
    [Symbol.asyncIterator]() {
      return {
        next(): Promise<IteratorResult<T>> {
          if (queue.length > 0) return Promise.resolve({ value: queue.shift() as T, done: false });
          if (failure) return Promise.reject(failure.error);
          if (ended) return Promise.resolve({ value: undefined, done: true });
          return new Promise<IteratorResult<T>>((resolve, reject) => waiters.push({ resolve, reject }));
        },
      };
    },
  };

  return {
    iterable,
    push(value: T) {
      const w = waiters.shift();
      if (w) w.resolve({ value, done: false });
      else queue.push(value);
    },
    end() {
      ended = true;
      waiters.splice(0).forEach((w) => w.resolve({ value: undefined, done: true }));
    },
    fail(error: unknown) {
      failure = { error };
      waiters.splice(0).forEach((w) => w.reject(error));
    },
  };
}

type Source = ReturnType<typeof createSource<RunEvent>>;

function setup() {
  const sources: Source[] = [];
  const signals: AbortSignal[] = [];
  const run = jest.fn((signal: AbortSignal) => {
    signals.push(signal);
    const source = createSource<RunEvent>();
    sources.push(source);
    return source.iterable;
  });
  const utils = render(<AgentRunTimeline run={run} />);
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
  return { run, sources, signals, user, ...utils };
}

/** Push events into the stream and let the component consume them. */
async function emit(source: Source, ...events: RunEvent[]) {
  await act(async () => {
    events.forEach((e) => source.push(e));
  });
}

function advance(ms: number) {
  act(() => {
    jest.advanceTimersByTime(ms);
  });
}

const started = (stepId: string, name: string): RunEvent => ({ type: 'step_started', stepId, name });
const output = (stepId: string, chunk: string): RunEvent => ({ type: 'step_output', stepId, chunk });
const finished = (stepId: string, status: 'ok' | 'error', message?: string): RunEvent => ({
  type: 'step_finished',
  stepId,
  status,
  message,
});
const runFinished = (status: 'succeeded' | 'failed'): RunEvent => ({ type: 'run_finished', status });

function steps() {
  return within(screen.getByRole('list', { name: 'Steps' })).queryAllByRole('listitem');
}

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('AgentRunTimeline', () => {
  it('starts the run on mount and ticks an elapsed counter every second', async () => {
    const { run, signals, sources } = setup();

    expect(run).toHaveBeenCalledTimes(1);
    expect(signals[0].aborted).toBe(false);
    expect(screen.getByRole('status')).toHaveTextContent('Running');
    expect(screen.getByRole('status')).toHaveTextContent('Elapsed: 0s');

    advance(1000);
    expect(screen.getByRole('status')).toHaveTextContent('Elapsed: 1s');
    advance(2000);
    expect(screen.getByRole('status')).toHaveTextContent('Elapsed: 3s');

    // the clock stops once the run is terminal
    await emit(sources[0], runFinished('succeeded'));
    advance(10000);
    expect(screen.getByRole('status')).toHaveTextContent('Elapsed: 3s');
  });

  it('renders one list item per started step, in order, with its status', async () => {
    const { sources } = setup();

    expect(screen.getByRole('list', { name: 'Steps' })).toBeInTheDocument();
    expect(steps()).toHaveLength(0);

    await emit(sources[0], started('fetch', 'Fetch items'), started('model', 'Call model'));

    const items = steps();
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Fetch items');
    expect(items[0]).toHaveTextContent('running');
    expect(items[1]).toHaveTextContent('Call model');
    expect(items[1]).toHaveTextContent('running');
  });

  it('appends output chunks to the owning step and ignores unknown step ids', async () => {
    const { sources } = setup();
    await emit(sources[0], started('fetch', 'Fetch items'), started('model', 'Call model'));

    await emit(
      sources[0],
      output('fetch', 'Loading 120 items\n'),
      output('model', 'Model: v3\n'),
      output('fetch', '120/120 fetched\n'),
      output('ghost', 'this step does not exist'),
    );

    const items = steps();
    expect(items).toHaveLength(2);
    const fetchPre = items[0].querySelector('pre');
    const modelPre = items[1].querySelector('pre');
    expect(fetchPre).not.toBeNull();
    expect(fetchPre).toHaveTextContent(/^Loading 120 items 120\/120 fetched$/);
    expect(fetchPre?.textContent).toBe('Loading 120 items\n120/120 fetched\n');
    expect(modelPre?.textContent).toBe('Model: v3\n');
    expect(screen.queryByText('this step does not exist')).not.toBeInTheDocument();
  });

  it('updates step status on step_finished and shows the message when present', async () => {
    const { sources } = setup();
    await emit(sources[0], started('fetch', 'Fetch items'), started('validate', 'Validate'));

    await emit(sources[0], finished('fetch', 'ok'), finished('validate', 'error', 'Validation failed: 3 items'));

    const items = steps();
    expect(items[0]).toHaveTextContent('ok');
    expect(items[0]).not.toHaveTextContent('running');
    expect(items[1]).toHaveTextContent('error');
    expect(items[1]).toHaveTextContent('Validation failed: 3 items');
  });

  it('shows Succeeded on run_finished and hides the Cancel button', async () => {
    const { sources } = setup();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();

    await emit(sources[0], started('fetch', 'Fetch items'), finished('fetch', 'ok'), runFinished('succeeded'));

    expect(screen.getByRole('status')).toHaveTextContent('Succeeded');
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
    expect(steps()).toHaveLength(1);
  });

  it('shows Failed on run_finished with status failed and offers Retry', async () => {
    const { sources } = setup();
    await emit(sources[0], started('validate', 'Validate'), finished('validate', 'error', 'Schema mismatch'));
    await emit(sources[0], runFinished('failed'));

    expect(screen.getByRole('status')).toHaveTextContent('Failed');
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    expect(steps()[0]).toHaveTextContent('Schema mismatch');
  });

  it('Cancel aborts the signal, keeps the log so far, and ignores later events', async () => {
    const { sources, signals, user } = setup();
    await emit(sources[0], started('fetch', 'Fetch items'), output('fetch', 'Loading…\n'), finished('fetch', 'ok'));
    await emit(sources[0], started('model', 'Call model'), output('model', 'batch 1/4\n'));

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(signals[0].aborted).toBe(true);
    expect(screen.getByRole('status')).toHaveTextContent('Cancelled');
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();

    // what streamed before cancel stays on screen
    let items = steps();
    expect(items).toHaveLength(2);
    expect(items[0].querySelector('pre')?.textContent).toBe('Loading…\n');
    expect(items[1].querySelector('pre')?.textContent).toBe('batch 1/4\n');

    // a misbehaving producer that keeps yielding after abort must not leak in
    await emit(sources[0], output('model', 'batch 2/4\n'), started('validate', 'Validate'), runFinished('succeeded'));
    items = steps();
    expect(items).toHaveLength(2);
    expect(items[1].querySelector('pre')?.textContent).toBe('batch 1/4\n');
    expect(screen.getByRole('status')).toHaveTextContent('Cancelled');
  });

  it('a throwing stream marks the run Failed with an alert and keeps the steps', async () => {
    const { sources } = setup();
    await emit(sources[0], started('fetch', 'Fetch items'), output('fetch', '40/120\n'));

    await act(async () => {
      sources[0].fail(new Error('upstream connection reset'));
    });

    expect(screen.getByRole('status')).toHaveTextContent('Failed');
    expect(screen.getByRole('alert')).toHaveTextContent('upstream connection reset');
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();

    const items = steps();
    expect(items).toHaveLength(1);
    expect(items[0].querySelector('pre')?.textContent).toBe('40/120\n');
  });

  it('Retry after failure clears the steps, starts a fresh run, and ignores the old stream', async () => {
    const { run, sources, signals, user } = setup();
    await emit(sources[0], started('fetch', 'Fetch items'), finished('fetch', 'ok'), started('model', 'Call model'));
    await act(async () => {
      sources[0].fail(new Error('model timeout'));
    });
    expect(screen.getByRole('alert')).toHaveTextContent('model timeout');
    advance(4000);
    expect(screen.getByRole('status')).toHaveTextContent('Elapsed: 0s');

    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(run).toHaveBeenCalledTimes(2);
    expect(signals[1]).not.toBe(signals[0]);
    expect(signals[1].aborted).toBe(false);
    expect(screen.getByRole('status')).toHaveTextContent('Running');
    expect(screen.getByRole('status')).toHaveTextContent('Elapsed: 0s');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
    expect(steps()).toHaveLength(0);

    // the new run streams fresh steps
    await emit(sources[1], started('fetch', 'Fetch items (retry)'));
    expect(steps()).toHaveLength(1);
    expect(steps()[0]).toHaveTextContent('Fetch items (retry)');

    // the clock restarted
    advance(2000);
    expect(screen.getByRole('status')).toHaveTextContent('Elapsed: 2s');
  });

  it('Retry after Cancel aborts the old run and drops events from its stream (stale-run guard)', async () => {
    const { run, sources, signals, user } = setup();
    await emit(sources[0], started('fetch', 'Fetch items'));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByRole('status')).toHaveTextContent('Cancelled');

    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(run).toHaveBeenCalledTimes(2);
    expect(signals[0].aborted).toBe(true);
    expect(signals[1].aborted).toBe(false);
    expect(steps()).toHaveLength(0);

    await emit(sources[1], started('fetch', 'Fetch items'), output('fetch', 'new run\n'));

    // v1 bug: events from the old run bled into the new timeline
    await emit(sources[0], started('zombie', 'Zombie step'), output('fetch', 'OLD RUN\n'), runFinished('failed'));

    const items = steps();
    expect(items).toHaveLength(1);
    expect(items[0].querySelector('pre')?.textContent).toBe('new run\n');
    expect(screen.queryByText('Zombie step')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Running');
  });

  it('unmount aborts the signal and late events cause no errors', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { sources, signals, unmount } = setup();
    await emit(sources[0], started('fetch', 'Fetch items'));

    unmount();
    expect(signals[0].aborted).toBe(true);

    await emit(sources[0], output('fetch', 'late chunk'), runFinished('succeeded'));
    await act(async () => {
      sources[0].fail(new Error('late failure'));
    });
    advance(5000);

    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
