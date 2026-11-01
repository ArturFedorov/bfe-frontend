/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { deferred, flush } from '../_helpers/deferred';
import { RunController, RunEvent, RunSnapshot } from './run_controller';

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

/** Map-backed `Storage` so tests can inspect exactly what was persisted. */
function createFakeStorage(seed: Record<string, string> = {}): Storage {
  const map = new Map<string, string>(Object.entries(seed));
  return {
    get length() {
      return map.size;
    },
    key: (i: number) => Array.from(map.keys())[i] ?? null,
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => {
      map.set(k, String(v));
    },
    removeItem: (k: string) => {
      map.delete(k);
    },
    clear: () => map.clear(),
  };
}

const KEY = 'run-state';

function stored(storage: Storage): RunSnapshot | null {
  const raw = storage.getItem(KEY);
  return raw === null ? null : (JSON.parse(raw) as RunSnapshot);
}

interface SetupOptions {
  storage?: Storage;
  snapshot?: () => Promise<RunSnapshot | null>;
}

function setup({ storage = createFakeStorage(), snapshot = jest.fn(async () => null) }: SetupOptions = {}) {
  const sources: Source[] = [];
  const signals: AbortSignal[] = [];
  const runIds: string[] = [];
  let n = 0;
  const newRunId = jest.fn(() => `run-${++n}`);
  const startRun = jest.fn((runId: string, signal: AbortSignal) => {
    runIds.push(runId);
    signals.push(signal);
    const source = createSource<RunEvent>();
    sources.push(source);
    return source.iterable;
  });
  const user = userEvent.setup();
  const utils = render(
    <RunController startRun={startRun} snapshot={snapshot} storage={storage} newRunId={newRunId} />
  );
  return { startRun, snapshot, storage, newRunId, sources, signals, runIds, user, ...utils };
}

/** Push events into a stream and let the component consume them. */
async function emit(source: Source, ...events: RunEvent[]) {
  await act(async () => {
    events.forEach((e) => source.push(e));
    await flush();
  });
}

const output = (chunk: string): RunEvent => ({ type: 'output', chunk });
const finished = (): RunEvent => ({ type: 'finished' });

const status = () => screen.getByRole('status');
const log = () => screen.getByRole('log', { name: 'Run output' });

describe('RunController', () => {
  describe('starting a run', () => {
    it('renders Idle with an empty log and a Start button; nothing runs or persists before Start', () => {
      const { startRun, storage } = setup();
      expect(status()).toHaveTextContent('Idle');
      expect(log()).toHaveTextContent('');
      expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
      expect(startRun).not.toHaveBeenCalled();
      expect(storage.getItem(KEY)).toBeNull();
    });

    it('Start creates a run id, calls startRun with it and a live signal, and appends chunks in order', async () => {
      const { user, startRun, newRunId, runIds, signals, sources } = setup();
      await user.click(screen.getByRole('button', { name: 'Start' }));

      expect(newRunId).toHaveBeenCalledTimes(1);
      expect(startRun).toHaveBeenCalledTimes(1);
      expect(runIds).toEqual(['run-1']);
      expect(signals[0].aborted).toBe(false);
      expect(status()).toHaveTextContent('Running');
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Start' })).not.toBeInTheDocument();

      await emit(sources[0], output('Loading 120 items\n'), output('model: v3\n'));
      expect(log().textContent).toBe('Loading 120 items\nmodel: v3\n');
    });

    it('a finished event sets status Finished and offers Start for a fresh run', async () => {
      const { user, sources, newRunId, runIds } = setup();
      await user.click(screen.getByRole('button', { name: 'Start' }));
      await emit(sources[0], output('done.'), finished());

      expect(status()).toHaveTextContent('Finished');
      expect(log().textContent).toBe('done.');
      expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Start' }));
      expect(newRunId).toHaveBeenCalledTimes(2);
      expect(runIds).toEqual(['run-1', 'run-2']);
      expect(status()).toHaveTextContent('Running');
      expect(log().textContent).toBe('');
    });
  });

  describe('cancel', () => {
    it('Cancel aborts the signal, keeps the partial output, and ignores events the old stream yields afterwards', async () => {
      const { user, sources, signals } = setup();
      await user.click(screen.getByRole('button', { name: 'Start' }));
      await emit(sources[0], output('batch 1/4\n'));

      await user.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(signals[0].aborted).toBe(true);
      expect(status()).toHaveTextContent('Cancelled — partial output kept');
      expect(log().textContent).toBe('batch 1/4\n');
      expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Resume' })).toBeInTheDocument();

      // a misbehaving producer that keeps yielding after abort must not leak in
      await emit(sources[0], output('batch 2/4\n'), finished());
      expect(log().textContent).toBe('batch 1/4\n');
      expect(status()).toHaveTextContent('Cancelled — partial output kept');
    });
  });

  describe('resume', () => {
    it('Resume starts a NEW run id with fresh output and drops late events from the cancelled run (stale-run guard)', async () => {
      const { user, sources, signals, runIds, startRun } = setup();
      await user.click(screen.getByRole('button', { name: 'Start' }));
      await emit(sources[0], output('old run\n'));
      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      await user.click(screen.getByRole('button', { name: 'Resume' }));
      expect(startRun).toHaveBeenCalledTimes(2);
      expect(runIds).toEqual(['run-1', 'run-2']);
      expect(signals[0].aborted).toBe(true);
      expect(signals[1].aborted).toBe(false);
      expect(status()).toHaveTextContent('Running');
      expect(log().textContent).toBe('');

      await emit(sources[1], output('new run\n'));
      // the old iterable wakes up late
      await emit(sources[0], output('ZOMBIE\n'), finished());

      expect(log().textContent).toBe('new run\n');
      expect(status()).toHaveTextContent('Running');
    });
  });

  describe('persistence', () => {
    it('writes { runId, output, status } to storage under run-state after every change', async () => {
      const { user, sources, storage } = setup();
      await user.click(screen.getByRole('button', { name: 'Start' }));
      expect(stored(storage)).toEqual({ runId: 'run-1', output: '', status: 'running' });

      await emit(sources[0], output('a'));
      expect(stored(storage)).toEqual({ runId: 'run-1', output: 'a', status: 'running' });

      await emit(sources[0], output('b'));
      expect(stored(storage)).toEqual({ runId: 'run-1', output: 'ab', status: 'running' });

      await user.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(stored(storage)).toEqual({ runId: 'run-1', output: 'ab', status: 'cancelled' });
    });

    it('persists Finished and the new run id after Resume', async () => {
      const { user, sources, storage } = setup();
      await user.click(screen.getByRole('button', { name: 'Start' }));
      await emit(sources[0], output('x'), finished());
      expect(stored(storage)).toEqual({ runId: 'run-1', output: 'x', status: 'finished' });

      await user.click(screen.getByRole('button', { name: 'Start' }));
      expect(stored(storage)).toEqual({ runId: 'run-2', output: '', status: 'running' });
    });

    it('renders a stored record immediately, before the snapshot resolves', async () => {
      const snap = deferred<RunSnapshot | null>();
      const snapshot = jest.fn(() => snap.promise);
      const storage = createFakeStorage({
        [KEY]: JSON.stringify({ runId: 'run-9', output: 'restored output', status: 'cancelled' }),
      });
      setup({ storage, snapshot });

      expect(log().textContent).toBe('restored output');
      expect(status()).toHaveTextContent('Cancelled — partial output kept');
      expect(screen.getByRole('button', { name: 'Resume' })).toBeInTheDocument();
      expect(snapshot).toHaveBeenCalledTimes(1);

      await act(async () => {
        snap.resolve(null);
        await flush();
      });
      expect(log().textContent).toBe('restored output');
    });

    it('does not call snapshot when nothing is stored', () => {
      const { snapshot } = setup();
      expect(snapshot).not.toHaveBeenCalled();
      expect(status()).toHaveTextContent('Idle');
    });

    it('reconciles with the server snapshot: longer output for the same run id replaces the stored output', async () => {
      const snap = deferred<RunSnapshot | null>();
      const storage = createFakeStorage({
        [KEY]: JSON.stringify({ runId: 'run-9', output: 'abc', status: 'cancelled' }),
      });
      setup({ storage, snapshot: () => snap.promise });

      await act(async () => {
        snap.resolve({ runId: 'run-9', output: 'abcdef', status: 'cancelled' });
        await flush();
      });
      expect(log().textContent).toBe('abcdef');
      expect(status()).toHaveTextContent('Cancelled — partial output kept');
      expect(stored(storage)).toEqual({ runId: 'run-9', output: 'abcdef', status: 'cancelled' });
    });

    it('reconciles status: a snapshot that says finished marks the restored run Finished', async () => {
      const storage = createFakeStorage({
        [KEY]: JSON.stringify({ runId: 'run-9', output: 'abc', status: 'running' }),
      });
      const snapshot = jest.fn(async (): Promise<RunSnapshot | null> => ({
        runId: 'run-9',
        output: 'abc',
        status: 'finished',
      }));
      setup({ storage, snapshot });

      await act(async () => {
        await flush();
      });
      expect(status()).toHaveTextContent('Finished');
      expect(log().textContent).toBe('abc');
      expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument();
    });

    it('ignores a snapshot for a different run id or with shorter output', async () => {
      const snap = deferred<RunSnapshot | null>();
      const storage = createFakeStorage({
        [KEY]: JSON.stringify({ runId: 'run-9', output: 'abc', status: 'cancelled' }),
      });
      setup({ storage, snapshot: () => snap.promise });

      await act(async () => {
        snap.resolve({ runId: 'run-OTHER', output: 'zzzzzzzz', status: 'finished' });
        await flush();
      });
      expect(log().textContent).toBe('abc');
      expect(status()).toHaveTextContent('Cancelled — partial output kept');
    });

    it('a snapshot that resolves after the user already started a new run does not clobber it', async () => {
      const snap = deferred<RunSnapshot | null>();
      const storage = createFakeStorage({
        [KEY]: JSON.stringify({ runId: 'run-9', output: 'abc', status: 'cancelled' }),
      });
      const { user, sources } = setup({ storage, snapshot: () => snap.promise });

      await user.click(screen.getByRole('button', { name: 'Resume' }));
      await emit(sources[0], output('fresh'));
      expect(log().textContent).toBe('fresh');

      await act(async () => {
        snap.resolve({ runId: 'run-9', output: 'abcdefgh', status: 'finished' });
        await flush();
      });
      expect(log().textContent).toBe('fresh');
      expect(status()).toHaveTextContent('Running');
      expect(stored(storage)).toEqual({ runId: 'run-1', output: 'fresh', status: 'running' });
    });
  });

  describe('errors and unmount', () => {
    it('a stream that throws mid-run keeps the partial output, shows the error in an alert, and offers Resume', async () => {
      const { user, sources } = setup();
      await user.click(screen.getByRole('button', { name: 'Start' }));
      await emit(sources[0], output('40/120\n'));

      await act(async () => {
        sources[0].fail(new Error('upstream connection reset'));
        await flush();
      });

      expect(status()).toHaveTextContent('Cancelled — partial output kept');
      expect(screen.getByRole('alert')).toHaveTextContent('upstream connection reset');
      expect(log().textContent).toBe('40/120\n');
      expect(screen.getByRole('button', { name: 'Resume' })).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Resume' }));
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('unmount aborts the signal; late events, a late throw and a late snapshot cause no errors', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const snap = deferred<RunSnapshot | null>();
      const storage = createFakeStorage({
        [KEY]: JSON.stringify({ runId: 'run-9', output: 'abc', status: 'cancelled' }),
      });
      const { user, sources, signals, unmount } = setup({ storage, snapshot: () => snap.promise });
      await user.click(screen.getByRole('button', { name: 'Resume' }));
      await emit(sources[0], output('a'));

      unmount();
      expect(signals[0].aborted).toBe(true);

      await emit(sources[0], output('late'), finished());
      await act(async () => {
        sources[0].fail(new Error('late failure'));
        snap.resolve({ runId: 'run-1', output: 'aaaa', status: 'finished' });
        await flush();
      });

      expect(stored(storage)).toEqual({ runId: 'run-1', output: 'a', status: 'running' });
      expect(errorSpy).not.toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });
});
